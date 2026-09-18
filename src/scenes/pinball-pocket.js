export default {
  id: 'pinball-pocket',
  name: 'Pinball pocket',
  description: 'A 15 mm pocket table. Tap either half to flip; tilt to nudge. Glowing bumpers kick toward the glass.',
  build({ THREE, w, h, size, room, material, glow, add, box, sphere, ring, chamber }) {
    chamber(.015, '#102d39');
    const brass = material('#dba855', .7, .25);
    const edge = size * .045;
    box(0, 0, -.014, w, h, .002, material('#175260'));
    for (const side of [-1, 1]) {
      box(side * (w - edge) / 2, 0, -.0075, edge, h, .015, brass);
      box(0, side * (h - edge) / 2, -.0075, w, edge, .015, brass);
    }
    const radius = size * .034;
    const ball = sphere(w * .32, -h * .24, -.013 + radius, radius, material('#e7f2f4', .95, .13));
    const bumpers = [[-.22, .18], [.21, .28], [0, -.015]].map(([x, y], i) => {
      const r = size * .075;
      const stem = add(new THREE.CylinderGeometry(r, r, .01, 24), brass, x * w, y * h, -.008);
      stem.rotation.x = Math.PI / 2;
      const disc = sphere(x * w, y * h, -.003, r, material(['#ed6270', '#55d8ca', '#ffb856'][i], .5, .3));
      disc.scale.z = .003 / r;
      const halo = ring(x * w, y * h, -.0004, r * .82, size * .009, glow('#ffe5a0'));
      return { x: x * w, y: y * h, r, disc, halo, pop: 0 };
    });
    const flippers = [-1, 1].map(side => {
      const pivot = new THREE.Group();
      pivot.position.set(side * w * .28, -h * .31, -.009);
      room.add(pivot);
      const blade = box(0, 0, 0, w * .24, size * .05, .004, material('#ef7a69', .35));
      pivot.add(blade);
      blade.position.set(-side * w * .12, 0, 0);
      sphere(pivot.position.x, pivot.position.y, -.006, size * .027, brass);
      return { pivot, side, kick: 0, angle: side * .3 };
    });
    const lamps = Array.from({ length: 10 }, (_, i) => sphere((i - 4.5) * w * .065, h * .4, -.003,
      size * .012, glow('#28505a')));
    let vx = -size * .22, vy = h * .8, hits = 0, reset = 0;
    function collide(cx, cy, r, kick = 0) {
      const dx = ball.position.x - cx, dy = ball.position.y - cy;
      const d = Math.hypot(dx, dy), limit = radius + r;
      if (d >= limit) return false;
      const nx = d > 1e-8 ? dx / d : 0, ny = d > 1e-8 ? dy / d : 1;
      ball.position.x = cx + nx * limit;
      ball.position.y = cy + ny * limit;
      const toward = vx * nx + vy * ny;
      if (toward < 0) { vx -= 1.85 * toward * nx; vy -= 1.85 * toward * ny; }
      vx += nx * kick; vy += ny * kick;
      return true;
    }
    return {
      pointerDown(p) {
        flippers[p.x < 0 ? 0 : 1].kick = .22;
        return true;
      },
      update(dt, time, gravity) {
        dt = Math.min(dt, .05);
        for (const bumper of bumpers) {
          bumper.pop = Math.max(0, bumper.pop - dt * 5);
          bumper.disc.position.z = -.003 + bumper.pop * .002;
          bumper.halo.position.z = -.0004 + bumper.pop * .002;
          bumper.halo.material.color.set(bumper.pop > 0 ? '#ffffff' : '#ffe5a0');
        }
        for (const f of flippers) {
          f.kick = Math.max(0, f.kick - dt);
          const target = f.side * (f.kick > 0 ? -.65 : .3);
          f.angle += (target - f.angle) * Math.min(1, dt * 35);
          f.pivot.rotation.z = f.angle;
        }
        const steps = Math.max(1, Math.ceil(dt * 160)), step = dt / steps;
        for (let n = 0; n < steps; n++) {
          vx += (gravity?.x ?? 0) * .055 * step;
          vy += (-h * 1.4 + (gravity?.y ?? 0) * .055) * step;
          const speed = Math.hypot(vx, vy), max = size * 5;
          if (speed > max) { vx *= max / speed; vy *= max / speed; }
          ball.position.x += vx * step; ball.position.y += vy * step;
          const boundX = w / 2 - edge - radius, boundY = h / 2 - edge - radius;
          if (Math.abs(ball.position.x) > boundX) {
            ball.position.x = Math.sign(ball.position.x) * boundX;
            vx = -Math.sign(ball.position.x) * Math.abs(vx) * .86;
          }
          if (ball.position.y > boundY) { ball.position.y = boundY; vy = -Math.abs(vy); }
          for (const b of bumpers) if (collide(b.x, b.y, b.r, b.pop === 0 ? size * 1.6 : 0)) {
            if (b.pop === 0) { lamps[hits++ % lamps.length].material.color.set('#ffe5a0'); b.pop = 1; }
          }
          for (const f of flippers) {
            const ax = f.pivot.position.x, ay = f.pivot.position.y;
            const dx = -f.side * w * .24 * Math.cos(f.angle), dy = -f.side * w * .24 * Math.sin(f.angle);
            const t = THREE.MathUtils.clamp(((ball.position.x - ax) * dx + (ball.position.y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
            if (collide(ax + t * dx, ay + t * dy, size * .025) && f.kick > 0) {
              vy = h * 1.5; vx += -f.side * size * .3;
            }
          }
          if (ball.position.y < -boundY) {
            if (Math.abs(ball.position.x) > w * .13) { ball.position.y = -boundY; vy = Math.abs(vy) * .7; }
            else { reset += step; if (reset > .4) { ball.position.set(w * .32, -h * .24, -.013 + radius); vx = -size * .22; vy = h * 1.1; reset = 0; } }
          }
        }
      },
    };
  },
};
