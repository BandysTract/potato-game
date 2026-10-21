import { SONG_SITES } from './data.js';
import { PRACTICE_ART } from './clearings.js';

// A finished restoration frames its garden, and a practice reply its responder, until Hana moves.
const RESPONDERS = Object.fromEntries(Object.entries(PRACTICE_ART).map(([id, art]) => {
  const [x, z] = Object.values(art.response)[0];
  return [id, { x, z }];
}));
const GARDENS = Object.fromEntries(SONG_SITES.map(site => [site.id, { x: site.x, z: site.z }]));
export function presentationSubject(moment) {
  if (!moment || moment.focusReleased !== false) return null;
  if (moment.kind === 'restoration-finish') return GARDENS[moment.subjectId] || null;
  if (moment.kind === 'practice-response') return RESPONDERS[moment.subjectId] || null;
  return null;
}

// Fit the pair above the interaction panel at the existing camera angle.
export function encounterFrame(player, subject, width, height, dialogue = false) {
  const aspect = width / height;
  const span = Math.abs((player.x - subject.x - player.z + subject.z) * Math.SQRT1_2) + 4.6;
  const distance = Math.max(dialogue ? 19 : 17, span / (2 * Math.tan(35 * Math.PI / 360) * aspect * .82));
  return { x: (player.x + subject.x) / 2, z: (player.z + subject.z) / 2,
    y: 1.9 - distance * Math.tan(35 * Math.PI / 360) * (dialogue ? .48 : .18) / Math.cos(Math.PI / 6), distance };
}
