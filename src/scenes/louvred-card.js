export default {
  id: 'louvred-card',
  name: 'Louvred card',
  description: 'Look left for a sunset harbour, right for a moonlit mountain. Between the slats is a tiny garden.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, chamber, screenFrame }) {
    chamber(.09, '#203d39');
    screenFrame('#d2ad71');
    box(0, -h * .4, -.055, w, h * .12, .06, material('#826253'));
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * w * .125, y = -h * .29 + Math.sin(i * 2) * h * .08;
      const pot = add(new THREE.CylinderGeometry(size * .036, size * .027, size * .065, 12), material('#c87650'), x, y, -.065);
      box(x, y + size * .07, -.065, size * .008, size * .10, size * .008, material('#8eac77'));
      for (let j = 0; j < 3; j++) {
        const leaf = sphere(x + Math.sin(j * 3 + i) * size * .033, y + size * (.08 + j * .025), -.063,
          size * .03, material(j % 2 ? '#a0bd7c' : '#518d70'));
        leaf.scale.set(1, .55, .4);
      }
      pot.rotation.y = i;
    }
    sphere(w * .25, h * .28, -.087, size * .085, glow('#eadab0'));
    const count = 20, rows = 48, slices = 4;
    const pitch = w * .92 / count, depth = size * .19;
    const vertices = [], colors = [];
    const color = new THREE.Color();
    const paint = (u, v, side) => {
      if (side > 0) {
        if ((u - .68) ** 2 + ((v - .69) * h / w) ** 2 < .018) return '#ffeab0';
        const ridge = .30 + .20 * Math.abs(Math.sin(u * 8 + .4)) + .09 * Math.sin(u * 19);
        if (v < ridge) return v < ridge - .12 ? '#152a4e' : '#456082';
        return v > .60 ? '#101b3b' : '#263e65';
      }
      if ((u - .3) ** 2 + ((v - .63) * h / w) ** 2 < .037) return '#ffe2a0';
      if (v < .3) return Math.sin(v * 190 + u * 17) > .6 ? '#edb582' : '#456877';
      const building = .30 + .15 * (.5 + .5 * Math.sin(Math.floor(u * 17) * 23));
      if (v < building) return '#433b53';
      return v > .7 ? '#ba6267' : '#ee9e77';
    };
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * pitch;
      box(x, 0, -.008 - depth / 2, size * .004, h * .86, depth, material('#c7a170', .5));
      for (const side of [-1, 1]) {
        for (let row = 0; row < rows; row++) for (let k = 0; k < slices; k++) {
          const y0 = (row / rows - .5) * h * .86, y1 = ((row + 1) / rows - .5) * h * .86;
          const z0 = -.008 - depth * k / slices, z1 = -.008 - depth * (k + 1) / slices;
          const px = x + side * size * .0021;
          const u = (i + (side > 0 ? k : slices - k - 1) / slices) / count;
          color.set(paint(u, (row + .5) / rows, side));
          vertices.push(px, y0, z0, px, y1, z0, px, y1, z1, px, y0, z0, px, y1, z1, px, y0, z1);
          for (let n = 0; n < 6; n++) colors.push(color.r, color.g, color.b);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const ink = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    add(geometry, ink, 0, 0, 0);
    for (const y of [-1, 1]) box(0, y * h * .444, -.007, w * .97, size * .026, .005, material('#d3ac73', .65));
  },
};
