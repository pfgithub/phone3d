export default {
  id: 'zipper',
  name: 'Unzip the screen',
  description: 'Two curled fabric lips part at the glass. Lean sideways to peek beneath the zipper.',
  build({ THREE, w, h, size, material, glow, add, box }) {
    const fabric = material('#334c98', .05, .9);
    fabric.side = THREE.DoubleSide;
    const brass = material('#edbc69', .35, .28);
    brass.emissive.set('#edbc69'); brass.emissiveIntensity = .25;
    const inner = glow('#ef694a');
    add(new THREE.PlaneGeometry(w * 4, h * 4), glow('#351928'), 0, 0, -.085);
    // The opening closes toward either end. Its lips curl out of the glass.
    const edge = t => size * (.025 + .28 * Math.sin(Math.PI * t) ** 1.4);
    const lip = t => .002 + size * .14 * Math.sin(Math.PI * t);
    for (const side of [-1, 1]) {
      const vertices = [], indices = [];
      for (let j = 0; j <= 64; j++) {
        const t = j / 64, y = (t - .5) * h * 1.2;
        for (let k = 0; k <= 12; k++) {
          const u = k / 12;
          vertices.push(side * (edge(t) + (w * .85 - edge(t)) * u), y,
            lip(t) * (1 - u) ** 3 - .003 * u);
        }
      }
      for (let j = 0; j < 64; j++) for (let k = 0; k < 12; k++) {
        const a = j * 13 + k;
        indices.push(a, a + 1, a + 13, a + 1, a + 14, a + 13);
      }
      const mesh = new THREE.BufferGeometry();
      mesh.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      mesh.setIndex(indices); mesh.computeVertexNormals();
      add(mesh, fabric, 0, 0, 0);
      for (let i = 0; i < 48; i++) {
        const t = (i + .5) / 48, y = (t - .5) * h * 1.2;
        const tooth = box(side * (edge(t) + size * .008), y, lip(t),
          size * .055, h * .012, size * .025, brass);
        tooth.rotation.z = -side * Math.cos(t * Math.PI) * .45;
        box(side * (edge(t) + size * .075), y, lip(t) * .78,
          size * .012, h * .006, .0003, glow('#a6bbed'));
      }
    }
    // Crossed threads far below the opening reveal the space under the fabric.
    for (let i = -12; i <= 12; i++) {
      const thread = box(i * size * .055, 0, -.045, size * .011, h * 2, .001, inner);
      thread.rotation.z = -.42;
      const cross = box(0, i * size * .055, -.057, w * 2, size * .008, .001, glow('#8a3446'));
      cross.rotation.z = -.42;
    }
    const pull = new THREE.Shape();
    pull.absellipse(0, 0, size * .064, size * .13, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, size * .031, size * .077, 0, Math.PI * 2, true, 0);
    pull.holes.push(hole);
    const tab = add(new THREE.ExtrudeGeometry(pull, { depth: .002, bevelEnabled: false }),
      brass, 0, -h * .39, .004);
    tab.rotation.set(-.4, .15, -.25);
  },
};
