export default {
  id: 'pressed-sage',
  name: 'Pressed sage',
  description: 'Matte sage leaves rest against warm paper, their soft ridges barely above the glass.',
  build({ THREE, w, h, size, material, glow, add, sphere }) {
    add(new THREE.PlaneGeometry(w, h), glow('#e3dece'), 0, 0, 0);
    const leafMaterials = ['#91a08a', '#a6af98', '#7e9587'].map(color => {
      const mat = material(color, .02, .9);
      mat.emissive.set(color);
      mat.emissiveIntensity = .3;
      return mat;
    });
    const stemMaterial = material('#9a9c7b', .02, .85);
    stemMaterial.emissive.set('#9a9c7b');
    stemMaterial.emissiveIntensity = .25;
    const veinMaterial = material('#b7bea3', .02, .95);
    const shadow = new THREE.MeshBasicMaterial({
      color: '#6d7965', transparent: true, opacity: .10, depthWrite: false,
    });
    const stemPoint = t => new THREE.Vector3(
      w * (-.13 + .23 * t + .045 * Math.sin(t * Math.PI)),
      h * (-.34 + .66 * t), .00018,
    );
    const stem = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => stemPoint(i / 11)));
    add(new THREE.TubeGeometry(stem, 48, size * .0022, 8, false), stemMaterial, 0, 0, 0);
    for (let i = 0; i < 8; i++) {
      const t = .14 + Math.floor(i / 2) * .21 + (i % 2) * .05;
      const base = stemPoint(t);
      const side = i % 2 ? 1 : -1;
      const length = size * (.14 - Math.floor(i / 2) * .014);
      const width = length * .42;
      const angle = side * (.88 + .12 * Math.sin(i * 2));
      const dx = -Math.sin(angle), dy = Math.cos(angle);
      const x = base.x + dx * length * .87;
      const y = base.y + dy * length * .87;
      const footprint = add(new THREE.CircleGeometry(1, 40), shadow,
        x + size * .002, y - size * .002, .000025);
      footprint.scale.set(width * 1.08, length * 1.03, 1);
      footprint.rotation.z = angle;
      const leaf = sphere(x, y, .00006, 1, leafMaterials[i % 3]);
      leaf.scale.set(width, length, .00075 + .00012 * Math.sin(i));
      leaf.rotation.z = angle;
      const points = [];
      for (let j = 0; j <= 20; j++) {
        const u = -.88 + j / 20 * 1.76;
        points.push(new THREE.Vector3(x + dx * length * u, y + dy * length * u,
          .00006 + (.00075 + .00012 * Math.sin(i)) * Math.sqrt(1 - u * u) + .000015));
      }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, .000035, 5, false),
        veinMaterial, 0, 0, 0);
    }
  },
};
