export default {
  id: 'crystal',
  name: 'Breaking the surface',
  description: 'A crystal reaches 32 mm out of the screen. Tilt gently.',
  build({ THREE, size, material, glow, add, ring, chamber, screenFrame }) {
    screenFrame();
    chamber(.018, '#202b45');
    const rim=glow('#83e8ff');
    ring(0,0,-.001,size*.31,.0007,rim);
    ring(0,0,-.012,size*.37,.0004,rim);
    const crystal=add(new THREE.ConeGeometry(size*.19,.052,5),material('#91bffa',.45,.18),0,0,.006);
    crystal.rotation.x=Math.PI/2; crystal.rotation.y=.25;
    // Cone axis is now +z: its tip is precisely 32 mm in front of the glass.
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4;
      const shard=add(new THREE.OctahedronGeometry(size*.045),material('#c8abef',.45,.24),Math.cos(a)*size*.32,Math.sin(a)*size*.32,-.006);
      shard.rotation.z=a;
    }
  },
};
