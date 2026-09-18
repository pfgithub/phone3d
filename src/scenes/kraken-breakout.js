export default {
  id: 'kraken-breakout',
  name: 'Kraken breakout',
  description: 'Containment failed. Huge curling tentacles reach through the glass and disappear beyond the screen edges.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, chamber, screenFrame }) {
    chamber(.085, '#151b31');
    screenFrame('#df9875');
    const copper = material('#b77361', .4, .4), skin = material('#6d8d98', .25, .4);
    const suckers = material('#e0b495', .12, .52);
    const portal = ring(-w * .12, -h * .09, -.022, size * .32, size * .025, copper);
    portal.scale.y = 1.2;
    sphere(-w * .12, -h * .08, -.035, size * .26, skin).scale.set(1, 1.25, .8);
    for (const side of [-1, 1]) {
      sphere(-w * .12 + side * size * .115, -h * .025, size * .07, size * .048, glow('#f2c16e'));
      sphere(-w * .12 + side * size * .115, -h * .025, size * .109, size * .023, glow('#10212c')).scale.set(.35, 1, .4);
    }
    const tips = [[-.66, .65], [.72, .38], [-.8, -.25], [.68, -.65], [.05, .83], [-.37, -.85]];
    tips.forEach(([tx, ty], i) => {
      const side = i % 2 ? 1 : -1;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-w * .12 + side * size * .12, -h * .10, -.028),
        new THREE.Vector3(tx * w * .50, ty * h * .3, size * .33),
        new THREE.Vector3(tx * w * .83, ty * h * .72, size * .70),
        new THREE.Vector3(tx * w, ty * h, size * .94),
        new THREE.Vector3(tx * w - side * size * .13, ty * h - Math.sign(ty) * size * .10, size * 1.10),
      ]);
      // Tapered tubes intentionally cross all four screen edges at positive z.
      const geometry = new THREE.TubeGeometry(curve, 64, 1, 10, false);
      const positions = geometry.attributes.position;
      for (let segment = 0; segment <= 64; segment++) {
        const t = segment / 64, center = curve.getPointAt(t);
        const radius = size * (.048 * (1 - t) ** .8 + .004);
        for (let j = 0; j <= 10; j++) {
          const index = segment * 11 + j;
          const offset = new THREE.Vector3().fromBufferAttribute(positions, index).sub(center).multiplyScalar(radius);
          positions.setXYZ(index, center.x + offset.x, center.y + offset.y, center.z + offset.z);
        }
      }
      geometry.computeVertexNormals();
      add(geometry, skin, 0, 0, 0);
      for (let j = 1; j < 21; j++) {
        const t = j / 22, p = curve.getPointAt(t), radius = size * (.048 * (1 - t) ** .8 + .004);
        const cup = ring(p.x, p.y, p.z + radius * .88, radius * .48, radius * .14, suckers);
        cup.rotation.y = side * .2;
      }
    });
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      sphere(-w * .12 + Math.cos(a) * size * .32, -h * .09 + Math.sin(a) * size * .385,
        -.002, size * .009, glow('#e6be85'));
    }
    for (const side of [-1, 1]) box(side * w * .46, 0, -.012, size * .012, h * .92, .015, copper);
  },
};
