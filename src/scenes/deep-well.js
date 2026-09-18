export default {
  id: 'deep-well',
  name: 'Maintenance shaft',
  description: 'A steel deck at the glass, a raised safety collar, and a lit shaft descending 220 mm.',
  build({ THREE, w, h, size, material, glow, add, box, ring, lines }) {
    const r = size * .29, depth = .22;
    const panel = new THREE.Shape();
    panel.moveTo(-w/2, -h/2); panel.lineTo(w/2, -h/2);
    panel.lineTo(w/2, h/2); panel.lineTo(-w/2, h/2); panel.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, r, 0, Math.PI*2, true); panel.holes.push(hole);
    const surface = add(new THREE.ShapeGeometry(panel, 80), glow('#374b53'), 0, 0, 0);
    surface.name = 'glass-surface';
    const wall = material('#263c48', .45, .55); wall.side = THREE.DoubleSide;
    add(new THREE.CylinderGeometry(r, r, depth, 80, 1, true), wall, 0, 0, -depth/2).rotation.x = Math.PI/2;
    add(new THREE.CircleGeometry(r, 80), glow('#09131d'), 0, 0, -depth);
    const safetyYellow = material('#efb846', .35, .35);
    safetyYellow.emissive.set('#efb846'); safetyYellow.emissiveIntensity = .25;
    ring(0, 0, .0015, r + size*.015, .0015, safetyYellow);
    for (let level = 1; level <= 10; level++) {
      const z = -level*.02;
      ring(0, 0, z, r*.985, size*.007, material('#66828d', .6, .4));
      ring(0, 0, z+.0005, r*.95, size*.0025, glow(level > 6 ? '#587fba' : '#91dfff'));
      // Ladder rungs descend along the right-hand wall.
      box(r*.79, 0, z+.007, size*.009, r*.7, size*.009, material('#d2a658', .5));
    }
    for (const side of [-1, 1]) {
      box(r*.79, side*r*.36, -depth/2, size*.012, size*.012, depth, material('#99a9a5', .6));
    }
    for (let i = 0; i < 12; i++) {
      const a = i*Math.PI/6;
      const x = Math.cos(a)*(r+size*.052), y = Math.sin(a)*(r+size*.052);
      const bolt = add(new THREE.CylinderGeometry(size*.012, size*.012, .0013, 6), material('#c3d2cc', .6), x, y, .00065);
      bolt.rotation.x = Math.PI/2;
    }
    const markings = glow('#e8b34e');
    for (const side of [-1, 1]) {
      const y = side*(h*.5-size*.10);
      box(0, y, .00003, w*.76, size*.002, .00004, markings);
      for (let i = 0; i < 9; i++) {
        const stripe = box((i-4)*w*.075, y-side*size*.034, .00004, w*.028, size*.025, .00004, markings);
        stripe.rotation.z = -.45;
      }
    }
    const seams = [];
    for (const side of [-1, 1]) seams.push([side*w*.44,-h/2,.00002],[side*w*.44,h/2,.00002]);
    lines(seams, '#1e323c');
  },
};
