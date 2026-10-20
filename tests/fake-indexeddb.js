// A small in-memory IndexedDB substitute for save tests. It models the parts the save store relies on:
// versioned opening, serialized read/write transactions, asynchronous requests, auto-commit,
// complete/abort/error events, and abort() refusing once a commit has begun. It is not a full IndexedDB,
// and it cannot qualify real cross-tab isolation or browser reopen behavior.

const domError = (name, message = name) => new DOMException(message, name);

export function createFakeIndexedDB() {
  const databases = new Map();
  const log = [];
  const handlerErrors = [];
  const throwNext = new Map(); // operation -> error name, thrown synchronously once
  const commitPlans = []; // { error?, hold? } applied to the next commits in order
  const openPlans = []; // { error?, hold?, blocked? } applied to the next opens in order
  let scheduled = 0;
  let nextConnectionId = 1;

  function task(callback) {
    scheduled += 1;
    setImmediate(() => { scheduled -= 1; callback(); });
  }

  function maybeThrow(operation) {
    if (!throwNext.has(operation)) return;
    const name = throwNext.get(operation);
    throwNext.delete(operation);
    log.push({ op: `throw:${operation}`, name });
    throw domError(name);
  }

  function fire(target, type, init = {}, path = []) {
    const event = {
      type, target, bubbles: path.length > 0, defaultPrevented: false, propagationStopped: false, ...init,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; },
    };
    for (const node of [target, ...path]) {
      if (!node) continue;
      event.currentTarget = node;
      const handler = node[`on${type}`];
      if (typeof handler === 'function') {
        try { handler.call(node, event); } catch (error) { handlerErrors.push(error); event.handlerThrew = true; }
      }
      if (event.propagationStopped) break;
    }
    return event;
  }

  function databaseFor(name) {
    let database = databases.get(name);
    if (!database) {
      database = { name, version: 0, stores: new Map(), connections: new Set(), transactions: [], waiting: [] };
      databases.set(name, database);
    }
    return database;
  }

  function schedule(database) {
    database.transactions.forEach((tx, index) => {
      if (tx.started || tx.state === 'finished') return;
      const earlier = database.transactions.slice(0, index);
      const blocked = tx.mode === 'readwrite' ? earlier.length > 0 : earlier.some(other => other.mode === 'readwrite');
      if (!blocked) { tx.started = true; tx._advance(); }
    });
  }

  function finishTransaction(tx) {
    const database = tx._database;
    database.transactions = database.transactions.filter(other => other !== tx);
    schedule(database);
    const connection = tx.db;
    if (connection.closePending && !connection.closed && !database.transactions.some(other => other.db === connection)) markClosed(connection);
  }

  function markClosed(connection) {
    connection.closed = true;
    connection._database.connections.delete(connection);
    log.push({ op: 'closed', connection: connection.id });
    const database = connection._database;
    const waiting = database.waiting;
    database.waiting = [];
    for (const resume of waiting) resume();
  }

  class FakeRequest {
    constructor(source = null, transaction = null) {
      this.source = source;
      this.transaction = transaction;
      this.readyState = 'pending';
      this._result = undefined;
      this._error = null;
      this.onsuccess = null;
      this.onerror = null;
    }
    get result() { if (this.readyState !== 'done') throw domError('InvalidStateError'); return this._result; }
    get error() { if (this.readyState !== 'done') throw domError('InvalidStateError'); return this._error; }
  }

  class FakeOpenRequest extends FakeRequest {
    constructor() { super(); this.onupgradeneeded = null; this.onblocked = null; }
  }

  class FakeObjectStore {
    constructor(tx, name) { this.transaction = tx; this.name = name; }
    get(key) {
      maybeThrow('get');
      const tx = this.transaction;
      if (tx.state !== 'active') throw domError('TransactionInactiveError');
      const request = new FakeRequest(this, tx);
      log.push({ op: 'get', key, connection: tx.db.id, mode: tx.mode });
      tx._place(request, () => {
        const staged = tx._writes.get(key);
        const value = staged ? staged.value : tx._database.stores.get(this.name).get(key);
        return value === undefined ? undefined : structuredClone(value);
      });
      return request;
    }
    put(value, key) {
      maybeThrow('put');
      const tx = this.transaction;
      if (tx.state !== 'active') throw domError('TransactionInactiveError');
      if (tx.mode !== 'readwrite') throw domError('ReadOnlyError');
      const stored = structuredClone(value);
      const request = new FakeRequest(this, tx);
      log.push({ op: 'put', key, value: stored, connection: tx.db.id });
      tx._place(request, () => { tx._writes.set(key, { store: this.name, value: stored }); return key; });
      return request;
    }
  }

  class FakeTransaction {
    constructor(connection, scope, mode) {
      this.db = connection;
      this._database = connection._database;
      this.mode = mode;
      this.objectStoreNames = [...scope];
      this.error = null;
      this.state = 'active';
      this.started = false;
      this.aborted = false;
      this.oncomplete = null;
      this.onabort = null;
      this.onerror = null;
      this._requests = [];
      this._writes = new Map();
      this._busy = false;
      this._database.transactions.push(this);
      // A new transaction stays active until the task that created it ends.
      task(() => { if (this.state === 'active') { this.state = 'inactive'; this._advance(); } });
      schedule(this._database);
    }
    objectStore(name) {
      maybeThrow('objectStore');
      if (this.state === 'finished') throw domError('InvalidStateError');
      if (!this.objectStoreNames.includes(name)) throw domError('NotFoundError');
      return new FakeObjectStore(this, name);
    }
    abort() {
      maybeThrow('abort');
      if (this.state === 'committing' || this.state === 'finished') {
        log.push({ op: 'abort-refused', connection: this.db.id, state: this.state });
        throw domError('InvalidStateError');
      }
      log.push({ op: 'abort', connection: this.db.id, mode: this.mode });
      this._abort(null);
    }
    _place(request, operation) {
      request._operation = operation;
      this._requests.push(request);
      this._advance();
    }
    _advance() {
      if (!this.started || this._busy || this.state === 'committing' || this.state === 'finished') return;
      const request = this._requests.find(item => !item._processed);
      if (request) {
        request._processed = true;
        this._busy = true;
        task(() => { this._busy = false; this._execute(request); this._advance(); });
        return;
      }
      if (this.state === 'inactive') this._commit();
    }
    _execute(request) {
      if (this.state === 'finished') return;
      let result;
      try { result = request._operation(); } catch (error) {
        request.readyState = 'done';
        request._error = error;
        this.state = 'active';
        const event = fire(request, 'error', {}, [this, this.db]);
        if (this.state === 'active') this.state = 'inactive';
        if (!event.defaultPrevented && this.state !== 'finished') this._abort(error);
        return;
      }
      request.readyState = 'done';
      request._result = result;
      this.state = 'active';
      const event = fire(request, 'success');
      if (this.state === 'active') this.state = 'inactive';
      // As in browsers, an exception thrown by a success handler aborts the transaction.
      if (event.handlerThrew && this.state !== 'finished' && this.state !== 'committing') this._abort(domError('AbortError'));
    }
    _abort(error) {
      this.state = 'finished';
      this.aborted = true;
      this.error = error;
      this._writes.clear();
      for (const request of this._requests) {
        if (request.readyState === 'done') continue;
        request.readyState = 'done';
        request._result = undefined;
        request._error = domError('AbortError');
        task(() => fire(request, 'error', {}, [this, this.db]));
      }
      task(() => { fire(this, 'abort', {}, [this.db]); finishTransaction(this); });
    }
    _commit() {
      this.state = 'committing';
      const plan = commitPlans.length ? commitPlans.shift() : null;
      log.push({ op: 'commit-start', connection: this.db.id, mode: this.mode });
      const finish = () => {
        if (this.state !== 'committing') return;
        if (plan?.error) {
          this.state = 'finished';
          this.aborted = true;
          this.error = domError(plan.error);
          this._writes.clear();
          log.push({ op: 'commit-failed', name: plan.error, connection: this.db.id });
          task(() => { fire(this, 'abort', {}, [this.db]); finishTransaction(this); });
          return;
        }
        for (const [key, { store, value }] of this._writes) this._database.stores.get(store).set(key, value);
        this.state = 'finished';
        log.push({ op: 'committed', connection: this.db.id, mode: this.mode, writes: this._writes.size });
        task(() => { fire(this, 'complete'); finishTransaction(this); });
      };
      if (plan?.hold) { plan.hold.reached(); plan.hold.wait.then(() => task(finish)); } else task(finish);
    }
  }

  class FakeConnection {
    constructor(database, version) {
      this.id = nextConnectionId++;
      this._database = database;
      this.name = database.name;
      this.version = version;
      this.closed = false;
      this.closePending = false;
      this._upgrading = false;
      this.onclose = null;
      this.onversionchange = null;
      this.onerror = null;
      this.onabort = null;
      database.connections.add(this);
    }
    get objectStoreNames() {
      const names = [...this._database.stores.keys()];
      return { length: names.length, contains: name => names.includes(name), item: index => names[index] ?? null };
    }
    createObjectStore(name) {
      if (!this._upgrading) throw domError('InvalidStateError');
      if (this._database.stores.has(name)) throw domError('ConstraintError');
      this._database.stores.set(name, new Map());
      log.push({ op: 'createObjectStore', name, connection: this.id });
      return { name };
    }
    transaction(names, mode = 'readonly') {
      maybeThrow('transaction');
      if (this.closePending || this.closed || this._upgrading) throw domError('InvalidStateError');
      const scope = Array.isArray(names) ? names : [names];
      if (!scope.length || scope.some(name => !this._database.stores.has(name))) throw domError('NotFoundError');
      if (mode !== 'readonly' && mode !== 'readwrite') throw new TypeError(`Unsupported mode ${mode}`);
      log.push({ op: 'transaction', mode, connection: this.id });
      return new FakeTransaction(this, scope, mode);
    }
    close() {
      maybeThrow('close');
      if (this.closePending) return;
      this.closePending = true;
      log.push({ op: 'close', connection: this.id });
      if (!this._database.transactions.some(tx => tx.db === this)) markClosed(this);
    }
  }

  function upgrade(request, database, version) {
    const oldVersion = database.version;
    const connection = new FakeConnection(database, version);
    database.version = version;
    request.readyState = 'done';
    request._result = connection;
    connection._upgrading = true;
    log.push({ op: 'upgrade', name: database.name, oldVersion, newVersion: version, connection: connection.id });
    fire(request, 'upgradeneeded', { oldVersion, newVersion: version });
    connection._upgrading = false;
    task(() => fire(request, 'success'));
  }

  function processOpen(request, name, version, plan) {
    if (plan?.error) {
      request.readyState = 'done';
      request._error = domError(plan.error);
      log.push({ op: 'open-failed', name: plan.error });
      fire(request, 'error');
      return;
    }
    const database = databaseFor(name);
    const requested = version ?? Math.max(1, database.version);
    if (requested < database.version) {
      request.readyState = 'done';
      request._error = domError('VersionError');
      log.push({ op: 'open-failed', name: 'VersionError' });
      fire(request, 'error');
      return;
    }
    if (requested === database.version) {
      request.readyState = 'done';
      request._result = new FakeConnection(database, requested);
      log.push({ op: 'opened', name, version: requested, connection: request._result.id });
      fire(request, 'success');
      return;
    }
    const others = [...database.connections].filter(connection => !connection.closePending);
    for (const connection of others) fire(connection, 'versionchange', { oldVersion: database.version, newVersion: requested });
    const ready = () => [...database.connections].every(connection => connection.closed);
    if (ready()) { upgrade(request, database, requested); return; }
    if (others.some(connection => !connection.closePending)) fire(request, 'blocked', { oldVersion: database.version, newVersion: requested });
    const resume = () => { if (ready()) upgrade(request, database, requested); else database.waiting.push(resume); };
    database.waiting.push(resume);
  }

  const indexedDB = {
    open(name, version) {
      maybeThrow('open');
      if (version !== undefined && (!Number.isInteger(version) || version < 1)) throw new TypeError('Invalid version');
      const request = new FakeOpenRequest();
      log.push({ op: 'open', name, version });
      const plan = openPlans.length ? openPlans.shift() : null;
      const go = () => processOpen(request, name, version, plan);
      if (plan?.hold) {
        if (plan.blocked) task(() => fire(request, 'blocked', { oldVersion: 1, newVersion: version }));
        plan.hold.wait.then(() => task(go));
      } else task(go);
      return request;
    },
    deleteDatabase(name) {
      log.push({ op: 'deleteDatabase', name });
      throw new Error('The save store must never delete a database.');
    },
  };

  function hold() {
    let release, reached;
    const wait = new Promise(resolve => { release = resolve; });
    const reachedPromise = new Promise(resolve => { reached = resolve; });
    return { wait, release, reached, reachedPromise };
  }

  return {
    indexedDB,
    log,
    handlerErrors,
    count: (op, filter = {}) => log.filter(entry => entry.op === op && Object.entries(filter).every(([key, value]) => entry[key] === value)).length,
    // Seeds committed content as if an earlier visit had written it.
    seed(name, { version = 1, stores = { walks: {} } } = {}) {
      const database = databaseFor(name);
      database.version = version;
      for (const [store, records] of Object.entries(stores)) {
        database.stores.set(store, new Map(Object.entries(records).map(([key, value]) => [key, structuredClone(value)])));
      }
      return database;
    },
    value(key = 'current', name = 'pec-adventure', store = 'walks') {
      const value = databases.get(name)?.stores.get(store)?.get(key);
      return value === undefined ? undefined : structuredClone(value);
    },
    has(key = 'current', name = 'pec-adventure', store = 'walks') { return Boolean(databases.get(name)?.stores.get(store)?.has(key)); },
    database: (name = 'pec-adventure') => databases.get(name),
    connections: (name = 'pec-adventure') => [...(databases.get(name)?.connections ?? [])],
    allConnections: () => [...databases.values()].flatMap(database => [...database.connections]),
    throwNext(operation, name = 'UnknownError') { throwNext.set(operation, name); },
    failNextCommit(name) { commitPlans.push({ error: name }); },
    holdNextCommit() { const gate = hold(); commitPlans.push({ hold: gate }); return { release: gate.release, reached: gate.reachedPromise }; },
    failNextOpen(name) { openPlans.push({ error: name }); },
    holdNextOpen({ blocked = false } = {}) { const gate = hold(); openPlans.push({ hold: gate, blocked }); return { release: gate.release }; },
    // An abnormal close. By default it follows the specification: abort unfinished transactions, then fire close.
    forceClose(connection, { abortTransactions = true, closeFirst = false } = {}) {
      const database = connection._database;
      connection.closePending = true;
      log.push({ op: 'force-close', connection: connection.id });
      const fireClose = () => task(() => fire(connection, 'close'));
      if (closeFirst) fireClose();
      if (abortTransactions) {
        for (const tx of database.transactions.filter(item => item.db === connection && item.state !== 'finished')) {
          tx.state = 'inactive';
          tx._abort(domError('AbortError'));
        }
      }
      if (!closeFirst) fireClose();
      task(() => { if (!connection.closed && !database.transactions.some(tx => tx.db === connection)) markClosed(connection); });
    },
    // Waits until no fake task is queued. Held commits and opens stay parked until released.
    async idle() {
      for (let round = 0; round < 100000; round++) {
        await new Promise(resolve => setImmediate(resolve));
        if (scheduled === 0) {
          await new Promise(resolve => setImmediate(resolve));
          if (scheduled === 0) return;
        }
      }
      throw new Error('The fake IndexedDB never became idle.');
    },
  };
}
