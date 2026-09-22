import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const calculator = { entry: '0', stored: null, operation: null, fresh: false };
const operate = (a, b, op) => op === '+' ? a + b : op === '-' ? a - b : op === 'x' ? a * b : b === 0 ? NaN : a / b;
const format = value => Number.isFinite(value) ? String(Number(value.toPrecision(9))) : 'Error';

export default {
  id: 'pocket-calculator',
  name: 'Glass calculator',
  description: 'A working pocket calculator: flush glass keys over copper-lined wells, with a display recessed 6 mm. Total depth 7.8 mm.',
  build({ THREE, w, h, size, material, glow, add, box }) {
    const font = new FontLoader().parse(fontData), landscape = w > h;
    const ink = glow('#253c36'), pale = glow('#def0cf'), muted = glow('#769280');
    const shape = (width, height, radius = Math.min(width, height) * .18) => {
      const s = new THREE.Shape(), l = -width / 2, r = width / 2, b = -height / 2, t = height / 2;
      s.moveTo(l + radius, b); s.lineTo(r - radius, b);
      s.quadraticCurveTo(r, b, r, b + radius); s.lineTo(r, t - radius);
      s.quadraticCurveTo(r, t, r - radius, t); s.lineTo(l + radius, t);
      s.quadraticCurveTo(l, t, l, t - radius); s.lineTo(l, b + radius);
      s.quadraticCurveTo(l, b, l + radius, b);
      return s;
    };
    const textGeometry = (value, height) => {
      const g = new THREE.ShapeGeometry(font.generateShapes(value, height));
      g.computeBoundingBox(); const b = g.boundingBox;
      g.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0);
      return g;
    };
    const label = (value, x, y, height, mat, z = 0) => {
      mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2;
      const mesh = add(textGeometry(value, height), mat, x, y, z);
      mesh.renderOrder = 2; return mesh;
    };
    const panel = shape(w, h, size * .02);
    const well = (x, y, width, height) => {
      panel.holes.push(new THREE.Path(shape(width, height).getPoints(10).map(p => p.add(new THREE.Vector2(x, y)))));
      add(new THREE.ShapeGeometry(shape(width, height)), glow('#263e34'), x, y, -.0076);
    };
    box(0, 0, -.00775, w, h, .0001, material('#594f41'));
    label('POCKET / CALCULATOR', 0, h * .435, size * .025, ink);
    const displayX = landscape ? -w * .255 : 0;
    const displayY = landscape ? .035 * h : .285 * h;
    const displayW = w * (landscape ? .37 : .82);
    const displayH = h * (landscape ? .43 : .18);
    well(displayX, displayY, displayW, displayH);
    add(new THREE.ShapeGeometry(shape(displayW * .96, displayH * .91)), glow('#152d26'), displayX, displayY, -.0068);
    // Fine recessed rulings make the LCD's distance from the glass legible.
    for (let i = 0; i < 8; i++) box(displayX, displayY + (i - 3.5) * displayH * .1,
      -.0065, displayW * .90, size * .001, .00005, glow('#20382e'));
    const display = label(calculator.entry, displayX, displayY - displayH * .08, size * .075, pale, -.006);
    const operationLabels = ['+', '-', 'x', '/'].map((op, i) =>
      label(op, displayX + (i - 1.5) * displayW * .16, displayY + displayH * .31, size * .022, glow('#769280'), -.006));
    if (landscape) label('PRECISION IN YOUR POCKET', displayX, -h * .29, size * .016, ink);

    const gridX = landscape ? w * .225 : 0;
    const gridY = landscape ? -.035 * h : -.15 * h;
    const gridW = w * (landscape ? .45 : .84);
    const gridH = h * (landscape ? .69 : .60);
    const cellW = gridW / 4, cellH = gridH / 5;
    const keys = [
      ['AC', '+/-', '%', '/'],
      ['7', '8', '9', 'x'],
      ['4', '5', '6', '-'],
      ['1', '2', '3', '+'],
      ['DEL', '0', '.', '='],
    ].flatMap((row, j) => row.map((value, i) => {
      const x = gridX + (i - 1.5) * cellW, y = gridY + (2 - j) * cellH;
      const width = cellW * .86, height = cellH * .84;
      well(x, y, cellW * .95, cellH * .94);
      add(new THREE.ExtrudeGeometry(shape(width, height), {
        depth: .003, bevelEnabled: false, curveSegments: 10,
      }), material('#967558', .35, .4), x, y, -.003);
      const color = i === 3 ? '#d99a6b' : j === 0 ? '#becaba' : '#eee9d9';
      const mat = glow(color);
      mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -1;
      const top = add(new THREE.ShapeGeometry(shape(width, height)), mat, x, y, 0);
      label(value, x, y, size * (value.length > 1 ? .026 : .044), ink);
      return { x, y, width, height, value, color, top };
    }));
    add(new THREE.ExtrudeGeometry(panel, {
      depth: .0071, bevelEnabled: false, curveSegments: 10,
    }), material('#c3c4b3', .08, .8), 0, 0, -.0075);

    let shown = calculator.entry, pressed = null;
    const sync = () => {
      if (shown !== calculator.entry) {
        shown = calculator.entry;
        display.geometry.dispose(); display.geometry = textGeometry(shown, size * .075);
      }
      display.geometry.computeBoundingBox();
      const bounds = display.geometry.boundingBox;
      const scale = Math.min(1, displayW * .83 / Math.max(.001, bounds.max.x - bounds.min.x));
      display.scale.setScalar(scale);
      operationLabels.forEach((mesh, i) => mesh.material.color.set(calculator.operation === ['+', '-', 'x', '/'][i] ? '#def0cf' : '#496354'));
    };
    const input = value => {
      const c = calculator;
      if (value === 'AC' || (c.entry === 'Error' && value === 'DEL')) {
        c.entry = '0'; c.stored = null; c.operation = null; c.fresh = false;
      } else if (/^[0-9.]$/.test(value)) {
        if (c.fresh || c.entry === 'Error' || /e/i.test(c.entry)) { c.entry = '0'; c.fresh = false; }
        if (value === '.') { if (!c.entry.includes('.')) c.entry += '.'; }
        else if (c.entry.replace(/[-.]/g, '').length < 9) c.entry = c.entry === '0' ? value : c.entry + value;
      } else if (value === 'DEL') {
        if (!c.fresh) c.entry = c.entry.length > 1 && !/e/i.test(c.entry) ? c.entry.slice(0, -1) : '0';
        if (c.entry === '-') c.entry = '0';
      } else if (value === '+/-' || value === '%') {
        c.entry = format(Number(c.entry) * (value === '%' ? .01 : -1));
      } else if (value === '=') {
        if (c.operation && c.stored !== null) c.entry = format(operate(c.stored, Number(c.entry), c.operation));
        c.operation = null; c.stored = null; c.fresh = true;
      } else if (c.entry !== 'Error') {
        if (c.operation && !c.fresh) c.entry = format(operate(c.stored, Number(c.entry), c.operation));
        c.stored = c.entry === 'Error' ? null : Number(c.entry);
        c.operation = c.entry === 'Error' ? null : value; c.fresh = true;
      }
      sync();
    };
    const valid = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
    const over = (key, p) => Math.abs(p.x - key.x) <= key.width / 2 && Math.abs(p.y - key.y) <= key.height / 2;
    sync();
    return {
      pointerDown(p) {
        if (!valid(p)) return false;
        pressed = keys.find(key => over(key, p));
        if (!pressed) return false;
        pressed.top.material.color.set('#f8cf92'); return true;
      },
      pointerMove(p) {
        if (pressed && valid(p)) pressed.top.material.color.set(over(pressed, p) ? '#f8cf92' : pressed.color);
      },
      pointerUp(p) {
        if (!pressed) return;
        if (valid(p) && over(pressed, p)) input(pressed.value);
        pressed.top.material.color.set(pressed.color); pressed = null;
      },
    };
  },
};
