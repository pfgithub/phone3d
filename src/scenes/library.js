export default {
  id: 'library',
  name: 'Secret library',
  description: 'Colorful book spines, warm shelf lights, and a tiny rolling ladder.',
  build({ w, h, size, material, glow, box, lines, chamber, screenFrame }) {
    chamber(.095, '#291b25');
    screenFrame('#e5bc82');
    const wood = material('#714938', .05, .8);
    const gilt = glow('#e5bc82');
    const paper = material('#e1d2b0', .02, .9);
    const covers = ['#457e83', '#a85054', '#b48c4e', '#626b9a', '#6c8764'].map(c => material(c, .05, .7));
    for (const side of [-1, 1]) box(side * w * .43, 0, -.061, size * .04, h * .86, .055, wood);
    for (let row = 0; row < 4; row++) {
      const y = -h * .40 + row * h * .215;
      box(0, y, -.06, w * .88, size * .025, .06, wood);
      box(0, y - size * .016, -.031, w * .78, size * .008, .001, gilt);
      for (let i = 0; i < 11; i++) {
        const bookWidth = w * .057;
        const bookHeight = h * (.11 + .055 * (Math.sin(i * 127.1 + row * 33) + 1) / 2);
        const x = (i - 5) * w * .071;
        const bottom = y + size * .014;
        const z = -.060 + .004 * Math.sin(i * 7 + row);
        box(x, bottom + bookHeight / 2, z, bookWidth, bookHeight, .035, covers[(i + row * 2) % covers.length]);
        box(x, bottom + bookHeight - size * .003, z, bookWidth * .76, size * .003, .031, paper);
        for (const t of [.17, .80]) box(x, bottom + bookHeight * t, z + .018,
          bookWidth * .72, size * .004, .0005, gilt);
      }
    }
    // The ladder sits forward of the books so dragging reveals the gap behind it.
    const ladder = material('#c59864', .35, .5);
    for (const side of [-1, 1]) {
      const rail = box(w * .18 + side * size * .065, -h * .12, -.016,
        size * .016, h * .57, .004, ladder);
      rail.rotation.x = -.10;
    }
    for (let i = 0; i < 7; i++) {
      const y = -h * .36 + i * h * .08;
      box(w * .18, y, -.016 - (y + h * .12) * .10, size * .15, size * .015, .005, ladder);
    }
    lines([[-w * .39, h * .16, -.024], [w * .39, h * .16, -.024]], '#e5bc82');
  },
};
