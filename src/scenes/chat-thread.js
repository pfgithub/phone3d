import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import typeface from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const font = new FontLoader().parse(typeface);
const replies = ['See you soon!', 'On my way.', 'Sounds good!', 'Coffee at three?', 'Perfect timing.', 'Meet you there.', 'Hello again!', 'Made my day.'];
let sent = 0;

export default {
  id: 'chat-thread',
  name: 'Chat thread in depth',
  description: 'Tap to send a reply. Rounded message pills pop toward the glass as the conversation recedes into mist.',
  build({ THREE, w, h, size, room, material, glow, add, sphere, chamber, screenFrame }) {
    chamber(size * 2.5, '#172c38');
    screenFrame('#7898a5');
    const fog = new THREE.Color('#172c38');
    const pillWidth = Math.min(w * .77, size * 1.15), pillHeight = Math.min(h * .095, size * .15);
    function pill(width, height, depth) {
      const r = height / 2, shape = new THREE.Shape();
      shape.moveTo(-width / 2 + r, -r); shape.lineTo(width / 2 - r, -r);
      shape.absarc(width / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
      shape.lineTo(-width / 2 + r, r);
      shape.absarc(-width / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
      return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: size * .003, bevelThickness: size * .002, bevelSegments: 3, steps: 1, curveSegments: 12 });
    }
    function textGeometry(text, height) {
      const geo = new THREE.ShapeGeometry(font.generateShapes(text, height));
      geo.computeBoundingBox();
      const width = geo.boundingBox.max.x - geo.boundingBox.min.x;
      geo.translate(-width / 2, -height * .4, 0);
      return geo;
    }
    const textGeometries = replies.map(reply => textGeometry(reply, pillHeight * .27));
    add(textGeometry('MESSAGES / DEPTH', size * .024), glow('#b6d3db'), 0, h * .41, -size * .015);
    add(textGeometry('Tap to send a reply', size * .027), glow('#8caebc'), 0, -h * .44, -size * .014);
    const button = add(pill(Math.min(w * .65, size * .8), size * .095, size * .016), material('#31596a', .25, .4), 0, -h * .34, -size * .025);
    add(textGeometry('SEND  +', size * .035), glow('#e2f7f3'), 0, button.position.y, -size * .005);
    const entries = Array.from({ length: 8 }, (_, i) => {
      const group = new THREE.Group(); room.add(group);
      const sequence = sent - 7 + i;
      const bodyMaterial = material('#7ae0c1', .1, .35);
      const body = add(pill(pillWidth, pillHeight, size * .021), bodyMaterial, 0, 0, -size * .021);
      group.add(body);
      const ink = glow('#123c40');
      const label = add(textGeometries[((sequence % replies.length) + replies.length) % replies.length], ink, 0, 0, size * .003);
      group.add(label);
      const dot = sphere(-pillWidth * .38, pillHeight * .73, 0, size * .009, glow('#7fe0c6'));
      group.add(dot);
      return { group, sequence, bodyMaterial, ink, label, dot, pop: 1 };
    });
    function place(entry, dt, immediate = false) {
      const age = sent - entry.sequence;
      const blend = immediate ? 1 : 1 - Math.exp(-dt * 11);
      const x = (entry.sequence % 2 ? -.035 : .035) * w;
      const y = -h * .19 + age * Math.min(h * .112, size * .19);
      const z = size * .015 - age * size * .27;
      entry.group.position.lerp(new THREE.Vector3(x, y, z), blend);
      entry.pop += (1 - entry.pop) * blend;
      entry.group.scale.setScalar(entry.pop);
      const fade = 1 - Math.exp(-age * .43);
      entry.bodyMaterial.color.set(entry.sequence % 2 ? '#88abc6' : '#7ae0c1').lerp(fog, fade);
      entry.ink.color.set('#123c40').lerp(fog, fade);
      entry.dot.material.color.set('#b6f5de').lerp(fog, fade);
    }
    entries.forEach(entry => place(entry, 0, true));
    let pressed = null;
    function send() {
      sent++;
      const entry = entries.reduce((oldest, item) => item.sequence < oldest.sequence ? item : oldest);
      entry.sequence = sent;
      entry.label.geometry = textGeometries[sent % replies.length];
      entry.group.position.set(0, -h * .25, -size * .08);
      entry.pop = .35;
    }
    // Every prebuilt label must retain an owner even when a recycled bubble changes its label.
    const labelResources = new THREE.Group(); labelResources.visible = false; room.add(labelResources);
    textGeometries.forEach(geometry => {
      const owner = new THREE.Mesh(geometry, glow('#ffffff'));
      owner.userData.ownMaterial = true; labelResources.add(owner);
    });
    return {
      update(dt) { entries.forEach(entry => place(entry, Math.min(dt, .05))); },
      pointerDown(p) { pressed = { x: p.x, y: p.y }; return true; },
      pointerUp(p) {
        if (p && pressed && Math.hypot(p.x - pressed.x, p.y - pressed.y) < size * .06) send();
        pressed = null;
      },
    };
  },
};
