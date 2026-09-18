export default {
  id: 'claw-machine',
  name: 'Claw machine',
  description: 'Drag to aim, release to lower the claw into a 60 mm cabinet. Peek around the pile: centred, unobstructed grabs win plush toys.',
  build({ THREE, w, h, size, room, material, glow, box, sphere, ring, chamber }) {
    chamber(.06, '#38305b');
    const rim = size * .045, trim = material('#d988b8', .5, .3), chrome = material('#c6e2e8', .85, .2);
    for (const side of [-1, 1]) {
      box(side * (w - rim) / 2, 0, -.03, rim, h, .06, trim);
      box(0, side * (h - rim) / 2, -.03, w, rim, .06, trim);
    }
    box(0, -h * .41, -.002, w - rim * 2, h * .13, .004, material('#765089', .3));
    const stick = sphere(0, -h * .41, .002, size * .035, material('#f0b8d8', .4));
    ring(0, -h * .41, .0002, size * .075, .0005, glow('#f6c3e7'));
    const lamps = Array.from({ length: 8 }, (_, i) => sphere((i - 3.5) * w * .09, h * .43, -.001, size * .014, glow('#604b78')));
    box(w * .28, -h * .28, -.057, w * .21, h * .15, .002, material('#171a32'));
    ring(w * .28, -h * .28, -.054, size * .085, size * .008, glow('#75dbc9'));
    const toys = Array.from({ length: 14 }, (_, i) => {
      const r = size * (.051 + (i % 3) * .006);
      const x = Math.sin(i * 2.399) * w * (.19 + (i % 3) * .045);
      const y = Math.cos(i * 2.399) * h * .25 + h * .025;
      const z = -.049 + (i % 4) * .006;
      const group = new THREE.Group(); room.add(group); group.position.set(x, y, z);
      group.rotation.z = Math.sin(i * 9.1) * .45;
      const fabric = material(['#e7b772', '#d67d9e', '#72c4ba', '#a797da'][i % 4], 0, .96);
      const body = sphere(0, 0, 0, r, fabric); group.add(body);
      for (const s of [-1, 1]) {
        const ear = sphere(s * r * .66, r * .76, 0, r * .36, fabric); group.add(ear);
        const paw = sphere(s * r * .67, -r * .62, r * .15, r * .32, fabric); group.add(paw);
        const eye = sphere(s * r * .3, r * .13, r * .94, r * .095, glow('#26263f')); group.add(eye);
      }
      const muzzle = sphere(0, -r * .22, r * .9, r * .24, material('#fff0db', 0, 1)); group.add(muzzle);
      return { group, r, won: false };
    });
    const rail = box(0, h * .1, -.004, w * .84, .001, .001, chrome);
    const cable = box(0, h * .1, -.006, .0005, .0005, 1, chrome);
    const claw = new THREE.Group(); room.add(claw); claw.position.set(0, h * .1, -.009);
    const hub = sphere(0, 0, 0, size * .028, chrome); claw.add(hub);
    const fingers = Array.from({ length: 3 }, (_, i) => {
      const theta = i * Math.PI * 2 / 3;
      const finger = box(0, 0, 0, size * .015, size * .015, .007, chrome); claw.add(finger);
      finger.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(Math.cos(theta) * .35, Math.sin(theta) * .35, 1).normalize());
      return { finger, theta };
    });
    let state = 'idle', timer = 0, target = null, carried = null, wins = 0, opening = 1;
    const destination = new THREE.Vector2();
    function aim(p) {
      claw.position.x = THREE.MathUtils.clamp(p.x, -w * .36, w * .36);
      claw.position.y = THREE.MathUtils.clamp(p.y, -h * .28, h * .35);
      stick.position.x = claw.position.x * .12;
      stick.position.y = -h * .41 + claw.position.y * .07;
    }
    return {
      pointerDown(p) {
        if (state === 'idle') { state = 'aim'; aim(p); }
        return true;
      },
      pointerMove(p) { if (state === 'aim') aim(p); },
      pointerUp(p) {
        if (state !== 'aim') return;
        if (!p) { state = 'idle'; return; }
        aim(p); state = 'drop'; target = null;
        // The first physical contact determines depth; shallow toys obstruct deeper ones.
        for (const toy of toys) {
          if (toy.won) continue;
          const distance = Math.hypot(toy.group.position.x - claw.position.x, toy.group.position.y - claw.position.y);
          if (distance < toy.r + size * .035 && (!target || toy.group.position.z + toy.r > target.group.position.z + target.r)) target = toy;
        }
      },
      update(dt) {
        dt = Math.min(dt, .05);
        if (state === 'drop') {
          const stop = target ? target.group.position.z + target.r + .004 : -.05;
          claw.position.z = Math.max(stop, claw.position.z - dt * .025);
          if (claw.position.z <= stop) { state = 'close'; timer = .4; }
        } else if (state === 'close') {
          timer -= dt; opening = Math.max(0, opening - dt * 3);
          if (timer <= 0) {
            if (target) {
              const distance = Math.hypot(target.group.position.x - claw.position.x, target.group.position.y - claw.position.y);
              const blocked = toys.some(t => t !== target && !t.won && Math.abs(t.group.position.z - target.group.position.z) < target.r &&
                Math.hypot(t.group.position.x - target.group.position.x, t.group.position.y - target.group.position.y) < target.r + t.r * .65);
              if (distance < target.r * .55 && !blocked) carried = target;
            }
            state = 'lift';
          }
        } else if (state === 'lift') {
          claw.position.z = Math.min(-.009, claw.position.z + dt * .03);
          if (claw.position.z >= -.009) {
            state = carried ? 'deliver' : 'return'; timer = .4;
            destination.set(w * .28, -h * .28);
          }
        } else if (state === 'deliver') {
          claw.position.x += (destination.x - claw.position.x) * Math.min(1, dt * 5);
          claw.position.y += (destination.y - claw.position.y) * Math.min(1, dt * 5);
          if (Math.hypot(destination.x - claw.position.x, destination.y - claw.position.y) < .001) {
            state = 'release'; opening = 1;
          }
        } else if (state === 'release') {
          carried.group.position.z -= dt * .065;
          if (carried.group.position.z < -.06) {
            carried.won = true; carried.group.visible = false; carried = null;
            lamps[wins++ % lamps.length].material.color.set('#9affd9');
            state = 'return'; timer = .5;
          }
        } else if (state === 'return') {
          opening = Math.min(1, opening + dt * 3); timer -= dt;
          if (timer <= 0) state = 'idle';
        }
        if (carried && state !== 'release') carried.group.position.set(claw.position.x, claw.position.y, claw.position.z - carried.r - .004);
        for (const { finger, theta } of fingers) {
          const spread = size * (.025 + opening * .052);
          finger.position.set(Math.cos(theta) * spread, Math.sin(theta) * spread, -.004);
        }
        rail.position.y = claw.position.y;
        cable.position.set(claw.position.x, claw.position.y, (claw.position.z - .003) / 2);
        cable.scale.z = Math.max(.001, -.003 - claw.position.z);
      },
    };
  },
};
