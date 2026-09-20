export default {
  id: 'ant-farm',
  name: 'Ant farm',
  description: 'A desk ant farm seen from the side: busy ants carve winding rooms into aqua foam beneath an airy lid.',
  build({ THREE, w, h, size, room, material, glow, add, box, sphere, lines }) {
    const random = i => { const n = Math.sin(i * 127.1 + 17) * 43758.5453; return n - Math.floor(n); };
    const left = -w * .4, right = w * .4, bottom = -h * .35, top = h * .22;
    const frontZ = -size * .10, backZ = -size * .26;
    const tunnelZ = backZ + size * .012;
    const frame = material('#d0d9cc', .25, .4);
    const trim = material('#385854', .15, .6);
    const glass = material('#c7f2e9', .1, .15);
    glass.transparent = true; glass.opacity = .055; glass.depthWrite = false;

    // A shallow, freestanding acrylic sandwich, with a clear air space above the foam.
    box(0, 0, backZ - size * .035, w * 1.4, h * 1.4, size * .025, glow('#233b3d'));
    box(0, h * .02, backZ - size * .01, w * .83, h * .77, size * .012, material('#789995', 0, .9));
    box(0, (bottom + top) / 2, backZ, right - left, top - bottom, size * .012, material('#55948d', 0, 1));
    for (const x of [-w * .421, w * .421]) {
      box(x, h * .02, -size * .16, size * .022, h * .77, size * .25, frame);
      lines([[x, -h * .355, -size * .027], [x, h * .395, -size * .027]], '#e1fff1', .7);
    }
    box(0, -h * .37, -size * .16, w * .87, size * .04, size * .29, trim);
    box(0, h * .407, -size * .16, w * .88, size * .035, size * .30, trim);
    box(0, h * .425, -size * .16, w * .9, size * .012, size * .32, frame);
    for (let i = 0; i < 17; i++) {
      box((i / 16 - .5) * w * .65, h * .412, -size * .006,
        size * .015, size * .009, size * .003, glow('#1c3332'));
    }
    for (const x of [-w * .29, w * .29]) {
      box(x, -h * .404, -size * .14, w * .18, size * .044, size * .39, trim);
      box(x, -h * .429, -size * .14, w * .20, size * .012, size * .42, frame);
    }
    box(0, h * .02, -size * .024, w * .82, h * .75, size * .004, glass);
    lines([
      [-w * .393, h * .35, -size * .02], [-w * .393, h * .27, -size * .02],
      [w * .392, -h * .24, -size * .02], [w * .392, h * .32, -size * .02],
    ], '#d8fff3', .35);

    const nodes = [[-.23, .12], [.23, .075], [-.16, -.075], [.24, -.20], [-.23, -.265], [.055, -.28], [-.28, .24], [.19, .24]];
    const routes = [[6, 0], [7, 1], [0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5]];
    const curves = routes.map(([a, b], i) => {
      const start = new THREE.Vector3(nodes[a][0] * w, nodes[a][1] * h, tunnelZ);
      const end = new THREE.Vector3(nodes[b][0] * w, nodes[b][1] * h, tunnelZ);
      const mid = start.clone().lerp(end, .5);
      mid.x += (i % 2 ? 1 : -1) * size * .055;
      return new THREE.CatmullRomCurve3([start, mid, end]);
    });
    const segments = curves.flatMap(curve => {
      const points = curve.getPoints(32);
      return points.slice(1).map((p, i) => [points[i], p]);
    });
    // A signed distance field unions all the rooms and tunnels. Clipping the foam
    // against it creates actual connected openings, with walls down to the rear pane.
    function foamDistance(x, y) {
      let d = Infinity;
      for (const [a, b] of segments) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const t = THREE.MathUtils.clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
        d = Math.min(d, Math.hypot(x - a.x - t * dx, y - a.y - t * dy) - size * .031);
      }
      nodes.slice(0, 6).forEach(([nx, ny], i) => {
        const rx = size * (i % 2 ? .09 : .105), ry = size * .055;
        d = Math.min(d, (Math.hypot((x - nx * w) / rx, (y - ny * h) / ry) - 1) * ry);
      });
      return d + size * .0018 * Math.sin(x / size * 410) * Math.sin(y / size * 330);
    }
    const face = [], walls = [];
    const vertex = (target, p, z) => target.push(p.x, p.y, z);
    function wall(a, b) {
      vertex(walls, a, frontZ); vertex(walls, b, frontZ); vertex(walls, b, backZ);
      vertex(walls, a, frontZ); vertex(walls, b, backZ); vertex(walls, a, backZ);
    }
    const crossing = (a, b) => {
      const t = a.d / (a.d - b.d);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, d: 0 };
    };
    function triangle(points) {
      const polygon = [], cuts = [];
      for (let i = 0; i < 3; i++) {
        const a = points[i], b = points[(i + 1) % 3];
        if (a.d >= 0) polygon.push(a);
        if ((a.d >= 0) !== (b.d >= 0)) {
          const p = crossing(a, b); polygon.push(p); cuts.push(p);
        }
      }
      for (let i = 1; i + 1 < polygon.length; i++) {
        for (const p of [polygon[0], polygon[i], polygon[i + 1]]) vertex(face, p, frontZ);
      }
      if (cuts.length === 2) wall(cuts[0], cuts[1]);
    }
    const cols = Math.ceil((right - left) / (size * .009));
    const rows = Math.ceil((top - bottom) / (size * .009));
    const grid = Array.from({ length: rows + 1 }, (_, j) =>
      Array.from({ length: cols + 1 }, (_, i) => {
        const x = left + (right - left) * i / cols, y = bottom + (top - bottom) * j / rows;
        return { x, y, d: foamDistance(x, y) };
      }));
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i];
      triangle([a, b, c]); triangle([a, c, d]);
    }
    const perimeter = [...grid[0], ...grid.slice(1).map(row => row[cols]),
      ...grid[rows].slice(0, -1).reverse(), ...grid.slice(1, -1).reverse().map(row => row[0])];
    perimeter.forEach((a, i) => {
      const b = perimeter[(i + 1) % perimeter.length];
      if (a.d >= 0 && b.d >= 0) wall(a, b);
      else if (a.d >= 0) wall(a, crossing(a, b));
      else if (b.d >= 0) wall(crossing(a, b), b);
    });
    for (const [vertices, color] of [[face, '#b5d9bd'], [walls, '#77b6a1']]) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      const mat = material(color, 0, 1); mat.side = THREE.DoubleSide;
      add(geometry, mat, 0, 0, 0);
    }

    // Fine irregular pores make the remaining slab read as soft, cellular foam.
    const pores = new THREE.InstancedMesh(new THREE.CircleGeometry(size * .0027, 7), material('#80b59e', 0, 1), 1600);
    pores.userData.ownMaterial = true;
    const transform = new THREE.Object3D();
    let count = 0;
    for (let i = 0; i < 1600; i++) {
      const x = left + random(i * 3) * (right - left), y = bottom + random(i * 3 + 1) * (top - bottom);
      if (foamDistance(x, y) < size * .006) continue;
      transform.position.set(x, y, frontZ + size * .0002);
      const r = .35 + random(i * 3 + 2) * .85;
      transform.scale.set(r, r * .7, 1); transform.rotation.z = i * 2.4;
      transform.updateMatrix(); pores.setMatrixAt(count++, transform.matrix);
    }
    pores.count = count; room.add(pores);
    const eggs = material('#f3e8b7', 0, .8), seeds = material('#b5884c', 0, .85);
    for (const i of [1, 4]) for (let j = 0; j < 9; j++) {
      const egg = sphere(nodes[i][0] * w + (random(j + i * 20) - .5) * size * .105,
        nodes[i][1] * h + (random(j + i * 30) - .5) * size * .047,
        tunnelZ + size * .012, size * .008, i === 4 ? eggs : seeds);
      egg.scale.set(1, .55, .55); egg.rotation.z = j * 1.3;
    }
    for (let i = 0; i < 18; i++) {
      const crumb = sphere((random(i + 600) - .5) * w * .72, top + size * .004,
        frontZ - random(i + 700) * size * .13, size * .0035, seeds);
      crumb.scale.set(1.2, .7, .8);
    }
    const antMaterial = material('#302119', .08, .6);
    const ants = Array.from({ length: 20 }, (_, i) => {
      const group = new THREE.Group(); room.add(group);
      const body = (x, radius, stretch) => {
        const mesh = sphere(x, 0, 0, radius, antMaterial);
        mesh.scale.set(stretch, .85, .65); group.add(mesh);
      };
      body(-size * .013, size * .009, 1.3);
      body(0, size * .0055, 1.1);
      body(size * .011, size * .0065, 1);
      const legs = [];
      for (const side of [-1, 1]) {
        for (let j = 0; j < 3; j++) {
          const pivot = new THREE.Group(); pivot.position.x = (j - 1) * size * .006;
          group.add(pivot);
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3((j - 1) * size * .008, side * size * .012, size * .001),
            new THREE.Vector3((j - 1) * size * .013 - size * .003, side * size * .02, -size * .002),
          ]);
          const leg = add(new THREE.TubeGeometry(curve, 4, size * .0012, 4, false), antMaterial, 0, 0, 0);
          pivot.add(leg); legs.push({ pivot, phase: j * Math.PI + side });
        }
        const feeler = add(new THREE.CylinderGeometry(size * .0008, size * .0008, size * .012, 4), antMaterial,
          size * .02, side * size * .006, 0);
        feeler.rotation.z = -side * .8; group.add(feeler);
      }
      if (i % 5 === 0) {
        const seed = sphere(size * .025, 0, 0, size * .006, material('#e4b765', 0, .8));
        seed.scale.y = .6; group.add(seed);
      }
      return { group, legs, curve: curves[i % curves.length], phase: random(i + 200), speed: .018 + random(i + 300) * .018 };
    });
    const position = new THREE.Vector3(), tangent = new THREE.Vector3();
    function animate(time) {
      for (const ant of ants) {
        const cycle = (ant.phase + time * ant.speed) % 2;
        const t = cycle <= 1 ? cycle : 2 - cycle;
        ant.curve.getPointAt(t, position); ant.curve.getTangentAt(t, tangent);
        ant.group.position.copy(position); ant.group.position.z += size * .022;
        ant.group.rotation.z = Math.atan2(tangent.y, tangent.x) + (cycle > 1 ? Math.PI : 0);
        for (const { pivot, phase } of ant.legs) pivot.rotation.z = Math.sin(time * 23 + phase) * .3;
      }
    }
    animate(0);
    return { update(dt, time) { animate(time); } };
  },
};
