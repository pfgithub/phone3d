// Shared by both mazes: `raised` puts the floor on the glass so the walls stand out of the screen;
// otherwise the floor is inset behind the glass.
export function makeMarbleMaze({ id, name, description, raised = false }) {
  // Survives rebuilds (resize, orientation), so the current level is redrawn rather than reshuffled.
  let levelSeed = Math.floor(Math.random() * 4294967296);

  return {
    id,
    name,
    description,
    build({ THREE, room, w, h, size, material, glow, add, box, sphere, ring, lines }) {
      const boardW = w * .88, boardH = h * .86;
      const cols = Math.min(13, Math.max(5, Math.round(w / size * 5)));
      const rows = Math.min(13, Math.max(5, Math.round(h / size * 5)));
      const cw = boardW / cols, ch = boardH / rows, cell = Math.min(cw, ch);
      const radius = cell * .22, thickness = cell * .12;
      const floorZ = raised ? 0 : -size * .14, wallHeight = radius * 2.4;
      const left = -boardW / 2, bottom = -boardH / 2;
      const wood = material('#ac7747', .05, .68);
      const rail = material('#d7b47b', .22, .38);
      const edging = material('#594132', .2, .55);
      const brass = material('#d9b86e', .7, .3);
      const pitRadius = cell * .34, pitDepth = radius * 4.5, floorThickness = size * .016;
      const baseZ = floorZ - pitDepth - size * .012, lip = size * .03;
      // The board is a frame around a perforated floor, so pits are real openings you can see into.
      box(0, 0, baseZ, boardW + lip * 2, boardH + lip * 2, size * .024, edging);
      const skirtDepth = floorZ - baseZ, skirtZ = (floorZ + baseZ) / 2;
      box(0, bottom - lip / 2, skirtZ, boardW + lip * 2, lip, skirtDepth, edging);
      box(0, -bottom + lip / 2, skirtZ, boardW + lip * 2, lip, skirtDepth, edging);
      box(left - lip / 2, 0, skirtZ, lip, boardH, skirtDepth, edging);
      box(-left + lip / 2, 0, skirtZ, lip, boardH, skirtDepth, edging);

      const startX = left + cw / 2, startY = bottom + ch / 2;
      const goalX = -left - cw / 2, goalY = -bottom - ch / 2;
      const cellX = index => left + (index % cols + .5) * cw, cellY = index => bottom + (Math.floor(index / cols) + .5) * ch;
      let walls = [], pits = [], levelObjects = [], goalMaterial;
      const shared = new Set([wood, rail, edging, brass]);

      function clearLevel() {
        const owned = new Set();
        for (const object of levelObjects) {
          room.remove(object);
          object.traverse(child => {
            child.geometry?.dispose();
            if (child.userData.ownMaterial && !shared.has(child.material)) owned.add(child.material);
          });
        }
        owned.forEach(item => item.dispose());
        levelObjects = [];
      }

      function buildLevel() {
        const before = new Set(room.children);
        // Seeded depth-first carving gives a connected maze; the seed lives at module level so
        // rebuilding on resize redraws the same level, and each completed level picks a new one.
        let seed = levelSeed;
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
        // Knock out some walls to make loops, so pits can sit on the obvious route and be bypassed.
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const c = cells[y * cols + x];
          if (x < cols - 1 && c.right && random() < .14) c.right = false;
          if (y < rows - 1 && c.top && random() < .14) c.top = false;
        }
        const open = index => {
          const x = index % cols, y = Math.floor(index / cols), result = [];
          if (x > 0 && !cells[index - 1].right) result.push(index - 1);
          if (x < cols - 1 && !cells[index].right) result.push(index + 1);
          if (y > 0 && !cells[index - cols].top) result.push(index - cols);
          if (y < rows - 1 && !cells[index].top) result.push(index + cols);
          return result;
        };
        const goal = rows * cols - 1, pitCells = new Set();
        const solvable = () => {
          const seen = new Set([0]), queue = [0];
          while (queue.length) for (const next of open(queue.shift())) {
            if (next === goal) return true;
            if (!seen.has(next) && !pitCells.has(next)) { seen.add(next); queue.push(next); }
          }
          return false;
        };
        const safe = new Set([0, 1, cols, cols + 1, goal]);
        const target = Math.round(rows * cols * .12);
        for (let attempt = 0; attempt < rows * cols * 3 && pitCells.size < target; attempt++) {
          const index = Math.floor(random() * rows * cols);
          if (safe.has(index) || pitCells.has(index)) continue;
          pitCells.add(index);
          if (!solvable()) pitCells.delete(index);
        }
        pits = [...pitCells].map(index => ({ x: cellX(index), y: cellY(index) }));

        const floor = new THREE.Shape();
        floor.moveTo(left, bottom); floor.lineTo(-left, bottom); floor.lineTo(-left, -bottom); floor.lineTo(left, -bottom);
        floor.closePath();
        const hole = material('#20150e', 0, .95);
        hole.side = THREE.DoubleSide;
        for (const pit of pits) {
          floor.holes.push(new THREE.Path().absarc(pit.x, pit.y, pitRadius, 0, Math.PI * 2, true));
          const shaft = add(new THREE.CylinderGeometry(pitRadius, pitRadius, pitDepth, 32, 1, true), hole,
            pit.x, pit.y, floorZ - pitDepth / 2);
          shaft.rotation.x = Math.PI / 2;
          add(new THREE.CircleGeometry(pitRadius, 32), hole, pit.x, pit.y, floorZ - pitDepth);
          ring(pit.x, pit.y, floorZ, pitRadius, radius * .06, brass);
        }
        add(new THREE.ExtrudeGeometry(floor, { depth: floorThickness, bevelEnabled: false, curveSegments: 24 }), wood,
          0, 0, floorZ - floorThickness);

        // Subtle grain is geometry, so the board remains crisp at phone scale.
        const grain = [];
        for (let i = 1; i < 60; i++) {
          const x = left + boardW * i / 60;
          for (let j = 0; j < 24; j++) {
            const y = bottom + boardH * j / 24;
            const bend = Math.sin(i * 2.7 + j * .27) * cell * .025;
            const nextBend = Math.sin(i * 2.7 + (j + 1) * .27) * cell * .025;
            const midY = y + boardH / 48;
            if (pits.some(pit => Math.hypot(x - pit.x, midY - pit.y) < pitRadius + boardH / 40)) continue;
            grain.push([x + bend, y, floorZ + .00001], [x + nextBend, y + boardH / 24, floorZ + .00001]);
          }
        }
        lines(grain, '#704825', .22);

        walls = [];
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
        ring(startX, startY, floorZ + radius * .035, radius * 1.35, radius * .055, material('#648b7c'));
        goalMaterial = glow('#d87845');
        ring(goalX, goalY, floorZ + radius * .05, radius * 1.45, radius * .11, goalMaterial);
        ring(goalX, goalY, floorZ + radius * .05, radius * .8, radius * .055, goalMaterial);
        levelObjects = room.children.filter(child => !before.has(child));
      }
      buildLevel();

      for (const x of [-1, 1]) for (const y of [-1, 1]) {
        const sx = x * (boardW / 2 + size * .017), sy = y * (boardH / 2 + size * .017);
        const screw = add(new THREE.CylinderGeometry(size * .008, size * .008, size * .004, 12), brass, sx, sy, floorZ);
        screw.rotation.x = Math.PI / 2;
        box(sx, sy, floorZ + size * .0021, size * .011, size * .0018, size * .0004, edging);
      }
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
      let gx = 0, gy = 0, hasGravity = false, finished = false, falling = null, finishTime = 0;
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
      function reset() {
        x = startX; y = startY; vx = vy = accumulator = 0;
        falling = null; finished = false; finishTime = 0;
        marble.position.set(x, y, floorZ + radius);
        shadow.position.set(x, y, shadow.position.z);
        shadow.visible = true;
      }
      return {
        update(dt, time, gravity) {
          const elapsed = Math.max(0, Math.min(dt, .05));
          if (falling) {
            // Drop into the pit, then put the marble back at the start of the same level.
            falling.time += elapsed;
            const t = Math.min(1, falling.time / .35), settle = Math.min(1, falling.time / .2);
            x = falling.x + (falling.pit.x - falling.x) * settle;
            y = falling.y + (falling.pit.y - falling.y) * settle;
            marble.position.set(x, y, floorZ + radius - t * t * (pitDepth - radius * .1));
            if (falling.time > .9) reset();
            return;
          }
          if (finished) {
            finishTime += elapsed;
            if (finishTime > .9) {
              levelSeed = Math.floor(Math.random() * 4294967296);
              clearLevel();
              buildLevel();
              reset();
            }
            return;
          }
          // No synthetic gravity or pointer substitute when sensor samples stop.
          if (!gravity) {
            vx = vy = accumulator = 0;
            hasGravity = false;
            return;
          }
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
            // Once the marble's centre passes the rim it tips in.
            const pit = pits.find(item => Math.hypot(x - item.x, y - item.y) < pitRadius - radius * .25);
            if (pit) {
              falling = { pit, x, y, time: 0 };
              shadow.visible = false;
              return;
            }
          }
          marble.position.set(x, y, floorZ + radius);
          shadow.position.set(x, y, shadow.position.z);
          if (Math.hypot(x - goalX, y - goalY) < radius * .9) {
            finished = true;
            goalMaterial.color.set('#81f5c3');
          }
        },
      };
    },
  };
}

export default makeMarbleMaze({
  id: 'marble-maze',
  name: 'Marble maze',
  description: 'Tilt to roll the marble through a random wooden maze to the copper ring without dropping it into a pit; each finish deals a new maze. Flat is level, regardless of calibration. Requires motion sensors, in any tracking mode.',
});
