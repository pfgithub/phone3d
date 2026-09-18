export default {
  id: 'contour-quarry',
  name: 'Contour quarry',
  description: 'An ochre map at the glass falls away in colored terraces beside a small raised mesa.',
  build({ THREE, w, h, size, material, glow, add, box, lines }) {
    const cx=-w*.09,cy=h*.10,r=size*.31;
    const polygon=(radius,x=cx,y=cy)=>{
      const points=[];
      for(let i=0;i<8;i++) {
        const a=i*Math.PI/4,rr=radius*(1+.12*Math.sin(i*2.4));
        points.push(new THREE.Vector2(x+Math.cos(a)*rr,y+Math.sin(a)*rr));
      }
      return new THREE.Shape(points);
    };
    const panel=new THREE.Shape(); panel.moveTo(-w/2,-h/2);panel.lineTo(w/2,-h/2);panel.lineTo(w/2,h/2);panel.lineTo(-w/2,h/2);panel.closePath();
    panel.holes.push(new THREE.Path(polygon(r).getPoints()));
    const surface=add(new THREE.ShapeGeometry(panel),glow('#dfb77b'),0,0,0);surface.name='glass-surface';
    const colors=['#b87551','#c98b5d','#d7a26d','#a46148','#8b5350','#547f7b'];
    // Each terrace is an actual annulus with a vertical riser, leaving the next level open.
    for(let level=0;level<6;level++) {
      const outer=r*(1-level*.115),inner=r*(1-(level+1)*.115),z=-level*.006;
      const points=polygon(outer).getPoints(),vertices=[];
      for(let i=0;i<points.length-1;i++) {
        const a=points[i],b=points[i+1];
        vertices.push(a.x,a.y,z,b.x,b.y,z,b.x,b.y,z-.006,a.x,a.y,z,b.x,b.y,z-.006,a.x,a.y,z-.006);
      }
      const wall=new THREE.BufferGeometry();wall.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));wall.computeVertexNormals();
      const mat=material(colors[level],.05,.95);mat.side=THREE.DoubleSide;add(wall,mat,0,0,0);
      const ledge=polygon(outer);ledge.holes.push(new THREE.Path(polygon(inner).getPoints()));
      add(new THREE.ShapeGeometry(ledge),glow(colors[level]),0,0,z-.006);
    }
    add(new THREE.ShapeGeometry(polygon(r*.31)),glow('#63b7b1'),0,0,-.0361);
    const mx=w*.24,my=-h*.27,mr=size*.13;
    for(let level=0;level<4;level++) {
      const shape=polygon(mr*(1-level*.18),mx,my);
      const color=['#ad694d','#c58b59','#ecc791','#f3dbab'][level];
      const stone=material(color,.05,.85);stone.emissive.set(color);stone.emissiveIntensity=.25;
      add(new THREE.ExtrudeGeometry(shape,{depth:.0025,bevelEnabled:false}),stone,0,0,level*.0025);
    }
    // Fine survey marks remain printed on the glass plane.
    const marks=[];
    for(let i=0;i<21;i++) {
      const y=(i/20-.5)*h*.83;
      marks.push([-w*.44,y,.00004],[-w*.44+size*(i%5===0?.035:.018),y,.00004]);
    }
    lines(marks,'#846244');
    const x=w*.35,y=h*.36;
    lines([[x-size*.035,y,.00004],[x+size*.035,y,.00004],[x,y-size*.035,.00004],[x,y+size*.06,.00004]],'#846244');
    for(let i=0;i<4;i++) box(-w*.29+i*size*.038,-h*.39,.00005,size*.026,size*.014,.00006,glow(colors[i]));
  },
};
