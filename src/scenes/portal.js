export default {
  id: 'portal',
  name: 'Another world',
  description: 'A shallow portal frame opens onto an unbounded alien landscape.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, screenFrame }) {
    screenFrame();
    // Only the frame has side faces: the world extends beyond the aperture.
    const stone = material('#52617c',.5,.4), edge = glow('#b7f6ef');
    const t = .002;
    for (const sign of [-1,1]) {
      box(sign*(w/2-t/2),0,-.0015,t,h,.003,stone);
      box(0,sign*(h/2-t/2),-.0015,w,t,.003,stone);
      box(sign*(w/2-t),0,-.0001,.00035,h-2*t,.0002,edge);
      box(0,sign*(h/2-t),-.0001,w-2*t,.00035,.0002,edge);
    }
    add(new THREE.PlaneGeometry(w*12,h*12),glow('#35365e'),0,0,-.6);
    sphere(w*.8,h*.65,-.48,size*.48,glow('#f5c5a0'));
    const halo = ring(w*.8,h*.65,-.475,size*.65,.001,glow('#aa86b4')); halo.rotation.z=.3;
    // Overlapping mountain silhouettes stretch sideways, with no enclosing walls.
    for(let layer=0;layer<4;layer++) {
      const shape = new THREE.Shape();
      shape.moveTo(-w*4,-h*4);
      for(let i=0;i<=32;i++) {
        const x=-w*4+i*w/4;
        const y=h*(.12-layer*.14)+Math.sin(i*1.7+layer)*h*.13+Math.cos(i*.7)*h*.09;
        shape.lineTo(x,y);
      }
      shape.lineTo(w*4,-h*4); shape.closePath();
      add(new THREE.ShapeGeometry(shape),glow(['#66658b','#577a8a','#376875','#214c5b'][layer]),0,0,-.36+layer*.075);
    }
    for(let i=0;i<30;i++) sphere(Math.sin(i*127.1)*w*2,Math.cos(i*31.7)*h,-.42,.0005,glow('#dfd5f4'));
    for(let i=0;i<9;i++) {
      const x=Math.sin(i*2.4)*w*.9, y=-h*(.24+(i%3)*.09), z=-.065-(i%3)*.012;
      const stem=box(x,y,z,.001,size*.12,.001,material('#8b9f99'));
      sphere(stem.position.x,y+size*.07,z,size*.025,glow('#9debd4'));
    }
  },
};
