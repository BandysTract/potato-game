// Original folk-like waltz, synthesized locally without recordings or requests.
const HARMONIES = {
  G: [43, [55, 59, 62]],
  C: [36, [55, 60, 64]],
  D: [38, [54, 57, 62]],
  D7: [38, [54, 60, 62]],
  A: [45, [57, 61, 64]],
  Am: [45, [57, 60, 64]],
  Bm: [35, [54, 59, 62]],
  B7: [35, [54, 57, 63]],
  Em: [40, [55, 59, 64]],
};
// Each measure has three beats. Repeated motifs answer with a D-to-G cadence.
const MEASURES = [
  ['G', [[67, 0.5], [69, 0.5], [71, 1], [74, 1]]],
  ['D', [[72, 1], [71, 1], [69, 1]]],
  ['G', [[71, 1], [67, 0.5], [69, 0.5], [71, 1]]],
  ['D', [[69, 2], [62, 1]]],
  ['C', [[76, 1], [76, 0.5], [74, 0.5], [72, 1]]],
  ['G', [[71, 1], [74, 1], [71, 1]]],
  ['D', [[69, 1], [71, 0.5], [69, 0.5], [66, 1]]],
  ['G', [[67, 2], [74, 1]]],
  ['G', [[74, 0.5], [76, 0.5], [74, 1], [71, 1]]],
  ['D', [[72, 1], [69, 1], [66, 1]]],
  ['G', [[67, 0.5], [69, 0.5], [71, 1], [74, 1]]],
  ['C', [[76, 2], [72, 1]]],
  ['G', [[71, 1], [74, 0.5], [72, 0.5], [71, 1]]],
  ['D', [[69, 1], [74, 1], [72, 1]]],
  ['D', [[71, 1], [69, 0.5], [67, 0.5], [66, 1]]],
  ['G', [[67, 3]]],
];
// An original 32-measure title waltz. The falling fifth is answered by a
// rising sixth, opens into a minor middle passage, and returns with a new cadence.
const TITLE = [
  ['G', [[74, 1.5], [69, .5], [71, 1]], [59, 62]],
  ['C', [[67, .5], [76, 1.5], [74, 1]], [60, 64]],
  ['Am', [[72, 1], [71, .5], [69, .5], [67, 1]], [60, 64]],
  ['D7', [[66, 2], [69, 1]], [60, 57]],
  ['G', [[74, 1.5], [69, .5], [71, 1]], [62, 59]],
  ['Em', [[67, .5], [76, 1], [74, .5], [71, 1]], [64, 59]],
  ['C', [[72, 1.5], [74, .5], [76, 1]], [60, 67]],
  ['D', [[74, 2], [69, 1]], [62, 66]],
  ['Em', [[71, 1], [76, 1], [78, 1]], [64, 59]],
  ['Bm', [[78, 1.5], [74, .5], [71, 1]], [62, 66]],
  ['C', [[76, 1], [79, .5], [78, .5], [76, 1]], [64, 67]],
  ['G', [[74, 2], [71, 1]], [62, 59]],
  ['Am', [[72, 1.5], [76, .5], [74, 1]], [64, 60]],
  ['Em', [[71, 1], [67, .5], [69, .5], [71, 1]], [59, 64]],
  ['C', [[72, .5], [74, .5], [76, 1], [79, 1]], [60, 64]],
  ['D7', [[78, 2], [74, 1]], [66, 60]],
  ['C', [[79, 1.5], [74, .5], [76, 1]], [64, 67]],
  ['G', [[74, .5], [71, 1.5], [67, 1]], [62, 59]],
  ['Am', [[69, 1], [72, .5], [76, .5], [74, 1]], [60, 64]],
  ['D', [[78, 1.5], [76, .5], [74, 1]], [66, 62]],
  ['Em', [[76, 1], [71, .5], [74, .5], [79, 1]], [64, 59]],
  ['C', [[76, 1.5], [72, .5], [67, 1]], [60, 64]],
  ['Am', [[69, .5], [71, .5], [72, 1], [76, 1]], [64, 60]],
  ['D7', [[74, 1], [69, 2]], [62, 60]],
  ['G', [[74, 1.5], [69, .5], [71, 1]], [59, 62]],
  ['C', [[67, .5], [76, 1.5], [79, 1]], [60, 64]],
  ['Em', [[78, 1], [76, .5], [74, .5], [71, 1]], [64, 59]],
  ['Bm', [[74, 2], [71, 1]], [62, 66]],
  ['C', [[72, 1], [76, .5], [74, .5], [72, 1]], [64, 60]],
  ['Am', [[69, 1.5], [71, .5], [72, 1]], [60, 64]],
  ['D7', [[74, 1], [69, .5], [66, .5], [69, 1]], [62, 60]],
  ['G', [[67, 3]], [59, 55]],
];
// Each animal has six four-measure phrases, with contrasting middle passages
// and a return to its own opening. The last pair is an independent counterline.
const FOX = [
  ['D', [[74, .5], [78, .5], [76, .5], [74, .5], [69, 1]], [62, 66]],
  ['A', [[73, 1], [76, .5], [74, .5], [73, 1]], [61, 64]],
  ['G', [[71, .5], [74, .5], [79, 1], [78, .5], [76, .5]], [59, 62]],
  ['D', [[74, 1.5], [69, .5], [74, 1]], [62, 66]],
  ['Bm', [[78, .5], [81, .5], [78, 1], [74, 1]], [59, 62]],
  ['Em', [[79, 1], [78, .5], [76, .5], [71, 1]], [64, 67]],
  ['A', [[73, .5], [74, .5], [76, 1], [73, 1]], [61, 64]],
  ['D', [[74, 2], [69, 1]], [62, 66]],
  ['D', [[74, .5], [78, .5], [76, .5], [74, .5], [81, 1]], [66, 69]],
  ['G', [[79, 1], [78, .5], [76, .5], [74, 1]], [62, 59]],
  ['Em', [[76, .5], [79, .5], [78, .5], [76, .5], [71, 1]], [64, 67]],
  ['A', [[73, 1], [69, 2]], [64, 61]],
  ['Bm', [[71, 1], [74, 1], [78, 1]], [62, 66]],
  ['G', [[79, 1.5], [78, .5], [74, 1]], [67, 62]],
  ['Em', [[76, 1], [74, .5], [73, .5], [71, 1]], [64, 67]],
  ['A', [[73, 1], [76, 1], [81, 1]], [64, 69]],
  ['D', [[78, .5], [76, .5], [74, 1], [69, 1]], [66, 62]],
  ['Bm', [[71, .5], [73, .5], [74, 1], [78, 1]], [62, 59]],
  ['G', [[79, .5], [78, .5], [76, 1], [74, 1]], [62, 67]],
  ['A', [[73, 2], [69, 1]], [61, 64]],
  ['D', [[74, .5], [78, .5], [76, .5], [74, .5], [69, 1]], [66, 62]],
  ['G', [[71, 1], [74, 1], [79, 1]], [59, 62]],
  ['A', [[78, .5], [76, .5], [74, .5], [73, .5], [69, 1]], [64, 61]],
  ['D', [[74, 3]], [66, 62]],
];
const OWL = [
  ['Em', [[71, 1.5], [67, .5], [64, 1]], [52, 59]],
  ['Am', [[69, 2], [64, 1]], [57, 60]],
  ['B7', [[66, 1], [63, 1], [66, 1]], [54, 57]],
  ['Em', [[64, 3]], [55, 52]],
  ['G', [[67, 1], [71, 1], [74, 1]], [55, 59]],
  ['D', [[72, 1.5], [69, .5], [66, 1]], [54, 57]],
  ['Am', [[72, 1], [71, .5], [69, .5], [64, 1]], [57, 60]],
  ['B7', [[66, 2], [63, 1]], [54, 59]],
  ['Em', [[71, 1.5], [69, .5], [67, 1]], [55, 59]],
  ['C', [[76, 2], [72, 1]], [55, 60]],
  ['Am', [[71, 1], [69, 1], [64, 1]], [57, 60]],
  ['B7', [[66, 1], [63, .5], [66, .5], [71, 1]], [54, 57]],
  ['G', [[74, 1], [71, 1], [67, 1]], [59, 62]],
  ['C', [[72, 1.5], [71, .5], [67, 1]], [60, 64]],
  ['Am', [[69, 1], [72, 1], [76, 1]], [60, 57]],
  ['B7', [[75, 2], [71, 1]], [59, 54]],
  ['Em', [[76, 1.5], [74, .5], [71, 1]], [59, 55]],
  ['D', [[69, 2], [66, 1]], [57, 54]],
  ['C', [[67, 1], [64, 1], [67, 1]], [55, 60]],
  ['B7', [[66, 2], [63, 1]], [54, 59]],
  ['Em', [[71, 1.5], [67, .5], [64, 1]], [55, 59]],
  ['Am', [[69, 1], [72, 1], [71, 1]], [60, 57]],
  ['B7', [[69, 1], [66, 1], [63, 1]], [57, 54]],
  ['Em', [[64, 3]], [55, 52]],
];
const DEER = [
  ['G', [[67, 1], [71, .5], [74, .5], [79, 1]], [59, 62]],
  ['C', [[76, 1], [74, 1], [72, 1]], [60, 64]],
  ['G', [[71, 1.5], [69, .5], [67, 1]], [62, 59]],
  ['D', [[69, 2], [74, 1]], [57, 54]],
  ['Em', [[71, 1], [76, 1], [79, 1]], [59, 64]],
  ['C', [[79, 1.5], [76, .5], [72, 1]], [64, 60]],
  ['Am', [[69, 1], [72, 1], [76, 1]], [60, 57]],
  ['D', [[78, 1], [76, .5], [74, .5], [69, 1]], [62, 57]],
  ['G', [[67, 1], [71, .5], [74, .5], [79, 1]], [62, 59]],
  ['Em', [[78, 1], [76, 1], [71, 1]], [59, 55]],
  ['C', [[72, .5], [74, .5], [76, 1], [79, 1]], [60, 64]],
  ['D', [[81, 2], [78, 1]], [62, 66]],
  ['C', [[79, 1], [76, .5], [74, .5], [72, 1]], [64, 60]],
  ['G', [[71, 1], [74, 1], [79, 1]], [62, 59]],
  ['Am', [[76, 1.5], [72, .5], [69, 1]], [60, 57]],
  ['D', [[69, 1], [74, 1], [78, 1]], [57, 62]],
  ['Em', [[79, 2], [76, 1]], [64, 59]],
  ['C', [[76, .5], [74, .5], [72, 1], [67, 1]], [60, 55]],
  ['Am', [[69, 1], [71, .5], [72, .5], [76, 1]], [57, 60]],
  ['D', [[74, 2], [69, 1]], [62, 57]],
  ['G', [[67, 1], [71, .5], [74, .5], [79, 1]], [59, 62]],
  ['C', [[76, 1], [74, 1], [72, 1]], [64, 60]],
  ['D', [[71, 1], [69, .5], [67, .5], [66, 1]], [57, 54]],
  ['G', [[67, 3]], [59, 55]],
];

function compose(measures, tempo, detailed = false) {
  const events = measures.flatMap(([harmony, melody, counter], measure) => {
    const at = measure * 3;
    const [bass, chord] = HARMONIES[harmony];
    let beat = at;
    const accompaniment = detailed ? [
      { at: at + 2, note: bass + 7, beats: .8, part: 'bass' },
      ...Array.from({ length: 6 }, (_, index) => ({ at: at + index * .5, note: chord[index % 3] + (index > 2 ? 12 : 0), beats: .45, part: 'pluck' })),
      ...chord.map((note) => ({ at, note, beats: 2.8, part: 'strings' })),
      ...counter.map((note, index) => ({ at: at + index * 1.5, note, beats: 1.4, part: 'reed' })),
    ] : [1, 2].flatMap((offset) => chord.map((note) => ({ at: at + offset, note, beats: .7, part: 'pluck' })));
    return [
      { at, note: bass, beats: 1.3, part: 'bass' },
      ...accompaniment,
      ...melody.map(([note, beats]) => {
        const event = { at: beat, note, beats: beats * .9, part: 'flute' };
        beat += beats;
        return event;
      }),
    ];
  }).sort((a, b) => a.at - b.at);
  return { events, beat: 60 / tempo, beats: measures.length * 3 };
}
const WALK = compose(MEASURES, 92);
const TITLE_SCORE = compose(TITLE, 78, true);
TITLE_SCORE.level = .72;
TITLE_SCORE.events = TITLE_SCORE.events.map((event) => ({ ...event, part: event.part === 'flute' ? 'horn' : event.part === 'strings' ? 'pad' : event.part }));
const THEMES = { fox: compose(FOX, 108, true), owl: compose(OWL, 72, true), deer: compose(DEER, 84, true) };
const LEVELS = { flute: .065, horn: .065, bass: .085, pluck: .022, reed: .024, strings: .009, pad: .009 };
const frequency = (note) => 440 * 2 ** ((note - 69) / 12);

export function createAudio(onEnabledChange = () => {}) {
  let context;
  let master;
  let music;
  let fluteWave;
  let reedWave;
  let vowelWave;
  let hornWave;
  let stringWave;
  let enabled = false;
  let requested = false;
  let paused = true;
  let disposed = false;
  let enableRequest = 0;
  let scoreStart = null;
  let scoreEvent = 0;
  let currentScore = WALK;
  let lastGame;
  let finished = false;
  let singer = null;
  let ducked = false;
  const voices = new Set();
  const canPlay = () => context?.state === 'running' && enabled && !paused && !disposed;

  function track(sources, nodes, gain) {
    const voice = { sources, nodes, gain, cancelled: false };
    let ended = 0;
    voice.cleanup = () => {
      nodes.forEach((node) => node.disconnect());
      voices.delete(voice);
      if (singer === voice) singer = null;
    };
    sources.forEach((source) => { source.onended = () => { if (++ended === sources.length) voice.cleanup(); }; });
    voices.add(voice);
    return voice;
  }

  function retire(voice, immediate = false) {
    if (!voice.cancelled) {
      voice.cancelled = true;
      const now = context.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0, now, 0.008);
      voice.gain.gain.setValueAtTime(0, now + 0.04);
      voice.sources.forEach((source) => source.stop(now + 0.04));
    }
    if (immediate) voice.cleanup();
  }

  function silence(immediate = false) {
    voices.forEach((voice) => retire(voice, immediate));
    singer = null;
    ducked = false;
    scoreStart = null;
    scoreEvent = 0;
    if (music) {
      music.gain.cancelScheduledValues(context.currentTime);
      music.gain.setValueAtTime(1, context.currentTime);
    }
  }

  function volume() {
    if (!master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(canPlay() ? 0.35 : 0, context.currentTime, 0.025);
  }

  function syncEnabled() {
    const next = requested && context?.state === 'running' && !disposed;
    const changed = enabled !== next;
    enabled = next;
    if (!enabled) silence();
    volume();
    if (changed) onEnabledChange(enabled);
  }

  function note(midi, duration, level, start, part = 'effect') {
    if (!canPlay() || voices.size >= 64) return;
    const gain = context.createGain();
    const sources = (part === 'pad' ? [-4, 4] : [0]).map((cents) => {
      const oscillator = context.createOscillator();
      if (part === 'flute') oscillator.setPeriodicWave(fluteWave);
      else if (part === 'horn') oscillator.setPeriodicWave(hornWave);
      else if (part === 'pad') oscillator.setPeriodicWave(stringWave);
      else if (part === 'reed') oscillator.setPeriodicWave(reedWave);
      else oscillator.type = part === 'pluck' ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency(midi);
      oscillator.detune.value = cents;
      oscillator.connect(gain);
      return oscillator;
    });
    gain.gain.setValueAtTime(0, start);
    const sustained = ['flute', 'horn', 'reed', 'strings', 'pad'].includes(part);
    const peak = level / sources.length;
    gain.gain.linearRampToValueAtTime(peak, start + (part === 'pad' ? .14 : part === 'horn' ? .07 : sustained ? .045 : .008));
    if (sustained) gain.gain.setValueAtTime(peak * 0.8, start + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    gain.connect(part === 'effect' ? master : music);
    track(sources, [...sources, gain], gain);
    sources.forEach((oscillator) => { oscillator.start(start); oscillator.stop(start + duration + 0.02); });
  }

  function startSinger(midi) {
    if (voices.size > 60) return;
    const now = context.currentTime;
    const gain = context.createGain();
    const formants = [800, 1200].map((value) => {
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = value;
      filter.Q.value = 2.5;
      filter.connect(gain);
      return filter;
    });
    const singers = [-6, 6].map((cents) => {
      const oscillator = context.createOscillator();
      oscillator.setPeriodicWave(vowelWave);
      oscillator.frequency.value = frequency(midi);
      oscillator.detune.value = cents;
      formants.forEach((filter) => oscillator.connect(filter));
      return oscillator;
    });
    const shimmer = context.createOscillator();
    shimmer.frequency.value = frequency(midi + 12);
    const shimmerGain = context.createGain();
    shimmerGain.gain.value = 0.09;
    shimmer.connect(shimmerGain);
    shimmerGain.connect(gain);
    const vibrato = context.createOscillator();
    vibrato.frequency.value = 5.2;
    const depth = context.createGain();
    depth.gain.value = 5;
    vibrato.connect(depth);
    [...singers, shimmer].forEach((oscillator) => depth.connect(oscillator.detune));
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.095, now + 0.12);
    gain.connect(master);
    const sources = [...singers, shimmer, vibrato];
    singer = track(sources, [...sources, ...formants, shimmerGain, depth, gain], gain);
    singer.pitches = [...singers, shimmer];
    singer.midi = midi;
    sources.forEach((source) => { source.start(now); source.stop(now + 2.5); });
  }

  return {
    setEnabled(next) {
      const request = ++enableRequest;
      if (disposed) return false;
      requested = Boolean(next);
      if (!requested) {
        syncEnabled();
        return false;
      }
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        music = context.createGain();
        music.connect(master);
        const wave = (harmonics) => context.createPeriodicWave(new Float32Array(harmonics.length), new Float32Array(harmonics));
        fluteWave = wave([0, 1, 0.12, 0.22, 0.025, 0.06]);
        reedWave = wave([0, 1, .3, .08, .1, .03, .04, .015]);
        vowelWave = wave([0, 1, 0.45, 0.28, 0.15, 0.08, 0.05]);
        hornWave = wave([0, 1, .17, .12, .07, .04, .025, .015, .008]);
        stringWave = wave([0, 1, .16, .11, .06, .025, .014, .008, .004, .002]);
        context.onstatechange = syncEnabled;
      }
      // A blocked resume can remain pending indefinitely. Keep the control
      // usable and report sound on only after the audio clock is running.
      if (context.state !== 'running') {
        Promise.resolve(context.resume()).then(() => {
          if (request === enableRequest && !disposed) syncEnabled();
        }).catch(() => {
          if (request !== enableRequest || disposed) return;
          requested = false;
          syncEnabled();
        });
      }
      syncEnabled();
      return enabled;
    },
    setPaused(next) {
      paused = next;
      if (paused) silence();
      volume();
    },
    tick(game) {
      if (!canPlay()) {
        if (voices.size || scoreStart !== null) silence();
        return;
      }
      const selected = game.phase === 'intro' ? TITLE_SCORE : THEMES[game.conversation] || WALK;
      if (lastGame !== game || currentScore !== selected) {
        silence();
        if (lastGame !== game) finished = false;
        lastGame = game;
        currentScore = selected;
      }
      if (finished) return;
      const now = context.currentTime;
      const { events, beat, beats } = currentScore;
      // A short lookahead follows the audio clock without replaying a stalled backlog.
      if (scoreStart === null || scoreStart + events[scoreEvent].at * beat < now - 0.15) {
        scoreStart = now + 0.025;
        scoreEvent = 0;
      }
      while (scoreStart + events[scoreEvent].at * beat < now + 0.12) {
        const event = events[scoreEvent];
        note(event.note, event.beats * beat, LEVELS[event.part] * (currentScore.level ?? 1), scoreStart + event.at * beat, event.part);
        if (++scoreEvent === events.length) {
          scoreEvent = 0;
          scoreStart += beats * beat;
        }
      }
      const singing = game.phase === 'playing' && game.holdProgress > 0;
      if (singing) {
        const midi = [67, 69, 71, 74][Math.min(3, Math.floor(game.holdProgress * 4))];
        if (!singer) startSinger(midi);
        else if (singer.midi !== midi) {
          singer.pitches.forEach((oscillator, index) => oscillator.frequency.setTargetAtTime(frequency(midi + (index === 2 ? 12 : 0)), now, 0.04));
          singer.midi = midi;
        }
      } else if (singer) {
        retire(singer);
        singer = null;
      }
      if (ducked !== singing) {
        ducked = singing;
        music.gain.cancelScheduledValues(now);
        music.gain.setTargetAtTime(singing ? 0.38 : 1, now, 0.08);
      }
    },
    collect(kind) {
      const notes = kind === 'potato' ? [74, 79] : [79, 83, 86];
      notes.forEach((midi, index) => note(midi, 0.5, 0.085, context?.currentTime + index * 0.12));
    },
    finish() {
      if (finished) return;
      finished = true;
      silence();
      [67, 71, 74, 79].forEach((midi, index) => note(midi, 1.4, 0.095, context?.currentTime + index * 0.18));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      requested = false;
      enabled = false;
      ++enableRequest;
      silence(true);
      if (context) { context.onstatechange = null; context.close(); }
    },
  };
}
