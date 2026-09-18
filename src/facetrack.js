import { MathUtils, Vector3 } from 'three';

// Front-camera face tracking. The camera measures where the eye is relative to
// the screen, so the phone can move freely. Units are meters, screen axes
// (x right, y up, +z toward the viewer), origin at the screen center.

// Pixel 9a: 6.3" 1080×2424 display, 13 MP front camera with a 96.1° diagonal
// field of view on a 4:3 sensor, punch-hole centered about 4.5 mm below the
// top edge of the display.
export const PIXEL_9A = { cameraFov: 96.1, cameraFromTop: .0045, ipd: .063, eye: 'right' };

// MediaPipe face mesh iris centers. Which is which depends on mirroring, so
// eyeFromIrises tells them apart geometrically.
const IRISES = [468, 473];

// Half-angle tangents of a stream center-cropped from a 4:3 sensor with the
// given diagonal field of view. Returned in video (= current screen) axes.
export function cameraHalfTangents(diagonalFovDeg, videoWidth, videoHeight) {
  const f = 2.5 / Math.tan(MathUtils.degToRad(diagonalFovDeg) / 2);
  const aspect = Math.max(videoWidth, videoHeight) / Math.min(videoWidth, videoHeight);
  const long = aspect >= 4 / 3 ? 4 : 3 * aspect;
  const short = long / aspect;
  const tanLong = long / 2 / f, tanShort = short / 2 / f;
  return videoWidth >= videoHeight ? { x: tanLong, y: tanShort } : { x: tanShort, y: tanLong };
}

// Camera lens position in current screen coordinates. In natural portrait it
// sits above the center; screenAngle rotates it with the viewport.
export function cameraPosition(width, height, fromTop, screenAngle = 0) {
  const c = Math.max(width, height) / 2 - fromTop;
  const a = MathUtils.degToRad(screenAngle);
  return new Vector3(-c * Math.round(Math.sin(a) * 1e9) / 1e9, c * Math.round(Math.cos(a) * 1e9) / 1e9, 0);
}

// Unit ray from the camera through normalized image point (u, v), with u to the
// right and v down in the unmirrored frame. The front camera faces the viewer,
// so image right is screen left.
export function cameraRay(u, v, tan) {
  return new Vector3(-(u - .5) * 2 * tan.x, -(v - .5) * 2 * tan.y, 1).normalize();
}

// Places both eyes on their camera rays, assuming they are `ipd` apart and that
// the line between them is perpendicular to the gaze toward the screen center
// (true whenever you are looking at the screen, whatever the phone's pose).
export function eyesFromRays(rayA, rayB, camera, ipd) {
  let gaze = rayA.clone().add(rayB).normalize();
  const a = new Vector3(), b = new Vector3();
  for (let i = 0; i < 8; i++) {
    const k = rayA.dot(gaze) / rayB.dot(gaze);
    const s = ipd / rayB.clone().multiplyScalar(k).sub(rayA).length();
    a.copy(rayA).multiplyScalar(s).add(camera);
    b.copy(rayB).multiplyScalar(s * k).add(camera);
    // Gaze runs from the screen center (the origin) to the eye midpoint.
    gaze = a.clone().add(b).normalize();
  }
  return [a, b];
}

// Full pipeline: two iris centers in normalized image coordinates → eye
// position in screen coordinates for the chosen eye ('right', 'left', 'center').
export function eyeFromIrises(irisA, irisB, { width, height, videoWidth, videoHeight, screenAngle = 0, cameraFov, cameraFromTop, ipd, eye = 'right' }) {
  const tan = cameraHalfTangents(cameraFov, videoWidth, videoHeight);
  const camera = cameraPosition(width, height, cameraFromTop, screenAngle);
  const [a, b] = eyesFromRays(cameraRay(irisA.x, irisA.y, tan), cameraRay(irisB.x, irisB.y, tan), camera, ipd);
  // Facing the screen, the viewer's right is screen +x.
  const [left, right] = a.x < b.x ? [a, b] : [b, a];
  return eye === 'left' ? left : eye === 'center' ? left.add(right).multiplyScalar(.5) : right;
}

// One Euro filter: steady when still, low latency when moving.
export class OneEuroVector {
  constructor(minCutoff = 1.2, beta = 30, dCutoff = 1) { Object.assign(this, { minCutoff, beta, dCutoff }); this.reset(); }
  reset() { this.value = null; this.speed = new Vector3(); this.time = 0; }
  filter(x, time) {
    if (!this.value || time - this.time > .5) { this.value = x.clone(); this.speed.set(0, 0, 0); this.time = time; return this.value.clone(); }
    const dt = Math.max(time - this.time, 1e-3); this.time = time;
    const alpha = cutoff => 1 / (1 + 1 / (2 * Math.PI * cutoff * dt));
    this.speed.lerp(x.clone().sub(this.value).divideScalar(dt), alpha(this.dCutoff));
    this.value.lerp(x, alpha(this.minCutoff + this.beta * this.speed.length()));
    return this.value.clone();
  }
}

const VERSION = '1.0.1';
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// Returns { detect(video, timeMs) → [irisA, irisB] | null, close() }.
// Tests can supply window.parallaxFaceTracker to replace MediaPipe.
export async function createFaceTracker() {
  if (typeof window !== 'undefined' && window.parallaxFaceTracker) return window.parallaxFaceTracker();
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(WASM);
  const create = delegate => FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numFaces: 1,
  });
  const landmarker = await create('GPU').catch(() => create('CPU'));
  return {
    detect(video, time) {
      const face = landmarker.detectForVideo(video, time).faceLandmarks[0];
      return face ? IRISES.map(i => face[i]) : null;
    },
    close() { landmarker.close(); },
  };
}
