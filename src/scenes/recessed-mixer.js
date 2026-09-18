import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const channels = [{ value: .72, muted: false }, { value: .45, muted: false }, { value: .86, muted: false }];

export default {
  id: 'recessed-mixer',
  name: 'Recessed mixing desk',
  description: 'Slide three ribbed faders through deep channels. Press the sunken channel keys to mute their animated level meters.',
  build({ THREE, room, w, h, size: s, material, glow, add, box }) {
    const font = new FontLoader().parse(fontData);
    const label = (text, x, y, height) => {
      const g = new THREE.ShapeGeometry(font.generateShapes(text, height)); g.computeBoundingBox();
      g.translate(-(g.boundingBox.min.x + g.boundingBox.max.x) / 2, 0, 0);
      add(g, glow('#b8c9d4'), x, y, -s * .003);
    };
    const panel = new THREE.Shape();
    panel.moveTo(-w / 2, -h / 2); panel.lineTo(w / 2, -h / 2);
    panel.lineTo(w / 2, h / 2); panel.lineTo(-w / 2, h / 2); panel.closePath();
    const cut = (x, y, width, height) => {
      const path = new THREE.Path();
      path.moveTo(x - width / 2, y - height / 2); path.lineTo(x + width / 2, y - height / 2);
      path.lineTo(x + width / 2, y + height / 2); path.lineTo(x - width / 2, y + height / 2); path.closePath();
      panel.holes.push(path);
    };
    box(0, 0, -s * .17, w, h, s * .025, material('#0b1425'));
    const travel = h * .43, keyY = -h * .32;
    const colors = ['#e8ad71', '#84d8d0', '#b8a2ed'];
    const controls = [], targets = [], kinds = new Map();
    label('CHANNEL / THREE', 0, h * .40, s * .036);
    label('SLIDE / PRESS TO MUTE', 0, -h * .43, s * .021);
    channels.forEach((channel, i) => {
      const x = (i - 1) * s * .29;
      cut(x, 0, s * .125, travel + s * .095);
      const floor = box(x, 0, -s * .14, s * .125, travel + s * .09, s * .012, material('#09121c'));
      targets.push(floor); kinds.set(floor, { i, type: 'fader' });
      box(x, 0, -s * .12, s * .012, travel + s * .035, s * .015, material('#9ba9b2', .8, .3));
      const thumb = new THREE.Group(); thumb.position.set(x, (channel.value - .5) * travel, -s * .056); room.add(thumb);
      const cap = box(0, 0, 0, s * .105, s * .077, s * .045, material(colors[i], .35, .4)); thumb.add(cap);
      targets.push(cap); kinds.set(cap, { i, type: 'fader' });
      for (let j = -1; j <= 1; j++) thumb.add(box(0, j * s * .017, s * .024,
        s * .067, s * .004, s * .004, glow('#2a384b')));
      cut(x, keyY, s * .13, s * .071);
      const key = box(x, keyY, -s * .039, s * .113, s * .056, s * .035, material(colors[i], .2, .6));
      const keyMark = box(x, keyY, -s * .020, s * .045, s * .008, s * .003, glow('#e8f5ff'));
      targets.push(key); kinds.set(key, { i, type: 'mute' });
      const meter = [];
      for (let j = 0; j < 16; j++) {
        const y = (j / 15 - .5) * travel;
        meter.push(box(x + s * .095, y, -s * .004, s * .025, travel / 25, s * .003, glow('#364254')));
        box(x - s * .085, y, -s * .004, s * (j % 5 === 0 ? .021 : .012), s * .002, s * .002, glow('#758597'));
      }
      label(`0${i + 1}`, x, h * .30, s * .027);
      controls.push({ thumb, key, keyMark, meter, press: 0 });
    });
    add(new THREE.ExtrudeGeometry(panel, { depth: s * .11, bevelEnabled: false }), material('#26334b', .35, .6), 0, 0, -s * .12);
    const point = new THREE.Vector3(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), s * .034);
    let active = null, offset = 0;
    const slide = p => {
      if (!p || !p.ray.ray.intersectPlane(plane, point)) return;
      channels[active.i].value = THREE.MathUtils.clamp((point.y - offset) / travel + .5, 0, 1);
      controls[active.i].thumb.position.y = (channels[active.i].value - .5) * travel;
    };
    const live = {
      pointerDown(p) {
        if (!p) return false;
        room.updateMatrixWorld(true);
        const hit = p.ray.intersectObjects(targets, false)[0];
        if (!hit) return false;
        active = kinds.get(hit.object);
        if (active.type === 'fader') {
          if (!p.ray.ray.intersectPlane(plane, point)) { active = null; return false; }
          offset = hit.object.parent === controls[active.i].thumb ? point.y - controls[active.i].thumb.position.y : 0;
          slide(p);
        }
        return true;
      },
      pointerMove(p) { if (active?.type === 'fader') slide(p); },
      pointerUp(p) {
        if (active?.type === 'fader') slide(p);
        if (active?.type === 'mute' && p && p.ray.intersectObject(controls[active.i].key, false).length) {
          channels[active.i].muted = !channels[active.i].muted;
        }
        active = null;
      },
      update(dt, time = 0) {
        controls.forEach((control, i) => {
          const channel = channels[i];
          control.press += ((active?.type === 'mute' && active.i === i ? 1 : 0) - control.press) * (1 - Math.exp(-dt * 30));
          control.key.position.z = -s * (.039 + .027 * control.press);
          control.keyMark.position.z = -s * (.020 + .027 * control.press);
          control.keyMark.material.color.set(channel.muted ? '#38445b' : '#e8f5ff');
          const level = channel.muted ? 0 : channel.value * (.72 + .28 * Math.sin(time * (2.5 + i) + i) ** 2);
          control.meter.forEach((segment, j) => segment.material.color.set(j / 16 < level ? colors[i] : '#364254'));
        });
      },
    };
    live.update(0, 0); return live;
  },
};
