export default {
  id: 'light',
  name: 'The light room',
  description: 'A 145 mm deep gallery of floating objects.',
  build({ THREE, w, h, size, material, glow, add, box, lines }) {
    const depth = .145;
    const wall = material('#233c40', 0, .87); wall.side = THREE.DoubleSide;
    const back = material('#15333a', 0, .9);
    const mint = material('#c4efd1', .35, .24);
    const dark = material('#25585c', .75, .23);
    const gold = material('#ecbb7c', .5, .3);
    const light = glow('#baffdd');
    const plinth = material('#42676a', .15, .65);
    box(0,0,-depth-.001,w,h,.002,back);
    box(-w/2-.001,0,-depth/2,.002,h,depth,wall);
    box(w/2+.001,0,-depth/2,.002,h,depth,wall);
    box(0,-h/2-.001,-depth/2,w,.002,depth,wall);
    box(0,h/2+.001,-depth/2,w,.002,depth,wall);
    const grid = [], step = .012;
    for(let x=-w/2; x<=w/2; x+=step){
      grid.push([x,-h/2,-depth+.0001],[x,h/2,-depth+.0001]);
      grid.push([x,-h/2+.0001,0],[x,-h/2+.0001,-depth]);
      grid.push([x,h/2-.0001,0],[x,h/2-.0001,-depth]);
    }
    for(let y=-h/2; y<=h/2; y+=step){
      grid.push([-w/2,y,-depth+.0001],[w/2,y,-depth+.0001]);
      grid.push([-w/2+.0001,y,0],[-w/2+.0001,y,-depth]);
      grid.push([w/2-.0001,y,0],[w/2-.0001,y,-depth]);
    }
    for(let z=0; z>=-depth; z-=step){
      grid.push([-w/2+.0001,-h/2,z],[-w/2+.0001,h/2,z],[w/2-.0001,-h/2,z],[w/2-.0001,h/2,z]);
      grid.push([-w/2,-h/2+.0001,z],[w/2,-h/2+.0001,z],[-w/2,h/2-.0001,z],[w/2,h/2-.0001,z]);
    }
    lines(grid, '#6ca3a5', .26);
    // Two luminous rails carry the eye from the glass to the back wall.
    box(-w/2+.001,-h/2+.002,-depth/2,.0008,.0008,depth,light);
    box(w/2-.001,h/2-.002,-depth/2,.0008,.0008,depth,light);
    const pedestalHeight = h*.16;
    box(0,-h/2+pedestalHeight/2,-.073,size*.47,pedestalHeight,size*.43,plinth);
    box(0,-h/2+pedestalHeight+.0005,-.073,size*.48,.001,size*.44,light);
    add(new THREE.SphereGeometry(size*.17,48,32),mint,size*.06,-h*.05,-.063);
    const ring = add(new THREE.TorusGeometry(size*.29,size*.012,12,96),mint,-size*.03,h*.08,-.084);
    ring.rotation.set(.45,-.5,-.3);
    const satellite = add(new THREE.IcosahedronGeometry(size*.075,0),gold,-size*.26,h*.24,-.04);
    satellite.rotation.set(.3,.5,.2);
    const cube = box(size*.28,-h*.25,-.035,size*.13,size*.13,size*.13,dark);
    cube.rotation.set(.35,.6,.15);
    // A thin frame lives exactly on the physical screen plane.
    lines([[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[w/2,h/2,0],[-w/2,h/2,0],[-w/2,h/2,0],[-w/2,-h/2,0]],'#9bccc1',.7);
  },
};
