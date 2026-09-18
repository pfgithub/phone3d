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

test('every scene renders and the picker survives hiding controls and resize', async ({page}) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:393,height:852});
  await page.goto('/');
  await page.getByRole('button',{name:'Explore with touch'}).click();
  const picker=page.getByLabel('SCENE',{exact:true});
  const ids=await picker.locator('option').evaluateAll(options=>options.map(o=>o.value));
  expect(ids.length).toBeGreaterThan(1);
  const last=ids.at(-1);
  let previous;
  for(const id of ids) {
    await picker.selectOption(id);
    await page.waitForTimeout(100);
    const shot=await page.locator('canvas').screenshot({style:'#experience{visibility:hidden!important}'});
    if(previous) expect(Buffer.compare(previous,shot)).not.toBe(0);
    previous=shot;
  }
  await page.getByRole('button',{name:'Hide controls',exact:true}).click();
  await expect(picker).not.toBeVisible();
  await page.getByRole('button',{name:'Show controls'}).click();
  await expect(picker).toHaveValue(last);
  await page.evaluate(async () => { if(document.fullscreenElement) await document.exitFullscreen(); });
  await page.setViewportSize({width:852,height:393});
  await expect(picker).toBeVisible();
  await expect(picker).toHaveValue(last);
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
