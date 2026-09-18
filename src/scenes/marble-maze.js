export default {
  id: 'marble-maze',
  name: 'Marble maze',
  description: 'Tilt to roll the marble through a wooden maze to the copper ring. Flat is level, regardless of calibration. Requires motion sensors, in any tracking mode.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, lines }) {
    const boardW = w * .88, boardH = h * .86;
    const cols = Math.min(13, Math.max(5, Math.round(w / size * 5)));
    const rows = Math.min(13, Math.max(5, Math.round(h / size * 5)));
    const cw = boardW / cols, ch = boardH / rows, cell = Math.min(cw, ch);
    const radius = cell * .22, thickness = cell * .12;
    const floorZ = -size * .14, wallHeight = radius * 2.4;
    const left = -boardW / 2, bottom = -boardH / 2;
    const wood = material('#ac7747', .05, .68);
    const rail = material('#d7b47b', .22, .38);
    const edging = material('#594132', .2, .55);
    const brass = material('#d9b86e', .7, .3);
    box(0, 0, floorZ - size * .025, boardW + size * .06, boardH + size * .06, size * .05, edging);
    box(0, 0, floorZ - size * .008, boardW, boardH, size * .016, wood);

    // Subtle grain is geometry, so the board remains crisp at phone scale.
    const grain = [];
    for (let i = 1; i < 60; i++) {
      const x = left + boardW * i / 60;
      for (let j = 0; j < 8; j++) {
        const y = bottom + boardH * j / 8;
        const bend = Math.sin(i * 2.7 + j * .8) * cell * .025;
        const nextBend = Math.sin(i * 2.7 + (j + 1) * .8) * cell * .025;
        grain.push([x + bend, y, floorZ + .00001], [x + nextBend, y + boardH / 8, floorZ + .00001]);
      }
    }
    lines(grain, '#704825', .22);

    // Seeded depth-first carving gives a connected maze with exactly one route
    // between each pair of cells, reproduced identically on every rebuild.
    let seed = 7319;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const cells = Array.from({ length: rows * cols }, () => ({ top: true, right: true, visited: false }));
    const stack = [0];
    cells[0].visited = true;
    while (stack.length) {
      const index = stack.at(-1), x = index % cols, y = Math.floor(index / cols);
      const neighbors = [];
      if (x > 0 && !cells[index - 1].visited) neighbors.push(index - 1);
      if (x < cols - 1 && !cells[index + 1].visited) neighbors.push(index + 1);
      if (y > 0 && !cells[index - cols].visited) neighbors.push(index - cols);
      if (y < rows - 1 && !cells[index + cols].visited) neighbors.push(index + cols);
      if (!neighbors.length) { stack.pop(); continue; }
      const next = neighbors[Math.floor(random() * neighbors.length)];
      if (next === index + 1) cells[index].right = false;
      else if (next === index - 1) cells[next].right = false;
      else if (next === index + cols) cells[index].top = false;
      else cells[next].top = false;
      cells[next].visited = true;
      stack.push(next);
    }

    const walls = [];
    function wall(x, y, width, height, outer = false) {
      walls.push({ minX: x - width / 2, maxX: x + width / 2, minY: y - height / 2, maxY: y + height / 2 });
      box(x, y, floorZ + wallHeight / 2, width, height, wallHeight, outer ? edging : rail);
      box(x, y, floorZ + wallHeight + thickness * .08, width * .8, height * .8, thickness * .16, brass);
    }
    wall(left, 0, thickness, boardH + thickness, true);
    wall(-left, 0, thickness, boardH + thickness, true);
    wall(0, bottom, boardW + thickness, thickness, true);
    wall(0, -bottom, boardW + thickness, thickness, true);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const cellWalls = cells[y * cols + x];
      if (x < cols - 1 && cellWalls.right) wall(left + (x + 1) * cw, bottom + (y + .5) * ch, thickness, ch + thickness);
      if (y < rows - 1 && cellWalls.top) wall(left + (x + .5) * cw, bottom + (y + 1) * ch, cw + thickness, thickness);
    }
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      const sx = x * (boardW / 2 + size * .017), sy = y * (boardH / 2 + size * .017);
      const screw = add(new THREE.CylinderGeometry(size * .008, size * .008, size * .004, 12), brass, sx, sy, floorZ);
      screw.rotation.x = Math.PI / 2;
      box(sx, sy, floorZ + size * .0021, size * .011, size * .0018, size * .0004, edging);
    }
    const startX = left + cw / 2, startY = bottom + ch / 2;
    const goalX = -left - cw / 2, goalY = -bottom - ch / 2;
    ring(startX, startY, floorZ + radius * .035, radius * 1.35, radius * .055, material('#648b7c'));
    const goalMaterial = glow('#d87845');
    ring(goalX, goalY, floorZ + radius * .05, radius * 1.45, radius * .11, goalMaterial);
    ring(goalX, goalY, floorZ + radius * .05, radius * .8, radius * .055, goalMaterial);
    const marble = sphere(startX, startY, floorZ + radius, radius,
      new THREE.MeshPhysicalMaterial({ color: '#a5eadc', metalness: .3, roughness: .16, clearcoat: 1 }));
    // Inlaid bands make the actual rolling rotation visible without a texture.
    for (const tilt of [-.55, .55]) {
      const band = ring(0, 0, 0, radius * .985, radius * .025, material('#237c7d', .35, .25));
      marble.add(band);
      band.rotation.x = tilt;
      band.rotation.y = .65;
    }
    const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#362b22', transparent: true, opacity: .28, depthWrite: false });
    const shadow = add(new THREE.CircleGeometry(radius * 1.12, 32), shadowMaterial, startX, startY, floorZ + radius * .025);

    let x = startX, y = startY, vx = 0, vy = 0, accumulator = 0;
    let gx = 0, gy = 0, hasGravity = false, finished = false;
    const step = 1 / 240, rotationAxis = new THREE.Vector3();
    function collide() {
      // Circle-versus-box contact preserves tangential velocity at walls and
      // gives rounded corner contacts instead of snagging on expanded boxes.
      for (let pass = 0; pass < 3; pass++) for (const wall of walls) {
        const px = Math.max(wall.minX, Math.min(wall.maxX, x));
        const py = Math.max(wall.minY, Math.min(wall.maxY, y));
        const dx = x - px, dy = y - py, distance = Math.hypot(dx, dy);
        if (distance >= radius) continue;
        let nx, ny, penetration;
        if (distance > 1e-10) {
          nx = dx / distance; ny = dy / distance; penetration = radius - distance;
        } else {
          const sides = [x - wall.minX, wall.maxX - x, y - wall.minY, wall.maxY - y];
          const nearest = sides.indexOf(Math.min(...sides));
          nx = nearest === 0 ? -1 : nearest === 1 ? 1 : 0;
          ny = nearest === 2 ? -1 : nearest === 3 ? 1 : 0;
          penetration = radius + sides[nearest];
        }
        x += nx * penetration; y += ny * penetration;
        const incoming = vx * nx + vy * ny;
        if (incoming < 0) {
          const restitution = incoming < -.015 ? .24 : 0;
          vx -= (1 + restitution) * incoming * nx;
          vy -= (1 + restitution) * incoming * ny;
        }
      }
    }
    return {
      update(dt, time, gravity) {
        // No synthetic gravity or pointer substitute when sensor samples stop.
        if (!gravity) {
          vx = vy = accumulator = 0;
          hasGravity = false;
          return;
        }
        const elapsed = Math.max(0, Math.min(dt, .05));
        const smoothing = hasGravity ? 1 - Math.exp(-elapsed * 25) : 1;
        gx += (gravity.x - gx) * smoothing;
        gy += (gravity.y - gy) * smoothing;
        hasGravity = true;
        const magnitude = Math.hypot(gx, gy);
        const force = magnitude > 0 ? Math.min(magnitude, 9.81) / magnitude : 0;
        // A solid rolling sphere accelerates at 5/7 of the downhill gravity.
        const ax = gx * force * 5 / 7, ay = gy * force * 5 / 7;
        accumulator += elapsed;
        while (accumulator >= step) {
          accumulator -= step;
          vx += ax * step; vy += ay * step;
          // Viscous rolling drag has no static threshold: even tiny tilts move it.
          const friction = Math.exp(-1.8 * step);
          vx *= friction; vy *= friction;
          // Bound travel per collision check to prevent tunnelling, even after
          // a steep tilt or a slow frame, without imposing an artificial speed cap.
          const substeps = Math.max(1, Math.ceil(Math.hypot(vx, vy) * step / (radius * .4)));
          const subdt = step / substeps;
          for (let i = 0; i < substeps; i++) {
            const oldX = x, oldY = y;
            x += vx * subdt; y += vy * subdt;
            collide();
            const dx = x - oldX, dy = y - oldY, travel = Math.hypot(dx, dy);
            if (travel > 1e-10) {
              rotationAxis.set(-dy / travel, dx / travel, 0);
              marble.rotateOnWorldAxis(rotationAxis, travel / radius);
            }
          }
        }
        marble.position.set(x, y, floorZ + radius);
        shadow.position.set(x, y, shadow.position.z);
        if (!finished && Math.hypot(x - goalX, y - goalY) < radius * .9) {
          finished = true;
          goalMaterial.color.set('#81f5c3');
        }
      },
    };
  },
};
