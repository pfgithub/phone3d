export default {
  id: 'hollow-mask',
  name: 'Hollow mask',
  description: 'A porcelain plane at the glass, moulded inward into a hollow face with the nose deepest. Move gently to see it follow you.',
  build({ THREE, w, h, size, material, add }) {
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
        const jawWidth = 1 - .2 * Math.max(0, -v) ** 2;
        let relief = .016 * Math.sqrt(Math.max(0, 1 - radius * radius));
        relief += .020 * gaussian(u, v, 0, -.02, .16, .32);
        relief += .007 * gaussian(u, v, 0, -.19, .23, .12);
        relief += .004 * gaussian(u, v, 0, -.49, .36, .13);
        relief -= .009 * gaussian(Math.abs(u), v, .38, .22, .23, .16);
        relief += .004 * gaussian(Math.abs(u), v, .38, .4, .28, .1);
        // All facial relief tapers into the exact z = 0 boundary of the surrounding plane.
        const z = -Math.max(0, relief) * (1 - radius ** 8) * size / .0657;
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
    // The polar grid duplicates its seam and center; share normals there to avoid a visible crease.
    const normals = geometry.attributes.normal;
    const normal = new THREE.Vector3(), other = new THREE.Vector3();
    for (let j = 1; j <= rings; j++) {
      const first = j * (segments + 1), last = first + segments;
      normal.fromBufferAttribute(normals, first).add(other.fromBufferAttribute(normals, last)).normalize();
      normals.setXYZ(first, normal.x, normal.y, normal.z);
      normals.setXYZ(last, normal.x, normal.y, normal.z);
    }
    normal.set(0, 0, 0);
    for (let i = 0; i <= segments; i++) normal.add(other.fromBufferAttribute(normals, i));
    normal.normalize();
    for (let i = 0; i <= segments; i++) normals.setXYZ(i, normal.x, normal.y, normal.z);
    const porcelain = material('#ffffff', .05, .6);
    porcelain.vertexColors = true;
    porcelain.side = THREE.DoubleSide;
    add(geometry, porcelain, 0, 0, 0);
    const plane = new THREE.Shape();
    plane.moveTo(-w * 1.5, -h * 1.5);
    plane.lineTo(w * 1.5, -h * 1.5);
    plane.lineTo(w * 1.5, h * 1.5);
    plane.lineTo(-w * 1.5, h * 1.5);
    plane.closePath();
    const opening = new THREE.Path();
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const u = Math.cos(angle), v = Math.sin(angle);
      const x = u * (1 - .2 * Math.max(0, -v) ** 2) * size * .34;
      const y = v * size * .46;
      if (i === 0) opening.moveTo(x, y); else opening.lineTo(x, y);
    }
    opening.closePath(); plane.holes.push(opening);
    add(new THREE.ShapeGeometry(plane), material('#f3d9ba', .05, .6), 0, 0, 0);
  },
};
