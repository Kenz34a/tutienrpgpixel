// Original game artwork. Keep images local so a saved build works offline.
import { poseAt } from '../game/choreography.js';
function loadImage(url) {
  const image = new Image();
  const ready = new Promise(resolve => {
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
  });
  image.src = url;
  return { image, ready };
}

export const landscape = loadImage('/art/van-mong-night.png');
export const cultivators = loadImage('/art/cultivators.png');
export const swordsmanActions = loadImage('/art/swordsman-actions.png');
export const techniqueIcons = loadImage('/art/techniques.png');
export const spellSprites = loadImage('/art/spell-sprites.png');
export const dragonSpell = loadImage('/art/spell-dragon.png');
export const phoenixSpell = loadImage('/art/spell-phoenix.png');
export const lotusSpell = loadImage('/art/spell-lotus.png');
export const vortexSpell = loadImage('/art/spell-vortex.png');
export const impactSpell = loadImage('/art/spell-impact.png');
export const beastSprites = loadImage('/art/beasts.png');
export const terrainTexture = loadImage('/art/cliff.png');
export const artworkReady = Promise.all([landscape.ready, cultivators.ready, swordsmanActions.ready, techniqueIcons.ready, spellSprites.ready, beastSprites.ready, terrainTexture.ready, dragonSpell.ready, phoenixSpell.ready, lotusSpell.ready, vortexSpell.ready, impactSpell.ready]);

const actorAnchors=new Map();
export function drawSwordsman(c,x,y,options={}){
  const {time=0,facing=1,scale=1,flying=false,moving=false,meditating=false}=options;
  const pose=poseAt(options.action,options.actionTime??time);
  const frame=options.frame??pose?.frame??(meditating?11:moving&&!flying?[1,2,3,2][Math.floor(time*11)%4]:0);
  const sprite=atlasCell(swordsmanActions,frame,4,3,128,114);
  if(!sprite)return false;
  if(!actorAnchors.has(frame)){
    const data=sprite.getContext('2d').getImageData(0,0,128,114).data;
    let bottom=107;
    outer:for(let py=113;py>70;py--)for(let px=8;px<120;px++)if(data[(py*128+px)*4+3]>210){bottom=py;break outer;}
    actorAnchors.set(frame,bottom);
  }
  const anchorX=[180,194,194,194,180,180,180,138,210,180,192,192][frame]/384*172;
  const bottom=actorAnchors.get(frame)/114*153;
  const lockedFacing=pose?.facing??facing;
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(lockedFacing*scale,scale);c.imageSmoothingEnabled=false;
  if(flying){
    c.fillStyle='#6dc9d94a';c.fillRect(-58,9,104,2);c.fillStyle='#f0f8e9';c.beginPath();c.moveTo(-58,5);c.lineTo(34,2);c.lineTo(43,5);c.lineTo(34,8);c.closePath();c.fill();c.fillStyle='#bca877';c.fillRect(31,-1,3,13);c.fillStyle='#526785';c.fillRect(35,4,16,3);
  }
  c.drawImage(sprite,-anchorX,-bottom,172,153);
  // Complete the horizontal sweep blade in the empty margin next to its cell.
  if(frame===9){const image=swordsmanActions.image,rowHeight=image.naturalHeight/3;c.drawImage(image,768,780,44,38,172-anchorX,(780-rowHeight*2)/rowHeight*153-bottom,44/384*172,38/rowHeight*153);}
  c.restore();return true;
}

const atlasCache = new Map();
function atlasCell(asset, frame, columns, rows, width, height, tint = '') {
  const image=asset.image;
  if(!image.complete || !image.naturalWidth)return null;
  const key=`${image.src}:${frame}:${width}:${height}:${tint}`;
  if(atlasCache.has(key))return atlasCache.get(key);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const sw=image.naturalWidth/columns,sh=image.naturalHeight/rows;
  c.drawImage(image,frame%columns*sw,Math.floor(frame/columns)*sh,sw,sh,0,0,width,height);
  if(asset===swordsmanActions&&frame===10)c.clearRect(0,28,16,20);
  if(tint){c.globalCompositeOperation='source-atop';c.fillStyle=tint;c.fillRect(0,0,width,height);}
  atlasCache.set(key,canvas);return canvas;
}

export function drawSpellSprite(c, frame, x, y, width, height=width, {angle=0, facing=1, tint='', wave=0, phase=0}={}) {
  const standalone=({0:dragonSpell,1:phoenixSpell,2:lotusSpell,6:vortexSpell,7:impactSpell})[frame];
  const sprite=standalone?atlasCell(standalone,0,1,1,384,256,tint):atlasCell(spellSprites,frame,3,2,256,256,tint);
  if(!sprite)return false;
  c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.scale(facing,1);
  c.imageSmoothingEnabled=false;
  if(wave){
    for(let i=0;i<16;i++){const sw=sprite.width/16,dw=width/16,offset=Math.sin(i*.5-phase)*wave;c.drawImage(sprite,i*sw,0,sw,sprite.height,Math.round(-width/2+i*dw),Math.round(-height/2+offset),Math.ceil(dw)+1,height);}
  }else c.drawImage(sprite,-width/2,-height/2,width,height);
  c.restore();return true;
}

export function drawBeast(c, enemy, time) {
  const boss=enemy.kind==='boss';
  const frame=boss?({tree:0,dragon:2,serpent:2,thunder:2,void:2,phoenix:3,crane:3,scorpion:4,ghost:5,god:6,tiger:7,fox:1})[enemy.form]??7:enemy.kind==='wood'?0:1;
  const sprite=atlasCell(beastSprites,frame,4,2,96,128,enemy.hit>0?'#f5f2ff99':'');
  if(!sprite)return false;
  const width=boss?(frame===2||frame===3?204:154):frame===0?73:91,height=width*4/3;
  const float=[2,3,5].includes(frame)?Math.sin(time*3+enemy.id)*5:Math.sin(time*4+enemy.id)*1.5;
  const pulse=[2,3,5].includes(frame)?1:1+Math.sin(time*3+enemy.id)*.015;
  c.save();c.translate(Math.round(enemy.x),Math.round(enemy.y+float));c.scale(1,pulse);
  c.imageSmoothingEnabled=false;c.drawImage(sprite,-width/2,-height*.94,width,height);c.restore();return true;
}

const ICON_FRAMES = ['attack', 'swords', 'flame', 'heal', 'storm', 'dragon', 'ice', 'vortex', 'shield', 'meteor', 'clone', 'lotus'];
export function drawTechniqueIcon(canvas, id) {
  id=({'wind-edge':'attack','wind-step':'attack','wind-wheel':'vortex','wind-wall':'ice','wind-final':'swords'})[id]??id;
  const image=techniqueIcons.image, frame=ICON_FRAMES.indexOf(id === 'blades' ? 'swords' : id);
  if(frame<0 || !image.complete || !image.naturalWidth) return false;
  canvas.width=48; canvas.height=48;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const w=image.naturalWidth/4,h=image.naturalHeight/3;
  c.drawImage(image,frame%4*w,Math.floor(frame/4)*h,w,h,0,0,48,48);
  return true;
}

export function drawCultivator(c, x, y, options = {}) {
  if(!options.npc&&drawSwordsman(c,x,y,options))return true;
  const image = cultivators.image;
  if (!image.complete || !image.naturalWidth) return false;
  const { time = 0, facing = 1, scale = 1, npc, variant = 0, moving, flying, casting, meditating } = options;
  const frame = npc ? (variant % 2 ? 7 : 6) : meditating ? 5 : casting ? 4 : flying ? 3 : moving ? 1 + Math.floor(time * 9) % 2 : 0;
  const cellW = image.naturalWidth / 4, cellH = image.naturalHeight / 2;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(facing * scale, scale);
  c.imageSmoothingEnabled = false;
  // The atlas is deliberately generous around each pose to keep every frame intact.
  c.drawImage(image, frame % 4 * cellW, Math.floor(frame / 4) * cellH, cellW, cellH, -50, -128, 100, 133.33);
  // The raised blade reaches into the empty corner of the next atlas cell.
  if(frame===4)c.drawImage(image,cellW,cellH,cellW/3,cellH/4,50,-128,100/3,133.33/4);
  c.restore();
  return true;
}
