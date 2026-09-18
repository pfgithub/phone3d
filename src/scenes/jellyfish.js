export default {
  id: 'jellyfish',
  name: 'Jellyfish aquarium',
  description: 'Luminous bells and curling tentacles suspended in deep ocean blue.',
  build({ THREE, w, h, size, material, glow, add, sphere, ring, chamber, screenFrame }) {
    chamber(.14, '#06192c');
    screenFrame('#55cde2');
    const colors = ['#7fe9ed', '#e2a1ff', '#8bbcff'];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * w * .25;
      const y = [h * .18, -h * .09, h * .27][i];
      const z = [-.045, -.075, -.105][i];
      const r = size * [.14, .18, .12][i];
      const bell = material(colors[i], .15, .25);
      bell.emissive.set(colors[i]);
      bell.emissiveIntensity = .35;
      const dome = add(new THREE.SphereGeometry(r, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), bell, x, y, z);
      dome.scale.y = .7;
      const rim = ring(x, y, z, r, size * .006, glow(colors[i]));
      rim.rotation.x = Math.PI / 2;
      sphere(x, y + r * .15, z, r * .28, glow('#e1ffff'));
      for (let j = 0; j < 7; j++) {
        const angle = j * Math.PI * 2 / 7;
        const points = [];
        for (let k = 0; k <= 12; k++) {
          const t = k / 12;
          points.push(new THREE.Vector3(
            x + Math.cos(angle) * r * .7 + Math.sin(t * 7 + j) * r * .25 * t,
            y - t * r * (2.4 + .4 * Math.sin(j)),
            z + Math.sin(angle) * r * .7 + Math.sin(t * 5 + j) * r * .3 * t,
          ));
        }
        add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, size * .0025, 5, false), glow(colors[i]), 0, 0, 0);
      }
    }
    for (let i = 0; i < 36; i++) {
      sphere(Math.sin(i * 127.1) * w * .46, Math.sin(i * 311.7) * h * .46,
        -.025 - (i % 9) * .012, size * .0025, glow('#508baf'));
    }
  },
};
