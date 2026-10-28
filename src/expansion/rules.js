import { CONTENT_BY_ID, EQUIPMENT, GEAR_SLOTS, MAPS, MATERIALS, MONSTERS, BOSSES, NPCS, QUESTS, TECHNIQUES, PILLS, ROOTS, RACES, SECTS, MAX_LEVEL, realmAt, tierAtLevel, RECIPE_BY_OUTPUT } from './content.js';
import { SKILLS, groundAt, WORLD_WIDTH } from '../game/world.js';
import { beginAction } from '../game/choreography.js';

const bounded=(v,fallback=0,max=1e12)=>Number.isFinite(v)?Math.max(0,Math.min(max,v)):fallback;
const integer=(v,fallback=0,max=1e9)=>Math.floor(bounded(v,fallback,max));
const owns=(g,id)=>!!CONTENT_BY_ID.get(id)&&g.bag[id]>0;

export function initializeExpansion(g){
  Object.assign(g.player,{fairy:0,divine:0,merit:0,race:'human',root:'mixed',sect:null,rootTraining:0,castPose:0,shield:0});
  g.mapId=MAPS[0].id;g.bag=Object.fromEntries(MATERIALS.filter(m=>m.tier===1).map(m=>[m.id,m.base<18?12:6]));
  Object.assign(g.bag,{'starter-sword':1,'starter-robe':1,'starter-jade':1,'manual-tech-4-2-0':1,'manual-tech-5-7-0':1,'manual-tech-7-4-0':1});
  g.equipment={weapon:'starter-sword',armor:'starter-robe',accessory:'starter-jade',head:null,boots:null,artifact:null};
  g.enhancements={};g.learned=Object.keys(SKILLS).filter(id=>id!=='attack');g.loadout=['swords','flame','heal','storm'];
  g.questLog={};g.visited=[g.mapId];g.buffs={};g.talked=[];g.nodeTimers={};g.projectiles=[];g.companions=[];g.hazards=[];g.tribulation=null;g.dashTimer=0;g.dashCooldown=0;g.killCount=0;g.entropy=89431;
  g.makeMapObjects();
}

export function restoreExpansion(g,saved){
  const e=saved.expansion;
  if(!e||e.version!==1){g.refreshStats();return;}
  const p=g.player;
  p.fairy=integer(e.fairy);p.divine=integer(e.divine);p.merit=integer(e.merit);p.rootTraining=integer(e.rootTraining,0,5);
  if(RACES.some(r=>r.id===e.race))p.race=e.race;
  if(ROOTS.some(r=>r.id===e.root))p.root=e.root;
  if(SECTS.some(r=>r.id===e.sect))p.sect=e.sect;
  g.time=bounded(e.clock,0,1e9);g.killCount=integer(e.killCount);g.entropy=integer(e.entropy,89431,4294967295);
  if(e.bag&&typeof e.bag==='object')g.bag=Object.fromEntries(Object.entries(e.bag).filter(([id,n])=>CONTENT_BY_ID.has(id)&&Number.isFinite(n)&&n>0).map(([id,n])=>[id,integer(n,0,999999)]));
  for(const slot of Object.keys(GEAR_SLOTS))if(e.equipment?.[slot]===null)g.equipment[slot]=null;else if(owns(g,e.equipment?.[slot])&&CONTENT_BY_ID.get(e.equipment[slot]).slot===slot)g.equipment[slot]=e.equipment[slot];
  // Starter gear cannot disappear when migrating an incomplete save.
  for(const [slot,id]of Object.entries(g.equipment))if(id&&!owns(g,id)){g.bag[id]=1;g.equipment[slot]=id;}
  if(e.enhancements&&typeof e.enhancements==='object')g.enhancements=Object.fromEntries(Object.entries(e.enhancements).filter(([id])=>owns(g,id)&&CONTENT_BY_ID.get(id).kind==='equipment').map(([id,n])=>[id,integer(n,0,10)]));
  if(Array.isArray(e.learned))g.learned=[...new Set([...g.learned,...e.learned.filter(id=>CONTENT_BY_ID.get(id)?.kind==='techniques'&&CONTENT_BY_ID.get(id).requiredLevel<=p.level)])];
  if(Array.isArray(e.loadout)&&e.loadout.length===4)g.loadout=e.loadout.map((id,i)=>g.learned.includes(id)?id:g.loadout[i]);
  if(e.questLog&&typeof e.questLog==='object')g.questLog=Object.fromEntries(Object.entries(e.questLog).filter(([id,q])=>CONTENT_BY_ID.get(id)?.kind==='quests'&&q&&typeof q==='object').map(([id,q])=>[id,{progress:bounded(q.progress,0,CONTENT_BY_ID.get(id).objective.required),claimed:q.claimed===true}]));
  g.visited=Array.isArray(e.visited)?[...new Set(e.visited.filter(id=>CONTENT_BY_ID.get(id)?.kind==='maps'))]:[MAPS[0].id];
  g.talked=Array.isArray(e.talked)?e.talked.filter(id=>CONTENT_BY_ID.get(id)?.kind==='npcs'):[];
  const allowedBuffs=['attack','crit','speed','regen','insight','resist','loot'];
  if(e.buffs&&typeof e.buffs==='object')for(const [id,remaining]of Object.entries(e.buffs))if(allowedBuffs.includes(id)&&Number.isFinite(remaining)&&remaining>0)g.buffs[id]=g.time+Math.min(remaining,360);
  if(e.nodeTimers&&typeof e.nodeTimers==='object')for(const [id,remaining]of Object.entries(e.nodeTimers))if(/^map-\d+-\d+:\d+$/.test(id)&&Number.isFinite(remaining))g.nodeTimers[id]=g.time+bounded(remaining,0,60);
  const map=CONTENT_BY_ID.get(e.mapId);if(map?.kind==='maps'&&map.requiredLevel<=p.level)g.mapId=map.id;
  g.makeMapObjects();g.refreshStats();
  p.hp=Math.max(1,Math.min(p.maxHp,bounded(saved.player?.hp,p.maxHp)));p.mp=Math.min(p.maxMp,bounded(saved.player?.mp,p.maxMp));
  p.shield=bounded(e.shield,0,p.maxHp*2);
  if(e.tribulation?.active&&p.level%9===0&&p.level<MAX_LEVEL)g.tribulation={active:true,wave:integer(e.tribulation.wave,0,8),next:bounded(e.tribulation.next,2,3),cost:integer(e.tribulation.cost),xp:integer(e.tribulation.xp),total:9};
}

export function serializeExpansion(g){
  const p=g.player;
  return {version:1,mapId:g.mapId,clock:g.time,entropy:g.entropy,fairy:p.fairy,divine:p.divine,merit:p.merit,race:p.race,root:p.root,sect:p.sect,rootTraining:p.rootTraining,shield:p.shield,bag:{...g.bag},equipment:{...g.equipment},enhancements:{...g.enhancements},learned:[...g.learned],loadout:[...g.loadout],questLog:structuredClone(g.questLog),visited:[...g.visited],talked:[...g.talked],killCount:g.killCount,buffs:Object.fromEntries(Object.entries(g.buffs).map(([id,end])=>[id,Math.max(0,end-g.time)])),nodeTimers:Object.fromEntries(Object.entries(g.nodeTimers).filter(([,end])=>end>g.time).map(([id,end])=>[id,end-g.time])),tribulation:g.tribulation?{...g.tribulation}:null};
}

export const expansionMethods={
  get activeMap(){return CONTENT_BY_ID.get(this.mapId)??MAPS[0];},
  get realm(){return realmAt(this.player.level);},
  get race(){return RACES.find(r=>r.id===this.player.race)??RACES[0];},
  get root(){return ROOTS.find(r=>r.id===this.player.root)??ROOTS[0];},
  get sect(){return SECTS.find(r=>r.id===this.player.sect);},
  get stats(){
    const stats={attack:0,defense:0,hp:0,mp:0,speed:0,crit:this.race.crit??0};
    for(const id of Object.values(this.equipment)){const item=CONTENT_BY_ID.get(id);if(item)for(const [key,v]of Object.entries(item.stats??{}))stats[key]=(stats[key]??0)+v*(1+(this.enhancements[id]??0)*.12);}
    return stats;
  },
  get cultivationRate(){return 8*this.activeMap.tier**2.2*(this.race.cultivation??1)*(this.root.element?1.12:1)*(1+this.player.rootTraining*.05)*(this.buffActive('insight')?1.2:1);},
  get attackMultiplier(){return (1+(this.player.level-1)*.22+this.stats.attack/40)*this.race.attack*(this.buffActive('attack')?1.3:1);},
  gearAffinity(element){return Object.values(this.equipment).reduce((sum,id)=>{const item=CONTENT_BY_ID.get(id);return sum+(item&& !id.startsWith('starter-')&&item.element===element?item.tier*.015*(1+(this.enhancements[id]??0)*.1):0);},0);},
  get movementSpeed(){return (this.player.flying?270:200)*(this.race.speed??1)*(this.buffActive('speed')?1.35:1)+this.stats.speed;},
  get breakthroughCost(){return 50*Math.max(1,this.realm.index+1);},
  get nearby(){
    const p=this.player;
    const npc=this.npcs.find(n=>Math.abs(n.x-p.x)<125&&Math.abs(groundAt(n.x)-p.y)<180);
    if(npc)return{kind:'npc',id:npc.id,label:`Trò chuyện với ${npc.name}`,x:npc.x};
    const node=this.nodes.find(n=>Math.abs(n.x-p.x)<100&&Math.abs(n.y-p.y)<170&&!(this.nodeTimers[n.id]>this.time));
    if(node)return{kind:'gather',id:node.id,label:`${node.material.base<12?'Hái':'Thu thập'} ${node.material.name}`,x:node.x};
    if(Math.abs(p.x-3210)<150)return{kind:'portal',label:'Mở Cửu Thiên Linh Cảnh Đồ',x:3210};
    return null;
  },
  random(){this.entropy=(Math.imul(this.entropy,1664525)+1013904223)>>>0;return this.entropy/4294967296;},
  buffActive(id){return (this.buffs[id]??0)>this.time;},
  refreshStats(){const p=this.player,stats=this.stats;p.maxHp=Math.round((1240+(p.level-1)*180+stats.hp)*this.race.hp);p.maxMp=Math.round(380+(p.level-1)*40+stats.mp);p.hp=Math.min(p.hp,p.maxHp);p.mp=Math.min(p.mp,p.maxMp);},
  skillDefinition(id){return SKILLS[id]??(CONTENT_BY_ID.get(id)?.kind==='techniques'?CONTENT_BY_ID.get(id):null);},
  makeMapObjects(){
    const map=this.activeMap,t=map.tier,defs=MONSTERS.filter(m=>m.mapId===map.id),boss=BOSSES.find(b=>b.mapId===map.id);
    this.enemies=[1020,1320,1680,1980,2260,2600,3090,3520].map((x,i)=>{const d=defs[i%6];return{id:i,contentId:d.id,x,homeX:x,y:groundAt(x),hp:d.hp,maxHp:d.hp,damage:d.damage,xp:d.xp,alive:true,respawn:0,attackCooldown:0,hit:0,kind:i%3===2?'fox':'wood',name:map.id===MAPS[0].id?(i%3===2?'Linh Hồ':'Mộc Yêu'):d.name.split(' · ')[0],element:d.element,statuses:{},tier:t};});
    this.enemies.push({id:8,contentId:boss.id,x:4320,homeX:4320,y:650,hp:boss.hp,maxHp:boss.hp,damage:boss.damage,xp:boss.xp,alive:true,respawn:0,attackCooldown:0,specialCooldown:6,hit:0,kind:'boss',form:['fox','tree','tiger','scorpion','dragon','phoenix','ghost','serpent','thunder','crane','void','god'][map.biome],name:boss.name,element:boss.element,statuses:{},tier:t});
    this.npcs=NPCS.filter(n=>n.mapId===map.id);
    const bases=[map.biome%12,12+map.biome%6,(map.biome+2)%12,(map.biome+5)%12,12+(map.biome+2)%6,18+map.biome%6,(map.biome+8)%12,12+(map.biome+4)%6,18+(map.biome+3)%6,(map.biome+10)%12];
    this.nodes=[610,1160,1480,1860,2350,2730,3080,3470,3900,4810].map((x,i)=>({id:`${map.id}:${i}`,x,y:groundAt(x),material:CONTENT_BY_ID.get(`mat-${t}-${bases[i]}`)}));
    this.hazards=[];this.projectiles=[];this.companions=[];this.windBarrier=null;this.windStepRecastUntil=0;this.player.action=null;
  },
  travel(id){
    const map=CONTENT_BY_ID.get(id),p=this.player;
    if(!map||map.kind!=='maps')return false;
    if(this.tribulation?.active)return this.reject('Đang độ kiếp, không thể rời linh cảnh.');
    if(p.level<map.requiredLevel)return this.reject(`Cần ${realmAt(map.requiredLevel).name} để vào linh cảnh này.`);
    this.mapId=id;this.makeMapObjects();this.visited=[...new Set([...this.visited,id])];p.x=560;p.y=570;p.flying=true;p.auto=false;p.meditating=false;p.invulnerable=2;
    this.progressQuests('visit',id);this.emit('travel',{mapId:id});this.emit('notice',{text:`${map.world} · ${map.name} · Tài nguyên bậc ${map.tier}`,tone:'jade'});return true;
  },
  reject(text){this.emit('notice',{text});return false;},
  addItem(id,count=1){if(!CONTENT_BY_ID.has(id)||!Number.isFinite(count)||count<=0)return false;this.bag[id]=Math.min(999999,(this.bag[id]??0)+Math.floor(count));return true;},
  gather(id){
    const node=this.nodes.find(n=>n.id===id),p=this.player;
    if(!node||Math.abs(node.x-p.x)>110||Math.abs(node.y-p.y)>180||this.nodeTimers[id]>this.time)return false;
    const count=this.buffActive('loot')?4:2;this.addItem(node.material.id,count);this.nodeTimers[id]=this.time+30;
    this.progressQuests('gather',node.material.id,count);this.emit('cast',{id:'gather',effect:'lotus',x:node.x,y:node.y,facing:1,color:node.material.color});
    this.emit('notice',{text:`Thu được ${node.material.name} ×${count}.`,tone:'jade'});return true;
  },
  interact(){
    const near=this.nearby;
    if(!near)return this.reject('Đến gần NPC, linh thảo, khoáng thạch hoặc cổ trận để tương tác.');
    if(near.kind==='gather')return this.gather(near.id);
    if(near.kind==='npc'){this.currentNPCId=near.id;this.talked=[...new Set([...this.talked,near.id])];this.progressQuests('talk',near.id);return'npc';}
    return'atlas';
  },
  equip(id){
    const item=CONTENT_BY_ID.get(id);
    if(!item?.slot||!owns(this,id))return this.reject('Bạn chưa sở hữu trang bị này.');
    if(this.player.level<item.requiredLevel)return this.reject('Cảnh giới chưa đủ để sử dụng trang bị.');
    this.equipment[item.slot]=id;this.refreshStats();this.emit('notice',{text:`Trang bị ${item.name}.`,tone:'jade'});return true;
  },
  enhance(id){
    const item=CONTENT_BY_ID.get(id),level=this.enhancements[id]??0;
    if(!owns(this,id)||item.kind!=='equipment'||id.startsWith('starter-'))return this.reject('Hãy chọn pháp khí chế tạo hoặc nhặt được để cường hóa.');
    if(level>=10)return this.reject('Pháp khí đã cường hóa tối đa +10.');
    const cost=20*item.tier*(level+1),material=`mat-${item.tier}-${12+item.base%6}`,amount=level+1;
    if(this.player.jade<cost||(this.bag[material]??0)<amount)return this.reject(`Cần ${cost} linh thạch và ${amount} ${CONTENT_BY_ID.get(material).name}.`);
    this.player.jade-=cost;this.bag[material]-=amount;this.enhancements[id]=level+1;this.refreshStats();this.emit('notice',{text:`Cường hóa thành công ${item.name} +${level+1}.`,tone:'gold'});return true;
  },
  craft(id){
    const recipe=RECIPE_BY_OUTPUT.get(id),item=CONTENT_BY_ID.get(id),p=this.player;
    if(!recipe||!item)return false;
    if(p.level<recipe.requiredLevel)return this.reject('Cảnh giới chưa đủ để sử dụng lò luyện bậc này.');
    if(p.coins<recipe.coins||recipe.ingredients.some(i=>(this.bag[i.id]??0)<i.count))return this.reject('Chưa đủ nguyên liệu hoặc đồng. Xem công thức bên dưới vật phẩm.');
    // Check everything before mutating: failed crafts never consume ingredients.
    p.coins-=recipe.coins;for(const i of recipe.ingredients)this.bag[i.id]-=i.count;this.addItem(id,recipe.count);
    this.progressQuests(recipe.kind==='pill'?'craft-pill':'craft-gear',id);
    this.emit('notice',{text:`${recipe.kind==='pill'?'Luyện đan':'Rèn khí'} thành công: ${item.name}.`,tone:'gold'});return true;
  },
  buyContent(id,merit=false){
    const item=CONTENT_BY_ID.get(id),p=this.player;
    if(!item||!['equipment','manuals','pills','materials'].includes(item.kind)||id.startsWith('starter-'))return false;
    if(p.level<(item.requiredLevel??1))return this.reject('Cảnh giới chưa đủ để giao dịch vật phẩm này.');
    if(merit&&!p.sect)return this.reject('Hãy gia nhập tông môn để dùng công hiến.');
    const key=merit?'merit':'jade',cost=merit?Math.max(10,Math.round(item.value/2)):item.value;
    if(p[key]<cost)return this.reject(`Cần ${cost} ${merit?'công hiến':'linh thạch'}.`);
    p[key]-=cost;this.addItem(id);this.emit('notice',{text:`Đã nhận ${item.name}.`,tone:'jade'});return true;
  },
  useItem(id){
    const item=CONTENT_BY_ID.get(id),p=this.player;
    if(!owns(this,id))return this.reject('Vật phẩm không có trong túi.');
    if(item.kind==='manuals')return this.learn(item.skillId);
    if(item.kind==='equipment')return this.equip(id);
    if(item.kind!=='pills')return false;
    if(p.level<item.requiredLevel)return this.reject('Cảnh giới chưa đủ để hấp thu đan dược.');
    if(this.potionCooldown>0)return this.reject('Đợi đan dược hồi lại.');
    if(item.effect==='heal'&&p.hp>=p.maxHp)return this.reject('Sinh lực đang đầy.');
    if(item.effect==='mana'&&p.mp>=p.maxMp)return this.reject('Linh lực đang đầy.');
    if(item.effect==='root'&&p.rootTraining>=5)return this.reject('Linh căn đã được dưỡng đủ 5 lần.');
    this.bag[id]--;this.potionCooldown=2;
    switch(item.effect){
      case'heal':p.hp=Math.min(p.maxHp,p.hp+p.maxHp*(.45+item.tier*.05));break;
      case'mana':p.mp=Math.min(p.maxMp,p.mp+p.maxMp*(.45+item.tier*.05));break;
      case'xp':p.xp+=100*item.tier**2.5;break;
      case'shield':p.shield=Math.min(p.maxHp*2,p.shield+p.maxHp*(.45+item.tier*.05));break;
      case'root':p.rootTraining=Math.min(5,p.rootTraining+Math.max(1,Math.floor(item.tier/3)));break;
      case'insight':p.xp+=40*item.tier**2;this.buffs.insight=this.time+60+item.tier*30;break;
      default:this.buffs[item.effect]=this.time+60+item.tier*30;
    }
    this.emit('cast',{id:'heal',x:p.x,y:p.y,facing:1});this.emit('notice',{text:`Đã dùng ${item.name}.`,tone:'jade'});return true;
  },
  learn(id){
    const skill=CONTENT_BY_ID.get(id),book=`manual-${id}`;
    if(skill?.kind!=='techniques'||!owns(this,book))return this.reject('Cần sở hữu bí tịch để lĩnh ngộ kiếm quyết.');
    if(this.learned.includes(id))return this.reject('Bạn đã lĩnh ngộ chiêu thức này.');
    if(this.player.level<skill.requiredLevel)return this.reject('Cảnh giới chưa đủ để lĩnh ngộ bí tịch.');
    this.bag[book]--;this.learned.push(id);this.progressQuests('learn',id);this.emit('notice',{text:`Lĩnh ngộ thành công ${skill.name}. Mở Kiếm quyết để gắn phím.`,tone:'gold'});return true;
  },
  equipSkill(id,slot){
    slot=Number(slot);if(!Number.isInteger(slot)||slot<0||slot>3||!this.learned.includes(id))return false;
    const previous=this.loadout.indexOf(id);if(previous!==-1)this.loadout[previous]=this.loadout[slot];this.loadout[slot]=id;return true;
  },
  chooseRace(id){
    const race=RACES.find(r=>r.id===id),p=this.player;if(!race||p.race===id)return false;
    const cost=p.race==='human'?0:200;if(p.jade<cost)return this.reject('Cần 200 linh thạch để đổi huyết mạch.');
    p.jade-=cost;p.race=id;this.refreshStats();this.emit('notice',{text:`Thức tỉnh huyết mạch ${race.name}.`,tone:'gold'});return true;
  },
  chooseRoot(id){
    const root=ROOTS.find(r=>r.id===id),p=this.player;if(!root||root.id==='mixed'||p.root===id)return false;
    const cost=p.root==='mixed'?0:200;if(p.jade<cost)return this.reject('Cần 200 linh thạch để tẩy linh căn.');
    p.jade-=cost;p.root=id;this.emit('notice',{text:`Thức tỉnh ${root.name}.`,tone:'gold'});return true;
  },
  joinSect(id){
    const sect=SECTS.find(s=>s.id===id),p=this.player;if(!sect||p.sect===id)return false;
    const cost=p.sect?500:0;if(p.jade<cost)return this.reject('Cần 500 linh thạch để chuyển tông môn.');
    p.jade-=cost;if(p.sect)p.merit=0;p.sect=id;this.emit('notice',{text:`Bái nhập ${sect.name}. Hoàn thành tiên duyên để tích công hiến.`,tone:'gold'});return true;
  },
  exchange(type,quantity=1){
    if(![1,10].includes(quantity))return false;
    const rates={fairy:['jade','fairy',1000,1],divine:['fairy','divine',100,1],jade:['fairy','jade',1,900],fairyBack:['divine','fairy',1,90]},rate=rates[type];
    if(!rate)return false;const[from,to,cost,amount]=rate,p=this.player;
    if(p[from]<cost*quantity)return this.reject('Chưa đủ linh thạch để quy đổi.');
    p[from]-=cost*quantity;p[to]+=amount*quantity;this.emit('notice',{text:'Quy đổi linh thạch thành công.',tone:'jade'});return true;
  },
  acceptQuest(id){
    const q=CONTENT_BY_ID.get(id);if(q?.kind!=='quests'||this.questLog[id])return false;
    if(CONTENT_BY_ID.get(q.mapId).requiredLevel>this.player.level)return this.reject('Chưa mở cảnh giới của tiên duyên này.');
    if(Object.values(this.questLog).filter(q=>!q.claimed).length>=8)return this.reject('Tối đa 8 tiên duyên đang nhận. Hoàn thành hoặc hủy bớt.');
    this.questLog[id]={progress:0,claimed:false};if(q.objective.type==='visit'&&q.mapId===this.mapId)this.progressQuests('visit',this.mapId);
    this.emit('notice',{text:`Đã nhận: ${q.name}.`,tone:'jade'});return true;
  },
  abandonQuest(id){if(this.questLog[id]&&!this.questLog[id].claimed){delete this.questLog[id];return true;}return false;},
  progressQuests(type,target,count=1){
    for(const[id,state]of Object.entries(this.questLog)){
      const q=CONTENT_BY_ID.get(id);if(state.claimed||q.mapId!==this.mapId||q.objective.type!==type||!(q.objective.target==='any'||q.objective.target===target)||state.progress>=q.objective.required)continue;
      state.progress=Math.min(q.objective.required,state.progress+count);
      if(state.progress>=q.objective.required)this.emit('notice',{text:`Tiên duyên hoàn thành: ${q.name}.`,tone:'gold'});
    }
  },
  claimSideQuest(id){
    const q=CONTENT_BY_ID.get(id),state=this.questLog[id];if(!q||!state||state.claimed||state.progress<q.objective.required)return false;
    state.claimed=true;const r=q.rewards,p=this.player;p.xp+=Math.round(r.xp*this.race.questXp);p.jade+=r.jade;p.coins+=r.coins;if(p.sect)p.merit+=r.merit;
    for(const item of r.materials)this.addItem(item.id,item.count);
    this.emit('notice',{text:`Nhận thưởng: +${r.jade} linh thạch · +${r.xp} tu vi${p.sect?` · +${r.merit} công hiến`:''}.`,tone:'gold'});return true;
  },
  grantDrops(enemy){
    this.killCount++;const t=this.activeMap.tier,base=enemy.id%6,amount=this.buffActive('loot')?4:2;
    this.addItem(`mat-${t}-${18+base}`,amount);
    this.progressQuests(enemy.kind==='boss'?'boss':'kill',enemy.contentId??'any');
    if(enemy.kind==='boss'){
      const eligibleGear=EQUIPMENT.filter(g=>g.tier===t&&g.rarity==='Cực Phẩm');
      const gear=eligibleGear[Math.floor(this.random()*eligibleGear.length)];
      this.addItem(gear.id);const grade=t>=10?2:t>=7?1:0,skill=TECHNIQUES.find(s=>s.form===this.activeMap.biome%48&&s.tier===grade+1);this.addItem(`manual-${skill.id}`);
      if(t>=7)this.player.fairy+=t-5;if(t>=10)this.player.divine++;
      this.emit('notice',{text:`Boss rơi: ${gear.name} · ${skill.name} bí tịch.`,tone:'gold'});
    }else if(this.killCount%4===0){const items=EQUIPMENT.filter(g=>g.tier===t);this.addItem(items[Math.floor(this.random()*items.length)].id);}
  },
  damageEnemy(enemy,damage,skill={}){
    if(!enemy.alive)return;let amount=Math.max(1,Math.round(damage*(enemy.statuses?.vulnerable>this.time?1.2:1)));
    enemy.hp=Math.max(0,enemy.hp-amount);enemy.hit=.2;this.emit('damage',{x:enemy.x,y:enemy.y-(enemy.kind==='boss'?115:60),amount,critical:skill.effect==='storm'});if(enemy.hp<=0)this.defeatEnemy(enemy);
  },
  damagePlayer(amount,{tribulation=false,element=null}={}){
    const p=this.player;if(p.invulnerable>0)return;
    let damage=Math.max(1,Math.round((amount-this.stats.defense*.35)*(1-Math.min(.65,this.gearAffinity(element)*1.5))));if(tribulation&&this.buffActive('resist'))damage=Math.round(damage*.5);
    if(this.windBarrier?.until>this.time&&Math.abs(p.x-this.windBarrier.x)<200)damage=Math.max(1,Math.round(damage*.55));
    const absorbed=Math.min(p.shield,damage);p.shield-=absorbed;damage-=absorbed;
    p.hp-=damage;p.invulnerable=.65;
    if(damage>0)this.emit('damage',{x:p.x,y:p.y-75,amount:damage,player:true});
    if(p.hp<=0)this.revive();
  },
  dash(){
    if(this.dashCooldown>0||this.player.meditating)return false;
    this.dashCooldown=2;this.dashTimer=.2;this.player.invulnerable=.35;beginAction(this.player,'dash',this.time);this.emit('cast',{id:'dash',effect:'dash',owner:'player',x:this.player.x,y:this.player.y,facing:this.player.facing});return true;
  },
  startTribulation(){
    const p=this.player;if(this.tribulation?.active)return this.reject('Lôi kiếp đang diễn ra.');
    if(p.level%9!==0||p.level>=MAX_LEVEL||p.xp<this.xpRequired||p.jade<this.breakthroughCost)return this.reject('Chưa đủ tu vi và linh thạch để dẫn động lôi kiếp.');
    const cost=this.breakthroughCost;p.jade-=cost;p.meditating=false;p.auto=false;
    this.tribulation={active:true,wave:0,next:2,total:9,cost,xp:this.xpRequired};this.emit('notice',{text:'CỬU TRỌNG THIÊN KIẾP · Né vùng sét báo trước. Sống sót qua 9 lượt để phá cảnh!',tone:'gold'});return true;
  },
  advanceRealm(required){
    const p=this.player;p.xp=Math.max(0,p.xp-required);p.level++;this.refreshStats();p.hp=p.maxHp;p.mp=p.maxMp;
    this.progressQuests('breakthrough','any');this.emit('cast',{id:'breakthrough',x:p.x,y:p.y,facing:1});this.emit('notice',{text:`Đột phá thành công! ${this.realm.name} · Tầng ${this.realm.stage}`,tone:'gold'});
  },
  stepExpansion(dt){
    const p=this.player;p.castPose=Math.max(0,p.castPose-dt);this.dashCooldown=Math.max(0,this.dashCooldown-dt);this.dashTimer=Math.max(0,this.dashTimer-dt);
    if(this.windBarrier?.until<=this.time)this.windBarrier=null;
    if(this.windBarrier)for(const enemy of this.enemies)if(enemy.alive&&Math.abs(enemy.x-this.windBarrier.x)<85)enemy.statuses.slowUntil=this.time+.15;
    p.mp=Math.min(p.maxMp,p.mp+6*(this.race.regen-1)*dt);
    if(this.buffActive('regen')){p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.015*dt);p.mp=Math.min(p.maxMp,p.mp+p.maxMp*.03*dt);}
    for(const enemy of this.enemies){
      enemy.statuses??={};
      if(enemy.alive&&enemy.statuses.dotUntil>this.time){enemy.statuses.dotClock=(enemy.statuses.dotClock??0)+dt;if(enemy.statuses.dotClock>=.5){enemy.statuses.dotClock-=.5;this.damageEnemy(enemy,enemy.statuses.dotDamage??10);}}
      if(enemy.kind==='boss'&&enemy.alive){
        enemy.specialCooldown=(enemy.specialCooldown??6)-dt;
        if(enemy.specialCooldown<=0&&Math.abs(p.x-enemy.x)<650){
          const enraged=enemy.hp<enemy.maxHp*.5,pattern=this.activeMap.biome%4;enemy.specialCooldown=enraged?4.5:7;
          const offsets=pattern===0?(enraged?[-160,0,160]:[-100,100]):pattern===1?[-140,0,140]:pattern===2?[0]:[-180,-60,60,180];
          for(const offset of offsets)this.hazards.push({x:Math.max(35,Math.min(WORLD_WIDTH-35,p.x+offset)),y:groundAt(p.x),radius:pattern===2?90:62,delay:pattern===2?1:1.25,damage:(enemy.damage??145)*(enraged?1.25:1),age:0,tribulation:false,element:enemy.element,charge:pattern===2?enemy.id:null});
          this.emit('notice',{text:`${enemy.name}${enraged?' cuồng nộ':' tụ lực'} · ${['Linh diễm','Địa mạch','Xung kích','Pháp trận'][pattern]}! Né vùng báo trước.`});
        }
      }
    }
    for(const projectile of this.projectiles){projectile.delay-=dt;if(projectile.delay<=0)for(const e of this.enemies)if(e.alive&&Math.abs(e.x-projectile.x)<(projectile.radius??230)&&(projectile.y===undefined||Math.abs(e.y-projectile.y)<200)&&(projectile.originX===undefined||(e.x-projectile.originX)*projectile.facing>=-35)){
      this.damageEnemy(e,projectile.damage,projectile.skill);
      if(projectile.finisher&&e.alive){e.statuses.airborneUntil=this.time+.65;e.statuses.airborneStarted=this.time;e.x=Math.max(35,Math.min(WORLD_WIDTH-35,e.x+projectile.facing*55));}
    }}
    this.projectiles=this.projectiles.filter(p=>p.delay>0);
    for(const clone of this.companions){clone.life-=dt;clone.next-=dt;clone.x+=(p.x+clone.offset-clone.x)*Math.min(1,dt*5);clone.y=p.y;if(clone.next<=0){clone.next=.9;const target=this.enemies.find(e=>e.alive&&Math.abs(e.x-clone.x)<450);if(target){this.damageEnemy(target,clone.damage);this.emit('cast',{id:'attack',x:clone.x,y:clone.y,facing:Math.sign(target.x-clone.x)||1});}}}
    this.companions=this.companions.filter(c=>c.life>0);
    if(this.tribulation?.active){const tr=this.tribulation;tr.next-=dt;if(tr.next<=0&&tr.wave<9){tr.wave++;tr.next=2.4;const offsets=tr.wave<4?[0]:tr.wave<7?[-90,90]:[-140,0,140];for(const offset of offsets)this.hazards.push({x:Math.max(40,Math.min(WORLD_WIDTH-40,p.x+offset)),y:groundAt(p.x),radius:65,delay:1.25,damage:p.maxHp*.22,age:0,tribulation:true});this.emit('notice',{text:`Lôi kiếp ${tr.wave} / 9 · Di chuyển để né sét!`,tone:'gold'});}
      if(tr.wave===9&&tr.next<.5&&!this.hazards.some(h=>h.tribulation)){this.tribulation=null;this.advanceRealm(tr.xp);}
    }
    for(const hazard of this.hazards){hazard.age+=dt;if(hazard.age>=hazard.delay&&!hazard.resolved){hazard.resolved=true;this.emit('cast',{id:'lightning',effect:hazard.tribulation||hazard.element==='thunder'?'storm':hazard.element==='ice'?'ice':hazard.element==='fire'?'flame':'lotus',x:hazard.x,y:hazard.y,facing:1});if(hazard.charge!==null&&hazard.charge!==undefined){const enemy=this.enemies.find(e=>e.id===hazard.charge);if(enemy?.alive)enemy.x=hazard.x;}if(Math.abs(p.x-hazard.x)<hazard.radius)this.damagePlayer(hazard.damage,{tribulation:hazard.tribulation,element:hazard.tribulation?'thunder':hazard.element});}}
    this.hazards=this.hazards.filter(h=>h.age<h.delay+.4);
  },
};
