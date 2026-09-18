# AGENTS.md

Parallax is a motion-tracked 3D "window" for phones, built with Three.js and Vite. The phone screen is treated as a pane of glass, and each scene is a small physical diorama behind (or poking out of) that glass. See `README.md` for the projection math and how to run it on a phone.

## Workflow rules

- **Commit and push after every change.** When a change is complete and tests pass, `git add` the files, `git commit` with a clear message, and `git push`. Don't leave work uncommitted or unpushed. Pushing to `master` deploys to GitHub Pages (`.github/workflows/pages.yml`).
- Run `npm test` before committing. For scene or UI changes, also run `npm run test:browser` (run `npx playwright install chromium` once first).

- When you add a scene, don't add tests for it and ton't test it visually.

## Layout

```
src/main.js           App: renderer, camera, sensors, UI, scene picker and gallery
src/projection.js     Off-axis window projection math
src/scenes/list.js    Scene list: imports, FAVOURITES, and ALL (SCENES = favourites, then the rest A–Z) (the only file to edit when adding a scene)
src/scenes/index.js   Builds a scene by id (no need to touch)
src/scenes/kit.js     Helpers passed to every scene's build()
src/scenes/<id>.js    One file per scene
tests/scenes.test.js  Node tests
tests/browser/        Playwright tests (every scene is rendered via next/previous)
```

## Adding a scene

Adding a scene takes two steps: create one file, then register it in `src/scenes/list.js` with one import and one array entry. You only need to read the scene you're writing, `list.js`, and this document. The kit helpers are listed below, so you don't need to open `kit.js`, `index.js`, or `main.js`.

### 1. Create `src/scenes/<id>.js`

```js
export default {
  id: 'lanterns',                 // unique, lowercase, a-z 0-9 and '-'; also the gallery card's data-id
  name: 'Paper lanterns',         // shown in the scene picker and gallery
  description: 'Glowing lanterns drifting 60 mm behind the glass.', // shown under the picker
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, lines, chamber, screenFrame }) {
    screenFrame();                // glowing outline at the screen edge (optional)
    chamber(.06, '#1b2233');      // closed box 60 mm deep (optional)
    for (let i = 0; i < 5; i++) {
      sphere((i - 2) * w * .18, Math.sin(i) * h * .2, -.02 - i * .008, size * .06, glow('#ffcf8a'));
    }
    const cone = add(new THREE.ConeGeometry(size * .1, .02, 6), material('#8fb3d9'), 0, -h * .3, -.03);
    cone.rotation.x = Math.PI / 2;
  },
};
```

`build` runs every time the scene is shown **and on every resize, orientation change, or screen-size setting change**. It must build from scratch each time and be deterministic. Use `Math.sin(i * 127.1)`-style pseudo-random values rather than `Math.random()`, so the scene doesn't reshuffle on resize.

### 2. Register it in `src/scenes/list.js`

```js
import lanterns from './lanterns.js';
// ...
const ALL = [light, relief, /* ... */, copperCircuit, lanterns];
```

Order in `ALL` doesn't matter. `SCENES` (the picker, gallery, and next/previous order) is `FAVOURITES` in the order given, then every other scene sorted alphabetically by `name`. The gallery shows the two groups as separate sections. The first favourite is the default scene on load. Only add a scene to `FAVOURITES` if the user asks.

You don't need to change anything else. The picker, gallery (with a thumbnail rendered from `build` at a 3:4 preview size), description text, and aria labels come from `SCENES`. The Node tests and the browser test iterate over every registered scene. The browser test also requires that each scene renders differently from the one before it.

### Coordinate system and units

- **Units are meters.** 1 mm = `.001`. Scenes are life-size: a 6.3" 20:9 phone is about 65.7 × 145.9 mm (`w ≈ .0657`, `h ≈ .1459` in portrait).
- The screen is the rectangle `x ∈ [-w/2, w/2]`, `y ∈ [-h/2, h/2]` on the plane **z = 0** (the glass).
- **Negative z is inside the phone**, and **positive z comes out toward the viewer**. Objects in front of the glass (z > 0) work but are clipped at the screen edges, so keep them small and centered (see `crystal.js`).
- `w` and `h` change with orientation (landscape swaps them) and with the diagonal setting. Always position things relative to `w`, `h`, or `size` (`min(w, h)`), never with fixed x/y values, so the scene fits in both orientations.
- Outside fullscreen the preview uses `h = .146` and a `w` that matches the preview's aspect ratio, so layouts must handle unusual aspect ratios.

### Kit helpers (`src/scenes/kit.js`)

All positions are the mesh's center. Every helper adds to the scene and returns the object, so you can set `.rotation` and `.scale` afterward.

| Helper | What it does |
| --- | --- |
| `material(color, metalness = .15, roughness = .45)` | New lit `MeshStandardMaterial` |
| `glow(color)` | New unlit `MeshBasicMaterial` (emissive look, ignores lights) |
| `add(geometry, mat, x, y, z)` | Add any Three.js geometry as a mesh |
| `box(x, y, z, width, height, depth, mat)` | Box centered at (x, y, z) |
| `sphere(x, y, z, radius, mat)` | Sphere |
| `ring(x, y, z, radius, tube, mat)` | Torus in the XY plane (facing the viewer) |
| `lines(points, color, opacity = 1)` | Line segments; `points` is `[[x,y,z], ...]` in pairs |
| `chamber(depth, color)` | Back wall and four side walls enclosing the screen, `depth` meters deep |
| `screenFrame(color = '#92c8bd')` | Thin glowing outline just behind the screen edges |
| `THREE` | The Three.js module, for any other geometry |
| `room` | The `THREE.Group` being built, for adding objects directly |
| `w`, `h`, `size` | Screen width, height, and `min(w, h)` in meters |

Geometry notes:
- Cylinders and cones point along +y by default. Use `mesh.rotation.x = Math.PI / 2` to point them along +z, out of the screen.
- `PlaneGeometry` and `ShapeGeometry` already lie in the XY plane, parallel to the glass.

### Resource ownership

The app disposes all geometry, and any material on an object marked `userData.ownMaterial = true`, whenever the scene is rebuilt. Kit helpers mark objects for you. If you add an object directly with `room.add(...)`, set `obj.userData.ownMaterial = true` or its material will leak. Create materials inside `build`. Don't cache them at module level, because they are disposed on every rebuild.

### Lighting

Lighting is shared and lives in `src/main.js`: a hemisphere light plus two weak point lights near the screen. The background is `#081a20`. Scenes normally don't add lights. Use `glow()` for anything that should look self-lit.

### Animation and interaction (optional)

`build` may return an object; every method is optional:

```js
return {
  update(dt, time, gravity) {}, // every frame, before render; seconds
  pointerDown(p) { return true; }, // return true to claim the pointer (no view drag or controls toggle)
  pointerMove(p) {},         // only while a claimed pointer is down
  pointerUp(p) {},           // p is null if the pointer was cancelled
};
```

`p` is `{ ray, x, y }`: a `THREE.Raycaster` from the eye through the pointer, and where that ray meets the glass (z = 0). Animate by changing transforms or material colors in `update`. Don't create geometry every frame. State that should survive a rebuild (such as a toggle or slider value) can live in plain module-level variables. See `app-interface.js`.

`gravity` is a read-only `THREE.Vector3` in screen coordinates (m/s²), or `null` when motion samples are unavailable or stale. It comes from the accelerometer in every tracking mode and is independent of view calibration. A stationary, face-up phone on a level surface has gravity along -z. Don't retain the vector: the app reuses it every frame.

### Checklist

1. `src/scenes/<id>.js` exports `{ id, name, description, build }`.
2. It is imported and added to `ALL` in `src/scenes/list.js`.
3. `npm test` and `npm run test:browser` pass.
4. Look at it with `npm run dev` in both portrait and landscape.
5. Commit and push.
