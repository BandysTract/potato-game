// Traditional Czech melodies, transcribed from the sources in assets/audio/SOURCES.md.
// A note is [MIDI pitch, quarter-note beats]. null is a rest. No copied arrangement.
export const TUNES = {
  growth: { title: 'Ach synku, synku', meter: [3, 4], tempo: 96, octave: 12, measures: [
    ['C', [[60, 1], [60, 1], [60, 1]]],
    ['C', [[60, .5], [62, .5], [64, 2]]],
    ['G', [[65, .5], [64, .5], [62, 2]]],
    ['C', [[60, 1], [null, 2]]],
    ['C', [[64, 1], [64, 1], [64, 1]]],
    ['C', [[64, .5], [65, .5], [67, 2]]],
    ['F', [[69, .5], [67, .5], [65, 1], [64, 1]]],
    ['G', [[62, 1], [62, 1], [62, 1]]],
    ['G', [[62, .5], [64, .5], [65, 2]]],
    ['G', [[67, .5], [65, .5], [64, 1], [62, 1]]],
    ['C', [[60, 1], [60, 1], [60, 1]]],
    ['C', [[60, .5], [62, .5], [64, 2]]],
    ['G', [[65, .5], [64, .5], [62, 2]]],
    ['C', [[60, 1], [null, 2]]],
  ] },
  woodland: { title: 'Já do lesa nepojedu', meter: [3, 4], tempo: 108, measures: [
    ['C', [[60, .5], [64, .5], [67, 1], [67, 1]]],
    ['C', [[72, .5], [72, .5], [67, 1], [67, 1]]],
    ['G', [[65, .5], [65, .5], [62, 1], [62, 1]]],
    ['C', [[60, .5], [64, .5], [67, 2]]],
    ['C', [[60, .5], [64, .5], [67, 1], [67, 1]]],
    ['C', [[72, .5], [72, .5], [67, 1], [67, 1]]],
    ['G', [[65, .5], [65, .5], [62, 1], [62, 1]]],
    ['C', [[60, .5], [64, .5], [60, 2]]],
    ['G', [[65, .5], [65, .5], [62, 1], [62, 1]]],
    ['C', [[60, .5], [64, .5], [67, 1], [67, 1]]],
    ['G', [[65, .5], [65, .5], [62, 1], [62, 1]]],
    ['C', [[60, .5], [64, .5], [67, 2]]],
    ['C', [[60, .5], [64, .5], [67, 1], [67, 1]]],
    ['C', [[72, .5], [72, .5], [67, 1], [67, 1]]],
    ['G', [[65, .5], [65, .5], [62, 1], [62, 1]]],
    ['C', [[60, .5], [64, .5], [60, 2]]],
  ] },
  rain: { title: 'Prší, prší', meter: [2, 4], tempo: 88, octave: 12, measures: [
    ...Array.from({ length: 4 }, () => ['C', [[67, .5], [67, .5], [69, .5], [67, .5]]]),
    ['F', [[65, .5], [65, .5], [65, .5], [65, .5]]],
    ['C', [[64, .5], [64, .5], [64, 1]]],
    ['G', [[62, .5], [62, .5], [67, .5], [67, .5]]],
    ['C', [[60, .5], [60, .5], [60, 1]]],
  ] },
};

export function songPhrase(id) {
  const tune = TUNES[id];
  const notes = [];
  let at = 0;
  // A complete opening phrase, followed by its answer when learning.
  for (const [, measure] of tune.measures.slice(0, 4)) for (const [note, beats] of measure) {
    notes.push({ note: note === null ? null : note + 12, at, duration: beats * 60 / tune.tempo });
    at += beats * 60 / tune.tempo;
  }
  return { notes, duration: at };
}
export const performanceDuration = (id, kind) => songPhrase(id).duration * (kind === 'learn' ? 2 : 1);
