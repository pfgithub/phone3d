import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Group } from 'three';
import { SCENES, buildScene } from '../src/scenes/index.js';
import { screenDimensions } from '../src/projection.js';

for(const diagonal of [4,6.3,10]) for(const landscape of [false,true]) {
  test(`shallow scene stays within 7.5 mm at ${diagonal} inches, landscape=${landscape}`, () => {
    const {width,height}=screenDimensions(diagonal,landscape);
    const group=new Group();buildScene('pocket',group,width,height);
    const bounds=new Box3().setFromObject(group);
    assert.ok(bounds.min.z >= -.007500001);
    assert.ok(bounds.max.z <= .000000001);
  });
}
test('crystal crosses the glass and reaches 32 mm toward the viewer', () => {
  const group=new Group();buildScene('crystal',group,.066,.146);
  const bounds=new Box3().setFromObject(group);
  assert.ok(bounds.min.z<0);
  assert.ok(Math.abs(bounds.max.z-.032)<.000001);
});

for(const landscape of [false,true]) {
  test(`relief sits at glass with raised and recessed features, landscape=${landscape}`, () => {
    const {width,height}=screenDimensions(6.3,landscape);
    const group=new Group();buildScene('relief',group,width,height);
    const bounds=new Box3().setFromObject(group);
    assert.ok(Math.abs(bounds.min.z+.005)<1e-8);
    assert.ok(Math.abs(bounds.max.z-.004)<1e-8);
    const panel=group.children.find(mesh=>mesh.geometry.type==='ShapeGeometry');
    assert.equal(panel.position.z,0);
    assert.equal(panel.geometry.parameters.shapes.holes.length,2);
  });
  test(`terrain remains within 8 mm behind glass, landscape=${landscape}`, () => {
    const {width,height}=screenDimensions(6.3,landscape);
    const group=new Group();buildScene('terrain',group,width,height);
    const bounds=new Box3().setFromObject(group);
    assert.ok(bounds.min.z>=-.008);
    assert.ok(bounds.max.z<=1e-8);
  });
}

// Runs automatically for every scene registered in src/scenes/list.js.
test('scene ids are unique and every scene has a name and description', () => {
  assert.equal(new Set(SCENES.map(s=>s.id)).size,SCENES.length);
  for(const s of SCENES) {
    assert.match(s.id,/^[a-z0-9-]+$/);
    assert.ok(s.name && s.description && typeof s.build==='function',s.id);
  }
});
for(const {id} of SCENES) for(const landscape of [false,true]) {
  test(`${id} builds finite geometry, landscape=${landscape}`, () => {
    const {width,height}=screenDimensions(6.3,landscape);
    const group=new Group();buildScene(id,group,width,height);
    assert.ok(group.children.length>0);
    const bounds=new Box3().setFromObject(group);
    for(const v of [bounds.min,bounds.max]) assert.ok([v.x,v.y,v.z].every(Number.isFinite),id);
  });
}
