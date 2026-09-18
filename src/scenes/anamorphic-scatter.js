export default {
  id: 'anamorphic-scatter',
  name: 'Anamorphic scatter',
  description: 'Find the angle where the fragments say HELLO. Align the two little sight rings as a hint.',
  build({ THREE, size, w, h, material, glow, add, ring, lines, chamber }) {
    chamber(.15, '#101a32');
    const letters = [
      ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
      ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
      ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
      ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
      ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    ];
    const eye = new THREE.Vector3(size * .8, size * .2, .3048);
    const pixel = size * .027;
    const face = glow('#ffe4a1');
    const edge = material('#ba7544', .65, .32);
    let n = 0;
    letters.forEach((letter, l) => letter.forEach((row, y) => [...row].forEach((on, x) => {
      if (on !== '1') return;
      const gx = (l * 6 + x - 14) * pixel, gy = (3 - y) * pixel;
      const z = -.015 - ((Math.sin(++n * 127.1) * 43758.5) % 1 + 1) % 1 * .115;
      // Every front face projects to precisely one glyph pixel from the target eye.
      const t = (eye.z - z) / eye.z;
      const px = eye.x + (gx - eye.x) * t, py = eye.y + (gy - eye.y) * t;
      add(new THREE.BoxGeometry(pixel * .90 * t, pixel * .90 * t, .0015), edge, px, py, z - .0008);
      add(new THREE.PlaneGeometry(pixel * .90 * t, pixel * .90 * t), face, px, py, z);
    })));
    const hintX = 0, hintY = -size * .25;
    for (const z of [-.008, -.11]) {
      const t = (eye.z - z) / eye.z;
      ring(eye.x + (hintX - eye.x) * t, eye.y + (hintY - eye.y) * t, z,
        size * .025 * t, size * .003, glow(z > -.02 ? '#e6b773' : '#70dedb'));
    }
    const grid = [];
    for (let i = -4; i <= 4; i++) {
      grid.push([i * w / 8, -h / 2, -.147], [i * w / 8, h / 2, -.147]);
      grid.push([-w / 2, i * h / 8, -.147], [w / 2, i * h / 8, -.147]);
    }
    lines(grid, '#3a5168', .45);
  },
};
