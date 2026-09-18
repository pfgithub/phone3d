import light from './light.js';
import relief from './relief.js';
import portal from './portal.js';
import terrain from './terrain.js';
import pocket from './pocket.js';
import crystal from './crystal.js';
import tunnel from './tunnel.js';
import garden from './garden.js';
import orbit from './orbit.js';
import phoneUi from './phone-ui.js';
import appInterface from './app-interface.js';
import jellyfish from './jellyfish.js';
import clockwork from './clockwork.js';
import library from './library.js';
import origami from './origami.js';
import neonCity from './neon-city.js';
import marbleRun from './marble-run.js';
import marbleMaze from './marble-maze.js';

import zipper from './zipper.js';
import impossible from './impossible.js';
import splash from './splash.js';
import pinWave from './pin-wave.js';
import moire from './moire.js';
import nautilus from './nautilus.js';
import deepWell from './deep-well.js';
import skyWindow from './sky-window.js';
import tidePools from './tide-pools.js';
import ribbonWeave from './ribbon-weave.js';
import contourQuarry from './contour-quarry.js';
import copperCircuit from './copper-circuit.js';
import tactileRadio from './tactile-radio.js';
import tactileFocus from './tactile-focus.js';
import tactileLights from './tactile-lights.js';
import chalkPebbles from './chalk-pebbles.js';
import pressedSage from './pressed-sage.js';
import porcelainRipples from './porcelain-ripples.js';
import pointCloudSculpture from './point-cloud-sculpture.js';
import louvredCard from './louvred-card.js';
import hollowMask from './hollow-mask.js';
import anamorphicScatter from './anamorphic-scatter.js';
import keyhole from './keyhole.js';
import hideAndSeekDollhouse from './hide-and-seek-dollhouse.js';
import shadowBox from './shadow-box.js';
import rainWindow from './rain-window.js';
import aquarium from './aquarium.js';
import popUpBook from './pop-up-book.js';
import holographicFoilCard from './holographic-foil-card.js';
import krakenBreakout from './kraken-breakout.js';

// Favourites come first, in this order; the first is shown on load. Everything else follows
// alphabetically by name. See AGENTS.md to add a scene.
export const FAVOURITES = [crystal, jellyfish, contourQuarry, appInterface, portal, copperCircuit, deepWell, skyWindow,
  ribbonWeave];

const ALL = [light, relief, portal, terrain, pocket, crystal, tunnel, garden, orbit, phoneUi, appInterface, jellyfish,
  clockwork, library, origami, neonCity, marbleRun, marbleMaze, zipper, impossible, splash, pinWave, moire, nautilus, deepWell,
  skyWindow, tidePools, ribbonWeave, contourQuarry, copperCircuit, tactileRadio, tactileFocus, tactileLights,
  chalkPebbles, pressedSage, porcelainRipples, pointCloudSculpture, louvredCard, hollowMask, anamorphicScatter,
  keyhole, hideAndSeekDollhouse, shadowBox, rainWindow, aquarium, popUpBook, holographicFoilCard, krakenBreakout];

export const OTHERS = ALL.filter(scene => !FAVOURITES.includes(scene)).sort((a, b) => a.name.localeCompare(b.name));

// Picker, gallery, and next/previous order.
export const SCENES = [...FAVOURITES, ...OTHERS];
