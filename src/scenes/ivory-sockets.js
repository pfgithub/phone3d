export default {
  id: 'ivory-sockets',
  name: 'Ivory sockets',
  description: 'Soft ivory cups and raised porcelain buttons, just a few millimeters from the glass.',
  build({ THREE, w, h, size, material, add, box, ring }) {
    const depth = size * .055;
    const ivory = material('#ede4cf', .08, .65);
    const porcelain = material('#fff2d9', .12, .3);
    const brass = material('#b59b62', .6, .4);
    const panel = new THREE.Shape();
    panel.moveTo(-w * .55, -h * .55);
    panel.lineTo(w * .55, -h * .55);
    panel.lineTo(w * .55, h * .55);
    panel.lineTo(-w * .55, h * .55);
    panel.closePath();

    const columns = w > h ? 3 : 2;
    const rows = w > h ? 2 : 3;
    const radius = size * .125;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = (col - (columns - 1) / 2) * w * .72 / columns;
        const y = (row - (rows - 1) / 2) * h * .72 / rows;
        const hole = new THREE.Path();
        hole.absarc(x, y, radius, 0, Math.PI * 2, true);
        panel.holes.push(hole);
        // The dark seam remains visible around both the inset and outset buttons.
        const top = (row + col) % 2 ? size * .023 : -depth * .7;
        const button = add(new THREE.CylinderGeometry(radius * .81, radius * .84,
          top + depth, 48), porcelain, x, y, (top - depth) / 2);
        button.rotation.x = Math.PI / 2;
        ring(x, y, -size * .001, radius + size * .005, size * .003, brass);
        ring(x, y, top + size * .001, radius * .56, size * .0015, brass);
      }
    }
    box(0, 0, -depth - size * .006, w * 1.1, h * 1.1, size * .01,
      material('#8e8776', .05, .9));
    add(new THREE.ExtrudeGeometry(panel, {
      depth, bevelEnabled: true, bevelThickness: size * .003,
      bevelSize: size * .003, bevelSegments: 3, steps: 1, curveSegments: 32,
    }), ivory, 0, 0, -depth);
  },
};
