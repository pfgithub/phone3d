export default {
  id: 'sand-timer-tray',
  name: 'Sand timer tray',
  description: 'Tilt to roll a steel ball through 3 mm of sand. Its grooves remain in the heightfield; tap to rake it flat.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, chamber }) {
    chamber(.007, '#66503c');
    const rim = size * .055, wood = material('#936442', .05, .72);
    for (const side of [-1, 1]) {
      box(side * (w - rim) / 2, 0, -.0035, rim, h, .007, wood);
      box(0, side * (h - rim) / 2, -.0035, w, rim, .007, wood);
    }
    const sw = w - rim * 2, sh = h - rim * 2;
    box(0, 0, -.005, sw, sh, .002, material('#bb945a', .02, 1));
    const nx = Math.min(130, Math.max(40, Math.round(sw / size * 85)));
    const ny = Math.min(180, Math.max(40, Math.round(sh / size * 85)));
    const geometry = new THREE.PlaneGeometry(sw, sh, nx, ny);
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const sand = material('#eed59b', .02, .96);
    sand.vertexColors = true;
    add(geometry, sand, 0, 0, -.001);
    function flatten() {
      for (let i = 0; i < positions.count; i++) {
        positions.setZ(i, Math.sin(positions.getX(i) / size * 430) * .000055);
        colors.set([1, 1, 1], i * 3);
      }
      positions.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    flatten();
    const radius = size * .038;
    const ball = sphere(-sw * .23, sh * .15, -.001 + radius - .0006, radius, material('#e2e7e6', 1, .15));
    const stripe = add(new THREE.TorusGeometry(radius * 1.002, radius * .025, 5, 32), material('#657782', .8, .3), 0, 0, 0);
    ball.add(stripe);
    const rake = box(0, sh / 2, -.0001, sw, size * .012, .0005, glow('#fff0c2'));
    rake.visible = false;
    let vx = 0, vy = 0, normalTime = 0, sweep = 0;
    function carve(x, y) {
      const reach = radius * 1.25;
      const minX = Math.max(0, Math.floor((x - reach + sw / 2) / sw * nx));
      const maxX = Math.min(nx, Math.ceil((x + reach + sw / 2) / sw * nx));
      const minY = Math.max(0, Math.floor((sh / 2 - y - reach) / sh * ny));
      const maxY = Math.min(ny, Math.ceil((sh / 2 - y + reach) / sh * ny));
      for (let row = minY; row <= maxY; row++) for (let col = minX; col <= maxX; col++) {
        const i = row * (nx + 1) + col;
        const d = Math.hypot(positions.getX(i) - x, positions.getY(i) - y) / reach;
        if (d >= 1) continue;
        const depth = -.00125 * Math.pow(Math.max(0, 1 - d * d), 2);
        if (depth < positions.getZ(i)) positions.setZ(i, depth);
        const shade = 1 + positions.getZ(i) * 230;
        colors.set([shade, shade, shade], i * 3);
      }
      positions.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    }
    carve(ball.position.x, ball.position.y);
    return {
      pointerDown() { flatten(); vx = 0; vy = 0; sweep = 1; return true; },
      update(dt, time, gravity) {
        dt = Math.min(dt, .05);
        const steps = Math.max(1, Math.ceil(dt * 120)), step = dt / steps;
        for (let i = 0; i < steps; i++) {
          vx = (vx + (gravity?.x ?? 0) * .15 * step) * Math.exp(-step * 2.8);
          vy = (vy + (gravity?.y ?? 0) * .15 * step) * Math.exp(-step * 2.8);
          const speed = Math.hypot(vx, vy), max = size * 1.5;
          if (speed > max) { vx *= max / speed; vy *= max / speed; }
          const ox = ball.position.x, oy = ball.position.y;
          ball.position.x = THREE.MathUtils.clamp(ox + vx * step, -sw / 2 + radius, sw / 2 - radius);
          ball.position.y = THREE.MathUtils.clamp(oy + vy * step, -sh / 2 + radius, sh / 2 - radius);
          if (Math.abs(ball.position.x) >= sw / 2 - radius) vx *= -.35;
          if (Math.abs(ball.position.y) >= sh / 2 - radius) vy *= -.35;
          const dx = ball.position.x - ox, dy = ball.position.y - oy;
          ball.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), dx / radius);
          ball.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -dy / radius);
          if (Math.abs(dx) + Math.abs(dy) > 1e-7) carve(ball.position.x, ball.position.y);
        }
        normalTime += dt;
        if (normalTime > .1) { geometry.computeVertexNormals(); normalTime = 0; }
        sweep = Math.max(0, sweep - dt * 1.6);
        rake.visible = sweep > 0;
        rake.position.y = sh * (sweep - .5);
      },
    };
  },
};
