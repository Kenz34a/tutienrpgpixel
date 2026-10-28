import { groundAt } from '../game/world.js';
import { drawCharacter, rect, polygon } from '../game/art.js';

const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
const BLUE='#75c8ff',WHITE='#e5faff';
const snap=n=>Math.round(n/2)*2;
function stroke(c,points,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='bevel';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(snap(x),snap(y)):c.moveTo(snap(x),snap(y)));c.stroke();}
function glint(c,x,y,s=5){rect(c,x-s,y-1,s*2,2,WHITE);rect(c,x-1,y-s,2,s*2,WHITE);}
function ring(c,x,y,r,color=BLUE){c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(x,y,r,r*.18,0,0,TAU);c.stroke();}

// A tapered ribbon follows the blade's path. Each band shares the same head.
function crescent(c,x,y,rx,ry,from,to,progress,alpha=1,width=13){
  const head=clamp(progress),tail=Math.max(0,head-.64);
  if(head<=0)return;
  c.save();c.translate(x,y);c.globalAlpha*=alpha;
  for(const [band,color]of[[1.35,'#3279d833'],[1, '#479aeda0'],[.53,'#9bdcff'],[.16,WHITE]]){
    const outer=[],inner=[];
    for(let i=0;i<=28;i++){
      const f=i/28,t=tail+(head-tail)*f,a=from+(to-from)*t,w=Math.sin(f*Math.PI*.8)*width*band;
      outer.push([snap(Math.cos(a)*(rx+w)),snap(Math.sin(a)*(ry+w*.55))]);
      inner.unshift([snap(Math.cos(a)*(rx-w*.15)),snap(Math.sin(a)*(ry-w*.15))]);
    }
    polygon(c,[...outer,...inner],color);
  }
  const a=from+(to-from)*head;glint(c,Math.cos(a)*rx,Math.sin(a)*ry,4);c.restore();
}
function beam(c,start,end,y,thickness=17){
  const middle=start+(end-start)*.62;
  polygon(c,[[start,y-2],[middle,y-thickness],[end-24,y-thickness*.4],[end,y],[end-24,y+thickness*.4],[middle,y+thickness],[start,y+2]],'#468fe65e');
  polygon(c,[[start+4,y],[middle,y-thickness*.48],[end,y],[middle,y+thickness*.48]],BLUE);
  stroke(c,[[start,y],[end-5,y]],WHITE,2);
  stroke(c,[[start-35,y-9],[end-25,y-2]],'#83caff80',2);stroke(c,[[start-23,y+11],[end-33,y+3]],'#83caff80',2);
}
function dust(c,time,seed=0,count=12){
  for(let i=0;i<count;i++){const t=(time*1.2+i*.093)%1,x=Math.sin(i*4.71+seed)*90+t*100,y=-15-t*110+i%4*13;c.save();c.globalAlpha*=1-t;rect(c,x,y,2+i%2*2,2, i%3?BLUE:WHITE);c.restore();}
}
export function isSwordEffect(kind){return kind==='attack'||kind.startsWith('wind-');}

export function drawSwordTechnique(c,e,{reducedMotion=false,particles=true}={}){
  const kind=e.effect??e.id,age=e.age,f=e.facing??1,ground=groundAt(e.x)-e.y;
  c.save();c.translate(snap(e.x),snap(e.y));c.scale(f,1);c.globalAlpha=clamp((e.life-age)*5);
  if(kind==='attack'){
    const combo=e.combo??1,contact=combo===2?.07:.08,t=(age-contact)/.19;
    if(age<contact){glint(c,24,-103,3);c.restore();return;}
    if(combo===1)crescent(c,17,-62,89,76,-1.7,.72,t,clamp((.4-age)*7));
    else if(combo===2)crescent(c,35,-57,106,78,.92,-1.25,t,clamp((.41-age)*7));
    else{crescent(c,16,-55,118,49,-2.6,2.5,t,clamp((.47-age)*6),19);crescent(c,16,-50,100,42,-2.6,2.5,t-.15,.4,10);}
    if(particles)dust(c,age,e.seed,7);
  }else if(kind==='wind-edge'){
    if(age<.13){glint(c,30,-100,4);c.restore();return;}
    const p=clamp((age-.13)/.3),end=105+p*365;
    c.globalAlpha*=clamp((.8-age)*3);
    beam(c,95,end,-62,18);
    crescent(c,85,-62,26,43,-1.2,1.2,p,.7,6);
    if(particles)dust(c,age,e.seed,15);
  }else if(kind==='wind-step'){
    if(!reducedMotion)for(let i=4;i>0;i--){c.save();c.globalAlpha*=.09*(5-i);drawCharacter(c,-i*37,0,{frame:8,facing:1,scale:1.12});c.restore();}
    for(let i=0;i<6;i++)stroke(c,[[-175,-75+i*13],[30,-77+i*13]],i%2?'#9bdfff90':'#427fe24c',2);
    crescent(c,35,-58,98,70,-1.5,1,(age-.14)/.2,1,16);
  }else if(kind==='wind-wheel'){
    crescent(c,17,-62,102,69,.8,-2.2,(age-.13)/.2,clamp((.55-age)*5),15);
    drawCyclone(c,145,ground,age,reducedMotion,particles);
  }else if(kind==='wind-wall'){
    ring(c,120,ground,100*clamp(age*6),'#b4e9ff');
    for(let i=0;i<8;i++)glint(c,35+i*23,ground-((age*160+i*21)%150),2);
  }else if(kind==='wind-final'){
    const beats=[.18,.42,.7,1.02];
    if(!reducedMotion)for(let i=0;i<3;i++){if(age>beats[i]){c.save();c.globalAlpha*=.2;drawCharacter(c,25+i*38,0,{frame:[5,6,7][i],facing:1,scale:1.12});c.restore();}}
    crescent(c,45,-62,100,77,-1.6,.9,(age-beats[0])/.17,clamp((.55-age)*6),15);
    if(age>beats[1])crescent(c,93,-57,120,84,1,-1.5,(age-beats[1])/.18,clamp((.8-age)*5),16);
    if(age>beats[2]&&age<1.1)beam(c,100,170+clamp((age-.7)/.2)*300,-62,20);
    if(age>beats[3]){
      const p=clamp((age-1.02)/.35);crescent(c,155,-66,174,106,-2.9,2.8,p,1,22);
      drawCyclone(c,185,ground,age-1.02,reducedMotion,particles,.8);
    }
    if(particles)dust(c,age,e.seed,17);
  }
  c.restore();
}

function drawCyclone(c,x,ground,age,reduced,particles,scale=1){
  const growth=clamp(age*4),fade=clamp((1.65-age)*3),turn=reduced?0:age*8;
  c.save();c.translate(x,ground);c.scale(scale,scale);c.globalAlpha*=fade*growth;
  ring(c,0,0,80,'#83cfff');
  for(let layer=0;layer<4;layer++){
    const points=[];
    for(let i=0;i<38;i++){const t=i/37,a=t*TAU*1.9+turn+layer*.65,h=t*174,r=20+t*36;points.push([Math.cos(a)*r,-h+Math.sin(a)*r*.2]);}
    stroke(c,points,layer%2?'#59a8ed70':'#a7e8ff',layer%2?8:3);
  }
  for(let i=0;i<3;i++)crescent(c,0,-35-i*51,40+i*12,10,-Math.PI,Math.PI*1.2,((age*2+i*.3)%1),.8,5);
  if(particles)for(let i=0;i<12;i++){const a=i*2.6+turn,r=55+i%3*9;glint(c,Math.cos(a)*r,-(i*17+age*65)%170,2);}
  c.restore();
}

export function drawWindBarrier(c,wall,time,reduced=false){
  const remaining=wall.until-time;if(remaining<=0)return;
  const ground=groundAt(wall.x),age=4.5-remaining;
  c.save();c.translate(wall.x,ground);c.globalAlpha=clamp(age*6)*clamp(remaining*3);
  ring(c,0,0,108,'#8dccff');
  for(let i=0;i<9;i++){
    const x=-90+i*23,h=112+i%3*18,pulse=reduced?0:Math.sin(time*5+i)*5;
    polygon(c,[[x-9,0],[x-5,-h*.67],[x+2,-h-18-pulse],[x+7,-h*.62],[x+10,0]],'#4e9cde43');
    stroke(c,[[x,0],[x+3,-h*.6],[x+2,-h-18-pulse]],'#c5f3ff',2);
    stroke(c,[[x-5,0],[x-4,-h*.65],[x+2,-h-15-pulse]],'#68beff90',5);
    glint(c,x+2,-h-8-pulse,3);
  }
  for(let i=0;i<4;i++)stroke(c,[[-105,-15-i*27],[0,-23-i*27],[105,-15-i*27]],'#7cc5ee3a',2);
  c.restore();
}
