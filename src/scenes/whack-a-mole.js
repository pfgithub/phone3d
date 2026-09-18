export default {
  id: 'whack-a-mole',
  name: 'Whack-a-mole',
  description: 'Tap the moles as they emerge 4 mm above the lawn. Score points before they retreat into their 25 mm burrows.',
  build({ THREE, w, h, size, room, material, glow, add, box, sphere, ring, chamber }) {
    chamber(.03, '#152a21');
    const radius = Math.min(w * .086, h * .067);
    const lawn = new THREE.Shape();
    lawn.moveTo(-w / 2, -h / 2); lawn.lineTo(w / 2, -h / 2); lawn.lineTo(w / 2, h / 2); lawn.lineTo(-w / 2, h / 2); lawn.closePath();
    const holes = [];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      const x = (col - 1) * w * .28, y = (row - 1) * h * .24 - h * .035;
      const path = new THREE.Path(); path.absarc(x, y, radius * 1.22, 0, Math.PI * 2, true); lawn.holes.push(path);
      holes.push({ x, y });
    }
    add(new THREE.ExtrudeGeometry(lawn, { depth: .002, bevelEnabled: false, curveSegments: 32 }), material('#47814a', 0, 1), 0, 0, -.002);
    const fur = material('#ae7954', 0, .94), nose = material('#e8b1a0', 0, .65), dark = material('#221b1b', 0, .6);
    const moles = holes.map(({ x, y }, i) => {
      const sleeve = add(new THREE.CylinderGeometry(radius * 1.22, radius * 1.1, .025, 32, 1, true), material('#443128', 0, 1), x, y, -.0125);
      sleeve.rotation.x = Math.PI / 2; sleeve.material.side = THREE.DoubleSide;
      sphere(x, y, -.025, radius * 1.1, glow('#111a15')).scale.z = .08;
      ring(x, y, -.0006, radius * 1.23, size * .009, material('#718348', 0, 1));
      const group = new THREE.Group(); room.add(group); group.position.set(x, y, i === 4 ? .004 - radius : -.025 + radius);
      const body = sphere(0, 0, 0, radius, fur); group.add(body);
      const muzzle = sphere(0, -radius * .2, radius * .86, radius * .37, nose); group.add(muzzle);
      for (const s of [-1, 1]) {
        const ear = sphere(s * radius * .79, radius * .48, radius * .08, radius * .29, fur); group.add(ear);
        const eye = sphere(s * radius * .32, radius * .23, radius * .88, radius * .11, dark); group.add(eye);
        const glint = sphere(s * radius * .32, radius * .26, radius * .99, radius * .035, glow('#fff3cf')); group.add(glint);
      }
      return { group, body, age: i === 4 ? .4 : -1, hit: false };
    });
    box(0, h * .405, .0002, w * .62, h * .105, .001, material('#233c30', .1));
    const digitWidth = Math.min(w * .12, h * .035), digitHeight = h * .065;
    const segments = [[0, 1, 1], [1, .5, 0], [1, -.5, 0], [0, -1, 1], [-1, -.5, 0], [-1, .5, 0], [0, 0, 1]];
    const masks = [63, 6, 91, 79, 102, 109, 125, 7, 127, 111];
    const digits = Array.from({ length: 3 }, (_, index) => segments.map(([x, y, horizontal]) => box(
      (index - 1) * digitWidth * 1.65 + x * digitWidth / 2, h * .405 + y * digitHeight / 2, .001,
      horizontal ? digitWidth : digitWidth * .16, horizontal ? digitWidth * .16 : digitHeight * .43, .0004, glow('#d6ef8a'))));
    let score = 0, next = .55, turn = 0;
    function showScore() {
      const chars = String(score % 1000).padStart(3, '0');
      digits.forEach((digit, i) => digit.forEach((segment, j) => segment.material.color.set(masks[Number(chars[i])] & (1 << j) ? '#d6ef8a' : '#344b35')));
    }
    showScore();
    return {
      pointerDown(p) {
        room.updateMatrixWorld(true);
        const hit = p.ray.intersectObjects(moles.filter(m => m.age >= 0 && !m.hit && m.group.position.z > -radius).map(m => m.body), false)[0];
        if (hit) {
          const mole = moles.find(m => m.body === hit.object);
          mole.hit = true; score++; showScore();
        }
        return true;
      },
      update(dt) {
        dt = Math.min(dt, .05);
        const lifetime = Math.max(.55, 1.65 - score * .027);
        next -= dt;
        if (next <= 0) {
          const start = (turn++ * 7 + 2) % 9;
          for (let j = 0; j < 9; j++) {
            const mole = moles[(start + j) % 9];
            if (mole.age < 0) { mole.age = 0; mole.hit = false; break; }
          }
          next = Math.max(.24, .78 - score * .012);
        }
        for (const mole of moles) {
          if (mole.age < 0) continue;
          mole.age += dt;
          if (mole.hit) {
            mole.group.position.z -= dt * .12;
            if (mole.group.position.z <= -.025 + radius) { mole.group.position.z = -.025 + radius; mole.age = -1; }
          } else {
            const phase = mole.age / lifetime;
            const height = Math.min(1, phase * 5, (1 - phase) * 5);
            mole.group.position.z = THREE.MathUtils.lerp(-.025 + radius, .004 - radius, Math.max(0, height));
            if (phase >= 1) mole.age = -1;
          }
        }
      },
    };
  },
};
