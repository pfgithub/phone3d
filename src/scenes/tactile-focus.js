import { tactileKit } from './tactile-kit.js';

const timer = { duration: 25 * 60, remaining: 25 * 60, running: false };

export default {
  id: 'tactile-focus',
  name: 'Tactile focus timer',
  description: 'A soft coral focus timer. Choose 5, 15, or 25 minutes, press start, and watch the recessed countdown ring unwind.',
  build(kit) {
    const { w, h, size, THREE, glow, add } = kit;
    const ui = tactileKit(kit, {
      panel: '#efc5b5', ink: '#533d3b', muted: '#ac7c70',
      well: '#402f36', shadow: '#c69687',
    });
    const { label, flat, disc, well, button } = ui;
    const wide = w > h;
    label('ONE THING', -w * .22, h * .405, size * .047);
    label('MAKE A LITTLE SPACE', w * .24, h * .405, size * .016, ui.muted);
    const cx = wide ? -w * .225 : 0, cy = wide ? 0 : h * .15;
    const radius = size * (wide ? .265 : .33);
    well(cx, cy, radius * 2.35, radius * 2.35, .005);
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const angle = i / 60 * Math.PI * 2;
      const tick = flat(cx + Math.sin(angle) * radius, cy + Math.cos(angle) * radius,
        -.0038, size * .008, size * (i % 5 === 0 ? .038 : .021), glow('#ffc19e'));
      tick.rotation.z = -angle; ticks.push(tick);
    }
    const face = label('25:00', cx, cy + size * .019, size * .12, glow('#ffe4cf'), -.0046);
    const status = label('READY WHEN YOU ARE', cx, cy - size * .083, size * .018, glow('#ce9c95'), -.0046);
    const dot = disc(cx, cy + size * .14, -.0045, size * .012, glow('#f4ab8b'));
    const controlX = wide ? w * .235 : 0, playY = wide ? h * .03 : -h * .13;
    const play = button('START', controlX, playY, size * .32, size * .15, '#ffe7cf', () => {
      if (timer.remaining <= 0) timer.remaining = timer.duration;
      timer.running = !timer.running;
    });
    const resetY = playY - size * .16;
    button('RESET', controlX, resetY, size * .20, size * .072, '#e5ad9a', () => {
      timer.running = false; timer.remaining = timer.duration;
    });
    const presetY = wide ? -h * .30 : -h * .32;
    const spacing = wide ? w * .125 : w * .255;
    const selections = [5, 15, 25].map((minutes, i) => {
      const x = controlX + (i - 1) * spacing;
      button(`${minutes} MIN`, x, presetY, wide ? w * .105 : w * .21, size * .085, '#f7d5c0', () => {
        timer.duration = timer.remaining = minutes * 60; timer.running = false;
      });
      return { minutes, mark: flat(x, presetY - size * .062, .00006, size * .045, size * .005, glow('#8f5145')) };
    });
    label('LESS RUSH. MORE ROOM.', 0, -h * .433, size * .022, ui.muted);
    // A tiny embossed hourglass is still physical when the timer is stopped.
    const iconX = wide ? controlX : -w * .34, iconY = wide ? h * .26 : -h * .10;
    for (const side of [-1, 1]) {
      const cone = add(new THREE.ConeGeometry(size * .027, size * .035, 24),
        glow('#bc8878'), iconX, iconY + side * size * .0175, .0003);
      cone.rotation.z = side === 1 ? Math.PI : 0;
    }
    ui.finish();
    const sync = time => {
      const seconds = Math.ceil(timer.remaining);
      ui.setText(face, `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
      ui.setText(play.caption, timer.running ? 'PAUSE' : timer.remaining <= 0 ? 'AGAIN' : 'START');
      ui.setText(status, timer.remaining <= 0 ? 'A MOMENT WELL SPENT' : timer.running ? 'ONE THING AT A TIME' : 'READY WHEN YOU ARE');
      ticks.forEach((tick, i) => tick.material.color.set(i / 60 < timer.remaining / timer.duration ? '#ffc19e' : '#705054'));
      dot.scale.setScalar(timer.running ? .83 + .17 * Math.sin(time * 2) : 1);
      selections.forEach(({ minutes, mark }) => { mark.visible = minutes * 60 === timer.duration; });
    };
    sync(0);
    return { ...ui.live, update(dt, time) {
      ui.live.update(dt);
      if (timer.running) {
        timer.remaining = Math.max(0, timer.remaining - dt);
        if (timer.remaining === 0) timer.running = false;
      }
      sync(time);
    } };
  },
};
