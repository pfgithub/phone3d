export default {
  id: 'garden',
  name: 'Terraced garden',
  description: 'A miniature landscape on layered floating islands.',
  build({ THREE, w, h, size, material, add, box, sphere, chamber, screenFrame }) {
    screenFrame();
    chamber(.095, '#203b3b');
    for(let i=0;i<5;i++) {
      const x=Math.sin(i*2.4)*w*.22, y=(i-2)*h*.15, z=-.024-i*.012;
      const island=add(new THREE.CylinderGeometry(size*.18,size*.13,.007,6),material('#537773',.1,.9),x,y,z);
      island.rotation.x=Math.PI/2;
      const grass=add(new THREE.CylinderGeometry(size*.178,size*.178,.001,6),material('#a3c995',0,.95),x,y,z+.004);
      grass.rotation.x=Math.PI/2;
      for(let j=0;j<3;j++) {
        const px=x+(j-1)*size*.085, py=y+Math.sin(j*3+i)*size*.06;
        box(px,py,z+.009,.0015,.0015,.011,material('#b49774'));
        sphere(px,py,z+.016,size*(.037+j*.009),material(['#74bda0','#c6d997','#6fa48e'][j],0,.9));
      }
    }
  },
};
