import { BIOMES } from '../expansion/content.js';
import { landscape } from './assets.js';

const textCache=new Map();
export function drawPixelText(context,text,x,y,color='#f0dfab',scale=1){
  const key=`${text}|${color}`;
  let stamp=textCache.get(key);
  if(!stamp){
    const canvas=document.createElement('canvas');let c=canvas.getContext('2d',{willReadFrequently:true});
    c.font='16px VT323';canvas.width=Math.max(1,Math.ceil(c.measureText(text).width)+2);canvas.height=24;
    c=canvas.getContext('2d',{willReadFrequently:true});c.font='16px VT323';c.fillStyle=color;c.fillText(text,1,19);
    const pixels=c.getImageData(0,0,canvas.width,24);
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=100?255:0;
    c.putImageData(pixels,0,0);
    const shadow=document.createElement('canvas');shadow.width=canvas.width;shadow.height=24;const sc=shadow.getContext('2d');sc.drawImage(canvas,0,0);sc.globalCompositeOperation='source-in';sc.fillStyle='#081c1c';sc.fillRect(0,0,shadow.width,24);
    stamp={canvas,shadow};textCache.set(key,stamp);
    if(textCache.size>500)textCache.delete(textCache.keys().next().value);
  }
  const left=Math.round(x-stamp.canvas.width*scale/2),top=Math.round(y-19*scale);
  context.imageSmoothingEnabled=false;
  context.drawImage(stamp.shadow,left+scale,top+scale,stamp.canvas.width*scale,stamp.canvas.height*scale);
  context.drawImage(stamp.canvas,left,top,stamp.canvas.width*scale,stamp.canvas.height*scale);
}
export function clearPixelTextCache(){textCache.clear();}
export function pixelSky(width,height,palette){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d'),pixels=context.createImageData(width,height),colors=palette.map(color=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16))),bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  for(let y=0;y<height;y++){const progress=y/(height-1)*2,index=Math.min(1,Math.floor(progress)),fraction=progress-index;
    for(let x=0;x<width;x++){const offset=(y*width+x)*4,threshold=bayer[(y%4)*4+x%4]/16;
      for(let channel=0;channel<3;channel++){const value=colors[index][channel]*(1-fraction)+colors[index+1][channel]*fraction,base=Math.floor(value/8)*8;pixels.data[offset+channel]=Math.min(255,base+(value%8/8>threshold?8:0));}pixels.data[offset+3]=255;
    }
  }
  context.putImageData(pixels,0,0);return canvas;
}
function blockCircle(c,x,y,r,color){c.fillStyle=color;for(let row=-r;row<=r;row++){const half=Math.floor(Math.sqrt(r*r-row*row));c.fillRect(x-half,y+row,half*2+1,1);}}
function mountain(c,base,peaks,color){c.fillStyle=color;for(let x=0;x<160;x++){const height=peaks.reduce((value,[px,py,w])=>Math.min(value,py+Math.abs(x-px)/w),base);c.fillRect(x,Math.floor(height),1,72-height);}}
function smallPine(c,x,y,h,color){c.fillStyle='#283c34';c.fillRect(x-1,y-h,2,h);c.fillStyle=color;for(let i=0;i<4;i++){const w=2+i*2;for(let row=0;row<4;row++)c.fillRect(x-w-row,y-h+i*4+row,(w+row)*2+1,1);}}
export function pixelLandscape(biome=BIOMES[0],hero=false){
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=72;canvas.className='pixel-landscape';canvas.setAttribute('aria-hidden','true');
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  if(hero&&landscape.image.complete&&landscape.image.naturalWidth){c.drawImage(landscape.image,0,120,1536,692,0,0,160,72);return canvas;}
  const sky=hero?['#131e35','#1e3447','#38565b']:biome.sky;
  sky.forEach((color,i)=>{c.fillStyle=color;c.fillRect(0,i*24,160,24);});
  for(let y=23;y<49;y+=24)for(let x=0;x<160;x+=2){c.fillStyle=sky[Math.floor(y/24)];c.fillRect(x,y,1,1);c.fillStyle=sky[Math.floor(y/24)+1];c.fillRect(x+1,y-1,1,1);}
  blockCircle(c,127,17,8,'#f0d99a');blockCircle(c,130,15,5,'#d5bd83');
  c.fillStyle='#d5d4b3';for(const[x,y]of[[12,12],[33,18],[67,7],[88,15],[145,8],[100,29]])c.fillRect(x,y,1,1);
  mountain(c,65,[[20,30,1],[55,18,.8],[83,34,1],[135,28,.7]],'#496969');
  mountain(c,72,[[10,50,1],[82,33,.7],[118,44,.8],[153,36,1]],'#284b4b');
  if(hero||!['desert','volcano','ocean','void','divine'].includes(biome.type))for(let i=0;i<10;i++)smallPine(c,i*19-5,65,14+i%3*5,biome.type==='snow'?'#a8c7c2':'#193b35');
  if(hero||biome.type==='forest'){
    c.fillStyle='#334b36';c.fillRect(10,38,5,28);c.fillRect(4,45,17,3);
    for(const[x,y,r]of[[2,34,10],[14,29,13],[29,35,11],[12,40,12]]){blockCircle(c,x,y,r,'#765473');blockCircle(c,x-1,y-2,r-2,'#b07898');blockCircle(c,x-3,y-5,r-5,'#d59bb2');}
  }
  c.fillStyle=biome.type==='snow'?'#d2e4d2':'#a4b66c';c.fillRect(0,65,160,2);c.fillStyle='#3e5540';c.fillRect(0,67,160,5);
  for(let x=0;x<160;x+=7){c.fillStyle=x%2?'#61754b':'#7c8e5a';c.fillRect(x,63-x%3,1,3);c.fillStyle='#263c31';c.fillRect(x,69,3,2);}
  if(hero){
    c.fillStyle='#334f46';c.fillRect(105,34,19,29);c.fillStyle='#b4b47d';c.fillRect(108,36,2,27);c.fillRect(119,36,2,27);c.fillStyle='#1c3832';c.fillRect(111,39,7,24);
    c.fillStyle='#6c8d6d';c.fillRect(99,31,31,3);c.fillRect(103,28,23,3);c.fillRect(108,25,13,3);c.fillStyle='#d3ca8a';c.fillRect(98,34,33,1);
  }
  return canvas;
}
export function paintPixelScenes(root=document){
  root.querySelectorAll('.atlas-landscape,.exp-hero,.map-art').forEach(el=>{
    if(el.querySelector(':scope > .pixel-landscape'))return;
    const hue=parseFloat(el.parentElement?.style.getPropertyValue('--biome-hue'));
    el.prepend(pixelLandscape(BIOMES.find(b=>b.hue===hue)??BIOMES[0],el.classList.contains('exp-hero')));
  });
}
