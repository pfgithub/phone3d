import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

export default {
  id: 'spring-joystick',
  name: 'Pocket spring joystick',
  description: 'Drag the inset joystick to steer a floating target, then let go to watch it spring home. Hold the two recessed keys to change the target.',
  build({ THREE, room, w, h, size, material, glow, add, box, sphere, ring, lines }) {
    const s = Math.min(size, Math.max(w, h) * .70);
    const landscape = w > h;
    const controlX = landscape ? w * .23 : 0, controlY = landscape ? 0 : -h * .18;
    const displayX = landscape ? -w * .23 : 0, displayY = landscape ? 0 : h * .20;
    const font = new FontLoader().parse(fontData);
    const label = (text, x, y, height) => {
      const g = new THREE.ShapeGeometry(font.generateShapes(text, height)); g.computeBoundingBox();
      g.translate(-(g.boundingBox.min.x + g.boundingBox.max.x) / 2, 0, 0);
      add(g, glow('#355545'), x, y, -s * .003);
    };
    const panel = new THREE.Shape();
    panel.moveTo(-w / 2, -h / 2); panel.lineTo(w / 2, -h / 2);
    panel.lineTo(w / 2, h / 2); panel.lineTo(-w / 2, h / 2); panel.closePath();
    const cut = (x, y, r) => { const path = new THREE.Path(); path.absarc(x, y, r, 0, Math.PI * 2, true); panel.holes.push(path); };
    cut(controlX, controlY, s * .23); cut(displayX, displayY, s * .27);
    box(0, 0, -s * .33, w, h, s * .02, material('#183d34'));
    label('ORBIT / SPRING', 0, h * .43, s * .037);
    label('DRAG / RELEASE / REPEAT', 0, -h * .44, s * .020);
    ring(controlX, controlY, -s * .02, s * .229, s * .008, material('#537661', .6, .4));
    for (let i = 0; i < 4; i++) ring(controlX, controlY, -s * (.20 - i * .024), s * (.18 - i * .021), s * .011, material('#32483c', .1, .85));
    const stick = new THREE.Group(); stick.position.set(controlX, controlY, -s * .25); room.add(stick);
    const stem = add(new THREE.CylinderGeometry(s * .023, s * .023, s * .12, 24), material('#afba9b', .75, .3), 0, 0, s * .07);
    stem.rotation.x = Math.PI / 2; stick.add(stem);
    const cap = sphere(0, 0, s * .15, s * .095, material('#b7cba3', .18, .5));
    cap.scale.z = .55; stick.add(cap);
    for (const r of [.035, .060, .081]) stick.add(ring(0, 0, s * (.15 + .052 * Math.sqrt(1 - (r / .095) ** 2)), s * r, s * .002, glow('#698565')));
    add(new THREE.CircleGeometry(s * .268, 64), glow('#18392e'), displayX, displayY, -s * .21);
    for (const r of [.085, .165, .245]) ring(displayX, displayY, -s * .203, s * r, s * .0015, glow('#416748'));
    lines([[displayX - s * .25, displayY, -s * .20], [displayX + s * .25, displayY, -s * .20],
      [displayX, displayY - s * .25, -s * .20], [displayX, displayY + s * .25, -s * .20]], '#416748');
    const target = new THREE.Group(); room.add(target);
    target.add(add(new THREE.OctahedronGeometry(s * .04), material('#e6c780', .5, .3), 0, 0, 0));
    const halo = ring(0, 0, 0, s * .063, s * .003, glow('#e0dd97')); target.add(halo);
    const keys = [-1, 1].map(direction => {
      const x = controlX + direction * s * .29, y = controlY - s * .19;
      cut(x, y, s * .055);
      const mesh = add(new THREE.CylinderGeometry(s * .044, s * .044, s * .03, 32), material(direction < 0 ? '#daae70' : '#80a899', .2, .45), x, y, -s * .035);
      mesh.rotation.x = Math.PI / 2;
      const mark = box(x, y, -s * .018, s * .025, s * .006, s * .003, glow('#355545'));
      return { mesh, mark, direction, press: 0 };
    });
    add(new THREE.ExtrudeGeometry(panel, { depth: s * .13, bevelEnabled: false }), material('#ced8ba', .15, .7), 0, 0, -s * .14);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), s * .05), point = new THREE.Vector3();
    let active = null, x = 0, y = 0, vx = 0, vy = 0, aimX = 0, aimY = 0, offsetX = 0, offsetY = 0;
    const move = p => {
      if (!p || !p.ray.ray.intersectPlane(plane, point)) return;
      aimX = (point.x - controlX - offsetX) / (s * .10); aimY = (point.y - controlY - offsetY) / (s * .10);
      const length = Math.hypot(aimX, aimY); if (length > 1) { aimX /= length; aimY /= length; }
    };
    const live = {
      pointerDown(p) {
        if (!p) return false;
        room.updateMatrixWorld(true);
        const hit = p.ray.intersectObjects([cap, ...keys.map(key => key.mesh)], false)[0]; if (!hit) return false;
        if (hit.object === cap) {
          if (!p.ray.ray.intersectPlane(plane, point)) return false;
          active = 'stick'; offsetX = point.x - controlX - x * s * .10; offsetY = point.y - controlY - y * s * .10;
          aimX = x; aimY = y;
        } else active = keys.find(key => key.mesh === hit.object);
        return true;
      },
      pointerMove(p) { if (active === 'stick') move(p); },
      pointerUp() { active = null; aimX = 0; aimY = 0; },
      update(dt, time = 0) {
        const duration = Math.min(dt, .05), steps = Math.max(1, Math.ceil(duration * 240)), step = duration / steps;
        for (let i = 0; i < steps; i++) {
          const damping = active === 'stick' ? 32 : 12;
          vx += ((aimX - x) * 420 - vx * damping) * step; vy += ((aimY - y) * 420 - vy * damping) * step;
          x += vx * step; y += vy * step;
        }
        stick.rotation.set(-y * .55, x * .55, 0);
        target.position.set(displayX + x * s * .15, displayY + y * s * .15, -s * .13);
        target.rotation.z = time * .35;
        const expand = active && active !== 'stick' && active.direction > 0;
        const contract = active && active !== 'stick' && active.direction < 0;
        const scale = expand ? 1.4 : contract ? .65 : 1;
        target.scale.setScalar(target.scale.x + (scale - target.scale.x) * (1 - Math.exp(-dt * 20)));
        keys.forEach(key => {
          key.press += ((active === key ? 1 : 0) - key.press) * (1 - Math.exp(-dt * 30));
          key.mesh.position.z = -s * (.035 + key.press * .025); key.mark.position.z = -s * (.018 + key.press * .025);
        });
      },
    };
    live.update(0, 0); return live;
  },
};
