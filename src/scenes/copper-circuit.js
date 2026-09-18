export default {
  id: 'copper-circuit',
  name: 'Copper currents',
  description: 'A dark circuit board at the glass, with sunken copper tracks, raised components, and looping jumper wires.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, lines }) {
    const rect=(x,y,width,height)=>{
      const s=new THREE.Shape();s.moveTo(x-width/2,y-height/2);s.lineTo(x+width/2,y-height/2);
      s.lineTo(x+width/2,y+height/2);s.lineTo(x-width/2,y+height/2);s.closePath();return s;
    };
    const panel=rect(0,0,w,h),copper=material('#dba06b',.65,.3),ink=glow('#a7cbbb');
    copper.emissive.set('#dba06b'); copper.emissiveIntensity=.25;
    const depth=.004,trackH=size*.062;
    for(let row=0;row<3;row++) {
      const y=(row-1)*h*.25,trackW=w*.72;
      panel.holes.push(new THREE.Path(rect(0,y,trackW,trackH).getPoints()));
      box(0,y,-depth-.0003,trackW,trackH,.0006,glow('#092b29'));
      for(const side of [-1,1]) {
        box(0,y+side*trackH/2,-depth/2,trackW,size*.002,depth,material('#54796a',.2,.6));
        box(side*trackW/2,y,-depth/2,size*.002,trackH,depth,material('#54796a',.2,.6));
      }
      box(0,y,-depth+.0005,trackW*.96,size*.020,.0007,copper);
      for(const side of [-1,1]) ring(side*w*.29,y,-.003,size*.017,size*.005,copper);
    }
    const surface=add(new THREE.ShapeGeometry(panel),glow('#174d46'),0,0,0);surface.name='glass-surface';
    // A chip bridges the middle trench; bent legs contact the zero-plane board.
    box(0,0,.0024,size*.25,size*.18,.0048,material('#273332',.15,.55));
    box(0,0,.00482,size*.20,size*.13,.00003,glow('#364641'));
    for(const side of [-1,1]) for(let i=0;i<6;i++) {
      const x=(i-2.5)*size*.037;
      box(x,side*size*.115,.0013,size*.013,size*.073,.0026,copper);
      box(x,side*size*.15,.0004,size*.023,size*.025,.0008,copper);
    }
    for(let i=0;i<3;i++) box(0,(i-1)*size*.024,.00486,size*(.12-i*.022),size*.006,.00003,ink);
    sphere(-size*.086,size*.053,.0048,size*.008,glow('#eca574')).scale.z=.15;
    const colors=['#efb259','#e58e83','#92d3c6'];
    for(let i=0;i<3;i++) {
      const side=i%2?-1:1,x=side*w*(.20+i*.025),startY=-h*.25,endY=i===1?0:h*.25;
      const curve=new THREE.CatmullRomCurve3([
        new THREE.Vector3(x,startY,-.0025),new THREE.Vector3(x-side*size*.02,startY+size*.05,.006+i*.001),
        new THREE.Vector3(x-side*size*.025,endY-size*.05,.007+i*.001),new THREE.Vector3(x,endY,-.0025),
      ]);
      add(new THREE.TubeGeometry(curve,32,size*.012,8,false),material(colors[i],.15,.45),0,0,0);
      for(const y of [startY,endY]) sphere(x,y,-.0015,size*.021,copper).scale.z=.6;
    }
    for(let i=0;i<3;i++) {
      const x=(i-1)*size*.11,y=h*.37;
      box(x,y,.0004,size*.063,size*.065,.0008,copper);
      const led=sphere(x,y,.0018,size*.020,glow(i===1?'#b5fcd4':'#557e65'));led.scale.z=.6;
    }
    const silk=[];
    for(const side of [-1,1]) {
      silk.push([side*w*.43,-h*.42,.00004],[side*w*.43,h*.42,.00004]);
      for(let i=0;i<5;i++) box(side*w*.39,-h*.37+i*size*.019,.00004,size*.023,size*.003,.00005,ink);
    }
    lines(silk,'#6d9f8c');
    for(let i=0;i<8;i++) box((i-3.5)*size*.040,-h*.43,.00015,size*.023,size*.055,.0003,copper);
  },
};
