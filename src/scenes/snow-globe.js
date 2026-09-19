export default {
  id: 'snow-globe',
  name: 'Snow globe',
  description: 'Tilt or shake your phone to swirl snow around a tiny winter village inside a glass globe.',
  build({ THREE, size, room, material, glow, add, box, sphere, ring, chamber }) {
    chamber(size * 1.2, '#122d43');
    const radius = size * .405, cy = size * .055, cz = -radius - size * .02;
    const brass = material('#b99050', .75, .28);
    const pedestal = add(new THREE.CylinderGeometry(radius * .7, radius * .82, size * .09, 64), brass, 0, cy - radius * .91, cz);
    pedestal.position.y -= size * .025;
    const snow = material('#e4f3ef', .05, .9);
    const ground = add(new THREE.CylinderGeometry(radius * .7, radius * .64, size * .035, 48), snow, 0, cy - radius * .76, cz);
    const floorY = ground.position.y + size * .0175;
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * size * .13, z = cz + (i % 2 ? size * .055 : -size * .025);
      box(x, floorY + size * .056, z, size * .09, size * .11, size * .085, material(i === 1 ? '#b96752' : '#648d98', 0, .9));
      const roof = add(new THREE.ConeGeometry(size * .081, size * .064, 4), snow, x, floorY + size * .135, z);
      roof.rotation.y = Math.PI / 4;
      box(x, floorY + size * .058, z + size * .044, size * .025, size * .036, size * .003, glow('#ffe1a0'));
      box(x, floorY + size * .058, z + size * .047, size * .003, size * .037, size * .002, brass);
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        add(new THREE.ConeGeometry(size * (.055 - i * .01), size * .09, 10), material(i === 2 ? '#d6e9df' : '#3d7568', 0, .95),
          side * size * .215, floorY + size * (.045 + i * .036), cz - size * .06);
      }
    }
    const glass = material('#c9efff', .05, .12);
    glass.transparent = true; glass.opacity = .075; glass.depthWrite = false;
    sphere(0, cy, cz, radius, glass);
    const edge = glow('#92bed0'); edge.transparent = true; edge.opacity = .4; edge.depthWrite = false;
    ring(0, cy, cz, radius, size * .002, edge);
    const shine = glow('#d6f4ff'); shine.transparent = true; shine.opacity = .45; shine.depthWrite = false;
    const arc = add(new THREE.TorusGeometry(radius * .96, size * .003, 5, 48, .72), shine, 0, cy, cz + radius * .2);
    arc.rotation.z = .7;
    const count = 620, positions = new Float32Array(count * 3), velocities = new Float32Array(count * 3);
    const random = i => { const n = Math.sin(i * 127.1 + 8) * 43758.5453; return n - Math.floor(n); };
    const bound = radius * .95;
    const floorRadius = Math.min(radius * .69, Math.sqrt(bound ** 2 - (floorY + size * .002 - cy) ** 2));
    for (let i = 0; i < count; i++) {
      const y = random(i * 4) * 2 - 1, angle = random(i * 4 + 1) * Math.PI * 2;
      const r = bound * Math.cbrt(random(i * 4 + 2));
      positions[i * 3] = r * Math.sqrt(1 - y * y) * Math.cos(angle);
      positions[i * 3 + 1] = cy + r * y;
      positions[i * 3 + 2] = cz + r * Math.sqrt(1 - y * y) * Math.sin(angle);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, cy, cz), radius);
    const flakes = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#f5fcff', size: size * .006, sizeAttenuation: true }));
    flakes.userData.ownMaterial = true; room.add(flakes);
    const previous = new THREE.Vector3(); let hadGravity = false;
    return {
      update(dt, time, gravity) {
        const elapsed = Math.min(Math.max(dt, 0), .05);
        const steps = Math.max(1, Math.ceil(elapsed / .012)), step = elapsed / steps;
        const gx = gravity?.x ?? 0, gy = gravity?.y ?? -9.81, gz = gravity?.z ?? 0;
        // A change in measured acceleration kicks the snow; steady gravity lets it settle.
        const kickX = hadGravity && gravity ? THREE.MathUtils.clamp(gx - previous.x, -15, 15) * size * .045 : 0;
        const kickY = hadGravity && gravity ? THREE.MathUtils.clamp(gy - previous.y, -15, 15) * size * .045 : 0;
        const kickZ = hadGravity && gravity ? THREE.MathUtils.clamp(gz - previous.z, -15, 15) * size * .045 : 0;
        previous.set(gx, gy, gz); hadGravity = !!gravity;
        for (let i = 0; i < count; i++) {
          const k = i * 3;
          velocities[k] += kickX; velocities[k + 1] += kickY; velocities[k + 2] += kickZ;
          for (let s = 0; s < steps; s++) {
            const drag = Math.exp(-2.5 * step);
            velocities[k] = (velocities[k] + (gx * size * .026 + Math.sin(time * 1.4 + i) * size * .012) * step) * drag;
            velocities[k + 1] = (velocities[k + 1] + gy * size * .026 * step) * drag;
            velocities[k + 2] = (velocities[k + 2] + (gz * size * .026 + Math.cos(time + i * 2) * size * .012) * step) * drag;
            positions[k] += velocities[k] * step; positions[k + 1] += velocities[k + 1] * step; positions[k + 2] += velocities[k + 2] * step;
            let x = positions[k], y = positions[k + 1] - cy, z = positions[k + 2] - cz;
            const length = Math.hypot(x, y, z);
            if (length > bound) {
              x /= length; y /= length; z /= length;
              positions[k] = x * bound; positions[k + 1] = cy + y * bound; positions[k + 2] = cz + z * bound;
              const outward = Math.max(0, velocities[k] * x + velocities[k + 1] * y + velocities[k + 2] * z);
              velocities[k] -= outward * x * 1.25; velocities[k + 1] -= outward * y * 1.25; velocities[k + 2] -= outward * z * 1.25;
            }
            if (positions[k + 1] < floorY && positions[k + 1] > floorY - size * .05 && Math.hypot(positions[k], positions[k + 2] - cz) < floorRadius) {
              positions[k + 1] = floorY + size * .002;
              velocities[k + 1] = Math.max(0, velocities[k + 1]) * .2;
            }
          }
        }
        geometry.attributes.position.needsUpdate = true;
      },
    };
  },
};
