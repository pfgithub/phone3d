export default {
  id: 'keyhole',
  name: 'Keyhole',
  description: 'Peer through the brass keyhole. Tilt to discover the lamp, portrait and checkerboard room hidden behind it.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, chamber }) {
    chamber(.15, '#313b45');
    const brass = material('#ba8a43', .8, .3), darkBrass = material('#5d4329', .65, .42);
    const plate = new THREE.Shape();
    plate.moveTo(-w / 2, -h / 2); plate.lineTo(w / 2, -h / 2);
    plate.lineTo(w / 2, h / 2); plate.lineTo(-w / 2, h / 2); plate.closePath();
    const r = size * .12, cy = size * .12;
    const hole = new THREE.Path();
    hole.moveTo(-r * .5, cy - r * Math.sqrt(3) / 2);
    hole.absarc(0, cy, r, Math.PI * 4 / 3, Math.PI * 5 / 3, true);
    hole.lineTo(r * .72, cy - r * 2.9); hole.lineTo(-r * .72, cy - r * 2.9); hole.closePath();
    plate.holes.push(hole);
    add(new THREE.ExtrudeGeometry(plate, { depth: .003, bevelEnabled: true, bevelSize: .0005, bevelThickness: .0004, bevelSegments: 2, curveSegments: 48 }), brass, 0, 0, -.0035);
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      const bolt = sphere(x * w * .41, y * h * .43, .0002, size * .026, darkBrass);
      bolt.scale.z = .32;
      const slot = box(x * w * .41, y * h * .43, size * .0085, size * .028, size * .004, .0002, glow('#2e2521'));
      slot.rotation.z = x * y * .6;
    }
    for (const s of [-1, 1]) {
      box(s * w * .465, 0, .0002, size * .008, h * .94, .001, darkBrass);
      box(0, s * h * .47, .0002, w * .94, size * .008, .001, darkBrass);
      const trim = ring(0, s * size * .30, .0003, size * .065, size * .003, darkBrass);
      trim.scale.y = .45;
    }
    const floor = -h * .36;
    for (let x = 0; x < 10; x++) for (let z = 0; z < 12; z++) {
      box((x - 4.5) * w / 10, floor, -.008 - z * .012, w / 10, .001, .012,
        material((x + z) % 2 ? '#344c50' : '#d5c49b'));
    }
    box(w * .22, floor + h * .25, -.09, size * .011, h * .5, size * .011, brass);
    const shade = add(new THREE.ConeGeometry(size * .14, size * .16, 32, 1, true), glow('#ffd797'), w * .22, floor + h * .51, -.09);
    shade.material.side = THREE.DoubleSide;
    box(-w * .18, h * .12, -.142, w * .35, h * .37, .005, brass);
    box(-w * .18, h * .12, -.138, w * .30, h * .32, .002, glow('#567b78'));
    const portrait = sphere(-w * .18, h * .16, -.134, size * .069, material('#e7b38d'));
    portrait.scale.set(.8, 1.25, .16);
    const bust = sphere(-w * .18, h * .04, -.134, size * .10, material('#734860'));
    bust.scale.set(1, .7, .16);
    box(0, floor + h * .13, -.075, w * .33, size * .016, .038, material('#925938'));
    for (const side of [-1, 1]) box(side * w * .13, floor + h * .065, -.075, size * .013, h * .13, size * .013, material('#684834'));
    sphere(0, floor + h * .13 + size * .045, -.075, size * .031, glow('#b7e1d5'));
  },
};
