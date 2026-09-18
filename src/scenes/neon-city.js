export default {
  id: 'neon-city',
  name: 'Midnight metropolis',
  description: 'Layered towers, neon windows, and a luminous avenue under a pink moon.',
  build({ w, h, size, material, glow, box, sphere, lines, chamber, screenFrame }) {
    chamber(.17, '#100f2a');
    screenFrame('#a58be8');
    const moon = sphere(w * .25, h * .27, -.155, size * .13, glow('#e7a2cb'));
    moon.scale.z = .2;
    const walls = ['#343052', '#272a48', '#19263d'].map(c => material(c, .3, .7));
    const lights = ['#ffc18f', '#74e3e7', '#e78bbb'].map(glow);
    for (let layer = 0; layer < 3; layer++) {
      const z = -.135 + layer * .047;
      for (let i = 0; i < 6; i++) {
        const x = (i - 2.5) * w * .155;
        // A central opening in the foreground reveals the distant street.
        if (layer > 0 && (i === 2 || i === 3)) continue;
        const height = h * (.28 + .40 * (Math.sin(i * 127.1 + layer * 47) + 1) / 2);
        const width = w * (.115 + .012 * Math.sin(i * 3));
        const bottom = -h * .44;
        box(x, bottom + height / 2, z, width, height, .017, walls[layer]);
        box(x, bottom + height, z, width * .86, size * .012, .019, lights[(i + layer) % 3]);
        for (let row = 0; row < 8; row++) for (let col = 0; col < 2; col++) {
          if (Math.sin(row * 43 + col * 17 + i * 7 + layer) < -.3) continue;
          box(x + (col - .5) * width * .43, bottom + height * (.10 + row * .105), z + .009,
            width * .16, Math.min(height * .045, size * .023), .0005, lights[(row + i + layer) % 3]);
        }
        if (i % 2 === 0) box(x, bottom + height + size * .04, z, size * .006, size * .08, .002, lights[1]);
      }
    }
    box(0, -h * .45, -.087, w * .94, size * .01, .15, material('#111c32', .6, .3));
    const avenue = [];
    for (const side of [-1, 1]) avenue.push([side * w * .12, -h * .44, -.012], [side * w * .12, -h * .44, -.16]);
    for (let i = 0; i < 9; i++) avenue.push([0, -h * .439, -.02 - i * .015], [0, -h * .439, -.027 - i * .015]);
    lines(avenue, '#fc84bc');
  },
};
