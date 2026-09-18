export default {
  id: 'tile-pull',
  name: 'Tile pull',
  description: 'Drag wooden blocks along their length. Layers descend in 6 mm steps; unsupported blocks tip into the pocket. Tap the amber corner to rebuild.',
  build({ THREE, w, h, size, room, material, glow, box, sphere, lines, chamber }) {
    chamber(.085, '#242835');
    const rim = size * .035, walnut = material('#70513a', .05, .7);
    for (const side of [-1, 1]) {
      box(side * (w - rim) / 2, 0, -.006, rim, h, .012, walnut);
      box(0, side * (h - rim) / 2, -.006, w, rim, .012, walnut);
    }
    box(0, 0, -.038, size * .91, size * .91, .004, material('#404957', .4));
    const reset = sphere(w * .42, h * .42, -.0008, size * .026, glow('#e7b36c'));
    const blocks = [];
    for (let layer = 0; layer < 6; layer++) for (let slot = 0; slot < 3; slot++) {
      const horizontal = layer % 2 === 0;
      const length = size * (.56 + layer * .057), width = size * .17;
      const x = horizontal ? 0 : (slot - 1) * size * .19;
      const y = horizontal ? (slot - 1) * size * .19 : 0;
      const group = new THREE.Group(); group.position.set(x, y, -.003 - layer * .006); room.add(group);
      const mat = material(['#d3a369', '#b8824b', '#e4b97d'][(slot + layer) % 3], 0, .75);
      const body = box(0, 0, 0, horizontal ? length : width, horizontal ? width : length, .0058, mat); group.add(body);
      const grain = [];
      for (let i = -2; i <= 2; i++) {
        const offset = i * width * .15;
        grain.push(horizontal ? [-length * .45, offset, .00294] : [offset, -length * .45, .00294],
          horizontal ? [length * .45, offset + width * .035, .00294] : [offset + width * .035, length * .45, .00294]);
      }
      const marking = lines(grain, '#79542f', .35); group.add(marking);
      blocks.push({ group, body, mat, original: mat.color.clone(), layer, horizontal, length, width,
        home: group.position.clone(), falling: false, speed: 0, spin: 0 });
    }
    let selected = null, dragStart = 0, blockStart = 0;
    const plane = new THREE.Plane(), point = new THREE.Vector3();
    function bounds(b) {
      const p = b.group.position;
      const dx = (b.horizontal ? b.length : b.width) / 2, dy = (b.horizontal ? b.width : b.length) / 2;
      return [p.x - dx, p.x + dx, p.y - dy, p.y + dy];
    }
    function supported(b) {
      const a = bounds(b);
      if (b.layer === 5) return Math.abs(b.group.position.x) < size * .455 && Math.abs(b.group.position.y) < size * .455;
      let left = Infinity, right = -Infinity, bottom = Infinity, top = -Infinity;
      for (const other of blocks) {
        if (other.layer !== b.layer + 1 || other.falling) continue;
        const c = bounds(other);
        const x1 = Math.max(a[0], c[0]), x2 = Math.min(a[1], c[1]);
        const y1 = Math.max(a[2], c[2]), y2 = Math.min(a[3], c[3]);
        if (x2 - x1 > size * .006 && y2 - y1 > size * .006) {
          left = Math.min(left, x1); right = Math.max(right, x2); bottom = Math.min(bottom, y1); top = Math.max(top, y2);
        }
      }
      return b.group.position.x >= left && b.group.position.x <= right && b.group.position.y >= bottom && b.group.position.y <= top;
    }
    function rebuild() {
      selected = null;
      for (const b of blocks) {
        b.group.position.copy(b.home); b.group.rotation.set(0, 0, 0); b.group.visible = true;
        b.falling = false; b.speed = 0; b.spin = 0; b.mat.color.copy(b.original);
      }
    }
    return {
      pointerDown(p) {
        room.updateMatrixWorld(true);
        const hit = p.ray.intersectObjects([reset, ...blocks.filter(b => !b.falling).map(b => b.body)], false)[0];
        if (!hit) return false;
        if (hit.object === reset) { rebuild(); return true; }
        selected = blocks.find(b => b.body === hit.object);
        plane.set(new THREE.Vector3(0, 0, 1), -(selected.group.position.z + .0029));
        p.ray.ray.intersectPlane(plane, point);
        dragStart = selected.horizontal ? point.x : point.y;
        blockStart = selected.horizontal ? selected.group.position.x : selected.group.position.y;
        selected.mat.color.set('#f2ce92');
        return true;
      },
      pointerMove(p) {
        if (!selected || !p.ray.ray.intersectPlane(plane, point)) return;
        const axis = selected.horizontal ? 'x' : 'y';
        selected.group.position[axis] = blockStart + point[axis] - dragStart;
      },
      pointerUp(p) {
        if (!selected) return;
        if (!p) selected.group.position[selected.horizontal ? 'x' : 'y'] = blockStart;
        selected.mat.color.copy(selected.original); selected = null;
      },
      update(dt) {
        dt = Math.min(dt, .05);
        for (let i = blocks.length - 1; i >= 0; i--) {
          const b = blocks[i];
          if (b === selected || !b.group.visible) continue;
          if (!b.falling && !supported(b)) { b.falling = true; b.spin = (b.group.position.x + b.group.position.y >= 0 ? 1 : -1) * 2; }
          if (b.falling) {
            b.speed += dt * .23; b.group.position.z -= b.speed * dt;
            b.group.rotation[b.horizontal ? 'y' : 'x'] += b.spin * dt;
            if (b.group.position.z < -.1) b.group.visible = false;
          }
        }
      },
    };
  },
};
