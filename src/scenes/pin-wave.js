export default {
  id: 'pin-wave',
  name: 'Pin tide',
  description: 'Hundreds of enamel pins form a wave across the glass. Tilt to see the long stems beneath their colored tips.',
  build({ THREE, w, h, size, material, glow, add, room }) {
    add(new THREE.PlaneGeometry(w * 3, h * 3), glow('#111c32'), 0, 0, -.08);
    const spacing = size / 23;
    const cols = Math.floor(w * .94 / spacing), rows = Math.floor(h * .94 / spacing);
    const count = cols * rows;
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(spacing * .12, spacing * .12, 1, 6), material('#465570', .6, .4), count);
    const heads = new THREE.InstancedMesh(new THREE.CylinderGeometry(spacing * .42, spacing * .42, spacing * .26, 6), material('#ffffff', .15, .4), count);
    const matrix = new THREE.Object3D(), color = new THREE.Color();
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const index = j * cols + i;
      const x = (i - (cols - 1) / 2) * spacing, y = (j - (rows - 1) / 2) * spacing;
      const distance = Math.hypot(x / size * 1.3 + .22, y / size * .85 - .15);
      const wave = Math.sin(distance * 10 - 1.5) * .5 + .5;
      const z = -.038 + wave * .049;
      matrix.rotation.set(Math.PI / 2, 0, 0);
      matrix.position.set(x, y, (-.063 + z) / 2);
      matrix.scale.set(1, z + .063, 1); matrix.updateMatrix(); stems.setMatrixAt(index, matrix.matrix);
      matrix.position.z = z; matrix.scale.set(1, 1, 1); matrix.updateMatrix(); heads.setMatrixAt(index, matrix.matrix);
      color.setHSL(.63 - wave * .48, .75, .40 + wave * .22);
      heads.setColorAt(index, color);
    }
    // Instancing keeps the dense relief inexpensive on phones.
    for (const mesh of [stems, heads]) {
      mesh.userData.ownMaterial = true;
      mesh.instanceMatrix.needsUpdate = true;
      room.add(mesh);
    }
  },
};
