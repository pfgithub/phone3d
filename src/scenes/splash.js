export default {
  id: 'splash',
  name: 'Liquid gold',
  description: 'A frozen crown splash rises through the glass, with droplets hovering on your side of the screen.',
  build({ THREE, w, h, size, material, glow, add, sphere, ring }) {
    add(new THREE.PlaneGeometry(w * 4, h * 4), glow('#19292e'), 0, 0, -.075);
    const gold = material('#efaf48', .65, .22);
    gold.side = THREE.DoubleSide; gold.emissive.set('#b85c14'); gold.emissiveIntensity = .18;
    // A continuous radial liquid surface: recessed center, raised jagged crown,
    // and an outer film returning to the glass.
    const vertices = [], indices = [], segments = 160, bands = 30;
    for (let j = 0; j <= bands; j++) {
      const t = j / bands, r = size * (.018 + t * .35);
      for (let i = 0; i <= segments; i++) {
        const a = i / segments * Math.PI * 2;
        const crown = Math.exp(-(((t - .63) / .135) ** 2));
        const peaks = (.5 + .5 * Math.cos(a * 11)) ** 5;
        const z = -.019 * (1 - t) ** 3 + crown * size * (.13 + .18 * peaks);
        vertices.push(Math.cos(a) * r, Math.sin(a) * r, z);
      }
    }
    for (let j = 0; j < bands; j++) for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i, b = a + segments + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const mesh = new THREE.BufferGeometry();
    mesh.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    mesh.setIndex(indices); mesh.computeVertexNormals(); add(mesh, gold, 0, 0, 0);
    const center = sphere(0, 0, -.017, size * .04, gold); center.scale.z = .45;
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * Math.PI * 2, r = size * (.27 + .025 * Math.sin(i * 7));
      const drop = sphere(Math.cos(a) * r, Math.sin(a) * r, size * (.3 + .06 * Math.sin(i * 4)), size * (.013 + .004 * Math.sin(i)), gold);
      drop.scale.z = 1.55;
    }
    for (let i = 0; i < 4; i++) {
      const ripple = ring(0, 0, -.001 - i * .0005, size * (.41 + i * .095), size * .004, material('#547574', .5, .3));
      ripple.scale.y = .93;
    }
  },
};
