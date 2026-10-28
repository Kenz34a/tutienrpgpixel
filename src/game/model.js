import { WORLD_WIDTH, SKILLS, ZONES, groundAt } from './world.js';
import { MAX_LEVEL, MAPS, ELEMENTS } from '../expansion/content.js';
import { initializeExpansion, restoreExpansion, serializeExpansion, expansionMethods } from '../expansion/rules.js';
import { beginAction } from './choreography.js';
export { WORLD_WIDTH, SKILLS, PLATFORMS, ZONES, groundAt } from './world.js';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const number = (v, fallback, min = 0, max = 1e12) => Number.isFinite(v) ? clamp(v, min, max) : fallback;

export class Game {
  constructor(saved = null) {
    this.time = 0;
    this.events = [];
    this.player = { x: 560, y: 570, vx: 0, vy: 0, hp: 1240, maxHp: 1240, mp: 320, maxMp: 380, level: 1, xp: 36, jade: 420, coins: 1240, potions: 6, spiritPotions: 3, facing: 1, flying: true, meditating: false, auto: false, invulnerable: 0 };
    this.quest = { kills: 0, claimed: false, bossKilled: false, bossClaimed: false };
    this.cooldowns = Object.fromEntries(Object.keys(SKILLS).map(key => [key, 0]));
    this.potionCooldown = 0;
    this.meleeCombo={step:0,last:-10};this.windStepRecastUntil=0;this.windBarrier=null;
    this.settings = { sound: false, particles: true, reducedMotion: false };
    initializeExpansion(this);
    if (saved?.version === 1 || saved?.version === 2) this.restore(saved);
  }

  get xpRequired() { return Math.round(this.player.level * 100 * Math.max(1, this.realm.index ** 1.35)); }
  get zoneIndex() { return this.player.x < 1500 ? 0 : this.player.x < 2900 ? 1 : 2; }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drainEvents() { return this.events.splice(0); }

  restore(saved) {
    const p = this.player, s = saved.player ?? {};
    p.level = Math.floor(number(s.level, 1, 1, MAX_LEVEL));
    p.maxHp = 1240 + (p.level - 1) * 180;
    p.maxMp = 380 + (p.level - 1) * 40;
    for (const key of ['xp', 'jade', 'coins', 'potions', 'spiritPotions']) p[key] = number(s[key], p[key], 0, key.includes('Potions') || key === 'potions' ? 999 : 1e12);
    p.x = number(s.x, 560, 40, WORLD_WIDTH - 40);
    p.y = number(s.y, groundAt(p.x) - 50, 100, groundAt(p.x));
    p.hp = number(s.hp, p.maxHp, 1, p.maxHp);
    p.mp = number(s.mp, p.maxMp, 0, p.maxMp);
    p.flying = typeof s.flying === 'boolean' ? s.flying : true;
    const q = saved.quest ?? {};
    this.quest = { kills: Math.floor(number(q.kills, 0, 0, 3)), claimed: q.claimed === true, bossKilled: q.bossKilled === true, bossClaimed: q.bossClaimed === true };
    for (const key of Object.keys(this.settings)) if (typeof saved.settings?.[key] === 'boolean') this.settings[key] = saved.settings[key];
    restoreExpansion(this, saved);
  }

  serialize() {
    const { x, y, hp, mp, level, xp, jade, coins, potions, spiritPotions, flying } = this.player;
    return { version: 2, player: { x, y, hp, mp, level, xp, jade, coins, potions, spiritPotions, flying }, quest: { ...this.quest }, settings: { ...this.settings }, expansion: serializeExpansion(this) };
  }

  update(dt, input = {}) {
    dt = clamp(dt, 0, 0.05);
    this.time += dt;
    const p = this.player;
    this.stepExpansion(dt);
    for (const key of Object.keys(this.cooldowns)) this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    this.potionCooldown = Math.max(0, this.potionCooldown - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.mp = Math.min(p.maxMp, p.mp + dt * (p.meditating ? 28 : 6));
    if (p.meditating) {
      p.hp = Math.min(p.maxHp, p.hp + dt * 35);
      p.xp += dt * this.cultivationRate;
      this.progressQuests('cultivate', 'any', dt);
      p.vx = 0;
      if (input.axisX || input.axisY || input.jump || input.attack) this.toggleMeditation(false);
    }
    let axisX = input.axisX || 0;
    let axisY = input.axisY || 0;
    if (p.auto && !p.meditating) {
      const target = this.enemies.filter(e => e.alive).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      if (target && !axisX && !axisY) {
        axisX = Math.abs(target.x - p.x) > 100 ? Math.sign(target.x - p.x) : 0;
        if (p.flying) axisY = Math.abs(target.y - 25 - p.y) > 20 ? Math.sign(target.y - 25 - p.y) : 0;
        if (Math.abs(target.x - p.x) < 400 && Math.abs(target.y - p.y) < 170) {
          p.facing = Math.sign(target.x - p.x) || p.facing;
          this.cast('swords', true);
          this.cast('attack', true);
          if (p.hp < p.maxHp * 0.45) this.cast('heal', true);
        }
      }
    }
    if (!p.meditating) {
      p.vx = this.dashTimer > 0 ? p.facing * 950 : axisX * this.movementSpeed;
      if (axisX) p.facing = Math.sign(axisX);
      const nextX = clamp(p.x + p.vx * dt, 35, WORLD_WIDTH - 35);
      if (p.flying || groundAt(nextX) >= p.y - 12) p.x = nextX;
      if (p.flying) {
        p.vy = axisY * 200;
        p.y = clamp(p.y + p.vy * dt, 130, groundAt(p.x) - 18);
      } else {
        if (input.jump && p.y >= groundAt(p.x) - 2) p.vy = -440;
        p.vy += 1050 * dt;
        p.y += p.vy * dt;
        if (p.y > groundAt(p.x)) { p.y = groundAt(p.x); p.vy = 0; }
      }
      if (input.attack) this.cast('attack', true);
    }
    for (const enemy of this.enemies) {
      enemy.hit = Math.max(0, enemy.hit - dt);
      if (!enemy.alive) {
        enemy.respawn -= dt;
        if (enemy.respawn <= 0) { enemy.alive = true; enemy.hp = enemy.maxHp; enemy.x = enemy.homeX; }
        continue;
      }
      enemy.attackCooldown -= dt;
      if ((enemy.statuses?.frozen ?? 0) > this.time||(enemy.statuses?.airborneUntil??0)>this.time) continue;
      const dx = p.x - enemy.x, dy = p.y - enemy.y;
      if (Math.abs(dx) < (enemy.kind === 'boss' ? 420 : 255) && Math.abs(dy) < 130) {
        const reach = enemy.kind === 'boss' ? 95 : 55;
        if (Math.abs(dx) > reach) enemy.x += Math.sign(dx) * dt * (enemy.kind === 'boss' ? 65 : 55)*((enemy.statuses?.slowUntil??0)>this.time ? .35 : 1);
        else if (enemy.attackCooldown <= 0 && !p.invulnerable) {
          const damage = enemy.damage ?? (enemy.kind === 'boss' ? 145 : 42);
          enemy.attackCooldown = enemy.kind === 'boss' ? 1.6 : 1.8;
          this.damagePlayer(damage, { element: enemy.element });
        }
      } else if (Math.abs(enemy.x - enemy.homeX) > 5) enemy.x += Math.sign(enemy.homeX - enemy.x) * dt * 20;
      enemy.y = groundAt(enemy.x);
    }
  }

  cast(id, silent = false) {
    const skill = this.skillDefinition(id), p = this.player;
    const recast=id==='windStep'&&this.windStepRecastUntil>this.time;
    if (!skill || (id !== 'attack' && !this.learned.includes(id)) || (this.cooldowns[id] > 0&&!recast) || p.meditating) return false;
    if (p.mp < skill.cost) { if (!silent) this.emit('notice', { text: 'Linh lực chưa đủ. Hãy tu luyện [M] để hồi phục.' }); return false; }
    if (skill.effect === 'heal' && p.hp >= p.maxHp) { if (!silent) this.emit('notice', { text: 'Sinh lực đang đầy.' }); return false; }
    p.mp -= skill.cost;
    this.cooldowns[id] = skill.cooldown;
    let combo=1;
    if(id==='attack'){combo=this.time-this.meleeCombo.last<1?this.meleeCombo.step%3+1:1;this.meleeCombo={step:combo,last:this.time};}
    beginAction(p,skill.effect,this.time,combo);
    this.emit('cast', { id, effect: skill.effect, combo, owner:'player', color: ELEMENTS.find(e=>e.id===skill.element)?.color, x: p.x, y: p.y, facing: p.facing, range: skill.range });
    if(id==='windStep'){this.windStepRecastUntil=recast?0:this.time+2.4;this.dashTimer=.18;p.invulnerable=Math.max(p.invulnerable,.28);}
    if(skill.effect==='wind-wall'){this.windBarrier={x:p.x+p.facing*120,y:p.y,facing:p.facing,until:this.time+4.5};return true;}
    if (skill.effect === 'heal') {
      const healed = Math.min(p.maxHp - p.hp, (420 + p.level * 35) * (1 + Math.max(0, (skill.tier ?? 1) - 1) * .5));
      p.hp += healed;
      this.emit('damage', { x: p.x, y: p.y - 70, amount: Math.round(healed), healing: true });
      return true;
    }
    if (skill.effect === 'shield') { p.shield = Math.min(p.maxHp * 2, p.shield + p.maxHp * (.65 + Math.max(0, (skill.tier ?? 1) - 1) * .3)); return true; }
    const affinity = 1 + (this.root.element === skill.element ? this.root.bonus : 0) + (this.sect?.element === skill.element ? this.sect.bonus : 0) + (this.race.element === skill.element ? this.race.elementBonus : 0) + this.gearAffinity(skill.element);
    const damage = Math.round(skill.damage * this.attackMultiplier * affinity*(id==='attack'&&combo===3?1.4:1));
    if(skill.effect==='wind-final'){
      for(const [index,delay]of [.18,.42,.7,1.02].entries())this.projectiles.push({x:p.x+p.facing*245,y:p.y,delay,damage:damage*.25,skill,radius:260,facing:p.facing,originX:p.x,finisher:index===3});return true;
    }
    if(skill.effect==='wind-edge'){this.projectiles.push({x:p.x+p.facing*245,y:p.y,delay:.16,damage,skill,radius:240,facing:p.facing,originX:p.x});return true;}
    if (skill.effect === 'clone') { this.companions = [-80, 0, 80].map((offset,i)=>({id:i,x:p.x+offset,y:p.y,offset,life:8,next:.3+i*.2,damage})); return true; }
    if (skill.effect === 'meteor') { this.projectiles.push({x:p.x+p.facing*220,delay:.8,damage,skill}); return true; }
    const directional=id==='attack'||skill.effect.startsWith('wind-');
    const targets = this.enemies.filter(e => e.alive && Math.abs(e.x - p.x) <= skill.range && Math.abs(e.y - p.y) < 200 && (!directional || (e.x - p.x) * p.facing >= -35));
    for (const enemy of targets) {
      enemy.statuses ??= {};
      if (skill.effect === 'ice') enemy.statuses.frozen = this.time + 3;
      if(skill.effect==='wind-wheel'){enemy.statuses.airborneUntil=this.time+1.2;enemy.statuses.airborneStarted=this.time;}
      if (skill.effect === 'vortex') enemy.x += (p.x + p.facing * 150 - enemy.x) * .6;
      if (skill.effect === 'dragon') enemy.x = clamp(enemy.x + p.facing * 90, 35, WORLD_WIDTH - 35);
      if (skill.effect === 'blades') enemy.statuses.vulnerable = this.time + 5;
      if (['flame','lotus'].includes(skill.effect)) { enemy.statuses.dotUntil = this.time + 4; enemy.statuses.dotDamage = damage * .08; }
      const critical = this.random() < this.stats.crit + (this.buffActive('crit') ? .2 : 0);
      this.damageEnemy(enemy, damage * (critical ? 1.7 : 1), skill);
    }
    if (skill.effect === 'lotus') p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .08);
    return true;
  }

  defeatEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.respawn = enemy.kind === 'boss' ? 65 : 20;
    const xp = enemy.xp ?? (enemy.kind === 'boss' ? 280 : 35);
    const coins = (enemy.kind === 'boss' ? 250 : 24) * this.activeMap.tier ** 2;
    this.player.xp += xp;
    this.player.coins += coins;
    if (enemy.kind === 'boss') { if (this.mapId === MAPS[0].id) this.quest.bossKilled = true; this.player.jade += 150 * this.activeMap.tier; }
    else if (this.mapId === MAPS[0].id) this.quest.kills = Math.min(3, this.quest.kills + 1);
    this.emit('kill', { x: enemy.x, y: enemy.y - 25, xp, coins, name: enemy.name });
    this.grantDrops(enemy);
    if (this.quest.kills === 3 && !this.quest.claimed && !this.questNotified) {
      this.questNotified = true;
      this.emit('notice', { text: 'Nhiệm vụ hoàn thành! Mở nhiệm vụ để nhận thưởng.', tone: 'gold' });
    }
  }

  revive() {
    const p = this.player;
    if (this.tribulation?.active) this.emit('notice', { text: 'Độ kiếp thất bại. Tu vi được giữ lại; linh thạch dẫn kiếp đã tiêu hao.' });
    this.tribulation = null;
    this.hazards = []; this.projectiles = []; this.companions = [];this.windBarrier=null;this.windStepRecastUntil=0;p.action=null;this.meleeCombo={step:0,last:-10};
    if (this.mapId !== MAPS[0].id) { this.mapId = MAPS[0].id; this.makeMapObjects(); this.emit('travel', { mapId: this.mapId }); }
    p.x = 560; p.y = 570; p.hp = p.maxHp; p.mp = p.maxMp; p.flying = true; p.auto = false; p.meditating = false; p.vx = 0; p.vy = 0; p.invulnerable = 5;
    this.emit('notice', { text: 'Thanh Vân Tử đã đưa bạn về cốc. Sinh lực được hồi phục.', tone: 'gold' });
  }

  toggleFlight() {
    this.toggleMeditation(false);
    this.player.flying = !this.player.flying;
    this.player.vy = 0;
    if (this.player.flying) this.player.y -= 30;
    this.emit('notice', { text: this.player.flying ? 'Ngự kiếm · Dùng W / S để lên xuống.' : 'Đã hạ kiếm · Space để khinh công.' });
  }

  toggleMeditation(value = !this.player.meditating) {
    this.player.meditating = value;
    if (value) {
      this.player.auto = false; this.player.flying = false; this.player.y = groundAt(this.player.x); this.player.vx = 0;
      this.emit('notice', { text: 'Tĩnh tâm nhập định. Hấp thu linh khí, hồi phục sinh lực và linh lực.', tone: 'jade' });
    }
  }

  usePotion(spirit = false) {
    const p = this.player, key = spirit ? 'spiritPotions' : 'potions', stat = spirit ? 'mp' : 'hp', max = spirit ? p.maxMp : p.maxHp;
    if (!p[key]) { this.emit('notice', { text: 'Đã hết đan dược. Có thể mua thêm từ thương nhân.' }); return false; }
    if (this.potionCooldown > 0) { this.emit('notice', { text: 'Đợi đan dược hồi lại.' }); return false; }
    if (p[stat] >= max) { this.emit('notice', { text: spirit ? 'Linh lực đang đầy.' : 'Sinh lực đang đầy.' }); return false; }
    const amount = Math.min(max - p[stat], max * 0.6);
    p[stat] += amount; p[key]--; this.potionCooldown = 2;
    this.emit('damage', { x: p.x, y: p.y - 75, amount: Math.round(amount), healing: true });
    this.emit('notice', { text: `Đã dùng ${spirit ? 'Tụ Linh Đan' : 'Hồi Xuân Đan'}.`, tone: 'jade' });
    return true;
  }

  claimQuest() {
    if (!this.quest.claimed && this.quest.kills >= 3) {
      this.quest.claimed = true; this.player.jade += 80; this.player.xp += 150;
      this.emit('notice', { text: 'Nhận thưởng: +80 linh thạch · +150 tu vi. Tiên lộ tiếp tục!', tone: 'gold' });
      return true;
    }
    if (this.quest.claimed && this.quest.bossKilled && !this.quest.bossClaimed) {
      this.quest.bossClaimed = true; this.player.jade += 250; this.player.xp += 500;
      this.emit('notice', { text: 'Linh Vương đã bại! +250 linh thạch · +500 tu vi.', tone: 'gold' });
      return true;
    }
    return false;
  }

  breakthrough() {
    const p = this.player, required = this.xpRequired;
    if (p.level >= MAX_LEVEL) return this.reject('Đã đạt Thần Cảnh tầng 9, viên mãn đại đạo.');
    if (this.tribulation?.active) return this.reject('Hãy hoàn thành lôi kiếp đang diễn ra.');
    if (p.xp < required || p.jade < this.breakthroughCost) return this.reject(`Cần ${required} tu vi và ${this.breakthroughCost} linh thạch để đột phá.`);
    if (p.level % 9 === 0) return this.startTribulation();
    p.jade -= this.breakthroughCost;
    this.advanceRealm(required);
    return true;
  }

  teleport(index) {
    if (!ZONES[index]) return false;
    if (this.tribulation?.active) return this.reject('Không thể dịch chuyển khi đang độ kiếp.');
    const p = this.player;
    p.x = ZONES[index].x; p.y = groundAt(p.x) - 50; p.flying = true; p.meditating = false; p.auto = false; p.vy = 0; p.invulnerable = 2;
    this.emit('cast', { id: 'heal', x: p.x, y: p.y, facing: 1 });
    this.emit('notice', { text: `Đã đến ${ZONES[index].name}.`, tone: 'jade' });
    return true;
  }

  buy(spirit = false) {
    const cost = spirit ? 120 : 80;
    if (this.player.coins < cost) { this.emit('notice', { text: 'Chưa đủ đồng để mua đan dược.' }); return false; }
    this.player.coins -= cost;
    this.player[spirit ? 'spiritPotions' : 'potions']++;
    this.emit('notice', { text: `Đã mua ${spirit ? 'Tụ Linh Đan' : 'Hồi Xuân Đan'}.`, tone: 'jade' });
    return true;
  }
}
Object.defineProperties(Game.prototype, Object.getOwnPropertyDescriptors(expansionMethods));
