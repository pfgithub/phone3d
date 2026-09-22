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

**Install as an app.** Parallax is a progressive web app. In Chrome on Android, open the site and choose **⋮ → Add to Home screen → Install** (Chrome may also offer an install banner). The installed app launches fullscreen from its own icon and works offline after the first visit. Face tracking also works offline once you've used it online, because its runtime and model are cached then. The manifest, icons, and service worker live in `public/`. The service worker is only registered in production builds.

Choose **Marble maze** in the gallery to roll a marble through a randomly generated wooden maze to the copper ring, avoiding the pits; reaching the ring deals a new maze and falling in a pit returns the marble to the start. Its physics uses accelerometer gravity independently of view calibration, including in touch and face tracking modes. A flat phone is level; every tilt contributes, with no dead zone. Allow motion access when prompted. Without motion samples the marble stays still; touch only changes the view.

### Face tracking mode

Tap **Open with face tracking** (or choose it under **Head tracking** in settings). The front camera finds your eye, so the phone can move, tilt, and change distance freely without calibration. Close your left eye; the right eye is tracked by default.

Defaults are set for a **Pixel 9a**: 6.3" display, 96.1° diagonal front-camera field of view (4:3 sensor), lens 4.5 mm below the top edge of the display, 63 mm eye spacing. If depth feels too strong or too weak, set your own interpupillary distance (IPD). If sideways motion feels off, adjust the camera field of view. The camera needs HTTPS, and video never leaves the device. The MediaPipe runtime and model are loaded from jsDelivr and Google's model storage on first use.

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

**Face tracking.** MediaPipe Face Landmarker gives both iris centers in the camera image. Each becomes a ray from the camera lens, whose position is known in screen coordinates and rotates with screen orientation. Both eyes are placed on their rays, `IPD` apart, with the line between them perpendicular to the gaze toward the screen center. This fixes the distance even when you view the phone off-axis. The chosen eye, after One Euro filtering, becomes `e` directly.

In motion-sensor mode this is a single-view motion-parallax illusion, not binocular stereo or head tracking. Phone translation, head movement, sensor drift, sensor latency, incorrect physical dimensions, and rotation around a different pivot reduce accuracy. Calibration resets the orientation reference; it does not measure eye position. Tests cover geometry and synthetic browser events; real Android sensor behavior and visual alignment still require hardware validation.

References: [W3C Device Orientation](https://www.w3.org/TR/orientation-event/), [Three.js Matrix4 projection](https://threejs.org/docs/pages/Matrix4.html).
