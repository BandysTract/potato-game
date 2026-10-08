import { BOUNDS, CREATURES, FAIRIES, HOME, OBSTACLES, POTATOES, START } from './data.js';
import { placeName, t } from './i18n.js';

const SPEED = 5;
const PLAYER_RADIUS = 0.45;
const REACH = 2;
const SONG_SECONDS = 2;
const MAX_STEP = 0.05;

const distanceTo = (player, target) => Math.hypot(player.x - target.x, player.z - target.z);
const giftsReady = (game) => POTATOES.every(({ id }) => game.potatoes.includes(id))
  && FAIRIES.every(({ id }) => game.tears.includes(id));

export function createGame(language = 'cs') {
  return {
    language: language === 'en' ? 'en' : 'cs',
    phase: 'intro',
    player: { ...START, facing: 1, moving: false },
    potatoes: [],
    tears: [],
    activeFairy: null,
    holdProgress: 0,
    conversation: null,
    talked: [],
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
  if (game.messageKey) game.message = t(language, game.messageKey, game.messageValues);
  return game;
}

export function startGame(game) {
  if (game.phase === 'intro') game.phase = 'playing';
  return game;
}

export function finishConversation(game) {
  if (game.conversation !== null) {
    if (!game.talked.includes(game.conversation)) game.talked.push(game.conversation);
    game.conversation = null;
  }
  return game;
}

function remainingTargets(game) {
  return [
    ...POTATOES.filter(({ id }) => !game.potatoes.includes(id)).map((potato) => ({ ...potato, type: 'potato' })),
    ...FAIRIES.filter(({ id }) => !game.tears.includes(id)).map((fairy) => ({ ...fairy, type: 'fairy' })),
  ];
}

export function getNearby(game) {
  const candidates = [
    ...remainingTargets(game),
    ...CREATURES.map((creature) => ({ ...creature, type: 'creature' })),
    { ...HOME, type: 'home', ready: giftsReady(game) },
  ];
  let nearest = null;
  let nearestDistance = REACH;
  for (const target of candidates) {
    const distance = distanceTo(game.player, target);
    if (distance <= nearestDistance) {
      nearest = target;
      nearestDistance = distance;
    }
  }
  return nearest && {
    ...nearest,
    name: placeName(game.language, nearest.type === 'creature' ? nearest.englishName : nearest.name),
    ...(nearest.place ? { place: placeName(game.language, nearest.place) } : {}),
  };
}

export function getGoal(game) {
  const remaining = remainingTargets(game);
  const targets = remaining.length ? remaining : [{ ...HOME, type: 'home' }];
  let nearest = null;
  for (const target of targets) {
    const distance = distanceTo(game.player, target);
    if (!nearest || distance < nearest.distance) {
      const label = target.type === 'potato' ? t(game.language, 'Find a potato: {place}', { place: placeName(game.language, target.name) })
        : target.type === 'fairy' ? t(game.language, 'Sing with {name}', { name: target.name }) : t(game.language, 'Return to Hana’s cottage');
      nearest = { x: target.x, z: target.z, id: target.id, type: target.type, label, distance };
    }
  }
  return nearest;
}

function stopSong(game) {
  game.activeFairy = null;
  game.holdProgress = 0;
}

export function setMessage(game, englishKey, values = {}, seconds = 5) {
  game.messageKey = englishKey;
  game.messageValues = { ...values };
  game.message = t(game.language, englishKey, game.messageValues);
  game.messageTime = seconds;
  return game;
}

function movePlayer(player, dx, dz) {
  const clampX = (x) => Math.max(BOUNDS.minX + PLAYER_RADIUS, Math.min(BOUNDS.maxX - PLAYER_RADIUS, x));
  const clampZ = (z) => Math.max(BOUNDS.minZ + PLAYER_RADIUS, Math.min(BOUNDS.maxZ - PLAYER_RADIUS, z));
  let x = clampX(player.x + dx);
  let z = clampZ(player.z + dz);
  for (const obstacle of OBSTACLES) {
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
  setMessage(game, 'Still needed: potatoes {potatoes}, fairy tears {tears}. Then come home.', { potatoes, tears });
}

export function step(game, input = {}, dt = 0) {
  if (game.phase !== 'playing') return game;
  game.player.moving = false;
  if (game.conversation !== null) {
    stopSong(game);
    return game;
  }
  const seconds = Number.isFinite(dt) ? Math.max(0, Math.min(MAX_STEP, dt)) : 0;
  if (!seconds) return game;

  game.elapsed += seconds;
  game.messageTime = Math.max(0, game.messageTime - seconds);
  if (!game.messageTime) {
    game.message = '';
    game.messageKey = '';
    game.messageValues = {};
  }

  const screenX = Number.isFinite(input.x) ? input.x : 0;
  const screenY = Number.isFinite(input.y) ? input.y : 0;
  const magnitude = Math.max(1, Math.hypot(screenX, screenY));
  const x = screenX / magnitude;
  const y = screenY / magnitude;
  movePlayer(game.player, (x + y) * Math.SQRT1_2 * SPEED * seconds, (-x + y) * Math.SQRT1_2 * SPEED * seconds);
  if (game.player.moving && x !== 0) game.player.facing = Math.sign(x);

  const nearby = getNearby(game);
  if (!input.interact || !nearby) {
    stopSong(game);
    return game;
  }
  if (nearby.type === 'potato') {
    stopSong(game);
    game.potatoes.push(nearby.id);
    setMessage(game, 'Potato found. {count} of 6 in your basket.', { count: game.potatoes.length });
  } else if (nearby.type === 'fairy') {
    if (game.player.moving) {
      stopSong(game);
      return game;
    }
    if (game.activeFairy !== nearby.id) {
      stopSong(game);
      game.activeFairy = nearby.id;
    }
    game.holdProgress = Math.min(1, game.holdProgress + seconds / SONG_SECONDS);
    if (game.holdProgress >= 1 - 0.000000001) {
      game.tears.push(nearby.id);
      stopSong(game);
      setMessage(game, nearby.message, {}, 7);
    }
  } else if (nearby.type === 'creature') {
    stopSong(game);
    game.conversation = nearby.id;
    game.player.moving = false;
  } else {
    stopSong(game);
    if (nearby.ready) {
      game.phase = 'won';
      game.player.moving = false;
      setMessage(game, 'Home with 6 potatoes and 3 fairy tears. The kettle is on, and supper can begin.', {}, 0);
    } else {
      homeInstruction(game);
    }
  }
  return game;
}
