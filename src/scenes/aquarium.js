export default {
  id: 'aquarium',
  name: 'Aquarium',
  description: 'Fish wander through a planted tank, occasionally coming close enough to nose through the glass.',
  build({ THREE, room, w, h, size, material, glow, add, box, sphere, lines, chamber, screenFrame }) {
    chamber(.12, '#164b56');
    screenFrame('#93d0cf');
    const sand = material('#a7a67a', .05, .9);
    box(0, -h * .45, -.057, w, h * .10, .12, sand);
    for (let i = 0; i < 38; i++) {
      const stone = sphere(Math.sin(i * 127.1) * w * .44, -h * .393, -.015 - (.5 + .5 * Math.sin(i * 39)) * .09,
        size * (.012 + (.5 + .5 * Math.cos(i * 19)) * .018), material(i % 2 ? '#c5b78c' : '#728c80'));
      stone.scale.y = .55;
    }
    for (let i = 0; i < 12; i++) {
      const x = Math.sin(i * 79) * w * .43, z = -.06 - (.5 + .5 * Math.cos(i * 23)) * .05;
      const height = h * (.12 + (.5 + .5 * Math.sin(i * 17)) * .28);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, -h * .40, z), new THREE.Vector3(x + size * .04, -h * .40 + height * .5, z + .003),
        new THREE.Vector3(x - size * .025, -h * .40 + height, z),
      ]);
      add(new THREE.TubeGeometry(curve, 12, size * .010, 5, false), material(i % 2 ? '#5f9c73' : '#8fae72'), 0, 0, 0);
    }
    const swimmers = [];
    for (let i = 0; i < 6; i++) {
      const fish = new THREE.Group(); room.add(fish);
      const body = material(['#eebf68', '#df8169', '#75bac4'][i % 3], .25, .32);
      const fin = material(['#da814f', '#b65064', '#417fa0'][i % 3], .15, .45);
      const part = mesh => { fish.add(mesh); return mesh; };
      part(sphere(0, 0, 0, size * .047, body)).scale.set(.58, 1, 1.65);
      part(sphere(0, -size * .005, size * .070, size * .015, body));
      for (const side of [-1, 1]) {
        part(sphere(side * size * .025, size * .017, size * .041, size * .011, glow('#f6e5bd')));
        part(sphere(side * size * .031, size * .018, size * .047, size * .0055, glow('#12353f')));
        const wing = part(add(new THREE.ConeGeometry(size * .027, size * .052, 3), fin,
          side * size * .033, -size * .008, -.001));
        wing.rotation.z = side * 1.1; wing.scale.z = .2;
      }
      const tail = part(add(new THREE.ConeGeometry(size * .05, size * .055, 3), fin, 0, 0, -size * .086));
      tail.rotation.x = Math.PI / 2; tail.scale.x = .3;
      swimmers.push({ fish, tail });
    }
    const bubbles = [];
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({ color: '#9ddbd7', metalness: .4, roughness: .12, transparent: true, opacity: .32, depthWrite: false });
    for (let i = 0; i < 16; i++) bubbles.push(sphere(w * .32 + Math.sin(i * 41) * size * .07, 0, -.045 - (i % 4) * .014,
      size * (.008 + (i % 3) * .004), bubbleMaterial));
    const rays = [];
    for (let i = 0; i < 9; i++) rays.push([(i - 4) * w * .15, h * .5, -.117], [(i - 4) * w * .15 - w * .19, -h * .4, -.117]);
    lines(rays, '#639b93', .25);
    const animate = time => {
      swimmers.forEach(({ fish, tail }, i) => {
        const t = time * .32 + i * 1.7;
        fish.position.set(Math.sin(t) * w * .29, Math.sin(t * .73 + i) * h * .27,
          -.077 + .079 * ((1 + Math.sin(t * .8 + i)) / 2) ** 8);
        fish.rotation.y = Math.cos(t) * .8;
        fish.rotation.z = Math.sin(t * .8) * .12;
        tail.rotation.z = Math.sin(time * 5 + i) * .35;
      });
      bubbles.forEach((bubble, i) => { bubble.position.y = -h * .38 + ((time * .028 + i / 16) % 1) * h * .85; });
    };
    animate(0);
    return { update(dt, time) { animate(time); } };
  },
};
