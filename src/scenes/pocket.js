export default {
  id: 'pocket',
  name: 'Pocket mechanism',
  description: 'Only 7.5 mm deep. A tiny mechanism beneath the glass.',
  build({ w, h, size, material, glow, box, sphere, ring, chamber, screenFrame }) {
    screenFrame();
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
  },
};
