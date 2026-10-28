import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/model.js';
import { SKILLS } from '../src/game/world.js';
import { CONTENT_COUNT, CONTENT_BY_ID, COLLECTIONS, EQUIPMENT, MATERIALS, MAPS, MONSTERS, BOSSES, NPCS, QUESTS, TECHNIQUES, MANUALS, PILLS, RECIPES, MAX_LEVEL } from '../src/expansion/content.js';

function advance(game,seconds,input={}){for(let t=0;t<seconds;t+=1/60)game.update(1/60,input);}
function veteran(){const g=new Game();g.player.level=MAX_LEVEL;g.refreshStats();g.player.hp=g.player.maxHp;g.player.mp=g.player.maxMp;g.player.coins=1e10;g.player.jade=1e8;return g;}

test('10,104 distinct content records have valid gameplay references, excluding recipes',()=>{
  assert.equal(CONTENT_COUNT,10104);
  const all=Object.values(COLLECTIONS).flat();assert.equal(new Set(all.map(i=>i.id)).size,all.length);
  assert.equal(new Set(EQUIPMENT.map(i=>i.name)).size,4800);
  assert.equal(new Set(TECHNIQUES.map(i=>i.name)).size,1152);
  assert.equal(MAPS.length,120);assert.equal(QUESTS.length,1440);
  for(const map of MAPS){assert.equal(MONSTERS.filter(m=>m.mapId===map.id).length,6);assert.equal(BOSSES.filter(m=>m.mapId===map.id).length,1);assert.equal(NPCS.filter(n=>n.mapId===map.id).length,2);assert.equal(QUESTS.filter(q=>q.mapId===map.id).length,12);}
  for(const m of MANUALS)assert.equal(CONTENT_BY_ID.get(m.skillId)?.kind,'techniques');
  const actions=new Set(['kill','boss','gather','craft-pill','craft-gear','learn','visit','talk','cultivate','breakthrough']);
  for(const q of QUESTS){assert.ok(actions.has(q.objective.type));assert.ok(q.objective.target==='any'||CONTENT_BY_ID.has(q.objective.target));assert.ok(CONTENT_BY_ID.has(q.mapId));for(const reward of q.rewards.materials)assert.equal(CONTENT_BY_ID.get(reward.id).kind,'materials');}
  for(const r of RECIPES){assert.ok(CONTENT_BY_ID.has(r.output));for(const i of r.ingredients){const m=CONTENT_BY_ID.get(i.id);assert.equal(m.kind,'materials');assert.equal(m.tier,r.tier);}}
});

test('all 4,920 recipes actually craft their promised gear or pill and consume exact costs',()=>{
  const g=veteran();for(const m of MATERIALS)g.bag[m.id]=100000;
  const before=g.player.coins,total=RECIPES.reduce((sum,r)=>sum+r.coins,0);
  for(const r of RECIPES){const previous=g.bag[r.output]??0;assert.equal(g.craft(r.output),true,r.id);assert.equal(g.bag[r.output],previous+r.count);}
  assert.equal(g.player.coins,before-total);
});

test('every generated technique can be learned from its manual and equipped',()=>{
  const g=veteran();
  for(const s of TECHNIQUES){const id=`manual-${s.id}`,before=g.bag[id]??0;g.addItem(id);assert.equal(g.learn(s.id),true,s.id);assert.equal(g.bag[id],before);assert.equal(g.equipSkill(s.id,s.form%4),true);assert.equal(g.skillDefinition(s.id).effect,s.effect);}
  assert.equal(g.learned.length,TECHNIQUES.length+Object.keys(SKILLS).length-1);
});

test('failed crafts and failed purchases are atomic',()=>{
  const g=new Game(),item=EQUIPMENT.find(i=>i.tier===2);const before=JSON.stringify(g.bag),coins=g.player.coins,jade=g.player.jade;
  assert.equal(g.craft(item.id),false);assert.equal(g.buyContent(item.id),false);assert.equal(JSON.stringify(g.bag),before);assert.equal(g.player.coins,coins);assert.equal(g.player.jade,jade);
  g.bag['mat-1-0']=0;assert.equal(g.craft('pill-1-0'),false);assert.equal(g.bag['mat-1-2'],12);
});

test('gathering consumes a renewable node, counts the accepted quest, and survives reload',()=>{
  const g=new Game();g.acceptQuest('quest-map-1-0-3');const node=g.nodes[0],before=g.bag[node.material.id];
  assert.equal(g.gather(node.id),true);assert.equal(g.bag[node.material.id],before+2);assert.equal(g.questLog['quest-map-1-0-3'].progress,2);
  assert.equal(g.gather(node.id),false);
  const restored=new Game(g.serialize());assert.equal(restored.gather(node.id),false);advance(restored,30.1);assert.equal(restored.gather(node.id),true);
  assert.equal(restored.questLog['quest-map-1-0-3'].progress,3);assert.equal(restored.claimSideQuest('quest-map-1-0-3'),true);assert.equal(restored.claimSideQuest('quest-map-1-0-3'),false);
});

test('equipment and enhancement modify the real attack stats and persist',()=>{
  const g=new Game(),item=EQUIPMENT.find(i=>i.tier===1&&i.slot==='weapon');
  assert.equal(g.craft(item.id),true);const before=g.attackMultiplier;assert.equal(g.equip(item.id),true);assert.ok(g.attackMultiplier>before);
  const attack=g.stats.attack,jade=g.player.jade;assert.equal(g.enhance(item.id),true);assert.equal(g.player.jade,jade-20);assert.ok(g.stats.attack>attack);
  const restored=new Game(g.serialize());assert.equal(restored.equipment.weapon,item.id);assert.equal(restored.enhancements[item.id],1);assert.equal(restored.stats.attack,g.stats.attack);
});

test('all twelve pill effects work, with permanent root training capped and no wasted healing',()=>{
  const g=new Game();g.addItem('pill-1-0');assert.equal(g.useItem('pill-1-0'),false);assert.equal(g.bag['pill-1-0'],1);
  for(const pill of PILLS.filter(p=>p.tier===1)){g.addItem(pill.id);g.player.hp=500;g.player.mp=50;g.potionCooldown=0;assert.equal(g.useItem(pill.id),true,pill.name);}
  assert.ok(g.player.xp>36);assert.ok(g.player.shield>0);assert.ok(g.buffActive('attack'));assert.ok(g.buffActive('crit'));assert.ok(g.buffActive('speed'));assert.ok(g.buffActive('resist'));assert.ok(g.buffActive('loot'));assert.equal(g.player.rootTraining,1);
  for(let i=0;i<4;i++){g.addItem('pill-1-10');g.potionCooldown=0;assert.equal(g.useItem('pill-1-10'),true);}g.addItem('pill-1-10');g.potionCooldown=0;assert.equal(g.useItem('pill-1-10'),false);assert.equal(g.player.rootTraining,5);assert.equal(g.bag['pill-1-10'],1);
});

test('race, root and sect choices change combat/cultivation and respect switching cost',()=>{
  const g=new Game(),hp=g.player.maxHp,attack=g.attackMultiplier,rate=g.cultivationRate;
  assert.equal(g.chooseRace('dragon'),true);assert.ok(g.player.maxHp>hp);assert.ok(g.attackMultiplier>attack);
  assert.equal(g.chooseRoot('fire'),true);assert.ok(g.cultivationRate>rate);assert.equal(g.joinSect('xich-diem'),true);
  assert.equal(g.sect.element,'fire');g.player.merit=100;g.player.jade=600;assert.equal(g.joinSect('thanh-van'),true);assert.equal(g.player.merit,0);assert.equal(g.player.jade,100);assert.equal(g.chooseRoot('ice'),false);
});

test('three currency exchanges enforce costs, quantities, and the conversion spread',()=>{
  const g=new Game();g.player.jade=2000;assert.equal(g.exchange('fairy'),true);assert.equal(g.player.fairy,1);assert.equal(g.player.jade,1000);
  assert.equal(g.exchange('jade'),true);assert.equal(g.player.jade,1900);assert.equal(g.exchange('fairy',-1),false);assert.equal(g.exchange('divine'),false);
  g.player.fairy=100;assert.equal(g.exchange('divine'),true);assert.equal(g.player.divine,1);assert.equal(g.exchange('fairyBack'),true);assert.equal(g.player.fairy,90);
});

test('quest progress requires acceptance and the correct map; NPC dialogue completes talk quests',()=>{
  const g=new Game();g.progressQuests('talk','npc-map-1-0-0');assert.equal(Object.keys(g.questLog).length,0);
  g.acceptQuest('quest-map-1-0-9');g.player.x=360;assert.equal(g.interact(),'npc');assert.equal(g.questLog['quest-map-1-0-9'].progress,1);
  g.joinSect('thanh-van');assert.equal(g.claimSideQuest('quest-map-1-0-9'),true);assert.ok(g.player.merit>0);
  g.acceptQuest('quest-map-1-0-1');g.travel('map-1-1');g.progressQuests('kill','any',6);assert.equal(g.questLog['quest-map-1-0-1'].progress,0);
});

test('eight concurrent quests are enforced, abandonment releases the slot',()=>{
  const g=new Game();for(const q of QUESTS.slice(0,8))assert.equal(g.acceptQuest(q.id),true);assert.equal(g.acceptQuest(QUESTS[8].id),false);assert.equal(g.abandonQuest(QUESTS[0].id),true);assert.equal(g.acceptQuest(QUESTS[8].id),true);
});

test('ice freezes, dragon knocks back, a vortex pulls, clones attack and meteors land later',()=>{
  let g=new Game();g.player.x=950;const first=g.enemies[0];g.cast('ice');const frozenX=first.x;advance(g,1);assert.equal(first.x,frozenX);assert.ok(first.statuses.frozen>g.time);
  g=new Game();g.player.x=950;const x=g.enemies[0].x;g.cast('dragon');assert.ok(g.enemies[0].x>x);
  g=new Game();g.player.x=950;const far=g.enemies[1].x;g.cast('vortex');assert.ok(g.enemies[1].x<far);
  g=new Game();g.player.x=950;g.cast('clone');assert.equal(g.companions.length,3);advance(g,1);assert.ok(g.enemies[0].hp<180);
  g=new Game();g.player.x=950;g.cast('meteor');assert.equal(g.enemies[0].hp,180);advance(g,.9);assert.equal(g.enemies[0].alive,false);
});

test('shield absorbs damage and dash grants a short actual movement burst',()=>{
  const g=new Game();g.cast('shield');const shield=g.player.shield;g.damagePlayer(100);assert.equal(g.player.hp,g.player.maxHp);assert.equal(g.player.shield,shield-100);
  const start=g.player.x;assert.equal(g.dash(),true);advance(g,.15);assert.ok(g.player.x>start+90);assert.equal(g.dash(),false);
});

test('realm boundary requires nine real tribulation waves; dodging wins and unlocks maps',()=>{
  const g=new Game();g.player.level=9;g.refreshStats();g.player.hp=g.player.maxHp;g.player.xp=900;g.player.y=200;
  assert.equal(g.travel('map-2-0'),false);assert.equal(g.breakthrough(),true);assert.equal(g.player.level,9);assert.equal(g.tribulation.active,true);assert.equal(g.teleport(2),false);
  let direction=1;
  for(let frame=0;frame<27*60&&g.tribulation?.active;frame++){if(g.player.x>850)direction=-1;if(g.player.x<170)direction=1;g.update(1/60,{axisX:direction});}
  assert.equal(g.tribulation,null);assert.equal(g.player.level,10);assert.equal(g.realm.name,'Trúc Cơ');assert.equal(g.player.jade,370);assert.equal(g.player.xp,0);assert.equal(g.travel('map-2-0'),true);
});

test('failing a tribulation preserves tu vi, consumes its fee and does not advance',()=>{
  const g=new Game();g.player.level=9;g.refreshStats();g.player.hp=g.player.maxHp;g.player.xp=900;g.breakthrough();advance(g,25);
  assert.equal(g.player.level,9);assert.equal(g.player.xp,900);assert.equal(g.player.jade,370);assert.equal(g.tribulation,null);assert.ok(g.events.some(e=>e.text?.startsWith('Độ kiếp thất bại')));
});

test('all 120 maps spawn their own referenced enemies, resources, NPCs and boss loot',()=>{
  const g=veteran();for(const map of MAPS){assert.equal(g.travel(map.id),true,map.id);assert.equal(g.npcs.length,2);assert.equal(g.nodes.length,10);assert.equal(g.enemies.length,9);for(const e of g.enemies)assert.equal(CONTENT_BY_ID.get(e.contentId).mapId,map.id);for(const n of g.nodes)assert.equal(n.material.tier,map.tier);const boss=g.enemies.at(-1);g.damageEnemy(boss,boss.hp);assert.equal(boss.alive,false);assert.ok(g.events.some(e=>e.text?.startsWith('Boss rơi:')));g.drainEvents();}assert.equal(g.visited.length,120);assert.ok(g.player.fairy>0);assert.ok(g.player.divine>0);
});

test('version 1 saves migrate; version 2 persists all new progression and rejects invalid records',()=>{
  const old=new Game({version:1,player:{level:4,xp:99,potions:8},quest:{kills:2,claimed:false}});assert.equal(old.player.level,4);assert.equal(old.player.potions,8);assert.equal(old.quest.kills,2);assert.ok(old.bag['mat-1-0']);
  old.chooseRoot('ice');old.joinSect('thanh-van');old.learn('tech-5-7-0');old.equipSkill('tech-5-7-0',0);old.acceptQuest('quest-map-1-0-1');old.travel('map-1-4');
  const saved=old.serialize();saved.expansion.bag['unknown-thing']=999;saved.expansion.enhancements['unknown-thing']=99;saved.expansion.learned.push('unknown-skill');const g=new Game(saved);
  assert.equal(g.player.root,'ice');assert.equal(g.player.sect,'thanh-van');assert.equal(g.loadout[0],'tech-5-7-0');assert.equal(g.mapId,'map-1-4');assert.equal(g.bag['unknown-thing'],undefined);assert.equal(g.learned.includes('unknown-skill'),false);assert.ok(g.questLog['quest-map-1-0-1']);
});
