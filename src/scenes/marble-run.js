export default {
  id: 'marble-run',
  name: 'Marble workshop',
  description: 'Candy-colored marbles on zigzag rails, stepping forward from a blue pegboard.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, chamber, screenFrame }) {
    chamber(.115, '#24454e');
    screenFrame('#efc889');
    const rail = material('#edc78a', .55, .35);
    const support = material('#638f96', .4, .6);
    const colors = ['#ef786f', '#75d9ce', '#e6b8ef', '#efc65d'];
    for (let row = 0; row < 9; row++) for (let col = 0; col < 7; col++) {
      sphere((col - 3) * w * .12, (row - 4) * h * .095, -.109, size * .009, glow('#162f38'));
    }
    for (let level = 0; level < 4; level++) {
      const direction = level % 2 === 0 ? 1 : -1;
      const y = h * (.30 - level * .19);
      const z = -.088 + level * .021;
      const start = new THREE.Vector3(-direction * w * .34, y + h * .025, z);
      const end = new THREE.Vector3(direction * w * .34, y - h * .025, z);
      for (const side of [-1, 1]) {
        const curve = new THREE.LineCurve3(
          start.clone().add(new THREE.Vector3(0, 0, side * size * .045)),
          end.clone().add(new THREE.Vector3(0, 0, side * size * .045)),
        );
        add(new THREE.TubeGeometry(curve, 1, size * .010, 8, false), rail, 0, 0, 0);
      }
      for (const t of [.08, .5, .92]) {
        const p = start.clone().lerp(end, t);
        box(p.x, p.y - size * .025, (z - .11) / 2, size * .028, size * .025, z + .11, support);
        box(p.x, p.y - size * .012, z, size * .025, size * .02, size * .12, rail);
      }
      const p = start.clone().lerp(end, [.28, .65, .40, .76][level]);
      sphere(p.x, p.y + size * .047, z, size * .061, material(colors[level], .35, .2));
      if (level < 3) {
        const nextY = y - h * .19 + h * .025;
        const curve = new THREE.CatmullRomCurve3([
          end, new THREE.Vector3(direction * w * .39, y - h * .09, z + .010),
          new THREE.Vector3(direction * w * .34, nextY, z + .021),
        ]);
        add(new THREE.TubeGeometry(curve, 20, size * .014, 8, false), rail, 0, 0, 0);
      }
    }
    box(0, -h * .39, -.023, w * .79, size * .035, size * .20, material('#cf8265', .1, .65));
  },
};
