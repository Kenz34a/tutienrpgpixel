import { drawSwordsman, terrainTexture } from './assets.js';
import { drawSwordTechnique, drawWindBarrier } from './sword-effects.js';
import { actionName } from '../game/choreography.js';

export function drawSwordPreview(canvas,time,settings={}){
  const c=canvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;
  c.fillStyle='#101e31';c.fillRect(0,0,480,150);c.save();c.scale(.5,.5);
  c.fillStyle='#18344b';for(let i=0;i<6;i++)c.fillRect(0,100+i*28,960,9);
  c.fillStyle='#426a83';c.fillRect(0,248,960,2);
  if(terrainTexture.image.complete&&terrainTexture.image.naturalWidth)for(let x=0;x<960;x+=384)c.drawImage(terrainTexture.image,x,168,384,256);
  c.translate(0,-370);
  const age=time%2.1,effect=canvas.dataset.swordPreview,action={name:actionName(effect),started:0,facing:1};
  drawSwordsman(c,260,620,{time:age,actionTime:age,action,scale:1.12});
  if(effect==='wind-wall')drawWindBarrier(c,{x:380,until:4.5},age,settings.reducedMotion);
  drawSwordTechnique(c,{id:'preview',effect,x:260,y:620,facing:1,age,life:1.7,seed:31},{reducedMotion:settings.reducedMotion,particles:settings.particles});
  c.restore();
}
