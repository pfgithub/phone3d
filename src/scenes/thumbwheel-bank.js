import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const values = [.3, .6, .4];

export default {
  id: 'thumbwheel-bank',
  name: 'Thumbwheel bank',
  description: 'Roll three knurled brass thumbwheels up and down inside their slots. Feel the visual click as each settles into a detent.',
  build({ THREE, room, w, h, size: s, material, glow, add, box }) {
    const font = new FontLoader().parse(fontData);
    const label = (text, x, y, height, color = '#453c2f', z = -s * .004) => {
      const geometry = new THREE.ShapeGeometry(font.generateShapes(text, height));
      geometry.computeBoundingBox();
      geometry.translate(-(geometry.boundingBox.min.x + geometry.boundingBox.max.x) / 2, 0, 0);
      return add(geometry, glow(color), x, y, z);
    };
    const panel = new THREE.Shape();
    panel.moveTo(-w / 2, -h / 2); panel.lineTo(w / 2, -h / 2);
    panel.lineTo(w / 2, h / 2); panel.lineTo(-w / 2, h / 2); panel.closePath();
    const slot = (x, y, width, height) => {
      const hole = new THREE.Path();
      hole.moveTo(x - width / 2, y - height / 2); hole.lineTo(x + width / 2, y - height / 2);
      hole.lineTo(x + width / 2, y + height / 2); hole.lineTo(x - width / 2, y + height / 2); hole.closePath();
      panel.holes.push(hole);
    };
    box(0, 0, -s * .39, w, h, s * .025, material('#211c19'));
    label('INDEX / 03', 0, h * .37, s * .05);
    label('ROLL TO ADJUST', 0, -h * .38, s * .023);
    const radius = s * .16, centerZ = -s * .19;
    const wheels = [], targets = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * s * .26;
      slot(x, 0, s * .19, s * .31);
      label(['LOW', 'MID', 'HIGH'][i], x, s * .23, s * .025);
      const group = new THREE.Group(); group.position.set(x, 0, centerZ); room.add(group);
      const drum = add(new THREE.CylinderGeometry(radius, radius, s * .155, 64), material('#b98b48', .75, .32), 0, 0, 0);
      drum.rotation.z = Math.PI / 2; group.add(drum); targets.push(drum);
      for (let j = 0; j < 60; j++) {
        const a = j / 60 * Math.PI * 2;
        const rib = box(0, Math.sin(a) * radius, Math.cos(a) * radius, s * .15, s * .004, s * .004,
          material(j % 6 === 0 ? '#f2d28f' : '#8c6537', .6, .4));
        rib.rotation.x = -a; group.add(rib);
      }
      // Ten enamel index marks travel over the curved surface with the ribs.
      for (let j = 0; j < 10; j++) {
        const a = j / 10 * Math.PI * 2;
        const mark = box(0, Math.sin(a) * (radius + s * .003), Math.cos(a) * (radius + s * .003),
          s * .07, s * .012, s * .002, glow('#302b25'));
        mark.rotation.x = -a; group.add(mark);
      }
      box(x, 0, -s * .012, s * .205, s * .004, s * .003, glow('#f4e8ce'));
      const leds = [];
      for (let j = 0; j <= 10; j++) leds.push(box(x + (j - 5) * s * .016, -s * .24, -s * .003,
        s * .009, s * .026, s * .003, glow('#67583d')));
      wheels.push({ group, leds, angle: -values[i] * Math.PI * 2 });
    }
    add(new THREE.ExtrudeGeometry(panel, { depth: s * .08, bevelEnabled: false }), material('#d1c2a3', .25, .6), 0, 0, -s * .09);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), s * .035);
    const point = new THREE.Vector3();
    let active = -1, lastY = 0;
    const move = p => {
      if (!p || !p.ray.ray.intersectPlane(plane, point)) return;
      values[active] = THREE.MathUtils.clamp(values[active] + (point.y - lastY) / (s * .7), 0, 1);
      lastY = point.y;
    };
    const live = {
      pointerDown(p) {
        if (!p) return false;
        room.updateMatrixWorld(true);
        const hit = p.ray.intersectObjects(targets, false)[0];
        if (!hit || !p.ray.ray.intersectPlane(plane, point)) return false;
        active = targets.indexOf(hit.object); lastY = point.y; return true;
      },
      pointerMove(p) { if (active >= 0) move(p); },
      pointerUp(p) {
        if (active < 0) return;
        move(p); values[active] = Math.round(values[active] * 10) / 10; active = -1;
      },
      update(dt) {
        wheels.forEach((wheel, i) => {
          wheel.angle += (-values[i] * Math.PI * 2 - wheel.angle) * (1 - Math.exp(-dt * 28));
          wheel.group.rotation.x = wheel.angle;
          wheel.leds.forEach((led, j) => led.material.color.set(j <= Math.round(values[i] * 10) ? '#df9f34' : '#67583d'));
        });
      },
    };
    live.update(0); return live;
  },
};
