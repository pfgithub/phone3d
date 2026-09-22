import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const settings = { toggles: [true, true, false, false], brightness: .72, volume: .46 };

export default {
  id: 'control-center',
  name: 'Glass control center',
  description: 'Tap connectivity tiles and drag light and sound levels. Touch surfaces meet the glass above a 7.8 mm recessed dashboard.',
  build({ THREE, w, h, size, material, glow, add, box }) {
    const font = new FontLoader().parse(fontData);
    const landscape = w > h;
    const ink = glow('#dceafa'), muted = glow('#879bb8');
    const accent = '#92ddc6';
    const shape = (width, height, radius = Math.min(width, height) * .16) => {
      const s = new THREE.Shape(), x = -width / 2, y = -height / 2;
      s.moveTo(x + radius, y); s.lineTo(-x - radius, y);
      s.quadraticCurveTo(-x, y, -x, y + radius); s.lineTo(-x, -y - radius);
      s.quadraticCurveTo(-x, -y, -x - radius, -y); s.lineTo(x + radius, -y);
      s.quadraticCurveTo(x, -y, x, -y - radius); s.lineTo(x, y + radius);
      s.quadraticCurveTo(x, y, x + radius, y);
      return s;
    };
    const face = (x, y, width, height, color, z = 0) => {
      const mat = glow(color);
      mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -1;
      return add(new THREE.ShapeGeometry(shape(width, height)), mat, x, y, z);
    };
    // Coplanar glyphs use a depth bias: their actual geometry stays at the glass.
    const label = (value, x, y, height, mat = ink, z = 0) => {
      const geometry = new THREE.ShapeGeometry(font.generateShapes(value, height));
      geometry.computeBoundingBox();
      const b = geometry.boundingBox;
      geometry.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0);
      mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
      const mesh = add(geometry, mat, x, y, z); mesh.renderOrder = 2;
      return mesh;
    };
    // A shallow solid shell with genuine openings preserves side-view parallax.
    const panel = shape(w, h, size * .025);
    const well = (x, y, width, height) => {
      const cutout = shape(width, height);
      panel.holes.push(new THREE.Path(cutout.getPoints(12).map(p => p.add(new THREE.Vector2(x, y)))));
      face(x, y, width, height, '#101c30', -.0077);
    };
    box(0, 0, -.00775, w, h, .0001, material('#111e32'));
    label('CONTROL CENTER', 0, h * .415, size * .038);
    label('MAKE YOURSELF AT HOME', 0, h * .355, size * .016, muted);

    const controls = [];
    const icon = (index, x, y, mat) => {
      mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
      const unit = size * .025;
      const draw = geometry => {
        const mesh = add(geometry, mat, x, y, 0); mesh.renderOrder = 2;
        return mesh;
      };
      const stroke = points => {
        for (let i = 1; i < points.length; i++) {
          const [ax, ay] = points[i - 1], [bx, by] = points[i];
          const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy);
          const nx = -dy / length * .085, ny = dx / length * .085;
          const path = new THREE.Shape();
          [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]]
            .forEach(([px, py], j) => j ? path.lineTo(px * unit, py * unit) : path.moveTo(px * unit, py * unit));
          path.closePath(); draw(new THREE.ShapeGeometry(path));
        }
      };
      if (index === 0) {
        for (const radius of [.65, 1.15]) {
          draw(new THREE.RingGeometry((radius - .14) * unit, radius * unit, 32, 1, Math.PI * .18, Math.PI * .64));
        }
        draw(new THREE.CircleGeometry(unit * .14, 20));
      } else if (index === 1) {
        stroke([[-.6, -.65], [.6, .45], [0, 1], [0, -1], [.6, -.45], [-.6, .65]]);
      } else if (index === 2) {
        const plane = new THREE.Shape();
        [[0, 1.1], [.17, .8], [.17, .25], [1, -.25], [1, -.47], [.17, -.15],
          [.17, -.75], [.43, -.95], [.43, -1.1], [0, -.95], [-.43, -1.1], [-.43, -.95],
          [-.17, -.75], [-.17, -.15], [-1, -.47], [-1, -.25], [-.17, .25], [-.17, .8]]
          .forEach(([px, py], j) => j ? plane.lineTo(px * unit, py * unit) : plane.moveTo(px * unit, py * unit));
        plane.closePath(); draw(new THREE.ShapeGeometry(plane));
      } else {
        const moon = new THREE.Shape();
        moon.moveTo(unit * .4, unit);
        moon.bezierCurveTo(-unit * 1.25, unit, -unit * 1.25, -unit, unit * .4, -unit);
        moon.bezierCurveTo(-unit * .5, -unit * .6, -unit * .5, unit * .6, unit * .4, unit);
        draw(new THREE.ShapeGeometry(moon));
      }
    };
    const tileAreaX = landscape ? -w * .225 : 0;
    const tileAreaY = landscape ? -.025 * h : .15 * h;
    const tileW = w * (landscape ? .185 : .37);
    const tileH = h * (landscape ? .23 : .14);
    const names = ['Wi-Fi', 'Bluetooth', 'Airplane', 'Quiet'];
    const tiles = names.map((name, i) => {
      const x = tileAreaX + (i % 2 - .5) * tileW * 1.12;
      const y = tileAreaY + (.5 - Math.floor(i / 2)) * tileH * 1.16;
      well(x, y, tileW + size * .014, tileH + size * .014);
      // Bevel-free extrusion terminates exactly at z=0, including while pressed.
      add(new THREE.ExtrudeGeometry(shape(tileW, tileH), {
        depth: .0028, bevelEnabled: false, curveSegments: 12,
      }), material('#3c506c'), x, y, -.0028);
      const top = face(x, y, tileW, tileH, '#263954');
      const glyphMat = glow('#92ddc6');
      icon(i, x - tileW * .28, y + tileH * .18, glyphMat);
      label(name, x, y - tileH * .23, size * .023);
      const dot = add(new THREE.CircleGeometry(size * .012, 24), glow(accent), x + tileW * .3, y + tileH * .23, 0);
      dot.material.polygonOffset = true; dot.material.polygonOffsetFactor = -2; dot.material.polygonOffsetUnits = -2;
      dot.renderOrder = 2;
      const control = { x, y, width: tileW, height: tileH, index: i, top, dot, glyphMat };
      controls.push(control);
      return control;
    });

    const sliderX = landscape ? w * .235 : 0;
    const sliderW = w * (landscape ? .33 : .72);
    const sliders = ['brightness', 'volume'].map((key, i) => {
      const y = landscape ? h * (.10 - i * .29) : h * (-.13 - i * .17);
      label(i === 0 ? 'BRIGHTNESS' : 'VOLUME', sliderX, y + size * .064, size * .019, muted);
      const height = size * .044;
      well(sliderX, y, sliderW + size * .016, height + size * .02);
      const fill = box(sliderX, y, -.005, sliderW, height * .45, .0006, glow(accent));
      const thumb = face(0, y, size * .058, size * .069, '#e6f5f3');
      const thumbBody = add(new THREE.ExtrudeGeometry(shape(size * .058, size * .069), {
        depth: .0028, bevelEnabled: false, curveSegments: 12,
      }), material('#799b9d'), 0, y, -.0028);
      const grip = face(0, y, size * .006, size * .029, '#536b78');
      grip.material.polygonOffset = true; grip.material.polygonOffsetFactor = -2; grip.material.polygonOffsetUnits = -2;
      grip.renderOrder = 2;
      const control = { x: sliderX, y, width: sliderW + size * .058, height: size * .09,
        key, fill, thumb, thumbBody, grip, left: sliderX - sliderW / 2, travel: sliderW };
      controls.push(control);
      return control;
    });
    label('TOUCH THE GLASS', 0, -h * .423, size * .018, muted);
    face(0, -h * .473, size * .25, size * .008, '#879bb8', -.0002);
    add(new THREE.ExtrudeGeometry(panel, {
      depth: .0072, bevelEnabled: false, curveSegments: 12,
    }), material('#24344e', .15, .65), 0, 0, -.0076);

    let held = null, inside = false;
    const valid = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
    const over = (c, p) => Math.abs(p.x - c.x) <= c.width / 2 && Math.abs(p.y - c.y) <= c.height / 2;
    const sync = () => {
      tiles.forEach(c => {
        const on = settings.toggles[c.index];
        c.top.material.color.set(held === c && inside ? '#58728a' : on ? '#355d66' : '#263954');
        c.dot.material.color.set(on ? accent : '#526079');
        c.glyphMat.color.set(on ? accent : '#879bb8');
      });
      sliders.forEach(c => {
        const value = settings[c.key];
        c.fill.scale.x = Math.max(.001, value);
        c.fill.position.x = c.left + c.travel * value / 2;
        c.thumb.position.x = c.thumbBody.position.x = c.grip.position.x = c.left + c.travel * value;
      });
    };
    const drag = p => {
      settings[held.key] = THREE.MathUtils.clamp((p.x - held.left) / held.travel, 0, 1);
      sync();
    };
    sync();
    return {
      pointerDown(p) {
        if (!valid(p)) return false;
        held = controls.find(c => over(c, p)); inside = !!held;
        if (!held) return false;
        if (held.key) drag(p); else sync();
        return true;
      },
      pointerMove(p) {
        if (!held || !valid(p)) return;
        inside = over(held, p);
        if (held.key) drag(p); else sync();
      },
      pointerUp(p) {
        if (held && valid(p)) {
          if (held.key) drag(p);
          else if (over(held, p)) settings.toggles[held.index] = !settings.toggles[held.index];
        }
        held = null; inside = false; sync();
      },
    };
  },
};
