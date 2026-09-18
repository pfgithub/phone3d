import { createKit } from './kit.js';
import { SCENES, SECTIONS } from './list.js';

export { SCENES, SECTIONS };

export function buildScene(id, room, w, h) {
  const scene = SCENES.find(item => item.id === id);
  if (!scene) throw new Error(`Unknown scene: ${id}`);
  // Interactive scenes return { update, pointerDown, pointerMove, pointerUp }; see AGENTS.md.
  return scene.build(createKit(room, w, h)) ?? null;
}
