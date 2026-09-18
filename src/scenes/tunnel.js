export default {
  id: 'tunnel',
  name: 'Neon passage',
  description: 'Follow the illuminated arches 240 mm into the phone.',
  build({ w, h, size, glow, box, sphere, chamber, screenFrame }) {
    screenFrame();
    chamber(.24, '#13152d');
    for(let i=0;i<13;i++) {
      const z=-.008-i*.018, mat=glow(i%2?'#aa7bea':'#69e5db');
      const a=w*(.43-i*.008), b=h*(.43-i*.008), t=.0007;
      box(-a,0,z,t,b*2,t,mat);box(a,0,z,t,b*2,t,mat);
      box(0,-b,z,a*2,t,t,mat);box(0,b,z,a*2,t,t,mat);
    }
    sphere(0,0,-.225,size*.065,glow('#fff0c0'));
  },
};
