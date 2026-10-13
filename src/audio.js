import { scoreFor, SCORES } from './music.js';
import { songPhrase } from './songs.js';

const frequency = (note) => 440 * 2 ** ((note - 69) / 12);
// Rounded, closed-mouth resonances keep the humming gentle rather than brassy.
const VOWELS = [[300, 900, 2100, 2900], [360, 1000, 2200, 3000], [420, 1150, 2350, 3100], [320, 950, 2150, 2950]];
const VOICE_LEVELS = [.5, .47, .49, .43];
const BREATH_LEVELS = [.014, .012, .01, .018];
export function createAudio(onEnabledChange = () => {}, onSampleStatus = () => {}) {
  let context;
  let master;
  let music;
  let themeGain;
  let roomSend;
  let room;
  let roomImpulse;
  let reedWave;
  let glottalWave;
  let breathBuffer;
  let stringWave;
  let enabled = false;
  let requested = false;
  let paused = true;
  let disposed = false;
  let enableRequest = 0;
  let scoreStart = null;
  let scoreEvent = 0;
  let currentScore = SCORES.growth;
  let transition = null;
  let lastPerformance = null;
  let sampleState = 'idle';
  let sampleBank = [];
  let samplePromise;
  const sampleAbort = new AbortController();
  let lastGame;
  let finished = false;
  let singer = null;
  let ducked = false;
  const voices = new Set();
  const canPlay = () => context?.state === 'running' && enabled && !paused && !disposed;

  function resetRoom() {
    if (!roomSend) return;
    roomSend.disconnect();
    room?.disconnect();
    room = null;
    if (disposed) return;
    room = context.createConvolver();
    room.normalize = false;
    room.buffer = roomImpulse;
    roomSend.connect(room);
    room.connect(master);
    // Retiring voices get 40 ms to fade. Their old sound must not refill the room.
    roomSend.gain.cancelScheduledValues(context.currentTime);
    roomSend.gain.setValueAtTime(0, context.currentTime);
    roomSend.gain.setValueAtTime(.18, context.currentTime + .05);
  }

  function track(sources, nodes, gain, group = 'music') {
    const voice = { sources, nodes, gain, group, cancelled: false };
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
    resetRoom();
    singer = null;
    ducked = false;
    scoreStart = null;
    scoreEvent = 0;
    transition = null;
    lastPerformance = null;
    if (themeGain) {
      themeGain.gain.cancelScheduledValues(context.currentTime);
      themeGain.gain.setValueAtTime(1, context.currentTime);
    }
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

  async function loadSamples() {
    if (samplePromise || !context.decodeAudioData) return samplePromise;
    sampleState = 'loading';
    samplePromise = (async () => {
      try {
        const response = await fetch('/assets/audio/manifest.json', { signal: sampleAbort.signal });
        if (!response.ok) throw new Error('Sample manifest unavailable');
        const manifest = await response.json();
        const loaded = [];
        // Sequential loading bounds temporary decode memory on phones.
        for (const sample of manifest.samples) {
          const response = await fetch(sample.url, { signal: sampleAbort.signal });
          if (!response.ok) throw new Error('Instrument sample unavailable');
          const buffer = await context.decodeAudioData(await response.arrayBuffer());
          if (disposed) return;
          loaded.push({ ...sample, buffer });
        }
        if (disposed) return;
        sampleBank = loaded;
        sampleState = 'ready';
        onSampleStatus('ready');
      } catch {
        if (disposed) return;
        sampleBank = [];
        sampleState = 'fallback';
        onSampleStatus('fallback');
      }
    })();
    return samplePromise;
  }

  function note(midi, duration, level, start, part = 'effect', group = part === 'effect' ? 'effect' : 'music') {
    if (!canPlay() || voices.size >= 64) return;
    const gain = context.createGain();
    const candidates = sampleBank.filter(sample => sample.instrument === part);
    const sample = candidates.sort((a, b) => Math.abs(a.rootMidi - midi) - Math.abs(b.rootMidi - midi))[0];
    let source;
    if (sample) {
      source = context.createBufferSource();
      source.buffer = sample.buffer;
      level *= 10 ** ((sample.gainDb ?? 0) / 20);
      source.playbackRate.value = sample.rootMidi === null ? 1 : 2 ** ((midi - sample.rootMidi + sample.tuneCents / 100) / 12);
    } else {
      source = context.createOscillator();
      if (part === 'violin') source.setPeriodicWave(stringWave);
      else if (part === 'clarinet') source.setPeriodicWave(reedWave);
      else source.type = part === 'bass' ? 'triangle' : 'sine';
      source.frequency.value = part === 'tambourine' ? 2100 : frequency(midi);
    }
    source.connect(gain);
    const sustained = part === 'violin' || part === 'clarinet';
    const release = sustained ? .12 : 0;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + Math.min(duration * .2, sustained ? .045 : .008));
    if (sustained) {
      gain.gain.linearRampToValueAtTime(level * .88, start + duration * .75);
      gain.gain.linearRampToValueAtTime(level * .7, start + duration);
    }
    if (sample && part === 'tambourine') gain.gain.setValueAtTime(level, start + Math.min(.035, duration * .6));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration + release);
    const pan = context.createStereoPanner();
    pan.pan.value = { violin: -.24, clarinet: .18, bass: -.05, tambourine: .32 }[part] || 0;
    gain.connect(pan);
    pan.connect(group === 'music' ? themeGain : master);
    if (group !== 'music') pan.connect(roomSend);
    track([source], [source, gain, pan], gain, group);
    if (sample) source.start(start, sample.startOffset ?? 0);
    else source.start(start);
    source.stop(start + duration + release + .02);
  }

  function startSinger(midi, syllable, start) {
    if (voices.size > 60) return;
    const now = start;
    const gain = context.createGain();
    const throat = context.createBiquadFilter();
    throat.type = 'lowpass';
    throat.frequency.value = 2200;
    throat.Q.value = .7;
    const resonances = [];
    const formants = VOWELS[syllable].map((value, index) => {
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = value;
      filter.Q.value = [2.5, 4, 6, 7][index];
      const resonance = context.createGain();
      resonance.gain.value = [1, .55, .15, .05][index];
      throat.connect(filter);
      filter.connect(resonance);
      resonance.connect(gain);
      resonances.push(resonance);
      return filter;
    });
    // One harmonic-rich vocal-fold source keeps the sound intimate and solo.
    const voice = context.createOscillator();
    voice.setPeriodicWave(glottalWave);
    voice.frequency.setValueAtTime(frequency(midi - .18), now);
    voice.frequency.exponentialRampToValueAtTime(frequency(midi), now + .11);
    voice.detune.setValueAtTime(-3, now);
    voice.detune.linearRampToValueAtTime(2, now + .32);
    voice.detune.linearRampToValueAtTime(-2, now + .93);
    voice.detune.linearRampToValueAtTime(1, now + 1.54);
    voice.detune.linearRampToValueAtTime(-4, now + 2.2);
    voice.connect(throat);
    const breath = context.createBufferSource();
    breath.buffer = breathBuffer;
    breath.loop = true;
    const breathFilter = context.createBiquadFilter();
    breathFilter.type = 'bandpass';
    breathFilter.frequency.value = 1800;
    breathFilter.Q.value = .8;
    const breathGain = context.createGain();
    breathGain.gain.setValueAtTime(.035, now);
    breathGain.gain.linearRampToValueAtTime(BREATH_LEVELS[syllable], now + .18);
    breath.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(throat);
    const vibrato = context.createOscillator();
    vibrato.frequency.setValueAtTime(5, now);
    vibrato.frequency.linearRampToValueAtTime(5.35, now + 2.2);
    const depth = context.createGain();
    depth.gain.setValueAtTime(0, now);
    depth.gain.setValueAtTime(0, now + .22);
    depth.gain.linearRampToValueAtTime(8, now + .6);
    depth.gain.linearRampToValueAtTime(6, now + 2.2);
    vibrato.connect(depth);
    depth.connect(voice.detune);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.13, now + .055);
    gain.gain.linearRampToValueAtTime(VOICE_LEVELS[syllable], now + .18);
    gain.connect(master);
    gain.connect(roomSend);
    const sources = [voice, breath, vibrato];
    singer = track(sources, [...sources, throat, ...formants, ...resonances, breathFilter, breathGain, depth, gain], gain, 'performance');
    singer.pitch = voice;
    singer.formants = formants;
    singer.breathGain = breathGain;
    singer.midi = midi;
    singer.syllable = syllable;
    sources.forEach((source) => source.start(now));
    return singer;
  }

  function schedulePerformance(performance) {
    voices.forEach(voice => { if (voice.group === 'performance') retire(voice); });
    singer = null;
    lastPerformance = performance;
    if (!performance) return;
    const phrase = songPhrase(performance.songId);
    const now = context.currentTime + .025;
    const elapsed = performance.elapsed;
    const responseAt = performance.kind === 'learn' ? phrase.duration : 0;
    if (responseAt) for (const event of phrase.notes) {
      if (event.note === null || event.at + event.duration <= elapsed) continue;
      note(event.note, Math.min(event.duration, event.at + event.duration - elapsed) * .9, .2,
        now + Math.max(0, event.at - elapsed), 'clarinet', 'performance');
    }
    const remaining = phrase.notes.filter(event => responseAt + event.at + event.duration > elapsed);
    const first = remaining.find(event => event.note !== null);
    if (!first) return;
    const voice = startSinger(first.note, 0, now + Math.max(0, responseAt + first.at - elapsed));
    if (!voice) return;
    remaining.forEach((event, index) => {
      const at = now + Math.max(0, responseAt + event.at - elapsed);
      const end = now + responseAt + event.at + event.duration - elapsed;
      const vowel = index % VOWELS.length;
      if (event.note !== null) {
        voice.pitch.frequency.setTargetAtTime(frequency(event.note), at, .025);
        voice.formants.forEach((filter, i) => filter.frequency.setTargetAtTime(VOWELS[vowel][i], at, .03));
        voice.breathGain.gain.setTargetAtTime(BREATH_LEVELS[vowel], at, .025);
        voice.gain.gain.setValueAtTime(.005, at);
        voice.gain.gain.linearRampToValueAtTime(VOICE_LEVELS[vowel], at + .045);
        voice.gain.gain.setValueAtTime(VOICE_LEVELS[vowel], Math.max(at + .05, end - .08));
        voice.gain.gain.linearRampToValueAtTime(.005, end - .015);
      } else voice.gain.gain.setValueAtTime(0, at);
    });
    const end = now + responseAt + phrase.duration - elapsed;
    voice.gain.gain.setValueAtTime(0, end);
    voice.sources.forEach(source => source.stop(end + .02));
  }

  function scheduleMusic(selected) {
    const now = context.currentTime;
    // Let the recordings supply the opening notes, but never wait indefinitely.
    if (sampleState === 'loading' && now < 1) return;
    const horizon = now + 1;
    if (scoreStart === null) { currentScore = selected; scoreStart = now + .025; scoreEvent = 0; }
    if (selected !== currentScore && transition?.score !== selected) {
      const cycle = currentScore.beats * currentScore.beat;
      const cycleStart = scoreStart + Math.floor(Math.max(0, horizon - scoreStart) / cycle) * cycle;
      const boundary = currentScore.boundaries.find(beat => cycleStart + beat * currentScore.beat >= horizon);
      transition = { score: selected, at: cycleStart + (boundary ?? currentScore.beats) * currentScore.beat };
    } else if (selected === currentScore) transition = null;
    if (transition && now >= transition.at - 1) {
      // Fill the old measure only up to the boundary. The new score starts there.
      scheduleUntil(Math.min(horizon, transition.at));
      if (horizon >= transition.at) {
        const at = transition.at;
        themeGain.gain.setValueAtTime(1, Math.max(now, at - .4));
        themeGain.gain.linearRampToValueAtTime(0, at);
        themeGain.gain.linearRampToValueAtTime(1, at + .4);
        currentScore = transition.score;
        scoreStart = transition.at;
        scoreEvent = 0;
        transition = null;
      }
    }
    scheduleUntil(transition ? Math.min(horizon, transition.at) : horizon);
  }

  function scheduleUntil(limit) {
    const now = context.currentTime;
    const { events, beat, beats } = currentScore;
    // Skip whole missed loops without resetting the musical phase or playing a backlog.
    const duration = beats * beat;
    if (scoreStart + duration < now) { scoreStart += Math.floor((now - scoreStart) / duration) * duration; scoreEvent = 0; }
    while (scoreStart + events[scoreEvent].at * beat < limit) {
      const event = events[scoreEvent];
      const at = scoreStart + event.at * beat;
      if (at >= now - .015) note(event.note, event.beats * beat, event.level, Math.max(now, at), event.part);
      if (++scoreEvent === events.length) { scoreEvent = 0; scoreStart += duration; }
    }
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
        themeGain = context.createGain();
        themeGain.connect(music);
        const wave = (harmonics) => context.createPeriodicWave(new Float32Array(harmonics.length), new Float32Array(harmonics));
        reedWave = wave([0, 1, .3, .08, .1, .03, .04, .015]);
        glottalWave = wave(Array.from({ length: 33 }, (_, harmonic) => harmonic ? 1 / harmonic ** 2 : 0));
        breathBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const breath = breathBuffer.getChannelData(0);
        let seed = 17;
        for (let sample = 0; sample < breath.length; sample++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          breath[sample] = seed / 2147483648 - 1;
        }
        stringWave = wave([0, 1, .16, .11, .06, .025, .014, .008, .004, .002]);
        // One short stereo room is shared by every voice, with no downloaded asset.
        roomImpulse = context.createBuffer(2, Math.floor(context.sampleRate * .65), context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = roomImpulse.getChannelData(channel);
          let energy = 0, smooth = 0;
          for (let i = Math.floor(context.sampleRate * .015); i < data.length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            smooth = smooth * .65 + (seed / 2147483648 - 1) * .35;
            data[i] = smooth * Math.exp(-7 * i / data.length);
            energy += data[i] ** 2;
          }
          const scale = .65 / Math.sqrt(energy);
          for (let i = 0; i < data.length; i++) data[i] *= scale;
        }
        roomSend = context.createGain();
        music.connect(roomSend);
        resetRoom();
        context.onstatechange = syncEnabled;
        loadSamples();
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
      if (paused === next) return;
      paused = next;
      if (paused) silence();
      volume();
    },
    tick(game) {
      if (!canPlay()) {
        if (scoreStart !== null || [...voices].some(voice => !voice.cancelled)) silence();
        return;
      }
      if (lastGame !== game) {
        silence();
        finished = false;
        lastGame = game;
      }
      if (finished) return;
      scheduleMusic(scoreFor(game));
      const performance = game.phase === 'playing' && game.scene !== 'house' ? game.activeSong : null;
      if (performance !== lastPerformance) schedulePerformance(performance);
      const singing = Boolean(performance);
      if (ducked !== singing) {
        ducked = singing;
        music.gain.cancelScheduledValues(context.currentTime);
        music.gain.setTargetAtTime(singing ? .05 : 1, context.currentTime, .08);
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
    samplesReady() { return samplePromise || Promise.resolve(); },
    getSampleState() { return sampleState; },
    dispose() {
      if (disposed) return;
      disposed = true;
      requested = false;
      enabled = false;
      ++enableRequest;
      sampleAbort.abort();
      sampleBank = [];
      silence(true);
      themeGain?.disconnect();
      if (context) { context.onstatechange = null; context.close(); }
    },
  };
}
