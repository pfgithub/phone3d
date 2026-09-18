import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

let setting = 4 / 11;

export default {
  id: 'shuttle-dial',
  name: 'Recessed shuttle dial',
  description: 'Turn the scalloped dial inside its circular well. It clicks into twelve positions; the inset minus and plus keys step it precisely.',
  build({ THREE, room, w, h, size, material, glow, add, box, ring }) {
    const s = size * .85;
    const font = new FontLoader().parse(fontData);
    const label = (text, x, y, height, color = '#c7cee9', z = -s * .003) => {
      const g = new THREE.ShapeGeometry(font.generateShapes(text, height)); g.computeBoundingBox();
      g.translate(-(g.boundingBox.min.x + g.boundingBox.max.x) / 2, 0, 0);
      return add(g, glow(color), x, y, z);
    };
    const panel = new THREE.Shape();
    panel.moveTo(-w / 2, -h / 2); panel.lineTo(w / 2, -h / 2);
    panel.lineTo(w / 2, h / 2); panel.lineTo(-w / 2, h / 2); panel.closePath();
    const cutCircle = (x, y, r) => {
      const path = new THREE.Path(); path.absarc(x, y, r, 0, Math.PI * 2, true); panel.holes.push(path);
    };
    const centerY = h * .035, keyY = -h * .33;
    cutCircle(0, centerY, s * .32);
    box(0, 0, -s * .20, w, h, s * .02, material('#151628'));
    label('SHUTTLE / 12', 0, h * .40, s * .042);
    label('TURN / FINE ADJUST', 0, -h * .44, s * .021);
    ring(0, centerY, -s * .018, s * .318, s * .006, material('#939ab6', .7, .3));
    const dial = new THREE.Group(); dial.position.set(0, centerY, -s * .08); room.add(dial);
    const dialShape = new THREE.Shape(); dialShape.absarc(0, 0, s * .275, 0, Math.PI * 2, false);
    const fingerHole = new THREE.Path(); fingerHole.absarc(0, s * .115, s * .045, 0, Math.PI * 2, true);
    dialShape.holes.push(fingerHole);
    const disc = add(new THREE.ExtrudeGeometry(dialShape, { depth: s * .07, bevelEnabled: false, curveSegments: 48 }),
      material('#73768e', .7, .32), 0, 0, -s * .035);
    dial.add(disc);
    for (let j = 0; j < 48; j++) {
      const a = j / 48 * Math.PI * 2;
      const rib = box(Math.sin(a) * s * .272, Math.cos(a) * s * .272, 0,
        s * .013, s * .016, s * .073, material('#afb2c7', .65, .4));
      rib.rotation.z = -a; dial.add(rib);
    }
    dial.add(ring(0, 0, s * .036, s * .222, s * .002, glow('#3a3d54')));
    dial.add(ring(0, 0, s * .037, s * .16, s * .002, glow('#888fae')));
    dial.add(box(0, s * .228, s * .038, s * .016, s * .045, s * .004, glow('#ffcea0')));
    // A dark concave finger cup is inset into the face of the rotating dial.
    const cup = add(new THREE.SphereGeometry(s * .045, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      Object.assign(material('#303348', .25, .6), { side: THREE.BackSide }), 0, s * .115, s * .037);
    cup.rotation.x = -Math.PI / 2; dial.add(cup);
    dial.add(ring(0, s * .115, s * .038, s * .045, s * .003, material('#979db9', .5, .4)));
    const ticks = [];
    for (let i = 0; i < 12; i++) {
      const a = -.75 * Math.PI + i / 11 * Math.PI * 1.5;
      const tick = box(Math.sin(a) * s * .365, centerY + Math.cos(a) * s * .365, -s * .003,
        s * .012, s * .027, s * .003, glow('#53566f'));
      tick.rotation.z = -a; ticks.push(tick);
    }
    const keys = [-1, 1].map(direction => {
      const x = direction * s * .19;
      cutCircle(x, keyY, s * .068);
      const mesh = add(new THREE.CylinderGeometry(s * .055, s * .055, s * .035, 40), material('#ada7bd', .35, .4), x, keyY, -s * .04);
      mesh.rotation.x = Math.PI / 2;
      const mark = label(direction < 0 ? '-' : '+', x, keyY - s * .016, s * .047, '#343047', -s * .020);
      return { mesh, mark, direction, press: 0 };
    });
    add(new THREE.ExtrudeGeometry(panel, { depth: s * .12, bevelEnabled: false }), material('#35364e', .4, .55), 0, 0, -s * .13);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), s * .04), point = new THREE.Vector3();
    let active = null, lastAngle = 0, shown = setting;
    const angleFrom = p => {
      if (!p || !p.ray.ray.intersectPlane(plane, point)) return null;
      if (Math.hypot(point.x, point.y - centerY) < s * .055) return null;
      return Math.atan2(point.x, point.y - centerY);
    };
    const move = p => {
      const angle = angleFrom(p); if (angle === null) return;
      const delta = Math.atan2(Math.sin(angle - lastAngle), Math.cos(angle - lastAngle));
      setting = THREE.MathUtils.clamp(setting + delta / (Math.PI * 1.5), 0, 1); lastAngle = angle;
    };
    const live = {
      pointerDown(p) {
        if (!p) return false;
        room.updateMatrixWorld(true);
        const hit = p.ray.intersectObjects([disc, cup, ...keys.map(key => key.mesh)], false)[0];
        if (!hit) return false;
        if (hit.object === disc || hit.object === cup) {
          const angle = angleFrom(p); if (angle === null) return false;
          active = 'dial'; lastAngle = angle;
        } else active = keys.find(key => key.mesh === hit.object);
        return true;
      },
      pointerMove(p) { if (active === 'dial') move(p); },
      pointerUp(p) {
        if (active === 'dial') { move(p); setting = Math.round(setting * 11) / 11; }
        else if (active && p && p.ray.intersectObject(active.mesh, false).length) {
          setting = THREE.MathUtils.clamp((Math.round(setting * 11) + active.direction) / 11, 0, 1);
        }
        active = null;
      },
      update(dt) {
        shown += (setting - shown) * (1 - Math.exp(-dt * 24));
        dial.rotation.z = .75 * Math.PI - shown * Math.PI * 1.5;
        ticks.forEach((tick, i) => tick.material.color.set(i === Math.round(setting * 11) ? '#ffcea0' : '#53566f'));
        keys.forEach(key => {
          key.press += ((active === key ? 1 : 0) - key.press) * (1 - Math.exp(-dt * 30));
          key.mesh.position.z = -s * (.04 + key.press * .03);
          key.mark.position.z = -s * (.020 + key.press * .03);
        });
      },
    };
    live.update(0); return live;
  },
};
