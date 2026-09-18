import { createKit } from './kit.js';
import { SCENES, FAVOURITES } from './list.js';

export { SCENES, FAVOURITES };

export function buildScene(id, room, w, h) {
  const scene = SCENES.find(item => item.id === id);
  if (!scene) throw new Error(`Unknown scene: ${id}`);
  scene.build(createKit(room, w, h));
}
