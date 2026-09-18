import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const TRACKS = [
  ['Soft Focus', 'SUNDAY COLLECTIVE', 'CHILL / 024'],
  ['Low Tide', 'MARINA HALL', 'DRIFT / 031'],
  ['Paper Moon', 'THE QUIET HOURS', 'DUSK / 017'],
  ['Glasshouse', 'NORTH ATLAS', 'BLOOM / 008'],
];
const TRACK_SECONDS = 40;
// Player state survives rebuilds (resize, orientation), so only plain values live here.
const player = { playing: true, track: 0, progress: .58, volume: .68, tab: 0 };

// A damped spring; underdamped by default so presses bounce back slightly.
const spring = (value, stiffness = 520, damping = 17) => ({ value, target: value, velocity: 0, stiffness, damping });
function step(s, dt) {
  const n = Math.ceil(dt * 240), h = dt / n;
  for (let i = 0; i < n; i++) {
    s.velocity += (s.stiffness * (s.target - s.value) - s.damping * s.velocity) * h;
    s.value += s.velocity * h;
  }
  if (Math.abs(s.velocity) < 1e-4 && Math.abs(s.target - s.value) < 1e-4) { s.value = s.target; s.velocity = 0; }
  return s.value;
}
const ease = t => t * t * (3 - 2 * t);

export default {
  id: 'app-interface',
  name: 'Tactile music app',
  description: 'An app at the glass: press the raised playback buttons and drag the volume thumb along its recessed groove.',
  build({ THREE, room, w, h, size, material, glow, add, box, ring }) {
    const landscape = w > h;
    const font = new FontLoader().parse(fontData);
    const ink = glow('#233d44'), muted = glow('#658079');
    const mint = glow('#b8edcc'), white = glow('#edf7ee');
    const INK = new THREE.Color('#233d44'), MUTED = new THREE.Color('#658079');
    const MINT = new THREE.Color('#b8edcc'), DIM = new THREE.Color('#527d77');
    const into = (group, mesh) => { group.add(mesh); return mesh; };
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
    const pill = (width, height) => new THREE.ShapeGeometry(outline(width, height, Math.min(width, height) / 2));
    const flat = (x, y, z, width, height, mat) => add(pill(width, height), mat, x, y, z);
    const disc = (x, y, z, radius, mat) => add(new THREE.CircleGeometry(radius, 64), mat, x, y, z);
    const text = (value, height, align) => {
      const geometry = new THREE.ShapeGeometry(font.generateShapes(value, height));
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox;
      const x = align === 'left' ? -bounds.min.x : align === 'right' ? -bounds.max.x : -(bounds.min.x + bounds.max.x) / 2;
      return geometry.translate(x, -(bounds.min.y + bounds.max.y) / 2, 0);
    };
    const label = (value, x, y, height, mat = ink, z = .00004, align = 'center') => {
      const mesh = add(text(value, height, align), mat, x, y, z);
      mesh.userData.text = [value, height, align];
      return mesh;
    };
    const setText = (mesh, value) => {
      const [current, height, align] = mesh.userData.text;
      if (current === value) return;
      mesh.geometry.dispose(); mesh.geometry = text(value, height, align);
      mesh.userData.text[0] = value;
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
    // Everything above the glass sits in a group whose z scale is the press depth.
    const button = (x, y, width, height, top, color) => {
      const shadow = flat(x, y - size * .009, .00002, width + size * .022, height + size * .022, glow('#9cafa5'));
      const group = new THREE.Group();
      group.position.set(x, y, 0); room.add(group);
      const bevel = .00025;
      const shape = outline(width - bevel * 2, height - bevel * 2,
        Math.min(width, height) / 2 - bevel);
      into(group, add(new THREE.ExtrudeGeometry(shape, {
        depth: top - bevel * 2, bevelEnabled: true, bevelThickness: bevel,
        bevelSize: bevel, bevelSegments: 3, curveSegments: 20,
      }), material(color, .08, .5), 0, 0, bevel));
      into(group, flat(0, 0, top + .00001, width - bevel * 2, height - bevel * 2, glow(color)));
      return { group, shadow, x, y, radius: Math.max(width, height) / 2, press: spring(1), down: false };
    };
    const triangle = (group, x, z, radius, direction = 1) => {
      const s = new THREE.Shape();
      s.moveTo(-radius * .55 * direction, -radius * .7);
      s.lineTo(radius * .75 * direction, 0);
      s.lineTo(-radius * .55 * direction, radius * .7); s.closePath();
      return into(group, add(new THREE.ShapeGeometry(s), ink, x, 0, z));
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
    // The record spins about its own center; a lighter sheen shows the rotation.
    const record = new THREE.Group();
    record.position.set(displayX - displayW * .20, displayY, 0); room.add(record);
    into(record, disc(0, 0, -.00285, r, glow('#e8b897')));
    into(record, add(new THREE.CircleGeometry(r * .97, 48, .3, .55), glow('#f4d2b6'), 0, 0, -.0028));
    into(record, add(new THREE.CircleGeometry(r * .97, 48, .3 + Math.PI, .55), glow('#f4d2b6'), 0, 0, -.0028));
    for (const fraction of [.48, .65, .82]) {
      into(record, ring(0, 0, -.00265, r * fraction, size * .0015, glow('#956f62')));
    }
    into(record, disc(0, 0, -.0024, r * .30, mint));
    into(record, flat(r * .17, 0, -.00235, r * .12, r * .035, glow('#6fae8f')));
    into(record, disc(0, 0, -.0023, r * .055, ink));
    const waveX = displayX + displayW * .23;
    const trackLabel = label(TRACKS[player.track][2], waveX, displayY + displayH * .32, size * .019,
      Object.assign(glow('#b8edcc'), { transparent: true }), -.0027);
    const bars = [];
    for (let i = 0; i < 17; i++) {
      const barH = displayH * (.08 + .30 * Math.pow(Math.sin(i * 1.73 + .4), 2));
      bars.push(flat(waveX + (i - 8) * displayW * .019, displayY, -.0025, displayW * .009, barH, glow('#b8edcc')));
    }
    label('STEREO', waveX, displayY - displayH * .32, size * .016, white, -.0027);

    const controlX = landscape ? w * .235 : 0;
    const titleY = h * (landscape ? .23 : .018);
    const titleInk = Object.assign(glow('#233d44'), { transparent: true });
    const titleMuted = Object.assign(glow('#658079'), { transparent: true });
    const title = label(TRACKS[player.track][0], controlX, titleY, size * .061, titleInk);
    const artist = label(TRACKS[player.track][1], controlX, titleY - size * .067, size * .020, titleMuted);
    const playY = h * (landscape ? -.025 : -.12);
    const play = button(controlX, playY, size * .185, size * .185, .0029, '#b8edcc');
    // Pause and play glyphs sit on the raised face and cross-scale into each other.
    const pauseGlyph = new THREE.Group(), playGlyph = new THREE.Group();
    play.group.add(pauseGlyph, playGlyph);
    for (const side of [-1, 1]) into(pauseGlyph, flat(side * size * .024, 0, .00293, size * .015, size * .064, ink));
    triangle(playGlyph, size * .008, .00293, size * .05);
    const glyph = spring(player.playing ? 1 : 0, 300, 16);
    const skips = [-1, 1].map(direction => {
      const x = controlX + direction * size * .23;
      const control = button(x, playY, size * .125, size * .125, .0016, '#ecf3e8');
      triangle(control.group, 0, .00164, size * .027, direction);
      into(control.group, box(direction * size * .023, 0, .00164, size * .008, size * .04, .00003, ink));
      return Object.assign(control, { direction });
    });

    const sliderY = h * (landscape ? -.275 : -.29);
    const sliderW = landscape ? w * .32 : w * .65;
    const sliderH = size * .035;
    const sliderLeft = controlX - sliderW / 2, pad = sliderH * .6;
    const thumbAt = v => sliderLeft + pad + v * (sliderW - pad * 2);
    label('VOLUME', sliderLeft, sliderY + size * .075, size * .021, muted, .00004, 'left');
    const percent = label(`${Math.round(player.volume * 100)}%`, controlX + sliderW / 2, sliderY + size * .075, size * .021, muted, .00004, 'right');
    well(controlX, sliderY, sliderW, sliderH, sliderH / 2, .002);
    const fill = flat(0, sliderY, -.00185, sliderH, sliderH * .45, mint);
    const thumb = button(thumbAt(player.volume), sliderY, size * .059, size * .077, .0022, '#ecf3e8');
    for (const dx of [-1, 0, 1]) into(thumb.group, flat(dx * size * .01, 0, .00224, size * .0025, size * .028, muted));
    let shownVolume = -1;
    const showVolume = v => {
      if (Math.abs(v - shownVolume) < 1e-5) return;
      shownVolume = v;
      const x = thumbAt(v), left = sliderLeft + sliderH * .275, width = Math.max(x - left, sliderH * .45);
      fill.geometry.dispose(); fill.geometry = pill(width, sliderH * .45);
      fill.position.x = left + width / 2;
      thumb.group.position.x = x; thumb.shadow.position.x = x;
      setText(percent, `${Math.round(v * 100)}%`);
    };
    showVolume(player.volume);

    flat(0, -h * .378, .00003, w * .82, size * .0015, glow('#b3c5ba'));
    const navY = -h * .425;
    const tabX = i => (i - 1) * w * .28;
    const tabPill = flat(tabX(player.tab), navY, .00003, size * .20, size * .067, glow('#b8cebc'));
    const tabs = ['Listen', 'Discover', 'Library'].map((name, i) => label(name, tabX(i), navY, size * .024, glow('#658079'), .00004));
    const tab = spring(player.tab, 260, 20);
    flat(0, -h * .478, .00003, size * .26, size * .008, ink);

    const surface = add(new THREE.ShapeGeometry(panel, 16), glow('#dce7da'), 0, 0, 0);
    surface.name = 'app-glass-surface';

    // Animation state that restarts on rebuild.
    const spin = { angle: 0, speed: player.playing ? 1.2 : 0 };
    let level = player.playing ? 1 : 0, swap = null, dragging = false, pressed = null;
    const setVolumeFrom = x => { player.volume = Math.min(1, Math.max(0, (x - sliderLeft - pad) / (sliderW - pad * 2))); };
    const skip = direction => {
      player.track = (player.track + direction + TRACKS.length) % TRACKS.length;
      player.progress = 0;
      swap = { t: 0, direction, swapped: false };
      spin.speed += direction * 14;
    };
    const buttons = [play, ...skips];
    const over = (control, p) => Math.hypot(p.x - control.x, p.y - control.y) <= control.radius * 1.2;
    const release = control => { control.down = false; control.press.target = 1; };
    const updateButton = control => {
      const k = control.press.value;
      control.group.scale.z = Math.max(.05, k);
      const shrink = .9 + .1 * Math.min(1, k);
      control.shadow.scale.set(shrink, shrink, 1);
    };

    const live = {
      pointerDown(p) {
        if (!p || !Number.isFinite(p.x)) return false;
        pressed = buttons.find(control => over(control, p));
        if (pressed) { pressed.down = true; pressed.press.target = .35; return true; }
        if (Math.abs(p.x - controlX) <= sliderW / 2 + size * .03 && Math.abs(p.y - sliderY) <= size * .06) {
          dragging = true; thumb.press.target = .55; setVolumeFrom(p.x); return true;
        }
        if (Math.abs(p.y - navY) <= size * .06) {
          const i = [0, 1, 2].find(i => Math.abs(p.x - tabX(i)) <= w * .14);
          if (i !== undefined) { player.tab = i; tab.target = i; return true; }
        }
        return false;
      },
      pointerMove(p) {
        if (!p || !Number.isFinite(p.x)) return;
        if (dragging) setVolumeFrom(p.x);
        // Sliding off a button lifts it without triggering it, like a real touch control.
        if (pressed) { pressed.down = over(pressed, p); pressed.press.target = pressed.down ? .35 : 1; }
      },
      pointerUp(p) {
        if (dragging) { dragging = false; thumb.press.target = 1; if (p && Number.isFinite(p.x)) setVolumeFrom(p.x); }
        if (pressed) {
          if (pressed.down && p) {
            if (pressed === play) { player.playing = !player.playing; glyph.target = player.playing ? 1 : 0; }
            else skip(pressed.direction);
          }
          release(pressed); pressed = null;
        }
      },
      update(dt, time) {
        for (const control of [...buttons, thumb]) { step(control.press, dt); updateButton(control); }

        const g = step(glyph, dt);
        pauseGlyph.scale.set(Math.max(1e-3, g), Math.max(1e-3, g), 1);
        playGlyph.scale.set(Math.max(1e-3, 1 - g), Math.max(1e-3, 1 - g), 1);

        // The record eases up to speed, winds down when paused, and whips round on a skip.
        const targetSpeed = player.playing ? 1.2 : 0;
        spin.speed += (targetSpeed - spin.speed) * (1 - Math.exp(-dt * (player.playing ? 2.5 : 1.8)));
        if (!player.playing && Math.abs(spin.speed) < 2e-3) spin.speed = 0;
        spin.angle -= spin.speed * dt;
        record.rotation.z = spin.angle;

        if (player.playing) {
          player.progress += dt / TRACK_SECONDS;
          if (player.progress >= 1) skip(1);
        }
        level += ((player.playing ? 1 : 0) - level) * (1 - Math.exp(-dt * 5));
        if (Math.abs(level - (player.playing ? 1 : 0)) < 1e-3) level = player.playing ? 1 : 0;
        const amp = level * (.25 + .5 * player.volume);
        bars.forEach((bar, i) => {
          bar.scale.y = 1 + amp * Math.sin(time * (4 + (i % 5) * 1.3) + i * 1.7) * Math.sin(time * 1.9 + i * .6);
          bar.material.color.copy(i / bars.length < player.progress ? MINT : DIM);
        });

        showVolume(shownVolume + (player.volume - shownVolume) * (dragging ? 1 : 1 - Math.exp(-dt * 14)));

        // Title and artist slide out, change, and slide in from the other side.
        let offset = 0, opacity = 1;
        if (swap) {
          swap.t = Math.min(1, swap.t + dt / .5);
          if (swap.t >= .5 && !swap.swapped) {
            const [name, by, tag] = TRACKS[player.track];
            setText(title, name); setText(artist, by); setText(trackLabel, tag);
            swap.swapped = true;
          }
          const half = swap.t < .5 ? ease(swap.t * 2) : 1 - ease((swap.t - .5) * 2);
          offset = (swap.t < .5 ? -1 : 1) * swap.direction * half * size * .12;
          opacity = 1 - half;
          if (swap.t >= 1) swap = null;
        }
        title.position.x = artist.position.x = controlX + offset;
        titleInk.opacity = titleMuted.opacity = trackLabel.material.opacity = opacity;

        // The tab highlight glides between tabs, stretching with its speed.
        const t = step(tab, dt);
        tabPill.position.x = tabX(0) + t * w * .28;
        tabPill.scale.x = 1 + Math.min(.45, Math.abs(tab.velocity) * .06);
        tabs.forEach((mesh, i) => mesh.material.color.lerpColors(MUTED, INK, Math.max(0, 1 - Math.abs(t - i))));
      },
    };
    // Settle everything into its resting pose so thumbnails and first frames match.
    live.update(0, 0);
    return live;
  },
};
