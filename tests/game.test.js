import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, WORLD_WIDTH, groundAt } from '../src/game/model.js';
import { MAX_LEVEL } from '../src/expansion/content.js';

function advance(game, seconds, input = {}) {
  for (let t = 0; t < seconds; t += 1 / 60) game.update(1 / 60, input);
}

test('ngự kiếm moves in both axes, respects the map boundary, and can land', () => {
  const game = new Game();
  advance(game, 1, { axisX: 1, axisY: -1 });
  assert.ok(game.player.x > 820 && game.player.y < 380);
  game.player.x = WORLD_WIDTH - 36;
  advance(game, 1, { axisX: 1 });
  assert.equal(game.player.x, WORLD_WIDTH - 35);
  game.toggleFlight();
  advance(game, 3);
  assert.equal(game.player.y, groundAt(game.player.x));
  assert.equal(game.player.vy, 0);
});

test('combat consumes mana, damages targets, and enforces cooldowns', () => {
  const game = new Game();
  game.player.x = 900;
  const enemy = game.enemies[0], before = game.player.mp;
  assert.equal(game.cast('swords'), true);
  assert.equal(enemy.hp, 80);
  assert.equal(game.player.mp, before - 25);
  assert.equal(game.cast('swords'), false);
  assert.equal(enemy.hp, 80);
  advance(game, 4.1);
  assert.equal(game.cast('swords'), true);
  assert.equal(enemy.alive, false);
  assert.equal(game.quest.kills, 2);
  assert.equal(game.enemies[1].alive, false);
});

test('melee respects direction and range; no mana does not start a cooldown', () => {
  const game = new Game();
  game.player.x = 950; game.player.facing = -1;
  assert.equal(game.cast('attack'), true);
  assert.equal(game.enemies[0].hp, 180);
  advance(game, .5);
  game.player.facing = 1;
  game.cast('attack');
  assert.equal(game.enemies[0].hp, 140);
  game.player.mp = 0;
  assert.equal(game.cast('storm'), false);
  assert.equal(game.cooldowns.storm, 0);
});

test('three kills complete the quest; claiming rewards is idempotent and persists', () => {
  const game = new Game();
  game.player.x = 1400; game.player.y = 610;
  game.cast('storm');
  assert.equal(game.quest.kills, 3);
  const { xp, jade } = game.player;
  assert.equal(game.claimQuest(), true);
  assert.equal(game.player.xp, xp + 150);
  assert.equal(game.player.jade, jade + 80);
  assert.equal(game.claimQuest(), false);
  const restored = new Game(game.serialize());
  assert.equal(restored.quest.claimed, true);
  assert.equal(restored.claimQuest(), false);
  assert.equal(restored.player.jade, game.player.jade);
});

test('breakthrough requires both currencies and increases combat stats', () => {
  const game = new Game();
  assert.equal(game.breakthrough(), false);
  game.player.xp = 250; game.player.jade = 49;
  assert.equal(game.breakthrough(), false);
  game.player.jade = 100;
  assert.equal(game.breakthrough(), true);
  assert.equal(game.player.level, 2);
  assert.equal(game.player.xp, 150);
  assert.equal(game.player.jade, 50);
  assert.equal(game.player.hp, 1420);
  assert.equal(game.player.mp, 420);
  assert.equal(game.xpRequired, 200);
  game.player.x = 950;
  game.cast('attack');
  assert.equal(game.enemies[0].hp, 131);
});

test('meditation restores resources and earns tu vi; movement ends meditation', () => {
  const game = new Game();
  game.player.hp = 800; game.player.mp = 100;
  game.toggleMeditation(true);
  assert.equal(game.player.flying, false);
  advance(game, 2);
  assert.ok(game.player.hp >= 869);
  assert.ok(game.player.mp >= 155);
  assert.ok(game.player.xp >= 51);
  advance(game, .1, { axisX: -1 });
  assert.equal(game.player.meditating, false);
  assert.ok(game.player.x < 560);
});

test('potions are not wasted at full health and share a real cooldown', () => {
  const game = new Game();
  assert.equal(game.usePotion(), false);
  assert.equal(game.player.potions, 6);
  game.player.hp = 100;
  assert.equal(game.usePotion(), true);
  assert.equal(game.player.potions, 5);
  assert.equal(game.player.hp, 844);
  assert.equal(game.usePotion(true), false);
  advance(game, 2.1);
  assert.equal(game.usePotion(true), true);
  assert.equal(game.player.spiritPotions, 2);
});

test('shop deducts the exact cost and never sells with insufficient funds', () => {
  const game = new Game();
  game.player.coins = 200;
  assert.equal(game.buy(), true);
  assert.equal(game.buy(true), true);
  assert.equal(game.player.coins, 0);
  assert.equal(game.player.potions, 7);
  assert.equal(game.player.spiritPotions, 4);
  assert.equal(game.buy(), false);
  assert.equal(game.player.coins, 0);
});

test('a lethal enemy attack revives the player safely without losing inventory', () => {
  const game = new Game();
  game.player.x = 1020; game.player.y = 620; game.player.hp = 1;
  advance(game, .1);
  assert.equal(game.player.x, 560);
  assert.equal(game.player.hp, game.player.maxHp);
  assert.ok(game.player.invulnerable > 0);
  assert.equal(game.player.potions, 6);
});

test('automatic combat finds enemies, moves, and earns rewards', () => {
  const game = new Game();
  game.player.auto = true;
  advance(game, 12);
  assert.ok(game.player.x > 1000);
  assert.ok(game.quest.kills >= 1);
  assert.ok(game.player.xp > 36);
  assert.ok(game.player.coins > 1240);
});

test('boss progression unlocks a separate one-time quest reward', () => {
  const game = new Game();
  game.quest.kills = 3; game.claimQuest();
  game.player.x = 4300; game.player.y = 620;
  const boss = game.enemies.at(-1);
  boss.hp = 200;
  game.cast('storm');
  assert.equal(boss.alive, false);
  assert.equal(game.quest.bossKilled, true);
  const { xp, jade } = game.player;
  assert.equal(game.claimQuest(), true);
  assert.equal(game.player.xp, xp + 500);
  assert.equal(game.player.jade, jade + 250);
  assert.equal(game.claimQuest(), false);
});

test('loading sanitizes invalid saves and keeps transient combat state out of saves', () => {
  const game = new Game({ version: 1, player: { level: 999, x: -1000, y: -20, hp: -5, mp: Infinity, coins: -100, potions: 'bad' }, quest: { kills: 1000 } });
  assert.equal(game.player.level, MAX_LEVEL);
  assert.equal(game.player.x, 40);
  assert.equal(game.player.y, 100);
  assert.equal(game.player.hp, 1);
  assert.equal(game.player.mp, game.player.maxMp);
  assert.equal(game.player.coins, 0);
  assert.equal(game.player.potions, 6);
  assert.equal(game.quest.kills, 3);
  assert.equal(game.player.auto, false);
  assert.equal('auto' in game.serialize().player, false);
});

test('map travel validates destination and preserves the player resources', () => {
  const game = new Game();
  assert.equal(game.teleport(-1), false);
  assert.equal(game.player.x, 560);
  assert.equal(game.teleport(2), true);
  assert.equal(game.zoneIndex, 2);
  assert.equal(game.player.x, 3260);
  assert.equal(game.player.jade, 420);
  assert.equal(game.player.flying, true);
});
