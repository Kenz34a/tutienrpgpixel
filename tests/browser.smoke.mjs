import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL=process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const output='test-results';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({
  headless:true,
  ...(process.env.BROWSER_EXECUTABLE_PATH ? {executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}),
  args:JSON.parse(process.env.BROWSER_ARGS || '[]'),
});
const errors=[];
let context;
try {
  context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.setDefaultTimeout(10000);
  await page.goto(baseURL,{waitUntil:'networkidle'});
  await page.waitForTimeout(600);
  assert.equal(await page.title(),'Vân Mộng · Tiên Lộ');
  assert.equal(await page.locator('#flight-button').getAttribute('aria-pressed'),'true');
  assert.deepEqual(await page.evaluate(()=>({width:document.body.scrollWidth,height:document.body.scrollHeight})),{width:1440,height:900});

  // Exercise movement through the keyboard, rather than mutating game state.
  const startX=Number((await page.locator('#coordinates').innerText()).split(',')[0]);
  await page.keyboard.down('d');await page.waitForFunction(x=>Number(document.querySelector('#coordinates').textContent.split(',')[0])>x+105,startX,{timeout:5000});await page.keyboard.up('d');await page.waitForTimeout(150);
  const movedX=Number((await page.locator('#coordinates').innerText()).split(',')[0]);
  assert.ok(movedX>startX+90,'movement changes the world position');

  // Menus pause gameplay and keyboard movement cannot leak through them.
  await page.keyboard.press('b');
  assert.equal(await page.locator('dialog').isVisible(),true);
  assert.equal(await page.locator('.modal-header h2').innerText(),'Hành trang');
  const pausedAt=await page.locator('#coordinates').innerText();
  await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');
  assert.equal(await page.locator('#coordinates').innerText(),pausedAt);
  await page.keyboard.press('Escape');

  await page.locator('.world-tool[data-action="shop"]').click();
  await page.locator('[data-action="buy-potion"]').click();
  assert.equal(await page.locator('#shop-coins').innerText(),'1.160');
  assert.equal(await page.locator('#potion-count').innerText(),'7');
  await page.keyboard.press('Escape');

  // Two nearby enemies fall to a real skill combination.
  await page.keyboard.down('d');await page.waitForTimeout(1100);await page.keyboard.up('d');
  await page.keyboard.press('1');await page.keyboard.press('2');
  await page.waitForTimeout(180);
  assert.equal(await page.locator('#quest-count').innerText(),'2/3');
  assert.equal(await page.locator('[data-skill="swords"] .cooldown').isVisible(),true);
  await page.keyboard.down('d');await page.waitForTimeout(1100);await page.keyboard.up('d');
  await page.keyboard.press('4');await page.waitForTimeout(180);
  assert.equal(await page.locator('#quest-count').innerText(),'3/3');
  await page.keyboard.press('q');
  await page.locator('[data-action="claim"]').click();
  assert.equal(await page.locator('#currency-jade').innerText(),'500');
  assert.equal(await page.locator('.quest-detail h3').innerText(),'Trấn áp Linh Vương');
  await page.keyboard.press('Escape');

  await page.locator('.nav-item[data-action="cultivation"]').click();
  await page.locator('[data-action="breakthrough"]').click();
  assert.equal(await page.locator('.cultivation-orb small').innerText(),'TẦNG 2 · SƠ NHẬP TIÊN ĐẠO');
  assert.equal(await page.locator('#level-badge').innerText(),'2');
  await page.keyboard.press('Escape');

  await page.keyboard.press('l');
  await page.locator('[data-action="teleport"][data-zone="2"]').click();
  await page.waitForTimeout(180);
  assert.equal(await page.locator('#zone-title').innerText(),'Thiên Vân Đài');
  await page.keyboard.press('l');
  await page.locator('[data-action="teleport"][data-zone="0"]').click();
  await page.waitForTimeout(180);
  await page.keyboard.down('a');await page.waitForTimeout(500);await page.keyboard.up('a');
  await page.keyboard.press('e');
  assert.equal(await page.locator('.dialogue-npc strong').innerText(),'Thanh Vân Tử');
  await page.keyboard.press('Escape');

  // Meditation actually earns progress outside its menu.
  await page.keyboard.press('m');await page.waitForTimeout(1200);
  assert.equal(await page.locator('#meditation-notice').isVisible(),true);
  await page.keyboard.press('m');
  assert.equal(await page.locator('#meditation-notice').isVisible(),false);

  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="particles"]').click();
  assert.equal(await page.locator('[data-action="particles"]').getAttribute('aria-checked'),'false');
  await page.locator('[data-action="sound"][role="switch"]').click();
  assert.equal(await page.locator('[data-action="sound"][role="switch"]').getAttribute('aria-checked'),'true');
  await page.keyboard.press('Escape');

  await page.reload({waitUntil:'networkidle'});
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#level-badge').innerText(),'2');
  assert.equal(await page.locator('#potion-count').innerText(),'7');
  assert.equal(await page.locator('#currency-jade').innerText(),'450');
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('van-mong-tien-lo:v1')));
  assert.equal(save.quest.claimed,true);
  assert.equal(save.settings.particles,false);

  // A clean start is used for visual references, separate from the played save.
  await context.close();
  context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const desktop=await context.newPage();desktop.on('pageerror',e=>errors.push(e.message));
  await desktop.goto(baseURL,{waitUntil:'networkidle'});await desktop.waitForTimeout(5500);
  await desktop.screenshot({path:`${output}/desktop.png`});
  await desktop.locator('.nav-item[data-action="inventory"]').click();
  await desktop.screenshot({path:`${output}/inventory.png`});
  await context.close();

  context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const mobile=await context.newPage();mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(baseURL,{waitUntil:'networkidle'});await mobile.waitForTimeout(5500);
  assert.equal(await mobile.evaluate(()=>document.body.scrollWidth),390);
  const mobileX=Number((await mobile.locator('#coordinates').innerText()).split(',')[0]);
  const moveButton=await mobile.locator('[data-hold="right"]').boundingBox();
  await mobile.mouse.move(moveButton.x+moveButton.width/2,moveButton.y+moveButton.height/2);await mobile.mouse.down();await mobile.waitForFunction(x=>Number(document.querySelector('#coordinates').textContent.split(',')[0])>x+100,mobileX,{timeout:5000});await mobile.mouse.up();await mobile.waitForTimeout(180);
  assert.ok(Number((await mobile.locator('#coordinates').innerText()).split(',')[0])>mobileX+80,'touch control moves the character');
  await mobile.screenshot({path:`${output}/mobile.png`});
  await mobile.locator('.world-tool[data-action="help"]').tap();
  assert.equal(await mobile.locator('.modal-header h2').innerText(),'Bí kíp du hành');
  const modalBounds=await mobile.locator('dialog').boundingBox();assert.ok(modalBounds.x>=0&&modalBounds.x+modalBounds.width<=390);
  await mobile.locator('.modal-close').tap();
  assert.equal(await mobile.locator('dialog').isVisible(),false);
  assert.deepEqual(errors,[],'no browser runtime errors');
  console.log('Browser smoke passed: combat, quests, breakthrough, NPC, inventory, shop, travel, meditation, audio, settings, save/reload, mobile input, layout.');
  console.log(`Screenshots: ${output}/desktop.png, inventory.png, mobile.png`);
} finally {
  if(context)await context.close();
  await browser.close();
}
