export default {
  id: 'nautilus',
  name: 'Inside a nautilus',
  description: 'A shell sliced open at the glass: porcelain lips, deep peach chambers, and a pearl nestled inside the spiral.',
  build({ THREE, w, h, size, material, glow, add, sphere }) {
    add(new THREE.PlaneGeometry(w * 4, h * 4), glow('#442f42'), 0, 0, -.11);
    const shell = material('#f1ad8e', .12, .65); shell.side = THREE.DoubleSide;
    shell.emissive.set('#f1ad8e'); shell.emissiveIntensity = .45;
    const edge = material('#fff1cb', .1, .4);
    edge.emissive.set('#fff1cb'); edge.emissiveIntensity = .35;
    const start = -Math.PI * 4.6, end = .5;
    // A logarithmic spiral swept with an open half-circle creates real hollow
    // chambers. All cut edges sit at the glass; the shell curves away inside.
    const section = t => {
      const angle = start + t * (end - start);
      const radius = size * .014 * Math.exp(t * 3.1);
      const width = radius * .58;
      return { angle, radius, width };
    };
    const point = (t, phi) => {
      const { angle, radius, width } = section(t);
      const r = radius + width * Math.cos(phi);
      return new THREE.Vector3(Math.cos(angle) * r - size * .07, Math.sin(angle) * r,
        -.001 - width * Math.sin(phi) * 1.55);
    };
    const vertices = [], indices = [], steps = 240, sides = 24;
    for (let i = 0; i <= steps; i++) for (let j = 0; j <= sides; j++) {
      vertices.push(...point(i / steps, j / sides * Math.PI).toArray());
    }
    for (let i = 0; i < steps; i++) for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j, b = a + sides + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const mesh = new THREE.BufferGeometry();
    mesh.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    mesh.setIndex(indices); mesh.computeVertexNormals(); add(mesh, shell, 0, 0, 0);
    for (const phi of [0, Math.PI]) {
      const path = Array.from({ length: 181 }, (_, i) => point(i / 180, phi));
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), 240, size * .005, 6, false), edge, 0, 0, 0);
    }
    // Transverse septa divide the coil into cups, with an open final chamber.
    for (let i = 1; i <= 27; i++) {
      const t = i / 29, path = [];
      for (let j = 0; j <= 24; j++) path.push(point(t, j / 24 * Math.PI));
      const wall = new THREE.BufferGeometry(), positions = [];
      const { angle, radius } = section(t);
      const center = [Math.cos(angle) * radius - size * .07, Math.sin(angle) * radius, -.001];
      for (let j = 0; j < 24; j++) positions.push(...center, ...path[j].toArray(), ...path[j + 1].toArray());
      wall.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); wall.computeVertexNormals();
      const septum = material(i % 2 ? '#dd886d' : '#e99e7d', .05, .7); septum.side = THREE.DoubleSide;
      septum.emissive.copy(septum.color); septum.emissiveIntensity = .45;
      add(wall, septum, 0, 0, 0);
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), 24, size * .003, 5, false), edge, 0, 0, 0);
      const a = point(t, 0), b = point(t, Math.PI);
      add(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, size * .003, 5, false), edge, 0, 0, 0);
    }
    const pearlPosition = point(.98, Math.PI / 2);
    const pearl = material('#fff3e0', .3, .17);
    pearl.emissive.set('#fff3e0'); pearl.emissiveIntensity = .25;
    sphere(pearlPosition.x, pearlPosition.y, pearlPosition.z + size * .045, size * .047, pearl);
  },
};
