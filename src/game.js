import { BOUNDS, CREATURES, FAIRIES, HOME, HOUSE_BOUNDS, HOUSE_OBSTACLES, HOUSE_START, HOUSE_TARGETS, OBSTACLES, POTATOES, PRACTICE_SPOTS, START, SONGS, SONG_SITES, HOUSE_CAT } from './data.js';
import { HOUSE_ACTIVITIES } from './dialogues.js';
import { QUIZZES, findQuiz } from './quizzes.js';
import { placeName, t } from './i18n.js';
import { performanceDuration } from './songs.js';

const SPEED = 5;
export const PLAYER_RADIUS = 0.45;
const REACH = 2;
const MAX_STEP = 0.05;

const distanceTo = (player, target) => Math.hypot(player.x - target.x, player.z - target.z);
const giftsReady = (game) => POTATOES.every(({ id }) => game.potatoes.includes(id))
  && FAIRIES.every(({ id }) => game.tears.includes(id))
  && SONG_SITES.every(({ id }) => game.restoredSites.includes(id));

export function createGame(language = 'cs', random = Math.random) {
  return {
    language: language === 'en' ? 'en' : 'cs',
    phase: 'intro',
    ending: null,
    finaleTime: 0,
    danceTime: 0,
    dancePlaying: false,
    scene: 'outdoors',
    houseStep: 0,
    houseInteractionHeld: false,
    gardenWatered: false,
    learnedSongs: [],
    restoredSites: [],
    activeSong: null,
    songSite: null,
    interactionHeld: false,
    actionAnimation: null,
    percyPets: 0,
    player: { ...START, facing: 1, direction: 0, moving: false },
    potatoes: [],
    tears: [],
    conversation: null,
    conversationIndex: null,
    dialogueNext: Object.fromEntries(CREATURES.map(({ id }) => [id, Math.floor(random() * QUIZZES[id].length)])),
    talked: [],
    quizSession: null,
    quizCompleted: [],
    message: '',
    messageKey: '',
    messageValues: {},
    messageTime: 0,
    elapsed: 0,
  };
}

export function setLanguage(game, language) {
  if (language !== 'cs' && language !== 'en') return game;
  game.language = language;
  if (game.messageKey) game.message = translateMessage(game);
  return game;
}

export function startGame(game) {
  if (game.phase === 'intro') game.phase = 'playing';
  return game;
}

export function finishConversation(game) {
  if (game.conversation !== null) {
    if (game.scene === 'house') {
      const activity = HOUSE_ACTIVITIES[game.houseStep];
      if (activity?.id === game.conversation && game.houseStep < 2) {
        game.houseStep += 1;
        setMessage(game, activity.message, {}, 7);
      }
    } else if (game.quizSession?.answerId) {
      // Correct and incorrect answers finalize alike. An unanswered close keeps the question.
      const { quizId } = game.quizSession;
      if (!game.quizCompleted.includes(quizId)) game.quizCompleted.push(quizId);
      if (!game.talked.includes(game.conversation)) game.talked.push(game.conversation);
      game.dialogueNext[game.conversation] = (game.conversationIndex + 1) % QUIZZES[game.conversation].length;
    }
    game.conversation = null;
    game.conversationIndex = null;
    game.quizSession = null;
  }
  return game;
}

// Opens the animal's current question without consuming it.
export function openQuiz(game, creatureId) {
  const quizzes = QUIZZES[creatureId];
  if (!quizzes) return false;
  game.conversation = creatureId;
  game.conversationIndex = game.dialogueNext[creatureId];
  game.quizSession = { quizId: quizzes[game.conversationIndex].id, answerId: null };
  return true;
}

// Accepts only the first allowed answer to the named, active outdoor quiz.
export function answerQuiz(game, optionId, quizId) {
  const session = game.quizSession;
  if (game.phase !== 'playing' || game.scene !== 'outdoors' || !session || session.answerId !== null || session.quizId !== quizId) return false;
  const quiz = findQuiz(session.quizId);
  if (!quiz || QUIZZES[game.conversation]?.[game.conversationIndex] !== quiz || !quiz.options.some(option => option.id === optionId)) return false;
  session.answerId = optionId;
  return true;
}

function potatoAvailable(game, id) {
  const site = SONG_SITES.find(site => site.potatoId === id);
  return !site || game.restoredSites.includes(site.id);
}

function remainingTargets(game) {
  return [
    ...POTATOES.filter(({ id }) => !game.potatoes.includes(id) && potatoAvailable(game, id)).map(potato => ({ ...potato, type: 'potato' })),
    ...FAIRIES.filter(({ id }) => !game.tears.includes(id)).map(fairy => ({ ...fairy, type: 'fairy' })),
    ...SONG_SITES.filter(site => !game.restoredSites.includes(site.id) && game.learnedSongs.includes(site.songId)
      && (site.id !== 'cottage' || game.tears.length === 3 && game.potatoes.length === 6)).map(site => ({ ...site, type: 'songSite' })),
  ];
}

export function getNearby(game) {
  const candidates = game.scene === 'house' ? [
    ...HOUSE_TARGETS.map((target, index) => ({ ...target, name: HOUSE_ACTIVITIES[index].name, type: 'house', ready: index === game.houseStep, completed: index < game.houseStep })),
    { ...HOUSE_CAT, type: 'cat', ready: true },
  ] : [
    ...POTATOES.filter(({ id }) => !game.potatoes.includes(id) && potatoAvailable(game, id)).map(potato => ({ ...potato, type: 'potato' })),
    ...FAIRIES.map(fairy => ({ ...fairy, type: 'fairy', learned: game.tears.includes(fairy.id) })),
    ...CREATURES.map(creature => ({ ...creature, type: 'creature' })),
    ...PRACTICE_SPOTS.map(spot => ({ ...spot, type: 'practice', learned: game.learnedSongs.includes(spot.songId) })),
    ...SONG_SITES.filter(site => !site.potatoId || !game.restoredSites.includes(site.id) || game.potatoes.includes(site.potatoId))
      .map(site => ({ ...site, type: 'songSite', ready: true, completed: game.restoredSites.includes(site.id) })),
    { ...HOME, type: 'home', ready: giftsReady(game) },
  ];
  let nearest = null;
  let nearestDistance = REACH;
  for (const target of candidates) {
    const distance = distanceTo(game.player, target);
    if (distance <= nearestDistance) { nearest = target; nearestDistance = distance; }
  }
  return nearest && { ...nearest,
    name: placeName(game.language, nearest.type === 'creature' ? nearest.englishName : nearest.name),
    ...(nearest.place ? { place: placeName(game.language, nearest.place) } : {}),
  };
}

export function getGoal(game) {
  if (game.scene === 'house') {
    const target = HOUSE_TARGETS[game.houseStep];
    return { ...target, type: 'house', label: t(game.language, HOUSE_ACTIVITIES[game.houseStep].label), distance: distanceTo(game.player, target) };
  }
  const remaining = remainingTargets(game);
  const targets = remaining.length ? remaining : [{ ...HOME, type: 'home' }];
  let nearest = null;
  for (const target of targets) {
    const distance = distanceTo(game.player, target);
    if (!nearest || distance < nearest.distance) {
      const label = target.type === 'potato' ? t(game.language, 'Find a potato: {place}', { place: placeName(game.language, target.name) })
        : target.type === 'fairy' ? t(game.language, 'Sing with {name}', { name: target.name })
          : target.type === 'songSite' ? t(game.language, '{place}: needs a song', { place: placeName(game.language, target.name) })
            : t(game.language, 'Return to Hana’s cottage');
      nearest = { x: target.x, z: target.z, id: target.id, type: target.type, label, distance };
    }
  }
  return nearest;
}

export function cancelSong(game) {
  if (game.activeSong) setMessage(game, 'Song stopped. You can try again.');
  game.activeSong = null;
  game.songSite = null;
  return game;
}

export function chooseSong(game, songId) {
  const site = SONG_SITES.find(site => site.id === game.songSite);
  if (game.phase !== 'playing' || game.scene !== 'outdoors' || game.conversation || game.activeSong || game.actionAnimation
      || !site || game.restoredSites.includes(site.id) || distanceTo(game.player, site) > REACH || !game.learnedSongs.includes(songId)) return false;
  game.activeSong = { kind: 'restore', songId, targetId: site.id, elapsed: 0, duration: performanceDuration(songId, 'restore'), progress: 0 };
  game.songSite = null;
  return true;
}

function completeSong(game, performance) {
  // Practice is presentation only: no site, tear, inventory, or household change.
  if (performance.kind === 'practice') return;
  if (performance.kind === 'learn') {
    const song = SONGS.find(song => song.id === performance.songId);
    if (!game.learnedSongs.includes(song.id)) game.learnedSongs.push(song.id);
    if (!game.tears.includes(song.fairyId)) game.tears.push(song.fairyId);
    setMessage(game, 'You learned {song}. A fairy tear is safe in your jar.', { song: song.name }, 7);
    return;
  }
  const site = SONG_SITES.find(site => site.id === performance.targetId);
  if (site.songId !== performance.songId) { setMessage(game, game.learnedSongs.includes(site.songId) ? site.learnedClue : site.clue, {}, 7); return; }
  if (site.id === 'cottage' && game.tears.length < 3) {
    setMessage(game, 'The garden needs all 3 fairy tears. Visit the remaining fairies first.', {}, 7);
    return;
  }
  if (!game.restoredSites.includes(site.id)) game.restoredSites.push(site.id);
  game.gardenWatered = game.restoredSites.includes('cottage');
  setMessage(game, site.message, {}, 7);
}

function completeAction(game, action) {
  if (action.kind === 'gather') {
    if (!game.potatoes.includes(action.targetId)) game.potatoes.push(action.targetId);
    setMessage(game, 'Potato found. {count} of 6 in your basket.', { count: game.potatoes.length });
  } else if (action.kind === 'pet') {
    game.percyPets = Math.min(Number.MAX_SAFE_INTEGER, game.percyPets + 1);
    setMessage(game, 'Percy purrs and leans into your hand.');
  } else {
    setMessage(game, HOUSE_ACTIVITIES[game.houseStep].message, {}, 7);
    if (action.kind === 'serve') { game.phase = 'won'; const supper = HOUSE_TARGETS.find(target => target.id === 'serve'); game.player.x = supper.x; game.player.z = supper.z; }
    else game.houseStep += 1;
  }
}

function translateMessage(game) {
  const values = Object.fromEntries(Object.entries(game.messageValues).map(([key, value]) =>
    [key, typeof value === 'string' ? t(game.language, value) : value]));
  return t(game.language, game.messageKey, values);
}

export function setMessage(game, englishKey, values = {}, seconds = 5) {
  game.messageKey = englishKey;
  game.messageValues = { ...values };
  game.message = translateMessage(game);
  game.messageTime = seconds;
  return game;
}

function movePlayer(game, dx, dz) {
  const player = game.player;
  const bounds = game.scene === 'house' ? HOUSE_BOUNDS : BOUNDS;
  const obstacles = game.scene === 'house' ? HOUSE_OBSTACLES : OBSTACLES;
  const clampX = (x) => Math.max(bounds.minX + PLAYER_RADIUS, Math.min(bounds.maxX - PLAYER_RADIUS, x));
  const clampZ = (z) => Math.max(bounds.minZ + PLAYER_RADIUS, Math.min(bounds.maxZ - PLAYER_RADIUS, z));
  let x = clampX(player.x + dx);
  let z = clampZ(player.z + dz);
  for (const obstacle of obstacles) {
    const offsetX = x - obstacle.x;
    const offsetZ = z - obstacle.z;
    const distance = Math.hypot(offsetX, offsetZ);
    const radius = obstacle.radius + PLAYER_RADIUS;
    if (distance < radius) {
      // Project onto the edge so diagonal input slides along the obstacle.
      const fallback = Math.hypot(dx, dz) || 1;
      const normalX = distance ? offsetX / distance : -dx / fallback;
      const normalZ = distance ? offsetZ / distance : -dz / fallback;
      const projectedX = obstacle.x + normalX * radius;
      const projectedZ = obstacle.z + normalZ * radius;
      x = clampX(projectedX);
      z = clampZ(projectedZ);
      // If the map edge clips the projection, resolve along the free axis.
      if (x !== projectedX) {
        z = clampZ(obstacle.z + (normalZ < 0 ? -1 : 1) * Math.sqrt(Math.max(0, radius ** 2 - (x - obstacle.x) ** 2)));
      } else if (z !== projectedZ) {
        x = clampX(obstacle.x + (normalX < 0 ? -1 : 1) * Math.sqrt(Math.max(0, radius ** 2 - (z - obstacle.z) ** 2)));
      }
    }
  }
  player.moving = Math.hypot(x - player.x, z - player.z) > 0.000001;
  player.x = x;
  player.z = z;
}

function homeInstruction(game) {
  const potatoes = POTATOES.filter(({ id }) => !game.potatoes.includes(id)).length;
  const tears = FAIRIES.filter(({ id }) => !game.tears.includes(id)).length;
  const sites = SONG_SITES.filter(({ id }) => !game.restoredSites.includes(id)).length;
  setMessage(game, 'Still needed: potatoes {potatoes}, fairy tears {tears}, restored gardens {sites}.', { potatoes, tears, sites });
}

export function step(game, input = {}, dt = 0) {
  if (game.phase !== 'playing') return game;
  game.player.moving = false;
  if (game.conversation !== null || game.songSite) return game;
  const elapsed = Number.isFinite(dt) ? Math.max(0, dt) : 0;
  const seconds = Math.min(MAX_STEP, elapsed);
  if (!seconds) return game;
  game.elapsed += elapsed;
  game.messageTime = Math.max(0, game.messageTime - elapsed);
  if (!game.messageTime) { game.message = ''; game.messageKey = ''; game.messageValues = {}; }
  const pressed = Boolean(input.interact) && !game.interactionHeld;
  game.interactionHeld = Boolean(input.interact);
  game.houseInteractionHeld = game.interactionHeld;

  const screenX = Number.isFinite(input.x) ? input.x : 0;
  const screenY = Number.isFinite(input.y) ? input.y : 0;
  const magnitude = Math.max(1, Math.hypot(screenX, screenY));
  const x = screenX / magnitude, y = screenY / magnitude;
  const moving = Math.hypot(x, y) > .01;
  if (game.activeSong && moving) cancelSong(game);
  if (game.actionAnimation) {
    const action = game.actionAnimation;
    action.elapsed += elapsed;
    action.progress = Math.min(1, action.elapsed / action.duration);
    if (action.progress >= 1) { game.actionAnimation = null; completeAction(game, action); }
    return game;
  }
  movePlayer(game, (x + y) * Math.SQRT1_2 * SPEED * seconds, (-x + y) * Math.SQRT1_2 * SPEED * seconds);
  if (moving) {
    if (x) game.player.facing = Math.sign(x);
    game.player.direction = y < -.1 ? (x < 0 ? 3 : 2) : (x < 0 ? 1 : 0);
  }
  if (game.activeSong) {
    const performance = game.activeSong;
    performance.elapsed += elapsed;
    performance.progress = Math.min(1, performance.elapsed / performance.duration);
    if (performance.progress >= 1) { game.activeSong = null; completeSong(game, performance); }
    return game;
  }
  const nearby = getNearby(game);
  if (!pressed || !nearby || moving) return game;
  if (nearby.type === 'cat') {
    game.actionAnimation = { kind: 'pet', targetId: nearby.id, elapsed: 0, duration: 1.1, progress: 0 };
  } else if (nearby.type === 'house') {
    if (!nearby.ready) { setMessage(game, 'Follow the house guide to the next step.'); return game; }
    if (game.houseStep < 2) game.conversation = nearby.id;
    else game.actionAnimation = { kind: nearby.id, targetId: nearby.id, elapsed: 0, duration: nearby.id === 'cook' ? 3.2 : 1.8, progress: 0 };
  } else if (nearby.type === 'potato') {
    game.actionAnimation = { kind: 'gather', targetId: nearby.id, elapsed: 0, duration: 1.05, progress: 0 };
  } else if (nearby.type === 'fairy' && !nearby.learned) {
    const song = SONGS.find(song => song.fairyId === nearby.id);
    game.activeSong = { kind: 'learn', songId: song.id, targetId: nearby.id, elapsed: 0, duration: performanceDuration(song.id, 'learn'), progress: 0 };
    setMessage(game, 'Listen, then sing with {name}.', { name: nearby.name }, 7);
  } else if (nearby.type === 'songSite' && !nearby.completed) game.songSite = nearby.id;
  else if (nearby.type === 'practice') {
    const song = SONGS.find(song => song.id === nearby.songId);
    if (!nearby.learned) setMessage(game, 'Learn the {song} from {name} first.', { song: song.name, name: song.teacher }, 6);
    else game.activeSong = { kind: 'practice', songId: song.id, targetId: nearby.id, elapsed: 0, duration: performanceDuration(song.id, 'practice'), progress: 0 };
  }
  else if (nearby.type === 'creature') openQuiz(game, nearby.id);
  else if (nearby.type === 'home') {
    if (nearby.ready) {
      game.scene = 'house';
      game.player = { ...HOUSE_START, facing: 1, direction: 0, moving: false };
      setMessage(game, 'Inside, John, Aldo, and Percy are waiting.', {}, 7);
    } else homeInstruction(game);
  }
  return game;
}
