import { tactileKit, clamp } from './tactile-kit.js';

const radio = { tuning: .43, powered: true };
const stations = ['NIGHT SWIM', 'SOFT SIGNAL', 'SUNDAY FM'];

export default {
  id: 'tactile-radio',
  name: 'Tactile radio',
  description: 'A pocket radio at the glass. Turn the ridged tuning wheel, press a station preset, or switch off its glowing dial.',
  build(kit) {
    const { w, h, size, glow, ring } = kit;
    const ui = tactileKit(kit, {
      panel: '#eadfc9', ink: '#3c423f', muted: '#938b77',
      well: '#273a36', shadow: '#b4aa95',
    });
    const { flat, disc, label, well, button, raised } = ui;
    const wide = w > h;
    label('SIGNAL', -w * .29, h * .405, size * .052);
    label('POCKET FM / 03', w * .24, h * .405, size * .020, ui.muted);
    const dx = wide ? -w * .235 : 0, dy = wide ? h * .05 : h * .22;
    const dw = w * (wide ? .41 : .82), dh = h * (wide ? .42 : .23);
    well(dx, dy, dw, dh);
    const amber = glow('#ffc27e');
    const frequency = label('96.6', dx - dw * .15, dy + dh * .17, size * .105, amber, -.0037);
    label('MHz', dx + dw * .30, dy + dh * .12, size * .026, amber, -.0037);
    const station = label('SOFT SIGNAL', dx, dy - dh * .13, size * .024, amber, -.0037);
    for (let i = 0; i <= 30; i++) {
      flat(dx + (i / 30 - .5) * dw * .85, dy - dh * .35, -.0036,
        size * .0025, size * (i % 5 === 0 ? .037 : .019), glow('#819782'));
    }
    const needle = flat(dx, dy - dh * .33, -.001, size * .008, size * .065, glow('#ef875a'));

    const cx = wide ? w * .235 : 0, cy = wide ? h * .02 : -h * .08;
    const diameter = size * .34;
    ring(cx, cy, .0001, diameter * .60, size * .005, glow('#b5aa95'));
    const dial = raised(cx, cy, diameter, diameter, '#e6ccb0', true);
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * Math.PI * 2;
      const ridge = flat(Math.sin(a) * diameter * .44, Math.cos(a) * diameter * .44,
        .00288, size * .003, size * .018, glow('#ac9278'));
      ridge.rotation.z = -a; dial.group.add(ridge);
    }
    dial.group.add(disc(0, 0, .00289, diameter * .31, glow('#f5ebd7')));
    dial.group.add(flat(0, diameter * .21, .00292, size * .012, size * .036, glow('#d6744e')));
    label('TURN TO TUNE', cx, cy - size * .255, size * .019, ui.muted);
    // Turn the wheel by dragging around its centre: clockwise tunes up, and
    // the wheel follows the finger at the same rate as it is drawn rotating.
    const sweep = Math.PI * 1.65;
    const angleAt = p => Math.hypot(p.x - cx, p.y - cy) > diameter * .08 ? Math.atan2(p.y - cy, p.x - cx) : null;
    let last = null;
    dial.onDown = p => { last = angleAt(p); };
    dial.onDrag = p => {
      const angle = angleAt(p);
      if (angle === null) return;
      if (last !== null) {
        let delta = angle - last;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        radio.tuning = clamp(radio.tuning - delta / sweep);
      }
      last = angle;
    };

    const presetY = wide ? -h * .31 : -h * .29;
    const presetW = wide ? w * .10 : w * .19;
    const presets = [.16, .43, .79].map((value, i) => {
      const x = cx + (i - 1) * (wide ? w * .13 : w * .26);
      const control = button(`0${i + 1}`, x, presetY, presetW, size * .09, '#f5eedc', () => { radio.tuning = value; });
      const led = disc(x, presetY - size * .07, .00006, size * .006, glow('#d6744e'));
      return { value, control, led };
    });
    const powerX = wide ? -w * .235 : 0, powerY = -h * .415;
    const power = button('ON', powerX, powerY, size * .15, size * .07, '#e7b18f', () => { radio.powered = !radio.powered; });
    // A field of inset speaker perforations balances the wheel in landscape.
    const speakerX = wide ? -w * .235 : -w * .34;
    const speakerY = wide ? -h * .235 : -h * .08;
    for (let row = 0; row < 5; row++) for (let col = 0; col < (wide ? 19 : 3); col++) {
      disc(speakerX + (col - (wide ? 9 : 1)) * size * .023,
        speakerY + (row - 2) * size * .024, .00005, size * .0045, ui.muted);
    }
    ui.finish();
    const sync = () => {
      ui.setText(frequency, radio.powered ? (88 + 20 * radio.tuning).toFixed(1) : '--.-');
      const index = [.16, .43, .79].findIndex(value => Math.abs(value - radio.tuning) < .045);
      ui.setText(station, radio.powered ? (stations[index] ?? 'BETWEEN STATIONS') : 'STANDBY');
      ui.setText(power.caption, radio.powered ? 'ON' : 'OFF');
      amber.color.set(radio.powered ? '#ffc27e' : '#799083');
      needle.position.x = dx + (radio.tuning - .5) * dw * .85;
      dial.group.rotation.z = (.5 - radio.tuning) * Math.PI * 1.65;
      presets.forEach(({ value, led }) => led.material.color.set(radio.powered && Math.abs(value - radio.tuning) < .045 ? '#d6744e' : '#a69d87'));
    };
    sync();
    return { ...ui.live, update(dt) { ui.live.update(dt); sync(); } };
  },
};
