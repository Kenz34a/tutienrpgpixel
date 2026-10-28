import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { Game } from '../src/game/model.js';

const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}),args:JSON.parse(process.env.BROWSER_ARGS??'[]')});
const url=process.env.TEST_BASE_URL??'http://127.0.0.1:5173',errors=[],output='test-results';
await mkdir(output,{recursive:true});
const fixture=new Game();fixture.player.level=12;fixture.refreshStats();fixture.travel('map-2-0');fixture.player.x=900;fixture.player.y=620;fixture.player.flying=false;fixture.player.hp=fixture.player.maxHp;fixture.player.mp=fixture.player.maxMp;
const select=(p,id)=>p.locator(`[data-cmd="select"][data-id="${id}"]`).first();
const record=process.env.RECORD_SWORD_VIDEO==='1';
try{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(save=>localStorage.setItem('van-mong-tien-lo:v1',JSON.stringify(save)),fixture.serialize());
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(15000);
  await p.goto(url,{waitUntil:'networkidle'});await p.waitForTimeout(600);
  await p.keyboard.press('k');await p.locator('[data-cmd="sword-set"][data-id="basic"]').click();
  assert.equal(await p.locator('[data-sword-preview]').count(),1);assert.match(await p.locator('.loadout-strip').innerText(),/Thanh Phong Kiếm/);
  await p.waitForTimeout(240);await p.screenshot({path:`${output}/sword-school.png`});await p.keyboard.press('Escape');
  if(record)await p.evaluate(()=>{
    const chunks=[],recorder=new MediaRecorder(document.querySelector('#world').captureStream(30),{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:3500000});
    const done=new Promise(resolve=>{recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};});
    window.swordRecording={recorder,done};recorder.start();
  });
  await p.keyboard.down('d');await p.waitForTimeout(240);await p.keyboard.up('d');
  for(let i=1;i<=3;i++){await p.keyboard.press('j');await p.waitForTimeout(150);assert.equal(await p.locator('[data-skill="attack"] .cooldown').isVisible(),true,'a quick J tap starts an attack');await p.screenshot({path:`${output}/sword-combo-${i}.png`});await p.waitForTimeout(310);}
  await p.keyboard.press('1');await p.waitForTimeout(280);await p.screenshot({path:`${output}/sword-thrust.png`});await p.waitForTimeout(650);
  await p.keyboard.press('2');await p.waitForTimeout(220);assert.equal(await p.locator('[data-skill="windStep"]').evaluate(el=>el.classList.contains('recast-ready')),true);
  await p.keyboard.press('2');await p.waitForTimeout(170);await p.screenshot({path:`${output}/sword-dash.png`});
  assert.equal(await p.locator('[data-skill="windStep"]').evaluate(el=>el.classList.contains('recast-ready')),false);assert.equal(await p.locator('[data-skill="windStep"] .cooldown').isVisible(),true);
  await p.waitForTimeout(500);await p.keyboard.press('3');await p.waitForTimeout(490);await p.screenshot({path:`${output}/sword-cyclone.png`});await p.waitForTimeout(1100);
  await p.keyboard.press('4');await p.waitForTimeout(400);await p.screenshot({path:`${output}/sword-wall.png`});await p.waitForTimeout(1200);
  if(record)await p.evaluate(()=>window.swordRecording.recorder.pause());
  await p.keyboard.press('k');await select(p,'windFinal').click();await p.locator('[data-cmd="skill-equip"][data-id="windFinal"][data-slot="3"]').click();await p.keyboard.press('Escape');
  if(record)await p.evaluate(()=>window.swordRecording.recorder.resume());
  await p.keyboard.press('4');await p.waitForTimeout(1150);await p.screenshot({path:`${output}/sword-ultimate.png`});await p.waitForTimeout(1000);
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('van-mong-tien-lo:v1')));assert.deepEqual(saved.expansion.loadout,['windEdge','windStep','windWheel','windFinal']);
  if(record){const data=await p.evaluate(async()=>{window.swordRecording.recorder.stop();return await window.swordRecording.done;});await writeFile(`${output}/sword-choreography.webm`,Buffer.from(data,'base64'));}
  await context.close();
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobile=await mobileContext.newPage();mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(url,{waitUntil:'networkidle'});
  await mobile.locator('.world-tool[data-action="skills"]').tap();await mobile.locator('[data-cmd="sword-set"][data-id="final"]').tap();
  assert.equal(await mobile.evaluate(()=>document.body.scrollWidth),390);await mobile.screenshot({path:`${output}/sword-mobile-school.png`});
  await mobile.locator('.modal-close').tap();await mobile.locator('[data-skill="windEdge"]').tap();await mobile.waitForTimeout(250);await mobile.screenshot({path:`${output}/sword-mobile.png`});
  assert.deepEqual(errors,[]);await mobileContext.close();
  console.log('Sword browser passed: preview, presets, combo, thrust, paid recast, cyclone, wall, ultimate, save and mobile.');
}finally{await browser.close();}
