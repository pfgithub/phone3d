import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { screenDimensions, orientationQuaternion, eyeFromOrientation, applyWindowProjection } from '../src/projection.js';
const close=(actual, expected)=>assert.ok(Math.abs(actual-expected)<1e-9, `${actual} != ${expected}`);
test('physical dimensions match 6.3-inch diagonal and 20:9 aspect',()=>{
  const {width,height}=screenDimensions();close(Math.hypot(width,height),6.3*.0254);close(height/width,20/9);
  const landscape=screenDimensions(6.3,true);close(landscape.width,height);close(landscape.height,width);
});
test('calibration yields centered eye for arbitrary initial phone orientation',()=>{
  for(const angles of [[20,90,0],[355,45,-30],[90,-50,75]]){
    const q=orientationQuaternion(...angles);const eye=eyeFromOrientation(q,q,.3048);
    close(eye.x,0);close(eye.y,0);close(eye.z,.3048);
  }
});
test('phone yaw moves virtual eye in the opposite direction without changing distance',()=>{
  const eye=eyeFromOrientation(orientationQuaternion(0,0,30),orientationQuaternion(0,0,0),.3048);
  close(eye.x,-.3048*.5);close(eye.z,.3048*Math.cos(Math.PI/6));close(eye.length(),.3048);
});
test('screen roll and landscape axes preserve fixed world eye',()=>{
  const baseline=orientationQuaternion(34,70,-12,0);
  const current=orientationQuaternion(60,85,22,90);
  const eye=eyeFromOrientation(current,baseline,.3048);
  const world=eye.clone().applyQuaternion(current);
  const expected=new Vector3(0,0,.3048).applyQuaternion(baseline);
  close(world.distanceTo(expected),0);
});
test('screen plane corners remain at viewport corners for asymmetric eye positions',()=>{
  const camera=new PerspectiveCamera();const {width:w,height:h}=screenDimensions();
  for(const eye of [new Vector3(0,0,.3048),new Vector3(.13,-.1,.25),new Vector3(-.21,.12,.1)]){
    applyWindowProjection(camera,eye,w,h);
    for(const x of [-1,1])for(const y of [-1,1]){
      const projected=new Vector3(x*w/2,y*h/2,0).project(camera);
      close(projected.x,x);close(projected.y,y);
    }
  }
});
test('objects behind the screen exhibit parallax with eye motion',()=>{
  const camera=new PerspectiveCamera();const {width,height}=screenDimensions();
  applyWindowProjection(camera,new Vector3(.1,0,.3),width,height);
  assert.ok(new Vector3(0,0,-.1).project(camera).x>0);
  close(new Vector3(0,0,0).project(camera).x,0);
});
