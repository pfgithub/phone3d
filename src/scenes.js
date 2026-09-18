import * as THREE from 'three';

export const SCENES = [
  { id: 'light', name: 'The light room', description: 'A 145 mm deep gallery of floating objects.' },
  { id: 'relief', name: 'At the surface', description: 'A zero-depth panel with pads raised 4 mm and wells recessed 5 mm.' },
  { id: 'portal', name: 'Another world', description: 'A shallow portal frame opens onto an unbounded alien landscape.' },
  { id: 'terrain', name: 'River miniature', description: 'A winding river and rolling hills, all within 8 mm beneath the glass.' },
  { id: 'pocket', name: 'Pocket mechanism', description: 'Only 7.5 mm deep. A tiny mechanism beneath the glass.' },
  { id: 'crystal', name: 'Breaking the surface', description: 'A crystal reaches 32 mm out of the screen. Tilt gently.' },
  { id: 'tunnel', name: 'Neon passage', description: 'Follow the illuminated arches 240 mm into the phone.' },
  { id: 'garden', name: 'Terraced garden', description: 'A miniature landscape on layered floating islands.' },
  { id: 'orbit', name: 'Orbital study', description: 'Golden orbits and small planets suspended in midnight blue.' },
];

// Physical meters: negative z is inside the phone, positive z faces the viewer.
// Every material here belongs to the scene and is disposed on scene changes.
export function buildExtraScene(id, room, w, h) {
  const size = Math.min(w, h);
  const material = (color, metalness = .15, roughness = .45) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const glow = color => new THREE.MeshBasicMaterial({ color });
  const add = (geometry, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z); mesh.userData.ownMaterial = true; room.add(mesh); return mesh;
  };
  const box = (x,y,z,a,b,c,mat) => add(new THREE.BoxGeometry(a,b,c),mat,x,y,z);
  const sphere = (x,y,z,r,mat) => add(new THREE.SphereGeometry(r,32,24),mat,x,y,z);
  const ring = (x,y,z,r,t,mat) => add(new THREE.TorusGeometry(r,t,12,80),mat,x,y,z);
  const chamber = (depth, color) => {
    const wall = material(color, .2, .75);
    // Back surface and walls never extend beyond the specified physical depth.
    box(0,0,-depth+.00025,w,h,.0005,wall);
    box(-w/2-.00025,0,-depth/2,.0005,h,depth,wall);
    box(w/2+.00025,0,-depth/2,.0005,h,depth,wall);
    box(0,-h/2-.00025,-depth/2,w,.0005,depth,wall);
    box(0,h/2+.00025,-depth/2,w,.0005,depth,wall);
  };
  const frame = glow('#92c8bd');
  box(-w/2,0,-.0002,.0004,h,.0004,frame);
  box(w/2,0,-.0002,.0004,h,.0004,frame);
  box(0,-h/2,-.0002,w,.0004,.0004,frame);
  box(0,h/2,-.0002,w,.0004,.0004,frame);

  if (id === 'relief') {
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
  } else if (id === 'portal') {
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
  } else if (id === 'terrain') {
    // Height field is parallel to the glass, like a tiny topographic model.
    const geometry = new THREE.PlaneGeometry(w,h,100,160);
    const positions = geometry.attributes.position;
    const colors = [];
    const water = new THREE.Color('#66bdc6'), sand = new THREE.Color('#d9c79a');
    const grass = new THREE.Color('#83af83'), rock = new THREE.Color('#647f72');
    for(let i=0;i<positions.count;i++) {
      const x=positions.getX(i)/w, y=positions.getY(i)/h;
      const river=Math.sin(y*9)*.17+Math.sin(y*19)*.035;
      const bank=Math.abs(x-river);
      const rise=THREE.MathUtils.smoothstep(bank,.055,.18);
      const hills=(Math.sin(x*13+y*8)+Math.cos(y*17-x*6)+2)/4;
      const z=-.0075+rise*(.0015+.005*hills);
      positions.setZ(i,z);
      const color=bank<.055 ? water : bank<.08 ? sand : grass.clone().lerp(rock,hills*.7);
      colors.push(color.r,color.g,color.b);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    const ground=material('#ffffff',0,.95); ground.vertexColors=true;
    add(geometry,ground,0,0,0);
    // Small boulders stay below the glass and clear of the river.
    for(let i=0;i<18;i++) {
      const x=(i%2?1:-1)*w*(.32+.08*Math.sin(i*5)), y=Math.sin(i*2.4)*h*.44;
      const hills=(Math.sin(x/w*13+y/h*8)+Math.cos(y/h*17-x/w*6)+2)/4;
      const boulder=add(new THREE.DodecahedronGeometry(.001),material('#c2c7ac',0,.9),x,y,-.006+.005*hills);
      boulder.scale.set(1.3,.8,.65); boulder.rotation.z=i;
    }
  } else if (id === 'pocket') {
    chamber(.0075, '#253c43');
    const brass = material('#e9b76e', .7, .28), steel = material('#87b7bf', .65, .3);
    // Flat gears sit between -6.4 mm and -1.6 mm, including their teeth.
    for (const [x,y,r,phase] of [[-.16,-.13,.23,0],[.2,.1,.17,.15],[-.2,.3,.12,.3]]) {
      const cx=x*size, cy=y*h, radius=r*size;
      ring(cx,cy,-.004,radius*.72,.0012,brass);
      for(let i=0;i<16;i++) {
        const a=i*Math.PI/8+phase;
        const tooth=box(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,-.004,radius*.27,radius*.2,.003,brass);
        tooth.rotation.z=a;
      }
      for(let i=0;i<3;i++) {
        const a=i*Math.PI/3;
        const spoke=box(cx,cy,-.004,radius*1.55,.0015,.002,steel);spoke.rotation.z=a;
      }
      sphere(cx,cy,-.004,.0018,steel);
    }
    for(const x of [-1,1]) for(const y of [-1,1]) {
      ring(x*(w/2-.004),y*(h/2-.004),-.005,.0014,.00045,steel);
    }
    for(let i=0;i<7;i++) box((i-3)*.003,-h*.36,-.006,.001,.006,.0005,glow(i<4?'#afffce':'#426867'));
  } else if(id === 'crystal') {
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
  } else if(id === 'tunnel') {
    chamber(.24, '#13152d');
    for(let i=0;i<13;i++) {
      const z=-.008-i*.018, mat=glow(i%2?'#aa7bea':'#69e5db');
      const a=w*(.43-i*.008), b=h*(.43-i*.008), t=.0007;
      box(-a,0,z,t,b*2,t,mat);box(a,0,z,t,b*2,t,mat);
      box(0,-b,z,a*2,t,t,mat);box(0,b,z,a*2,t,t,mat);
    }
    sphere(0,0,-.225,size*.065,glow('#fff0c0'));
  } else if(id === 'garden') {
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
  } else if(id === 'orbit') {
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
  }
}
