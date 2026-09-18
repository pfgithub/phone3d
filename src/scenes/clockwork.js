export default {
  id: 'clockwork',
  name: 'Clockwork cabinet',
  description: 'Brass gears, copper teeth, and a pendulum inside a dark mechanical cabinet.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, lines, chamber, screenFrame }) {
    chamber(.10, '#241a16');
    screenFrame('#c29655');
    const brass = material('#d5aa5c', .7, .3);
    const copper = material('#b96f46', .65, .35);
    const dark = material('#43372c', .65, .4);
    const gears = [[-.22, .22, .19, -.032, 14], [.16, .04, .24, -.049, 18], [-.19, -.22, .16, -.068, 12]];
    for (const [px, py, radius, z, teeth] of gears) {
      const x = px * w, y = py * h, r = radius * size;
      ring(x, y, z, r * .79, r * .13, brass);
      for (let j = 0; j < teeth; j++) {
        const angle = j * Math.PI * 2 / teeth;
        const tooth = box(x + Math.cos(angle) * r, y + Math.sin(angle) * r, z,
          r * .23, r * .24, .003, copper);
        tooth.rotation.z = angle;
      }
      for (let j = 0; j < 5; j++) {
        const spoke = box(x, y, z, r * 1.5, r * .10, .0025, brass);
        spoke.rotation.z = j * Math.PI / 5;
      }
      const axle = add(new THREE.CylinderGeometry(r * .16, r * .16, .013, 16), dark, x, y, z);
      axle.rotation.x = Math.PI / 2;
      sphere(x, y, z + .007, r * .10, brass);
    }
    // A recessed pendulum gives the overlapping gear faces another depth reference.
    box(w * .24, -h * .20, -.084, size * .018, h * .38, .003, brass);
    const bob = sphere(w * .24, -h * .36, -.084, size * .10, copper);
    bob.scale.z = .4;
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      sphere(x * w * .43, y * h * .43, -.012, size * .018, brass);
    }
    const ticks = [];
    for (let i = 0; i < 21; i++) {
      const x = (i / 20 - .5) * w * .7;
      ticks.push([x, h * .40, -.092], [x, h * .40 - size * (i % 5 ? .025 : .05), -.092]);
    }
    lines(ticks, '#c29655');
    box(0, h * .35, -.093, w * .70, size * .007, .001, glow('#70583c'));
  },
};
