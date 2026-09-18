export default {
  id: 'jade-leaves',
  name: 'Jade leaves',
  description: 'Leaf-shaped carvings and polished raised leaves alternate across a pale jade slab.',
  build({ THREE, w, h, size, material, add, box, lines }) {
    const depth = size * .045;
    const panel = new THREE.Shape();
    panel.moveTo(-w * .55, -h * .55);
    panel.lineTo(w * .55, -h * .55);
    panel.lineTo(w * .55, h * .55);
    panel.lineTo(-w * .55, h * .55);
    panel.closePath();
    const landscape = w > h;
    const polished = material('#b3d5b8', .2, .28);
    const veins = [];
    for (let i = 0; i < 6; i++) {
      const t = (i - 2.5) / 5;
      const x = landscape ? t * w * .64 : (i % 2 ? 1 : -1) * size * .13;
      const y = landscape ? (i % 2 ? 1 : -1) * size * .13 : t * h * .64;
      const angle = (landscape ? 0 : Math.PI / 2) + (i % 2 ? -.55 : .55);
      const length = size * .21;
      const width = size * .073;
      const transform = (u, v) => [x + u * Math.cos(angle) - v * Math.sin(angle),
        y + u * Math.sin(angle) + v * Math.cos(angle)];
      const leaf = i % 2 ? new THREE.Shape() : new THREE.Path();
      leaf.moveTo(...transform(-length / 2, 0));
      leaf.bezierCurveTo(...transform(-length * .15, width), ...transform(length * .3, width),
        ...transform(length / 2, 0));
      leaf.bezierCurveTo(...transform(length * .15, -width), ...transform(-length * .3, -width),
        ...transform(-length / 2, 0));
      leaf.closePath();
      if (i % 2) {
        add(new THREE.ExtrudeGeometry(leaf, {
          depth: size * .014, bevelEnabled: true, bevelThickness: size * .004,
          bevelSize: size * .004, bevelSegments: 3, steps: 1,
        }), polished, 0, 0, 0);
      } else {
        panel.holes.push(leaf);
      }
      const z = i % 2 ? size * .0185 : -depth + size * .002;
      veins.push([...transform(-length * .33, 0), z], [...transform(length * .33, 0), z]);
      for (let j = -1; j <= 1; j++) {
        veins.push([...transform(j * length * .18, 0), z],
          [...transform(j * length * .18 + length * .12, width * .46), z]);
      }
    }
    box(0, 0, -depth - size * .004, w * 1.1, h * 1.1, size * .01,
      material('#41746a', .1, .7));
    add(new THREE.ExtrudeGeometry(panel, {
      depth, bevelEnabled: true, bevelThickness: size * .0025,
      bevelSize: size * .0025, bevelSegments: 3, steps: 1,
    }), material('#8eb6a0', .12, .55), 0, 0, -depth);
    lines(veins, '#648a72', .85);
  },
};
