import * as THREE from 'three';

export const SCENES = [
  { id: 'light', name: 'The light room', description: 'A 145 mm deep gallery of floating objects.' },
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

  if (id === 'pocket') {
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
