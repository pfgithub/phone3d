export default {
  id: 'terrain',
  name: 'River miniature',
  description: 'A winding river and rolling hills, all within 8 mm beneath the glass.',
  build({ THREE, w, h, material, add, screenFrame }) {
    screenFrame();
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
  },
};
