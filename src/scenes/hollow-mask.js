export default {
  id: 'hollow-mask',
  name: 'Hollow mask',
  description: 'A face moulded inward, nose deepest. Move gently and let the hollow face appear to follow you.',
  build({ THREE, size, material, glow, add, box, ring, chamber }) {
    chamber(.085, '#241d30');
    box(0, 0, -.077, size * .91, size * 1.12, .005, material('#48344d'));
    const gaussian = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
    const positions = [], colors = [], indices = [];
    const skin = new THREE.Color('#f3d9ba');
    const rose = new THREE.Color('#a66e72');
    const dark = new THREE.Color('#48323d');
    const segments = 128, rings = 64;
    for (let j = 0; j <= rings; j++) {
      const radius = j / rings;
      for (let i = 0; i <= segments; i++) {
        const angle = i / segments * Math.PI * 2;
        const u = Math.cos(angle) * radius, v = Math.sin(angle) * radius;
        const jawWidth = 1 - .2 * Math.max(0, -v);
        let relief = .016 * Math.sqrt(Math.max(0, 1 - radius * radius));
        relief += .020 * gaussian(u, v, 0, -.02, .16, .32);
        relief += .007 * gaussian(u, v, 0, -.19, .23, .12);
        relief += .004 * gaussian(u, v, 0, -.49, .36, .13);
        relief -= .009 * gaussian(Math.abs(u), v, .38, .22, .23, .16);
        relief += .004 * gaussian(Math.abs(u), v, .38, .4, .28, .1);
        const z = -.009 - relief;
        positions.push(u * jawWidth * size * .34, v * size * .46, z);
        const lip = gaussian(u, v, 0, -.49, .29, .053);
        const eyes = gaussian(Math.abs(u), v, .38, .23, .15, .025);
        const brows = gaussian(Math.abs(u), v, .39, .405, .2, .028);
        const nostrils = gaussian(Math.abs(u), v, .115, -.20, .036, .028);
        const color = skin.clone().lerp(rose, Math.min(.85, lip));
        color.lerp(dark, Math.min(.85, eyes + brows * .65 + nostrils * .6));
        colors.push(color.r, color.g, color.b);
        if (j < rings && i < segments) {
          const a = j * (segments + 1) + i, b = a + segments + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const porcelain = material('#ffffff', .05, .6);
    porcelain.vertexColors = true;
    porcelain.side = THREE.DoubleSide;
    add(geometry, porcelain, 0, 0, 0);
    const rim = ring(0, 0, -.009, size * .35, size * .012, material('#bb9060', .7, .3));
    rim.scale.y = 1.34;
    for (const side of [-1, 1]) {
      box(side * size * .4, 0, -.067, size * .012, size * .94, .003, glow('#ba8c68'));
    }
  },
};
