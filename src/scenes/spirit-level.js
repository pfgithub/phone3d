import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import typeface from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const font = new FontLoader().parse(typeface);

export default {
  id: 'spirit-level',
  name: 'Spirit level',
  description: 'Two recessed bubble vials and a bullseye respond to your phone’s accelerometer. Center the bubbles to find level.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, chamber }) {
    chamber(size * .3, '#18252b');
    const width = w * .89, height = Math.min(h * .76, size * 1.42);
    function capsulePath(cx, cy, length, radius, vertical = false) {
      const path = new THREE.Path();
      const half = length / 2 - radius;
      for (let i = 0; i <= 64; i++) {
        const angle = i / 64 * Math.PI * 2;
        const x = Math.cos(angle) * radius + (Math.cos(angle) >= 0 ? half : -half);
        const y = Math.sin(angle) * radius;
        const px = cx + (vertical ? -y : x), py = cy + (vertical ? x : y);
        if (i === 0) path.moveTo(px, py); else path.lineTo(px, py);
      }
      path.closePath(); return path;
    }
    const shape = new THREE.Shape();
    const corner = size * .045;
    shape.moveTo(-width / 2 + corner, -height / 2);
    shape.lineTo(width / 2 - corner, -height / 2);
    shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + corner);
    shape.lineTo(width / 2, height / 2 - corner);
    shape.quadraticCurveTo(width / 2, height / 2, width / 2 - corner, height / 2);
    shape.lineTo(-width / 2 + corner, height / 2);
    shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - corner);
    shape.lineTo(-width / 2, -height / 2 + corner);
    shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + corner, -height / 2);
    const horizontal = { x: 0, y: height * .22, length: width * .72, vertical: false };
    const vertical = { x: -width * .32, y: -height * .19, length: height * .38, vertical: true };
    const vialRadius = size * .043, bullX = width * .12, bullY = -height * .19, bullRadius = size * .16;
    shape.holes.push(capsulePath(horizontal.x, horizontal.y, horizontal.length + size * .016, vialRadius * 1.23));
    shape.holes.push(capsulePath(vertical.x, vertical.y, vertical.length + size * .016, vialRadius * 1.23, true));
    const bullHole = new THREE.Path(); bullHole.absarc(bullX, bullY, bullRadius * 1.11, 0, Math.PI * 2, true); shape.holes.push(bullHole);
    add(new THREE.ExtrudeGeometry(shape, { depth: size * .065, bevelEnabled: true, bevelSize: size * .004, bevelThickness: size * .004, bevelSegments: 2, curveSegments: 32 }),
      material('#a5b2b6', .82, .36), 0, 0, -size * .095);
    function label(text, textSize, x, y, color = '#172b33') {
      const geometry = new THREE.ShapeGeometry(font.generateShapes(text, textSize));
      geometry.computeBoundingBox(); geometry.translate(-(geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2, 0, 0);
      return add(geometry, glow(color), x, y, -size * .023);
    }
    label('PRECISION / LEVEL', size * .029, 0, height * .4);
    label('X', size * .023, 0, height * .11);
    label('Y', size * .023, -width * .32, -height * .44);
    const status = label('TILT TO CENTER', size * .022, width * .1, -height * .44);
    const waiting = label('ENABLE MOTION', size * .022, width * .1, -height * .44, '#765a31');
    status.visible = false;
    const screws = material('#485c65', .8, .3);
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      const screw = add(new THREE.CylinderGeometry(size * .016, size * .016, size * .009, 20), screws,
        x * (width / 2 - size * .027), y * (height / 2 - size * .029), -size * .025);
      screw.rotation.x = Math.PI / 2;
      box(screw.position.x, screw.position.y, -size * .019, size * .022, size * .003, size * .002, glow('#20343c'));
    }
    const liquid = material('#a4be32', .05, .25);
    const bubbles = [];
    for (const vial of [horizontal, vertical]) {
      const backing = add(new THREE.CapsuleGeometry(vialRadius, vial.length - vialRadius * 2, 8, 24), liquid, vial.x, vial.y, -size * .082);
      if (!vial.vertical) backing.rotation.z = Math.PI / 2;
      const glass = material('#d5ed92', .05, .13); glass.transparent = true; glass.opacity = .19; glass.depthWrite = false;
      const tube = add(new THREE.CapsuleGeometry(vialRadius, vial.length - vialRadius * 2, 8, 24), glass, vial.x, vial.y, -size * .058);
      if (!vial.vertical) tube.rotation.z = Math.PI / 2;
      const bubble = sphere(vial.x, vial.y, -size * .04, vialRadius * .62, material('#f0f5bd', .1, .16));
      bubble.scale.set(vial.vertical ? .78 : 1.38, vial.vertical ? 1.38 : .78, .42);
      for (const side of [-1, 1]) {
        const delta = side * vialRadius * 1.15;
        box(vial.x + (vial.vertical ? 0 : delta), vial.y + (vial.vertical ? delta : 0), -size * .011,
          vial.vertical ? vialRadius * 1.8 : size * .003, vial.vertical ? size * .003 : vialRadius * 1.8, size * .002, glow('#345338'));
      }
      bubbles.push({ ...vial, bubble, travel: vial.length / 2 - vialRadius * 1.65 });
    }
    const well = add(new THREE.CylinderGeometry(bullRadius, bullRadius, size * .018, 64), liquid, bullX, bullY, -size * .079);
    well.rotation.x = Math.PI / 2;
    ring(bullX, bullY, -size * .03, bullRadius * 1.06, size * .012, screws);
    for (const radius of [.29, .62, .91]) ring(bullX, bullY, -size * .063, bullRadius * radius, size * .0018, glow('#345338'));
    box(bullX, bullY, -size * .062, bullRadius * 1.9, size * .002, size * .001, glow('#597236'));
    box(bullX, bullY, -size * .062, size * .002, bullRadius * 1.9, size * .001, glow('#597236'));
    const bullBubble = sphere(bullX, bullY, -size * .048, bullRadius * .235, material('#f2f7c0', .05, .18));
    bullBubble.scale.z = .22;
    const domeMaterial = material('#d5edb6', .1, .1); domeMaterial.transparent = true; domeMaterial.opacity = .12; domeMaterial.depthWrite = false;
    const dome = sphere(bullX, bullY, -size * .061, bullRadius, domeMaterial); dome.scale.z = .22;
    const indicator = sphere(width * .28, height * .4, -size * .017, size * .008, glow('#a99057'));
    let x = 0, y = 0;
    return {
      update(dt, time, gravity) {
        const magnitude = gravity?.length() ?? 0;
        const available = magnitude > 1;
        waiting.visible = !available; status.visible = available;
        // Bubbles rise opposite gravity. Full vial travel represents roughly twelve degrees.
        const targetX = available ? -gravity.x / magnitude : 0;
        const targetY = available ? -gravity.y / magnitude : 0;
        const blend = 1 - Math.exp(-Math.min(dt, .05) * 10);
        x += (targetX - x) * blend; y += (targetY - y) * blend;
        const range = Math.sin(12 * Math.PI / 180);
        for (const vial of bubbles) {
          const offset = THREE.MathUtils.clamp((vial.vertical ? y : x) / range, -1, 1) * vial.travel;
          vial.bubble.position.set(vial.x + (vial.vertical ? 0 : offset), vial.y + (vial.vertical ? offset : 0), -size * .04);
        }
        const tilt = Math.hypot(x, y), scale = bullRadius * .7 / Math.max(range, tilt);
        bullBubble.position.x = bullX + x * scale; bullBubble.position.y = bullY + y * scale;
        const level = available && tilt < Math.sin(.8 * Math.PI / 180);
        indicator.material.color.set(!available ? '#a99057' : level ? '#7affae' : '#ebae52');
        status.material.color.set(level ? '#236942' : '#172b33');
      },
    };
  },
};
