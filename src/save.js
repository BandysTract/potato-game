// One local save slot: explicit snapshots, model-mirroring validation, and an IndexedDB coordinator.
import { BOUNDS, CREATURES, FAIRIES, HOUSE_BOUNDS, HOUSE_OBSTACLES, HOUSE_TARGETS, OBSTACLES, POTATOES, SONGS, SONG_SITES } from './data.js';
import { PLAYER_RADIUS } from './game.js';
import { QUIZZES, QUIZ_IDS, quizAnimal } from './quizzes.js';

export const SAVE_DB = 'pec-adventure';
export const SAVE_DB_VERSION = 1;
export const SAVE_STORE = 'walks';
export const SAVE_KEY = 'current';
export const SAVE_FORMAT = 1;
export const MAX_SAVE_BYTES = 65536;

const CHECKPOINTS = ['forest', 'house', 'supper'];
const MODES = ['unclaimed', 'normal', 'study', 'unsaved'];
const PAYLOAD_KEYS = ['format', 'revision', 'checkpoint', 'player', 'potatoes', 'tears', 'learnedSongs', 'restoredSites',
  'houseStep', 'dialogueNext', 'quizCompleted', 'talked', 'percyPets', 'preferences'];
const PLAYER_KEYS = ['x', 'z', 'facing', 'direction'];
const PREFERENCE_KEYS = ['language', 'sound', 'guidance'];
const ANIMALS = CREATURES.map(({ id }) => id);
const POTATO_IDS = POTATOES.map(({ id }) => id);
const FAIRY_IDS = FAIRIES.map(({ id }) => id);
const SONG_IDS = SONGS.map(({ id }) => id);
const SITE_IDS = SONG_SITES.map(({ id }) => id);
const LAST_HOUSE_STEP = HOUSE_TARGETS.length - 1;
// Matches the movement tests: projection onto an obstacle edge can land a rounding error inside it.
const EDGE_TOLERANCE = 1e-9;
const OVERSIZE = Symbol('oversize');
const encoder = new TextEncoder();

const byteLength = (text) => encoder.encode(text).length;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasExactKeys = (value, keys) => {
  const own = Object.keys(value);
  return own.length === keys.length && keys.every(key => Object.hasOwn(value, key));
};
const isIntegerIn = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const safely = (read) => { try { return read(); } catch { return undefined; } };
const nameOf = (error) => safely(() => error?.name) ?? null;
const classify = (errorName) => errorName === 'QuotaExceededError' ? 'quota' : 'abort';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function createSnapshot(game, preferences, revision) {
  const { player } = game;
  return {
    format: SAVE_FORMAT,
    revision,
    checkpoint: game.phase === 'won' ? 'supper' : game.scene === 'house' ? 'house' : 'forest',
    player: { x: player.x, z: player.z, facing: player.facing, direction: player.direction },
    potatoes: [...game.potatoes],
    tears: [...game.tears],
    learnedSongs: [...game.learnedSongs],
    restoredSites: [...game.restoredSites],
    houseStep: game.houseStep,
    dialogueNext: Object.fromEntries(ANIMALS.map(id => [id, game.dialogueNext[id]])),
    quizCompleted: [...game.quizCompleted],
    talked: [...game.talked],
    percyPets: game.percyPets,
    preferences: { language: preferences.language, sound: preferences.sound, guidance: preferences.guidance },
  };
}

export function encodeSnapshot(payload) {
  const raw = JSON.stringify(payload);
  if (typeof raw !== 'string') throw new TypeError('A save payload must encode to JSON text.');
  if (byteLength(raw) > MAX_SAVE_BYTES) throw new RangeError(`The save is larger than ${MAX_SAVE_BYTES} bytes.`);
  return raw;
}

export function newRevision(random = Math.random) {
  const bytes = new Uint8Array(9);
  let filled = false;
  try {
    if (typeof globalThis.crypto?.getRandomValues === 'function') { globalThis.crypto.getRandomValues(bytes); filled = true; }
  } catch { filled = false; }
  if (!filled) for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Number(random()) * 256) & 255;
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function decodeRecord(value) {
  if (value === undefined) return { status: 'empty' };
  if (typeof value !== 'string') return { status: 'unsupported' };
  if (byteLength(value) > MAX_SAVE_BYTES) return { status: 'invalid', raw: value };
  let payload;
  try { payload = JSON.parse(value); } catch { return { status: 'invalid', raw: value }; }
  if (validatePayload(payload) !== true) return { status: 'invalid', raw: value };
  return { status: 'valid', raw: value, payload };
}

function idListProblem(list, allowed) {
  if (!Array.isArray(list)) return 'is not a list';
  const seen = new Set();
  for (let index = 0; index < list.length; index++) {
    const id = list[index];
    if (typeof id !== 'string' || !allowed.includes(id)) return 'has an unknown id';
    if (seen.has(id)) return 'has a duplicate';
    seen.add(id);
  }
  return null;
}

// Mirrors movePlayer: the same inset bounds and obstacle radii, with rounding tolerance at an edge.
function positionClear({ x, z }, indoors) {
  const bounds = indoors ? HOUSE_BOUNDS : BOUNDS;
  const obstacles = indoors ? HOUSE_OBSTACLES : OBSTACLES;
  if (x < bounds.minX + PLAYER_RADIUS || x > bounds.maxX - PLAYER_RADIUS
    || z < bounds.minZ + PLAYER_RADIUS || z > bounds.maxZ - PLAYER_RADIUS) return false;
  return obstacles.every(obstacle => Math.hypot(x - obstacle.x, z - obstacle.z) >= obstacle.radius + PLAYER_RADIUS - EDGE_TOLERANCE);
}

function payloadProblem(payload) {
  if (!isRecord(payload) || !hasExactKeys(payload, PAYLOAD_KEYS)) return 'unexpected fields';
  if (payload.format !== SAVE_FORMAT) return 'unknown format';
  if (typeof payload.revision !== 'string' || !payload.revision) return 'missing revision';
  if (!CHECKPOINTS.includes(payload.checkpoint)) return 'unknown checkpoint';
  for (const [key, allowed] of [['potatoes', POTATO_IDS], ['tears', FAIRY_IDS], ['learnedSongs', SONG_IDS],
    ['restoredSites', SITE_IDS], ['quizCompleted', QUIZ_IDS], ['talked', ANIMALS]]) {
    const problem = idListProblem(payload[key], allowed);
    if (problem) return `${key} ${problem}`;
  }
  if (!isIntegerIn(payload.houseStep, 0, LAST_HOUSE_STEP)) return 'houseStep out of range';
  const next = payload.dialogueNext;
  if (!isRecord(next) || !hasExactKeys(next, ANIMALS)
    || ANIMALS.some(id => !isIntegerIn(next[id], 0, QUIZZES[id].length - 1))) return 'dialogueNext out of range';
  if (!Number.isSafeInteger(payload.percyPets) || payload.percyPets < 0) return 'percyPets out of range';
  const preferences = payload.preferences;
  if (!isRecord(preferences) || !hasExactKeys(preferences, PREFERENCE_KEYS) || !['cs', 'en'].includes(preferences.language)
    || typeof preferences.sound !== 'boolean' || typeof preferences.guidance !== 'boolean') return 'invalid preferences';
  const player = payload.player;
  if (!isRecord(player) || !hasExactKeys(player, PLAYER_KEYS) || !Number.isFinite(player.x) || !Number.isFinite(player.z)
    || (player.facing !== 1 && player.facing !== -1) || !isIntegerIn(player.direction, 0, 3)) return 'invalid player';

  // Cross-field rules follow completeSong, potatoAvailable, and the home gate, not the guidance text.
  const has = (list, id) => payload[list].includes(id);
  for (const song of SONGS) if (has('learnedSongs', song.id) !== has('tears', song.fairyId)) return 'tear and song differ';
  for (const site of SONG_SITES) {
    const restored = has('restoredSites', site.id);
    if (site.potatoId && has('potatoes', site.potatoId) && !restored) return 'locked potato collected';
    if (restored && !has('learnedSongs', site.songId)) return 'restored without its song';
    if (restored && site.id === 'cottage' && !FAIRY_IDS.every(id => has('tears', id))) return 'cottage restored without three tears';
  }
  const giftsReady = POTATO_IDS.every(id => has('potatoes', id)) && FAIRY_IDS.every(id => has('tears', id))
    && SITE_IDS.every(id => has('restoredSites', id));
  if (payload.checkpoint !== 'forest' && !giftsReady) return 'house entered without every gift';
  if (payload.checkpoint === 'forest' && payload.houseStep !== 0) return 'forest with household progress';
  if (payload.checkpoint === 'supper' && payload.houseStep !== LAST_HOUSE_STEP) return 'supper before serving';
  const quizAnimals = new Set(payload.quizCompleted.map(quizAnimal));
  if (quizAnimals.size !== payload.talked.length || payload.talked.some(id => !quizAnimals.has(id))) return 'talked differs from quizzes';
  // Supper restores at the serving spot, so only its finiteness matters.
  if (payload.checkpoint !== 'supper' && !positionClear(player, payload.checkpoint === 'house')) return 'blocked position';
  return null;
}

export function validatePayload(payload) {
  try { return payloadProblem(payload) ?? true; } catch { return 'unreadable payload'; }
}

export function restoreGame(payload, createGame) {
  const verdict = validatePayload(payload);
  if (verdict !== true) throw new TypeError(`The saved walk is invalid: ${verdict}.`);
  const game = createGame(payload.preferences.language);
  const supper = payload.checkpoint === 'supper';
  const spot = supper ? HOUSE_TARGETS.find(target => target.id === 'serve') : payload.player;
  game.phase = supper ? 'won' : 'playing';
  game.ending = null;
  game.scene = payload.checkpoint === 'forest' ? 'outdoors' : 'house';
  game.player = { x: spot.x, z: spot.z, facing: payload.player.facing, direction: payload.player.direction, moving: false };
  game.potatoes = [...payload.potatoes];
  game.tears = [...payload.tears];
  game.learnedSongs = [...payload.learnedSongs];
  game.restoredSites = [...payload.restoredSites];
  game.gardenWatered = payload.restoredSites.includes('cottage');
  game.houseStep = payload.houseStep;
  game.dialogueNext = Object.fromEntries(ANIMALS.map(id => [id, payload.dialogueNext[id]]));
  game.quizCompleted = [...payload.quizCompleted];
  game.talked = [...payload.talked];
  game.percyPets = payload.percyPets;
  return game;
}

// Owns the connection, write authority, coalescing, and the conflict and failure latches.
// Public methods never throw, and their promises always resolve.
export function createSaveStore(options = {}) {
  const settings = isRecord(options) ? options : {};
  const onChange = typeof settings.onChange === 'function' ? settings.onChange : () => {};
  const random = typeof settings.random === 'function' ? settings.random : Math.random;
  const state = {
    read: 'idle', available: true, reason: null, failure: null, conflict: false, slot: { status: 'unknown' },
    knownCommitted: null, mode: 'unclaimed', session: 0, saved: false, busy: false,
  };
  let live = true; // false after dispose
  let ended = false; // storage stays unavailable for the visit
  let abandoned = false;
  let generation = 0; // storage-operation generation; old callbacks compare against it
  let db = null;
  let expected = null; // the exact raw string the current normal session continues from
  let inflight = null; // at most one transaction this store started
  let pending = null; // at most one latest checkpoint waiting for the in-flight one
  let startPromise = null;
  let resolveStart = () => {};
  let queued = 0; // busy operations: prepareReplacement, replace, settle
  let replacing = 0; // prepareReplacement and replace calls in progress
  let preparePromise = null;
  let lane = Promise.resolve();
  let lastNotice = null;

  const publicState = () => {
    const slot = { status: state.slot.status };
    if (Object.hasOwn(state.slot, 'raw')) slot.raw = state.slot.raw;
    if (Object.hasOwn(state.slot, 'payload')) slot.payload = state.slot.payload;
    return { ...state, slot };
  };
  const noticeKey = () => JSON.stringify([state.read, state.available, state.reason, state.failure, state.conflict,
    state.slot.status, state.slot.raw ?? null, state.knownCommitted, state.mode, state.session, state.saved, state.busy]);
  lastNotice = noticeKey();

  function notify() {
    if (!live) return;
    const key = noticeKey();
    if (key === lastNotice) return;
    lastNotice = key;
    try { onChange(); } catch (error) { console.error(error); }
  }

  function slotFrom(value) {
    const slot = decodeRecord(value);
    if (slot.payload) deepFreeze(slot.payload);
    return slot;
  }

  function closeQuietly(connection) {
    if (!connection) return;
    try { connection.onclose = null; connection.onversionchange = null; } catch { /* best effort */ }
    try { connection.close(); } catch { /* best effort */ }
  }

  // Shared by failure, opt-out, and disposal: nothing old may act after this.
  function endStorage() {
    ended = true;
    state.available = false;
    generation += 1;
    pending = null;
    const record = inflight;
    inflight = null;
    if (record) {
      if (!record.cause) record.cause = 'ended';
      try { record.tx.abort(); } catch { /* already committing or closed */ }
      record.resolveDone(undefined);
    }
    closeQuietly(db);
    db = null;
    if (state.read === 'pending') state.read = 'settled';
    resolveStart();
  }

  function fail(cause) {
    if (!live || ended) return;
    state.reason = 'failed';
    state.failure = cause;
    endStorage();
    notify();
  }

  // Abandoned work or a lost connection cancels; any other storage failure fails.
  const endedOutcome = () => (!live || abandoned || state.failure === 'closed' || state.failure === 'versionchange') ? 'cancelled' : 'failed';

  function abortOnPurpose(record, cause) {
    const previous = record.cause;
    if (!record.cause) record.cause = cause;
    try { record.tx.abort(); } catch (error) {
      if (nameOf(error) !== 'InvalidStateError') { fail('exception'); return; }
      // The abort didn't happen: the transaction may already be committing, so its
      // own terminal event decides. A later abort we didn't cause is a failure.
      record.cause = previous;
    }
  }

  function latchConflict(value) {
    state.conflict = true;
    pending = null;
    state.slot = slotFrom(value);
  }

  function onTerminal(record, type) {
    if (record.terminal) return;
    record.terminal = true;
    if (record.generation !== generation || !live) return;
    if (inflight === record) inflight = null;
    let errorName = record.errorName;
    if (type === 'abort') errorName = nameOf(safely(() => record.tx.error)) ?? errorName;
    let result;
    try { result = record.finish(record, type, errorName); } catch { fail('exception'); }
    record.resolveDone(result);
    pump();
    notify();
  }

  // One transaction over `walks` with a single get of the slot. Returns null after a synchronous failure.
  function openTransaction(kind, mode, handlers) {
    if (!live || ended || !db) return null;
    const record = { kind, generation, session: state.session, raw: null, cause: null, terminal: false, tx: null,
      value: undefined, gotValue: false, putIssued: false, errorName: null, onValue: null, finish: () => undefined, ...handlers };
    record.done = new Promise(resolve => { record.resolveDone = resolve; });
    try { record.tx = db.transaction(SAVE_STORE, mode); } catch { fail('exception'); return null; }
    inflight = record;
    try {
      const tx = record.tx;
      tx.oncomplete = () => onTerminal(record, 'complete');
      tx.onabort = () => onTerminal(record, 'abort');
      tx.onerror = (event) => { if (!record.errorName) record.errorName = nameOf(safely(() => event?.target?.error)); };
      const objectStore = tx.objectStore(SAVE_STORE);
      const request = objectStore.get(SAVE_KEY);
      request.onsuccess = () => {
        if (record.generation !== generation || record.terminal || record.cause) return;
        try {
          record.value = request.result;
          record.gotValue = true;
          record.onValue?.(record, objectStore);
        } catch { fail('exception'); }
        notify();
      };
    } catch { fail('exception'); return null; }
    return record;
  }

  function putRecord(record, objectStore) {
    try { objectStore.put(record.raw, SAVE_KEY); record.putIssued = true; } catch { fail('exception'); }
  }

  function readSlotFinish(record, type, errorName) {
    if (type !== 'complete' || !record.gotValue) { fail(classify(errorName)); return undefined; }
    state.slot = slotFrom(record.value);
    state.knownCommitted = state.slot.status === 'valid' ? state.slot.raw : null;
    return state.slot;
  }

  function startCheckpoint(job) {
    openTransaction('checkpoint', 'readwrite', {
      session: job.session,
      raw: job.raw,
      onValue(record, objectStore) {
        if (record.session !== state.session || state.mode !== 'normal' || state.conflict) { abortOnPurpose(record, 'session'); return; }
        // A missing or non-string record is a mismatch too; the comparison is exact.
        if (typeof record.value !== 'string' || record.value !== expected) {
          record.cause = 'conflict';
          latchConflict(record.value);
          abortOnPurpose(record, 'conflict');
          return;
        }
        putRecord(record, objectStore);
      },
      finish(record, type, errorName) {
        if (type === 'complete') {
          if (!record.putIssued) return;
          state.knownCommitted = record.raw;
          state.slot = slotFrom(record.raw);
          // An older session's late commit refreshes the known record only.
          if (!record.cause && record.session === state.session && state.mode === 'normal') { expected = record.raw; state.saved = true; }
          return;
        }
        if (!record.cause) fail(classify(errorName));
      },
    });
  }

  function pump() {
    if (inflight || !pending || !live || ended || !db) return;
    const job = pending;
    pending = null;
    if (job.session !== state.session || state.mode !== 'normal' || state.conflict || replacing) return;
    startCheckpoint(job);
  }

  // Encodes with a fresh revision and checks the decoded bytes, so nothing unloadable is written.
  function prepareRaw(payload) {
    if (!isRecord(payload)) return null;
    let raw;
    try { raw = encodeSnapshot({ ...payload, revision: newRevision(random) }); } catch (error) {
      return error instanceof RangeError ? OVERSIZE : null;
    }
    return decodeRecord(raw).status === 'valid' ? raw : null;
  }

  async function drainInflight() {
    const started = generation;
    while (inflight && generation === started && live) await inflight.done;
    return generation === started && live && !ended;
  }

  function exclusive(kind, task, fallback) {
    queued += 1;
    if (kind !== 'settle') replacing += 1;
    state.busy = true;
    notify();
    const run = lane.then(async () => {
      if (!live) return fallback();
      try { return await task(); } catch { fail('exception'); return fallback(); }
    }).then(result => result, () => fallback());
    const done = run.then(result => {
      queued -= 1;
      if (kind !== 'settle') replacing -= 1;
      state.busy = queued > 0;
      notify();
      return result;
    });
    lane = done.then(() => undefined, () => undefined);
    return done;
  }

  function adopt(connection) {
    db = connection;
    try {
      connection.onclose = () => { if (db === connection && live && !ended) fail('closed'); };
      connection.onversionchange = () => {
        if (db === connection && live && !ended) fail('versionchange');
        else closeQuietly(connection);
      };
    } catch { fail('exception'); return; }
    let hasStore;
    try { hasStore = connection.objectStoreNames.contains(SAVE_STORE); } catch { fail('exception'); return; }
    if (!hasStore) { fail('open'); return; }
    openTransaction('read', 'readonly', {
      finish(record, type, errorName) {
        if (!readSlotFinish(record, type, errorName)) return;
        state.read = 'settled';
        resolveStart();
      },
    });
  }

  function openDatabase() {
    const opened = generation;
    const stale = () => opened !== generation || !live || ended;
    let factory;
    try { factory = settings.indexedDB === undefined ? globalThis.indexedDB : settings.indexedDB; } catch { fail('exception'); return; }
    let open;
    try { open = factory ? factory.open : undefined; } catch { fail('exception'); return; }
    if (typeof open !== 'function') { fail('unsupported-api'); return; }
    let request;
    try { request = factory.open(SAVE_DB, SAVE_DB_VERSION); } catch { fail('exception'); return; }
    try {
      request.onupgradeneeded = (event) => {
        // Create the store even after an opt-out, so version 1 never exists without it.
        try { if (event?.oldVersion === 0) request.result.createObjectStore(SAVE_STORE); } catch { if (!stale()) fail('exception'); }
      };
      request.onblocked = () => { if (!stale()) fail('blocked'); };
      request.onerror = (event) => {
        try { event?.preventDefault?.(); } catch { /* nothing to prevent */ }
        if (!stale()) fail(nameOf(safely(() => request.error)) === 'VersionError' ? 'version' : 'open');
      };
      request.onsuccess = () => {
        const connection = safely(() => request.result);
        if (stale()) { closeQuietly(connection); return; }
        if (!connection) { fail('exception'); return; }
        adopt(connection);
        notify();
      };
    } catch { fail('exception'); }
  }

  const store = {
    get state() { return publicState(); },

    start() {
      if (startPromise) return startPromise;
      startPromise = new Promise(resolve => { resolveStart = resolve; });
      try {
        if (!live || ended) {
          if (live && state.read !== 'settled') { state.read = 'settled'; notify(); }
          resolveStart();
          return startPromise;
        }
        state.read = 'pending';
        notify();
        if (!ended) openDatabase();
      } catch { fail('exception'); }
      return startPromise;
    },

    setMode(mode, expectedRaw = null) {
      try {
        if (!live || !MODES.includes(mode) || (mode === 'normal' && typeof expectedRaw !== 'string')) return false;
        state.session += 1;
        state.mode = mode;
        state.saved = mode === 'normal';
        expected = mode === 'normal' ? expectedRaw : null;
        pending = null;
        const record = inflight;
        if (record && !record.terminal && !record.cause && (record.kind === 'checkpoint' || record.kind === 'replace')) {
          abortOnPurpose(record, record.kind === 'replace' ? 'cancelled' : 'session');
        }
        notify();
        return true;
      } catch { fail('exception'); return false; }
    },

    checkpoint(payload) {
      try {
        if (!live || ended || !db || state.read !== 'settled' || state.mode !== 'normal' || state.conflict || replacing) return false;
        const raw = prepareRaw(payload);
        if (raw === OVERSIZE) { fail('oversize'); return false; }
        if (raw === null) return false;
        pending = { raw, session: state.session };
        pump();
        notify();
        return !ended;
      } catch { fail('exception'); return false; }
    },

    prepareReplacement() {
      if (!live) return Promise.resolve({ status: 'unavailable' });
      if (preparePromise) return preparePromise;
      const unavailable = () => ({ status: 'unavailable' });
      const promise = exclusive('prepare', async () => {
        if (state.read === 'idle') store.start();
        if (state.read === 'pending') await startPromise;
        if (!live || ended || !db) return unavailable();
        pending = null;
        if (!(await drainInflight()) || !db) return unavailable();
        const record = openTransaction('read', 'readonly', { finish: readSlotFinish });
        if (!record) return unavailable();
        const slot = await record.done;
        if (!slot) return unavailable();
        return slot.status === 'valid' || slot.status === 'invalid' ? { status: slot.status, raw: slot.raw } : { status: slot.status };
      }, unavailable);
      preparePromise = promise;
      promise.then(() => { if (preparePromise === promise) preparePromise = null; });
      return promise;
    },

    replace(approved, payload) {
      if (!live || queued > 0) return Promise.resolve('cancelled');
      const session = state.session;
      return exclusive('replace', async () => {
        const status = safely(() => approved.status);
        const approvedRaw = safely(() => approved.raw);
        if (!['empty', 'valid', 'invalid'].includes(status) || (status !== 'empty' && typeof approvedRaw !== 'string')) return 'cancelled';
        if (state.read === 'pending') await startPromise;
        if (!live || session !== state.session) return 'cancelled';
        if (ended || !db) return endedOutcome();
        const raw = prepareRaw(payload);
        if (raw === OVERSIZE) { fail('oversize'); return 'failed'; }
        if (raw === null) return 'failed';
        pending = null;
        if (!(await drainInflight()) || !db) return endedOutcome();
        if (session !== state.session) return 'cancelled';
        const record = openTransaction('replace', 'readwrite', {
          raw,
          onValue(record, objectStore) {
            if (session !== state.session) { abortOnPurpose(record, 'cancelled'); return; }
            const matches = status === 'empty' ? record.value === undefined : record.value === approvedRaw;
            if (!matches) {
              record.cause = 'conflict';
              latchConflict(record.value);
              abortOnPurpose(record, 'conflict');
              return;
            }
            putRecord(record, objectStore);
          },
          finish(record, type, errorName) {
            if (type === 'complete') {
              if (!record.putIssued) return 'cancelled';
              state.knownCommitted = raw;
              state.slot = slotFrom(raw);
              if (record.cause || session !== state.session) return 'cancelled';
              state.session += 1;
              state.mode = 'normal';
              state.conflict = false;
              state.saved = true;
              expected = raw;
              pending = null;
              return 'committed';
            }
            if (record.cause === 'conflict') return 'conflict';
            if (record.cause) return 'cancelled';
            fail(classify(errorName));
            return 'failed';
          },
        });
        if (!record) return endedOutcome();
        return (await record.done) ?? endedOutcome();
      }, () => 'cancelled');
    },

    settle() {
      if (!live) return Promise.resolve(false);
      return exclusive('settle', async () => {
        if (state.read === 'pending') await startPromise;
        if (ended) return false;
        return drainInflight();
      }, () => false);
    },

    abandon() {
      try {
        if (!live || abandoned) return;
        abandoned = true;
        state.reason = 'chosen-unsaved';
        endStorage();
        notify();
      } catch { /* the opt-out already holds */ }
    },

    dispose() {
      if (!live) return;
      try { endStorage(); } catch { /* best effort */ }
      live = false;
    },
  };
  return store;
}
