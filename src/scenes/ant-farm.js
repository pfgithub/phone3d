export default {
  id: 'ant-farm',
  name: 'Ant farm',
  description: 'A cutaway colony: busy ants carry seeds through winding tunnels and nursery chambers.',
  build({ THREE, w, h, size, room, material, glow, add, box, sphere, screenFrame }) {
    screenFrame('#c7985e');
    box(0, 0, -size * .39, w * 1.5, h * 1.5, size * .06, material('#795137', 0, .95));
    for (let i = 0; i < 12; i++) {
      box(0, (i / 11 - .5) * h, -size * .352, w * 1.4, h * .026, size * .006,
        material(i % 2 ? '#896043' : '#936b46', 0, 1));
    }
    const random = i => { const n = Math.sin(i * 127.1 + 17) * 43758.5453; return n - Math.floor(n); };
    const grains = new THREE.InstancedMesh(new THREE.SphereGeometry(size * .0025, 4, 3), material('#d2a56e', 0, 1), 450);
    grains.userData.ownMaterial = true;
    const transform = new THREE.Object3D();
    for (let i = 0; i < 450; i++) {
      transform.position.set((random(i * 3) - .5) * w * 1.25, (random(i * 3 + 1) - .5) * h * 1.25, -size * .343);
      transform.scale.setScalar(.5 + random(i * 3 + 2));
      transform.updateMatrix(); grains.setMatrixAt(i, transform.matrix);
    }
    room.add(grains);
    const nodes = [[-.31, .37], [.24, .26], [-.22, .05], [.28, -.13], [-.23, -.32], [.12, -.39]];
    const routes = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5]];
    const tunnelZ = -size * .28;
    const earth = material('#b98a55', 0, .95), shadow = glow('#302219');
    const curves = routes.map(([a, b], i) => {
      const start = new THREE.Vector3(nodes[a][0] * w, nodes[a][1] * h, tunnelZ);
      const end = new THREE.Vector3(nodes[b][0] * w, nodes[b][1] * h, tunnelZ);
      const mid = start.clone().lerp(end, .5);
      mid.x += (i % 2 ? 1 : -1) * size * .085;
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      add(new THREE.TubeGeometry(curve, 36, size * .039, 8, false), earth, 0, 0, 0);
      add(new THREE.TubeGeometry(curve, 36, size * .028, 8, false), shadow, 0, 0, size * .019);
      return curve;
    });
    nodes.forEach(([x, y], i) => {
      const rim = sphere(x * w, y * h, tunnelZ, size * .092, earth);
      rim.scale.set(1.18, .76, .3);
      const hollow = sphere(x * w, y * h, tunnelZ + size * .016, size * .078, shadow);
      hollow.scale.set(1.2, .72, .24);
      if (i === 4 || i === 1) {
        for (let j = 0; j < 7; j++) {
          const egg = sphere(x * w + (random(j + i * 20) - .5) * size * .1,
            y * h + (random(j + i * 30) - .5) * size * .055, tunnelZ + size * .041,
            size * .009, material(i === 4 ? '#f0dfad' : '#d9a451', 0, .85));
          egg.scale.set(1, .65, .6);
        }
      }
    });
    box(0, h * .46, -size * .28, w, h * .035, size * .07, material('#4a3826', 0, 1));
    const antMaterial = material('#241511', .1, .55);
    const ants = Array.from({ length: 24 }, (_, i) => {
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
      return { group, legs, curve: curves[i % curves.length], phase: random(i + 200), speed: .045 + random(i + 300) * .035 };
    });
    const position = new THREE.Vector3(), tangent = new THREE.Vector3();
    function animate(time) {
      for (const ant of ants) {
        const cycle = (ant.phase + time * ant.speed) % 2;
        const t = cycle <= 1 ? cycle : 2 - cycle;
        ant.curve.getPointAt(t, position); ant.curve.getTangentAt(t, tangent);
        ant.group.position.copy(position); ant.group.position.z += size * .058;
        ant.group.rotation.z = Math.atan2(tangent.y, tangent.x) + (cycle > 1 ? Math.PI : 0);
        for (const { pivot, phase } of ant.legs) pivot.rotation.z = Math.sin(time * 23 + phase) * .3;
      }
    }
    animate(0);
    return { update(dt, time) { animate(time); } };
  },
};
