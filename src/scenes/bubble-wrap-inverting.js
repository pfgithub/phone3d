export default {
  id: 'bubble-wrap-inverting',
  name: 'Bubble wrap — inverting',
  description: 'An opaque sheet at the glass. Tap or sweep the bubbles to turn raised bumps into dimples; press again to turn them back out.',
  build({ THREE, w, h, size, room, material, add, ring }) {
    const cols = Math.min(12, Math.max(3, Math.floor(w * .85 / (size * .18))));
    const rows = Math.min(16, Math.max(3, Math.floor(h * .85 / (size * .18))));
    const sx = w * .85 / cols, sy = h * .85 / rows;
    const radius = Math.min(sx, sy) * .41, depth = Math.min(size * .05, radius * .8);
    const plastic = material('#8bd4c4', .08, .32);
    plastic.side = THREE.DoubleSide;
    const seamMaterial = material('#6bb5a6', .08, .4);
    const film = new THREE.Shape();
    film.moveTo(-w * .46, -h * .46);
    film.lineTo(w * .46, -h * .46);
    film.lineTo(w * .46, h * .46);
    film.lineTo(-w * .46, h * .46);
    film.closePath();
    const centers = [];
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const x = (col - (cols - 1) / 2) * sx, y = (row - (rows - 1) / 2) * sy;
      const hole = new THREE.Path();
      hole.absarc(x, y, radius, 0, Math.PI * 2, true);
      film.holes.push(hole);
      centers.push({ x, y });
    }
    // Openings let the same opaque membrane move to either side of the sheet.
    add(new THREE.ShapeGeometry(film, 20), plastic, 0, 0, 0);
    const bubbles = centers.map(({ x, y }) => {
      const geometry = new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      geometry.rotateX(Math.PI / 2);
      geometry.scale(radius, radius, depth);
      const dome = add(geometry, plastic, x, y, 0);
      ring(x, y, 0, radius, size * .002, seamMaterial);
      return { dome, target: 1, start: 1, elapsed: .2 };
    });
    const domes = bubbles.map(b => b.dome);
    const byMesh = new Map(bubbles.map(b => [b.dome, b]));
    const visited = new Set();
    const sheetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const sheetPoint = new THREE.Vector3();
    let held = false;
    function invert(p) {
      room.updateMatrixWorld(true);
      const hit = p.ray.intersectObjects(domes, false)[0];
      let bubble = hit && byMesh.get(hit.object);
      // Keep a nearly flat bubble easy to press during its transition.
      if (!bubble && p.ray.ray.intersectPlane(sheetPlane, sheetPoint)) {
        bubble = bubbles.find(b => Math.hypot(sheetPoint.x - b.dome.position.x, sheetPoint.y - b.dome.position.y) <= radius);
      }
      if (!bubble || visited.has(bubble)) return;
      visited.add(bubble);
      bubble.start = bubble.dome.scale.z;
      bubble.target *= -1;
      bubble.elapsed = 0;
    }
    return {
      pointerDown(p) { held = true; visited.clear(); invert(p); return true; },
      pointerMove(p) { if (held) invert(p); },
      pointerUp() { held = false; visited.clear(); },
      update(dt) {
        for (const b of bubbles) {
          if (b.elapsed >= .2) continue;
          b.elapsed = Math.min(.2, b.elapsed + Math.min(dt, .05));
          const t = b.elapsed / .2, ease = t * t * (3 - 2 * t);
          const z = THREE.MathUtils.lerp(b.start, b.target, ease);
          // Avoid a singular world matrix when a bubble passes through flat.
          b.dome.scale.z = Math.abs(z) < .0001 ? (z < 0 ? -.0001 : .0001) : z;
        }
      },
    };
  },
};
