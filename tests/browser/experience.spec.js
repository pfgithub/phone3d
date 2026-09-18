import { test, expect } from '@playwright/test';

test('desktop renders, drag changes perspective, and settings and controls work', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button',{name:'Explore with touch'}).click();
  await expect(page.locator('#tracking')).toContainText('DRAG TO EXPLORE');
  const before=await page.locator('canvas').screenshot({style:'#experience{visibility:hidden!important}'});
  await page.mouse.move(600,300);await page.mouse.down();await page.mouse.move(800,400,{steps:10});await page.mouse.up();
  await page.waitForTimeout(300);
  expect(Buffer.compare(before,await page.locator('canvas').screenshot({style:'#experience{visibility:hidden!important}'}))).not.toBe(0);
  await page.getByRole('button',{name:'Open display settings'}).click();
  await page.locator('#distance').fill('40');
  await page.getByRole('button',{name:'Apply settings'}).click();
  await expect(page.locator('#settings')).not.toBeVisible();
  await page.getByRole('button',{name:'Hide controls',exact:true}).click();
  await expect(page.locator('#calibrate')).not.toBeVisible();
  await page.getByRole('button',{name:'Show controls'}).click();
  await expect(page.locator('#calibrate')).toBeVisible();
  await page.getByRole('button',{name:'Exit experience'}).click();
  await expect(page.locator('#landing')).toBeVisible();
  expect(errors).toEqual([]);
});

test('simulated phone sensor drives projection and can be recalibrated', async ({page}) => {
  await page.addInitScript(() => { DeviceOrientationEvent.requestPermission = async () => 'granted'; });
  await page.setViewportSize({width:393,height:852});
  await page.goto('/');
  await page.getByRole('button',{name:'Open the window'}).click();
  const sensor=async (alpha,beta,gamma)=>page.evaluate(({alpha,beta,gamma})=>{
    clearInterval(window.mockSensor);
    const emit=()=>window.dispatchEvent(new DeviceOrientationEvent('deviceorientation',{alpha,beta,gamma}));
    emit(); window.mockSensor=setInterval(emit,30);
  },{alpha,beta,gamma});
  await sensor(0,90,0);
  await expect(page.locator('#tracking')).toContainText('MOTION TRACKING');
  await page.waitForTimeout(150);
  const initial=await page.locator('canvas').screenshot({style:'#experience{visibility:hidden!important}'});
  await sensor(20,75,15);await page.waitForTimeout(250);
  expect(Buffer.compare(initial,await page.locator('canvas').screenshot({style:'#experience{visibility:hidden!important}'}))).not.toBe(0);
  await page.getByRole('button',{name:'Calibrate',exact:false}).click();
  await expect(page.locator('#live-message')).toContainText('Calibrated');
  await page.waitForTimeout(150);
  // Calibration returns the same physical view regardless of baseline orientation.
  expect(Buffer.compare(initial,await page.locator('canvas').screenshot({style:'#experience{visibility:hidden!important}'}))).toBe(0);
});

test('missing sensor switches to a usable manual preview', async ({page}) => {
  await page.addInitScript(() => { DeviceOrientationEvent.requestPermission = async () => 'granted'; });
  await page.goto('/');await page.getByRole('button',{name:'Open the window'}).click();
  await expect(page.locator('#tracking')).toContainText('DRAG TO EXPLORE',{timeout:6000});
  await expect(page.locator('#live-message')).toContainText('No orientation data');
});

test('mobile landing fits viewport and explanation is accessible', async ({page}) => {
  await page.setViewportSize({width:360,height:800});await page.goto('/');
  await expect(page.getByRole('heading',{name:'Beyond the glass.'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360);
  await page.getByRole('button',{name:'How it works'}).click();
  await expect(page.locator('#about')).toBeVisible();
  await page.getByRole('button',{name:'Close explanation'}).click();
  await expect(page.locator('#about')).not.toBeVisible();
});

test('denied sensor permission gives a manual fallback', async ({page}) => {
  await page.addInitScript(() => { DeviceOrientationEvent.requestPermission = async () => 'denied'; });
  await page.goto('/'); await page.getByRole('button',{name:'Open the window'}).click();
  await expect(page.locator('#tracking')).toContainText('DRAG TO EXPLORE');
  await expect(page.locator('#live-message')).toContainText('Motion access was denied');
});

test('default distance applies, two decimals work, and invalid edits can be dismissed', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Explore with touch'}).click();
  const open = () => page.getByRole('button',{name:'Open display settings'}).click();
  await open();
  await expect(page.locator('#distance')).toHaveValue('30.48');
  await page.getByRole('button',{name:'Apply settings'}).click();
  await expect(page.locator('#settings')).not.toBeVisible();
  await open();
  await page.locator('#distance').fill('35.67');
  await page.getByRole('button',{name:'Apply settings'}).click();
  await expect(page.locator('#settings')).not.toBeVisible();
  await open();
  await page.locator('#distance').fill('2');
  await page.getByRole('button',{name:'Apply settings'}).click();
  await expect(page.locator('#settings')).toBeVisible();
  await page.getByRole('button',{name:'Close settings'}).click();
  await expect(page.locator('#settings')).not.toBeVisible();
  await open();
  await expect(page.locator('#distance')).toHaveValue('35.67');
});

test('every scene renders and next/previous, gallery, hiding controls and resize work', async ({page}) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:393,height:852});
  await page.goto('/');
  await page.getByRole('button',{name:'Explore with touch'}).click();
  const cards=page.locator('#gallery-grid .gallery-card');
  const ids=await cards.evaluateAll(els=>els.map(el=>el.dataset.id));
  expect(ids.length).toBeGreaterThan(1);
  // Allow for a WebGL screenshot per scene as the catalog grows.
  test.setTimeout(15000 + ids.length * 3000);
  const shot=()=>page.locator('canvas').screenshot({style:'#experience{visibility:hidden!important}'});
  const current=()=>page.locator('#gallery-grid [aria-current=true]').getAttribute('data-id');
  let previous=await shot();
  for(const id of ids.slice(1)) {
    await page.getByRole('button',{name:'Next scene'}).click();
    expect(await current()).toBe(id);
    await page.waitForTimeout(100);
    const next=await shot();
    expect(Buffer.compare(previous,next)).not.toBe(0);
    previous=next;
  }
  const last=ids.at(-1);
  // Next wraps to the first scene and previous wraps back.
  await page.getByRole('button',{name:'Next scene'}).click();
  expect(await current()).toBe(ids[0]);
  await page.getByRole('button',{name:'Previous scene'}).click();
  expect(await current()).toBe(last);
  await page.keyboard.press('ArrowRight');
  expect(await current()).toBe(ids[0]);
  await page.keyboard.press('ArrowLeft');
  expect(await current()).toBe(last);

  // The gallery shows a thumbnail per scene and opens the chosen one.
  await page.getByRole('button',{name:/Browse all scenes/}).click();
  await expect(page.locator('#gallery')).toBeVisible();
  await expect(cards.last().locator('img')).toHaveAttribute('src',/^data:image/,{timeout:30000});
  await cards.nth(2).click();
  await expect(page.locator('#gallery')).not.toBeVisible();
  expect(await current()).toBe(ids[2]);
  await expect(page.locator('#scene-name')).toHaveText(await cards.nth(2).locator('strong').textContent());
  await expect(page.locator('#experience')).toBeVisible();

  const nav=page.getByRole('button',{name:'Next scene'});
  await page.getByRole('button',{name:'Hide controls',exact:true}).click();
  await expect(nav).not.toBeVisible();
  await expect(page.locator('#calibrate')).not.toBeVisible();
  await expect(page.locator('#exit')).not.toBeVisible();
  // A tap anywhere on the room brings them back; a drag doesn't.
  await page.mouse.move(200,500);await page.mouse.down();await page.mouse.move(300,550,{steps:5});await page.mouse.up();
  await expect(nav).not.toBeVisible();
  await page.mouse.click(200,500);
  await expect(nav).toBeVisible();
  await page.mouse.click(200,500);
  await expect(nav).not.toBeVisible();
  await page.getByRole('button',{name:'Show controls'}).click();
  await expect(nav).toBeVisible();
  expect(await current()).toBe(ids[2]);
  await page.evaluate(async () => { if(document.fullscreenElement) await document.exitFullscreen(); });
  await page.setViewportSize({width:852,height:393});
  await expect(nav).toBeVisible();
  expect(await current()).toBe(ids[2]);
  expect(errors).toEqual([]);
});

test('face tracking follows the eye from the front camera', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(() => {
    // Stand-in for MediaPipe: iris centers in normalized image coordinates.
    window.irises=[{x:.45,y:.5},{x:.55,y:.5}];
    window.parallaxFaceTracker=async()=>({detect:()=>window.irises,close(){}});
  });
  await page.setViewportSize({width:393,height:852});
  await page.goto('/');
  await page.getByRole('button',{name:'Open with face tracking'}).click();
  await expect(page.locator('#tracking')).toContainText('FACE TRACKING');
  await expect(page.locator('#calibrate')).not.toBeVisible();
  await page.waitForTimeout(300);
  const shot=()=>page.locator('canvas').screenshot({style:'#experience{visibility:hidden!important}'});
  const initial=await shot();
  await page.evaluate(()=>{window.irises=[{x:.25,y:.4},{x:.33,y:.4}];});
  await page.waitForTimeout(400);
  expect(Buffer.compare(initial,await shot())).not.toBe(0);
  await page.evaluate(()=>{window.irises=null;});
  await expect(page.locator('#tracking')).toContainText('LOOKING FOR YOUR FACE');
  await page.getByRole('button',{name:'Open display settings'}).click();
  await expect(page.locator('#tracking-mode')).toHaveValue('face');
  await expect(page.locator('#eye')).toHaveValue('right');
  await page.locator('#tracking-mode').selectOption('motion');
  await page.getByRole('button',{name:'Apply settings'}).click();
  await expect(page.locator('#calibrate')).toBeVisible();
  expect(errors).toEqual([]);
});

test('denied camera falls back to the drag preview', async ({page}) => {
  await page.addInitScript(() => { navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('no','NotAllowedError');}; });
  await page.goto('/');
  await page.getByRole('button',{name:'Open with face tracking'}).click();
  await expect(page.locator('#tracking')).toContainText('DRAG TO EXPLORE');
  await expect(page.locator('#live-message')).toContainText('Camera access was denied');
});

test('music app buttons and volume slider respond to taps and drags', async ({page}) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:393,height:852});
  await page.goto('/');
  await page.getByRole('button',{name:'Explore with touch'}).click();
  await page.getByRole('button',{name:/Browse all scenes/}).click();
  await page.locator('#gallery-grid [data-id=app-interface]').click();
  const shot=()=>page.locator('canvas').screenshot({style:'#experience{visibility:hidden!important}'});
  const nav=page.getByRole('button',{name:'Next scene'});
  // Playing: the record and level meter keep moving.
  const a=await shot(); await page.waitForTimeout(200);
  expect(Buffer.compare(a,await shot())).not.toBe(0);
  // The play button sits 12% of the height below center; tapping it pauses without toggling the controls.
  const box=await page.locator('canvas').boundingBox();
  const cx=box.x+box.width/2, cy=box.y+box.height/2;
  await page.mouse.click(cx,cy+box.height*.12);
  await expect(nav).toBeVisible();
  await page.waitForTimeout(3000);
  const paused=await shot(); await page.waitForTimeout(200);
  expect(Buffer.compare(paused,await shot())).toBe(0);
  // Dragging the volume thumb (29% below center) to the left changes the scene without moving the view.
  await page.mouse.move(cx+box.width*.1,cy+box.height*.29);await page.mouse.down();
  await page.mouse.move(cx-box.width*.25,cy+box.height*.29,{steps:8});await page.mouse.up();
  await page.waitForTimeout(1000);
  const quieter=await shot();
  expect(Buffer.compare(paused,quieter)).not.toBe(0);
  await expect(nav).toBeVisible();
  // Next track, then resume playback.
  await page.mouse.click(cx+box.width*.23,cy+box.height*.12);
  await page.mouse.click(cx,cy+box.height*.12);
  await page.waitForTimeout(500);
  const b=await shot(); await page.waitForTimeout(200);
  expect(Buffer.compare(b,await shot())).not.toBe(0);
  await expect(nav).toBeVisible();
  expect(errors).toEqual([]);
});
