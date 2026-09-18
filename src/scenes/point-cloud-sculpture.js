export default {
  id: 'point-cloud-sculpture',
  name: 'Point-cloud sculpture',
  description: 'A skull hidden in static. Move slowly sideways: only the dots’ relative motion reveals its depth.',
  build({ THREE, room, w, h, size, box, glow, screenFrame }) {
    box(0, 0, -.13, w * 2, h * 2, .002, glow('#02080f'));
    screenFrame('#315366');
    const random = i => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
    const positions = [];
    for (let i = 0; i < 6500; i++) {
      // Uniform screen-space density deliberately removes silhouette and shading cues.
      const x = (random(i * 3) - .5) * w * 1.4;
      const y = (random(i * 3 + 1) - .5) * h * 1.4;
      const u = x / (size * .31), v = y / (size * .42);
      const cranium = u * u + ((v - .23) / .88) ** 2;
      const jaw = (u / .66) ** 2 + ((v + .55) / .47) ** 2;
      let z = -.108 - random(i * 3 + 2) * .012;
      if (cranium < 1 || jaw < 1) {
        z = -.068 + .038 * Math.sqrt(Math.max(0, 1 - Math.min(cranium, jaw)));
        const socket = Math.exp(-(((Math.abs(u) - .4) / .22) ** 2 + ((v - .08) / .24) ** 2));
        const nose = Math.exp(-((u / .15) ** 2 + ((v + .23) / .25) ** 2));
        z -= socket * .026 + nose * .021;
        if (v < -.42 && v > -.69 && Math.abs(u) < .48) {
          z -= .009 * (.5 + .5 * Math.cos(u * 52));
        }
      }
      // Match the app's default 12-inch eye distance.
      const perspective = 1 - z / .3048;
      positions.push(x * perspective, y * perspective, z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const dots = new THREE.Points(geometry, new THREE.ShaderMaterial({
      uniforms: { ink: { value: new THREE.Color('#a0f4df') } },
      vertexShader: `void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 2.0;
      }`,
      fragmentShader: `uniform vec3 ink;
        void main() {
          float r = length(gl_PointCoord - .5);
          if (r > .5) discard;
          gl_FragColor = vec4(ink, 1.0);
        }`,
    }));
    dots.userData.ownMaterial = true;
    room.add(dots);
  },
};
