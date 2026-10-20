import './style.css';
import { createGame, startGame, step, getNearby, getGoal, finishConversation, setLanguage, setMessage, chooseSong, cancelSong } from './game.js';
import { createWorld } from './world.js';
import { createUI } from './ui.js';
import { createAudio } from './audio.js';
import { regionAt } from './data.js';
import { t } from './i18n.js';
import { createSequenceGame } from './sequences.js';
import { createFinale } from './finale.js';
import { createMoment, advanceMoment } from './moments.js';
import { HOUSE_ACTIVITIES } from './dialogues.js';

let game = createGame();
let overlay = 'intro';
let returnOverlay = null;
let adminReturn = null;
let sound = false;
let soundPreference = null;
let soundError = '';
let sampleFallback = false;
let dialogueChoice = null;
let endingTime = 0;
let moment = null;
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
const finale = createFinale(document.querySelector('#app'), onAction, playing => { game.dancePlaying = playing; });
let world;
let stopped = false;
let frame;
let audioFocused = document.hasFocus();

function syncAudioPause() {
  audio.setPaused(stopped || !audioFocused || document.hidden || game.phase === 'won' && game.ending === 'dance' || Boolean(overlay) && !['intro', 'win', 'reveal', 'dialogue'].includes(overlay));
  if (overlay !== 'dance' || !audioFocused || document.hidden) finale.pause();
}

function clearGiftReceipt() {
  if (game.messageKey === 'You learned {song}. A fairy tear is safe in your jar.') setMessage(game, '', {}, 0);
}

function clearMoment(releaseInstruction = false) {
  const previous = moment;
  moment = null;
  if (previous?.kind === 'fairy-gift') clearGiftReceipt();
  if (releaseInstruction && previous?.kind === 'aldo-lullaby' && game.scene === 'house'
      && game.phase === 'playing' && game.houseStep === previous.nextStep && !game.actionAnimation && !game.conversation) {
    setMessage(game, HOUSE_ACTIVITIES[1].message, {}, 7);
  }
  audio.tick(game, 0, moment);
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
    overlay, moment, sound, soundError: soundError ? t(game.language, soundError) : '', nearby: getNearby(game), goal: getGoal(game), region: t(game.language, game.scene === 'house' ? 'Inside the cottage' : regionAt(game.player)),
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
  if (overlay === 'admin') {
    const previous = adminReturn;
    adminReturn = null;
    returnOverlay = previous?.returnOverlay || null;
    showOverlay(previous?.overlay || null, true);
    return;
  }
  if (overlay === 'intro' || overlay === 'win' || overlay === 'reveal' || overlay === 'dance' || overlay === 'endingChoice') return;
  if (overlay === 'dialogue') { onAction('dialogueFinish'); return; }
  const next = returnOverlay;
  returnOverlay = null;
  showOverlay(next);
}

function onAction(action, value) {
  if (stopped) return;
  if (action === 'admin') {
    if (overlay === 'admin') closeOverlay();
    else {
      adminReturn = { overlay, returnOverlay };
      showOverlay('admin', true);
    }
  } else if (action === 'jump' && overlay === 'admin') {
    const next = createSequenceGame(value, game.language);
    if (!next) return;
    clearInput();
    clearMoment();
    game = next;
    dialogueChoice = null;
    returnOverlay = null;
    adminReturn = null;
    endingTime = 0;
    syncLanguage();
    if (game.phase === 'won') beginEnding();
    else showOverlay(game.conversation ? 'dialogue' : game.phase === 'intro' ? 'intro' : null);
  } else if (action === 'start' && game.phase === 'intro') {
    startGame(game);
    returnOverlay = null;
    showOverlay(null);
    if (soundPreference === null) setSound(true);
  } else if (action === 'ending' && overlay === 'endingChoice' && ['dance', 'goddess'].includes(value)) {
    game.ending = value;
    beginEnding();
  } else if (action === 'restart' && game.phase === 'won' && ['win', 'dance'].includes(overlay)) {
    clearMoment();
    game = createGame(game.language);
    startGame(game);
    endingTime = 0;
    syncLanguage();
    returnOverlay = null;
    dialogueChoice = null;
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
    const subject = game.conversation, choice = dialogueChoice, stepBefore = game.houseStep;
    finishConversation(game);
    dialogueChoice = null;
    returnOverlay = null;
    if (game.scene === 'house' && game.houseStep === stepBefore + 1) {
      clearMoment();
      if (subject === 'john') moment = createMoment('john-bowls', subject);
      else if (subject === 'aldo' && choice !== null) {
        moment = createMoment(choice === 1 ? 'aldo-lullaby' : 'aldo-finger', subject, game.houseStep);
        if (choice === 1) setMessage(game, '', {}, 0);
      }
    }
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
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'F2') {
    event.preventDefault();
    if (!event.repeat) onAction('admin');
    return;
  }
  if (event.target.matches('input, textarea, select') && !(overlay === 'admin' && event.code === 'Escape')) return;
  if (event.code === 'Escape') {
    event.preventDefault();
    if (event.repeat) return;
    if (overlay) closeOverlay();
    else if (game.activeSong) { cancelSong(game); audio.tick(game, 0, moment); drawUI(); }
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
  // Focusing the embedded player's frame doesn't mean leaving the game.
  if (document.hasFocus() && finale.containsFocus?.()) return;
  clearInput(overlay === 'admin');
  audioFocused = false;
  audio.setPaused(true);
  finale.pause();
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
  moment = null;
  clearInput();
  audio.setPaused(true);
  audio.dispose();
  finale.dispose();
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
function beginEnding() {
  clearMoment();
  endingTime = 0;
  if (!game.ending) {
    showOverlay('endingChoice');
  } else if (game.ending === 'dance') {
    game.finaleTime = reducedMotion?.matches ? 4 : 0;
    game.danceTime = 0;
    game.dancePlaying = false;
    showOverlay('dance');
  } else {
    audio.finish();
    showOverlay(reducedMotion?.matches ? 'win' : 'reveal');
  }
}

function animate(timestamp) {
  if (stopped) return;
  const elapsed = previousTime === undefined ? 0 : Math.max(0, (timestamp - previousTime) / 1000);
  const dt = Math.min(.05, elapsed);
  previousTime = timestamp;
  const visiblePlay = audioFocused && !document.hidden;
  const expiredMoment = moment && visiblePlay && (!overlay || overlay === 'dialogue' && moment.kind === 'john-bowls')
    && advanceMoment(moment, elapsed) ? moment : null;
  if (!overlay && visiblePlay) {
    const potatoesBefore = game.potatoes.length;
    const tearsBefore = game.tears.length;
    const sceneBefore = game.scene;
    const songBefore = game.activeSong;
    const actionBefore = game.actionAnimation;
    const moveX = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + touch.x;
    const moveY = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + touch.y;
    const quietCot = moment?.kind === 'aldo-lullaby' && getNearby(game)?.id === 'aldo';
    step(game, {
      x: moveX, y: moveY,
      interact: !quietCot && (pendingInteraction || keys.has('KeyE') || touch.interact),
    }, elapsed);
    if (dt > 0) pendingInteraction = false;
    if (game.scene !== sceneBefore) {
      clearMoment();
      clearInput();
      syncLanguage();
    }
    const newInteraction = game.conversation || game.songSite || game.activeSong && game.activeSong !== songBefore
      || game.actionAnimation && game.actionAnimation !== actionBefore;
    if (moment && newInteraction && moment.kind !== 'john-bowls') clearMoment();
    if (moment && Math.hypot(moveX, moveY) > .01) {
      if (moment.kind === 'fairy-gift') { moment.focusReleased = true; clearGiftReceipt(); }
      else if (moment.kind.startsWith('aldo-')) clearMoment(true);
    }
    if (moment && moment === expiredMoment) clearMoment(true);
    if (game.tears.length > tearsBefore && songBefore?.kind === 'learn') moment = createMoment('fairy-gift', songBefore.targetId);
    audio.tick(game, dt, moment);
    if (game.potatoes.length > potatoesBefore) audio.collect('potato');
    if (game.tears.length > tearsBefore) audio.collect('fairy');
    if (game.songSite) { returnOverlay = null; showOverlay('songs', true); }
    if (game.conversation) {
      dialogueChoice = null;
      returnOverlay = null;
      showOverlay('dialogue');
    }
    if (game.phase === 'won') {
      beginEnding();
    }
  } else if (overlay === 'dialogue' || overlay === 'intro') {
    if (moment && moment === expiredMoment) clearMoment(true);
    audio.tick(game, dt, moment);
  }
  else if (overlay === 'reveal' && visiblePlay) {
    endingTime += dt;
    if (reducedMotion?.matches || endingTime >= 3.6) showOverlay('win');
  } else if (overlay === 'dance' && audioFocused && !document.hidden) {
    game.finaleTime = reducedMotion?.matches ? Math.max(4, game.finaleTime) : game.finaleTime + dt;
    const playbackTime = finale.getPlaybackTime();
    if (playbackTime !== null) game.danceTime = playbackTime;
  }
  const frozen = !visiblePlay || Boolean(overlay) && !['intro', 'dialogue', 'win', 'reveal', 'dance', 'endingChoice'].includes(overlay);
  world.update(game, frozen ? 0 : dt, timestamp / 1000, moment, frozen);
  finale.update(game, { overlay, sound, focused: audioFocused && !document.hidden }, world.projectorBounds?.());
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
    moment = null;
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
    finale.dispose();
    audio.dispose();
  });
}
