import waterLevel from './water-level.js';
import sandTimerTray from './sand-timer-tray.js';
import pinballPocket from './pinball-pocket.js';
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
import marbleMazeRaised from './marble-maze-raised.js';

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
import ivorySockets from './ivory-sockets.js';
import terracottaNiches from './terracotta-niches.js';
import milledChannels from './milled-channels.js';
import leatherInlay from './leather-inlay.js';
import jadeLeaves from './jade-leaves.js';
import paperRelief from './paper-relief.js';
import lockScreen from './lock-screen.js';
import thumbwheelBank from './thumbwheel-bank.js';
import trackballConsole from './trackball-console.js';
import recessedMixer from './recessed-mixer.js';
import rockerPanel from './rocker-panel.js';
import shuttleDial from './shuttle-dial.js';
import springJoystick from './spring-joystick.js';

// Favourites come first, in this order; the first is shown on load. Then interactive scenes (touch or
// tilt), then everything else, each alphabetically by name. See AGENTS.md to add a scene.
export const FAVOURITES = [crystal, jellyfish, contourQuarry, portal, copperCircuit, deepWell, skyWindow, ribbonWeave];

const INTERACTIVE_SCENES = [waterLevel, sandTimerTray, pinballPocket, appInterface, marbleMaze, marbleMazeRaised, tactileRadio, tactileFocus, tactileLights, hideAndSeekDollhouse,
  thumbwheelBank, trackballConsole, recessedMixer, rockerPanel, shuttleDial, springJoystick];

const ALL = [waterLevel, sandTimerTray, pinballPocket, light, relief, portal, terrain, pocket, crystal, tunnel, garden, orbit, phoneUi, appInterface, jellyfish,
  clockwork, library, origami, neonCity, marbleRun, marbleMaze, marbleMazeRaised, zipper, impossible, splash, pinWave, moire, nautilus, deepWell,
  skyWindow, tidePools, ribbonWeave, contourQuarry, copperCircuit, tactileRadio, tactileFocus, tactileLights,
  chalkPebbles, pressedSage, porcelainRipples, pointCloudSculpture, louvredCard, hollowMask, anamorphicScatter,
  keyhole, hideAndSeekDollhouse, shadowBox, rainWindow, aquarium, popUpBook, holographicFoilCard, krakenBreakout,
  ivorySockets, terracottaNiches, milledChannels, leatherInlay, jadeLeaves, paperRelief, lockScreen,
  thumbwheelBank, trackballConsole, recessedMixer, rockerPanel, shuttleDial, springJoystick];

const byName = (a, b) => a.name.localeCompare(b.name);
export const INTERACTIVE = INTERACTIVE_SCENES.filter(scene => !FAVOURITES.includes(scene)).sort(byName);
export const OTHERS = ALL.filter(scene => !FAVOURITES.includes(scene) && !INTERACTIVE.includes(scene)).sort(byName);

// Gallery sections, in order.
export const SECTIONS = [
  { title: 'Favourites', scenes: FAVOURITES },
  { title: 'Interactive', scenes: INTERACTIVE },
  { title: 'Everything else', scenes: OTHERS },
];

// Picker, gallery, and next/previous order.
export const SCENES = SECTIONS.flatMap(section => section.scenes);
