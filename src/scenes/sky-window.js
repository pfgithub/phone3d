export default {
  id: 'sky-window',
  name: 'A patch of sky',
  description: 'A cream wall at the glass opens onto distant blue sky and clouds, with a brass latch and projecting sill.',
  build({ THREE, w, h, size, material, glow, add, box, sphere }) {
    const aw = w*.62, ah = h*.46, depth = .009;
    const rectangle = (width, height) => {
      const s = new THREE.Shape();
      s.moveTo(-width/2,-height/2); s.lineTo(width/2,-height/2);
      s.lineTo(width/2,height/2); s.lineTo(-width/2,height/2); s.closePath(); return s;
    };
    const panel = rectangle(w,h); panel.holes.push(new THREE.Path(rectangle(aw,ah).getPoints()));
    const surface = add(new THREE.ShapeGeometry(panel), glow('#ede1cc'), 0, 0, 0);
    surface.name = 'glass-surface';
    const trim = material('#b8c6bd', .1, .7), white = glow('#fdf4df');
    for (const side of [-1,1]) {
      box(side*(aw/2+size*.015),0,-depth/2,size*.03,ah+size*.06,depth,trim);
      box(0,side*(ah/2+size*.015),-depth/2,aw,size*.03,depth,trim);
      box(side*(aw/2+size*.027),0,.0008,size*.012,ah+size*.09,.0016,white);
      box(0,side*(ah/2+size*.027),.0008,aw+size*.066,size*.012,.0016,white);
    }
    // A large enclosed sky stays behind the opening even at oblique viewpoints.
    const sky = glow('#64b9e5'); sky.side = THREE.BackSide;
    add(new THREE.BoxGeometry(w+1,h+1,.8),sky,0,0,-.415);
    sphere(w*.17,h*.16,-.20,size*.18,glow('#fff0b9'));
    const cloud = (x,y,z,scale) => {
      for (let i=0;i<7;i++) {
        const puff = sphere(x+(i-3)*size*.08*scale,y+Math.sin(i*1.7)*size*.024*scale,z,
          size*(.063+.018*Math.sin(i*2.1)**2)*scale,glow(i%3===0?'#d4ebf3':'#f5fcff'));
        puff.scale.set(1.5,.75,.65);
      }
    };
    cloud(-w*.13,h*.10,-.12,1.3);
    cloud(w*.12,-h*.13,-.075,.95);
    cloud(-w*.18,-h*.26,-.19,1.6);
    box(0,-ah/2-size*.029,.002,aw+size*.13,size*.04,.010,material('#eee3ce',.1,.65));
    // Slender mullion and a latch make the zero plane easy to judge.
    box(-aw*.18,0,-.001,size*.014,ah,.006,white);
    box(0,ah*.16,-.001,aw,size*.014,.006,white);
    const brass = material('#c48d43',.65,.35);
    brass.emissive.set('#c48d43'); brass.emissiveIntensity=.25;
    box(aw/2+size*.048,-ah*.12,.001,size*.026,size*.07,.002,brass);
    box(aw/2+size*.04,-ah*.12,.0035,size*.065,size*.013,.003,brass);
    for (let i=0;i<3;i++) box(-w*.33+i*size*.035,-h*.39,.00003,size*.016,size*.003,.00004,glow('#bfad92'));
  },
};
