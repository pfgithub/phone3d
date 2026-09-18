import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with { type: 'json' };

const font = new FontLoader().parse(fontData);

export default {
  id: 'lock-screen',
  name: 'Lock screen',
  description: 'A layered lock screen: the clock floats 1 mm in front of the glass, the UI sits on it, and dusk dunes fall away behind.',
  build({ THREE, w, h, size, glow, add, box, ring }) {
    const landscape = w > h;
    const ink = glow('#fff4ef');
    const muted = glow('#cfc8dd');
    const cardMaterial = glow('#34364f');
    const edgeMaterial = glow('#55556e');

    // The clock floats 1 mm in front of the glass and the rest of the UI sits
    // on it (z = 0); the dunes step back from 2 to 8 mm, then the wallpaper.
    const wallpaper = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          vec3 night = vec3(0.065, 0.085, 0.17);
          vec3 dusk = vec3(0.40, 0.26, 0.38);
          vec3 color = mix(dusk, night, smoothstep(0.05, 0.95, vUv.y));
          float haze = exp(-7.0 * length((vUv - vec2(0.8, 0.23)) * vec2(0.8, 1.4)));
          color += haze * vec3(0.34, 0.16, 0.08);
          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    // Overscan keeps the wallpaper behind the edges when the viewer moves.
    add(new THREE.PlaneGeometry(w * 1.5, h * 1.5), wallpaper, 0, 0, -.01);

    function dune(y, depth, color, bend) {
      const shape = new THREE.Shape();
      shape.moveTo(-w, -h);
      shape.lineTo(-w, y);
      shape.bezierCurveTo(-w * .32, y + h * bend, w * .1, y - h * .22, w, y + h * .1);
      shape.lineTo(w, -h);
      shape.closePath();
      add(new THREE.ShapeGeometry(shape), glow(color), 0, 0, depth);
    }
    dune(-h * .12, -.008, '#635066', .23);
    dune(-h * .26, -.005, '#302d49', .32);
    dune(-h * .38, -.002, '#22263e', .15);

    function rounded(x, y, z, width, height, radius, mat) {
      const shape = new THREE.Shape();
      const l = -width / 2, r = width / 2, b = -height / 2, t = height / 2;
      shape.moveTo(l + radius, b);
      shape.lineTo(r - radius, b);
      shape.quadraticCurveTo(r, b, r, b + radius);
      shape.lineTo(r, t - radius);
      shape.quadraticCurveTo(r, t, r - radius, t);
      shape.lineTo(l + radius, t);
      shape.quadraticCurveTo(l, t, l, t - radius);
      shape.lineTo(l, b + radius);
      shape.quadraticCurveTo(l, b, l + radius, b);
      add(new THREE.ShapeGeometry(shape), mat, x, y, z);
    }

    function label(text, x, y, z, height, mat = ink, align = 'center', maxWidth = w * .85) {
      const geometry = new THREE.ShapeGeometry(font.generateShapes(text, height));
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox;
      const width = bounds.max.x - bounds.min.x;
      const scale = Math.min(1, maxWidth / width);
      geometry.translate(-bounds.min.x - (align === 'center' ? width / 2 : 0),
        -(bounds.min.y + bounds.max.y) / 2, 0);
      const mesh = add(geometry, mat, x, y, z);
      mesh.scale.setScalar(scale);
    }

    function lock(x, y, z, radius) {
      // The body covers the lower half of the shackle.
      ring(x, y + radius * .55, z - .00003, radius * .65, radius * .13, ink);
      rounded(x, y - radius * .22, z, radius * 1.8, radius * 1.45, radius * .24, ink);
      rounded(x, y - radius * .2, z + .00002, radius * .18, radius * .5, radius * .08, cardMaterial);
    }

    // Restrained status details close to the glass.
    label('PARALLAX', -w * .43, h * .443, 0, size * .024, muted, 'left', w * .28);
    const bar = size * .009;
    for (let i = 0; i < 4; i++) {
      const height = size * (.016 + i * .009);
      box(w * .33 + i * bar * 1.5, h * .437 + height / 2, 0, bar, height, .00005, ink);
    }
    rounded(w * .423, h * .45, -.00005, size * .067, size * .03, size * .007, muted);
    rounded(w * .42, h * .45, 0, size * .049, size * .018, size * .003, ink);

    const clockX = landscape ? -w * .235 : 0;
    lock(clockX, h * .355, -.002, size * .015);
    label('Friday, September 18', clockX, h * .284, 0, size * .037, ink, 'center', w * .8);
    label('9:41', clockX, h * (landscape ? .12 : .19), .001, size * .235, ink, 'center', w * .8);
    label('18°  Clear skies', clockX, h * (landscape ? -.04 : .09), 0, size * .029, muted);

    const cardX = landscape ? w * .245 : 0;
    const cardWidth = landscape ? w * .43 : w * .88;
    const cardHeight = Math.min(size * .19, h * .135);
    const topY = landscape ? h * .12 : -h * .075;
    const iconSize = Math.min(size * .092, cardHeight * .53);
    const inset = size * .033;

    function notification(y, app, title, detail, time, color, symbol) {
      const z = 0;
      rounded(cardX, y - size * .006, z - .0005, cardWidth, cardHeight, size * .03, glow('#202238'));
      rounded(cardX, y, z - .00004, cardWidth, cardHeight, size * .03, edgeMaterial);
      rounded(cardX, y, z, cardWidth - size * .003, cardHeight - size * .003, size * .029, cardMaterial);
      const iconX = cardX - cardWidth / 2 + inset + iconSize / 2;
      rounded(iconX, y, z + .0001, iconSize, iconSize, iconSize * .24, glow(color));
      if (symbol === 'message') {
        rounded(iconX, y + iconSize * .03, z + .00015, iconSize * .58, iconSize * .4, iconSize * .12, ink);
        const tail = new THREE.Shape();
        tail.moveTo(-iconSize * .18, 0);
        tail.lineTo(-iconSize * .18, -iconSize * .28);
        tail.lineTo(iconSize * .08, 0);
        tail.closePath();
        add(new THREE.ShapeGeometry(tail), ink, iconX, y, z + .00016);
      } else {
        label('18', iconX, y, z + .00015, iconSize * .35, ink);
      }
      const textX = iconX + iconSize / 2 + inset * .65;
      const textWidth = cardX + cardWidth / 2 - inset - textX;
      label(app, textX, y + cardHeight * .29, z + .00012, size * .019, muted, 'left', textWidth * .72);
      label(time, cardX + cardWidth / 2 - inset - size * .035, y + cardHeight * .29,
        z + .00012, size * .018, muted, 'center', textWidth * .24);
      label(title, textX, y, z + .00012, size * .03, ink, 'left', textWidth);
      label(detail, textX, y - cardHeight * .28, z + .00012, size * .023, muted, 'left', textWidth);
    }
    notification(topY, 'MESSAGES', 'Alex', 'See you at the coffee shop.', 'now', '#658b83', 'message');
    notification(topY - cardHeight - size * .022, 'CALENDAR', 'A little time outside',
      'Afternoon walk · 10:00', '12m', '#a86b72', 'calendar');

    // Familiar bottom shortcuts, represented as part of the static UI diorama.
    const shortcutY = -h * .398;
    const shortcutX = Math.min(w * .34, size * .65);
    const shortcutRadius = size * .036;
    for (const x of [-shortcutX, shortcutX]) {
      add(new THREE.CircleGeometry(shortcutRadius, 40), glow('#454359'), x, shortcutY, -.0002);
    }
    rounded(-shortcutX, shortcutY - size * .005, 0, size * .012, size * .028, size * .004, ink);
    rounded(-shortcutX, shortcutY + size * .012, 0, size * .026, size * .011, size * .003, ink);
    rounded(shortcutX, shortcutY, 0, size * .042, size * .029, size * .006, ink);
    rounded(shortcutX - size * .008, shortcutY + size * .017, 0, size * .016, size * .008, size * .002, ink);
    ring(shortcutX, shortcutY, .00007, size * .009, size * .0025, cardMaterial);
    label('Do Not Disturb', 0, shortcutY, 0, size * .024, muted, 'center', shortcutX * 1.45);
    rounded(0, -h * .466, 0, Math.min(w * .32, size * .5), size * .007, size * .0035, ink);
  },
};
