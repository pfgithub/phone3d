let hidingPlace = 0;

export default {
  id: 'hide-and-seek-dollhouse',
  name: 'Hide-and-seek dollhouse',
  description: 'Peek around the furniture to find the ginger cat. Tap the visible cat and it finds another hiding place.',
  build({ THREE, room, w, h, size, material, glow, add, box, sphere, chamber, screenFrame }) {
    chamber(.105, '#3d4856');
    screenFrame('#edc391');
    const wood = material('#cba17b'), teal = material('#559993'), pink = material('#c88983');
    const floors = [-h * .42, 0];
    const slots = [];
    for (let row = 0; row < 2; row++) {
      const floor = floors[row];
      box(0, floor, -.05, w * .96, size * .026, .105, wood);
      for (let col = 0; col < 3; col++) {
        const x = (col - 1) * w * .31;
        box(x, floor + h * .20, -.101, w * .30, h * .39, .003, material(['#687b87', '#b18b83', '#7b9887'][(col + row) % 3]));
        box(x, floor + h * .27, -.098, w * .15, h * .14, .002, wood);
        box(x, floor + h * .27, -.096, w * .12, h * .11, .002, glow('#bbdcd3'));
        box(x, floor + h * .27, -.094, size * .006, h * .11, .002, wood);
        box(x, floor + h * .09, -.035, w * .17, h * .10, .018, (row + col) % 2 ? teal : pink);
        box(x, floor + h * .045, -.021, w * .20, size * .024, .033, wood);
        for (const side of [-1, 1]) box(x + side * w * .073, floor + h * .025, -.023, size * .012, h * .05, .014, wood);
        slots.push(new THREE.Vector3(x + (col % 2 ? -1 : 1) * w * .055, floor + size * .087, -.069));
        // A vase provides a second layer of occlusion at the back of each room.
        const vase = sphere(x - w * .09, floor + size * .055, -.081, size * .034, material('#dbc58b'));
        vase.scale.y = 1.4;
      }
    }
    for (const x of [-w * .465, -w * .155, w * .155, w * .465]) {
      box(x, 0, -.064, size * .018, h * .87, .073, wood);
    }
    box(0, h * .435, -.051, w * .96, size * .027, .106, wood);
    const cat = new THREE.Group();
    room.add(cat);
    const fur = material('#edaa60', .05, .8), cream = material('#ffe1b0'), black = glow('#202f38');
    const part = mesh => { cat.add(mesh); mesh.userData.cat = true; return mesh; };
    part(sphere(0, 0, 0, size * .042, fur)).scale.set(.7, 1.2, .65);
    part(sphere(0, size * .045, .002, size * .032, fur));
    for (const side of [-1, 1]) {
      part(add(new THREE.ConeGeometry(size * .016, size * .035, 3), fur, side * size * .021, size * .075, .002));
      part(sphere(side * size * .012, size * .05, size * .030, size * .0045, black));
      part(sphere(side * size * .017, -size * .039, size * .017, size * .014, cream));
    }
    part(sphere(0, size * .036, size * .033, size * .004, material('#a96064')));
    const tail = new THREE.CatmullRomCurve3([
      new THREE.Vector3(size * .02, -size * .025, -.003),
      new THREE.Vector3(size * .067, -size * .023, -.003),
      new THREE.Vector3(size * .062, size * .04, -.003),
    ]);
    part(add(new THREE.TubeGeometry(tail, 16, size * .009, 8, false), fur, 0, 0, 0));
    const moveCat = () => cat.position.copy(slots[hidingPlace % slots.length]);
    moveCat();
    let pressed = false;
    const visibleCat = p => {
      if (!p) return false;
      const hit = p.ray.intersectObjects(room.children, true)[0];
      return Boolean(hit?.object.userData.cat);
    };
    return {
      pointerDown(p) { pressed = visibleCat(p); return pressed; },
      pointerUp(p) {
        if (pressed && visibleCat(p)) { hidingPlace = (hidingPlace + 1) % slots.length; moveCat(); }
        pressed = false;
      },
    };
  },
};
