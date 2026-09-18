import { Euler, MathUtils, Quaternion, Vector3 } from 'three';

// All scene units are meters. The display is the z=0 plane, front is +z.
export function screenDimensions(diagonalInches = 6.3, landscape = false) {
  const diagonal = diagonalInches * 0.0254;
  const short = diagonal * 9 / Math.hypot(20, 9);
  const long = diagonal * 20 / Math.hypot(20, 9);
  return { width: landscape ? long : short, height: landscape ? short : long };
}

// W3C device orientation: intrinsic Z(alpha), X(beta), Y(gamma).
// Screen rotation maps current viewport coordinates into native device axes.
export function orientationQuaternion(alpha, beta, gamma, screenAngle = 0) {
  const d = MathUtils.degToRad;
  return new Quaternion().setFromEuler(new Euler(d(beta), d(gamma), d(alpha), 'ZXY'))
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -d(screenAngle)));
}

export function eyeFromOrientation(current, baseline, distance) {
  return new Vector3(0, 0, distance).applyQuaternion(baseline).applyQuaternion(current.clone().invert());
}

// An asymmetric frustum projects the four physical display corners to the
// viewport corners for ANY eye position. Camera axes remain parallel to screen.
export function applyWindowProjection(camera, eye, width, height) {
  camera.position.copy(eye);
  camera.quaternion.identity();
  const near = Math.min(0.005, eye.z * 0.5);
  const scale = near / eye.z;
  camera.projectionMatrix.makePerspective(
    (-width / 2 - eye.x) * scale, (width / 2 - eye.x) * scale,
    (height / 2 - eye.y) * scale, (-height / 2 - eye.y) * scale,
    near, 5,
  );
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld();
}
