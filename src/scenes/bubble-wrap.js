export default {
  id: 'bubble-wrap',
  name: 'Bubble wrap',
  description: 'Tap or sweep across bubbles rising 3 mm out of a plastic sheet at the glass. Pop the whole sheet and a fresh one slides in from behind.',
  build({ THREE, w, h, size, room, material, glow, add, box, ring, lines, chamber }) {
    chamber(.035, '#426979');
    const rim = size * .027, edge = material('#acc8d0', .5, .32);
    for (const side of [-1, 1]) {
      box(side * (w - rim) / 2, 0, -.002, rim, h, .004, edge);
      box(0, side * (h - rim) / 2, -.002, w, rim, .004, edge);
    }
    const grid = [];
    for (let i = -5; i <= 5; i++) {
      grid.push([i * w * .09, -h * .46, -.03], [i * w * .09, h * .46, -.03]);
      grid.push([-w * .46, i * h * .09, -.03], [w * .46, i * h * .09, -.03]);
    }
    lines(grid, '#8db4bd', .55);
    const cols = Math.min(12, Math.max(3, Math.floor(w * .85 / (size * .18))));
    const rows = Math.min(16, Math.max(3, Math.floor(h * .85 / (size * .18))));
    const sx = w * .85 / cols, sy = h * .85 / rows, radius = Math.min(sx, sy) * .41;
    function makeSheet() {
      const group = new THREE.Group(); room.add(group);
      // Opaque film at z = 0 occludes the chamber except through the bubble openings.
      const plastic = material('#d5edf1', .25, .22); plastic.side = THREE.DoubleSide;
      const film = new THREE.Shape();
      film.moveTo(-w * .46, -h * .46); film.lineTo(w * .46, -h * .46); film.lineTo(w * .46, h * .46); film.lineTo(-w * .46, h * .46); film.closePath();
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        const hole = new THREE.Path();
        hole.absarc((col - (cols - 1) / 2) * sx, (row - (rows - 1) / 2) * sy, radius, 0, Math.PI * 2, true);
        film.holes.push(hole);
      }
      const base = add(new THREE.ShapeGeometry(film, 10), plastic, 0, 0, 0); group.add(base);
      const bubbles = [];
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        const x = (col - (cols - 1) / 2) * sx, y = (row - (rows - 1) / 2) * sy;
        const geometry = new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        geometry.rotateX(Math.PI / 2); geometry.scale(radius, radius, .003);
        const film = material('#cfedf3', .38, .16); film.transparent = true; film.opacity = .7; film.side = THREE.DoubleSide;
        const dome = add(geometry, film, x, y, 0); group.add(dome);
        const seam = ring(x, y, -.0001, radius, size * .003, glow('#a5cbd5')); group.add(seam);
        const highlight = add(new THREE.TorusGeometry(radius * .55, size * .004, 5, 16, Math.PI * .65), glow('#f2ffff'), x, y, .0025);
        highlight.rotation.z = .7; group.add(highlight);
        const rippleMat = glow('#eaffff'); rippleMat.transparent = true; rippleMat.opacity = 0; rippleMat.depthWrite = false;
        const ripple = ring(x, y, .0002, radius * .7, size * .003, rippleMat); group.add(ripple);
        bubbles.push({ dome, highlight, seam, ripple, popped: false, pulse: 0 });
      }
      return { group, bubbles, count: 0 };
    }
    const sheets = [makeSheet(), makeSheet()];
    sheets[1].group.visible = false;
    let current = 0, held = false, transition = -1;
    function fresh(sheet) {
      sheet.count = 0;
      for (const b of sheet.bubbles) {
        b.popped = false; b.pulse = 0; b.dome.scale.z = 1; b.dome.material.color.set('#cfedf3');
        b.highlight.visible = true; b.ripple.material.opacity = 0;
      }
    }
    function pop(p) {
      if (transition >= 0) return;
      room.updateMatrixWorld(true);
      const sheet = sheets[current];
      const hit = p.ray.intersectObjects(sheet.bubbles.filter(b => !b.popped).map(b => b.dome), false)[0];
      if (!hit) return;
      const b = sheet.bubbles.find(bubble => bubble.dome === hit.object);
      b.popped = true; b.pulse = 1; b.highlight.visible = false; b.dome.material.color.set('#779ca9'); sheet.count++;
      if (sheet.count === sheet.bubbles.length) {
        transition = 0; held = false;
        const next = sheets[1 - current]; fresh(next); next.group.position.set(0, -h * .15, -.028);
      }
    }
    return {
      pointerDown(p) { held = true; pop(p); return true; },
      pointerMove(p) { if (held) pop(p); },
      pointerUp() { held = false; },
      update(dt) {
        dt = Math.min(dt, .05);
        for (const sheet of sheets) for (const b of sheet.bubbles) {
          if (b.popped) b.dome.scale.z += (.035 - b.dome.scale.z) * Math.min(1, dt * 28);
          b.pulse = Math.max(0, b.pulse - dt * 3.5);
          b.ripple.material.opacity = b.pulse * .8;
          b.ripple.scale.setScalar(1 + (1 - b.pulse) * .65);
        }
        if (transition >= 0) {
          transition += dt;
          const t = THREE.MathUtils.clamp((transition - .35) / .9, 0, 1), ease = t * t * (3 - 2 * t);
          const old = sheets[current], next = sheets[1 - current];
          old.group.position.set(w * ease * 1.25, 0, -.012 * ease);
          next.group.visible = t > 0;
          next.group.position.set(0, -h * .15 * (1 - ease), -.028 * (1 - ease));
          if (t >= 1) { old.group.visible = false; current = 1 - current; transition = -1; }
        }
      },
    };
  },
};
