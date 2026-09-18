import * as THREE from 'three';

// Helpers handed to every scene's build(). Physical meters: negative z is inside
// the phone, positive z faces the viewer, z=0 is the glass. Everything added
// through these helpers is owned by the scene and disposed on scene changes.
export function createKit(room, w, h) {
  const size = Math.min(w, h);
  const material = (color, metalness = .15, roughness = .45) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const glow = color => new THREE.MeshBasicMaterial({ color });
  const add = (geometry, mat, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z); mesh.userData.ownMaterial = true; room.add(mesh); return mesh;
  };
  const box = (x,y,z,a,b,c,mat) => add(new THREE.BoxGeometry(a,b,c),mat,x,y,z);
  const sphere = (x,y,z,r,mat) => add(new THREE.SphereGeometry(r,32,24),mat,x,y,z);
  const ring = (x,y,z,r,t,mat) => add(new THREE.TorusGeometry(r,t,12,80),mat,x,y,z);
  // Line segments from pairs of [x,y,z] points.
  const lines = (points, color, opacity = 1) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
    const result = new THREE.LineSegments(geometry, mat); result.userData.ownMaterial = true; room.add(result); return result;
  };
  // A closed box behind the glass: back wall and four side walls.
  const chamber = (depth, color) => {
    const wall = material(color, .2, .75);
    // Back surface and walls never extend beyond the specified physical depth.
    box(0,0,-depth+.00025,w,h,.0005,wall);
    box(-w/2-.00025,0,-depth/2,.0005,h,depth,wall);
    box(w/2+.00025,0,-depth/2,.0005,h,depth,wall);
    box(0,-h/2-.00025,-depth/2,w,.0005,depth,wall);
    box(0,h/2+.00025,-depth/2,w,.0005,depth,wall);
  };
  // Thin glowing outline just behind the glass edges.
  const screenFrame = (color = '#92c8bd') => {
    const frame = glow(color);
    box(-w/2,0,-.0002,.0004,h,.0004,frame);
    box(w/2,0,-.0002,.0004,h,.0004,frame);
    box(0,-h/2,-.0002,w,.0004,.0004,frame);
    box(0,h/2,-.0002,w,.0004,.0004,frame);
  };
  return { THREE, room, w, h, size, material, glow, add, box, sphere, ring, lines, chamber, screenFrame };
}
