export default {
  id: 'moire',
  name: 'Moiré silk',
  description: 'Three veils of colored threads hover at different depths. Move the phone to slide their interference patterns across one another.',
  build({ THREE, w, h, size, glow, add, lines }) {
    add(new THREE.PlaneGeometry(w * 5, h * 5), glow('#090c20'), 0, 0, -.19);
    const colors = ['#4053c1', '#ed609d', '#65edd1'];
    for (let layer = 0; layer < 3; layer++) {
      const points = [], count = 100;
      const z = [-.115, -.057, -.008][layer];
      const angle = [-.20, .16, -.06][layer];
      const point = (u, t) => {
        const x = u * w * .64 + Math.sin(t * 5 + layer * 1.7) * size * .095;
        const y = t * h * .61;
        return [x * Math.cos(angle) - y * Math.sin(angle),
          x * Math.sin(angle) + y * Math.cos(angle),
          z + size * .14 * Math.cos(t * 3.7 + u * 2 + layer)];
      };
      for (let i = 0; i <= count; i++) {
        const u = i / count * 2 - 1;
        for (let j = 0; j < 60; j++) {
          points.push(point(u, j / 30 - 1), point(u, (j + 1) / 30 - 1));
        }
      }
      lines(points, colors[layer], .85);
      // Woven hems show each veil's curved silhouette and physical separation.
      const hems = [];
      for (const end of [-1, 1]) for (let i = 0; i < count; i++) {
        hems.push(point(i / count * 2 - 1, end), point((i + 1) / count * 2 - 1, end));
      }
      lines(hems, colors[layer]);
    }
  },
};
