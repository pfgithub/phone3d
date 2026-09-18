import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

// Shared construction tools for the small appliances at the glass. All render
// resources belong to one build; only the scenes' plain control values persist.
export function tactileKit(kit, colors) {
  const { THREE, room, w, h, size, add, glow, material } = kit;
  const font = new FontLoader().parse(fontData);
  const ink = glow(colors.ink), muted = glow(colors.muted);
  const controls = [];
  let active = null;
  const shape = (width, height, radius = Math.min(width, height) * .18, x = 0, y = 0) => {
    const s = new THREE.Shape(), l = x - width / 2, r = x + width / 2;
    const b = y - height / 2, t = y + height / 2;
    s.moveTo(l + radius, b); s.lineTo(r - radius, b);
    s.quadraticCurveTo(r, b, r, b + radius); s.lineTo(r, t - radius);
    s.quadraticCurveTo(r, t, r - radius, t); s.lineTo(l + radius, t);
    s.quadraticCurveTo(l, t, l, t - radius); s.lineTo(l, b + radius);
    s.quadraticCurveTo(l, b, l + radius, b);
    return s;
  };
  const panel = shape(w, h, size * .025);
  const flat = (x, y, z, width, height, mat) => add(new THREE.ShapeGeometry(shape(width, height)), mat, x, y, z);
  const disc = (x, y, z, radius, mat) => add(new THREE.CircleGeometry(radius, 64), mat, x, y, z);
  const textGeometry = (value, height) => {
    const geometry = new THREE.ShapeGeometry(font.generateShapes(value, height));
    geometry.computeBoundingBox();
    const b = geometry.boundingBox;
    geometry.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0);
    return geometry;
  };
  const label = (value, x, y, height, mat = ink, z = .00005) => {
    const mesh = add(textGeometry(value, height), mat, x, y, z);
    mesh.userData.label = value;
    mesh.userData.height = height;
    return mesh;
  };
  const setText = (mesh, value) => {
    if (mesh.userData.label === value) return;
    mesh.geometry.dispose();
    mesh.geometry = textGeometry(value, mesh.userData.height);
    mesh.userData.label = value;
  };
  const well = (x, y, width, height, depth = .004) => {
    const opening = shape(width, height, Math.min(width, height) * .15, x, y);
    panel.holes.push(new THREE.Path(opening.getPoints(12)));
    add(new THREE.ShapeGeometry(opening), glow(colors.well), 0, 0, -depth);
    const points = opening.getPoints(12), vertices = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      vertices.push(a.x, a.y, 0, b.x, b.y, 0, b.x, b.y, -depth,
        a.x, a.y, 0, b.x, b.y, -depth, a.x, a.y, -depth);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    const sides = material(colors.muted, .15, .65);
    sides.side = THREE.DoubleSide;
    add(geometry, sides, 0, 0, 0);
  };
  const raised = (x, y, width, height, color, round = false) => {
    const group = new THREE.Group();
    group.position.set(x, y, 0); room.add(group);
    group.add(round
      ? disc(0, -size * .01, .00002, width / 2 + size * .011, glow(colors.shadow))
      : flat(0, -size * .01, .00002, width + size * .022, height + size * .022, glow(colors.shadow)));
    const bevel = Math.min(.0003, size * .004), top = .0028;
    const outline = shape(width - 2 * bevel, height - 2 * bevel,
      round ? Math.min(width, height) / 2 - bevel : Math.min(width, height) * .2);
    group.add(add(new THREE.ExtrudeGeometry(outline, {
      depth: top - 2 * bevel, bevelEnabled: true, bevelSize: bevel,
      bevelThickness: bevel, bevelSegments: 3, curveSegments: 24,
    }), material(color, .1, .45), 0, 0, bevel));
    group.add(add(new THREE.ShapeGeometry(outline), glow(color), 0, 0, top + .00002));
    const control = { group, x, y, width, height, value: 1, velocity: 0, target: 1 };
    control.contains = p => round
      ? Math.hypot(p.x - group.position.x, p.y - group.position.y) <= width * .57
      : Math.abs(p.x - group.position.x) <= width / 2 + size * .015
        && Math.abs(p.y - group.position.y) <= height / 2 + size * .015;
    controls.push(control);
    return control;
  };
  const button = (title, x, y, width, height, color, onTap) => {
    const control = raised(x, y, width, height, color);
    control.caption = label(title, 0, 0, size * .026, ink, .00286);
    control.group.add(control.caption);
    control.onTap = onTap;
    return control;
  };
  const finish = () => {
    const surface = add(new THREE.ShapeGeometry(panel, 16), glow(colors.panel), 0, 0, 0);
    surface.name = 'glass-surface';
  };
  const valid = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const live = {
    pointerDown(p) {
      if (!valid(p)) return false;
      active = controls.find(control => control.contains(p));
      if (!active) return false;
      active.target = .4;
      active.onDown?.(p);
      return true;
    },
    pointerMove(p) {
      if (!active || !valid(p)) return;
      active.target = active.onDrag || active.contains(p) ? .4 : 1;
      active.onDrag?.(p);
    },
    pointerUp(p) {
      if (!active) return;
      if (valid(p)) {
        active.onDrag?.(p);
        if (active.contains(p)) active.onTap?.();
      }
      active.target = 1;
      active = null;
    },
    update(dt) {
      const duration = Math.min(Math.max(dt, 0), .1);
      const steps = Math.max(1, Math.ceil(duration * 240)), delta = duration / steps;
      for (const control of controls) {
        for (let i = 0; i < steps; i++) {
          control.velocity += (520 * (control.target - control.value) - 22 * control.velocity) * delta;
          control.value += control.velocity * delta;
        }
        if (Math.abs(control.velocity) < 1e-4 && Math.abs(control.target - control.value) < 1e-4) {
          control.value = control.target; control.velocity = 0;
        }
        control.group.scale.z = Math.max(.1, control.value);
      }
    },
  };
  return { ink, muted, flat, disc, label, setText, well, raised, button, finish, live };
}

export const clamp = value => Math.max(0, Math.min(1, value));
