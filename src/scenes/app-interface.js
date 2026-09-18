import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

export default {
  id: 'app-interface',
  name: 'Tactile music app',
  description: 'An app at the glass: a recessed display and volume groove, with playback buttons raised up to 3 mm.',
  build({ THREE, w, h, size, material, glow, add, box, ring }) {
    const landscape = w > h;
    const font = new FontLoader().parse(fontData);
    const ink = glow('#233d44'), muted = glow('#658079');
    const mint = glow('#b8edcc'), white = glow('#edf7ee');
    const outline = (width, height, radius, x = 0, y = 0) => {
      const s = new THREE.Shape();
      const l = x - width / 2, r = x + width / 2;
      const b = y - height / 2, t = y + height / 2;
      s.moveTo(l + radius, b); s.lineTo(r - radius, b);
      s.quadraticCurveTo(r, b, r, b + radius); s.lineTo(r, t - radius);
      s.quadraticCurveTo(r, t, r - radius, t); s.lineTo(l + radius, t);
      s.quadraticCurveTo(l, t, l, t - radius); s.lineTo(l, b + radius);
      s.quadraticCurveTo(l, b, l + radius, b);
      return s;
    };
    const flat = (x, y, z, width, height, mat) =>
      add(new THREE.ShapeGeometry(outline(width, height, Math.min(width, height) / 2)), mat, x, y, z);
    const disc = (x, y, z, radius, mat) => add(new THREE.CircleGeometry(radius, 64), mat, x, y, z);
    const label = (text, x, y, height, mat = ink, z = .00004, align = 'center') => {
      const geometry = new THREE.ShapeGeometry(font.generateShapes(text, height));
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox;
      geometry.translate(align === 'left' ? -bounds.min.x : -(bounds.min.x + bounds.max.x) / 2,
        -(bounds.min.y + bounds.max.y) / 2, 0);
      return add(geometry, mat, x, y, z);
    };

    // The panel is exactly at z=0. Real holes let recessed controls remain visible
    // through the surface as the viewpoint moves; no backdrop covers the cavities.
    const panel = outline(w, h, size * .025);
    const well = (x, y, width, height, radius, depth) => {
      const shape = outline(width, height, radius, x, y);
      panel.holes.push(new THREE.Path(shape.getPoints(16)));
      add(new THREE.ShapeGeometry(shape), glow('#102d36'), 0, 0, -depth);
      const points = shape.getPoints(16), vertices = [];
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        vertices.push(a.x, a.y, 0, b.x, b.y, 0, b.x, b.y, -depth,
          a.x, a.y, 0, b.x, b.y, -depth, a.x, a.y, -depth);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      const sides = material('#47665e', .1, .65);
      sides.side = THREE.DoubleSide;
      add(geometry, sides, 0, 0, 0);
    };
    // Beveled solid controls grow out of the glass, with a thin contact shadow.
    const button = (x, y, width, height, top, color) => {
      flat(x, y - size * .009, .00002, width + size * .022, height + size * .022, glow('#9cafa5'));
      const bevel = .00025;
      const shape = outline(width - bevel * 2, height - bevel * 2,
        Math.min(width, height) / 2 - bevel);
      add(new THREE.ExtrudeGeometry(shape, {
        depth: top - bevel * 2, bevelEnabled: true, bevelThickness: bevel,
        bevelSize: bevel, bevelSegments: 3, curveSegments: 20,
      }), material(color, .08, .5), x, y, bevel);
      flat(x, y, top + .00001, width - bevel * 2, height - bevel * 2, glow(color));
    };
    const triangle = (x, y, z, radius, direction = 1) => {
      const s = new THREE.Shape();
      s.moveTo(-radius * .55 * direction, -radius * .7);
      s.lineTo(radius * .75 * direction, 0);
      s.lineTo(-radius * .55 * direction, radius * .7); s.closePath();
      add(new THREE.ShapeGeometry(s), ink, x, y, z);
    };

    label('FLOW', -w * .4, h * .405, size * .047, ink, .00004, 'left');
    label('YOUR DAILY SOUND', 0, h * .405, size * .018, muted);
    for (let i = -1; i <= 1; i++) disc(w * .39 + i * size * .023, h * .405, .00004, size * .0045, ink);

    const displayX = landscape ? -w * .235 : 0;
    const displayY = landscape ? 0 : h * .20;
    const displayW = w * (landscape ? .41 : .82);
    const displayH = h * (landscape ? .50 : .25);
    well(displayX, displayY, displayW, displayH, size * .035, .003);
    const r = Math.min(displayW * .23, displayH * .34);
    const recordX = displayX - displayW * .20;
    disc(recordX, displayY, -.00285, r, glow('#e8b897'));
    for (const fraction of [.48, .65, .82]) {
      ring(recordX, displayY, -.00265, r * fraction, size * .0015, glow('#956f62'));
    }
    disc(recordX, displayY, -.0024, r * .30, mint);
    disc(recordX, displayY, -.0023, r * .055, ink);
    const waveX = displayX + displayW * .23;
    label('CHILL / 024', waveX, displayY + displayH * .32, size * .019, mint, -.0027);
    for (let i = 0; i < 17; i++) {
      const barH = displayH * (.08 + .30 * Math.pow(Math.sin(i * 1.73 + .4), 2));
      flat(waveX + (i - 8) * displayW * .019, displayY, -.0025,
        displayW * .009, barH, i < 10 ? mint : glow('#527d77'));
    }
    label('STEREO', waveX, displayY - displayH * .32, size * .016, white, -.0027);

    const controlX = landscape ? w * .235 : 0;
    const titleY = h * (landscape ? .23 : .018);
    label('Soft Focus', controlX, titleY, size * .061);
    label('SUNDAY COLLECTIVE', controlX, titleY - size * .067, size * .020, muted);
    const playY = h * (landscape ? -.025 : -.12);
    button(controlX, playY, size * .185, size * .185, .0029, '#b8edcc');
    // Pause glyph sits on the raised face of the primary control.
    for (const side of [-1, 1]) flat(controlX + side * size * .024, playY, .00293,
      size * .015, size * .064, ink);
    for (const direction of [-1, 1]) {
      const x = controlX + direction * size * .23;
      button(x, playY, size * .125, size * .125, .0016, '#ecf3e8');
      triangle(x, playY, .00164, size * .027, direction);
      box(x + direction * size * .023, playY, .00164, size * .008, size * .04, .00003, ink);
    }

    const sliderY = h * (landscape ? -.275 : -.29);
    const sliderW = landscape ? w * .32 : w * .65;
    const sliderH = size * .035;
    label('VOLUME', controlX - sliderW / 2, sliderY + size * .075, size * .021, muted, .00004, 'left');
    label('68%', controlX + sliderW / 2 - size * .027, sliderY + size * .075, size * .021, muted);
    well(controlX, sliderY, sliderW, sliderH, sliderH / 2, .002);
    flat(controlX - sliderW * .16, sliderY, -.00185, sliderW * .64, sliderH * .45, mint);
    const thumbX = controlX + sliderW * .18;
    button(thumbX, sliderY, size * .059, size * .077, .0022, '#ecf3e8');
    for (const dx of [-1, 0, 1]) flat(thumbX + dx * size * .01, sliderY, .00224, size * .0025, size * .028, muted);

    flat(0, -h * .378, .00003, w * .82, size * .0015, glow('#b3c5ba'));
    const navY = -h * .425;
    flat(-w * .28, navY, .00003, size * .20, size * .067, glow('#b8cebc'));
    label('Listen', -w * .28, navY, size * .024);
    label('Discover', 0, navY, size * .024, muted);
    label('Library', w * .28, navY, size * .024, muted);
    flat(0, -h * .478, .00003, size * .26, size * .008, ink);

    const surface = add(new THREE.ShapeGeometry(panel, 16), glow('#dce7da'), 0, 0, 0);
    surface.name = 'app-glass-surface';
  },
};
