import { WORLD_WIDTH, PLATFORMS, groundAt } from './model.js';
import { drawCharacter, drawEnemy, drawSword, pine, polygon, random, rect, pixelCircle } from './art.js';
import { createScenery } from '../pixel/scenery.js';
import { landscape, drawSpellSprite } from '../pixel/assets.js';
import { BIOMES } from '../expansion/content.js';
import { drawPixelText, pixelSky } from '../pixel/graphics.js';
import { drawSpell, drawSigil, drawShield, EFFECT_LIFETIMES, EFFECT_COLORS } from '../pixel/effects.js';
import { drawWindBarrier } from '../pixel/sword-effects.js';

const TAU = Math.PI * 2;
export class Renderer {
  constructor(canvas, game) {
    this.canvas=canvas;this.display=canvas.getContext('2d',{alpha:false});this.buffer=document.createElement('canvas');this.c=this.buffer.getContext('2d',{alpha:false});this.pixelSize=2;this.labels=[];this.game=game;
    this.camera={x:0,y:100};this.time=0;this.particles=[];this.effects=[];this.numbers=[];this.defeated=[];this.flightTrail=[];this.trailTimer=0;this.shake=0;this.castTitle=null;
    this.mapId=game.mapId;this.biome=BIOMES[game.activeMap.biome];this.scenery=createScenery(this.biome);this.flash=0;this.rng=random(434);this.ambient=Array.from({length:65},(_,i)=>({x:this.rng()*1800,y:this.rng()*900,s:1+this.rng()*2,speed:6+this.rng()*15,phase:this.rng()*TAU,petal:i%3===0}));
    this.resize();this.camera.x=Math.max(0,Math.min(WORLD_WIDTH-this.w,game.player.x-this.w*.44));
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
  }
  resize(){const r=this.canvas.getBoundingClientRect();this.h=720;this.w=Math.max(321,Math.ceil(r.width/r.height*this.h/this.pixelSize)*this.pixelSize);this.canvas.width=this.w;this.canvas.height=this.h;this.buffer.width=this.w/this.pixelSize;this.buffer.height=this.h/this.pixelSize;this.c.imageSmoothingEnabled=false;this.c.setTransform(1/this.pixelSize,0,0,1/this.pixelSize,0,0);this.display.imageSmoothingEnabled=false;this.canvas.dataset.pixelSize=this.pixelSize;this.canvas.dataset.renderWidth=this.buffer.width;this.canvas.dataset.renderHeight=this.buffer.height;}
  refreshArt(){this.scenery=createScenery(this.biome);this.skyKey=null;}
  onEvent(event){
    if(event.type==='cast'){
      const effect=event.effect??event.id;
      const martialLives={'wind-edge':.8,'wind-step':.5,'wind-wheel':1.5,'wind-wall':.8,'wind-final':1.65};
      this.effects.push({...event,effect,age:0,life:effect==='attack'&&event.combo===3?.48:martialLives[effect]??EFFECT_LIFETIMES[effect]??1.6,seed:this.rng()*1000});
      if(!this.game.settings.reducedMotion&&['storm','meteor','breakthrough'].includes(effect)){this.shake=Math.max(this.shake,3);this.flash=.045;}
      const titles={swords:'Vạn Kiếm Quy Tông',flame:'Phượng Hỏa',storm:'Thiên Lôi',dragon:'Thần Long Xuất Hải',ice:'Huyền Băng Vạn Lý',vortex:'Thôn Thiên Ma Vực',shield:'Kim Cang Bất Hoại',meteor:'Tinh Hà Trụy Lạc',clone:'Nhất Khí Hóa Tam Thanh',blades:'Tru Tiên Kiếm Trận',lotus:'Nộ Hải Phật Liên',heal:'Thanh Tâm Quyết',breakthrough:'Đột Phá Cảnh Giới'};
      if(titles[effect]&&this.game.skillDefinition(event.id))this.castTitle={text:titles[effect],color:EFFECT_COLORS[effect],age:0};
      if(effect.startsWith('wind-'))this.castTitle={text:this.game.skillDefinition(event.id)?.name??'',color:'#a4dfff',age:0};
      const count=this.game.settings.particles?(effect==='attack'?5:22):0;
      for(let n=0;n<count;n++)this.particles.push({x:event.x+(this.rng()-.5)*60,y:event.y-55+(this.rng()-.5)*60,vx:(this.rng()-.5)*160,vy:-this.rng()*100,life:.35+this.rng()*.55,age:0,color:EFFECT_COLORS[effect]??'#a5e7c0',s:2+Math.floor(this.rng()*2)*2});
    }
    if(event.type==='damage'){
      this.numbers.push({...event,age:0,life:1.05,x:event.x+(this.rng()-.5)*24});
      if(!event.healing){this.effects.push({...event,effect:'impact',age:0,life:.38,seed:this.rng()*1000});if(!this.game.settings.reducedMotion)this.shake=Math.max(this.shake,event.player?2:event.critical?3:1);}
    }
    if(event.type==='kill'){
      this.numbers.push({x:event.x,y:event.y-55,age:0,life:1.9,text:`+${event.xp} tu vi`,healing:true});
      const enemy=this.game.enemies.find(e=>!e.alive&&Math.abs(e.x-event.x)<2);
      if(enemy)this.defeated.push({enemy:{...enemy,hit:0},age:0,life:.45});
      for(let i=0;i<18;i++)this.particles.push({x:event.x,y:event.y-15,vx:(this.rng()-.5)*180,vy:-this.rng()*180,life:1.3,age:0,color:i%2?'#d9c17d':'#aed1a0',s:3});
    }
    this.effects=this.effects.slice(-40);this.numbers=this.numbers.slice(-45);this.defeated=this.defeated.slice(-14);
  }
  frame(dt){
    this.time+=dt;this.labels=[];const p=this.game.player,c=this.c;
    if(this.mapId!==this.game.mapId){this.mapId=this.game.mapId;this.biome=BIOMES[this.game.activeMap.biome];this.scenery=createScenery(this.biome);this.effects=[];this.particles=[];this.numbers=[];this.flightTrail=[];this.defeated=[];this.castTitle=null;}
    const targetX=Math.max(0,Math.min(WORLD_WIDTH-this.w,p.x-this.w*.44));
    const motion=this.game.settings.reducedMotion;
    this.camera.x+= (targetX-this.camera.x)*(motion?1:Math.min(1,dt*5));
    this.camera.y+=(Math.max(0,groundAt(p.x)-this.h*.735-Math.max(0,420-p.y)*.55)-this.camera.y)*Math.min(1,dt*2);
    this.camera.x=Math.max(0,this.camera.x);
    this.drawSky();
    this.shake=Math.max(0,this.shake-dt*17);const shake=motion?0:this.shake;
    c.save();c.translate(-Math.round(this.camera.x)+Math.round(Math.sin(this.time*75)*shake),-Math.round(this.camera.y)+Math.round(Math.cos(this.time*63)*shake*.55));
    this.drawWorldLights();
    c.drawImage(this.scenery,0,0,WORLD_WIDTH,1100);
    this.drawResources();this.drawHazards();
    if(this.game.windBarrier)drawWindBarrier(c,this.game.windBarrier,this.game.time,motion);
    this.drawPortal(3210,610);
    this.drawNPC();
    this.drawDummy(735,620);
    for(const e of this.game.enemies)if(e.alive&&e.x>this.camera.x-100&&e.x<this.camera.x+this.w+100){
      this.shadow(e.x,e.y,e.kind==='boss'?50:24);
      if(e.kind==='boss')this.glow(e.x,e.y-40,95,'#b69b5530');
      const remaining=(e.statuses?.airborneUntil??0)-this.game.time,total=(e.statuses?.airborneUntil??0)-(e.statuses?.airborneStarted??0);
      const airborne=remaining>0?Math.sin(Math.min(1,remaining/total)*Math.PI)*62:0;
      drawEnemy(c,airborne?{...e,y:e.y-airborne}:e,this.time);
      if((e.statuses?.frozen??0)>this.game.time){c.save();c.globalAlpha=.4;const size=e.kind==='boss'?150:85;drawSpellSprite(c,5,e.x,e.y-size*.35,size,size*1.1);c.restore();}
      this.drawEnemyLabel(airborne?{...e,y:e.y-airborne}:e);
    }
    for(const fallen of this.defeated){fallen.age+=dt;c.save();c.globalAlpha=Math.max(0,1-fallen.age/fallen.life)*.7;drawEnemy(c,{...fallen.enemy,y:fallen.enemy.y-fallen.age*35},this.time);c.restore();}this.defeated=this.defeated.filter(e=>e.age<e.life);
    this.shadow(p.x,groundAt(p.x),p.flying?35:23);
    this.drawFlightTrail(dt);
    if(p.meditating)this.drawMeditation(p);
    {
      c.save();if(p.invulnerable>0)c.globalAlpha=.9;
      this.glow(p.x,p.y-24,60,'#a4dba31a');
      drawCharacter(c,p.x,p.y+(p.flying&&!motion?Math.sin(this.time*3)*3:0),{time:this.time,actionTime:this.game.time,action:p.action,facing:p.facing,flying:p.flying,meditating:p.meditating,moving:Math.abs(p.vx)>0,scale:1.12,casting:p.castPose>0});
      c.restore();
    }
    for(const clone of this.game.companions){c.save();c.globalAlpha=.33;drawCharacter(c,clone.x,clone.y,{time:this.time,facing:p.facing,flying:p.flying,casting:true});c.restore();this.glow(clone.x,clone.y-40,45,'#a3d9d11c');}
    if(p.shield>0)drawShield(c,p.x,p.y-52,motion?0:this.time,.55);
    this.label('Lữ Khách',p.x,p.y-148,'#fff1ce',13);
    this.label(`〈 ${this.game.sect?.name??'Vân Du Tán Tu'} 〉`,p.x,p.y-164,'#9fe0dd',9);
    if(p.flying&&Math.abs(p.vx)>0&&this.game.settings.particles&&this.rng()>.35)this.particles.push({x:p.x-35*p.facing,y:p.y+8,vx:-p.facing*30,vy:5,life:.6,age:0,color:'#a9e9cb',s:2});
    this.drawEffects(dt);this.drawParticles(dt);this.drawNumbers(dt);
    c.restore();
    if(this.game.settings.particles&&!this.game.settings.reducedMotion)this.drawAmbient();
    this.drawForeground();
    if(this.flash>0){this.flash-=dt;c.fillStyle='#d8d1eb20';c.fillRect(0,0,this.w,this.h);}
    this.display.imageSmoothingEnabled=false;this.display.drawImage(this.buffer,0,0,this.w,this.h);
    for(const label of this.labels){this.display.globalAlpha=label.alpha;drawPixelText(this.display,label.text,label.x,label.y,label.color,label.size>=18?2:1);}this.display.globalAlpha=1;
    this.drawCastTitle(dt);
  }
  drawSky(){
    const c=this.c,w=this.w,h=this.h,cam=this.camera.x;
    const painting=landscape.image;
    if(['forest','bamboo','mountain','heaven'].includes(this.biome.type)&&painting.complete&&painting.naturalWidth){
      const scale=Math.max((w+100)/painting.naturalWidth,h/painting.naturalHeight),width=painting.naturalWidth*scale,height=painting.naturalHeight*scale;
      const offset=Math.min(width-w,cam*.025);
      c.drawImage(painting,Math.round(-offset/2)*2,Math.round((h-height)*.37/2)*2,width,height);
      c.fillStyle='#0b10284d';c.fillRect(0,0,w,h);
      for(let i=0;i<6;i++){c.fillStyle=`rgba(12,22,45,${.025+i*.025})`;c.fillRect(0,280+i*55,w,55);}
      for(let i=0;i<3;i++){const x=((this.time*6+i*450-cam*.04)%(w+600))-300,y=350+i*70;rect(c,x,y,210,2,'#a6cbdb15');rect(c,x+20,y+2,140,2,'#a6cbdb0a');}
      this.drawBirds();
      if(this.game.tribulation?.active){c.fillStyle='#25163870';c.fillRect(0,0,w,h);}
      return;
    }
    const skyKey=`${this.mapId}:${this.buffer.width}`;if(this.skyKey!==skyKey){this.skyKey=skyKey;this.sky=pixelSky(this.buffer.width,this.buffer.height,this.biome.sky);}c.drawImage(this.sky,0,0,w,h);
    const moonX=Math.round((940-cam*.025)/3)*3,moonY=144;
    pixelCircle(c,moonX,moonY,42,'#7a8a72',3);pixelCircle(c,moonX,moonY,36,'#e3d59c',3);pixelCircle(c,moonX+9,moonY-6,21,'#d5c992',3);rect(c,moonX-18,moonY+3,9,6,'#bebd8c');rect(c,moonX-6,moonY+18,12,3,'#bebd8c');
    for(const [layer,color,base,amp,speed]of [[0,'#4b706b',430,160,.035],[1,'#365d59',480,210,.075],[2,'#294f4b',520,170,.13]]){
      const points=[[-20,h]];
      for(let x=-20;x<w+40;x+=12){const wx=x+cam*speed;const ridge=Math.sin(wx*.004+layer*2)*.45+Math.sin(wx*.009+layer)*.29+Math.sin(wx*.016+3)*.15+Math.sin(wx*.037)*.07;points.push([x,Math.round((base-amp*ridge)/3)*3]);}
      points.push([w+40,h]);polygon(c,points,color);
      // Fine vertical stone faces in the far mountains.
      if(layer===1){c.globalAlpha=.12;for(let x=60;x<w;x+=97)rect(c,x-(cam*speed%97),350+Math.sin(x)*50,4,110,'#a6bc8a');c.globalAlpha=1;}
    }
    c.fillStyle='#a5b99b10';c.fillRect(0,390,w,24);c.fillRect(0,444,w,12);for(let x=0;x<w;x+=12)c.fillRect(x,384,6,6);
    // Forest silhouettes occupy a different parallax plane.
    const start=Math.floor(cam*.25/120)*120;
    if(!['desert','volcano','ocean','void','divine'].includes(this.biome.type))for(let x=start-120;x<cam*.25+w+120;x+=120){const height=120+(Math.sin(x*6.4)+1)*45;pine(c,x-cam*.25,560,height,this.biome.type==='snow'?['#476b70','#63848a','#8aa5a5']:['#244d48','#2a5149','#315a4d']);}
    this.drawFloatingIsland(1000-cam*.17,265,1);
    this.drawFloatingIsland(1530-cam*.12,188,.5);
    this.drawBirds();
    if(this.biome.type==='ocean'){for(let y=470;y<560;y+=9){c.fillStyle=y%2?'#6da0a14a':'#a1c9b72b';c.fillRect(0,y,w,3);}}
    if(this.game.tribulation?.active){c.fillStyle='#36254c35';c.fillRect(0,0,w,h);}
  }
  drawFloatingIsland(x,y,s){
    if(x< -200||x>this.w+200)return;
    const c=this.c;c.save();c.translate(Math.round(x),y);c.scale(s,s);
    polygon(c,[[-107,0],[-94,20],[-61,32],[-43,61],[-28,84],[-17,63],[1,101],[16,50],[52,32],[72,13],[107,0]],'#334f45');
    polygon(c,[[-84,10],[-50,14],[-24,65],[-24,29],[0,80],[15,29],[50,17],[89,4]],'#4d6550');
    rect(c,-105,-5,210,8,'#8a9c67');rect(c,-84,-9,171,4,'#a7b37e');
    // A tiny mountain pavilion.
    rect(c,-30,-72,60,64,'#344f44');rect(c,-25,-67,8,56,'#839174');rect(c,17,-67,8,56,'#839174');rect(c,-13,-64,26,53,'#263f3d');
    polygon(c,[[-57,-76],[-43,-86],[-14,-95],[0,-111],[15,-95],[44,-86],[58,-76],[41,-70],[-40,-70]],'#36574e');rect(c,-43,-76,86,4,'#9da67b');rect(c,-26,-96,54,4,'#738c6c');rect(c,-5,-112,10,5,'#a3ac7b');
    pine(c,-71,-9,73,['#375b4c','#41674f','#729063']);
    // Waterfall is deliberately translucent and broken into pixel streams.
    rect(c,47,4,13,230,'#b7dbc12e');rect(c,50,6,5,215,'#c4e5ce36');
    for(let i=0;i<11;i++){const wy=((this.time*55+i*29)%230);rect(c,48+i%4*3,wy+9,2,9+i%3*5,'#daf0d14a');}
    c.restore();
  }
  drawBirds(){const c=this.c;c.strokeStyle='#c3d5b28a';c.lineWidth=1.5;for(let i=0;i<5;i++){const x=(this.time*8+i*21+620)% (this.w+180)-80,y=145+i%3*9;const flap=Math.sin(this.time*4+i)*3;c.beginPath();c.moveTo(x-5,y+flap);c.lineTo(x,y);c.lineTo(x+5,y+flap);c.stroke();}}
  drawWorldLights(){
    for(const x of [440,670,950,1550,2100,2980,3550,3900])if(x>this.camera.x-100&&x<this.camera.x+this.w+100)this.glow(x,groundAt(x)-56,66,'#e3d29817');
    this.glow(360,565,100,'#b9da9324');
  }
  glow(x,y,r,color){const c=this.c;pixelCircle(c,Math.round(x/6)*6,Math.round(y/6)*6,Math.round(r/12)*6,color,6);}
  shadow(x,y,r){const c=this.c;c.fillStyle='#0c292d55';c.beginPath();c.ellipse(x,y-2,r,5,0,0,TAU);c.fill();}
  label(text,x,y,color='#d8d8b3',size=11){const m=this.c.getTransform();this.labels.push({text,x:(m.a*x+m.c*y+m.e)*this.pixelSize,y:(m.b*x+m.d*y+m.f)*this.pixelSize,color,size,alpha:this.c.globalAlpha});}
  drawNPC(){
    for(const n of this.game.npcs){const x=n.x,y=groundAt(x)-3;if(x<this.camera.x-90||x>this.camera.x+this.w+90)continue;this.shadow(x,groundAt(x),24);drawCharacter(this.c,x,y,{time:this.time,npc:true,scale:1.05,facing:n.roleIndex%2?-1:1,variant:n.roleIndex});this.label(n.name.split(' · ')[0],x,y-132,'#ffe5b3',12);this.label(n.role,x,y-118,'#b9bcdb',8);const bounce=Math.sin(this.time*2)*3;this.label('!',x,y-153+bounce,'#ffe092',27);}
  }
  drawResources(){
    const c=this.c;for(const node of this.game.nodes){if(node.x<this.camera.x-60||node.x>this.camera.x+this.w+60)continue;const ready=!(this.game.nodeTimers[node.id]>this.game.time),m=node.material,x=node.x,y=node.y;
      c.save();c.globalAlpha=ready?1:.25;
      if(m.base<12){for(let i=0;i<5;i++){const dir=i-2;polygon(c,[[x,y-2],[x+dir*7-4,y-12-Math.abs(dir)*2],[x+dir*8,y-22-Math.abs(dir)*3],[x+dir*8+4,y-11],[x+3,y-3]],i%2?'#5d9868':'#8bb17c');}rect(c,x-1,y-32,3,26,'#8fac74');for(let i=0;i<5;i++){const a=i*TAU/5;rect(c,x+Math.cos(a)*6-3,y-31+Math.sin(a)*5-2,6,5,m.color);}rect(c,x-1,y-33,3,3,'#f1e2b1');}
      else{polygon(c,[[x-16,y-2],[x-20,y-15],[x-8,y-33],[x,y-22],[x+7,y-40],[x+19,y-19],[x+14,y-1]],'#47756c');polygon(c,[[x-8,y-33],[x-5,y-8],[x+3,y-4],[x+7,y-40],[x+12,y-17]],m.color);rect(c,x+7,y-32,2,20,'#e5e7c6');}
      if(ready){this.glow(x,y-18,32,m.color+'25');const distance=Math.abs(this.game.player.x-x);if(distance>75&&distance<150)this.label(m.name,x,y-51,m.color,8);}else if(Math.abs(this.game.player.x-x)<100)this.label(`${Math.ceil(this.game.nodeTimers[node.id]-this.game.time)}s`,x,y-43,'#b1bea4',8);c.restore();
    }
  }
  drawHazards(){
    const c=this.c;for(const h of this.game.hazards){const progress=Math.min(1,h.age/h.delay),alpha=h.resolved?.2:.4+progress*.4;c.save();c.globalAlpha=alpha;c.fillStyle=h.tribulation?'#bfa1e338':'#e4b37a38';c.beginPath();c.ellipse(h.x,h.y-3,h.radius,18,0,0,TAU);c.fill();c.strokeStyle=h.tribulation?'#d4b4f0':'#f0bf89';c.lineWidth=2;c.beginPath();c.ellipse(h.x,h.y-3,h.radius,18,0,0,TAU);c.stroke();c.setLineDash([6,5]);c.beginPath();c.ellipse(h.x,h.y-3,h.radius*progress,18*progress,0,0,TAU);c.stroke();this.label('!',h.x,h.y-31,h.tribulation?'#e2caed':'#f3d3a0',23);c.restore();}
  }
  drawDummy(x,y){
    const c=this.c;rect(c,x-3,y-50,6,51,'#827b52');rect(c,x-16,y-47,32,6,'#96895e');rect(c,x-9,y-58,18,15,'#b6a176');rect(c,x-9,y-28,18,16,'#8c805b');rect(c,x-8,y-25,16,3,'#b4a576');rect(c,x-4,y-53,2,2,'#4c4c39');rect(c,x+3,y-53,2,2,'#4c4c39');this.label('Mộc nhân',x,y-70,'#a8ba9d',9);
  }
  drawPortal(x,y){
    if(x<this.camera.x-200||x>this.camera.x+this.w+200)return;
    const c=this.c;
    for(const d of [-88,88]){rect(c,x+d-16,y-139,32,139,'#405d4a');rect(c,x+d-11,y-137,7,134,'#7b8f68');rect(c,x+d-23,y-145,46,10,'#a3ad7e');rect(c,x+d-23,y-10,46,10,'#71845e');}
    this.glow(x,y-80,130,'#97d6a42f');c.save();c.translate(x,y-80);c.strokeStyle='#badba270';c.lineWidth=2;c.beginPath();c.ellipse(0,0,59,79,0,0,TAU);c.stroke();c.rotate(this.game.settings.reducedMotion?0:this.time*.1);c.setLineDash([9,12]);c.strokeStyle='#d5dfa570';c.beginPath();c.arc(0,0,67,0,TAU);c.stroke();c.restore();
    this.label('天 · 雲',x,y-67,'#c5d7a6',25);this.label('Thiên Vân Cổ Trận',x,y-182,'#d6d0a4',13);
  }
  drawEnemyLabel(e){
    const boss=e.kind==='boss',tall=boss&&['dragon','serpent','thunder','void','phoenix','crane'].includes(e.form),y=e.y-(boss?(tall?253:195):e.kind==='wood'?102:117),c=this.c,w=boss?145:52;
    this.label(e.name,e.x,y,boss?'#edd295':'#d4cdab',boss?13:9);
    rect(c,e.x-w/2-1,y+6,w+2,5,'#18312c');rect(c,e.x-w/2,y+7,w,3,'#5d4239');rect(c,e.x-w/2,y+7,w*e.hp/e.maxHp,3,boss?'#c29961':'#ac795e');
  }
  drawMeditation(p){
    const c=this.c,motion=this.game.settings.reducedMotion,turn=motion?0:this.time;
    drawSigil(c,p.x,p.y-2,88,turn*.22,'#a1e8d1',.3);
    c.save();c.globalAlpha=.65;drawSpellSprite(c,2,p.x,p.y-13,142,94,{tint:'#63e4b955'});c.restore();
    if(this.game.settings.particles&&!motion)for(let i=0;i<10;i++){
      const phase=this.time*.8+i*.7;rect(c,p.x+Math.sin(phase)*43,p.y-((this.time*30+i*21)%155),2,4,'#c7f3d6');
    }
  }
  drawEffects(dt){
    const options={time:this.time,reducedMotion:this.game.settings.reducedMotion,particles:this.game.settings.particles};
    for(const effect of this.effects){effect.age+=dt;if(effect.owner==='player'&&['attack','wind-step','wind-edge','wind-wheel'].includes(effect.effect)){effect.x=this.game.player.x;effect.y=this.game.player.y;}drawSpell(this.c,effect,options);}
    this.effects=this.effects.filter(e=>e.age<e.life);
  }
  drawFlightTrail(dt){
    const p=this.game.player,c=this.c;
    this.trailTimer+=dt;
    if(!this.game.settings.reducedMotion&&this.game.settings.particles&&p.flying&&Math.abs(p.vx)>70&&this.trailTimer>.045){
      this.trailTimer=0;this.flightTrail.push({x:p.x,y:p.y,facing:p.facing,age:0});
    }
    for(const trace of this.flightTrail){
      trace.age+=dt;c.save();c.globalAlpha=Math.max(0,1-trace.age/.27)*.17;
      drawCharacter(c,trace.x,trace.y,{time:this.time,facing:trace.facing,flying:true,scale:1.12});c.restore();
    }
    this.flightTrail=this.flightTrail.filter(t=>t.age<.27).slice(-7);
    if(p.flying){
      const speed=Math.abs(p.vx),length=30+Math.min(70,speed*.25);
      if(!this.game.settings.reducedMotion)for(let i=0;i<3;i++){const offset=(this.time*130+i*28)%80;c.save();c.globalAlpha=.35-i*.08;rect(c,p.x-p.facing*(length+offset),p.y+7+i*4,length-i*8,2,'#90e5ed');c.restore();}
      drawSigil(c,p.x,p.y+12,28,0,'#a0e4df',.17);
    }
  }
  drawCastTitle(dt){
    const title=this.castTitle;if(!title)return;
    title.age+=dt;if(title.age>1.6){this.castTitle=null;return;}
    const c=this.display,scale=this.w>750?2:1,width=Math.min(this.w-50,title.text.length*8*scale+30),height=scale*22,x=(this.w-width)/2,y=this.w>750?132:290;
    c.save();c.globalAlpha=Math.min(1,title.age*10,(1.6-title.age)*4);
    c.fillStyle='#11172dce';c.fillRect(Math.round(x),y,width,height);
    c.fillStyle=title.color;c.fillRect(Math.round(x+width*.2),y+height-2,Math.round(width*.6),2);
    drawPixelText(c,title.text,this.w/2,y+height-7,title.color,scale);c.restore();
  }
  drawParticles(dt){
    const c=this.c;for(const p of this.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;c.globalAlpha=Math.max(0,1-p.age/p.life);rect(c,p.x,p.y,p.s,p.s,p.color);}c.globalAlpha=1;this.particles=this.particles.filter(p=>p.age<p.life).slice(-200);
  }
  drawNumbers(dt){
    const c=this.c;for(const n of this.numbers){n.age+=dt;c.globalAlpha=Math.max(0,Math.min(1,(n.life-n.age)*3));this.label(n.text??`${n.healing?'+':n.player?'−':''}${n.amount}${n.critical?'!':''}`,n.x,n.y-n.age*45,n.healing?'#c5e4a1':n.player?'#efaa91':n.critical?'#f7de98':'#f2e8c4',n.text?11:n.critical?24:19);}c.globalAlpha=1;this.numbers=this.numbers.filter(n=>n.age<n.life);
  }
  drawAmbient(){
    const c=this.c;for(const a of this.ambient){const x=((a.x-this.camera.x*.6+Math.sin(this.time*.4+a.phase)*25-this.time*a.speed*.25)%(this.w+100)+(this.w+100))%(this.w+100)-50,y=(a.y+this.time*a.speed)%(this.h+80)-40;
      if(a.petal){c.globalAlpha=.4;rect(c,x,y,a.s*2,a.s,this.biome.type==='snow'?'#dfecdf':this.biome.type==='volcano'?'#e3ae72':'#d6a8b3');rect(c,x+1,y+1,2,2,this.biome.type==='snow'?'#f1f1df':'#e4bdbe');}
      else{c.globalAlpha=.25+Math.sin(this.time*1.5+a.phase)**2*.6;rect(c,x,y,a.s,a.s,'#dae6a5');if(a.s>2)this.glow(x,y,12,'#ddeaaa15');}
    }c.globalAlpha=1;
  }
  drawForeground(){
    const c=this.c;
    c.fillStyle='#0a102340';c.fillRect(0,this.h-54,this.w,54);
  }
  drawMinimap(canvas){
    const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,p=this.game.player;
    c.fillStyle='#17213b';c.fillRect(0,0,w,h);
    const r=random(8);for(let i=0;i<24;i++){const x=r()*w,y=24+r()*25;polygon(c,[[x-13,y+13],[x-4,y-13],[x,y-20],[x+3,y-11],[x+11,y+13]],i%2?'#303b60':'#273451');}
    for(const terrain of PLATFORMS){const x=terrain.x/WORLD_WIDTH*w,width=terrain.w/WORLD_WIDTH*w,y=62+(terrain.y-620)*.08;rect(c,x,y,width,h-y,'#242a44');rect(c,x,y,width,2,'#71b7ae');}
    c.fillStyle='#e0c887';c.fillRect(p.x/WORLD_WIDTH*w-2,47,4,8);c.fillStyle='#f5e7aa';c.fillRect(p.x/WORLD_WIDTH*w-1,45,2,2);
    for(const e of this.game.enemies)if(e.alive)rect(c,e.x/WORLD_WIDTH*w,59+(e.y-620)*.08,2,2,e.kind==='boss'?'#e6b675':'#b29069');
    c.strokeStyle='#c8d8a530';c.strokeRect(this.camera.x/WORLD_WIDTH*w,11,this.w/WORLD_WIDTH*w,h-18);
    for(const x of [360,3210])rect(c,x/WORLD_WIDTH*w,52,3,5,'#a1cdac');
  }
}
