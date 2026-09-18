import { createKit } from './kit.js';
import light from './light.js';
import relief from './relief.js';
import portal from './portal.js';
import terrain from './terrain.js';
import pocket from './pocket.js';
import crystal from './crystal.js';
import tunnel from './tunnel.js';
import garden from './garden.js';
import orbit from './orbit.js';

// Picker order. The first scene is shown on load. See AGENTS.md to add one.
export const SCENES = [light, relief, portal, terrain, pocket, crystal, tunnel, garden, orbit];

export function buildScene(id, room, w, h) {
  const scene = SCENES.find(item => item.id === id);
  if (!scene) throw new Error(`Unknown scene: ${id}`);
  scene.build(createKit(room, w, h));
}
