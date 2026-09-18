export default {
  id: 'peg-solitaire',
  name: 'Peg solitaire',
  description: 'Drag a peg over one neighbour into an empty hole. Captured pegs fall to a tray 30 mm below. Leave one peg; tap the amber corner to reset.',
  build({ THREE, w, h, size, room, material, glow, add, box, sphere, ring, chamber }) {
    chamber(.032, '#302721');
    box(0, 0, -.031, w * .96, h * .96, .002, material('#627b68', .05, .9));
    const cell = Math.min(w * .86, h * .77) / 7, radius = cell * .3;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2); shape.lineTo(w / 2, -h / 2); shape.lineTo(w / 2, h / 2); shape.lineTo(-w / 2, h / 2); shape.closePath();
    const cells = [], byKey = new Map();
    for (let row = -3; row <= 3; row++) for (let col = -3; col <= 3; col++) {
      if (Math.abs(row) > 1 && Math.abs(col) > 1) continue;
      const x = col * cell, y = row * cell;
      const path = new THREE.Path(); path.absarc(x, y, radius, 0, Math.PI * 2, true); shape.holes.push(path);
      const halo = ring(x, y, -.00015, radius * 1.16, cell * .025, glow('#a57b47'));
      const sleeveMat = material('#724c2d', 0, .85); sleeveMat.side = THREE.DoubleSide;
      const sleeve = add(new THREE.CylinderGeometry(radius, radius, .004, 20, 1, true), sleeveMat, x, y, -.002);
      sleeve.rotation.x = Math.PI / 2;
      const c = { row, col, x, y, peg: null, halo };
      cells.push(c); byKey.set(`${col},${row}`, c);
    }
    add(new THREE.ExtrudeGeometry(shape, { depth: .004, bevelEnabled: false, curveSegments: 24 }), material('#be925b', 0, .8), 0, 0, -.004);
    const pegs = [];
    for (const c of cells) {
      if (c.row === 0 && c.col === 0) continue;
      const group = new THREE.Group(); group.position.set(c.x, c.y, 0); room.add(group);
      const mat = material('#577f75', .25, .35);
      const stem = add(new THREE.CylinderGeometry(radius * .53, radius * .7, .004, 16), mat, 0, 0, -.002); stem.rotation.x = Math.PI / 2; group.add(stem);
      const head = sphere(0, 0, .0003, radius * .86, mat); head.scale.z = .62; group.add(head);
      const peg = { group, mat, home: c, cell: c, falling: false, speed: 0 };
      c.peg = peg; pegs.push(peg);
    }
    const reset = sphere(w * .43, h * .43, -.0005, size * .025, glow('#ffc176'));
    const progress = Array.from({ length: 32 }, (_, i) => sphere((i % 16 - 7.5) * w * .052, -h * (.42 + Math.floor(i / 16) * .035), -.00015, size * .006, glow('#496c61')));
    let selected = null;
    function legal(from, to) {
      if (!from || !to || to.peg) return null;
      const dx = to.col - from.col, dy = to.row - from.row;
      if (!((Math.abs(dx) === 2 && dy === 0) || (Math.abs(dy) === 2 && dx === 0))) return null;
      const middle = byKey.get(`${from.col + dx / 2},${from.row + dy / 2}`);
      return middle?.peg ? middle : null;
    }
    function clearHints() { cells.forEach(c => c.halo.material.color.set('#a57b47')); }
    function score() {
      const remaining = cells.filter(c => c.peg).length;
      const anyMoves = cells.some(from => from.peg && cells.some(to => legal(from, to)));
      progress.forEach((bead, i) => bead.material.color.set(i < 32 - remaining ? '#d4efb2' : '#496c61'));
      if (!anyMoves) cells.forEach(c => c.halo.material.color.set(remaining === 1 ? '#8affce' : '#e7a16f'));
    }
    function resetGame() {
      selected = null; cells.forEach(c => { c.peg = null; });
      pegs.forEach(peg => {
        peg.cell = peg.home; peg.home.peg = peg; peg.falling = false; peg.speed = 0;
        peg.group.position.set(peg.home.x, peg.home.y, 0); peg.group.rotation.set(0, 0, 0); peg.mat.color.set('#577f75');
      });
      clearHints(); score();
    }
    return {
      pointerDown(p) {
        room.updateMatrixWorld(true);
        const hit = p.ray.intersectObjects([reset, ...pegs.filter(peg => !peg.falling).map(peg => peg.group)], true)[0];
        if (!hit) return false;
        if (hit.object === reset) { resetGame(); return true; }
        selected = pegs.find(peg => peg.group === hit.object.parent);
        if (!selected) return false;
        selected.mat.color.set('#e9d493'); selected.group.position.z = .004;
        cells.forEach(c => c.halo.material.color.set(legal(selected.cell, c) ? '#94ffcf' : '#a57b47'));
        return true;
      },
      pointerMove(p) { if (selected) { selected.group.position.x = p.x; selected.group.position.y = p.y; } },
      pointerUp(p) {
        if (!selected) return;
        const to = p ? byKey.get(`${Math.round(p.x / cell)},${Math.round(p.y / cell)}`) : null;
        const middle = legal(selected.cell, to);
        if (middle) {
          middle.peg.falling = true; middle.peg.cell = null; middle.peg = null;
          selected.cell.peg = null; to.peg = selected; selected.cell = to;
        }
        selected.group.position.set(selected.cell.x, selected.cell.y, 0);
        selected.mat.color.set('#577f75'); selected = null; clearHints(); score();
      },
      update(dt) {
        dt = Math.min(dt, .05);
        for (const peg of pegs) if (peg.falling && peg.group.position.z > -.027) {
          peg.speed += dt * .24;
          peg.group.position.z = Math.max(-.027, peg.group.position.z - peg.speed * dt);
          // Keep the peg upright until it has cleared the narrow bore.
          if (peg.group.position.z < -.01) peg.group.rotation.x += dt * 2;
        }
      },
    };
  },
};
