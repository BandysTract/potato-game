import { CREATURES, FAIRIES, HOME, HOUSE_CAT, HOUSE_START, HOUSE_TARGETS, POTATOES, SONGS, SONG_SITES } from './data.js';
import { DIALOGUES, HOUSE_ACTIVITIES } from './dialogues.js';
import { createGame } from './game.js';

// A scene entry prepares a fresh, playable state. Conversation variants share
// an entry so every question stays reachable without crowding the panel.
export const SEQUENCES = [
  { id: 'start', group: 'The forest', label: 'Start the walk', detail: 'An empty basket, near the cottage.' },
  ...FAIRIES.map((fairy) => ({ id: fairy.id, group: 'Fairy songs', label: fairy.name, detail: SONGS.find((song) => song.fairyId === fairy.id).name })),
  ...SONG_SITES.map((site) => ({ id: `garden-${site.id}`, group: 'Gardens', label: site.name, detail: 'The song and supplies are ready.' })),
  ...CREATURES.map((creature) => ({
    id: creature.id, group: 'Forest conversations', label: creature.englishName,
    variants: DIALOGUES[creature.id].map((dialogue, index) => ({ id: `${creature.id}:${index}`, label: dialogue.theme })),
  })),
  { id: 'home', group: 'At home', label: 'Enter the cottage', detail: 'All supplies and gardens are ready.' },
  ...HOUSE_ACTIVITIES.map((activity) => ({ id: activity.id, group: 'At home', label: activity.label })),
  { id: 'percy', group: 'At home', label: 'Pet Percy' },
  { id: 'ending-dance', group: 'Endings', label: 'Family dance', detail: 'John’s projector and Karel Gott.' },
  { id: 'ending-goddess', group: 'Endings', label: 'Slavic goddess', detail: 'Hana’s original ending.' },
];

function readySupplies(game) {
  game.potatoes = POTATOES.map(({ id }) => id);
  game.tears = FAIRIES.map(({ id }) => id);
  game.learnedSongs = SONGS.map(({ id }) => id);
  game.restoredSites = SONG_SITES.map(({ id }) => id);
  game.gardenWatered = true;
}

function standNear(game, target, offset = 1.3) {
  game.player = { x: target.x, z: target.z + offset, facing: 1, direction: 2, moving: false };
}

export function createSequenceGame(id, language = 'cs') {
  const sequence = SEQUENCES.find((entry) => entry.id === id || entry.variants?.some((variant) => variant.id === id));
  if (!sequence) return null;
  const game = createGame(language, () => 0);
  game.phase = 'playing';
  if (id === 'start') return game;
  const fairy = FAIRIES.find((entry) => entry.id === id);
  if (fairy) { standNear(game, fairy); return game; }
  const site = SONG_SITES.find((entry) => `garden-${entry.id}` === id);
  if (site) {
    readySupplies(game);
    game.restoredSites = game.restoredSites.filter((entry) => entry !== site.id);
    if (site.potatoId) game.potatoes = game.potatoes.filter((entry) => entry !== site.potatoId);
    game.gardenWatered = game.restoredSites.includes('cottage');
    standNear(game, site);
    return game;
  }
  const creature = CREATURES.find((entry) => entry.id === sequence.id);
  if (creature) {
    standNear(game, creature);
    const index = sequence.variants.findIndex((variant) => variant.id === id);
    game.conversation = creature.id;
    game.conversationIndex = Math.max(0, index);
    game.dialogueNext[creature.id] = game.conversationIndex;
    return game;
  }
  readySupplies(game);
  if (id === 'home') { standNear(game, HOME); game.player.z = HOME.z - 1.3; return game; }
  game.scene = 'house';
  game.player = { ...HOUSE_START, facing: 1, direction: 0, moving: false };
  if (id === 'percy') { standNear(game, HOUSE_CAT); return game; }
  const houseStep = HOUSE_TARGETS.findIndex((target) => target.id === id);
  if (houseStep >= 0) {
    game.houseStep = houseStep;
    standNear(game, HOUSE_TARGETS[houseStep], 0.7);
    return game;
  }
  game.phase = 'won';
  game.houseStep = HOUSE_TARGETS.length - 1;
  game.ending = id === 'ending-goddess' ? 'goddess' : 'dance';
  game.finaleTime = 0;
  game.dancePlaying = false;
  game.player = { x: 0, z: 2.5, facing: 1, direction: 0, moving: false };
  return game;
}
