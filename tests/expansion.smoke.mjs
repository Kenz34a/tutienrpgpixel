import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { Game } from '../src/game/model.js';

const url=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}),args:JSON.parse(process.env.BROWSER_ARGS||'[]')});
const errors=[];let context;
await mkdir('test-results',{recursive:true});
const cmd=(page,name,id)=>page.locator(`[data-action="x"][data-cmd="${name}"]${id!==undefined?`[data-id="${id}"]`:''}`).last();
async function search(page,text){await page.locator('[data-exp-input="query"]').fill(text);await page.waitForTimeout(200);}
try{
  context=await browser.newContext({viewport:{width:1440,height:900}});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(12000);
  await p.goto(url,{waitUntil:'networkidle'});
  await p.locator('.nav-item[data-action="systems"]').click();
  assert.match(await p.locator('.exp-stats-banner').innerText(),/10.104/);
  await p.screenshot({path:'test-results/v2-systems.png'});
  await cmd(p,'goto','profile').first().click();await cmd(p,'root','fire').click();
  assert.match(await p.locator('.profile-summary h3').innerText(),/Thiên Hỏa/);
  await cmd(p,'goto','sects').first().click();await cmd(p,'sect','thanh-van').click();
  assert.match(await p.locator('.sect-current h3').innerText(),/Thanh Vân Kiếm Tông/);

  await cmd(p,'goto','missions').first().click();
  for(const n of [3,5,6,7,9])await cmd(p,'accept',`quest-map-1-0-${n}`).click();
  assert.match(await p.locator('.mission-summary').innerText(),/5\/8/);
  await p.keyboard.press('Escape');
  await p.locator('#interaction-prompt').click(); // Real gather interaction, also usable on touch.
  await p.waitForTimeout(150);

  await p.keyboard.press('u');
  await cmd(p,'select','pill-1-2').click();
  await cmd(p,'craft','pill-1-2').click();await cmd(p,'craft','pill-1-2').click();
  assert.match(await p.locator('.content-detail').innerText(),/Đang sở hữu\s*2/);
  await cmd(p,'use','pill-1-2').click();
  await cmd(p,'goto','forge').first().click();
  await cmd(p,'select','gear-1-0-0-0').click();await cmd(p,'craft','gear-1-0-0-0').click();
  await cmd(p,'equip','gear-1-0-0-0').click();await cmd(p,'enhance','gear-1-0-0-0').click();
  assert.match(await p.locator('.content-detail').innerText(),/Công kích/);
  await p.screenshot({path:'test-results/v2-forge.png'});

  await cmd(p,'goto','inventory').first().click();await cmd(p,'bag-kind','manuals').click();
  await cmd(p,'select','manual-tech-4-2-0').click();await cmd(p,'use','manual-tech-4-2-0').click();
  await cmd(p,'goto','skills').first().click();await search(p,'Thần Long');
  await cmd(p,'select','tech-4-2-0').click();await p.locator('[data-cmd="skill-equip"][data-id="tech-4-2-0"][data-slot="0"]').click();
  assert.match(await p.locator('.loadout-strip>button').first().innerText(),/Thủy/);
  await p.screenshot({path:'test-results/v2-skills.png'});
  await p.keyboard.press('Escape');await p.keyboard.press('1');await p.waitForTimeout(380);
  await p.screenshot({path:'test-results/v2-dragon.png'});
  assert.equal(await p.locator('[data-skill="tech-4-2-0"] .cooldown').isVisible(),true);

  await p.keyboard.down('a');await p.waitForTimeout(600);await p.keyboard.up('a');await p.waitForTimeout(120);
  await p.locator('#interaction-prompt').click();assert.equal(await p.locator('.dialogue-npc strong').innerText(),'Thanh Vân Tử');
  await cmd(p,'goto','missions').first().click();await cmd(p,'mission-tab','active').click();
  await cmd(p,'claim-side','quest-map-1-0-9').click();assert.match(await p.locator('.mission-summary').innerText(),/1\s+tiên duyên hoàn thành/);
  await cmd(p,'goto','atlas').first().click();await p.screenshot({path:'test-results/v2-atlas.png'});
  await cmd(p,'travel','map-1-4').click();await p.waitForTimeout(700);
  assert.equal(await p.locator('#zone-title').innerText(),'Huyền Băng Nguyên');
  await p.screenshot({path:'test-results/v2-snow.png'});
  await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(200);
  const save=await p.evaluate(()=>JSON.parse(localStorage.getItem('van-mong-tien-lo:v1')));
  assert.equal(save.version,2);assert.equal(save.expansion.root,'fire');assert.equal(save.expansion.sect,'thanh-van');assert.equal(save.expansion.equipment.weapon,'gear-1-0-0-0');assert.equal(save.expansion.enhancements['gear-1-0-0-0'],1);assert.equal(save.expansion.loadout[0],'tech-4-2-0');assert.equal(save.expansion.mapId,'map-1-4');assert.equal(save.expansion.questLog['quest-map-1-0-3'].progress,2);

  // Render every effect with an explicit prepared character, separate from the played save.
  await context.close();context=await browser.newContext({viewport:{width:1440,height:900}});
  const fixture=new Game();fixture.player.level=40;fixture.refreshStats();fixture.player.hp=fixture.player.maxHp-300;fixture.player.mp=fixture.player.maxMp;
  await context.addInitScript(data=>localStorage.setItem('van-mong-tien-lo:v1',JSON.stringify(data)),fixture.serialize());
  const fx=await context.newPage();fx.on('pageerror',e=>errors.push(e.message));await fx.goto(url,{waitUntil:'networkidle'});
  for(const id of fixture.learned){await fx.keyboard.press('k');await search(fx,fixture.skillDefinition(id).name);await cmd(fx,'select',id).click();await fx.locator(`[data-cmd="skill-equip"][data-id="${id}"][data-slot="0"]`).click();await fx.keyboard.press('Escape');await fx.keyboard.press('1');await fx.waitForTimeout(id==='meteor'?900:380);await fx.screenshot({path:`test-results/effect-${id}.png`});}

  // A boundary-realm fixture verifies tribulation UI and its live warnings.
  await context.close();context=await browser.newContext({viewport:{width:1440,height:900}});
  const trib=new Game();trib.player.level=9;trib.player.xp=900;trib.refreshStats();trib.player.hp=trib.player.maxHp;
  await context.addInitScript(data=>localStorage.setItem('van-mong-tien-lo:v1',JSON.stringify(data)),trib.serialize());
  const trial=await context.newPage();trial.on('pageerror',e=>errors.push(e.message));await trial.goto(url,{waitUntil:'networkidle'});
  await trial.locator('.nav-item[data-action="cultivation"]').click();assert.match(await trial.locator('[data-action="breakthrough"]').innerText(),/thiên kiếp/);await trial.locator('[data-action="breakthrough"]').click();
  assert.equal(await trial.locator('#tribulation-hud').isVisible(),true);
  await trial.waitForFunction(()=>document.querySelector('#tribulation-wave')?.textContent.trim()==='1 / 9',null,{timeout:10000});
  assert.match(await trial.locator('#tribulation-wave').innerText(),/1 \/ 9/);await trial.screenshot({path:'test-results/v2-tribulation.png'});

  await context.close();context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobile=await context.newPage();mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(url,{waitUntil:'networkidle'});
  await mobile.locator('#interaction-prompt').tap();await mobile.locator('.system-world-tool').tap();
  assert.equal(await mobile.evaluate(()=>document.body.scrollWidth),390);await mobile.screenshot({path:'test-results/v2-mobile-systems.png'});
  await cmd(mobile,'goto','alchemy').first().tap();await cmd(mobile,'select','pill-1-0').tap();await cmd(mobile,'craft','pill-1-0').tap();
  assert.match(await mobile.locator('.content-detail').innerText(),/Đang sở hữu\s*1/);
  const bounds=await mobile.locator('dialog').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390);
  await mobile.screenshot({path:'test-results/v2-mobile-alchemy.png'});
  assert.deepEqual(errors,[],'all expansion screens and effects render without exceptions');
  console.log('Expansion browser smoke passed: profile, sects, quests, touch gathering, alchemy, forge, equipment/enhancement, manuals, skill loadout, twelve effects, travel, persistence, tribulation HUD, mobile screens.');
}catch(error){console.error('Expansion smoke failure:',error.message);throw error;}finally{if(context)await context.close();await browser.close();}
