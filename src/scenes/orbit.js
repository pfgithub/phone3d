export default {
  id: 'orbit',
  name: 'Orbital study',
  description: 'Golden orbits and small planets suspended in midnight blue.',
  build({ THREE, w, h, size, material, glow, sphere, ring, chamber, screenFrame }) {
    screenFrame();
    chamber(.12, '#121c36');
    const gold=material('#e9c68a',.65,.25);
    sphere(0,0,-.06,size*.12,material('#f3cd91',.3,.3));
    for(let i=0;i<3;i++) {
      const r=size*(.23+i*.1);
      const orbit=ring(0,0,-.06,r,.0005,gold);orbit.rotation.set(.35+i*.45,.25+i*.3,i*.7);
      const planet=new THREE.Vector3(r,0,0).applyEuler(orbit.rotation);
      sphere(planet.x,planet.y,planet.z-.06,size*(.035+i*.012),material(['#8ed8df','#afafe9','#d18c75'][i],.25,.35));
    }
    // Deterministic star positions stay steady through resize and calibration.
    for(let i=0;i<65;i++) sphere(Math.sin(i*127.1)*w*.48,Math.sin(i*311.7)*h*.48,-.115,.00025,glow('#b7cddd'));
  },
};
