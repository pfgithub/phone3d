export default {
  id: 'tide-pools',
  name: 'Tidal porcelain',
  description: 'Turquoise pools cut into a pale shore at the glass; pebbles, shells, and coral break the surface.',
  build({ THREE, w, h, size, material, glow, add, sphere, ring, lines }) {
    const panel = new THREE.Shape();
    panel.moveTo(-w/2,-h/2); panel.lineTo(w/2,-h/2); panel.lineTo(w/2,h/2); panel.lineTo(-w/2,h/2); panel.closePath();
    const shore = glow('#e7d8b8'), coral = material('#ed947e',.05,.8);
    coral.emissive.set('#ed947e'); coral.emissiveIntensity=.3;
    const pools = [[-w*.18,h*.22,size*.19,.013],[w*.17,-h*.04,size*.21,.020],[-w*.16,-h*.29,size*.135,.009]];
    for (const [cx,cy,r,depth] of pools) {
      const points = [];
      for(let i=0;i<=72;i++) {
        const a=i/72*Math.PI*2, radius=r*(1+.10*Math.sin(a*3)+.055*Math.cos(a*5));
        points.push(new THREE.Vector2(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius));
      }
      const opening = new THREE.Shape(points); panel.holes.push(new THREE.Path(points));
      const vertices=[];
      for(let i=0;i<72;i++) {
        const a=points[i],b=points[i+1];
        vertices.push(a.x,a.y,0,b.x,b.y,0,b.x,b.y,-depth,a.x,a.y,0,b.x,b.y,-depth,a.x,a.y,-depth);
      }
      const wall=new THREE.BufferGeometry(); wall.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); wall.computeVertexNormals();
      const sides=material('#619a91',.1,.8); sides.side=THREE.DoubleSide; add(wall,sides,0,0,0);
      add(new THREE.ShapeGeometry(opening),glow('#267f83'),0,0,-depth);
      for(let i=0;i<9;i++) {
        const a=i*2.4, rr=r*(.20+.055*i);
        const pebble=sphere(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,-depth+.0008,size*(.014+.003*(i%3)),material(i%2?'#76c6b5':'#c3ddbc',.1,.7));
        pebble.scale.z=.5;
      }
      for(const fraction of [.35,.60,.82]) ring(cx,cy,-depth+.0012,r*fraction,size*.0015,glow('#68bab1'));
      // Branching coral rises from the pool floor through the glass.
      const x=cx+r*.55,y=cy-r*.15;
      const branch=(dx,dy,top) => {
        const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y,-depth),new THREE.Vector3(x+dx*.3,y+dy*.3,-depth*.35),new THREE.Vector3(x+dx,y+dy,top)]);
        add(new THREE.TubeGeometry(curve,12,size*.012,7,false),coral,0,0,0);
        sphere(x+dx,y+dy,top,size*.013,coral);
      };
      branch(0,0,.004); branch(-r*.23,r*.17,.0025); branch(r*.18,r*.20,.005);
    }
    const surface=add(new THREE.ShapeGeometry(panel,72),shore,0,0,0); surface.name='glass-surface';
    for(let i=0;i<32;i++) {
      const x=Math.sin(i*127.1)*w*.44,y=Math.sin(i*311.7)*h*.44;
      if(pools.some(([cx,cy,r])=>Math.hypot(x-cx,y-cy)<r*1.22)) continue;
      const pebble=sphere(x,y,.0005,size*(.010+.008*Math.sin(i*4)**2),material(i%3?'#c5ba9c':'#f9eed7',.05,.9)); pebble.scale.z=.55;
    }
    const sx=w*.24,sy=h*.32, sr=size*.075;
    const shell=sphere(sx,sy,.0002,sr,material('#f6bda0',.1,.65)); shell.scale.set(1,.8,.45);
    const ribs=[];
    for(let i=0;i<9;i++) {
      const a=.15+i/8*(Math.PI-.3);
      ribs.push([sx,sy-sr*.55,.001],[sx+Math.cos(a)*sr*.88,sy+Math.sin(a)*sr*.6,.002]);
    }
    lines(ribs,'#bc836b');
  },
};
