import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { screenDimensions } from '../src/projection.js';
import { PIXEL_9A, cameraHalfTangents, cameraPosition, eyeFromIrises } from '../src/facetrack.js';
const near=(a,b,tol=1e-5)=>assert.ok(a.distanceTo(b)<tol,`${a.toArray()} != ${b.toArray()}`);

// Forward model: project a 3D point (screen coords) into the unmirrored front camera image.
function project(p,camera,tan){
  const d=p.clone().sub(camera);
  return {x:.5-d.x/d.z/tan.x/2,y:.5-d.y/d.z/tan.y/2};
}
// Eyes IPD apart, baseline perpendicular to the gaze toward the screen center, head rolled by `roll`.
function eyes(mid,ipd,roll=0){
  const gaze=mid.clone().normalize();
  const side=new Vector3(0,1,0).cross(gaze).normalize().applyAxisAngle(gaze,roll);
  return [mid.clone().addScaledVector(side,-ipd/2),mid.clone().addScaledVector(side,ipd/2)];
}

test('Pixel 9a 4:3 stream has 96.1° diagonal field of view',()=>{
  const t=cameraHalfTangents(96.1,480,640);
  assert.ok(Math.abs(Math.atan(Math.hypot(t.x,t.y))*2*180/Math.PI-96.1)<1e-9);
  assert.ok(t.y>t.x);
  const wide=cameraHalfTangents(96.1,1280,720);assert.ok(Math.abs(wide.x/wide.y-16/9)<1e-9);
});

test('camera follows the top edge through screen rotations',()=>{
  const {width,height}=screenDimensions(6.3,false);const c=height/2-.0045;
  near(cameraPosition(width,height,.0045,0),new Vector3(0,c,0));
  near(cameraPosition(height,width,.0045,90),new Vector3(-c,0,0));
  near(cameraPosition(height,width,.0045,270),new Vector3(c,0,0));
});

test('recovers the right eye from iris positions wherever the phone is',()=>{
  for(const [landscape,angle] of [[false,0],[true,90],[true,270]]){
    const {width,height}=screenDimensions(6.3,landscape);
    const vw=landscape?640:480,vh=landscape?480:640;
    const tan=cameraHalfTangents(PIXEL_9A.cameraFov,vw,vh);
    const camera=cameraPosition(width,height,PIXEL_9A.cameraFromTop,angle);
    for(const mid of [new Vector3(0,0,.3),new Vector3(.08,-.05,.25),new Vector3(-.12,.1,.4),new Vector3(.02,.03,.12)]){
      for(const roll of [0,.4]){
        const [left,right]=eyes(mid,PIXEL_9A.ipd,roll);
        // Iris order from the landmarker must not matter.
        const irises=[project(right,camera,tan),project(left,camera,tan)];
        const options={width,height,videoWidth:vw,videoHeight:vh,screenAngle:angle,...PIXEL_9A};
        near(eyeFromIrises(...irises,options),right);
        near(eyeFromIrises(...irises.reverse(),{...options,eye:'left'}),left);
        near(eyeFromIrises(...irises,{...options,eye:'center'}),mid);
      }
    }
  }
});
