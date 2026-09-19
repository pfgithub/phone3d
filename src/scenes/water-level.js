// A sealed chamber partly filled with water. Each frame the surface plane is
// solved so the enclosed volume stays fixed for any gravity direction.
export function waterLevel({ id, name, description, depth, fill = .35 }) {
  return {
    id,
    name,
    description,
    build({ THREE, w, h, size, material, glow, add, box, sphere, lines, chamber }) {
      chamber(depth, '#153b4e');
      const rim = size * .045, steel = material('#809eaa', .8, .3);
      for (const s of [-1, 1]) {
        box(s * (w - rim) / 2, 0, -depth / 2, rim, h, depth, steel);
        box(0, s * (h - rim) / 2, -depth / 2, w, rim, depth, steel);
        for (const t of [-1, 1]) sphere(s * (w / 2 - rim / 2), t * (h / 2 - rim / 2), -.0005, size * .014, steel);
      }
      const grid = [];
      for (let i = -4; i <= 4; i++) {
        grid.push([-w * .43, i * h * .095, -depth + .0005], [w * .43, i * h * .095, -depth + .0005]);
        grid.push([i * w * .095, -h * .43, -depth + .0005], [i * w * .095, h * .43, -depth + .0005]);
      }
      lines(grid, '#5a8998', .4);
      // Inset the water from the rim, back wall, and glass so no faces are coplanar.
      const gap = .0004;
      const half = new THREE.Vector3(w / 2 - rim - gap, h / 2 - rim - gap, depth / 2 - .001);
      const center = new THREE.Vector3(0, 0, -depth / 2);
      const corners = [];
      for (let z = -1; z <= 1; z += 2) for (let y = -1; y <= 1; y += 2) for (let x = -1; x <= 1; x += 2) {
        corners.push(new THREE.Vector3(x * half.x, y * half.y, z * half.z));
      }
      const faces = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
      const volumeGeometry = new THREE.BufferGeometry();
      volumeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(180 * 3), 3));
      const surfaceGeometry = new THREE.BufferGeometry();
      surfaceGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(36 * 3), 3));
      const liquid = material('#219eb8', .15, .2);
      liquid.transparent = true; liquid.opacity = .56; liquid.depthWrite = false; liquid.side = THREE.DoubleSide;
      const top = material('#68e7eb', .3, .16);
      top.transparent = true; top.opacity = .8; top.side = THREE.DoubleSide;
      const volume = add(volumeGeometry, liquid, 0, 0, center.z);
      const surface = add(surfaceGeometry, top, 0, 0, center.z);
      volume.frustumCulled = false; surface.frustumCulled = false;
      volume.renderOrder = 1; surface.renderOrder = 2;
      const n = new THREE.Vector3(0, 1, 0), target = n.clone();
      const u = new THREE.Vector3(), v = new THREE.Vector3(), axis = new THREE.Vector3(0, 0, 1), up = new THREE.Vector3(0, 1, 0);
      const ta = new THREE.Vector3(), tb = new THREE.Vector3(), area = new THREE.Vector3(), total = new THREE.Vector3();
      const centroid = new THREE.Vector3(), dir = new THREE.Vector3();
      const corkRadius = Math.min(size * .032, half.z * .6);
      const corks = Array.from({ length: 4 }, (_, i) => {
        const cork = sphere(0, 0, center.z, corkRadius, material(['#bd8446', '#d9a568', '#a46e3c', '#e3b67a'][i], 0, .95));
        cork.scale.z = .55;
        return cork;
      });
      const targetVolume = fill * 8 * half.x * half.y * half.z;
      const polygons = [], cap = [];

      // Clip each cabinet face to the water side of the plane n·p = d.
      function clip(d) {
        polygons.length = 0; cap.length = 0;
        for (const face of faces) {
          const polygon = [];
          for (let j = 0; j < face.length; j++) {
            const a = corners[face[j]], b = corners[face[(j + 1) % face.length]];
            const da = n.dot(a) - d, db = n.dot(b) - d;
            if (da <= 0) polygon.push(a);
            if ((da <= 0) !== (db <= 0)) {
              const p = a.clone().lerp(b, da / (da - db));
              polygon.push(p);
              if (!cap.some(q => q.distanceToSquared(p) < 1e-14)) cap.push(p);
            }
          }
          if (polygon.length > 2) polygons.push(polygon);
        }
      }
      // Divergence theorem: V = (Σ area·distance over the clipped faces + cap area · d) / 3.
      // The cap's area is the length of the summed face vector areas (a closed surface sums to zero).
      function waterVolume(d) {
        clip(d);
        let sum = 0;
        total.set(0, 0, 0);
        for (const p of polygons) {
          area.set(0, 0, 0);
          for (let j = 1; j < p.length - 1; j++) area.add(ta.subVectors(p[j], p[0]).cross(tb.subVectors(p[j + 1], p[0])));
          area.multiplyScalar(.5);
          sum += Math.abs(area.dot(p[0]));
          total.add(area);
        }
        return (sum + total.length() * d) / 3;
      }
      function level() {
        const reach = Math.abs(n.x) * half.x + Math.abs(n.y) * half.y + Math.abs(n.z) * half.z;
        let lo = -reach, hi = reach;
        for (let i = 0; i < 32; i++) {
          const mid = (lo + hi) / 2;
          if (waterVolume(mid) < targetVolume) lo = mid; else hi = mid;
        }
        return (lo + hi) / 2;
      }
      function rebuild(time) {
        u.crossVectors(Math.abs(n.z) < .9 ? axis : up, n).normalize();
        v.crossVectors(n, u).normalize();
        const d = level();
        clip(d);
        let count = 0;
        const pos = volumeGeometry.attributes.position;
        for (const polygon of polygons) {
          for (let j = 1; j < polygon.length - 1; j++) for (const p of [polygon[0], polygon[j], polygon[j + 1]]) {
            pos.setXYZ(count++, p.x, p.y, p.z);
          }
        }
        volumeGeometry.setDrawRange(0, count); pos.needsUpdate = true;
        volumeGeometry.computeVertexNormals();
        centroid.set(0, 0, 0);
        for (const p of cap) centroid.add(p);
        if (cap.length) centroid.divideScalar(cap.length);
        cap.sort((a, b) => Math.atan2(ta.subVectors(a, centroid).dot(v), ta.dot(u)) - Math.atan2(tb.subVectors(b, centroid).dot(v), tb.dot(u)));
        count = 0;
        const surf = surfaceGeometry.attributes.position;
        for (let j = 1; j < cap.length - 1; j++) for (const p of [cap[0], cap[j], cap[j + 1]]) surf.setXYZ(count++, p.x, p.y, p.z);
        surfaceGeometry.setDrawRange(0, count); surf.needsUpdate = true;
        surfaceGeometry.computeVertexNormals();
        corks.forEach((cork, i) => {
          const angle = i * Math.PI / 2 + .6 + time * .13;
          dir.copy(u).multiplyScalar(Math.cos(angle)).addScaledVector(v, Math.sin(angle));
          // Furthest the cork can drift from the surface's centre along dir without touching a wall.
          let reach = Infinity;
          for (const k of ['x', 'y', 'z']) {
            if (Math.abs(dir[k]) > 1e-6) reach = Math.min(reach, (half[k] - corkRadius - Math.sign(dir[k]) * centroid[k]) / Math.abs(dir[k]));
          }
          cork.position.copy(center).add(centroid).addScaledVector(dir, Math.max(0, reach) * (.45 + .2 * Math.sin(i * 1.7)))
            .addScaledVector(n, .0007 + Math.sin(time * 2.2 + i) * .00025);
          cork.quaternion.setFromUnitVectors(axis, n);
        });
      }
      rebuild(0);
      const glass = glow('#bdebf1'); glass.transparent = true; glass.opacity = .035; glass.depthWrite = false;
      add(new THREE.PlaneGeometry(w - 2 * rim, h - 2 * rim), glass, 0, 0, 0).renderOrder = 3;
      return {
        update(dt, time, gravity) {
          if (gravity && gravity.lengthSq() > .1) target.copy(gravity).normalize().negate();
          n.lerp(target, 1 - Math.exp(-Math.min(dt, .05) * 6));
          if (n.lengthSq() < .001) n.copy(target);
          n.normalize();
          rebuild(time);
        },
      };
    },
  };
}

export default waterLevel({
  id: 'water-level',
  name: 'Water level',
  description: 'A sealed 20 mm chamber, about a third full. Tilt it and the level shifts to keep the same volume of water while corks ride its surface.',
  depth: .02,
});
