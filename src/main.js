import * as THREE from 'three';
import { screenDimensions, orientationQuaternion, eyeFromOrientation, applyWindowProjection } from './projection.js';
import './style.css';
import { SCENES, buildExtraScene } from './scenes.js';

const $ = (id) => document.getElementById(id);
const host = $('viewport');
const state = { scene: 'light', immersive: false, mode: 'preview', diagonal: 6.3, distance: .3048, current: null, baseline: null, lastSensor: 0, controls: true, manualX: 0, manualY: 0 };
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
  const materials = {
    wall: new THREE.MeshStandardMaterial({ color: '#233c40', roughness: .87, side: THREE.DoubleSide }),
    back: new THREE.MeshStandardMaterial({ color: '#15333a', roughness: .9 }),
    mint: new THREE.MeshStandardMaterial({ color: '#c4efd1', metalness: .35, roughness: .24 }),
    dark: new THREE.MeshStandardMaterial({ color: '#25585c', metalness: .75, roughness: .23 }),
    gold: new THREE.MeshStandardMaterial({ color: '#ecbb7c', metalness: .5, roughness: .3 }),
    glow: new THREE.MeshBasicMaterial({ color: '#baffdd' }),
    plinth: new THREE.MeshStandardMaterial({ color: '#42676a', metalness: .15, roughness: .65 }),
  };
  function box(x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); room.add(mesh); return mesh;
  }
  function lines(points, color, opacity = 1) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
    const result = new THREE.LineSegments(geometry, material); result.userData.ownMaterial = true; room.add(result);
  }
  function rebuild() {
    if (room) {
      const ownedMaterials = new Set();
      room.traverse(obj => { obj.geometry?.dispose(); if (obj.userData.ownMaterial) ownedMaterials.add(obj.material); });
      ownedMaterials.forEach(material => material.dispose());
      scene.remove(room);
    }
    room = new THREE.Group(); scene.add(room);
    const w = width, h = height, depth = .145;
    if (state.scene !== 'light') {
      buildExtraScene(state.scene, room, w, h);
      return;
    }
    box(0,0,-depth-.001,w,h,.002,materials.back);
    box(-w/2-.001,0,-depth/2,.002,h,depth,materials.wall);
    box(w/2+.001,0,-depth/2,.002,h,depth,materials.wall);
    box(0,-h/2-.001,-depth/2,w,.002,depth,materials.wall);
    box(0,h/2+.001,-depth/2,w,.002,depth,materials.wall);
    const grid = [], step = .012;
    for(let x=-w/2; x<=w/2; x+=step){
      grid.push([x,-h/2,-depth+.0001],[x,h/2,-depth+.0001]);
      grid.push([x,-h/2+.0001,0],[x,-h/2+.0001,-depth]);
      grid.push([x,h/2-.0001,0],[x,h/2-.0001,-depth]);
    }
    for(let y=-h/2; y<=h/2; y+=step){
      grid.push([-w/2,y,-depth+.0001],[w/2,y,-depth+.0001]);
      grid.push([-w/2+.0001,y,0],[-w/2+.0001,y,-depth]);
      grid.push([w/2-.0001,y,0],[w/2-.0001,y,-depth]);
    }
    for(let z=0; z>=-depth; z-=step){
      grid.push([-w/2+.0001,-h/2,z],[-w/2+.0001,h/2,z],[w/2-.0001,-h/2,z],[w/2-.0001,h/2,z]);
      grid.push([-w/2,-h/2+.0001,z],[w/2,-h/2+.0001,z],[-w/2,h/2-.0001,z],[w/2,h/2-.0001,z]);
    }
    lines(grid, '#6ca3a5', .26);
    // Two luminous rails carry the eye from the glass to the back wall.
    box(-w/2+.001,-h/2+.002,-depth/2,.0008,.0008,depth,materials.glow);
    box(w/2-.001,h/2-.002,-depth/2,.0008,.0008,depth,materials.glow);
    const size = Math.min(w, h);
    const pedestalHeight = h*.16;
    box(0,-h/2+pedestalHeight/2,-.073,size*.47,pedestalHeight,size*.43,materials.plinth);
    box(0,-h/2+pedestalHeight+.0005,-.073,size*.48,.001,size*.44,materials.glow);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(size*.17,48,32), materials.mint);
    orb.position.set(size*.06,-h*.05,-.063);room.add(orb);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(size*.29,size*.012,12,96), materials.mint);
    ring.position.set(-size*.03,h*.08,-.084);ring.rotation.set(.45,-.5,-.3);room.add(ring);
    const satellite = new THREE.Mesh(new THREE.IcosahedronGeometry(size*.075,0),materials.gold);
    satellite.position.set(-size*.26,h*.24,-.04);satellite.rotation.set(.3,.5,.2);room.add(satellite);
    const cube = box(size*.28,-h*.25,-.035,size*.13,size*.13,size*.13,materials.dark);
    cube.rotation.set(.35,.6,.15);
    // A thin frame lives exactly on the physical screen plane.
    lines([[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[w/2,h/2,0],[-w/2,h/2,0],[-w/2,h/2,0],[-w/2,-h/2,0]],'#9bccc1',.7);
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
  $('scene-select').addEventListener('change', () => {
    state.scene = $('scene-select').value;
    const selected = SCENES.find(item => item.id === state.scene);
    $('scene-description').textContent = selected.description;
    $('preview-name').textContent = selected.name.toUpperCase();
    host.setAttribute('aria-label', selected.name + ': ' + selected.description);
    rebuild();
  });
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
