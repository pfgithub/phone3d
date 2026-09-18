import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const position = { x: .22, y: -.15, rotation: [0, 0, 0, 1] };

export default {
  id: 'trackball-console',
  name: 'Trackball console',
  description: 'Roll the dotted ceramic trackball in its deep socket to steer the radar cursor. Press the inset square to recenter.',
  build({ THREE, room, w, h, size, material, glow, add, box, sphere, ring, lines }) {
    const s = Math.min(size, Math.max(w, h) * .70);
    const landscape = w > h;
    const ballX = landscape ? w * .24 : 0, ballY = landscape ? -h * .03 : -h * .20;
    const displayX = landscape ? -w * .23 : 0, displayY = landscape ? 0 : h * .20;
    const font = new FontLoader().parse(fontData);
    const label = (text, x, y, height) => {
      const g = new THREE.ShapeGeometry(font.generateShapes(text, height)); g.computeBoundingBox();
      g.translate(-(g.boundingBox.min.x + g.boundingBox.max.x) / 2, 0, 0);
      add(g, glow('#9edfd7'), x, y, -s * .003);
    };
    const panel = new THREE.Shape();
    panel.moveTo(-w / 2, -h / 2); panel.lineTo(w / 2, -h / 2);
    panel.lineTo(w / 2, h / 2); panel.lineTo(-w / 2, h / 2); panel.closePath();
    const hole = (x, y, r) => { const path = new THREE.Path(); path.absarc(x, y, r, 0, Math.PI * 2, true); panel.holes.push(path); };
    hole(ballX, ballY, s * .235); hole(displayX, displayY, s * .28);
    const resetX = ballX + s * .30, resetY = ballY - s * .22;
    const resetHole = new THREE.Path();
    resetHole.moveTo(resetX - s * .045, resetY - s * .045); resetHole.lineTo(resetX + s * .045, resetY - s * .045);
    resetHole.lineTo(resetX + s * .045, resetY + s * .045); resetHole.lineTo(resetX - s * .045, resetY + s * .045); resetHole.closePath();
    panel.holes.push(resetHole);
    box(0, 0, -s * .53, w, h, s * .02, material('#081e28'));
    add(new THREE.ExtrudeGeometry(panel, { depth: s * .10, bevelEnabled: false }), material('#274b55', .5, .5), 0, 0, -s * .11);
    ring(ballX, ballY, -s * .025, s * .233, s * .012, material('#a2b8b6', .8, .3));
    ring(displayX, displayY, -s * .025, s * .278, s * .008, material('#527f83', .6, .4));
    add(new THREE.CircleGeometry(s * .278, 64), glow('#072d32'), displayX, displayY, -s * .12);
    for (const r of [.09, .18, .265]) ring(displayX, displayY, -s * .115, s * r, s * .0015, glow('#24615d'));
    lines([[displayX - s * .27, displayY, -s * .114], [displayX + s * .27, displayY, -s * .114],
      [displayX, displayY - s * .27, -s * .114], [displayX, displayY + s * .27, -s * .114]], '#24615d');
    const cursor = new THREE.Group(); room.add(cursor);
    const cursorRing = ring(0, 0, 0, s * .025, s * .003, glow('#c0ffe5')); cursor.add(cursorRing);
    cursor.add(box(0, 0, 0, s * .009, s * .009, s * .003, glow('#d6ffe9')));
    const ball = new THREE.Group(); ball.position.set(ballX, ballY, -s * .26); room.add(ball);
    ball.quaternion.fromArray(position.rotation);
    const shell = sphere(0, 0, 0, s * .22, material('#e3a772', .22, .3)); ball.add(shell);
    // A deterministic spherical dot pattern makes every direction of rolling readable.
    for (let i = 0; i < 150; i++) {
      const z = 1 - 2 * (i + .5) / 150, a = i * 2.399963229728653;
      const radial = Math.sqrt(1 - z * z);
      const dot = sphere(s * .22 * radial * Math.cos(a), s * .22 * radial * Math.sin(a), s * .22 * z,
        s * .006, material('#784935', .1, .6)); ball.add(dot);
    }
    const reset = box(resetX, resetY, -s * .04, s * .075, s * .075, s * .035, material('#70b6aa', .3, .4));
    const resetMark = ring(resetX, resetY, -s * .021, s * .018, s * .003, glow('#d5ffeb'));
    label('VECTOR / TRACK', 0, h * .43, s * .032);
    label('ROLL TO EXPLORE', 0, -h * .43, s * .023);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), s * .04), point = new THREE.Vector3();
    const axis = new THREE.Vector3(), rotation = new THREE.Quaternion();
    let active = null, lastX = 0, lastY = 0, resetDepth = 0;
    const overReset = p => p && p.ray.intersectObject(reset, false).length > 0;
    const move = p => {
      if (!p || !p.ray.ray.intersectPlane(plane, point)) return;
      const dx = point.x - lastX, dy = point.y - lastY;
      lastX = point.x; lastY = point.y;
      const distance = Math.hypot(dx, dy);
      if (!distance) return;
      axis.set(-dy, dx, 0).normalize(); rotation.setFromAxisAngle(axis, distance / (s * .22));
      ball.quaternion.premultiply(rotation); ball.quaternion.toArray(position.rotation);
      position.x = THREE.MathUtils.clamp(position.x + dx / (s * .32), -.9, .9);
      position.y = THREE.MathUtils.clamp(position.y + dy / (s * .32), -.9, .9);
      const radius = Math.hypot(position.x, position.y);
      if (radius > .9) { position.x *= .9 / radius; position.y *= .9 / radius; }
    };
    const live = {
      pointerDown(p) {
        if (!p) return false;
        room.updateMatrixWorld(true);
        if (overReset(p)) { active = 'reset'; return true; }
        if (!p.ray.intersectObject(shell, false).length || !p.ray.ray.intersectPlane(plane, point)) return false;
        active = 'ball'; lastX = point.x; lastY = point.y; return true;
      },
      pointerMove(p) { if (active === 'ball') move(p); },
      pointerUp(p) {
        if (active === 'ball') move(p);
        if (active === 'reset' && overReset(p)) { position.x = 0; position.y = 0; }
        active = null;
      },
      update(dt) {
        cursor.position.set(displayX + position.x * s * .24, displayY + position.y * s * .24, -s * .10);
        resetDepth += ((active === 'reset' ? s * .028 : 0) - resetDepth) * (1 - Math.exp(-dt * 25));
        reset.position.z = -s * .04 - resetDepth; resetMark.position.z = -s * .021 - resetDepth;
      },
    };
    live.update(0); return live;
  },
};
