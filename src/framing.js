// Fit the pair above the interaction panel at the existing camera angle.
export function encounterFrame(player, subject, width, height, dialogue = false) {
  const aspect = width / height;
  const span = Math.abs((player.x - subject.x - player.z + subject.z) * Math.SQRT1_2) + 4.6;
  const distance = Math.max(dialogue ? 19 : 17, span / (2 * Math.tan(35 * Math.PI / 360) * aspect * .82));
  return { x: (player.x + subject.x) / 2, z: (player.z + subject.z) / 2,
    y: 1.9 - distance * Math.tan(35 * Math.PI / 360) * (dialogue ? .48 : .18) / Math.cos(Math.PI / 6), distance };
}
