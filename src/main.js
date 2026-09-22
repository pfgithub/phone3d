import * as THREE from 'three';
import { screenDimensions, orientationQuaternion, eyeFromOrientation, applyWindowProjection } from './projection.js';
import './style.css';
import { SCENES, SECTIONS, buildScene } from './scenes/index.js';
import { PIXEL_9A, eyeFromIrises, OneEuroVector, createFaceTracker } from './facetrack.js';

const $ = (id) => document.getElementById(id);
const MOTION_GUIDE = 'Hold the phone straight on, 1 foot from your eyes.<br><strong>Tap calibrate, then gently tilt around its center.</strong>';
const host = $('viewport');
// Everything the settings dialog can change, and what "Reset to defaults" restores.
const DEFAULT_SETTINGS = { diagonal: 6.3, distance: .3048, ...PIXEL_9A };
const SETTINGS_KEY = 'parallax.settings';
const state = { scene: SCENES[0].id, immersive: false, mode: 'preview', current: null, baseline: null, lastSensor: 0, controls: true, manualX: 0, manualY: 0, ...DEFAULT_SETTINGS, ...loadSettings(), face: null, lastFace: 0, faceEye: null };

// Stored settings are trusted only to be the right shape: any finite number is allowed.
function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    const settings = {};
    for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS)) {
      const value = stored?.[key];
      if (typeof fallback === 'number' ? Number.isFinite(value) : typeof value === 'string') settings[key] = value;
    }
    return settings;
  } catch {
    return {};
  }
}
function saveSettings() {
  const settings = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) settings[key] = state[key];
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}
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

function configure(target) {
  target.outputColorSpace = THREE.SRGBColorSpace;
  target.toneMapping = THREE.ACESFilmicToneMapping;
  target.toneMappingExposure = 1.15;
}
// Shared background and lighting for the live view and gallery thumbnails.
function createStage() {
  const stage = new THREE.Scene();
  stage.background = new THREE.Color('#081a20');
  stage.add(new THREE.HemisphereLight(0xb8fff1, 0x142124, 2.1));
  const light = new THREE.PointLight(0xa9ffe9, .065, 2, 1);
  light.position.set(-.025, .05, .02);
  stage.add(light);
  const fill = new THREE.PointLight(0x63a8ff, .025, 1, 1);
  fill.position.set(.025, -.03, -.08);
  stage.add(fill);
  return stage;
}
function disposeRoom(room) {
  const ownedMaterials = new Set();
  room.traverse(obj => { obj.geometry?.dispose(); if (obj.userData.ownMaterial) ownedMaterials.add(obj.material); });
  ownedMaterials.forEach(material => material.dispose());
  room.removeFromParent();
}

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  configure(renderer);
  host.appendChild(renderer.domElement);
  const scene = createStage();
  const camera = new THREE.PerspectiveCamera();
  let room, live = null, width, height, pointer = null;
  const eye = new THREE.Vector3(0, 0, state.distance);
  function rebuild() {
    if (room) disposeRoom(room);
    room = new THREE.Group(); scene.add(room);
    live = buildScene(state.scene, room, width, height);
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
  // Scene gravity is independent of the calibrated eye and tracking mode.
  const deviceGravity = new THREE.Vector3(), sceneGravity = new THREE.Vector3();
  let lastMotion = -Infinity;
  window.addEventListener('devicemotion', e => {
    const measured = e.accelerationIncludingGravity;
    if (!measured || ![measured.x, measured.y, measured.z].every(Number.isFinite)) return;
    const linear = e.acceleration;
    const hasLinear = linear && [linear.x, linear.y, linear.z].every(Number.isFinite);
    // The accelerometer reports support acceleration: negate it for downhill gravity.
    deviceGravity.set(-measured.x, -measured.y, -measured.z);
    if (hasLinear) deviceGravity.add(new THREE.Vector3(linear.x, linear.y, linear.z));
    lastMotion = performance.now();
  });
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
    if (state.mode !== 'face') message('Hold straight on to calibrate the new screen orientation.');
    resize();
  });
  function message(text, clearAfter = 4500) {
    clearTimeout(sensorTimer); $('live-message').textContent = text;
    if (clearAfter) sensorTimer = setTimeout(() => { $('live-message').textContent = ''; }, clearAfter);
  }
  function setControls(visible) {
    state.controls = visible;
    document.querySelectorAll('.experience-top,.experience-bottom,.guidance,.scene-control,.live-message').forEach(el => { el.hidden = !visible; });
    $('restore-controls').hidden = visible;
  }
  // Front camera face tracking: the eye is measured relative to the screen.
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true;
  const faceFilter = new OneEuroVector();
  let faceSession = 0, lastVideoTime = -1;
  async function startFace() {
    const session = ++faceSession;
    state.mode = 'face'; state.faceEye = null; faceFilter.reset();
    $('calibrate').hidden = true;
    $('guidance').innerHTML = 'Keep your face in view of the front camera.<br><strong>Close your left eye, then move the phone freely.</strong>';
    message('Starting the front camera…', 0);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error(isSecureContext ? 'Camera unavailable.' : 'Face tracking needs HTTPS.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      if (session !== faceSession) { stream.getTracks().forEach(t => t.stop()); return; }
      video.srcObject = stream; await video.play();
      message('Loading the face tracker…', 0);
      const tracker = await createFaceTracker();
      if (session !== faceSession) { tracker.close(); return; }
      state.face = tracker; lastVideoTime = -1;
      message('Face tracking on. Move the phone around freely.');
    } catch (err) {
      if (session !== faceSession) return;
      stopFace(); state.mode = 'manual';
      message((err?.name === 'NotAllowedError' ? 'Camera access was denied.' : err?.message || 'Face tracking failed.') + ' Drag to explore this preview.', 0);
    }
  }
  function stopFace() {
    faceSession++;
    state.face?.close(); state.face = null;
    video.srcObject?.getTracks().forEach(t => t.stop()); video.srcObject = null;
    $('calibrate').hidden = false;
  }
  function trackFace(time) {
    if (!state.face || video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const irises = state.face.detect(video, time);
    if (!irises) return;
    state.lastFace = time;
    const measured = eyeFromIrises(irises[0], irises[1], {
      width, height, videoWidth: video.videoWidth, videoHeight: video.videoHeight,
      screenAngle: screen.orientation?.angle ?? 0, cameraFov: state.cameraFov, cameraFromTop: state.cameraFromTop, ipd: state.ipd, eye: state.eye,
    });
    state.faceEye = faceFilter.filter(measured, time / 1000);
  }
  async function enter(preview = false) {
    const face = preview === 'face';
    if (face) preview = false;
    stopFace();
    $('guidance').innerHTML = MOTION_GUIDE;
    state.immersive = true; state.mode = preview ? 'manual' : 'sensor';
    state.baseline = null; state.manualX = 0; state.manualY = 0;
    $('landing').hidden = true; $('experience').hidden = false;
    document.body.classList.add('immersive');setControls(true);resize();
    // Invoke activation-gated APIs directly in the click handler, before awaits.
    let permission;
    if (face) startFace();
    else if (!preview && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      permission = DeviceOrientationEvent.requestPermission();
    }
    // Physics scenes need the accelerometer even when the eye uses touch or camera.
    let motionPermission;
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        motionPermission = DeviceMotionEvent.requestPermission();
      }
    } catch { /* Unavailable sensors leave scene physics inactive. */ }
    const fullscreen = document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    const results = await Promise.allSettled([fullscreen,permission,motionPermission]);
    if (preview) {
      $('guidance').innerHTML = 'Drag anywhere in the room to explore the perspective.<br><strong>Open on your phone for the motion-tracked experience.</strong>';
    } else if (face) {
      // startFace reports its own progress.
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
    updateFullscreenButton();
    if (results[0].status === 'rejected' || !document.fullscreenElement) {
      message('Fullscreen unavailable. Perspective is a preview until fullscreen is enabled.', 6500);
    }
  }
  function calibrate() {
    if (state.mode === 'face') return;
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
    stopFace();
    state.immersive=false;state.mode='preview';state.manualX=0;state.manualY=0;
    $('landing').hidden=false;$('experience').hidden=true;
    document.body.classList.remove('immersive');
    if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    resize();
  }
  $('enter').addEventListener('click',()=>enter());
  $('demo').addEventListener('click',()=>enter(true));
  $('enter-face').addEventListener('click',()=>enter('face'));
  $('exit').addEventListener('click',exit);
  // Offer a way back into fullscreen whenever the experience isn't in it.
  const updateFullscreenButton = () => { $('fullscreen').hidden = !document.fullscreenEnabled || !!document.fullscreenElement; };
  $('fullscreen').addEventListener('click',()=>{
    document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).then(()=>message(''),()=>message('Fullscreen unavailable on this browser.',4000));
  });
  document.addEventListener('fullscreenchange',()=>{ updateFullscreenButton(); if(!document.fullscreenElement && state.immersive) message('Fullscreen exited. Tap Fullscreen to restore calibrated physical scale.',0); resize(); });
  $('calibrate').addEventListener('click',calibrate);
  $('hide-controls').addEventListener('click',()=>setControls(false));
  $('restore-controls').addEventListener('click',()=>setControls(true));
  const mm = v => Number((v * 1000).toFixed(1));
  // Fields accept any number; an unparseable one keeps the value it had.
  const num = (id, fallback, scale = 1) => { const raw = $(id).value.trim(); const v = raw === '' ? NaN : Number(raw); return Number.isFinite(v) ? v * scale : fallback; };
  const fillSettings = () => { $('diagonal').value=state.diagonal; $('distance').value=Number((state.distance*100).toFixed(2));
    $('eye').value=state.eye; $('ipd').value=mm(state.ipd); $('camera-fov').value=state.cameraFov; $('camera-top').value=mm(state.cameraFromTop); };
  $('settings-open').addEventListener('click',()=>{ fillSettings();
    $('tracking-mode').value=state.mode==='face'?'face':'motion'; $('settings').returnValue=''; $('settings').showModal(); });
  $('settings').addEventListener('close',()=>{
    const reset=$('settings').returnValue==='reset';
    if(reset || $('settings').returnValue==='apply') {
      if(reset) { Object.assign(state,DEFAULT_SETTINGS); try { localStorage.removeItem(SETTINGS_KEY); } catch {} }
      else {
        state.diagonal=num('diagonal',state.diagonal);state.distance=num('distance',state.distance,.01);
        state.eye=$('eye').value;state.ipd=num('ipd',state.ipd,.001);state.cameraFov=num('camera-fov',state.cameraFov);state.cameraFromTop=num('camera-top',state.cameraFromTop,.001);
        saveSettings();
      }
      faceFilter.reset();resize();
      const wantFace=reset ? state.mode==='face' : $('tracking-mode').value==='face';
      if(wantFace && state.mode!=='face') startFace();
      else if(!wantFace && state.mode==='face') { stopFace(); state.mode='sensor'; state.baseline=null; $('guidance').innerHTML=MOTION_GUIDE; }
      calibrate();
      if(reset) message('Settings reset to defaults.',3000);
    }
  });
  $('about-open').addEventListener('click',()=>$('about').showModal());
  $('about-close').addEventListener('click',()=>$('about').close());
  const dialogOpen = () => $('settings').open || $('gallery').open || $('about').open;
  document.addEventListener('keydown',e=>{
    if(!state.immersive || dialogOpen() || e.altKey || e.ctrlKey || e.metaKey) return;
    if(e.key==='Escape') exit();
    else if(e.key==='ArrowLeft') stepScene(-1);
    else if(e.key==='ArrowRight') stepScene(1);
    else if(e.key==='h' || e.key==='H') setControls(!state.controls);
  });
  // Interactive scenes get first claim on a pointer, as a ray and its hit on the glass.
  const raycaster = new THREE.Raycaster(), glass = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  function scenePointer(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, 1 - (e.clientY - rect.top) / rect.height * 2), camera);
    const point = raycaster.ray.intersectPlane(glass, new THREE.Vector3());
    return { ray: raycaster, x: point?.x ?? NaN, y: point?.y ?? NaN };
  }
  // A tap (not a drag) on the room toggles the controls while viewing.
  host.addEventListener('pointerdown',e=>{
    const claimed=!!live?.pointerDown?.(scenePointer(e));
    pointer={x:e.clientX,y:e.clientY,time:performance.now(),initialX:state.manualX,initialY:state.manualY,drag:!claimed&&state.mode==='manual',scene:claimed};
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove',e=>{
    if(pointer?.scene){live?.pointerMove?.(scenePointer(e));return;}
    if(!pointer?.drag)return;
    state.manualX=THREE.MathUtils.clamp(pointer.initialX+(e.clientX-pointer.x)/host.clientWidth,-.85,.85);
    state.manualY=THREE.MathUtils.clamp(pointer.initialY+(e.clientY-pointer.y)/host.clientHeight,-.85,.85);
  });
  host.addEventListener('pointerup',e=>{
    if(pointer?.scene){live?.pointerUp?.(scenePointer(e));pointer=null;return;}
    const tap=pointer && Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)<10 && performance.now()-pointer.time<400;
    if(tap && state.immersive) setControls(!state.controls);
    pointer=null;
  });
  host.addEventListener('pointercancel',()=>{if(pointer?.scene)live?.pointerUp?.(null);pointer=null;});

  // Scene gallery and previous/next navigation.
  const sectionStarts = new Map();
  SECTIONS.reduce((start, section) => {
    if (section.scenes.length) sectionStarts.set(start, section.title);
    return start + section.scenes.length;
  }, 0);
  const cards = SCENES.map((item, i) => {
    if (sectionStarts.has(i)) {
      const heading = document.createElement('h3');
      heading.className = 'gallery-section';
      heading.textContent = sectionStarts.get(i);
      $('gallery-grid').appendChild(heading);
    }
    const card = document.createElement('button');
    card.className = 'gallery-card'; card.dataset.id = item.id; card.title = item.description;
    card.innerHTML = '<span class="thumb"><img alt=""></span><small></small><strong></strong>';
    card.querySelector('small').textContent = String(i + 1).padStart(2, '0');
    card.querySelector('strong').textContent = item.name;
    card.addEventListener('click', () => { setScene(item.id); $('gallery').close(); });
    $('gallery-grid').appendChild(card);
    return card;
  });
  function showSceneInfo() {
    const index = SCENES.findIndex(item => item.id === state.scene), selected = SCENES[index];
    $('scene-name').textContent = selected.name;
    $('scene-open').setAttribute('aria-label', `Scene: ${selected.name}. Browse all scenes`);
    $('scene-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')}`;
    $('scene-description').textContent = selected.description;
    $('preview-name').textContent = selected.name.toUpperCase();
    host.setAttribute('aria-label', selected.name + ': ' + selected.description);
    cards.forEach(card => card.setAttribute('aria-current', String(card.dataset.id === state.scene)));
  }
  function setScene(id) {
    if (id === state.scene) return;
    state.scene = id;
    showSceneInfo();
    rebuild();
  }
  function stepScene(delta) {
    const index = SCENES.findIndex(item => item.id === state.scene);
    setScene(SCENES[(index + delta + SCENES.length) % SCENES.length].id);
  }
  $('scene-prev').addEventListener('click', () => stepScene(-1));
  $('scene-next').addEventListener('click', () => stepScene(1));
  $('scene-open').addEventListener('click', () => {
    $('gallery').showModal();
    const current = cards.find(card => card.dataset.id === state.scene);
    current.focus(); current.scrollIntoView({ block: 'center' });
    renderThumbnails();
  });
  $('gallery-close').addEventListener('click', () => $('gallery').close());
  // Thumbnails are rendered once, one per frame, with a small separate renderer.
  let thumbsStarted = false;
  function renderThumbnails() {
    if (thumbsStarted) return;
    thumbsStarted = true;
    let thumbRenderer;
    try { thumbRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); } catch { return; }
    configure(thumbRenderer);
    thumbRenderer.setSize(240, 320, false);
    const stage = createStage(), thumbCamera = new THREE.PerspectiveCamera();
    const h = .146, w = h * 3 / 4;
    applyWindowProjection(thumbCamera, new THREE.Vector3(.03, .04, .3), w, h);
    let i = 0;
    (function next() {
      const group = new THREE.Group(); stage.add(group);
      buildScene(SCENES[i].id, group, w, h);
      thumbRenderer.render(stage, thumbCamera);
      cards[i].querySelector('img').src = thumbRenderer.domElement.toDataURL('image/jpeg', .85);
      disposeRoom(group);
      if (++i < SCENES.length) requestAnimationFrame(next);
      else { thumbRenderer.dispose(); thumbRenderer.forceContextLoss(); }
    })();
  }
  showSceneInfo();
  resize();
  let lastTime=0, lastStatus='';
  function frame(time) {
    const dt=Math.min((time-lastTime)/1000,.1);lastTime=time;
    let target;
    if(state.mode==='face') trackFace(time);
    if(state.mode==='face') {
      target=state.faceEye??new THREE.Vector3(0,0,state.distance);
    } else if(state.mode==='sensor' && state.baseline && state.current) {
      target=eyeFromOrientation(state.current,state.baseline,state.distance);
    } else {
      target=new THREE.Vector3(0,0,state.distance).applyEuler(new THREE.Euler(state.manualY,state.manualX,0,'YXZ'));
    }
    const valid=state.mode==='face'?target.z>.02:target.z>state.distance*.15;
    // Beyond ~81 degrees the viewer is at/behind the display; no front-facing
    // perspective exists. Preserve the last valid view and ask them to return.
    // Face tracking is already filtered; only smooth the steps between camera frames.
    if(valid) eye.lerp(target,1-Math.exp(-dt*(state.mode==='face'?60:35)));
    applyWindowProjection(camera,eye,width,height);
    // Device motion uses native device axes; rotate into the current screen axes.
    const angle = THREE.MathUtils.degToRad(screen.orientation?.angle ?? window.orientation ?? 0);
    const c = Math.cos(angle), s = Math.sin(angle);
    sceneGravity.set(c * deviceGravity.x - s * deviceGravity.y,
      s * deviceGravity.x + c * deviceGravity.y, deviceGravity.z);
    live?.update?.(dt,time/1000,time-lastMotion<1500 && !document.hidden ? sceneGravity : null);
    renderer.render(scene,camera);
    const fresh=time-state.lastSensor<2000;
    const status=!valid?'FACE THE SCREEN':state.mode==='face'?(!state.face?'STARTING CAMERA':time-state.lastFace<500?`FACE TRACKING · ${Math.round(eye.length()*100)} CM`:'LOOKING FOR YOUR FACE'):state.mode==='sensor'?(state.baseline?(fresh?'MOTION TRACKING':'SENSOR PAUSED'):'WAITING FOR SENSOR'):'DRAG TO EXPLORE';
    if(status!==lastStatus){$('tracking').innerHTML='<i></i>'+status;lastStatus=status;}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Installable app: the service worker caches the app for offline use. Skipped in
// dev so Vite's hot reload never serves stale files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
