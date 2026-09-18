export default {
  id: 'origami',
  name: 'Paper crane mobile',
  description: 'Folded coral, ivory, and turquoise birds hanging at different depths.',
  build({ THREE, w, h, size, material, glow, add, box, lines, chamber, screenFrame }) {
    chamber(.115, '#493b42');
    screenFrame('#f1d2b3');
    const colors = ['#e98a76', '#f5deb2', '#79c2b8', '#dba0b6', '#e5ba68'];
    // Each triangle is a paper fold: broad wings, a narrow body, tail, and bent neck.
    const folds = [
      [0, 0, .08, -.95, .52, -.15, -.30, -.10, .04],
      [0, 0, .08, .30, -.10, .04, .95, .52, -.15],
      [0, 0, .08, -.30, -.10, .04, 0, -.22, .23],
      [0, 0, .08, 0, -.22, .23, .30, -.10, .04],
      [0, -.10, .15, -.12, .10, .16, -.30, .50, .21],
      [0, -.10, .15, .17, -.13, .21, .32, .38, .29],
      [.32, .38, .29, .17, .28, .29, .49, .22, .30],
    ];
    box(0, h * .39, -.035, w * .77, size * .015, .004, material('#ba9573', .15, .65));
    for (let i = 0; i < 5; i++) {
      const x = [-.25, .22, -.05, -.26, .25][i] * w;
      const y = [.22, .12, -.08, -.27, -.30][i] * h;
      const z = [-.040, -.070, -.025, -.082, -.050][i];
      const r = size * [ .18, .20, .23, .16, .18 ][i];
      const paper = material(colors[i], .02, .9);
      paper.side = THREE.DoubleSide;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(folds.flat(), 3));
      geometry.computeVertexNormals();
      const crane = add(geometry, paper, x, y, z);
      crane.scale.setScalar(r);
      crane.rotation.set(.18, (i - 2) * .22, Math.sin(i * 2) * .2);
      lines([[x, h * .385, -.035], [x, y, z]], '#e8d8c6', .55);
    }
    // Distant colored paper confetti stays still when the scene is rebuilt.
    for (let i = 0; i < 16; i++) {
      const chip = box(Math.sin(i * 127) * w * .43, Math.cos(i * 73) * h * .43,
        -.109, size * .025, size * .025, .0002, glow(colors[i % colors.length]));
      chip.rotation.z = i * .8;
    }
  },
};
