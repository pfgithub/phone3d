export default {
  id: 'holographic-foil-card',
  name: 'Holographic foil card',
  description: 'An embossed cosmic voyager. Tilt the card to sweep diffraction colours across the foil and raised armour.',
  build({ THREE, size, material, glow, add, box, sphere, ring, chamber }) {
    chamber(.045, '#1c1930');
    const width = size * .76, height = size * 1.02, radius = size * .045;
    const rounded = new THREE.Shape();
    rounded.moveTo(-width / 2 + radius, -height / 2);
    rounded.lineTo(width / 2 - radius, -height / 2);
    rounded.absarc(width / 2 - radius, -height / 2 + radius, radius, -Math.PI / 2, 0, false);
    rounded.lineTo(width / 2, height / 2 - radius);
    rounded.absarc(width / 2 - radius, height / 2 - radius, radius, 0, Math.PI / 2, false);
    rounded.lineTo(-width / 2 + radius, height / 2);
    rounded.absarc(-width / 2 + radius, height / 2 - radius, radius, Math.PI / 2, Math.PI, false);
    rounded.lineTo(-width / 2, -height / 2 + radius);
    rounded.absarc(-width / 2 + radius, -height / 2 + radius, radius, Math.PI, Math.PI * 1.5, false);
    const foil = new THREE.ShaderMaterial({
      uniforms: { scale: { value: size } },
      vertexShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.);
          vWorld = world.xyz; vNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * world;
        }`,
      fragmentShader: `uniform float scale; varying vec3 vWorld; varying vec3 vNormal;
        void main() {
          vec3 eye = normalize(cameraPosition - vWorld);
          vec3 n = normalize(vNormal);
          vec2 p = vWorld.xy / scale;
          float angle = eye.x * 3.7 + eye.y * 2.1 + dot(n.xy, eye.xy) * 1.4;
          float bands = p.x * 1.8 + p.y * .7 + angle;
          vec3 rainbow = .5 + .5 * cos(6.28318 * (bands + vec3(0., .333, .667)));
          float fresnel = pow(1. - max(0., dot(n, eye)), 2.);
          vec2 cell = floor(p * 220.);
          float grain = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
          float spark = pow(max(0., cos(grain * 100. + angle * 24.)), 48.) * step(.83, grain);
          float engraving = .90 + .1 * sin((p.x - p.y) * 1100.);
          float light = .6 + .4 * max(0., dot(n, normalize(vec3(-.4, .7, 1.))));
          gl_FragColor = vec4((rainbow * .68 + .19) * engraving * light + spark * .5 + fresnel * .18, 1.);
        }`,
    });
    add(new THREE.ExtrudeGeometry(rounded, { depth: size * .025, bevelEnabled: true, bevelSize: size * .008,
      bevelThickness: size * .007, bevelSegments: 3, curveSegments: 16 }), material('#ad92b0', .85, .25), 0, 0, -.0082 - size * .032);
    add(new THREE.ShapeGeometry(rounded), foil, 0, 0, -.008);
    const border = material('#eed6ab', .7, .3), dark = material('#292c4a', .5, .3);
    box(0, size * .39, -.006, size * .62, size * .095, .002, dark);
    // Raised, geometric lettering: NOVA.
    const letters = [
      ['10001', '11001', '10101', '10011', '10001'],
      ['01110', '10001', '10001', '10001', '01110'],
      ['10001', '10001', '10001', '01010', '00100'],
      ['01110', '10001', '11111', '10001', '10001'],
    ];
    const titleInk = glow('#f9dfb4');
    letters.forEach((letter, l) => letter.forEach((row, y) => [...row].forEach((on, x) => {
      if (on === '1') box((l * 6 + x - 11) * size * .020, size * .39 + (2 - y) * size * .011,
        -.0045, size * .013, size * .008, .0004, titleInk);
    })));
    const halo = ring(0, size * .095, -.003, size * .26, size * .012, foil);
    halo.scale.y = 1.1;
    // An embossed astronaut has genuine relief, including a visor that projects past the glass.
    sphere(0, size * .13, .002, size * .119, foil).scale.set(1, 1.1, .65);
    sphere(0, size * .14, size * .068, size * .081, dark).scale.set(1, .7, .22);
    const torso = box(0, -size * .085, .001, size * .18, size * .21, size * .08, foil);
    torso.rotation.z = -.07;
    for (const side of [-1, 1]) {
      const arm = box(side * size * .14, -size * .065, 0, size * .065, size * .21, size * .065, foil);
      arm.rotation.z = side * .24;
      const boot = box(side * size * .06, -size * .24, -.002, size * .073, size * .14, size * .07, foil);
      boot.rotation.z = side * .08;
      sphere(side * size * .05, -size * .055, size * .047, size * .012, glow('#c7f2e2'));
    }
    ring(0, -size * .135, size * .044, size * .027, size * .006, border);
    for (let i = 0; i < 5; i++) {
      const star = add(new THREE.OctahedronGeometry(size * .019), border, (i - 2) * size * .085, -size * .415, -.002);
      star.scale.z = .35;
    }
    for (const side of [-1, 1]) box(side * size * .33, 0, -.005, size * .008, size * .68, .001, border);
  },
};
