export default {
  id: 'phone-ui',
  name: 'Spatial home screen',
  description: 'A phone UI with floating widgets, sculpted app icons, and a dock hovering just behind the glass.',
  build({ THREE, w, h, size, material, glow, add, box, sphere, ring, chamber, screenFrame }) {
    const landscape = w > h;
    const white = glow('#edf5ff'), muted = glow('#a6b6d8');
    const shape = (width, height, radius) => {
      const x = -width / 2, y = -height / 2;
      const s = new THREE.Shape();
      s.moveTo(x + radius, y);
      s.lineTo(x + width - radius, y);
      s.quadraticCurveTo(x + width, y, x + width, y + radius);
      s.lineTo(x + width, y + height - radius);
      s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      s.lineTo(x + radius, y + height);
      s.quadraticCurveTo(x, y + height, x, y + height - radius);
      s.lineTo(x, y + radius);
      s.quadraticCurveTo(x, y, x + radius, y);
      return s;
    };
    // z is the front face. Real extruded sides reveal the floating layers on tilt.
    const tile = (x, y, z, width, height, depth, color, radius = Math.min(width, height) * .23) => {
      const outline = shape(width, height, radius);
      add(new THREE.ExtrudeGeometry(outline, {
        depth, bevelEnabled: false, curveSegments: 8,
      }), material(color, .2, .38), x, y, z - depth);
      add(new THREE.ShapeGeometry(outline, 8), glow(color), x, y, z + .00002);
    };
    const pill = (x, y, z, width, height, color) =>
      add(new THREE.ShapeGeometry(shape(width, height, Math.min(width, height) / 2), 8), color, x, y, z);
    const disc = (x, y, z, radius, color) => add(new THREE.CircleGeometry(radius, 32), color, x, y, z);
    const triangle = (x, y, z, scale, color, rotation = 0) => {
      const s = new THREE.Shape();
      s.moveTo(-scale * .35, -scale * .5); s.lineTo(scale * .5, 0);
      s.lineTo(-scale * .35, scale * .5); s.closePath();
      const mesh = add(new THREE.ShapeGeometry(s), color, x, y, z);
      mesh.rotation.z = rotation;
    };
    // Geometric digits stay crisp and work without DOM textures or external fonts.
    const digits = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
    const number = (text, x, y, z, height, color) => {
      const advance = height * .72;
      const segments = {
        a: [0, .45, .42, .075], b: [.24, .23, .075, .36],
        c: [.24, -.23, .075, .36], d: [0, -.45, .42, .075],
        e: [-.24, -.23, .075, .36], f: [-.24, .23, .075, .36],
        g: [0, 0, .42, .075],
      };
      [...text].forEach((char, i) => {
        const dx = x + (i - (text.length - 1) / 2) * advance;
        if (char === ':') {
          for (const dy of [-.2, .2]) disc(dx, y + dy * height, z, height * .055, color);
        } else {
          for (const key of digits[Number(char)]) {
            const [sx, sy, sw, sh] = segments[key];
            pill(dx + sx * height, y + sy * height, z, sw * height, sh * height, color);
          }
        }
      });
    };

    chamber(.058, '#10152e');
    screenFrame('#7c91c5');
    // Wallpaper sits well below the UI, with overlapping sunset-colored orbits.
    box(0, 0, -.054, w, h, .002, glow('#171f43'));
    disc(-w * .17, h * .07, -.052, size * .44, glow('#343466'));
    disc(w * .2, -h * .19, -.050, size * .37, glow('#514176'));
    ring(w * .2, -h * .19, -.049, size * .3, size * .002, glow('#8c6caa'));

    const headerY = h * .37;
    number('09:41', -w * .15, headerY, -.029, size * .09, white);
    const statusX = w * .29;
    for (let i = 0; i < 4; i++) {
      const height = size * (.015 + i * .008);
      box(statusX + i * size * .014, headerY - size * .02 + height / 2, -.026,
        size * .008, height, .0005, white);
    }
    pill(w * .4, headerY, -.026, size * .055, size * .025, white);

    const widgetW = landscape ? w * .19 : w * .38;
    const widgetH = landscape ? h * .28 : h * .19;
    const widgetY = landscape ? h * .08 : h * .14;
    const weatherX = landscape ? -w * .32 : -w * .215;
    const musicX = landscape ? -w * .105 : w * .215;
    tile(weatherX, widgetY, -.027, widgetW, widgetH, .006, '#334e79');
    const sunX = weatherX - widgetW * .22, sunY = widgetY + widgetH * .16;
    sphere(sunX, sunY, -.023, size * .038, glow('#ffcf7e'));
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const ray = box(sunX + Math.cos(angle) * size * .055, sunY + Math.sin(angle) * size * .055,
        -.024, size * .015, size * .005, .001, glow('#ffcf7e'));
      ray.rotation.z = angle;
    }
    number('24', weatherX + widgetW * .2, widgetY + widgetH * .16, -.022, size * .065, white);
    ring(weatherX + widgetW * .39, widgetY + widgetH * .28, -.022, size * .007, size * .0015, white);
    pill(weatherX - widgetW * .08, widgetY - widgetH * .29, -.022, widgetW * .6, size * .009, muted);

    tile(musicX, widgetY, -.022, widgetW, widgetH, .007, '#55406f');
    for (let i = 0; i < 9; i++) {
      const height = size * (.025 + .043 * (1 + Math.sin(i * 1.8)) / 2);
      pill(musicX + (i - 4) * widgetW * .069, widgetY + widgetH * .18, -.018,
        widgetW * .026, height, glow(i < 5 ? '#f7acc7' : '#af92d0'));
    }
    triangle(musicX, widgetY - widgetH * .28, -.016, size * .035, white);
    for (const direction of [-1, 1]) {
      triangle(musicX + direction * widgetW * .25, widgetY - widgetH * .28, -.017,
        size * .02, muted, direction < 0 ? Math.PI : 0);
    }

    const iconSize = Math.min(size * .15, h * .095);
    const icon = (kind, x, y, z, color, scale = iconSize) => {
      tile(x, y, z, scale, scale, .005, color);
      const front = z + .001, r = scale;
      if (kind === 'chat') {
        pill(x, y + r * .025, front, r * .64, r * .43, white);
        triangle(x - r * .17, y - r * .2, front, r * .22, white, -Math.PI / 2);
        for (let i = -1; i <= 1; i++) disc(x + i * r * .16, y + r * .025, front + .0002, r * .035, glow(color));
      } else if (kind === 'camera') {
        pill(x, y, front, r * .68, r * .46, white);
        pill(x - r * .14, y + r * .25, front, r * .22, r * .1, white);
        disc(x, y, front + .0002, r * .18, glow('#273859'));
        ring(x, y, front + .0004, r * .115, r * .018, muted);
      } else if (kind === 'photos') {
        const colors = ['#ffd579', '#ffa36f', '#f37cae', '#b499f6', '#7cafed', '#84ddd1'];
        colors.forEach((color, i) => {
          const angle = i * Math.PI / 3;
          disc(x + Math.cos(angle) * r * .19, y + Math.sin(angle) * r * .19,
            front + i * .0001, r * .145, glow(color));
        });
        disc(x, y, front + .0008, r * .1, white);
      } else if (kind === 'compass') {
        ring(x, y, front, r * .3, r * .022, white);
        triangle(x, y + r * .1, front + .0004, r * .35, glow('#ff8999'), Math.PI / 2);
        triangle(x, y - r * .1, front + .0004, r * .35, white, -Math.PI / 2);
      } else if (kind === 'calendar') {
        pill(x, y + r * .25, front, r * .62, r * .08, glow('#ff8999'));
        number('18', x, y - r * .065, front, r * .36, white);
      } else if (kind === 'notes') {
        for (let i = 0; i < 3; i++) pill(x - (i === 2 ? r * .07 : 0), y + (.2 - i * .2) * r,
          front, r * (i === 2 ? .4 : .54), r * .055, white);
      } else if (kind === 'settings') {
        ring(x, y, front, r * .21, r * .06, white);
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          const tooth = box(x + Math.cos(angle) * r * .27, y + Math.sin(angle) * r * .27,
            front, r * .14, r * .09, .001, white);
          tooth.rotation.z = angle;
        }
      } else {
        const handset = add(new THREE.TorusGeometry(r * .25, r * .065, 8, 24, Math.PI * .72), white, x, y, front);
        handset.rotation.z = Math.PI * 1.14;
        for (const dx of [-1, 1]) pill(x + dx * r * .225, y - r * .08, front + .001, r * .16, r * .24, white);
      }
    };
    const apps = [
      ['chat', '#3ea68c'], ['photos', '#ece9f4'], ['camera', '#65718d'], ['compass', '#3b8abe'],
      ['calendar', '#5164a2'], ['notes', '#c59349'], ['settings', '#65718d'], ['phone', '#4baf99'],
    ];
    apps.forEach(([kind, color], i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = landscape ? w * (.065 + col * .103) : (col - 1.5) * w * .207;
      const y = landscape ? h * (.15 - row * .25) : -h * (.07 + row * .16);
      const z = -.012 - row * .004;
      icon(kind, x, y, z, color);
      pill(x, y - iconSize * .67, z - .001, iconSize * .58, size * .005, muted);
    });

    const dockY = -h * .385;
    const dockW = landscape ? w * .4 : w * .84;
    const dockH = Math.min(h * .13, size * .22);
    tile(0, dockY, -.011, dockW, dockH, .005, '#465275', dockH * .35);
    ['phone', 'chat', 'compass', 'camera'].forEach((kind, i) => {
      icon(kind, (i - 1.5) * dockW * .235, dockY, -.005,
        ['#4baf99', '#3ea68c', '#3b8abe', '#818bab'][i], Math.min(iconSize, dockH * .72));
    });
    if (!landscape) {
      for (let i = 0; i < 3; i++) disc((i - 1) * size * .035, -h * .305, -.009, size * .005, i === 0 ? white : muted);
    }
    pill(0, -h * .478, -.003, size * .32, size * .008, white);
  },
};
