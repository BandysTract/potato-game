import { songPhrase } from './songs.js';

// Presentation owns no rewards. Keep one identity until completion or interruption.
export function createMoment(kind, subjectId, nextStep) {
  const duration = kind === 'fairy-gift' ? 3.5 : kind === 'aldo-lullaby' ? songPhrase('woodland').duration
    : kind === 'restoration-finish' || kind === 'supper' ? 1.6 : 2.4;
  return { kind, subjectId, elapsed: 0, duration,
    ...(['fairy-gift', 'restoration-finish', 'practice-response'].includes(kind) ? { focusReleased: false } : {}),
    ...(kind === 'aldo-lullaby' ? { songId: 'woodland', nextStep } : {}) };
}

export function advanceMoment(moment, elapsed) {
  moment.elapsed = Math.min(moment.duration, moment.elapsed + Math.max(0, Number.isFinite(elapsed) ? elapsed : 0));
  return moment.elapsed >= moment.duration;
}
