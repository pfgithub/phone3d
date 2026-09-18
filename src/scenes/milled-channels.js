export default {
  id: 'milled-channels',
  name: 'Milled channels',
  description: 'Rounded channels milled into graphite, crossed by shallow champagne-metal bridges.',
  build({ THREE, w, h, size, material, glow, add, box, lines }) {
    const depth = size * .047;
    const panel = new THREE.Shape();
    panel.moveTo(-w * .55, -h * .55);
    panel.lineTo(w * .55, -h * .55);
    panel.lineTo(w * .55, h * .55);
    panel.lineTo(-w * .55, h * .55);
    panel.closePath();
    const horizontal = w > h;
    const length = (horizontal ? w : h) * .69;
    const radius = size * .031;
    const bridge = material('#d4bd8d', .7, .35);
    for (let i = 0; i < 5; i++) {
      const across = (i - 2) * size * .135;
      const slot = new THREE.Path();
      // Build along y, then rotate the path's geometry by swapping coordinates in landscape.
      const point = (u, v) => horizontal ? [v, u] : [u, v];
      const half = length / 2 - radius;
      const points = [];
      for (let j = 0; j <= 24; j++) {
        const angle = Math.PI * j / 24;
        points.push(point(across + radius * Math.cos(angle), half + radius * Math.sin(angle)));
      }
      for (let j = 0; j <= 24; j++) {
        const angle = Math.PI + Math.PI * j / 24;
        points.push(point(across + radius * Math.cos(angle), -half + radius * Math.sin(angle)));
      }
      slot.moveTo(...points[0]);
      for (const p of points.slice(1)) slot.lineTo(...p);
      slot.closePath();
      panel.holes.push(slot);
      const [x, y] = point(across, (i % 3 - 1) * length * .21);
      box(x, y, size * .009, horizontal ? size * .047 : radius * 2.8,
        horizontal ? radius * 2.8 : size * .047, size * .018, bridge);
      const [lx, ly] = point(across, -length * .36);
      add(new THREE.CircleGeometry(size * .012, 24), glow('#9ec8bd'), lx, ly, -depth * .88);
    }
    box(0, 0, -depth - size * .006, w * 1.1, h * 1.1, size * .01,
      material('#15262d', .2, .8));
    add(new THREE.ExtrudeGeometry(panel, {
      depth, bevelEnabled: true, bevelThickness: size * .0025,
      bevelSize: size * .0025, bevelSegments: 2, steps: 1,
    }), material('#506169', .65, .48), 0, 0, -depth);
    const ticks = [];
    for (let i = 0; i < 17; i++) {
      const v = (i - 8) * length / 18;
      const u = size * .39;
      const end = u + size * (i % 4 === 0 ? .025 : .012);
      ticks.push(horizontal ? [v, u, size * .003] : [u, v, size * .003],
        horizontal ? [v, end, size * .003] : [end, v, size * .003]);
    }
    lines(ticks, '#a4b1b3', .6);
  },
};
