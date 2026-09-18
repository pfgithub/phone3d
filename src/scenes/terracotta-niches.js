export default {
  id: 'terracotta-niches',
  name: 'Terracotta niches',
  description: 'Arched alcoves cut into warm clay, with tiny vessels and projecting stone ledges.',
  build({ THREE, w, h, size, material, add, box, sphere }) {
    const depth = size * .075;
    const clay = material('#cb805f', .02, .95);
    const stone = material('#e5ba91', .04, .8);
    const vessel = material('#638d85', .12, .45);
    const panel = new THREE.Shape();
    panel.moveTo(-w * .55, -h * .55);
    panel.lineTo(w * .55, -h * .55);
    panel.lineTo(w * .55, h * .55);
    panel.lineTo(-w * .55, h * .55);
    panel.closePath();
    const landscape = w > h;
    const radius = size * .15;
    const nicheHeight = size * .42;
    for (let i = 0; i < 2; i++) {
      const x = landscape ? (i - .5) * w * .46 : 0;
      const y = landscape ? 0 : (i - .5) * h * .43;
      const bottom = y - nicheHeight / 2;
      const shoulder = y + nicheHeight / 2 - radius;
      const arch = new THREE.Path();
      arch.moveTo(x - radius, bottom);
      arch.lineTo(x - radius, shoulder);
      arch.absarc(x, shoulder, radius, Math.PI, 0, true);
      arch.lineTo(x + radius, bottom);
      arch.closePath();
      panel.holes.push(arch);

      box(x, bottom + size * .008, -depth * .25, radius * 2.15,
        size * .023, depth * 1.2, stone);
      const body = sphere(x, bottom + size * .073, -depth * .5, size * .052, vessel);
      body.scale.set(.83, 1, .55);
      const neck = add(new THREE.CylinderGeometry(size * .021, size * .026,
        size * .045, 32), vessel, x, bottom + size * .12, -depth * .5);
      const mouth = add(new THREE.CircleGeometry(size * .015, 32),
        material('#294c47', .02, .9), x, neck.position.y + size * .0226, -depth * .5);
      mouth.rotation.x = -Math.PI / 2;
      // A small clay keystone stands slightly proud of the otherwise flat facade.
      box(x, y + nicheHeight / 2 + size * .035, size * .006,
        size * .045, size * .03, size * .012, stone);
    }
    box(0, 0, -depth - size * .006, w * 1.1, h * 1.1, size * .01,
      material('#87513e', .02, 1));
    add(new THREE.ExtrudeGeometry(panel, {
      depth, bevelEnabled: true, bevelThickness: size * .004,
      bevelSize: size * .004, bevelSegments: 3, steps: 1, curveSegments: 32,
    }), clay, 0, 0, -depth);
  },
};
