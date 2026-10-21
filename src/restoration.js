import { songPhrase } from './songs.js';

// Visual state for each garden's restoration. Values run from 0 (untouched)
// to 1 (restored). The song's own note timing drives them, never frame counts.
// Before the model awards a restoration, every reaction is provisional.
export const SETTLE_SECONDS = .8;
export const WOODLAND_VINES = 6, WOODLAND_MUSHROOMS = 4, LATE_CAP = 3, MEADOW_FLOWERS = 6;

const clamp01 = value => value < 0 ? 0 : value > 1 ? 1 : value;
const smooth = value => { const v = clamp01(value); return v * v * (3 - 2 * v); };
const bump = value => value <= 0 || value >= 1 ? 0 : Math.sin(Math.PI * value);
const phrases = { woodland: songPhrase('woodland'), growth: songPhrase('growth'), rain: songPhrase('rain') };

// Completed notes plus the fraction of the sounding one.
export function phrasePosition(phrase, elapsed) {
  if (!(elapsed > 0)) return 0;
  for (let i = 0; i < phrase.notes.length; i++) {
    const note = phrase.notes[i];
    if (elapsed < note.at + note.duration) return i + Math.max(0, (elapsed - note.at) / note.duration);
  }
  return phrase.notes.length;
}

// One preallocated state per garden, so ordinary frames allocate nothing.
export function createRestorationState(siteId, tuftPositions = []) {
  const sizes = { woodland: WOODLAND_VINES + WOODLAND_MUSHROOMS * 2, meadow: tuftPositions.length * 2 + MEADOW_FLOWERS, cottage: 5 };
  const values = new Float64Array(sizes[siteId] || 0);
  const state = { siteId, mode: 'idle', values };
  if (siteId === 'woodland') Object.assign(state, {
    vines: values.subarray(0, WOODLAND_VINES),
    grow: values.subarray(WOODLAND_VINES, WOODLAND_VINES + WOODLAND_MUSHROOMS),
    tip: values.subarray(WOODLAND_VINES + WOODLAND_MUSHROOMS),
  });
  if (siteId === 'meadow') {
    const count = tuftPositions.length;
    Object.assign(state, { u: Float64Array.from(tuftPositions), grass: values.subarray(0, count), bend: values.subarray(count, count * 2), flowers: values.subarray(count * 2) });
  }
  if (siteId === 'cottage') Object.assign(state, { slots: { rain: 0, fence: 1, leaves: 2, can: 3, bed: 4 } });
  return state;
}

export function cottageValue(state, name) { return state.values[state.slots[name]]; }

// Writes the state the garden should show right now into `state`.
export function restorationTarget(state, site, game, moment = null, reduced = false) {
  const values = state.values;
  const restored = Boolean(game.restoredSites?.includes(site.id));
  const song = game.activeSong;
  const active = !restored && song?.kind === 'restore' && song.targetId === site.id && song.songId === site.songId
    && (site.id !== 'cottage' || (game.tears?.length || 0) >= 3);
  const finish = restored && moment?.kind === 'restoration-finish' && moment.subjectId === site.id ? moment.elapsed : null;
  state.mode = restored ? 'restored' : active ? 'active' : 'idle';
  values.fill(0);
  if (site.id === 'woodland') {
    if (restored) {
      state.vines.fill(1); state.grow.fill(1);
      // The smallest cap notices late, during the finishing moment only.
      state.tip[LATE_CAP] = finish !== null && !reduced ? bump((finish - .3) / .9) : 0;
    } else if (active) {
      const phrase = phrases.woodland, count = phrase.notes.length;
      const position = phrasePosition(phrase, song.elapsed);
      const n = reduced ? Math.floor(position) : position;
      for (let i = 0; i < WOODLAND_VINES; i++) {
        const start = i * (count - 5) / WOODLAND_VINES;
        state.vines[i] = reduced ? Number(n >= start + 2) : smooth((n - start) / 2);
      }
      for (let j = 0; j < WOODLAND_MUSHROOMS; j++) {
        const start = count - 4.5 + Math.min(j, 2) * .45;
        state.grow[j] = reduced ? Number(n >= start + 1.4) : smooth((n - start) / 1.4);
        if (j !== LATE_CAP && !reduced) state.tip[j] = bump((n - (count - 3.2 + j * .55)) / 1.6);
      }
    }
  } else if (site.id === 'meadow') {
    if (restored) { state.grass.fill(1); state.flowers.fill(1); }
    else if (active) {
      const progress = song.elapsed / phrases.growth.duration;
      const p = reduced ? Math.floor(clamp01(progress) * 4) / 4 : clamp01(progress);
      // The wave crosses the grass first. Flowers open only after it passes.
      const front = p / .62 * 1.3 - .15;
      for (let i = 0; i < state.u.length; i++) {
        const offset = front - state.u[i];
        state.grass[i] = reduced ? Number(offset >= 0) : smooth((offset + .05) / .2);
        state.bend[i] = reduced ? 0 : Math.exp(-((offset / .1) ** 2));
      }
      for (let j = 0; j < MEADOW_FLOWERS; j++) state.flowers[j] = reduced ? Number(p >= .75) : smooth((p - .62 - j * .055) / .12);
    }
  } else if (site.id === 'cottage') {
    const slots = state.slots;
    if (restored) {
      // The rain tapers off, and the watered garden keeps its changes.
      values[slots.rain] = finish !== null && !reduced ? 1 - smooth(finish / .6) : 0;
      values[slots.fence] = .35; values[slots.leaves] = 1; values[slots.can] = 1; values[slots.bed] = 1;
    } else if (active) {
      const progress = clamp01(song.elapsed / phrases.rain.duration);
      const p = reduced ? Math.floor(progress * 4) / 4 : progress;
      values[slots.rain] = Number(progress > .12);
      values[slots.fence] = reduced ? Number(p >= .25) : smooth((p - .2) / .16);
      values[slots.leaves] = reduced ? Number(p >= .5) : smooth((p - .38) / .18);
      values[slots.can] = reduced ? Number(p >= .75) : smooth((p - .56) / .2);
      values[slots.bed] = (reduced ? Number(p >= .5) : smooth((p - .5) / .5)) * .75;
    }
  }
  return state;
}

// Active songs and restored gardens show their exact state. A song that stops
// without a restoration lets its provisional reaction ease back to untouched.
export function settleRestoration(display, target, dt, reduced = false, immediate = false) {
  const values = display.values, goal = target.values;
  display.mode = target.mode;
  if (immediate || reduced || target.mode !== 'idle') { values.set(goal); return display; }
  const step = Math.max(0, Number.isFinite(dt) ? dt : 0) / SETTLE_SECONDS;
  for (let i = 0; i < values.length; i++) {
    const value = values[i], want = goal[i];
    values[i] = value > want ? Math.max(want, value - step) : Math.min(want, value + step);
  }
  return display;
}
