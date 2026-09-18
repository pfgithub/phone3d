export default {
  id: 'lock-picking',
  name: 'Lock picking',
  description: 'Peek under the brass lip to find the shear line. Drag five pins up until they click, then turn the key clockwise to reveal a reward. Amber dot resets.',
  build({ THREE, w, h, size, room, material, glow, add, box, sphere, ring, lines, chamber }) {
    chamber(.05, '#272b32');
    const brass = material('#bc903f', .78, .32), darkBrass = material('#72542c', .7, .4);
    const rim = size * .04;
    for (const side of [-1, 1]) {
      box(side * (w - rim) / 2, 0, -.004, rim, h, .008, brass);
      box(0, side * (h - rim) / 2, -.004, w, rim, .008, brass);
      for (const t of [-1, 1]) {
        const screw = sphere(side * w * .45, t * h * .44, -.0005, size * .013, darkBrass); screw.scale.z = .3;
      }
    }
    const face = new THREE.Shape();
    face.moveTo(-w * .46, -h * .46); face.lineTo(w * .46, -h * .46); face.lineTo(w * .46, h * .46); face.lineTo(-w * .46, h * .46); face.closePath();
    function aperture(left, right, bottom, top) {
      const hole = new THREE.Path(); hole.moveTo(left, bottom); hole.lineTo(left, top); hole.lineTo(right, top); hole.lineTo(right, bottom); hole.closePath(); face.holes.push(hole);
    }
    aperture(-w * .37, w * .37, -h * .035, h * .36);
    aperture(-w * .34, w * .34, -h * .4, -h * .16);
    add(new THREE.ExtrudeGeometry(face, { depth: .002, bevelEnabled: false }), brass, 0, 0, -.002);
    const shearY = h * .13, pinZ = -.014, radius = size * .022;
    const cylinder = add(new THREE.CylinderGeometry(size * .18, size * .18, w * .72, 40, 1, true, Math.PI / 2, Math.PI), darkBrass, 0, shearY, -.017);
    cylinder.rotation.z = Math.PI / 2; cylinder.material.side = THREE.DoubleSide;
    box(0, shearY, -.017, w * .7, .00035, .0005, glow('#a6e1dc'));
    // This lip hides the deeper reference line head-on; parallax exposes it.
    box(0, shearY, -.003, w * .73, size * .026, .003, brass);
    const pins = Array.from({ length: 5 }, (_, i) => {
      const x = (i - 2) * w * .135, target = size * [.055, .095, .035, .078, .115][i];
      const joint = shearY - target, lowerLength = size * .115, upperLength = size * .095;
      const group = new THREE.Group(); room.add(group);
      const pinMat = material('#d7b766', .75, .25);
      const lower = add(new THREE.CylinderGeometry(radius, radius, lowerLength, 16), pinMat, x, joint - lowerLength / 2, pinZ); group.add(lower);
      const upper = add(new THREE.CylinderGeometry(radius, radius, upperLength, 16), material('#9da9b3', .8, .25), x, joint + upperLength / 2, pinZ); group.add(upper);
      const foot = sphere(x, joint - lowerLength, pinZ, radius * 1.35, pinMat); group.add(foot);
      const springPoints = [];
      for (let j = 0; j < 80; j++) for (const k of [j, j + 1]) {
        const a = k / 80 * Math.PI * 14;
        springPoints.push([Math.cos(a) * radius * .65, k / 80, Math.sin(a) * radius * .65]);
      }
      const spring = lines(springPoints, '#b7bdc3');
      const light = sphere(x, h * .39, -.0002, size * .013, glow('#554b30'));
      return { group, lower, foot, spring, pinMat, light, x, joint, upperLength, target, lift: 0, set: false };
    });
    const key = new THREE.Group(); key.position.set(0, -h * .095, .0006); room.add(key);
    const handle = ring(0, 0, 0, size * .061, size * .011, brass); key.add(handle);
    const bar = box(0, size * .047, 0, size * .022, size * .095, .002, brass); key.add(bar);
    const keyHit = sphere(0, 0, -.0005, size * .072, darkBrass); keyHit.scale.z = .12; key.add(keyHit);
    const door = new THREE.Group(); door.position.set(-w * .34, -h * .28, 0); room.add(door);
    const panel = box(w * .34, 0, -.001, w * .68, h * .24, .002, material('#9d7135', .72, .34)); door.add(panel);
    const emboss = ring(w * .34, 0, .0001, Math.min(w * .09, h * .07), size * .007, brass); door.add(emboss);
    box(0, -h * .28, -.047, w * .65, h * .22, .003, material('#503246', 0, 1));
    const gem = add(new THREE.OctahedronGeometry(size * .075), material('#8bf3cf', .5, .18), 0, -h * .28, -.032);
    ring(0, -h * .28, -.04, size * .105, size * .009, glow('#e6c46e'));
    const reset = sphere(w * .41, h * .4, -.0001, size * .022, glow('#ffc879'));
    let selected = null, startY = 0, startLift = 0, turning = false, lastAngle = 0, turn = 0, open = false;
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -pinZ), point = new THREE.Vector3();
    const allSet = () => pins.every(pin => pin.set);
    function resetLock() {
      for (const pin of pins) { pin.set = false; pin.lift = 0; pin.pinMat.color.set('#d7b766'); pin.light.material.color.set('#554b30'); }
      selected = null; turning = false; turn = 0; open = false;
    }
    return {
      pointerDown(p) {
        room.updateMatrixWorld(true);
        const hit = p.ray.intersectObjects([reset, keyHit, handle, bar, ...pins.filter(pin => !pin.set).flatMap(pin => [pin.lower, pin.foot])], false)[0];
        if (!hit) return false;
        if (hit.object === reset) { resetLock(); return true; }
        if ([keyHit, handle, bar].includes(hit.object)) {
          if (allSet() && !open) { turning = true; lastAngle = Math.atan2(p.y - key.position.y, p.x); }
          return true;
        }
        selected = pins.find(pin => pin.lower === hit.object || pin.foot === hit.object);
        if (selected && p.ray.ray.intersectPlane(dragPlane, point)) { startY = point.y; startLift = selected.lift; }
        return true;
      },
      pointerMove(p) {
        if (selected && !selected.set && p.ray.ray.intersectPlane(dragPlane, point)) {
          const lift = THREE.MathUtils.clamp(startLift + point.y - startY, 0, size * .14);
          if (Math.abs(lift - selected.target) < .0006 || (selected.lift < selected.target && lift >= selected.target)) {
            selected.lift = selected.target; selected.set = true; selected.light.material.color.set('#a6ffe2'); selected.pinMat.color.set('#d4efb7');
          } else selected.lift = lift;
        }
        if (turning) {
          const angle = Math.atan2(p.y - key.position.y, p.x);
          const delta = Math.atan2(Math.sin(angle - lastAngle), Math.cos(angle - lastAngle));
          turn = THREE.MathUtils.clamp(turn - delta, 0, Math.PI / 2); lastAngle = angle;
          if (turn > Math.PI * .43) { open = true; turning = false; }
        }
      },
      pointerUp(p) {
        if (selected && !selected.set && !p) selected.lift = startLift;
        selected = null; turning = false;
      },
      update(dt, time) {
        dt = Math.min(dt, .05);
        for (const pin of pins) {
          if (pin !== selected && !pin.set) pin.lift *= Math.exp(-dt * 12);
          pin.group.position.y = pin.lift;
          const bottom = pin.joint + pin.upperLength + pin.lift;
          pin.spring.position.set(pin.x, bottom, pinZ);
          pin.spring.scale.y = Math.max(.0005, shearY + size * .15 - bottom);
        }
        if (open) turn += (Math.PI / 2 - turn) * Math.min(1, dt * 7);
        key.rotation.z = -turn;
        door.rotation.y += ((open ? Math.PI * .55 : 0) - door.rotation.y) * Math.min(1, dt * 3);
        gem.rotation.y = time * .5; gem.rotation.z = Math.sin(time) * .12;
      },
    };
  },
};
