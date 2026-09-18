export default {
  id: 'leather-inlay',
  name: 'Leather inlay',
  description: 'A stitched saddle-leather panel set into a dark surround, with softly raised piping.',
  build({ THREE, w, h, size, material, add, box, lines }) {
    const depth = size * .035;
    const iw = w * .69;
    const ih = h * .72;
    const radius = size * .095;
    function rounded(path, width, height, r) {
      const x = width / 2;
      const y = height / 2;
      path.moveTo(-x + r, -y);
      path.lineTo(x - r, -y);
      path.quadraticCurveTo(x, -y, x, -y + r);
      path.lineTo(x, y - r);
      path.quadraticCurveTo(x, y, x - r, y);
      path.lineTo(-x + r, y);
      path.quadraticCurveTo(-x, y, -x, y - r);
      path.lineTo(-x, -y + r);
      path.quadraticCurveTo(-x, -y, -x + r, -y);
      path.closePath();
      return path;
    }
    const panel = rounded(new THREE.Shape(), w * 1.1, h * 1.1, size * .02);
    panel.holes.push(rounded(new THREE.Path(), iw, ih, radius));
    box(0, 0, -depth - size * .006, w * 1.1, h * 1.1, size * .01,
      material('#251a16', .02, 1));
    add(new THREE.ExtrudeGeometry(panel, {
      depth, bevelEnabled: true, bevelThickness: size * .003,
      bevelSize: size * .003, bevelSegments: 3, steps: 1,
    }), material('#49382f', .02, .94), 0, 0, -depth);
    const inset = rounded(new THREE.Shape(), iw - size * .018, ih - size * .018, radius * .92);
    add(new THREE.ExtrudeGeometry(inset, {
      depth: size * .018, bevelEnabled: true, bevelThickness: size * .004,
      bevelSize: size * .004, bevelSegments: 4, steps: 1,
    }), material('#b97e4e', .02, .95), 0, 0, -depth);

    // A continuous narrow piping ring sits above the glass; the leather stays recessed.
    const piping = rounded(new THREE.Shape(), iw + size * .014, ih + size * .014, radius + size * .007);
    piping.holes.push(rounded(new THREE.Path(), iw + size * .004, ih + size * .004, radius + size * .002));
    add(new THREE.ExtrudeGeometry(piping, {
      depth: size * .008, bevelEnabled: false, steps: 1,
    }), material('#d09d68', .05, .65), 0, 0, 0);
    const stitchPath = rounded(new THREE.Path(), iw - size * .048, ih - size * .048, radius * .72);
    const count = Math.ceil((iw + ih) * 2 / (size * .038));
    const stitches = [];
    const stitchPoints = stitchPath.getSpacedPoints(count * 3);
    for (let i = 0; i < count; i++) {
      for (const p of [stitchPoints[i * 3], stitchPoints[i * 3 + 1]]) {
        stitches.push([p.x, p.y, -size * .012]);
      }
    }
    lines(stitches, '#f0d5a2', .95);
    // Short pressed lines form a restrained maker's mark in the center.
    const mark = [];
    for (let i = -1; i <= 1; i++) {
      mark.push([i * size * .025, -size * .04, -size * .012],
        [i * size * .025, size * .04, -size * .012]);
    }
    lines(mark, '#795032', .7);
  },
};
