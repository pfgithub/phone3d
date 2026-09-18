export default {
  id: 'rain-window',
  name: 'Rain on the window',
  description: 'Raindrops cling to the glass while distant city lights slide behind them. A pocket-sized rainy night.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, screenFrame }) {
    box(0, 0, -.85, w * 5, h * 5, .002, glow('#080e24'));
    const random = i => { const n = Math.sin(i * 127.1 + 19.3) * 43758.5453; return n - Math.floor(n); };
    const halos = ['#e99d78', '#7aaec8', '#d888a5'].map(color => new THREE.ShaderMaterial({
      uniforms: { tint: { value: new THREE.Color(color) } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `varying vec2 vUv; uniform vec3 tint;
        void main() { float r = length(vUv - .5) * 2.;
          float a = exp(-r*r*5.) * (1. - smoothstep(.55, 1., r));
          gl_FragColor = vec4(tint, a * .75); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    for (let i = 0; i < 17; i++) {
      const x = (i - 8) * w * .24, height = h * (.35 + random(i) * 1.25), z = -.65 + random(i + 20) * .13;
      box(x, -h * 1.25 + height / 2, z, w * .20, height, .03, glow(i % 2 ? '#10182f' : '#142039'));
      for (let j = 0; j < 11; j++) {
        const y = -h * 1.2 + random(i * 23 + j) * height * .9;
        const light = add(new THREE.PlaneGeometry(size * .095, size * .09), halos[(i + j) % 3],
          x + (random(j * 51 + i) - .5) * w * .15, y, z + .019);
        if (j % 4 === 0) light.scale.set(1.7, 3.5, 1);
      }
    }
    const water = new THREE.MeshPhysicalMaterial({ color: '#8eacbd', metalness: .35, roughness: .08,
      transparent: true, opacity: .55, clearcoat: 1, depthWrite: false });
    const gleam = glow('#c4dbea'), blue = glow('#537889');
    for (let i = 0; i < 65; i++) {
      const x = (random(i * 5 + 100) - .5) * w * .92, y = (random(i * 5 + 101) - .5) * h * .92;
      const r = size * (.009 + random(i * 5 + 102) ** 2 * .030);
      // The apex touches z=0. Drops and their tiny highlights stay anchored to the pane.
      const drop = sphere(x, y, -r * .33, r, water);
      drop.scale.set(.78, 1 + random(i + 309) * .7, .33);
      const highlight = sphere(x - r * .26, y + r * .42, -.00005, r * .15, gleam);
      highlight.scale.set(.6, 1.4, .18);
      const reflection = sphere(x + r * .20, y - r * .3, -.00008, r * .24, blue);
      reflection.scale.set(1.2, .4, .12);
      if (i % 9 === 0) {
        const trail = sphere(x, y + r * 2.5, -r * .15, r, water);
        trail.scale.set(.13, 2.6, .13);
      }
    }
    screenFrame('#466174');
  },
};
