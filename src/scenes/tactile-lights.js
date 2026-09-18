import { tactileKit, clamp } from './tactile-kit.js';

const lights = { values: [.85, .42, .64], on: true };
const presets = [[.85, .42, .64], [.3, .8, .95], [1, .22, .12]];

export default {
  id: 'tactile-lights',
  name: 'Tactile light mixer',
  description: 'A miniature lighting desk. Slide three raised faders to mix the recessed light sculpture, or try a mood preset.',
  build(kit) {
    const { w, h, size, THREE, glow, add, ring } = kit;
    const ui = tactileKit(kit, {
      panel: '#cddbdc', ink: '#29474e', muted: '#718e96',
      well: '#152c3b', shadow: '#9eafb3',
    });
    const { label, flat, well, button, raised } = ui;
    const wide = w > h;
    const colors = ['#ffc185', '#9adac8', '#b6b2f5'];
    label('AFTERGLOW', -w * .22, h * .405, size * .044);
    label('LIGHT / STUDIO', w * .28, h * .405, size * .018, ui.muted);
    const displayX = wide ? -w * .235 : 0, displayY = wide ? h * .025 : h * .23;
    const displayW = w * (wide ? .41 : .82), displayH = h * (wide ? .49 : .22);
    well(displayX, displayY, displayW, displayH, .008);
    const radius = Math.min(displayW * .26, displayH * .32);
    const sculpture = [];
    for (let i = 0; i < 3; i++) {
      const mesh = ring(displayX + (i - 1) * radius * .66, displayY, -.0045 + i * .001,
        radius, size * .012, glow(colors[i]));
      mesh.rotation.y = (i - 1) * .24;
      sculpture.push(mesh);
    }
    const mixed = glow('#ffd9bb');
    const orb = add(new THREE.SphereGeometry(size * .045, 32, 24), mixed, displayX, displayY, -.0025);
    label('MIX YOUR MOOD', displayX, displayY - displayH * .39, size * .017, glow('#92afb9'), -.0075);

    const controlX = wide ? w * .235 : 0;
    const bottom = wide ? -h * .17 : -h * .20;
    const travel = h * (wide ? .31 : .25);
    const spacing = wide ? w * .125 : w * .25;
    const faders = colors.map((color, i) => {
      const x = controlX + (i - 1) * spacing;
      well(x, bottom + travel / 2, size * .033, travel + size * .065, .003);
      const fill = flat(x, bottom, -.0025, size * .010, travel, glow(color));
      for (let tick = 0; tick <= 8; tick++) {
        flat(x + size * .049, bottom + tick / 8 * travel, .00006,
          size * (tick % 4 === 0 ? .020 : .010), size * .002, ui.muted);
      }
      const thumb = raised(x, bottom + lights.values[i] * travel, size * .115, size * .071, '#ecf0e8');
      thumb.group.add(flat(0, 0, .00287, size * .075, size * .008, glow(color)));
      for (const side of [-1, 1]) thumb.group.add(flat(0, side * size * .017, .00287, size * .06, size * .0025, ui.muted));
      thumb.contains = p => Math.abs(p.x - x) < size * .077
        && p.y >= bottom - size * .06 && p.y <= bottom + travel + size * .06;
      thumb.onDown = thumb.onDrag = p => { lights.values[i] = clamp((p.y - bottom) / travel); };
      label(['AMBER', 'JADE', 'LILAC'][i], x, bottom + travel + size * .074, size * .020);
      const level = label('85', x, bottom - size * .073, size * .025, ui.muted);
      return { thumb, fill, level };
    });
    const presetY = wide ? -h * .35 : -h * .335;
    ['DUSK', 'TIDAL', 'EMBER'].forEach((name, i) => {
      button(name, controlX + (i - 1) * spacing, presetY, wide ? w * .105 : w * .21,
        size * .077, '#e6eeea', () => { lights.values = [...presets[i]]; lights.on = true; });
    });
    const power = button('LIGHT ON', wide ? displayX : 0, -h * .435,
      size * .26, size * .065, '#b3c6c8', () => { lights.on = !lights.on; });
    ui.finish();
    const tint = colors.map(color => new THREE.Color(color));
    const dark = new THREE.Color('#223c4b');
    const sync = () => {
      mixed.color.setRGB(0, 0, 0);
      let total = 0;
      faders.forEach(({ thumb, fill, level }, i) => {
        const value = lights.values[i];
        thumb.group.position.y = bottom + value * travel;
        fill.scale.y = Math.max(.001, value);
        fill.position.y = bottom + value * travel / 2;
        ui.setText(level, String(Math.round(value * 100)).padStart(2, '0'));
        sculpture[i].material.color.copy(dark).lerp(tint[i], lights.on ? value : 0);
        mixed.color.r += tint[i].r * value;
        mixed.color.g += tint[i].g * value;
        mixed.color.b += tint[i].b * value;
        total += value;
      });
      if (total > 0) mixed.color.multiplyScalar(1 / total);
      if (!lights.on || total === 0) mixed.color.copy(dark);
      orb.scale.setScalar(.7 + total * .15);
      ui.setText(power.caption, lights.on ? 'LIGHT ON' : 'LIGHT OFF');
    };
    sync();
    return { ...ui.live, update(dt) { ui.live.update(dt); sync(); } };
  },
};
