export default {
  id: 'chalk-pebbles',
  name: 'Chalk pebbles',
  description: 'Small, worn stones barely lift off a warm chalk surface, with just a millimetre of relief.',
  build({ THREE, w, h, size, material, glow, add, sphere }) {
    add(new THREE.PlaneGeometry(w, h), glow('#ddd6c8'), 0, 0, 0);
    const colors = ['#ece6db', '#bbb6a9', '#cec6b7', '#a8b4ae'];
    const stones = colors.map(color => {
      const mat = material(color, .02, .92);
      mat.emissive.set(color);
      mat.emissiveIntensity = .28;
      return mat;
    });
    const shadow = new THREE.MeshBasicMaterial({
      color: '#777568', transparent: true, opacity: .12, depthWrite: false,
    });
    const positions = [
      [-.23, .31, .047], [-.12, .25, .032], [.17, .16, .065],
      [.27, .09, .029], [-.19, -.04, .052], [-.07, -.12, .035],
      [.16, -.27, .058], [.27, -.32, .025], [-.24, -.34, .027],
    ];
    positions.forEach(([px, py, radius], i) => {
      const x = px * w, y = py * h, r = radius * size;
      const angle = Math.sin(i * 127.1) * 2;
      const footprint = add(new THREE.CircleGeometry(r, 40), shadow,
        x + size * .002, y - size * .003, .000015);
      footprint.scale.set(1.08, .79, 1);
      footprint.rotation.z = angle;
      const stone = sphere(x, y, -.00012, r, stones[i % stones.length]);
      // Only the cap breaks the glass: even the largest stone stays below 1.1 mm.
      stone.scale.set(1, .72 + .06 * Math.sin(i * 2.3), (.00065 + radius * .008) / r);
      stone.rotation.z = angle;
    });
    // Flat flecks give the eye a reference at the glass without adding more relief.
    for (let i = 0; i < 65; i++) {
      const x = Math.sin(i * 127.1 + 1) * w * .44;
      const y = Math.sin(i * 311.7 + 2) * h * .44;
      add(new THREE.CircleGeometry(size * (.0007 + .0005 * Math.sin(i) ** 2), 6),
        glow(i % 3 ? '#cfc7b8' : '#eee8de'), x, y, .000025);
    }
  },
};
