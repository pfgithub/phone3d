# Parallax

A fullscreen, motion-tracked 3D window for Android Chrome, built with Three.js and Vite.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Desktop users can drag the room or choose **Explore with touch**.

Phone orientation sensors require a secure context. Serve the site over **HTTPS** when opening it over your network; plain `http://<computer-IP>:5173` provides only the drag preview. Alternatively, with an Android phone connected over USB and USB debugging enabled, run `adb reverse tcp:5173 tcp:5173` and open `http://localhost:5173` in Chrome on the phone.

```sh
npm test              # Physical geometry and rotation tests
npx playwright install chromium
npm run test:browser  # Browser interaction and synthetic sensor tests
npm run build        # Static production files in dist/
```

Deploy `dist/` to an HTTPS static host. There is no server-side component.

## Use on a phone

1. Tap **Open the window** to enter fullscreen and enable motion tracking.
2. Hold the center of the screen directly in front of your eyes, 30.48 cm (1 foot) away.
3. Tap **Calibrate** while the display faces you straight on.
4. Keep your head fixed and rotate the phone around the center of its display. Avoid translating it.
5. Hide the controls for the clearest view. Try one eye for a stronger illusion.

The settings dialog adjusts screen diagonal and eye distance. The aspect ratio is fixed at 20:9, with 6.3 inches as the default diagonal (approximately 65.7 × 145.9 mm). Landscape is supported; after a screen orientation change, hold it straight on and recalibrate. Fullscreen must fill the physical display for accurate scale; browser/device reserved areas can reduce accuracy.

## Geometry

The screen is a rectangle on z=0, with +z pointing toward the viewer. All scene units are meters. Virtual objects occupy the space behind the glass and rotate with the phone. At calibration, the world-space eye is `E = Q₀ · (0, 0, d)`, where `Q₀` is the initial orientation. Given current orientation `Q`, its screen-local position is `e = Q⁻¹ · E`.

The camera stays parallel to the display. Its asymmetric frustum at near distance `n` is:

```
left   = n * (-width/2  - e.x) / e.z
right  = n * ( width/2  - e.x) / e.z
bottom = n * (-height/2 - e.y) / e.z
top    = n * ( height/2 - e.y) / e.z
```

This keeps every point on the screen plane at the same display pixel as the phone rotates. A conventional look-at camera would distort that mapping. Quaternion conversion follows the W3C intrinsic Z–X–Y rotation order, corrected for the screen's orientation angle. Light frame-rate-independent smoothing reduces sensor jitter. At grazing angles past roughly 81°, rendering holds the last valid view and asks the viewer to face the screen.

This is a single-view motion-parallax illusion, not binocular stereo or head tracking. Phone translation, head movement, sensor drift, sensor latency, incorrect physical dimensions, and rotation around a different pivot reduce accuracy. Calibration resets the orientation reference; it does not measure eye position. Tests cover geometry and synthetic browser events; real Android sensor behavior and visual alignment still require hardware validation.

References: [W3C Device Orientation](https://www.w3.org/TR/orientation-event/), [Three.js Matrix4 projection](https://threejs.org/docs/pages/Matrix4.html).
