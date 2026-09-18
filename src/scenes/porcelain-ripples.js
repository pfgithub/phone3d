export default {
  id: 'porcelain-ripples',
  name: 'Porcelain ripples',
  description: 'Still ripples embossed into pale blue porcelain, rising less than a millimetre from the glass.',
  build({ THREE, w, h, size, material, add }) {
    const porcelain = material('#bbcfd0', .08, .62);
    porcelain.emissive.set('#bbcfd0');
    porcelain.emissiveIntensity = .32;
    add(new THREE.PlaneGeometry(w, h), porcelain, 0, 0, 0);
    const patches = [
      [-w * .15, h * .25, size * .24],
      [w * .19, -h * .04, size * .18],
      [-w * .14, -h * .29, size * .14],
    ];
    for (const [x, y, radius] of patches) {
      const vertices = [], indices = [];
      const segments = 96, bands = 96;
      // Smooth annular crests fade back to the same flat surface at both ends.
      const height = t => .00085 * Math.sin(Math.PI * t) ** 2
        * (.5 + .5 * Math.cos(t * Math.PI * 6)) ** 2;
      vertices.push(0, 0, .000008);
      for (let band = 1; band <= bands; band++) {
        const t = band / bands;
        for (let i = 0; i < segments; i++) {
          const a = i / segments * Math.PI * 2;
          vertices.push(Math.cos(a) * radius * t, Math.sin(a) * radius * t, height(t) + .000008);
        }
      }
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        indices.push(0, 1 + i, 1 + next);
      }
      for (let band = 0; band < bands - 1; band++) {
        for (let i = 0; i < segments; i++) {
          const next = (i + 1) % segments;
          const a = 1 + band * segments + i, b = 1 + band * segments + next;
          const c = a + segments, d = b + segments;
          indices.push(a, c, d, a, d, b);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      add(geometry, porcelain, x, y, 0);
    }
  },
};
