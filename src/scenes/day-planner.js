import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const planner = { day: 18, completed: {} };
const agendas = [
  ['Morning walk', 'Design review', 'Read a chapter'],
  ['Make some space', 'Lunch with Sam', 'Evening stretch'],
  ['Coffee & notes', 'Studio time', 'Call a friend'],
];

export default {
  id: 'day-planner',
  name: 'Glass day planner',
  description: 'Choose a June date and check off its agenda. Lavender calendar keys sit exactly at the glass over a 7.8 mm paper-lined recess.',
  build({ THREE, w, h, size, material, glow, add, box }) {
    const font = new FontLoader().parse(fontData), landscape = w > h;
    const ink = glow('#382f54'), muted = glow('#766989');
    const shape = (width, height, radius = Math.min(width, height) * .18) => {
      const s = new THREE.Shape(), l = -width / 2, r = width / 2, b = -height / 2, t = height / 2;
      s.moveTo(l + radius, b); s.lineTo(r - radius, b);
      s.quadraticCurveTo(r, b, r, b + radius); s.lineTo(r, t - radius);
      s.quadraticCurveTo(r, t, r - radius, t); s.lineTo(l + radius, t);
      s.quadraticCurveTo(l, t, l, t - radius); s.lineTo(l, b + radius);
      s.quadraticCurveTo(l, b, l + radius, b);
      return s;
    };
    const geometry = (value, height) => {
      const g = new THREE.ShapeGeometry(font.generateShapes(value, height));
      g.computeBoundingBox(); const b = g.boundingBox;
      g.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0);
      return g;
    };
    const label = (value, x, y, height, mat = ink, z = 0) => {
      mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
      const mesh = add(geometry(value, height), mat, x, y, z);
      mesh.renderOrder = 2; mesh.userData.value = value; mesh.userData.height = height;
      return mesh;
    };
    const setLabel = (mesh, value) => {
      if (mesh.userData.value === value) return;
      mesh.geometry.dispose(); mesh.geometry = geometry(value, mesh.userData.height);
      mesh.userData.value = value;
    };
    const panel = shape(w, h, size * .025);
    const well = (x, y, width, height) => {
      panel.holes.push(new THREE.Path(shape(width, height).getPoints(10).map(p => p.add(new THREE.Vector2(x, y)))));
      add(new THREE.ShapeGeometry(shape(width, height)), glow('#9586a7'), x, y, -.0076);
    };
    const key = (x, y, width, height, color) => {
      add(new THREE.ExtrudeGeometry(shape(width, height), {
        depth: .0024, bevelEnabled: false, curveSegments: 10,
      }), material('#b3a7c2', .05, .8), x, y, -.0024);
      const mat = glow(color);
      mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -1;
      const top = add(new THREE.ShapeGeometry(shape(width, height)), mat, x, y, 0);
      return { x, y, width, height, top };
    };
    box(0, 0, -.00775, w, h, .0001, material('#93869f'));
    label('A LITTLE ROOM FOR TODAY', 0, h * .437, size * .023);
    const calendarX = landscape ? -w * .235 : 0;
    const calendarY = landscape ? -.055 * h : .13 * h;
    const calendarW = w * (landscape ? .43 : .84);
    const calendarH = h * (landscape ? .48 : .32);
    const cellW = calendarW / 7, cellH = calendarH / 5;
    label('JUNE', calendarX, h * .34, size * .051);
    const weekdaysY = calendarY + calendarH / 2 + size * .029;
    'MTWTFSS'.split('').forEach((day, i) => label(day, calendarX + (i - 3) * cellW, weekdaysY, size * .017, muted));
    well(calendarX, calendarY, calendarW + size * .016, calendarH + size * .014);
    // Paper strata stay below the keys; the exposed edges reveal the shallow depth.
    for (let i = 0; i < 3; i++) {
      box(calendarX, calendarY - calendarH / 2 + size * (.002 + i * .007), -.0067 + i * .0011,
        calendarW * .96, size * .002, .0003, glow(['#dccddd', '#c7b7d2', '#ece2ee'][i]));
    }
    const days = Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const x = calendarX + (i % 7 - 3) * cellW;
      const y = calendarY + (2 - Math.floor(i / 7)) * cellH;
      const control = key(x, y, cellW * .87, cellH * .85, '#e8dfeb');
      const text = label(String(day), x, y, size * .025, glow('#382f54'));
      return { ...control, day, text };
    });

    const agendaX = landscape ? w * .24 : 0;
    const agendaW = w * (landscape ? .40 : .84);
    const headingY = landscape ? h * .27 : -h * .09;
    const heading = label(`JUNE ${planner.day} / YOUR DAY`, agendaX, headingY, size * .025);
    const rowH = h * (landscape ? .135 : .073);
    const rowGap = rowH * 1.27;
    const rows = Array.from({ length: 3 }, (_, i) => {
      const y = headingY - size * .059 - rowH / 2 - i * rowGap;
      well(agendaX, y, agendaW + size * .012, rowH + size * .012);
      const control = key(agendaX, y, agendaW, rowH, '#f2eaf2');
      const check = label('o', agendaX - agendaW * .40, y, size * .037, glow('#766989'));
      const title = label(agendas[0][i], agendaX + agendaW * .025, y, size * .024, glow('#382f54'));
      // Keep long task names inside the same glass surface in either orientation.
      title.geometry.computeBoundingBox();
      const line = box(agendaX + agendaW * .025, y, -.000025, agendaW * .68, size * .002, .00005, glow('#766989'));
      line.material.polygonOffset = true; line.material.polygonOffsetFactor = -3; line.material.polygonOffsetUnits = -3;
      line.renderOrder = 3;
      return { ...control, index: i, check, title, line };
    });
    const completion = label('0 / 3 COMPLETE', agendaX, landscape ? -h * .365 : -h * .41, size * .017, muted);
    box(0, -h * .475, -.0003, size * .24, size * .007, .0002, glow('#766989'));
    add(new THREE.ExtrudeGeometry(panel, {
      depth: .0071, bevelEnabled: false, curveSegments: 10,
    }), material('#d5c6dd', .05, .8), 0, 0, -.0075);

    let pressed = null;
    const controls = [...days, ...rows];
    const valid = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
    const over = (c, p) => Math.abs(p.x - c.x) <= c.width / 2 && Math.abs(p.y - c.y) <= c.height / 2;
    const sync = () => {
      days.forEach(c => {
        c.top.material.color.set(c.day === planner.day ? '#786098' : '#e8dfeb');
        c.text.material.color.set(c.day === planner.day ? '#fff4ff' : '#382f54');
      });
      setLabel(heading, `JUNE ${planner.day} / YOUR DAY`);
      const done = planner.completed[planner.day] || [false, false, false];
      rows.forEach((c, i) => {
        setLabel(c.title, agendas[(planner.day - 1) % agendas.length][i]);
        const b = c.title.geometry.boundingBox;
        c.title.scale.setScalar(Math.min(1, agendaW * .72 / Math.max(.001, b.max.x - b.min.x)));
        setLabel(c.check, done[i] ? '+' : 'o');
        c.check.material.color.set(done[i] ? '#426d60' : '#766989');
        c.top.material.color.set(done[i] ? '#d6e6db' : '#f2eaf2');
        c.title.material.color.set(done[i] ? '#76847b' : '#382f54');
        c.line.visible = done[i];
      });
      setLabel(completion, `${done.filter(Boolean).length} / 3 COMPLETE`);
    };
    sync();
    return {
      pointerDown(p) {
        if (!valid(p)) return false;
        pressed = controls.find(c => over(c, p));
        if (!pressed) return false;
        pressed.top.material.color.set('#b9a4d1'); return true;
      },
      pointerMove(p) {
        if (!pressed || !valid(p)) return;
        sync();
        if (over(pressed, p)) pressed.top.material.color.set('#b9a4d1');
      },
      pointerUp(p) {
        if (pressed && valid(p) && over(pressed, p)) {
          if (pressed.day) planner.day = pressed.day;
          else {
            const done = planner.completed[planner.day] ||= [false, false, false];
            done[pressed.index] = !done[pressed.index];
          }
        }
        pressed = null; sync();
      },
    };
  },
};
