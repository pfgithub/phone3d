export default {
  id: 'ribbon-weave',
  name: 'Threaded through',
  description: 'Satin ribbons bow above a plum card, then disappear through paired slots below the glass.',
  build({ THREE, w, h, size, material, glow, add, box, lines }) {
    const rectangle=(x,y,width,height)=>{
      const s=new THREE.Shape(); s.moveTo(x-width/2,y-height/2); s.lineTo(x+width/2,y-height/2);
      s.lineTo(x+width/2,y+height/2); s.lineTo(x-width/2,y+height/2); s.closePath(); return s;
    };
    const panel=rectangle(0,0,w,h);
    const colors=['#f0ad83','#99cabb','#d5b5e4'];
    for(let row=0;row<3;row++) {
      const y=(row-1)*h*.25, half=size*.043;
      for(const side of [-1,1]) {
        const x=side*w*.25, sw=w*.14, sh=size*.13;
        panel.holes.push(new THREE.Path(rectangle(x,y,sw,sh).getPoints()));
        box(x,y,-.010,sw,sh,.001,glow('#231a32'));
        for(const edge of [-1,1]) {
          box(x+edge*sw/2,y,-.005,size*.002,sh,.010,material('#715573',.1,.8));
          box(x,y+edge*sh/2,-.005,sw,size*.002,.010,material('#715573',.1,.8));
          box(x,y+edge*(sh/2+size*.008),.00008,sw,size*.003,.0001,glow('#b18b9f'));
        }
      }
      const positions=[],indices=[],stitches=[];
      const point=(t,across)=>{
        const twist=Math.sin(t*Math.PI*2+row*.5);
        return [(t-.5)*w*.58,y+across*half,-.008+.016*Math.sin(t*Math.PI)**.45+across*twist*.0014];
      };
      for(let i=0;i<=64;i++) {
        const t=i/64; positions.push(...point(t,-1),...point(t,1));
        if(i<64) { const a=i*2; indices.push(a,a+1,a+2,a+1,a+3,a+2); }
        if(i>4 && i<60 && i%3===0) for(const side of [-1,1]) {
          const a=point(t,side*.82),b=point(t+.013,side*.82); a[2]+=.00008;b[2]+=.00008;stitches.push(a,b);
        }
      }
      const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
      const satin=material(colors[row],.22,.45); satin.side=THREE.DoubleSide;
      satin.emissive.set(colors[row]); satin.emissiveIntensity=.3;
      add(geometry,satin,0,0,0); lines(stitches,'#fff0dc');
      for(let i=0;i<5;i++) box((i-2)*size*.018,y-size*.098,.00003,size*.007,size*.002,.00004,glow('#aa859f'));
    }
    const surface=add(new THREE.ShapeGeometry(panel),glow('#50364f'),0,0,0); surface.name='glass-surface';
    const stitching=[];
    for(let i=0;i<40;i++) for(const side of [-1,1]) {
      const y=(i/40-.5)*h*.90;
      stitching.push([side*w*.44,y,.00004],[side*w*.44,y+h*.011,.00004]);
    }
    lines(stitching,'#bb8eac');
  },
};
