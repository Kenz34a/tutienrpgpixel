import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/model.js';
import { poseAt } from '../src/game/choreography.js';

function advance(g,t){for(let n=0;n<t;n+=1/60)g.update(1/60);}
function arena(){const g=new Game();g.player.x=950;g.player.y=570;g.player.mp=1000;g.player.maxMp=1000;g.enemies=[g.enemies[0],{...g.enemies[0],id:20,x:850,homeX:850,statuses:{}}];for(const e of g.enemies){e.hp=e.maxHp=5000;}return g;}

test('three connected melee inputs have different poses and a stronger finishing hit',()=>{
  const g=arena(),enemy=g.enemies[0],steps=[];
  for(let i=0;i<3;i++){assert.equal(g.cast('attack'),true);steps.push(g.drainEvents().find(e=>e.type==='cast').combo);advance(g,.43);}
  assert.deepEqual(steps,[1,2,3]);assert.equal(enemy.hp,5000-40-40-56);
  advance(g,1.1);g.cast('attack');assert.equal(g.drainEvents().find(e=>e.type==='cast').combo,1);
});
test('a rejected melee input cannot skip a combo beat or change its facing',()=>{
  const g=arena();g.cast('attack');const first=structuredClone(g.player.action);assert.equal(g.cast('attack'),false);g.player.facing=-1;
  assert.equal(poseAt(first,first.started+.12).facing,1);advance(g,.44);g.cast('attack');assert.equal(g.meleeCombo.step,2);
  assert.equal(poseAt(first,first.started+1),null);
});
test('the sword thrust hits after the extension and respects the facing direction',()=>{
  const g=arena(),front=g.enemies[0],back=g.enemies[1];assert.equal(g.cast('windEdge'),true);assert.equal(front.hp,5000);
  advance(g,.13);assert.equal(front.hp,5000);advance(g,.05);assert.equal(front.hp,4865);assert.equal(back.hp,5000);
});
test('wind step allows exactly one paid recast, then keeps its cooldown',()=>{
  const g=arena(),mp=g.player.mp,x=g.player.x;assert.equal(g.cast('windStep'),true);advance(g,.2);assert.ok(g.player.x>x+130);
  const before=g.player.mp;assert.equal(g.cast('windStep'),true);assert.equal(g.player.mp,before-20);assert.equal(g.cast('windStep'),false);assert.equal(g.windStepRecastUntil,0);assert.ok(g.cooldowns.windStep>7);assert.ok(g.player.mp<mp-35);
  const fresh=arena();fresh.cast('windStep');advance(fresh,2.5);assert.equal(fresh.cast('windStep'),false);
});
test('the wind wall reduces damage only nearby and slows enemies inside it',()=>{
  const g=arena(),control=arena();g.cast('windWall');const hp=g.player.hp;g.damagePlayer(100);assert.equal(g.player.hp,hp-55);
  g.player.invulnerable=0;g.player.x=1400;const outside=g.player.hp;g.damagePlayer(100);assert.equal(g.player.hp,outside-100);
  g.player.x=950;g.enemies[0].x=g.enemies[0].homeX=1070;control.enemies[0].x=control.enemies[0].homeX=1070;
  advance(g,.5);advance(control,.5);assert.ok(g.enemies[0].x>control.enemies[0].x+10);
  g.time=g.windBarrier.until+.1;g.stepExpansion(.01);assert.equal(g.windBarrier,null);
});
test('the cyclone actually prevents an airborne enemy from attacking',()=>{
  const g=arena();g.enemies=g.enemies.slice(0,1);g.enemies[0].x=970;g.cast('windWheel');const hp=g.player.hp;
  advance(g,1);assert.equal(g.player.hp,hp);assert.ok(g.enemies[0].statuses.airborneUntil>g.time);advance(g,.4);assert.ok(g.player.hp<hp);
});
test('the sword ultimate applies four timed hits, then launches the surviving target',()=>{
  const g=arena(),enemy=g.enemies[0],back=g.enemies[1];g.cast('windFinal');advance(g,.15);assert.equal(enemy.hp,5000);
  advance(g,.08);assert.equal(enemy.hp,4930);advance(g,.92);assert.equal(enemy.hp,4720);assert.equal(back.hp,5000);assert.ok(enemy.statuses.airborneUntil>g.time);
});
test('new sword loadouts persist while live choreography and recasts do not',()=>{
  const g=arena();g.equipSkill('windEdge',0);g.equipSkill('windFinal',3);g.cast('windStep');g.cast('windWall');
  const saved=g.serialize(),restored=new Game(saved);assert.equal(restored.loadout[0],'windEdge');assert.equal(restored.loadout[3],'windFinal');assert.equal(restored.windStepRecastUntil,0);assert.equal(restored.windBarrier,null);assert.equal(saved.player.action,undefined);
});
