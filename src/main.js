import './style.css';
import { createGame, startGame, step, getNearby, getGoal, finishConversation, setLanguage, setMessage, chooseSong, cancelSong, answerQuiz } from './game.js';
import { createWorld } from './world.js';
import { createUI } from './ui.js';
import { createAudio } from './audio.js';
import { regionAt } from './data.js';
import { t } from './i18n.js';
import { createSequenceGame } from './sequences.js';
import { createFinale } from './finale.js';
import { createMoment, advanceMoment } from './moments.js';
import { HOUSE_ACTIVITIES } from './dialogues.js';
import { createSaveStore, createSnapshot, decodeRecord, restoreGame } from './save.js';

let game = createGame();
let overlay = 'intro';
let returnOverlay = null;
let adminReturn = null;
// Sound intent is separate from the engine's confirmed running output.
// soundWanted persists; soundChosen protects a choice made during this visit.
let sound = false;
let soundWanted = true;
let soundChosen = false;
let soundState = 'idle';
let soundUnavailable = false;
let soundReadSettled = false;
let languageChosen = false;
let guidanceChosen = false;
// Local continuation: the store owns storage authority; main owns flows and copy.
let checkpointBase = null;
let unsavedCause = null;
let flowToken = 0;
let flowBusy = false;
let confirmState = null;
let failureState = null;
let hydrated = false;
let soundError = '';
let sampleFallback = false;
let dialogueChoice = null;
let guidance = true;
let endingTime = 0;
let moment = null;
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const keys = new Set();
let touch = { x: 0, y: 0, interact: false };
let pendingInteraction = false;
const audio = createAudio((enabled) => {
  sound = enabled;
  if (enabled) { soundState = 'running'; soundUnavailable = false; clearSoundError(); }
  else if (soundState === 'running') soundState = soundWanted ? 'waiting' : 'idle';
  if (!stopped) drawUI();
}, (status) => {
  sampleFallback = status === 'fallback';
  if (sampleFallback && !stopped) {
    setMessage(game, 'The instruments couldn’t load. Music will use synthesized sounds. You can keep exploring.', {}, 7);
    drawUI();
  }
}, (status) => {
  if (status === 'waiting' && !sound) soundState = 'waiting';
  if (status === 'unavailable') markSoundUnavailable();
  if (!stopped) drawUI();
});
const ui = createUI(document.querySelector('#ui'), onAction);
const store = createSaveStore({ onChange: onStoreChange });
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
    overlay, moment, sound, soundState, guidance, storage: storageView(), soundError: soundError ? t(game.language, soundError) : soundState === 'waiting' ? t(game.language, 'Sound is waiting to start.') : '', nearby: getNearby(game), goal: getGoal(game), region: t(game.language, game.scene === 'house' ? 'Inside the cottage' : regionAt(game.player)),
    sampleFallback: sampleFallback ? t(game.language, 'The instruments couldn’t load. Music will use synthesized sounds. You can keep exploring.') : '',
    dialogue: { creatureId: game.conversation, index: game.conversationIndex, choice: dialogueChoice, quiz: game.quizSession && { ...game.quizSession } },
  });
}

function clearSoundError() {
  soundError = '';
}

function markSoundUnavailable() {
  sound = false;
  soundUnavailable = true;
  soundState = 'unavailable';
  soundError = 'Sound is unavailable. You can keep exploring without it.';
}

// Only a trusted gesture may ask the browser to start audio.
function attemptSound() {
  try {
    if (audio.setEnabled(true)) { sound = true; soundState = 'running'; clearSoundError(); }
  } catch { markSoundUnavailable(); }
}

function requestSoundFromGesture(event) {
  if (!event?.isTrusted || stopped || !soundWanted || sound || !soundReadSettled || soundUnavailable) return;
  attemptSound();
  drawUI();
}

function soundOff() {
  soundWanted = false;
  soundState = 'idle';
  audio.setEnabled(false);
  sound = false;
}

function toggleGameSound(event) {
  soundChosen = true;
  if (soundState === 'waiting' || soundState === 'running') soundOff();
  else {
    soundWanted = true;
    soundUnavailable = false;
    clearSoundError();
    soundState = 'idle';
    if (event?.isTrusted) attemptSound();
  }
  drawUI();
}

// The dance video has its own output. Its control changes intent only.
function toggleVideoSound() {
  soundChosen = true;
  if (soundWanted) soundOff();
  else { soundWanted = true; soundUnavailable = false; clearSoundError(); if (soundState === 'unavailable') soundState = 'idle'; }
  drawUI();
}

// ---- Local continuation ----
const preferences = () => ({ language: game.language, sound: soundWanted, guidance });
const storageState = () => store.state;
const readPending = () => storageState().read !== 'settled';
const sorted = (list) => [...list].sort();
// Completed steps only. Position and pets don't count as progress at risk.
const progressKey = (source) => JSON.stringify([sorted(source.potatoes), sorted(source.tears), sorted(source.learnedSongs),
  sorted(source.restoredSites), sorted(source.quizCompleted), source.houseStep, source.phase === 'won' || source.checkpoint === 'supper']);

const NO_PROGRESS = progressKey({ potatoes: [], tears: [], learnedSongs: [], restoredSites: [], quizCompleted: [], houseStep: 0, phase: 'playing' });
function hasUncommittedProgress() {
  const state = storageState();
  if (game.phase === 'intro' || state.mode === 'study' || state.mode === 'unclaimed') return false;
  if (state.mode === 'normal' && state.knownCommitted) {
    const slot = decodeRecord(state.knownCommitted);
    if (slot.status === 'valid') return progressKey(slot.payload) !== progressKey(game);
  }
  return progressKey(game) !== NO_PROGRESS;
}

// Write after completed steps. A preference change saves against the last one.
function saveProgress() {
  if (storageState().mode !== 'normal') return;
  checkpointBase = createSnapshot(game, preferences(), 'pending');
  store.checkpoint(checkpointBase);
}
function savePreferences() {
  if (storageState().mode !== 'normal' || !checkpointBase) return;
  store.checkpoint({ ...checkpointBase, preferences: preferences() });
}

function applySavedPreferences(saved) {
  if (!languageChosen && saved.language !== game.language) { setLanguage(game, saved.language); syncLanguage(); }
  if (!soundChosen) soundWanted = saved.sound;
  if (!guidanceChosen) guidance = saved.guidance;
}

function onStoreChange() {
  const state = storageState();
  if (!hydrated && state.read === 'settled') {
    hydrated = true;
    soundReadSettled = true;
    // Hydration changes intent only. It never attempts playback or writes.
    if (state.slot.status === 'valid' && state.mode === 'unclaimed' && game.phase === 'intro') applySavedPreferences(state.slot.payload.preferences);
  }
  // A lost connection while a replacement waits for confirmation keeps the old game.
  if (overlay === 'confirmWalk' && confirmState?.approved && !state.available) {
    const back = confirmState.back;
    confirmState = null;
    showFailure(back);
    return;
  }
  if (!stopped) drawUI();
}

function captureSurface() {
  return { overlay, returnOverlay, adminReturn };
}
function restoreSurface(surface) {
  returnOverlay = surface.returnOverlay;
  adminReturn = surface.adminReturn;
  showOverlay(surface.overlay, true);
}
function showFailure(back) {
  failureState = { back };
  showOverlay('saveFailure', true);
}

function replaceGame(next) {
  clearInput();
  clearMoment();
  flowToken += 1;
  game = next;
  dialogueChoice = null;
  returnOverlay = null;
  adminReturn = null;
  confirmState = null;
  failureState = null;
  endingTime = 0;
  syncLanguage();
}

// Continue and Return are read-only. The visit's current preferences win.
function loadWalk(raw) {
  const slot = decodeRecord(raw);
  if (slot.status !== 'valid') return false;
  const loaded = restoreGame(slot.payload, createGame);
  setLanguage(loaded, game.language);
  replaceGame(loaded);
  store.setMode('normal', raw);
  unsavedCause = null;
  checkpointBase = createSnapshot(game, preferences(), 'pending');
  if (!soundWanted) soundOff();
  if (game.phase === 'won') showOverlay('endingChoice');
  else showOverlay(null);
  return true;
}

function continueWalk(event) {
  const state = storageState();
  if (game.phase !== 'intro' || state.mode !== 'unclaimed' || !offerContinue()) return;
  requestSoundFromGesture(event);
  loadWalk(state.slot.raw);
}

function freshWalk() {
  const next = game.phase === 'intro' && storageState().mode === 'unclaimed' ? game : createGame(game.language);
  startGame(next);
  return next;
}

function beginUnsavedWalk(cause, event) {
  if (cause === 'chosen') { store.abandon(); soundReadSettled = true; }
  requestSoundFromGesture(event);
  const next = freshWalk();
  replaceGame(next);
  store.setMode('unsaved');
  unsavedCause = cause;
  checkpointBase = null;
  showOverlay(null);
}

function lossText(state = storageState()) {
  if (state.mode === 'study') return 'Start a new walk? The current study scene will be replaced.';
  return game.phase !== 'intro' && hasUncommittedProgress() ? 'Start a new walk? Unsaved progress in the current walk will be lost.' : '';
}

// The common New walk flow for the title, pause, Start the walk, and Walk again.
async function newWalk(event) {
  if (flowBusy || confirmState || readPending()) return;
  requestSoundFromGesture(event);
  const back = captureSurface();
  const state = storageState();
  if (!state.available) {
    const loss = lossText(state);
    const notice = state.reason === 'chosen-unsaved' ? 'Saving is off for the visit. A new walk won’t be saved.' : 'Saving is unavailable. A new walk won’t be saved.';
    const cause = state.reason === 'chosen-unsaved' ? 'chosen' : 'unavailable';
    if (!loss && game.phase === 'intro') { beginUnsavedWalk(cause, event); return; }
    confirmState = { notice, text: loss || 'Start a new walk?', action: 'unsaved', cause, back };
    showOverlay('confirmWalk', true);
    return;
  }
  const token = ++flowToken;
  flowBusy = true;
  drawUI();
  const approved = await store.prepareReplacement();
  flowBusy = false;
  if (token !== flowToken || stopped) return;
  if (approved.status === 'unavailable') { showFailure(back); return; }
  if (approved.status === 'unsupported') {
    confirmState = { notice: 'Saving is unavailable. A new walk won’t be saved.', text: lossText() || 'Start a new walk?', action: 'unsaved', cause: 'unsupported', back };
    showOverlay('confirmWalk', true);
    return;
  }
  let text = '';
  if (approved.status === 'valid' || approved.status === 'invalid') {
    text = `${t(game.language, 'Start a new walk? Your saved walk will be replaced.')}${game.phase !== 'intro' && storageState().mode !== 'study' && hasUncommittedProgress() ? ` ${t(game.language, 'Unsaved progress in the current walk will also be lost.')}` : ''}`;
  } else text = lossText() ? t(game.language, lossText()) : '';
  if (!text) { await commitNewWalk(approved, back, event); return; }
  confirmState = { text, translated: true, action: 'replace', approved, back };
  showOverlay('confirmWalk', true);
}

async function commitNewWalk(approved, back, event) {
  requestSoundFromGesture(event);
  const token = ++flowToken;
  const next = game.phase === 'intro' ? game : createGame(game.language);
  const payload = createSnapshot({ ...next, phase: 'playing' }, preferences(), 'pending');
  flowBusy = true;
  drawUI();
  const result = await store.replace(approved, payload);
  flowBusy = false;
  if (token !== flowToken || stopped) return;
  if (result === 'committed') {
    // The new walk becomes current only after its record commits.
    startGame(next);
    replaceGame(next);
    unsavedCause = null;
    checkpointBase = payload;
    showOverlay(null);
    return;
  }
  // A refused or failed replacement keeps the prior game beneath the failure panel.
  confirmState = null;
  showFailure(back);
}

function confirmWalk(event) {
  const pending = confirmState;
  if (!pending || flowBusy) return;
  if (pending.action === 'unsaved') { confirmState = null; beginUnsavedWalk(pending.cause, event); return; }
  confirmState = { ...pending, busy: true };
  commitNewWalk(pending.approved, pending.back, event);
}

function failureBack() {
  if (!failureState || flowBusy) return;
  const { back } = failureState;
  failureState = null;
  restoreSurface(back);
  savePreferences();
}

function cancelConfirm() {
  if (!confirmState || flowBusy) return;
  const { back } = confirmState;
  confirmState = null;
  if (back.overlay === 'saveFailure') showOverlay('saveFailure', true);
  else {
    restoreSurface(back);
    // The reread dropped any queued step, so queue the last completed one again.
    savePreferences();
  }
}

// Play without saving. Live walks and studies confirm the loss first.
function playUnsaved(event, confirmed = false) {
  if (flowBusy) return;
  const state = storageState();
  const loss = game.phase === 'intro' ? '' : state.mode === 'study' ? 'Start a new walk? The current study scene will be replaced.'
    : game.phase === 'playing' ? 'Start a new walk? Unsaved progress in the current walk will be lost.' : '';
  if (loss && !confirmed) {
    confirmState = { text: loss, action: 'unsaved', cause: 'chosen', label: 'Play without saving', back: captureSurface() };
    showOverlay('confirmWalk', true);
    return;
  }
  beginUnsavedWalk('chosen', event);
}

function canReturn() {
  const state = storageState();
  return state.mode === 'study' && state.available && !state.conflict && Boolean(state.knownCommitted);
}

async function returnToSaved(event) {
  if (!canReturn() || flowBusy) return;
  requestSoundFromGesture(event);
  const token = ++flowToken;
  flowBusy = true;
  drawUI();
  const settled = await store.settle();
  flowBusy = false;
  if (token !== flowToken || stopped) return;
  if (!settled || !canReturn() || !loadWalk(storageState().knownCommitted)) drawUI();
}

function offerContinue() {
  const state = storageState();
  return state.read === 'settled' && state.available && !state.conflict && state.slot.status === 'valid' && state.mode === 'unclaimed';
}

// Status copy follows the surface first, then the storage cause.
function saveStatus() {
  const state = storageState();
  const failed = state.reason === 'failed';
  if (state.mode === 'study') {
    return [t(game.language, 'Scene study. Progress here isn’t saved.'),
      state.conflict ? t(game.language, 'Another tab saved a different walk. Reload to check it, or keep playing without saving. Reloading will lose unsaved progress.')
        : failed ? t(game.language, 'Saving is unavailable. Reload to check for a saved walk. Reloading will replace the study scene.') : ''].filter(Boolean).join(' ');
  }
  if (game.phase === 'intro') {
    if (readPending()) return t(game.language, 'Checking for a saved walk.');
    if (state.conflict) return t(game.language, 'Another tab saved a different walk. Reload to check it, start a new walk, or play without saving.');
    if (!state.available) return t(game.language, 'Saving is unavailable. Reload to check for a saved walk, or start a new walk without saving.');
    if (state.slot.status === 'unsupported') return t(game.language, 'Saving is unavailable. A new walk won’t be saved.');
    return '';
  }
  // An unsaved walk never writes, so an earlier conflict no longer describes it.
  if (game.phase === 'won') {
    if (state.conflict && state.mode !== 'unsaved') return t(game.language, 'Another tab saved a different walk. Start a new walk, or play without saving.');
    if (state.mode === 'normal' && !state.available || state.mode === 'unsaved' && unsavedCause === 'unavailable') return t(game.language, 'Saving is unavailable. Keep the tab open to revisit the ending. Reloading loses unsaved progress.');
    if (state.mode === 'unsaved') return t(game.language, 'The finished walk isn’t saved. Keep the tab open to revisit the ending. Reloading loses unsaved progress.');
    return '';
  }
  if (state.conflict && state.mode !== 'unsaved') return t(game.language, 'Another tab saved a different walk. Reload to check it, or keep playing without saving. Reloading will lose unsaved progress.');
  if (state.mode === 'normal' && !state.available) return t(game.language, 'Progress couldn’t be saved. Closing the tab will lose unsaved progress. Keep it open to finish the walk.');
  if (state.mode === 'unsaved') return t(game.language, 'Progress in the walk isn’t saved. Keep the tab open to finish it. Reloading will lose unsaved progress.');
  return '';
}

function selectorNote() {
  const state = storageState();
  if (state.mode === 'study') return 'Choosing another study scene replaces the current scene. Progress here won’t be saved.';
  if (state.mode === 'unclaimed') return 'Progress in scene study won’t be saved.';
  if (state.mode === 'normal' && state.available && !state.conflict && state.knownCommitted) return 'Choosing a study scene leaves the last saved checkpoint available. Unsaved steps will be lost.';
  return 'Choosing a study scene replaces the current walk. Unsaved progress will be lost.';
}

function storageView() {
  const state = storageState();
  const status = saveStatus();
  const title = game.phase === 'intro';
  const finished = game.phase === 'won' && state.mode !== 'study';
  const saved = state.mode === 'normal' && state.available && !state.conflict && state.saved;
  return {
    pending: readPending(), busy: flowBusy || state.busy,
    offerContinue: title && offerContinue(),
    offerNewWalk: !title || !readPending(),
    offerUnsaved: title && (readPending() || state.conflict) || finished && state.conflict && state.mode === 'normal',
    offerReload: title && !readPending() && (state.conflict || !state.available),
    offerReturn: canReturn(),
    status,
    helpStatus: saved ? t(game.language, 'Your completed steps are saved in this browser.') : state.mode === 'study' ? t(game.language, 'Progress in scene study isn’t saved.') : status,
    selectorNote: t(game.language, selectorNote()),
    confirm: confirmState && {
      notice: confirmState.notice ? t(game.language, confirmState.notice) : '',
      text: confirmState.translated ? confirmState.text : t(game.language, confirmState.text),
      label: t(game.language, confirmState.label || 'New walk'), busy: flowBusy,
    },
    failure: failureState && { text: status || t(game.language, 'Saving is unavailable. A new walk won’t be saved.') },
  };
}

function syncLanguage() {
  document.documentElement.lang = game.language;
  document.title = t(game.language, 'What’s cooking in Pec?');
  document.querySelector('meta[name="description"]').setAttribute('content', t(game.language, 'Explore the forests above Pec pod Sněžkou with Hana. Gather potatoes, sing with fairies, and come home to John and baby Aldo for supper.'));
  document.querySelector('#app').setAttribute('aria-label', document.title);
  document.querySelector('#world').setAttribute('aria-label', t(game.language, game.scene === 'house' ? 'Inside Hana’s cottage with John and baby Aldo' : 'An illustrated mountain forest'));
}

function closeOverlay() {
  if (overlay === 'confirmWalk') { cancelConfirm(); return; }
  if (overlay === 'saveFailure') { failureBack(); return; }
  if (overlay === 'admin') {
    const previous = adminReturn;
    adminReturn = null;
    returnOverlay = previous?.returnOverlay || null;
    showOverlay(previous?.overlay || null, true);
    return;
  }
  if (overlay === 'supper') { beginEnding(); return; }
  if (overlay === 'intro' || overlay === 'win' || overlay === 'reveal' || overlay === 'dance' || overlay === 'endingChoice') return;
  if (overlay === 'dialogue') { onAction('dialogueFinish'); return; }
  const next = returnOverlay;
  returnOverlay = null;
  showOverlay(next);
}

function onAction(action, value, event) {
  if (stopped) return;
  if (action === 'admin') {
    // Confirmation and failure panels hold the only start actions on screen.
    if (overlay === 'confirmWalk' || overlay === 'saveFailure') return;
    if (overlay === 'admin') closeOverlay();
    else {
      adminReturn = { overlay, returnOverlay };
      showOverlay('admin', true);
    }
  } else if (action === 'jump' && overlay === 'admin') {
    if (value === 'start') { newWalk(event); return; }
    if (readPending() || flowBusy) return;
    const next = createSequenceGame(value, game.language);
    if (!next) return;
    replaceGame(next);
    store.setMode('study');
    checkpointBase = null;
    if (game.phase === 'won') beginEnding();
    else showOverlay(game.conversation ? 'dialogue' : game.phase === 'intro' ? 'intro' : null);
  } else if (action === 'continue' && overlay === 'intro') continueWalk(event);
  else if (action === 'newWalk' && ['intro', 'pause'].includes(overlay)) newWalk(event);
  else if (action === 'playUnsaved' && ['intro', 'win', 'saveFailure'].includes(overlay) || action === 'playUnsaved' && overlay === 'dance') playUnsaved(event);
  else if (action === 'returnSaved' && ['pause', 'admin'].includes(overlay)) returnToSaved(event);
  else if (action === 'reload' && overlay === 'intro') window.location.reload();
  else if (action === 'confirmWalk' && overlay === 'confirmWalk') confirmWalk(event);
  else if (action === 'cancelConfirm' && overlay === 'confirmWalk') cancelConfirm();
  else if (action === 'failureBack' && overlay === 'saveFailure') failureBack();
  else if (action === 'supperContinue' && overlay === 'supper') {
    beginEnding();
  } else if (action === 'guidance') {
    guidance = !guidance;
    guidanceChosen = true;
    savePreferences();
    drawUI();
  } else if (action === 'ending' && overlay === 'endingChoice' && ['dance', 'goddess'].includes(value)) {
    game.ending = value;
    beginEnding();
  } else if (action === 'restart' && game.phase === 'won' && ['win', 'dance'].includes(overlay)) {
    newWalk(event);
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
  } else if (action === 'quizAnswer' && overlay === 'dialogue' && game.scene === 'outdoors') {
    // The event names its quiz, so a stale button can't answer a newer question.
    if (answerQuiz(game, value?.optionId, value?.quizId)) drawUI();
  } else if (action === 'dialogueChoice' && overlay === 'dialogue' && game.scene === 'house' && (value === 0 || value === 1)) {
    dialogueChoice = value;
    drawUI();
  } else if (action === 'chooseSong' && overlay === 'songs') {
    if (chooseSong(game, value)) { returnOverlay = null; showOverlay(null, true); }
  } else if (action === 'language') {
    setLanguage(game, value === 'cs' || value === 'en' ? value : game.language === 'cs' ? 'en' : 'cs');
    languageChosen = true;
    syncLanguage();
    savePreferences();
    drawUI();
  } else if (action === 'dialogueFinish' && overlay === 'dialogue') {
    const subject = game.conversation, choice = dialogueChoice, stepBefore = game.houseStep, quizzesBefore = game.quizCompleted.length;
    finishConversation(game);
    if (game.quizCompleted.length > quizzesBefore || game.houseStep > stepBefore) saveProgress();
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
    if (value === 'video') toggleVideoSound();
    else toggleGameSound(event);
    savePreferences();
  } else if (action === 'touchMove' && !overlay) {
    touch.x = value.x;
    touch.y = value.y;
  } else if (action === 'touchInteract' && !overlay) {
    touch.interact = value;
    if (value) pendingInteraction = true;
  }
}

const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'KeyE']);
// Any eligible click or key retries sound while it's wanted. Sound controls and
// walk transitions handle their own gesture, and the dance video has its own output.
function onGestureCapture(event) {
  if (!event.isTrusted || stopped || overlay === 'dance') return;
  if (event.target?.closest?.('[data-action="sound"], [data-own-gesture]')) return;
  if (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(event.key))) return;
  requestSoundFromGesture(event);
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
window.addEventListener('click', onGestureCapture, true);
window.addEventListener('keydown', onGestureCapture, true);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('blur', onBlur);
window.addEventListener('focus', onFocus);
document.addEventListener('visibilitychange', onVisibility);

function graphicsError(artwork = false) {
  stopped = true;
  store.dispose();
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
// Real serving shows the settled supper first. Prepared endings skip it.
function beginSupper() {
  clearMoment();
  moment = createMoment('supper', 'serve');
  showOverlay('supper');
}
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
  const expiredMoment = moment && visiblePlay && (!overlay || overlay === 'dialogue' && moment.kind === 'john-bowls' || overlay === 'supper' && moment.kind === 'supper')
    && advanceMoment(moment, elapsed) ? moment : null;
  if (!overlay && visiblePlay) {
    const potatoesBefore = game.potatoes.length;
    const tearsBefore = game.tears.length;
    const restoredBefore = game.restoredSites.length;
    const houseStepBefore = game.houseStep;
    const phaseBefore = game.phase;
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
      else if (moment.kind === 'restoration-finish' || moment.kind === 'practice-response') moment.focusReleased = true;
      else if (moment.kind.startsWith('aldo-')) clearMoment(true);
    }
    if (moment && moment === expiredMoment) clearMoment(true);
    if (game.tears.length > tearsBefore && songBefore?.kind === 'learn') moment = createMoment('fairy-gift', songBefore.targetId);
    // Presentation follows a real reward or a finished phrase. It replaces any older moment.
    if (game.restoredSites.length > restoredBefore && songBefore?.kind === 'restore') { clearMoment(); moment = createMoment('restoration-finish', songBefore.targetId); }
    if (songBefore?.kind === 'practice' && game.activeSong !== songBefore && songBefore.progress >= 1) { clearMoment(); moment = createMoment('practice-response', songBefore.targetId); }
    audio.tick(game, dt, moment);
    if (game.potatoes.length > potatoesBefore || game.tears.length > tearsBefore || game.restoredSites.length > restoredBefore
      || game.houseStep > houseStepBefore || game.phase === 'won' && phaseBefore !== 'won') saveProgress();
    if (game.potatoes.length > potatoesBefore) audio.collect('potato');
    if (game.tears.length > tearsBefore) audio.collect('fairy');
    if (game.songSite) { returnOverlay = null; showOverlay('songs', true); }
    if (game.conversation) {
      dialogueChoice = null;
      returnOverlay = null;
      showOverlay('dialogue');
    }
    if (game.phase === 'won') beginSupper();
  } else if (overlay === 'supper') {
    if (moment && moment === expiredMoment) beginEnding();
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
  const frozen = !visiblePlay || Boolean(overlay) && !['intro', 'dialogue', 'win', 'reveal', 'dance', 'endingChoice', 'supper'].includes(overlay);
  world.update(game, frozen ? 0 : dt, timestamp / 1000, moment, frozen);
  const storage = storageView();
  finale.update(game, { overlay, soundWanted, focused: audioFocused && !document.hidden, saveStatus: storage.status, offerUnsaved: storage.offerUnsaved }, world.projectorBounds?.());
  drawUI();
  frame = requestAnimationFrame(animate);
}
if (!stopped) {
  syncAudioPause();
  drawUI();
  store.start();
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
    window.removeEventListener('click', onGestureCapture, true);
    window.removeEventListener('keydown', onGestureCapture, true);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    store.dispose();
    world?.dispose();
    ui.dispose();
    finale.dispose();
    audio.dispose();
  });
}
