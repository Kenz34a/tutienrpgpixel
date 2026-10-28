import { drawCharacter, drawSword, pixelCircle, polygon, rect } from '../game/art.js';
import { groundAt } from '../game/world.js';
import { drawSpellSprite } from './assets.js';
import { isSwordEffect, drawSwordTechnique } from './sword-effects.js';

const TAU=Math.PI*2;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>1-(1-clamp(n))**3;
const noise=(seed,i)=>{const n=Math.sin(seed*12.9898+i*78.233)*43758.5453;return n-Math.floor(n);};
export const EFFECT_LIFETIMES={attack:.42,swords:1.6,flame:1.65,storm:1.4,dragon:1.75,ice:1.7,vortex:1.8,shield:1.6,meteor:1.6,clone:1.5,blades:1.9,lotus:1.7,heal:1.6,dash:.38,impact:.38,breakthrough:2.1};
export const EFFECT_COLORS={attack:'#8cf7ed',swords:'#96e7ff',flame:'#ffb95b',storm:'#c3a3ff',dragon:'#77edff',ice:'#9ce8ff',vortex:'#b39bff',shield:'#ffe3a1',meteor:'#ffc16f',clone:'#8ce4de',blades:'#ffe6b3',lotus:'#efacf3',heal:'#a0f4bd',dash:'#a0e9ef',impact:'#ffe1a3',breakthrough:'#ffe6ad'};

function line(c,points,color,width=2){c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.stroke();}
function ellipse(c,x,y,rx,ry,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,TAU);c.stroke();}
function arc(c,x,y,r,from,to,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(1,r),from,to);c.stroke();}
function glow(c,x,y,r,color){c.save();c.globalCompositeOperation='lighter';for(const [size,alpha]of[[1,.025],[.75,.045],[.45,.065]]){c.globalAlpha*=alpha;pixelCircle(c,x,y,r*size,color,4);c.globalAlpha/=alpha;}c.restore();}
function star(c,x,y,size,color='#f3f8e5'){rect(c,x-size,y-1,size*2+2,2,color);rect(c,x-1,y-size,2,size*2+2,color);if(size>5){rect(c,x-2,y-2,4,4,'#fffce4');}}
function sparks(c,seed,t,color,count=24,rx=180,ry=140){
  for(let i=0;i<count;i++){
    const a=noise(seed,i)*TAU,s=.3+noise(seed,i+60)*.7,p=(t+noise(seed,i+90)*.4)%1,x=Math.cos(a)*rx*p*s,y=Math.sin(a)*ry*p*s;
    c.save();c.globalAlpha*=Math.sin(p*Math.PI);
    if(i%5===0)star(c,x,y,2+noise(seed,i+30)*3,color);else rect(c,x,y,2+i%2*2,2+i%3*2,color);c.restore();
  }
}
export function drawSigil(c,x,y,r,rotation,color='#9de8e2',stretch=.32){
  c.save();c.translate(x,y);c.scale(1,stretch);c.rotate(rotation);
  ellipse(c,0,0,r,r,color,2);ellipse(c,0,0,r*.83,r*.83,color+'8c',2);
  for(let i=0;i<8;i++){
    const a=i*TAU/8,px=Math.cos(a)*r*.67,py=Math.sin(a)*r*.67;
    c.save();c.translate(px,py);c.rotate(a+Math.PI/2);
    line(c,[[-4,-5],[4,-5],[4,0],[-4,0],[-4,5],[4,5]],color,2);
    if(i%2)line(c,[[0,-8],[0,8]],color,2);c.restore();
  }
  const points=Array.from({length:4},(_,i)=>[Math.cos(i*TAU/4)*r*.45,Math.sin(i*TAU/4)*r*.45]);
  line(c,[...points,points[0]],color+'a0',2);c.rotate(Math.PI/4);line(c,[...points,points[0]],color+'70',2);
  c.restore();
}

function sword(c,x,y,length=110,angle=0,alpha=1){
  c.save();c.globalAlpha*=alpha;
  if(!drawSpellSprite(c,4,x,y,length*.43,length,{angle}))drawSword(c,x,y,length/75,Math.PI/2+angle,'#eefaff');
  c.restore();
}
function bloom(c,seed,t,color,r=90){
  glow(c,0,0,r,color);ellipse(c,0,0,r*ease(t*1.3),r*.3*ease(t*1.3),color+'aa',3);
  for(let i=0;i<10;i++){const a=i*TAU/10+seed,x=Math.cos(a)*r*ease(t),y=Math.sin(a)*r*ease(t)*.6;line(c,[[x*.6,y*.6],[x,y]],i%2?'#fff9e8':color,2+i%3);}
}
function lightning(c,seed,x,top,bottom,t){
  const points=[[x,top]],steps=11;
  for(let i=1;i<=steps;i++)points.push([x+(noise(seed+Math.floor(t*12),i)-.5)*48,top+(bottom-top)*i/steps]);
  line(c,points,'#8258d24d',18);line(c,points,'#bd8dff',7);line(c,points,'#f2dfff',3);
  for(const j of [3,6]){const [sx,sy]=points[j];line(c,[[sx,sy],[sx+45,sy+18],[sx+24,sy+44]],'#c4a0ff',2);}
}

export function drawSpell(c,e,{time=0,reducedMotion=false,particles=true}={}){
  if(isSwordEffect(e.effect??e.id))return drawSwordTechnique(c,e,{time,reducedMotion,particles});
  const t=clamp(e.age/e.life),kind=e.effect??e.id,color=EFFECT_COLORS[kind]??'#abe9ce',f=e.facing??1;
  const alpha=clamp(t*12)*clamp((1-t)*4),turn=reducedMotion?0:time;
  const ground=groundAt(e.x+f*160)-e.y+35,seed=e.seed??1;
  c.save();c.translate(Math.round(e.x),Math.round(e.y-35));c.globalAlpha=alpha;

  if(kind==='attack'){
    c.scale(f,1);const sweep=ease(t);
    glow(c,55,-24,95,color);
    c.save();c.translate(45,-27);c.rotate(-.5+sweep*.9);
    if(!drawSpellSprite(c,3,0,0,195,170)){arc(c,0,0,75,-1.5,1.1,color,11);arc(c,0,0,78,-1.5,1.1,'#f7fff4',3);}c.restore();
    for(let i=0;i<6;i++){const x=35+noise(seed,i)*110;line(c,[[x-18,-55+i*14],[x+10,-61+i*14]],color+'a0',2);}
  }else if(kind==='swords'){
    const target=f*175;
    drawSigil(c,target,ground,165*ease(t*6),turn*.5,color);
    glow(c,target,ground-50,180,color);
    for(let i=0;i<11;i++){
      const local=(t-i*.035)*2.1;if(local<0)continue;
      const progress=clamp(local),x=f*(15+i*36),end=ground-20,y=-310+progress*(end+310);
      if(local<1.15){line(c,[[x,y-95],[x,y-20]],'#50a7dd80',10);line(c,[[x,y-100],[x,y-16]],'#c3f5ff',2);sword(c,x,y,100+(i%3)*17,0,clamp((1.15-local)*6));}
      if(local>.8&&local<1.45){const impact=clamp((local-.8)/.65);c.save();c.translate(x,ground);c.globalAlpha*=1-impact;bloom(c,seed+i,impact,color,28+impact*22);c.restore();}
    }
  }else if(kind==='dragon'||kind==='flame'){
    const dragon=kind==='dragon',progress=ease(Math.max(0,(t-.1)/.9)),x=f*(95+progress*265),y=-45+Math.sin(t*5)*14;
    drawSigil(c,0,ground,75*ease(t*7),-turn*.65,color);
    glow(c,x,y,145,color);
    if(!reducedMotion)for(let i=3;i>=1;i--){c.save();c.globalAlpha*=.035*(4-i);drawSpellSprite(c,dragon?0:1,x-f*i*30,y+i*3,dragon?420:350,dragon?280:255,{facing:f});c.restore();}
    for(let i=0;i<6;i++){const offset=(t*200+i*31)%180;line(c,[[x-f*(100+offset),y-15+i*13],[x-f*(25+offset),y-20+i*13]],i%2?color+'a0':color+'50',2+i%2*2);}
    if(!drawSpellSprite(c,dragon?0:1,x,y,dragon?420:350,dragon?280:255,{facing:f,wave:reducedMotion?0:dragon?5:7,phase:turn*8})){
      c.save();c.translate(x,y);c.scale(f,1);polygon(c,[[-70,0],[-30,-20],[25,-24],[60,-8],[40,10],[10,28],[-35,17]],color);c.restore();
    }
    c.save();c.translate(x-f*30,y);sparks(c,seed,t*1.3,color,particles?30:6,140,95);c.restore();
  }else if(kind==='storm'){
    drawSigil(c,0,ground,220*ease(t*5),turn*.3,color);
    for(let i=0;i<5;i++){
      const local=t-i*.045;if(local<.08)continue;
      const x=-205+i*103;c.save();c.globalAlpha*=reducedMotion?.8:.7+Math.sin(t*35+i)*.3;
      lightning(c,seed+i,x,-340,ground-5,reducedMotion?0:t);glow(c,x,ground-15,75,color);
      ellipse(c,x,ground,45*ease(local*4),10,color,3);star(c,x,ground-6,9,'#f4e4ff');c.restore();
    }
    c.save();c.translate(0,ground-40);sparks(c,seed,t,color,particles?35:8,260,170);c.restore();
  }else if(kind==='ice'){
    drawSigil(c,0,ground,210*ease(t*6),turn*.12,color);
    for(let i=0;i<5;i++){
      const growth=ease((t-i*.035)*5),x=-200+i*100,h=(110+i%2*55)*growth;
      glow(c,x,ground-h*.5,60,color);
      if(!drawSpellSprite(c,5,x,ground-h*.4,130,h*1.6))polygon(c,[[x-25,ground],[x-21,ground-h+18],[x,ground-h],[x+21,ground-h+18],[x+25,ground]],'#b9f0ff');
      line(c,[[x-40,ground+4],[x-14,ground-5],[x+15,ground+5],[x+45,ground-2]],'#9de1f2',2);
    }
    c.save();c.translate(0,ground-90);sparks(c,seed,t,color,particles?32:7,245,130);c.restore();
  }else if(kind==='vortex'){
    c.translate(f*165,-25);const growth=ease(t*5);
    glow(c,0,0,165,color);drawSigil(c,0,ground+25,155*growth,-turn*.7,color,.34);
    const rendered=drawSpellSprite(c,6,0,0,335*growth,260*growth,{angle:-turn*.65});
    if(!rendered)pixelCircle(c,0,0,53*growth,'#17132f',3);
    if(!rendered)for(let arm=0;arm<4;arm++){
      const points=[];for(let i=0;i<48;i++){const a=arm*TAU/4+i*.14-turn*2,r=(10+i*2.6)*growth;points.push([Math.cos(a)*r,Math.sin(a)*r*.7]);}
      line(c,points,arm%2?'#9774db90':'#4c9dbba0',9);line(c,points,arm%2?'#d3afff':'#92eaf1',2);
    }
    ellipse(c,0,0,37*growth,31*growth,'#ecd9ff',3);
    for(let i=0;i<18;i++){const a=i*2.4-turn*2,r=70+noise(seed,i)*80;star(c,Math.cos(a)*r,Math.sin(a)*r*.72,2+i%3,color);}
  }else if(kind==='heal'||kind==='lotus'){
    const healing=kind==='heal',x=healing?0:f*150,y=healing?ground-32:ground-64,size=(healing?215:295)*(.75+ease(t*5)*.25);
    drawSigil(c,x,ground,healing?105:155,turn*(healing?.3:-.2),color);
    glow(c,x,y,healing?130:180,color);
    if(!drawSpellSprite(c,2,x,y,size,size*.86,{tint:healing?'#5de9a844':''})){
      for(let i=0;i<9;i++){c.save();c.translate(x,y);c.rotate(i*TAU/9);polygon(c,[[0,0],[-20,-35],[0,-85],[20,-35]],color);c.restore();}
    }
    for(let i=0;i<(particles?26:8);i++){
      const p=(t*1.1+noise(seed,i))%1,px=x+(noise(seed,i+30)-.5)*220,py=ground-p*230;
      c.save();c.globalAlpha*=Math.sin(p*Math.PI);star(c,px,py,2+i%3,healing?'#c4ffce':'#ffddf8');c.restore();
    }
    if(!healing)ellipse(c,x,ground,100+ease(t)*100,20+ease(t)*20,'#f7c7f3',2);
  }else if(kind==='shield'){
    drawShield(c,0,-25,turn,1,color);drawSigil(c,0,ground,100,turn*.3,color);
    c.save();c.translate(0,-30);sparks(c,seed,t,color,particles?22:6,120,120);c.restore();
  }else if(kind==='meteor'){
    const target=f*220,impact=.5;
    drawSigil(c,target,ground,115*ease(t*6),turn*.2,color);
    if(t<impact){
      const p=clamp(t/impact),x=f*(430-p*210),y=-390+(ground+370)*p;
      for(let i=7;i>=0;i--){const r=24-i*2;c.save();c.globalAlpha*=1-i*.1;pixelCircle(c,x+f*i*15,y-i*24,r,i%2?'#ffb45d':'#f27b52',3);c.restore();}
      pixelCircle(c,x,y,24,'#855163',3);pixelCircle(c,x-5,y-7,17,'#ffc17a',3);star(c,x-6,y-9,8,'#fff4b7');
    }else{
      const p=clamp((t-impact)/(1-impact)),r=45+ease(p)*230;c.save();c.translate(target,ground);
      glow(c,0,-25,190,color);ellipse(c,0,0,r,r*.2,color,6*(1-p)+1);ellipse(c,0,0,r*.75,r*.15,'#fff0bd',2);
      if(!drawSpellSprite(c,7,0,-85,360*(.85+ease(p)*.3),260*(1-p*.2)))for(let i=0;i<12;i++){const x=(noise(seed,i)-.5)*170,h=(60+noise(seed,i+20)*180)*(1-p);polygon(c,[[x-15,0],[x-11,-h*.5],[x+2,-h],[x+8,-h*.55],[x+14,0]],i%2?'#ffb960':'#ffd792');}
      sparks(c,seed,p,'#ffdd9f',particles?36:8,260,160);c.restore();
    }
  }else if(kind==='clone'){
    for(let i=0;i<3;i++){
      const x=(i-1)*95;drawSigil(c,x,ground,50*ease(t*5),turn*.5,color);
      c.save();c.globalAlpha*=.55;drawCharacter(c,x,35,{time,facing:f,flying:true,casting:true});c.restore();
      for(let k=0;k<6;k++){const y=ground-((t*190+k*20)%160);rect(c,x-28+k*11,y,2,10,'#b1fff0');}
    }
  }else if(kind==='blades'){
    c.translate(f*150,0);drawSigil(c,0,ground,190,turn*.4,color);
    for(let i=0;i<12;i++){
      const a=i*TAU/12+turn*.5,r=180*ease(t*6),x=Math.cos(a)*r,y=ground-85+Math.sin(a)*65;
      line(c,[[x,y-45],[x,y+28]],'#e1e6b65c',5);sword(c,x,y,105,0);
    }
    ellipse(c,0,ground-85,180,65,color+'90',2);glow(c,0,ground-60,150,color);
    if(t>.45){for(let i=0;i<5;i++){const p=clamp((t-.45-i*.035)*3),x=-200+p*400,y=ground-70-i*12;c.save();c.rotate(-.14);sword(c,x,y,90,-Math.PI/2);c.restore();}}
  }else if(kind==='dash'){
    if(!reducedMotion)for(let i=5;i>0;i--){c.save();c.globalAlpha*=.32*(1-i/7);drawCharacter(c,-f*i*27,35,{time,facing:f,flying:true});c.restore();}
    for(let i=0;i<7;i++)line(c,[[-f*170,-45+i*12],[f*30,-50+i*12]],color+'9c',i%3===0?3:1);
  }else if(kind==='impact'){
    c.translate(0,35);bloom(c,seed,t,e.player?'#ff9dba':color,e.critical?65:38);
    if(t<.45){c.save();c.rotate(.7);star(c,0,0,17*(1-t),e.player?'#ffe0e9':'#fff9d9');c.restore();}
  }else{
    const r=80+ease(t)*120;drawSigil(c,0,ground,r,turn*.4,color);glow(c,0,-50,150,color);
    for(let i=0;i<8;i++){const a=i*TAU/8+turn*.4,x=Math.cos(a)*r*.8,y=-50+Math.sin(a)*r*.4;star(c,x,y,5,color);}
    c.save();c.translate(0,-50);sparks(c,seed,t,color,particles?30:7,180,200);c.restore();
  }
  c.restore();
}

export function drawShield(c,x,y,time,strength=1,color='#ffe3a1'){
  c.save();c.translate(x,y);c.globalAlpha*=strength;
  glow(c,0,0,100,color);
  const points=Array.from({length:7},(_,i)=>{const a=i*TAU/6-Math.PI/2;return[Math.cos(a)*63,Math.sin(a)*78];});
  line(c,points,color+'aa',2);ellipse(c,0,0,70,83,color+'4a',2);
  for(let i=0;i<6;i++){const a=i*TAU/6+time*.35;star(c,Math.cos(a)*70,Math.sin(a)*83,3,color);}
  polygon(c,[[0,-30],[-18,-21],[-15,7],[0,23],[15,7],[18,-21]],color+'34');
  line(c,[[0,-30],[-18,-21],[-15,7],[0,23],[15,7],[18,-21],[0,-30]],color,2);
  line(c,[[0,-19],[0,9],[-8,-5],[8,-5]],color,2);c.restore();
}
