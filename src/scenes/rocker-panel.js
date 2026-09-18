import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const enabled = [true, false, true];

export default {
  id: 'rocker-panel',
  name: 'Sunken rocker switches',
  description: 'Press either end of the three recessed rockers. Their hinged faces tip into the panel and switch the matching light chambers.',
  build({ THREE, room, w, h, size: s, material, glow, add, box, ring }) {
    const font = new FontLoader().parse(fontData);
    const label = (text, x, y, height) => {
      const g = new THREE.ShapeGeometry(font.generateShapes(text, height)); g.computeBoundingBox();
      g.translate(-(g.boundingBox.min.x + g.boundingBox.max.x) / 2, 0, 0);
      add(g, glow('#654c44'), x, y, -s * .003);
    };
    const panel = new THREE.Shape();
    panel.moveTo(-w / 2, -h / 2); panel.lineTo(w / 2, -h / 2);
    panel.lineTo(w / 2, h / 2); panel.lineTo(-w / 2, h / 2); panel.closePath();
    const cut = (x, y, width, height) => {
      const path = new THREE.Path(); path.moveTo(x - width / 2, y - height / 2);
      path.lineTo(x + width / 2, y - height / 2); path.lineTo(x + width / 2, y + height / 2);
      path.lineTo(x - width / 2, y + height / 2); path.closePath(); panel.holes.push(path);
    };
    box(0, 0, -s * .24, w, h, s * .025, material('#362924'));
    const colors = ['#f1b266', '#7ac8b4', '#d69aaa'], controls = [], targets = [];
    const switchY = -h * .08, lightY = h * .20;
    label('CIRCUIT / STUDIO', 0, h * .40, s * .036);
    label('PRESS EITHER END', 0, -h * .42, s * .022);
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * s * .28;
      cut(x, switchY, s * .20, s * .29);
      cut(x, lightY, s * .17, h * .115);
      const light = box(x, lightY, -s * .10, s * .16, h * .108, s * .015, glow(colors[i]));
      for (let j = -2; j <= 2; j++) box(x + j * s * .031, lightY, -s * .047,
        s * .007, h * .115, s * .025, material('#8b7569', .4, .5));
      const pivot = new THREE.Group(); pivot.position.set(x, switchY, -s * .08); room.add(pivot);
      const face = box(0, 0, 0, s * .173, s * .25, s * .044, material('#f0e0cd', .12, .45));
      pivot.add(face); targets.push(face);
      pivot.add(box(0, s * .076, s * .024, s * .007, s * .035, s * .002, glow('#806452')));
      pivot.add(ring(0, -s * .076, s * .024, s * .017, s * .003, glow('#806452')));
      for (let j = -1; j <= 1; j++) pivot.add(box(j * s * .031, 0, s * .024, s * .003, s * .023, s * .002, glow('#c1ac96')));
      for (const side of [-1, 1]) {
        const axle = add(new THREE.CylinderGeometry(s * .018, s * .018, s * .017, 20), material('#7a6557', .8, .3), x + side * s * .094, switchY, -s * .08);
        axle.rotation.z = Math.PI / 2;
      }
      label(['AMBER', 'MINT', 'ROSE'][i], x, switchY - s * .22, s * .022);
      const angle = enabled[i] ? -.30 : .30;
      pivot.rotation.x = angle;
      controls.push({ pivot, face, light, angle, velocity: 0, color: new THREE.Color(colors[i]) });
    }
    add(new THREE.ExtrudeGeometry(panel, { depth: s * .15, bevelEnabled: false }), material('#d4bba5', .15, .7), 0, 0, -s * .16);
    let active = -1, desired = false;
    const local = new THREE.Vector3(), dim = new THREE.Color('#443e36');
    const live = {
      pointerDown(p) {
        if (!p) return false;
        room.updateMatrixWorld(true);
        const hit = p.ray.intersectObjects(targets, false)[0];
        if (!hit) return false;
        active = targets.indexOf(hit.object);
        controls[active].pivot.worldToLocal(local.copy(hit.point)); desired = local.y > 0;
        return true;
      },
      pointerUp(p) {
        if (active >= 0 && p && p.ray.intersectObject(controls[active].face, false).length) enabled[active] = desired;
        active = -1;
      },
      update(dt) {
        const duration = Math.min(dt, .05), steps = Math.max(1, Math.ceil(duration * 240)), step = duration / steps;
        controls.forEach((control, i) => {
          const target = (active === i ? desired : enabled[i]) ? -.30 : .30;
          for (let j = 0; j < steps; j++) {
            control.velocity += ((target - control.angle) * 650 - control.velocity * 24) * step;
            control.angle += control.velocity * step;
          }
          control.pivot.rotation.x = control.angle;
          control.light.material.color.copy(dim).lerp(control.color, enabled[i] ? 1 : 0);
        });
      },
    };
    live.update(0); return live;
  },
};
