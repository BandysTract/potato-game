import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { answerQuiz, createGame, openQuiz, startGame } from '../src/game.js';
import { QUIZZES, quizAnimal } from '../src/quizzes.js';
import { t } from '../src/i18n.js';
import { POTATOES, PRACTICE_SPOTS } from '../src/data.js';
import { createSnapshot, decodeRecord, encodeSnapshot } from '../src/save.js';
import { createFakeIndexedDB } from './fake-indexeddb.js';
import { entryPoint, jumpTo, walkAppTo } from './entry-harness.js';

// Design guards for the quiz panel. The panel is the only place that judges an answer, and its
// buttons are the only route a player's choice takes, so these run the real src/ui.js against a
// small DOM and send its clicks to the real model. Layout and real browser events are separate checks.
const uiUrl = new URL('../src/ui.js', import.meta.url);
const uiSource = readFileSync(uiUrl, 'utf8');
const IMPORT = /^import\s+(?:(\{[^}]*\}|\*\s+as\s+\w+)\s+from\s+)?'([^']+)';\n/gm;
const bindings = {};
for (const [, names, path] of uiSource.matchAll(IMPORT)) {
  if (!names) continue; // A stylesheet has no bindings.
  const module = await import(new URL(path, uiUrl));
  if (names.startsWith('*')) { bindings[names.split(/\s+/).at(-1)] = module; continue; }
  for (const entry of names.slice(1, -1).split(',').map(part => part.trim()).filter(Boolean)) {
    const [name, alias = name] = entry.split(/\s+as\s+/);
    bindings[alias] = module[name];
  }
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const kebab = key => key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
const document = { activeElement: null, hidden: false, querySelector: () => null, addEventListener() {} };
const window = { matchMedia: () => ({ matches: false }), addEventListener() {} };

// Splits on a separator outside brackets, parentheses, and quotes.
function split(text, separator) {
  const parts = [];
  let depth = 0, quoted = false, current = '';
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && '[('.includes(char)) depth++;
    else if (!quoted && '])'.includes(char)) depth--;
    if (!quoted && !depth && (separator === ' ' ? /\s/.test(char) : char === separator)) { parts.push(current); current = ''; }
    else current += char;
  }
  return [...parts, current].map(part => part.trim()).filter(Boolean);
}
// Tag, #id, .class, [attr], [attr="value"], and :not(...) compounds joined by descendant spaces or commas.
// Anything else fails loudly rather than matching nothing.
function compound(text) {
  const tests = [];
  const pattern = /([a-zA-Z][\w-]*|\*)|#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]|:not\(([^()]*)\)/y;
  for (let index = 0; index < text.length;) {
    pattern.lastIndex = index;
    const match = pattern.exec(text);
    if (!match) throw new Error(`The test DOM doesn’t support the selector “${text}”.`);
    index = pattern.lastIndex;
    const [, tag, id, name, attribute, value, not] = match;
    if (tag) tests.push(node => tag === '*' || node.tagName === tag.toUpperCase());
    else if (id) tests.push(node => node.getAttribute('id') === id);
    else if (name) tests.push(node => node.classList.contains(name));
    else if (attribute) tests.push(node => value === undefined ? node.getAttribute(attribute) !== null : node.getAttribute(attribute) === value);
    else { const inner = compound(not); tests.push(node => !inner(node)); }
  }
  return node => tests.every(check => check(node));
}
const compiled = new Map();
function matcher(selector) {
  if (!compiled.has(selector)) {
    const chains = split(selector, ',').map(part => split(part, ' ').map(compound));
    compiled.set(selector, node => chains.some(chain => {
      if (!chain.at(-1)(node)) return false;
      let index = chain.length - 2;
      for (let parent = node.parent; parent && index >= 0; parent = parent.parent) if (chain[index](parent)) index--;
      return index < 0;
    }));
  }
  return compiled.get(selector);
}

class Element {
  constructor(tag, attributes = {}) {
    this.tagName = tag.toUpperCase();
    this.attributes = new Map(Object.entries(attributes));
    this.classes = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
    this.attributes.delete('class');
    this.children = [];
    this.parent = null;
    this.listeners = new Map();
    this.style = {};
    this.textContent = '';
    this.firstChild = { textContent: '' };
    const classes = this.classes;
    this.classList = {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name),
      toggle: (name, force = !classes.has(name)) => { if (force) classes.add(name); else classes.delete(name); return force; },
    };
    this.dataset = new Proxy({}, {
      get: (_, key) => typeof key === 'string' ? this.attributes.get(`data-${kebab(key)}`) : undefined,
      set: (_, key, value) => { this.attributes.set(`data-${kebab(key)}`, String(value)); return true; },
    });
  }
  get hidden() { return this.attributes.has('hidden'); }
  set hidden(value) { this.toggleAttribute('hidden', Boolean(value)); }
  get disabled() { return this.attributes.has('disabled'); }
  set disabled(value) { this.toggleAttribute('disabled', Boolean(value)); }
  getAttribute(name) { return name === 'class' ? [...this.classes].join(' ') : this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  toggleAttribute(name, force = !this.attributes.has(name)) { if (force) this.attributes.set(name, ''); else this.attributes.delete(name); return force; }
  set innerHTML(html) {
    this.replaceChildren();
    const open = [this];
    for (const [, closing, tag, body] of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
      if (closing) {
        const at = open.findLastIndex(node => node.tagName === tag.toUpperCase());
        if (at > 0) open.length = at;
        continue;
      }
      const attributes = Object.fromEntries([...body.matchAll(/([^\s="'/]+)(?:="([^"]*)")?/g)].map(([, name, value]) => [name, value ?? '']));
      const node = new Element(tag, attributes);
      open.at(-1).append(node);
      if (!body.trimEnd().endsWith('/') && !VOID.has(tag.toLowerCase())) open.push(node);
    }
  }
  append(...nodes) { for (const node of nodes) { node.parent = this; this.children.push(node); } }
  replaceChildren() { for (const node of this.children) node.parent = null; this.children = []; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); this.parent = null; }
  querySelectorAll(selector) {
    const matches = matcher(selector), found = [];
    const walk = node => { for (const child of node.children) { if (matches(child)) found.push(child); walk(child); } };
    walk(this);
    return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  closest(selector) { const matches = matcher(selector); for (let node = this; node; node = node.parent) if (matches(node)) return node; return null; }
  contains(node) { for (let current = node; current; current = current.parent) if (current === this) return true; return false; }
  getClientRects() { return this.closest('[hidden]') ? [] : [{}]; }
  focus() { document.activeElement = this; }
  scrollIntoView() {}
  setPointerCapture() {}
  addEventListener(name, handler, options = {}) {
    const entries = this.listeners.get(name) || new Set();
    entries.add(handler);
    this.listeners.set(name, entries);
    options?.signal?.addEventListener('abort', () => entries.delete(handler), { once: true });
  }
  // A disabled button sends no click. An enabled one bubbles to the delegated listener.
  click() {
    if (this.disabled) return;
    const event = { type: 'click', target: this, isTrusted: true, preventDefault() {} };
    for (let node = this; node; node = node.parent) for (const handler of [...node.listeners.get('click') || []]) handler(event);
  }
}

const context = { window, document, AbortController, console, ...bindings };
runInNewContext(uiSource.replace(IMPORT, '').replace(/^export /gm, ''), context);
const { createUI } = context;
const ALL = Object.values(QUIZZES).flat();

// One open, unanswered quiz with the panel drawn the way main.js draws it.
function openPanel(quiz, language) {
  const animal = quizAnimal(quiz.id);
  const game = startGame(createGame(language, () => 0));
  game.dialogueNext[animal] = QUIZZES[animal].indexOf(quiz);
  assert.equal(openQuiz(game, animal), true);
  document.activeElement = null;
  const root = new Element('div', { id: 'ui' });
  const ui = createUI(root, (action, value) => { if (action === 'quizAnswer') answerQuiz(game, value?.optionId, value?.quizId); });
  const draw = () => ui.update(game, {
    overlay: 'dialogue', storage: {}, guidance: true, region: 'Cottage garden',
    dialogue: { creatureId: game.conversation, index: game.conversationIndex, choice: null, quiz: game.quizSession && { ...game.quizSession } },
  });
  draw();
  const buttons = () => root.querySelectorAll('.quiz-options button');
  return { game, root, draw, buttons };
}
const label = button => button.querySelector('[data-quiz-label]').textContent;
const tag = button => button.querySelector('[data-quiz-tag]').textContent;

test('each quiz shows its three answers in order, and a click on any button, including the third, records that answer', () => {
  // Rejects a panel with two answer buttons and a click route that admits only replies 0 and 1.
  for (const quiz of ALL) for (const [index, option] of quiz.options.entries()) {
    const panel = openPanel(quiz, 'en');
    const buttons = panel.buttons();
    assert.equal(buttons.length, quiz.options.length, `${quiz.id} shows every answer`);
    assert.deepEqual(buttons.map(label), quiz.options.map(item => item.en), `${quiz.id} keeps the content pack order`);
    buttons[index].click();
    assert.equal(panel.game.quizSession.answerId, option.id, `${quiz.id}: answer button ${index + 1} records ${option.id}`);
    panel.draw();
    assert.ok(panel.buttons().every(button => button.disabled), `${quiz.id}: the first answer is final`);
  }
});

test('the verdict and the correct-answer tag follow the answer key, never the option position', () => {
  // Rejects judging by position and content that always lists the correct answer first.
  assert.ok(ALL.some(quiz => quiz.options[0].id !== quiz.correctOptionId), 'The answer key must not always be the first option.');
  for (const language of ['en', 'cs']) for (const quiz of ALL) for (const chosen of quiz.options.keys()) {
    const panel = openPanel(quiz, language);
    panel.buttons()[chosen].click();
    panel.draw();
    const key = quiz.options.findIndex(option => option.id === quiz.correctOptionId);
    const buttons = panel.buttons();
    const where = `${quiz.id} ${language}, answer ${chosen + 1}`;
    assert.equal(panel.root.querySelector('.quiz-result').hidden, false, `${where}: the result shows`);
    assert.equal(panel.root.querySelector('.quiz-verdict').textContent, t(language, chosen === key ? 'Correct' : 'Not quite'), `${where}: verdict`);
    assert.deepEqual(buttons.map(button => button.classList.contains('is-correct')), quiz.options.map((_, index) => index === key), `${where}: correct mark`);
    assert.deepEqual(buttons.map(tag), quiz.options.map((_, index) => index === key ? t(language, index === chosen ? 'Your answer, correct' : 'Correct answer')
      : index === chosen ? t(language, 'Your answer') : ''), `${where}: answer tags`);
  }
});

// A study scene must never write, even when it was entered from a saved walk whose normal session
// was writing a moment earlier. Only write counts and stored bytes are checked after the jump.
test('a study scene entered from a saved walk never writes, even for steps that save in normal play', async () => {
  // Rejects a Scene select jump that keeps, or never leaves, the saved walk's normal save session.
  const preferences = { language: 'cs', sound: true, guidance: true };
  const seeded = encodeSnapshot(createSnapshot(startGame(createGame('cs', () => 0)), preferences, 'seed-study-guard'));
  const idb = createFakeIndexedDB();
  idb.seed('pec-adventure', { stores: { walks: { current: seeded } } });
  const quiet = async () => { await idb.idle(); await idb.idle(); };
  const app = entryPoint({ idb });
  let time = 1000;
  const gather = (potato) => {
    walkAppTo(app, potato);
    app.window.fire('keydown', { code: 'KeyE' }); app.frame(time += 50); app.window.fire('keyup', { code: 'KeyE' });
    assert.equal(app.game.actionAnimation?.kind, 'gather', `Hana starts gathering ${potato.id}`);
    for (let i = 0; i < 30 && app.game.actionAnimation; i++) app.frame(time += 50);
    assert.ok(app.game.potatoes.includes(potato.id), `Hana gathers ${potato.id}`);
  };
  const changeGuidance = () => { app.action('pause'); app.action('guidance'); app.action('resume'); };
  try {
    await quiet();
    app.gesture((event) => app.action('continue', undefined, event));
    assert.equal(app.game.phase, 'playing');
    app.frame(0);
    await quiet();
    assert.equal(idb.count('put'), 0, 'Continue is read-only.');
    // The same three steps each commit a checkpoint in normal play, so a zero below isn't vacuous.
    gather(POTATOES[0]); await quiet();
    assert.equal(idb.count('put'), 1, 'A gather in normal play saves.');
    assert.deepEqual([...decodeRecord(idb.value()).payload.potatoes], [POTATOES[0].id]);
    app.action('language', 'en'); await quiet();
    assert.equal(idb.count('put'), 2, 'A language change in normal play saves.');
    changeGuidance(); await quiet();
    assert.equal(idb.count('put'), 3, 'A guidance change in normal play saves.');
    const saved = idb.value();
    const writes = idb.count('put');
    jumpTo(app, 'fairy-birch'); app.frame(time += 50);
    gather(POTATOES[2]); await quiet();
    assert.equal(idb.count('put'), writes, 'A gather in a study scene writes nothing.');
    assert.equal(idb.value(), saved, 'A gather in a study scene leaves the saved walk’s bytes unchanged.');
    app.action('language', 'cs'); await quiet();
    assert.equal(idb.count('put'), writes, 'A language change in a study scene writes nothing.');
    assert.equal(idb.value(), saved, 'A language change in a study scene leaves the saved walk’s bytes unchanged.');
    changeGuidance(); await quiet();
    assert.equal(idb.count('put'), writes, 'A guidance change in a study scene writes nothing.');
    assert.equal(idb.value(), saved, 'A guidance change in a study scene leaves the saved walk’s bytes unchanged.');
  } finally { app.dispose(); }
});

test('the title gives New walk its keyboard focus once the saved-walk check settles', () => {
  // New walk stays disabled while the first read is pending, and a browser drops focus from a
  // control that becomes disabled. Rejects a title that never hands the focus back.
  const game = createGame('en', () => 0);
  document.activeElement = null;
  const root = new Element('div', { id: 'ui' });
  const ui = createUI(root, () => {});
  const draw = storage => ui.update(game, { overlay: 'intro', storage, guidance: true, region: 'Cottage garden' });
  draw({ pending: true, status: t('en', 'Checking for a saved walk.') });
  const newWalk = root.querySelector('[data-overlay="intro"] [data-action="newWalk"]');
  assert.equal(newWalk.disabled, true, 'New walk waits for the saved-walk check.');
  if (document.activeElement === newWalk) document.activeElement = null;
  draw({ pending: true, status: t('en', 'Checking for a saved walk.') });
  assert.notEqual(document.activeElement, newWalk, 'A disabled control has no focus.');
  draw({ pending: false, status: '' });
  assert.equal(newWalk.disabled, false);
  assert.equal(document.activeElement, newWalk, 'New walk takes focus once it can be used.');
  const help = root.querySelector('[data-overlay="intro"] [data-action="help"]');
  if (help) {
    help.focus();
    draw({ pending: false, status: '' });
    assert.equal(document.activeElement, help, 'A later draw leaves the player’s own focus alone.');
  }
});

test('a returning player’s title focuses Continue and shows New walk as the second choice', () => {
  // Rejects a title whose keyboard default replaces the saved walk instead of continuing it.
  const game = createGame('en', () => 0);
  const title = () => {
    document.activeElement = null;
    const root = new Element('div', { id: 'ui' });
    const ui = createUI(root, () => {});
    const draw = storage => ui.update(game, { overlay: 'intro', storage, guidance: true, region: 'Cottage garden' });
    // The markup is built on the first draw, so look the buttons up afterward.
    return { draw, get newWalk() { return root.querySelector('[data-overlay="intro"] [data-action="newWalk"]'); }, get resume() { return root.querySelector('[data-overlay="intro"] [data-action="continue"]'); } };
  };
  const pending = title();
  pending.draw({ pending: true, status: t('en', 'Checking for a saved walk.') });
  if (document.activeElement === pending.newWalk) document.activeElement = null;
  pending.draw({ pending: false, offerContinue: true, status: '' });
  assert.equal(document.activeElement, pending.resume, 'Continue takes focus once the check offers it.');
  assert.equal(pending.newWalk.classList.contains('primary'), false);
  assert.equal(pending.newWalk.classList.contains('secondary'), true);
  const settled = title();
  settled.draw({ pending: false, offerContinue: true, status: '' });
  assert.equal(document.activeElement, settled.resume, 'A check that settles before the first draw gives the same default.');
  settled.draw({ pending: false, offerContinue: false, status: '' });
  assert.equal(settled.newWalk.classList.contains('primary'), true, 'Without a saved walk, New walk is the main choice.');
});

test('canceling New walk returns focus to New walk, not to Continue', () => {
  // Cancel and Escape both close the confirmation back to the title. Rejects moving the
  // restored focus to Continue, where Enter would resume the saved walk.
  const game = createGame('en', () => 0);
  document.activeElement = null;
  const root = new Element('div', { id: 'ui' });
  const ui = createUI(root, () => {});
  const draw = overlay => ui.update(game, { overlay, storage: { pending: false, offerContinue: true, status: '' }, guidance: true, region: 'Cottage garden' });
  draw('intro');
  const newWalk = root.querySelector('[data-overlay="intro"] [data-action="newWalk"]');
  newWalk.focus();
  draw('confirmWalk');
  assert.equal(document.activeElement, root.querySelector('[data-action="cancelConfirm"]'));
  draw('intro');
  assert.equal(document.activeElement, newWalk);
  draw('intro');
  assert.equal(document.activeElement, newWalk, 'A later draw leaves it there.');
});

test('turning guidance off keeps the next step at home, where the house prompts point to it', () => {
  for (const [scene, shown] of [['outdoors', false], ['house', true]]) {
    const game = startGame(createGame('en', () => 0));
    game.scene = scene;
    const root = new Element('div', { id: 'ui' });
    createUI(root, () => {}).update(game, { overlay: null, storage: {}, guidance: false, region: 'Cottage garden' });
    assert.equal(root.querySelector('.destination').hidden, !shown, `${scene} guide with guidance off`);
  }
});

test('the New walk confirmation reads its saving notice as the dialog’s description', () => {
  const root = new Element('div', { id: 'ui' });
  createUI(root, () => {}).update(createGame('en', () => 0), { overlay: 'intro', storage: {}, guidance: true, region: 'Cottage garden' });
  const notice = root.querySelector('[data-confirm-notice]');
  assert.ok(notice.getAttribute('id'));
  assert.equal(root.querySelector('[data-overlay="confirmWalk"]').getAttribute('aria-describedby'), notice.getAttribute('id'));
});

test('John’s salt line follows the reveal it jokes about', () => {
  assert.ok(uiSource.indexOf('class="ending-joke"') > uiSource.indexOf('a Slavic goddess of home and harvest.'));
});

test('a singing spot names its song in the prompt', () => {
  const spot = PRACTICE_SPOTS.find(({ songId }) => songId === 'woodland');
  for (const [language, learned, expected] of [
    ['en', true, 'Press E to sing the woodland song again'], ['en', false, 'Learn the woodland song from Běla first.'],
    ['cs', true, 'Stiskni E a znovu zazpívej lesní píseň'], ['cs', false, 'Nejdřív tě Běla naučí lesní píseň.'],
  ]) {
    const game = startGame(createGame(language, () => 0));
    const root = new Element('div', { id: 'ui' });
    createUI(root, () => {}).update(game, { overlay: null, storage: {}, guidance: true, region: 'Cottage garden', nearby: { ...spot, type: 'practice', learned } });
    assert.equal(root.querySelector('[data-interaction-detail]').textContent, expected);
  }
});

test('Scene select’s Start the walk handles its own sound request, and the panels show the labels main.js chooses', () => {
  const root = new Element('div', { id: 'ui' });
  const ui = createUI(root, () => {});
  const game = createGame('en', () => 0);
  ui.update(game, { overlay: 'intro', storage: {}, guidance: true, region: 'Cottage garden' });
  assert.notEqual(root.querySelector('[data-sequence="start"]').getAttribute('data-own-gesture'), null, 'Start the walk is excluded from the capture retry.');
  assert.equal(root.querySelector('[data-sequence="home"]').getAttribute('data-own-gesture'), null, 'A study entry keeps the capture retry.');
  ui.update(game, { overlay: 'saveFailure', storage: { failure: { text: 'Failed.', primary: 'New walk without saving', back: 'Keep current walk' }, studyStatus: 'Scene study.' }, guidance: true, region: 'Cottage garden' });
  assert.equal(root.querySelector('[data-failure-primary]').textContent, 'New walk without saving');
  assert.equal(root.querySelector('[data-failure-back]').textContent, 'Keep current walk');
  assert.equal(root.querySelector('[data-supper-save-status]').textContent, 'Scene study.');
  assert.equal(root.querySelector('[data-chooser-save-status]').textContent, 'Scene study.');
});
