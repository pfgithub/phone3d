import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import typeface from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const font = new FontLoader().parse(typeface);
let selectedDay = 0;

export default {
  id: 'weather-cards',
  name: 'Weather cards',
  description: 'Swipe through three miniature forecasts: falling rain, warm sunbeams, and drifting clouds.',
  build({ THREE, w, h, size, room, material, glow, add, box, sphere, ring, chamber }) {
    chamber(size * 1.15, '#152735');
    const width = w * .8, height = Math.min(h * .7, size * 1.25), gap = w * .94;
    const cards = [], rain = [], clouds = [], rays = [], dots = [];
    function label(text, scale, color, x, y, z, parent = room) {
      const geometry = new THREE.ShapeGeometry(font.generateShapes(text, scale));
      geometry.computeBoundingBox(); geometry.translate(-(geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2, 0, 0);
      const mesh = add(geometry, glow(color), x, y, z); parent.add(mesh); return mesh;
    }
    label('THREE DAYS / FORECAST', size * .023, '#afc7d4', 0, h * .43, -size * .02);
    label('Swipe to explore', size * .028, '#9db8ca', 0, -h * .43, -size * .02);
    const definitions = [
      { day: 'TODAY', title: 'Rain', temperature: '14 C', background: '#304b66', ground: '#365772' },
      { day: 'TOMORROW', title: 'Sunshine', temperature: '22 C', background: '#74afb8', ground: '#7ca783' },
      { day: 'DAY THREE', title: 'Cloudy', temperature: '18 C', background: '#658399', ground: '#526e72' },
    ];
    definitions.forEach((forecast, day) => {
      const group = new THREE.Group(); room.add(group); cards.push(group);
      const putBox = (...args) => { const mesh = box(...args); group.add(mesh); return mesh; };
      putBox(0, 0, -size * .65, width, height, size * .018, material(forecast.background, 0, .85));
      const frame = material('#b0bbc0', .65, .32);
      for (const side of [-1, 1]) {
        putBox(side * width / 2, 0, -size * .34, size * .025, height + size * .025, size * .64, frame);
        putBox(0, side * height / 2, -size * .34, width, size * .025, size * .64, frame);
      }
      putBox(0, -height * .26, -size * .22, width * .94, height * .005, size * .014, glow('#b4d1d3'));
      label(forecast.day, size * .026, '#eef8f3', 0, height * .37, -size * .065, group);
      label(forecast.title, size * .048, '#f0f6ed', 0, -height * .36, -size * .065, group);
      label(forecast.temperature, size * .027, '#cde7df', 0, -height * .44, -size * .065, group);
      // Overlapping landscape layers make each forecast a little shadow box.
      for (let i = 0; i < 3; i++) {
        const hill = sphere((i - 1) * width * .29, -height * .23, -size * (.55 - i * .08), width * .31, material(forecast.ground, 0, .95));
        hill.scale.set(1.4, .25, .24); group.add(hill);
      }
      if (day === 1) {
        const sun = sphere(0, height * .14, -size * .37, size * .107, glow('#ffe69a')); group.add(sun);
        const halo = ring(0, height * .14, -size * .385, size * .127, size * .005, glow('#e8c76d')); group.add(halo);
        const sunRays = new THREE.Group(); sunRays.position.set(0, height * .14, -size * .37); group.add(sunRays);
        for (let i = 0; i < 12; i++) {
          const angle = i / 12 * Math.PI * 2;
          const ray = box(Math.cos(angle) * size * .164, Math.sin(angle) * size * .164, 0,
            size * .009, size * .049, size * .006, glow('#ffdd86'));
          ray.rotation.z = angle - Math.PI / 2; sunRays.add(ray);
        }
        rays.push(sunRays);
      } else {
        for (let i = 0; i < (day === 0 ? 2 : 3); i++) {
          const cloud = new THREE.Group(); group.add(cloud);
          const baseX = (i - (day === 0 ? .5 : 1)) * width * .23;
          cloud.position.set(baseX, height * (.12 + i * .065), -size * (.25 + i * .11));
          const cloudMaterial = material(day === 0 ? '#9eaebb' : '#e9f0e9', 0, .95);
          for (let j = 0; j < 4; j++) {
            const puff = sphere((j - 1.5) * size * .038, (j === 1 || j === 2 ? .012 : 0) * size, 0, size * .042, cloudMaterial);
            puff.scale.set(1.2, .8 + (j % 2) * .2, .7); cloud.add(puff);
          }
          clouds.push({ group: cloud, baseX, phase: i + day });
        }
      }
      if (day === 0) {
        for (let i = 0; i < 65; i++) {
          const drop = box(0, 0, 0, size * .0025, size * (.016 + i % 3 * .005), size * .0025, glow('#a9d8ed'));
          group.add(drop); drop.rotation.z = -.16;
          rain.push({ mesh: drop, phase: ((i * .6180339) % 1), x: ((i * .754877) % 1 - .5) * width * .78, z: -size * (.16 + (i % 5) * .07), speed: .32 + (i % 7) * .033 });
        }
      }
    });
    for (let i = 0; i < 3; i++) dots.push(sphere((i - 1) * size * .047, -h * .375, -size * .02, size * .008, glow('#6d879b')));
    let offset = selectedDay * gap, drag = null, dragOffset = 0;
    function animate(time) {
      cards.forEach((card, i) => { card.position.x = i * gap - offset; });
      dots.forEach((dot, i) => dot.material.color.set(i === selectedDay ? '#e3ddad' : '#6d879b'));
      clouds.forEach(cloud => { cloud.group.position.x = cloud.baseX + Math.sin(time * .35 + cloud.phase) * size * .032; });
      rays.forEach(ray => { ray.rotation.z = time * .07; });
      rain.forEach(drop => {
        const fall = (drop.phase + time * drop.speed) % 1;
        drop.mesh.position.set(drop.x - fall * size * .025, height * (.13 - fall * .36), drop.z);
      });
    }
    animate(0);
    return {
      update(dt, time) {
        const target = selectedDay * gap + (drag ? dragOffset : 0);
        offset += (target - offset) * (1 - Math.exp(-Math.min(dt, .05) * 14));
        animate(time);
      },
      pointerDown(p) { drag = { x: p.x }; dragOffset = 0; return true; },
      pointerMove(p) {
        if (!drag) return;
        dragOffset = THREE.MathUtils.clamp(drag.x - p.x, -gap, gap);
        if ((selectedDay === 0 && dragOffset < 0) || (selectedDay === 2 && dragOffset > 0)) dragOffset *= .23;
      },
      pointerUp(p) {
        if (p && drag) {
          const distance = drag.x - p.x;
          if (Math.abs(distance) > w * .1) selectedDay = THREE.MathUtils.clamp(selectedDay + Math.sign(distance), 0, 2);
        }
        drag = null; dragOffset = 0;
      },
    };
  },
};
