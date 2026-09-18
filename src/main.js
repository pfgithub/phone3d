import * as THREE from 'three';
import { screenDimensions, orientationQuaternion, eyeFromOrientation, applyWindowProjection } from './projection.js';
import './style.css';
import { SCENES, buildScene } from './scenes/index.js';

const $ = (id) => document.getElementById(id);
const host = $('viewport');
const state = { scene: SCENES[0].id, immersive: false, mode: 'preview', diagonal: 6.3, distance: .3048, current: null, baseline: null, lastSensor: 0, controls: true, manualX: 0, manualY: 0 };
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch {
  document.body.classList.add('failed');
  $('setup-message').textContent = 'This experiment needs WebGL. Try Chrome with graphics acceleration enabled.';
  $('enter').disabled = true;
  $('demo').disabled = true;
}
if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#081a20');
  const camera = new THREE.PerspectiveCamera();
  scene.add(new THREE.HemisphereLight(0xb8fff1, 0x142124, 2.1));
  const light = new THREE.PointLight(0xa9ffe9, .065, 2, 1);
  light.position.set(-.025, .05, .02);
  scene.add(light);
  const fill = new THREE.PointLight(0x63a8ff, .025, 1, 1);
  fill.position.set(.025, -.03, -.08);
  scene.add(fill);
  let room, width, height, pointer = null;
  const eye = new THREE.Vector3(0, 0, state.distance);
  function rebuild() {
    if (room) {
      const ownedMaterials = new Set();
      room.traverse(obj => { obj.geometry?.dispose(); if (obj.userData.ownMaterial) ownedMaterials.add(obj.material); });
      ownedMaterials.forEach(material => material.dispose());
      scene.remove(room);
    }
    room = new THREE.Group(); scene.add(room);
    buildScene(state.scene, room, width, height);
  }
  function resize() {
    if (!state.immersive) {
      const region = document.querySelector('.preview-caption').getBoundingClientRect();
      const mobile = innerWidth <= 760;
      host.style.top = `${region.top + scrollY + (mobile ? 28 : -20)}px`;
      host.style.left = `${region.left}px`;
      host.style.width = `${region.width}px`;
      host.style.height = `${region.height - (mobile ? 82 : 45)}px`;
    } else {
      host.removeAttribute('style');
    }
    const rect = host.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    const physical = screenDimensions(state.diagonal, innerWidth > innerHeight);
    // Outside immersive mode the room is an illustrative viewport, not calibrated.
    height = state.immersive ? physical.height : .146;
    width = state.immersive ? physical.width : height * rect.width / rect.height;
    rebuild();
  }
  new ResizeObserver(resize).observe(document.querySelector('.preview-caption'));
  window.addEventListener('resize', resize);
  document.fonts.ready.then(resize);
  let sensorTimer;
  function onOrientation(e) {
    if (![e.alpha, e.beta, e.gamma].every(Number.isFinite)) return;
    state.current = orientationQuaternion(e.alpha,e.beta,e.gamma,screen.orientation?.angle ?? 0);
    state.lastSensor = performance.now();
    if (state.mode === 'sensor' && !state.baseline) {
      state.baseline = state.current.clone();
      eye.set(0,0,state.distance);
      $('guidance').innerHTML = 'Keep your head still and gently tilt the phone.<br><strong>Tap calibrate any time you change position.</strong>';
      message('Starting position calibrated.');
    }
  }
  window.addEventListener('deviceorientation', onOrientation);
  screen.orientation?.addEventListener('change', () => {
    // Wait for a new sensor sample in the changed screen coordinate system.
    state.current = null; state.baseline = null;
    message('Hold straight on to calibrate the new screen orientation.');
    resize();
  });
  function message(text, clearAfter = 4500) {
    clearTimeout(sensorTimer); $('live-message').textContent = text;
    if (clearAfter) sensorTimer = setTimeout(() => { $('live-message').textContent = ''; }, clearAfter);
  }
  function setControls(visible) {
    state.controls = visible;
    document.querySelectorAll('.experience-top,.experience-bottom,.guidance,.scene-control').forEach(el => { el.hidden = !visible; });
    $('restore-controls').hidden = visible;
  }
  async function enter(preview = false) {
    state.immersive = true; state.mode = preview ? 'manual' : 'sensor';
    state.baseline = null; state.manualX = 0; state.manualY = 0;
    $('landing').hidden = true; $('experience').hidden = false;
    document.body.classList.add('immersive');setControls(true);resize();
    // Invoke activation-gated APIs directly in the click handler, before awaits.
    let permission;
    if (!preview && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      permission = DeviceOrientationEvent.requestPermission();
    }
    const fullscreen = document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    const results = await Promise.allSettled([fullscreen,permission]);
    if (preview) {
      $('guidance').innerHTML = 'Drag anywhere in the room to explore the perspective.<br><strong>Open on your phone for the motion-tracked experience.</strong>';
    } else if (!isSecureContext || results[1].status === 'rejected' || (results[1].value && results[1].value !== 'granted')) {
      state.mode = 'manual';
      message(!isSecureContext ? 'Motion sensing needs HTTPS. Drag to explore this preview.' : 'Motion access was denied. Drag to explore this preview.', 0);
    } else {
      message('Hold straight on. Waiting for the orientation sensor…', 0);
      if (state.current && performance.now()-state.lastSensor<1000) calibrate();
      setTimeout(() => {
        if (state.immersive && state.mode === 'sensor' && !state.baseline) {
          state.mode = 'manual';
          message('No orientation data. Check Chrome’s motion sensor permission, or drag to preview.',0);
        }
      }, 3500);
    }
    if (results[0].status === 'rejected' || !document.fullscreenElement) {
      message('Fullscreen unavailable. Perspective is a preview until fullscreen is enabled.', 6500);
    }
  }
  function calibrate() {
    if (state.mode === 'sensor' && state.current && performance.now()-state.lastSensor < 1500) {
      state.baseline = state.current.clone();
      message('Calibrated. Keep your head still and gently tilt.');
    } else if (state.current && performance.now()-state.lastSensor < 1500) {
      state.mode = 'sensor';state.baseline=state.current.clone();message('Motion tracking enabled and calibrated.');
    } else {
      state.manualX=0;state.manualY=0;
      message(state.mode === 'sensor' ? 'Waiting for orientation data…' : 'Preview centered. Drag to explore.');
    }
    eye.set(0,0,state.distance);
  }
  function exit() {
    state.immersive=false;state.mode='preview';state.manualX=0;state.manualY=0;
    $('landing').hidden=false;$('experience').hidden=true;
    document.body.classList.remove('immersive');
    if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    resize();
  }
  $('enter').addEventListener('click',()=>enter());
  $('demo').addEventListener('click',()=>enter(true));
  $('exit').addEventListener('click',exit);
  document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement && state.immersive) message('Fullscreen exited. Reopen the window for calibrated physical scale.',0); resize(); });
  $('calibrate').addEventListener('click',calibrate);
  $('hide-controls').addEventListener('click',()=>setControls(false));
  $('restore-controls').addEventListener('click',()=>setControls(true));
  $('settings-open').addEventListener('click',()=>{ $('diagonal').value=state.diagonal; $('distance').value=Number((state.distance*100).toFixed(2)); $('settings').returnValue=''; $('settings').showModal(); });
  $('settings').addEventListener('close',()=>{
    if($('settings').returnValue==='apply') {
      state.diagonal=Number($('diagonal').value);state.distance=Number($('distance').value)/100;resize();calibrate();
    }
  });
  $('about-open').addEventListener('click',()=>$('about').showModal());
  $('about-close').addEventListener('click',()=>$('about').close());
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && state.immersive && !$('settings').open) exit();});
  host.addEventListener('pointerdown',e=>{
    if(state.mode==='sensor')return;
    pointer={x:e.clientX,y:e.clientY,initialX:state.manualX,initialY:state.manualY};host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove',e=>{
    if(!pointer)return;
    state.manualX=THREE.MathUtils.clamp(pointer.initialX+(e.clientX-pointer.x)/host.clientWidth,-.85,.85);
    state.manualY=THREE.MathUtils.clamp(pointer.initialY+(e.clientY-pointer.y)/host.clientHeight,-.85,.85);
  });
  host.addEventListener('pointerup',()=>{pointer=null;});
  host.addEventListener('pointercancel',()=>{pointer=null;});
  for (const item of SCENES) {
    const option = document.createElement('option');
    option.value = item.id; option.textContent = item.name;
    $('scene-select').appendChild(option);
  }
  function showSceneInfo() {
    const selected = SCENES.find(item => item.id === state.scene);
    $('scene-description').textContent = selected.description;
    $('preview-name').textContent = selected.name.toUpperCase();
    host.setAttribute('aria-label', selected.name + ': ' + selected.description);
  }
  $('scene-select').addEventListener('change', () => {
    state.scene = $('scene-select').value;
    showSceneInfo();
    rebuild();
  });
  showSceneInfo();
  resize();
  let lastTime=0, lastStatus='';
  function frame(time) {
    const dt=Math.min((time-lastTime)/1000,.1);lastTime=time;
    let target;
    if(state.mode==='sensor' && state.baseline && state.current) {
      target=eyeFromOrientation(state.current,state.baseline,state.distance);
    } else {
      target=new THREE.Vector3(0,0,state.distance).applyEuler(new THREE.Euler(state.manualY,state.manualX,0,'YXZ'));
    }
    const valid=target.z>state.distance*.15;
    // Beyond ~81 degrees the viewer is at/behind the display; no front-facing
    // perspective exists. Preserve the last valid view and ask them to return.
    if(valid) eye.lerp(target,1-Math.exp(-dt*35));
    applyWindowProjection(camera,eye,width,height);
    renderer.render(scene,camera);
    const fresh=time-state.lastSensor<2000;
    const status=!valid?'FACE THE SCREEN':state.mode==='sensor'?(state.baseline?(fresh?'MOTION TRACKING':'SENSOR PAUSED'):'WAITING FOR SENSOR'):'DRAG TO EXPLORE';
    if(status!==lastStatus){$('tracking').innerHTML='<i></i>'+status;lastStatus=status;}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
