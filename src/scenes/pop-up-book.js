export default {
  id: 'pop-up-book',
  name: 'Pop-up book',
  description: 'A little paper castle unfolds above an open book. Peek around the towers and their folded supports.',
  build({ THREE, room, size, material, glow, add, box, lines, chamber }) {
    chamber(.06, '#383545');
    const paper = material('#f1dbac', .02, .85), edge = material('#b77662', .04, .8);
    const ink = material('#658c92', .05, .8), roof = material('#ba6664', .05, .75);
    box(0, 0, -.014, size * .87, size * .76, .007, material('#684450', .1, .7));
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const page = box(side * size * .21, 0, -.009 + i * .00065, size * .416, size * .71, .0006, paper);
        page.rotation.y = side * .07;
      }
      for (let j = 0; j < 5; j++) {
        lines([[side * size * .08, -size * (.24 + j * .017), -.003], [side * size * .34, -size * (.24 + j * .017), -.001]], '#ba9b77', .55);
      }
    }
    lines([[0, -size * .35, -.005], [0, size * .35, -.005]], '#9c785d');
    const panel = new THREE.Group();
    panel.position.set(0, -size * .18, -.003);
    panel.rotation.x = .95;
    room.add(panel);
    const attach = mesh => { panel.add(mesh); return mesh; };
    const shape = new THREE.Shape();
    const outline = [[-.32, 0], [.32, 0], [.32, .34], [.25, .34], [.25, .27], [.19, .27], [.19, .34], [.12, .34],
      [.12, .23], [-.12, .23], [-.12, .34], [-.19, .34], [-.19, .27], [-.25, .27], [-.25, .34], [-.32, .34]];
    outline.forEach(([x, y], i) => i ? shape.lineTo(x * size, y * size) : shape.moveTo(x * size, y * size));
    shape.closePath();
    const door = new THREE.Path();
    door.moveTo(-size * .052, 0); door.lineTo(-size * .052, size * .09);
    door.absarc(0, size * .09, size * .052, Math.PI, 0, true);
    door.lineTo(size * .052, 0); door.closePath();
    shape.holes.push(door);
    attach(add(new THREE.ExtrudeGeometry(shape, { depth: size * .009, bevelEnabled: false }), paper, 0, 0, 0));
    for (const side of [-1, 1]) {
      attach(box(side * size * .235, size * .135, size * .009, size * .12, size * .25, size * .006, ink));
      for (let j = 0; j < 2; j++) attach(box(side * size * .235, size * (.1 + j * .1), size * .014,
        size * .031, size * .048, size * .002, glow('#efd494')));
    }
    // A second, taller folded panel rises behind the outer wall.
    const keep = new THREE.Group(); keep.position.set(0, size * .035, -.003); keep.rotation.x = 1.02; room.add(keep);
    const tower = box(0, size * .19, 0, size * .16, size * .38, size * .008, edge); keep.add(tower);
    const roofShape = new THREE.Shape(); roofShape.moveTo(-size * .13, size * .38);
    roofShape.lineTo(0, size * .54); roofShape.lineTo(size * .13, size * .38); roofShape.closePath();
    roof.side = THREE.DoubleSide;
    keep.add(add(new THREE.ShapeGeometry(roofShape), roof, 0, 0, size * .009));
    keep.add(box(0, size * .26, size * .009, size * .045, size * .09, size * .002, glow('#fbe0a2')));
    keep.add(box(0, size * .59, 0, size * .007, size * .11, size * .007, ink));
    const flag = new THREE.Shape(); flag.moveTo(0, size * .63); flag.lineTo(size * .10, size * .60); flag.lineTo(0, size * .56); flag.closePath();
    keep.add(add(new THREE.ShapeGeometry(flag), roof, 0, 0, 0));
    for (const side of [-1, 1]) {
      const fold = new THREE.BufferGeometry();
      fold.setAttribute('position', new THREE.Float32BufferAttribute([
        side * size * .27, -size * .18, -.003,
        side * size * .27, -size * .018, size * .225,
        side * size * .38, size * .20, -.003,
      ], 3));
      fold.computeVertexNormals();
      const foldPaper = material('#d4ba89', .02, .9); foldPaper.side = THREE.DoubleSide;
      add(fold, foldPaper, 0, 0, 0);
    }
  },
};
