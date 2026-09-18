export default {
  id: 'impossible',
  name: 'The impossible triangle',
  description: 'A continuous triangle from straight ahead; three disconnected beams when you look around it.',
  build({ THREE, w, h, size, material, glow, add, lines }) {
    add(new THREE.PlaneGeometry(w * 5, h * 5), glow('#1b1733'), 0, 0, -.24);
    const corners = [[0, size * .36], [-size * .34, -size * .23], [size * .34, -size * .23]];
    const colors = ['#ffbb79', '#f57899', '#9d99ff'];
    // Project endpoints to the same retinal triangle at the default eye distance.
    // Alternating depths break every joint physically, but hide the gaps head-on.
    const eye = .3048;
    const depths = [[-.018, -.100], [-.037, -.140], [-.065, -.022]];
    for (let i = 0; i < 3; i++) {
      const start = corners[i], end = corners[(i + 1) % 3];
      const vertices = [];
      for (let j = 0; j < 2; j++) {
        const p = j ? end : start, z = depths[i][j], scale = (eye - z) / eye;
        // Homothetic inner/outer triangles give the three beams exact miter joints.
        for (const side of [-1, 1]) {
          const inset = 1 + side * .23, centerY = -size / 30;
          vertices.push(p[0] * inset * scale, (centerY + (p[1] - centerY) * inset) * scale, z);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex([0, 2, 1, 1, 2, 3]); geometry.computeVertexNormals();
      const face = glow(colors[i]); face.side = THREE.DoubleSide;
      add(geometry, face, 0, 0, 0);
      // Real side faces expose the individual wedges as the viewpoint moves.
      for (const side of [0, 1]) {
        const a = vertices.slice(side * 3, side * 3 + 3), b = vertices.slice(6 + side * 3, 9 + side * 3);
        const wall = new THREE.BufferGeometry();
        wall.setAttribute('position', new THREE.Float32BufferAttribute([
          ...a, ...b, b[0], b[1], b[2] - .006, ...a, b[0], b[1], b[2] - .006, a[0], a[1], a[2] - .006,
        ], 3));
        wall.computeVertexNormals();
        const mat = material(colors[i], .25, .5); mat.side = THREE.DoubleSide;
        add(wall, mat, 0, 0, 0);
      }
    }
    // A reticle on the glass makes the separation from the sculpture legible.
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const x = sx * size * .43, y = sy * size * .43;
      lines([[x - sx * size * .05, y, 0], [x, y, 0], [x, y, 0], [x, y - sy * size * .05, 0]], '#696185');
    }
  },
};
