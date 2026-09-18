export default {
  id: 'paper-relief',
  name: 'Paper relief',
  description: 'Concentric cut-paper windows step inward while a small coral disc floats above the sheet.',
  build({ THREE, w, h, size, material, add, box }) {
    const centerX = -w * .035;
    const centerY = h * .025;
    const radius = size * .34;
    const step = size * .009;
    const colors = ['#ead9c0', '#d8c5a9', '#b4bbaa', '#8da59d', '#64898a'];
    for (let i = 0; i < colors.length; i++) {
      const sheet = new THREE.Shape();
      sheet.moveTo(-w * .55, -h * .55);
      sheet.lineTo(w * .55, -h * .55);
      sheet.lineTo(w * .55, h * .55);
      sheet.lineTo(-w * .55, h * .55);
      sheet.closePath();
      const hole = new THREE.Path();
      hole.absarc(centerX + i * size * .014, centerY - i * size * .009,
        radius - i * size * .042, 0, Math.PI * 2, true);
      sheet.holes.push(hole);
      add(new THREE.ExtrudeGeometry(sheet, {
        depth: step, bevelEnabled: false, steps: 1, curveSegments: 64,
      }), material(colors[i], .01, 1), 0, 0, -(i + 1) * step);
    }
    box(0, 0, -step * 5.5, w * 1.1, h * 1.1, step,
      material('#365e65', .02, .9));
    const coral = material('#cd795e', .05, .75);
    const disc = add(new THREE.CylinderGeometry(size * .088, size * .092, size * .016, 64),
      coral, centerX + size * .235, centerY - size * .21, size * .008);
    disc.rotation.x = Math.PI / 2;
    // Narrow strips read as embossed registration marks on the surrounding sheet.
    for (let i = 0; i < 3; i++) {
      box(w * .28 - i * size * .033, h * .39, size * .003,
        size * .012, size * .033, size * .006, material('#f4e7d1', .01, 1));
    }
  },
};
