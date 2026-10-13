import './style.css';
import { createGame, startGame, step, getNearby, getGoal, finishConversation, setLanguage, setMessage, chooseSong, cancelSong } from './game.js';
import { createWorld } from './world.js';
import { createUI } from './ui.js';
import { createAudio } from './audio.js';
import { regionAt } from './data.js';
import { t } from './i18n.js';

let game = createGame();
let overlay = 'intro';
let returnOverlay = null;
let sound = false;
let soundPreference = null;
let soundError = '';
let sampleFallback = false;
let dialogueChoice = null;
let endingTime = 0;
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const keys = new Set();
let touch = { x: 0, y: 0, interact: false };
let pendingInteraction = false;
const audio = createAudio((enabled) => {
  sound = enabled;
  if (enabled) clearSoundError();
  if (!stopped) drawUI();
}, (status) => {
  sampleFallback = status === 'fallback';
  if (sampleFallback && !stopped) {
    setMessage(game, 'The instruments couldn’t load. Music will use synthesized sounds. You can keep exploring.', {}, 7);
    drawUI();
  }
});
const ui = createUI(document.querySelector('#ui'), onAction);
let world;
let stopped = false;
let frame;
let audioFocused = document.hasFocus();

function syncAudioPause() {
  audio.setPaused(stopped || !audioFocused || document.hidden || Boolean(overlay) && !['intro', 'win', 'reveal', 'dialogue'].includes(overlay));
}

function clearInput(preserveActivity = false) {
  keys.clear();
  touch = { x: 0, y: 0, interact: false };
  pendingInteraction = false;
  game.player.moving = false;
  game.interactionHeld = false;
  game.houseInteractionHeld = false;
  if (!preserveActivity) { cancelSong(game); game.actionAnimation = null; }
}

function showOverlay(next, preserveActivity = false) {
  clearInput(preserveActivity);
  overlay = next;
  syncAudioPause();
  drawUI();
}

function drawUI() {
  ui.update(game, {
    overlay, sound, soundError: soundError ? t(game.language, soundError) : '', nearby: getNearby(game), goal: getGoal(game), region: t(game.language, game.scene === 'house' ? 'Inside the cottage' : regionAt(game.player)),
    sampleFallback: sampleFallback ? t(game.language, 'The instruments couldn’t load. Music will use synthesized sounds. You can keep exploring.') : '',
    dialogue: { creatureId: game.conversation, index: game.conversationIndex, choice: dialogueChoice },
  });
}

function clearSoundError() {
  if (soundError && game.messageKey === soundError) setMessage(game, '', {}, 0);
  soundError = '';
}

function setSound(next) {
  soundPreference = next;
  try {
    sound = audio.setEnabled(next);
    if (sound) clearSoundError();
  }
  catch {
    sound = false;
    soundError = 'Sound is unavailable. You can keep exploring without it.';
    setMessage(game, soundError, {}, 5);
  } finally { drawUI(); }
}

function syncLanguage() {
  document.documentElement.lang = game.language;
  document.title = t(game.language, 'What’s cooking in Pec?');
  document.querySelector('meta[name="description"]').setAttribute('content', t(game.language, 'Explore the forests above Pec pod Sněžkou with Hana. Gather potatoes, sing with fairies, and come home to John and baby Aldo for supper.'));
  document.querySelector('#app').setAttribute('aria-label', document.title);
  document.querySelector('#world').setAttribute('aria-label', t(game.language, game.scene === 'house' ? 'Inside Hana’s cottage with John and baby Aldo' : 'An illustrated mountain forest'));
}

function closeOverlay() {
  if (overlay === 'intro' || overlay === 'win' || overlay === 'reveal') return;
  if (overlay === 'dialogue') { onAction('dialogueFinish'); return; }
  const next = returnOverlay;
  returnOverlay = null;
  showOverlay(next);
}

function onAction(action, value) {
  if (stopped) return;
  if (action === 'start' && game.phase === 'intro') {
    startGame(game);
    returnOverlay = null;
    showOverlay(null);
    if (soundPreference === null) setSound(true);
  } else if (action === 'restart' && game.phase === 'won' && overlay === 'win') {
    game = createGame(game.language);
    startGame(game);
    endingTime = 0;
    syncLanguage();
    returnOverlay = null;
    showOverlay(null);
  } else if (action === 'pause' && game.phase === 'playing' && !overlay) {
    returnOverlay = null;
    showOverlay('pause');
  } else if (action === 'resume' && game.phase === 'playing') {
    returnOverlay = null;
    showOverlay(null);
  } else if (action === 'help' && (!overlay || ['intro', 'pause', 'help'].includes(overlay))) {
    returnOverlay = overlay === 'help' ? returnOverlay : overlay;
    showOverlay('help');
  } else if (action === 'map' && game.phase !== 'won' && (!overlay || ['intro', 'pause', 'map'].includes(overlay))) {
    if (overlay === 'map') closeOverlay();
    else { returnOverlay = overlay; showOverlay('map'); }
  } else if (action === 'dialogueChoice' && overlay === 'dialogue' && (value === 0 || value === 1)) {
    dialogueChoice = value;
    drawUI();
  } else if (action === 'chooseSong' && overlay === 'songs') {
    if (chooseSong(game, value)) { returnOverlay = null; showOverlay(null, true); }
  } else if (action === 'language') {
    setLanguage(game, value === 'cs' || value === 'en' ? value : game.language === 'cs' ? 'en' : 'cs');
    syncLanguage();
    drawUI();
  } else if (action === 'dialogueFinish' && overlay === 'dialogue') {
    finishConversation(game);
    dialogueChoice = null;
    returnOverlay = null;
    showOverlay(null);
  } else if (action === 'close') closeOverlay();
  else if (action === 'sound') {
    setSound(!sound);
  } else if (action === 'touchMove' && !overlay) {
    touch.x = value.x;
    touch.y = value.y;
  } else if (action === 'touchInteract' && !overlay) {
    touch.interact = value;
    if (value) pendingInteraction = true;
  }
}

const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'KeyE']);
function onIntroInteraction(event) {
  if (!event.isTrusted || stopped || game.phase !== 'intro' || soundPreference !== null) return;
  if (event.target.closest('[data-action="sound"]')) return;
  if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(event.key))) return;
  setSound(true);
}
function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.target.matches('input, textarea, select')) return;
  if (event.code === 'Escape') {
    event.preventDefault();
    if (event.repeat) return;
    if (overlay) closeOverlay();
    else if (game.activeSong) { cancelSong(game); audio.tick(game); drawUI(); }
    else onAction('pause');
  } else if (event.code === 'KeyM' && game.phase !== 'won') {
    event.preventDefault();
    if (!event.repeat) onAction('map');
  } else if (event.code === 'KeyH') {
    event.preventDefault();
    if (!event.repeat) onAction('help');
  } else if (movementKeys.has(event.code) && !overlay) {
    event.preventDefault();
    if (event.code !== 'KeyE' || !event.repeat) keys.add(event.code);
    if (event.code === 'KeyE' && !event.repeat) pendingInteraction = true;
  }
}
function onKeyUp(event) {
  keys.delete(event.code);
  if (event.code === 'KeyE' && !touch.interact) {
    game.interactionHeld = false;
    game.houseInteractionHeld = false;
  }
}
function onBlur() {
  clearInput();
  audioFocused = false;
  audio.setPaused(true);
  if (game.phase === 'playing' && (!overlay || overlay === 'songs')) { returnOverlay = null; showOverlay('pause'); }
}
function onFocus() { audioFocused = true; syncAudioPause(); }
function onVisibility() {
  if (document.hidden) onBlur();
  else { audioFocused = document.hasFocus(); syncAudioPause(); }
}
window.addEventListener('keydown', onKeyDown);
window.addEventListener('click', onIntroInteraction, true);
window.addEventListener('keydown', onIntroInteraction, true);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('blur', onBlur);
window.addEventListener('focus', onFocus);
document.addEventListener('visibilitychange', onVisibility);

function graphicsError(artwork = false) {
  stopped = true;
  clearInput();
  audio.setPaused(true);
  audio.dispose();
  if (frame) cancelAnimationFrame(frame);
  const panel = document.createElement('section');
  panel.className = 'graphics-error';
  panel.setAttribute('role', 'alert');
  const heading = document.createElement('h1');
  heading.textContent = t(game.language, 'The forest couldn’t open.');
  const description = document.createElement('p');
  description.textContent = artwork
    ? t(game.language, 'The character artwork couldn’t load. Reload the game to try again.')
    : t(game.language, 'The game needs WebGL, your browser’s 3D graphics support. Try reloading or opening the game in a browser with hardware acceleration turned on.');
  const button = document.createElement('button');
  button.textContent = t(game.language, 'Try again');
  button.onclick = () => window.location.reload();
  const languageButton = document.createElement('button');
  languageButton.textContent = game.language === 'cs' ? 'English' : 'Česky';
  languageButton.onclick = () => {
    setLanguage(game, game.language === 'cs' ? 'en' : 'cs');
    syncLanguage();
    graphicsError(artwork);
  };
  panel.append(heading, description, button, languageButton);
  document.querySelector('#ui').replaceChildren(panel);
  button.focus();
}

syncLanguage();
try {
  world = createWorld(document.querySelector('#world'));
  world.ready?.catch(() => graphicsError(true));
  world.renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    graphicsError();
  });
} catch (error) {
  console.error('The forest renderer could not start.', error);
  graphicsError();
}

let previousTime;
function animate(timestamp) {
  if (stopped) return;
  const elapsed = previousTime === undefined ? 0 : Math.max(0, (timestamp - previousTime) / 1000);
  const dt = Math.min(.05, elapsed);
  previousTime = timestamp;
  if (!overlay) {
    const potatoesBefore = game.potatoes.length;
    const tearsBefore = game.tears.length;
    const sceneBefore = game.scene;
    step(game, {
      x: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + touch.x,
      y: Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + touch.y,
      interact: pendingInteraction || keys.has('KeyE') || touch.interact,
    }, elapsed);
    if (dt > 0) pendingInteraction = false;
    if (game.scene !== sceneBefore) {
      clearInput();
      syncLanguage();
    }
    audio.tick(game, dt);
    if (game.potatoes.length > potatoesBefore) audio.collect('potato');
    if (game.tears.length > tearsBefore) audio.collect('fairy');
    if (game.songSite) { returnOverlay = null; showOverlay('songs', true); }
    if (game.conversation) {
      dialogueChoice = null;
      returnOverlay = null;
      showOverlay('dialogue');
    }
    if (game.phase === 'won') {
      audio.finish();
      endingTime = 0;
      showOverlay(reducedMotion?.matches ? 'win' : 'reveal');
    }
  } else if (overlay === 'dialogue' || overlay === 'intro') audio.tick(game, dt);
  else if (overlay === 'reveal') {
    endingTime += dt;
    if (reducedMotion?.matches || endingTime >= 3.6) showOverlay('win');
  }
  world.update(game, dt, timestamp / 1000);
  drawUI();
  frame = requestAnimationFrame(animate);
}
if (!stopped) {
  syncAudioPause();
  drawUI();
  frame = requestAnimationFrame(animate);
}

function onResize() { world?.resize(); }
window.addEventListener('resize', onResize);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopped = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('click', onIntroInteraction, true);
    window.removeEventListener('keydown', onIntroInteraction, true);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    world?.dispose();
    ui.dispose();
    audio.dispose();
  });
}
