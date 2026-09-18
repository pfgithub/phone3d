export default {
  id: 'relief',
  name: 'At the surface',
  description: 'A zero-depth panel with pads raised 4 mm and wells recessed 5 mm.',
  build({ THREE, w, h, size, material, glow, add, ring, screenFrame }) {
    screenFrame();
    const panel = new THREE.Shape();
    panel.moveTo(-w/2,-h/2); panel.lineTo(w/2,-h/2);
    panel.lineTo(w/2,h/2); panel.lineTo(-w/2,h/2); panel.closePath();
    const wells = [[-.22*w,.22*h,size*.105],[.2*w,-.23*h,size*.14]];
    const ceramic = material('#b4d5cb',.1,.65), inset = material('#335c64',.25,.5);
    for (const [x,y,r] of wells) {
      const hole = new THREE.Path(); hole.absarc(x,y,r,0,Math.PI*2,true); panel.holes.push(hole);
      const wall = new THREE.CylinderGeometry(r,r,.005,64,1,true);
      const wallMat = material('#5e8e90',.25,.55); wallMat.side = THREE.DoubleSide;
      const well = add(wall,wallMat,x,y,-.0025); well.rotation.x = Math.PI/2;
      add(new THREE.CircleGeometry(r,64),inset,x,y,-.005);
      ring(x,y,-.0045,r*.65,.00025,glow('#a1e8d6'));
    }
    add(new THREE.ShapeGeometry(panel,64),ceramic,0,0,0);
    for (const [x,y,r,depth] of [[.2*w,.24*h,size*.13,.004],[-.2*w,-.2*h,size*.1,.0025],[0,0,size*.075,.0015]]) {
      const pad = add(new THREE.CylinderGeometry(r,r,depth,64),material('#e5ba80',.35,.35),x,y,depth/2);
      pad.rotation.x = Math.PI/2;
      ring(x,y,depth-.0002,r*.72,.0002,glow('#ffedc7'));
    }
  },
};
