export default {
  id: 'water-level',
  name: 'Water level',
  description: 'A sealed 20 mm chamber, exactly half full. Tilt to level the water and watch the corks ride its surface.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, lines, chamber }) {
    chamber(.02, '#153b4e');
    const rim = size * .045, steel = material('#809eaa', .8, .3);
    for (const s of [-1, 1]) {
      box(s * (w - rim) / 2, 0, -.01, rim, h, .02, steel);
      box(0, s * (h - rim) / 2, -.01, w, rim, .02, steel);
      for (const t of [-1, 1]) sphere(s * (w / 2 - rim / 2), t * (h / 2 - rim / 2), -.0005, size * .014, steel);
    }
    const grid = [];
    for (let i = -4; i <= 4; i++) {
      grid.push([-w * .43, i * h * .095, -.0195], [w * .43, i * h * .095, -.0195]);
      grid.push([i * w * .095, -h * .43, -.0195], [i * w * .095, h * .43, -.0195]);
    }
    lines(grid, '#5a8998', .4);
    const half = new THREE.Vector3(w / 2 - rim, h / 2 - rim, .009);
    const center = new THREE.Vector3(0, 0, -.01);
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
    const u = new THREE.Vector3(), v = new THREE.Vector3(), axis = new THREE.Vector3(0, 0, 1);
    const corks = Array.from({ length: 4 }, (_, i) => {
      const cork = sphere(0, 0, -.01, size * .032, material(['#bd8446', '#d9a568', '#a46e3c', '#e3b67a'][i], 0, .95));
      cork.scale.z = .55;
      return cork;
    });
    // Clip every cabinet face against a plane through its centre. Central symmetry
    // makes the enclosed volume exactly one half for every gravity direction.
    function rebuild(time) {
      u.crossVectors(Math.abs(n.z) < .9 ? axis : new THREE.Vector3(0, 1, 0), n).normalize();
      v.crossVectors(n, u).normalize();
      const cap = [];
      let count = 0;
      const pos = volumeGeometry.attributes.position;
      for (const face of faces) {
        const polygon = [];
        for (let j = 0; j < face.length; j++) {
          const a = corners[face[j]], b = corners[face[(j + 1) % face.length]];
          const da = n.dot(a), db = n.dot(b);
          if (da <= 0) polygon.push(a);
          if ((da <= 0) !== (db <= 0)) {
            const p = a.clone().lerp(b, da / (da - db));
            polygon.push(p);
            if (!cap.some(q => q.distanceToSquared(p) < 1e-14)) cap.push(p);
          }
        }
        for (let j = 1; j < polygon.length - 1; j++) for (const p of [polygon[0], polygon[j], polygon[j + 1]]) {
          pos.setXYZ(count++, p.x, p.y, p.z);
        }
      }
      volumeGeometry.setDrawRange(0, count); pos.needsUpdate = true;
      volumeGeometry.computeVertexNormals();
      cap.sort((a, b) => Math.atan2(a.dot(v), a.dot(u)) - Math.atan2(b.dot(v), b.dot(u)));
      count = 0;
      const surf = surfaceGeometry.attributes.position;
      for (let j = 1; j < cap.length - 1; j++) for (const p of [cap[0], cap[j], cap[j + 1]]) surf.setXYZ(count++, p.x, p.y, p.z);
      surfaceGeometry.setDrawRange(0, count); surf.needsUpdate = true;
      surfaceGeometry.computeVertexNormals();
      const extent = direction => Math.min(...['x', 'y', 'z'].map(k => Math.abs(direction[k]) > 1e-6 ? half[k] / Math.abs(direction[k]) : Infinity));
      const eu = extent(u), ev = extent(v);
      corks.forEach((cork, i) => {
        const a = Math.sin(i * 2.4 + time * .13) * .38;
        const b = Math.cos(i * 2.4 + time * .13) * .38;
        cork.position.copy(center).addScaledVector(u, a * eu).addScaledVector(v, b * ev)
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
