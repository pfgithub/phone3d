export default {
  id: 'shadow-box',
  name: 'Shadow box',
  description: 'A cabinet of small curiosities: shell, moon, bottle, bird, clock and staircase. Peer beneath the shelf lips.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, lines, chamber }) {
    chamber(.095, '#302b32');
    const oak = material('#826148', .05, .85), brass = material('#c4a46e', .65, .4);
    const cw = w * .30, ch = h * .43, unit = Math.min(cw, ch);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
      const x = (col - 1) * cw, y = (row - .5) * ch;
      const idx = row * 3 + col;
      box(x, y, -.092, cw * .94, ch * .96, .003, material(['#536568', '#353f59', '#657469', '#865b57', '#466066', '#767064'][idx]));
      for (let k = 0; k < 6; k++) {
        box(x + Math.sin(k * 127 + idx) * cw * .36, y + Math.cos(k * 93 + idx) * ch * .37, -.089,
          unit * .011, unit * .011, .0002, glow('#bcae8c'));
      }
      const z = -.061;
      if (idx === 0) {
        const shell = material('#eed2ad', .1, .65);
        for (let k = 0; k < 15; k++) {
          const a = k * .48, r = unit * (.015 + k * .018);
          const bead = sphere(x + Math.cos(a) * r, y + Math.sin(a) * r, z + k * .0006, unit * (.022 + k * .004), shell);
          bead.scale.z = .7;
        }
      } else if (idx === 1) {
        sphere(x, y, z, unit * .24, material('#d8bd84'));
        const orbit = ring(x, y, z, unit * .37, unit * .013, brass);
        orbit.rotation.x = 1.0; orbit.rotation.y = .4;
        lines([[x, y + unit * .24, z], [x, y + ch * .47, z]], '#c1aa78');
      } else if (idx === 2) {
        const bottle = material('#71aaa0', .4, .22);
        add(new THREE.CylinderGeometry(unit * .16, unit * .19, unit * .47, 24), bottle, x, y - unit * .07, z);
        add(new THREE.CylinderGeometry(unit * .075, unit * .10, unit * .19, 20), bottle, x, y + unit * .24, z);
        box(x, y - unit * .055, z + unit * .192, unit * .24, unit * .19, .0007, material('#e2d4ac'));
        add(new THREE.CylinderGeometry(unit * .082, unit * .082, unit * .065, 16), oak, x, y + unit * .36, z);
      } else if (idx === 3) {
        sphere(x, y, z, unit * .23, material('#c6bba0')).scale.set(1.2, .65, .65);
        sphere(x + unit * .20, y + unit * .13, z, unit * .11, material('#c6bba0'));
        sphere(x + unit * .23, y + unit * .16, z + unit * .09, unit * .018, glow('#182d36'));
        const beak = add(new THREE.ConeGeometry(unit * .042, unit * .14, 3), brass, x + unit * .34, y + unit * .12, z);
        beak.rotation.z = -Math.PI / 2;
        box(x, y - unit * .23, z, unit * .70, unit * .027, unit * .027, oak);
        lines([[x, y - unit * .06, z], [x, y - unit * .23, z]], '#d7b77e');
      } else if (idx === 4) {
        ring(x, y, z, unit * .29, unit * .034, brass);
        add(new THREE.CircleGeometry(unit * .28, 48), material('#e0d0a6'), x, y, z - .001);
        for (let k = 0; k < 12; k++) sphere(x + Math.sin(k * Math.PI / 6) * unit * .23,
          y + Math.cos(k * Math.PI / 6) * unit * .23, z + .001, unit * .013, glow('#493f38'));
        lines([[x, y, z + .002], [x - unit * .12, y + unit * .12, z + .002],
          [x, y, z + .002], [x + unit * .15, y + unit * .07, z + .002]], '#453e3c');
      } else {
        for (let k = 0; k < 7; k++) box(x + (k - 3) * unit * .09, y - unit * .27 + k * unit * .073,
          z - k * .003, unit * .09, unit * .09, unit * .38, material('#ceb78f'));
        ring(x + unit * .27, y + unit * .26, z - .023, unit * .09, unit * .012, brass);
      }
      // Ticket labels and raised shelf lips partially conceal the lowest objects.
      box(x, y - ch * .44, -.006, cw * .96, unit * .12, .008, oak);
      box(x, y - ch * .44, -.0015, unit * .30, unit * .085, .001, brass);
      for (let k = 0; k <= idx; k++) box(x + (k - idx / 2) * unit * .029, y - ch * .44, -.0008,
        unit * .009, unit * .043, .0003, glow('#544535'));
    }
    for (const x of [-1.5, -.5, .5, 1.5]) box(x * cw, 0, -.046, size * .025, ch * 2.05, .094, oak);
    for (const y of [-1, 0, 1]) box(0, y * ch, -.046, cw * 3.05, size * .025, .094, oak);
  },
};
