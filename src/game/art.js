import { PLATFORMS, WORLD_WIDTH } from './model.js';
import { drawCultivator, drawTechniqueIcon, drawBeast } from '../pixel/assets.js';

export const palettes = { jade: ['#153b3a', '#2d6154', '#578f6b', '#8caf76', '#b6c891'], pink: ['#533e57', '#7b536b', '#a16c85', '#bc8699', '#d8a5ae'] };
export function random(seed = 42) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }; }
export function polygon(c, points, color) { c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); }
export function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }
export function pixelCircle(c, x, y, r, color, grid = 5) {
  c.fillStyle = color;
  for (let row = -r; row < r; row += grid) {
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - row * row)) / grid) * grid;
    c.fillRect(Math.round(x - half), Math.round(y + row), half * 2, grid);
  }
}

export function pine(c, x, y, h, colors = ['#152e32', '#1c3b3b', '#284a43']) {
  const w = h * .42;
  rect(c, x - h * .028, y - h * .75, h * .055, h * .75, colors[0]);
  for (let i = 0; i < 6; i++) {
    const top = y - h + i * h * .125, width = w * (.23 + i * .15);
    polygon(c, [[x, top], [x + width * .32, top + h * .12], [x + width * .23, top + h * .12], [x + width * .65, top + h * .24], [x + width * .47, top + h * .24], [x + width, top + h * .34], [x + width * .4, top + h * .31], [x, top + h * .34], [x - width, top + h * .34], [x - width * .5, top + h * .22], [x - width * .7, top + h * .22], [x - width * .27, top + h * .1]], colors[i % 3]);
    polygon(c, [[x - 3, top + 8], [x + width * .1, top + h * .13], [x - width * .2, top + h * .13], [x - width * .08, top + h * .2], [x - width * .55, top + h * .26], [x - width * .33, top + h * .12]], colors[2]);
  }
}

function cherry(c, x, y, size, seed, palette = palettes.pink) {
  const rng = random(seed), s = size / 300;
  c.save(); c.translate(x, y); c.scale(s, s);
  polygon(c, [[-38, 0], [-19, -28], [-12, -95], [-30, -144], [-48, -181], [-42, -203], [-22, -169], [-4, -146], [1, -207], [-8, -244], [8, -264], [19, -235], [14, -182], [39, -211], [58, -228], [76, -224], [41, -185], [20, -142], [18, -99], [8, -62], [15, -23], [37, 0], [8, -7], [-5, -2], [-23, -8]], '#283c36');
  polygon(c, [[-23, -5], [-7, -40], [-5, -101], [-22, -149], [-35, -175], [-22, -144], [6, -112], [1, -73], [1, -18], [14, -3], [3, -8], [-7, -6]], '#4b5944');
  polygon(c, [[-2, -106], [7, -159], [4, -201], [12, -222], [11, -173], [15, -154], [8, -113]], '#6c7051');
  polygon(c, [[-5, -132], [-49, -169], [-94, -181], [-108, -198], [-87, -185], [-47, -185], [-11, -166]], '#344039');
  polygon(c, [[10, -100], [45, -149], [97, -171], [120, -202], [109, -171], [69, -145], [27, -115]], '#34443a');
  const clusters = [[-106,-205,58],[-69,-240,64],[-7,-258,68],[57,-252,62],[112,-222,62],[-132,-184,48],[-79,-194,65],[-16,-211,64],[50,-202,63],[115,-179,50],[-35,-166,41],[77,-165,39]];
  for (const [cx, cy, r] of clusters) {
    pixelCircle(c, cx, cy, r, palette[0]);
    pixelCircle(c, cx - 3, cy - 7, r - 5, palette[1]);
    pixelCircle(c, cx - 10, cy - 15, r - 14, palette[2]);
    pixelCircle(c, cx - 18, cy - 20, r - 26, palette[3]);
    for (let n = 0; n < 25; n++) {
      const angle = rng() * Math.PI * 2, radius = rng() * (r - 8);
      rect(c, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius - 8, 3 + Math.floor(rng() * 3), 3, palette[2 + Math.floor(rng() * 3)]);
    }
  }
  c.restore();
}

function bamboo(c, x, y, h, seed) {
  const rng = random(seed);
  for (let n = 0; n < 6; n++) {
    const sx = x + n * 17, sh = h * (.7 + rng() * .3);
    rect(c, sx, y - sh, 7, sh, '#23493f');
    rect(c, sx, y - sh, 2, sh, '#52785a');
    for (let i = 20; i < sh; i += 29) {
      rect(c, sx - 1, y - i, 9, 3, '#83926a');
      if (rng() > .3) for (let leaf = 0; leaf < 3; leaf++) {
        const dir = n % 2 ? 1 : -1;
        polygon(c, [[sx, y-i], [sx+dir*(30+leaf*10),y-i-12-leaf*8], [sx+dir*(17+leaf*8),y-i-4-leaf*9]], '#446e50');
      }
    }
  }
}

function lantern(c, x, y) {
  rect(c, x - 13, y - 4, 26, 5, '#5f705a'); rect(c, x - 8, y - 11, 16, 8, '#374d43');
  rect(c, x - 4, y - 52, 8, 41, '#596a52'); rect(c, x - 2, y - 48, 3, 32, '#7b8561');
  rect(c, x - 13, y - 64, 26, 17, '#344c42'); rect(c, x - 9, y - 61, 18, 11, '#d2c18a'); rect(c, x - 5, y - 59, 10, 7, '#f2dba0');
  rect(c, x - 15, y - 67, 30, 5, '#506552'); rect(c, x - 12, y - 71, 24, 4, '#5f7960'); rect(c, x - 7, y - 75, 14, 4, '#7e916e');
  rect(c, x - 2, y - 80, 4, 6, '#a1ac7e');
}

function gate(c, x, y) {
  for (const dx of [-73, 73]) {
    rect(c, x + dx - 14, y - 11, 28, 11, '#596652'); rect(c, x + dx - 10, y - 172, 20, 163, '#3e4b3d');
    rect(c, x + dx - 7, y - 168, 5, 153, '#777c52'); rect(c, x + dx + 6, y - 170, 4, 159, '#243e37');
    for (let row = 0; row < 4; row++) rect(c, x + dx - 12, y - 32 - row * 43, 24, 5, '#8a8658');
  }
  rect(c, x - 95, y - 167, 190, 12, '#526c4c'); rect(c, x - 82, y - 157, 164, 6, '#9c9c64');
  polygon(c, [[x - 116, y - 206], [x - 97, y - 197], [x - 60, y - 197], [x - 40, y - 208], [x + 40, y - 208], [x + 60, y - 197], [x + 97, y - 197], [x + 116, y - 206], [x + 108, y - 184], [x + 69, y - 180], [x - 69, y - 180], [x - 108, y - 184]], '#2a514a');
  for (let i = -94; i < 96; i += 9) rect(c, x + i, y - 196, 5, 13, '#61846a');
  rect(c, x - 102, y - 184, 204, 4, '#a3ae7c'); rect(c, x - 38, y - 176, 76, 31, '#243d35'); rect(c, x - 35, y - 173, 70, 25, '#4c6245');
  c.font = '14px VT323'; c.textAlign = 'center'; c.fillStyle = '#ddd0a1'; c.fillText('THANH VÂN', x, y - 156);
  for (const dx of [-54, 54]) {
    rect(c, x + dx, y - 150, 1, 29, '#aaa17a'); rect(c, x + dx - 6, y - 127, 13, 23, '#9f9e60'); rect(c, x + dx - 3, y - 124, 7, 18, '#e1cf8e'); rect(c, x + dx, y - 103, 2, 9, '#a7ab71');
  }
}

function biomePlant(c,x,y,h,type){
  if(type==='desert'){
    rect(c,x-6,y-h,12,h,'#4b7358');rect(c,x-3,y-h,3,h,'#819762');rect(c,x-28,y-h*.7,9,h*.3,'#4b7358');rect(c,x-24,y-h*.43,23,8,'#4b7358');rect(c,x+20,y-h*.85,8,h*.38,'#3e654e');rect(c,x+3,y-h*.51,24,9,'#3e654e');
  }else if(type==='volcano'||type==='haunted'){
    polygon(c,[[x-8,y],[x-5,y-h*.6],[x-25,y-h*.85],[x-19,y-h*.89],[x+2,y-h*.7],[x+5,y-h],[x+10,y-h*.94],[x+9,y-h*.5],[x+28,y-h*.75],[x+33,y-h*.7],[x+9,y-h*.32],[x+12,y]],'#373c38');rect(c,x-3,y-h*.6,3,h*.6,'#68604d');
  }else if(type==='ocean'){
    polygon(c,[[x-6,y],[x+5,y-h],[x+14,y-h],[x+6,y]],'#7b8861');
    for(let i=0;i<7;i++){const angle=-Math.PI+i*Math.PI/6;polygon(c,[[x+9,y-h],[x+Math.cos(angle)*h*.5,y-h+Math.sin(angle)*h*.27],[x+Math.cos(angle)*h*.6,y-h+Math.sin(angle)*h*.23+10],[x+14,y-h+8]],i%2?'#72946a':'#4f7859');}
  }else if(type==='void'||type==='divine'){
    polygon(c,[[x-18,y],[x-25,y-h*.4],[x-8,y-h],[x+6,y-h*.85],[x+26,y-h*.3],[x+12,y]],'#53666d');polygon(c,[[x-8,y-h],[x-5,y-5],[x+12,y],[x+26,y-h*.3],[x+6,y-h*.85]],'#8f9c99');rect(c,x-6,y-h*.8,3,h*.7,'#bdc7ad');
  }else if(type==='snow')pine(c,x,y,h,['#3d5d67','#67888d','#95afb1']);
  else pine(c,x,y,h,['#1a3c3d','#23473f','#2e5345']);
}

export function createScenery(biome={type:'forest',hue:0}) {
  const canvas = document.createElement('canvas'); canvas.width = WORLD_WIDTH; canvas.height = 1100;
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
  const rng = random(2046);
  for (let x = -150; x < WORLD_WIDTH + 150; x += 115) {
    const y = PLATFORMS.find(p => x >= p.x && x < p.x + p.w)?.y ?? 650;
    biomePlant(c, x, y + 10, (biome.type==='desert'?80:160) + rng() * (biome.type==='desert'?80:180), biome.type);
  }
  if(['forest','mountain','bamboo','heaven','snow'].includes(biome.type)){
    const pal=biome.type==='snow'?['#3d626c','#6a8992','#8caaad','#b1c7c0','#d5dfcd']:palettes.pink;
    cherry(c, 210, 620, 350, 12,pal);cherry(c,1600,620,330,15,pal);cherry(c,3310,610,390,88,pal);cherry(c,4670,650,320,34,pal);
  }
  if(['forest','bamboo','mountain'].includes(biome.type)){bamboo(c,1820,620,330,8);bamboo(c,2150,620,280,11);bamboo(c,2750,680,290,44);}
  gate(c, 825, 620); gate(c, 3670, 610);
  for (const p of PLATFORMS) {
    rect(c, p.x, p.y + 8, p.w, 1100 - p.y, '#253c36');
    for(let row=0;row<12;row++){c.fillStyle=['#3e4e38','#354632','#2c3b2d','#24372d','#20332c','#1a2e2c'][Math.min(5,Math.floor(row/2))];c.fillRect(p.x,p.y+15+row*48,p.w,48);}
    for (let n = 0; n < p.w / 4; n++) {
      const bx = p.x + rng() * p.w, by = p.y + 16 + rng() * 300;
      rect(c, Math.floor(bx/5)*5, Math.floor(by/5)*5, 8 + Math.floor(rng()*5)*5, 4 + Math.floor(rng()*5)*4, ['#43503d','#364739','#2d4037','#4a523e','#1f3532'][Math.floor(rng()*5)]);
    }
    for (let n = 0; n < p.w / 50; n++) {
      const bx = p.x + rng() * p.w, length = 20 + rng() * 100;
      rect(c, bx, p.y + 17, 3, length, '#1c3530'); rect(c, bx + 3, p.y + 20, 3, length - 10, '#535a3e');
      for (let i = 0; i < length; i += 12) rect(c, bx - (rng()>.5?4:-3), p.y + 18 + i, 8, 5, '#46694a');
    }
    rect(c, p.x, p.y, p.w, 12, biome.type==='snow'?'#9db9b1':biome.type==='desert'?'#a39968':biome.type==='volcano'?'#766752':'#436c47'); rect(c, p.x, p.y, p.w, 3, biome.type==='snow'?'#d8e4d3':biome.type==='desert'?'#dbc58a':'#94a86b');
    for (let x = p.x; x < p.x + p.w; x += 6) {
      const h = 4 + Math.floor(rng() * 6);
      rect(c, x, p.y + 8, 6, h, rng() > .5 ? '#557c4b' : '#637e4e');
      if (rng() > .3) {
        rect(c, x, p.y - h, 2, h, '#729461'); rect(c, x+3, p.y-h+3, 2, h-2, '#9aab72');
      }
      if (rng() > .92) {
        const color = rng() > .5 ? '#d0be9b' : '#aa85a1';
        rect(c, x, p.y - 8, 2, 7, '#648252'); rect(c, x-2, p.y-10, 6, 3, color);
      }
      if (rng() > .95) {
        for (let n = 0; n < 5; n++) { rect(c, x - n*2, p.y+9+n*8, 2, 10, '#43674a'); rect(c, x-n*2-3, p.y+13+n*8, 4, 3, '#668450'); }
      }
    }
  }
  for (const x of [440, 670, 950, 1550, 2100, 2980, 3550, 3900]) lantern(c, x, PLATFORMS.find(p => x >= p.x && x < p.x+p.w)?.y ?? 650);
  // Cultivation dais and its weathered, moss-covered stones.
  for (let i = 0; i < 5; i++) rect(c, 310 + i*5, 614 - i*4, 103 - i*10, 5, i%2 ? '#778569' : '#566e59');
  for (const x of [450, 694, 1190, 1760, 2460, 3025, 4050, 4910]) {
    const y = PLATFORMS.find(p => x >= p.x && x < p.x+p.w)?.y ?? 650;
    polygon(c, [[x-20,y],[x-24,y-12],[x-15,y-26],[x+7,y-30],[x+25,y-12],[x+22,y]], '#435a4a');
    polygon(c, [[x-24,y-12],[x-15,y-26],[x+7,y-30],[x+14,y-18],[x-5,y-15]], '#7d8b67');
    rect(c, x-12, y-26, 15, 3, '#a6ad7b');
  }
  if(biome.type==='volcano')for(let x=20;x<WORLD_WIDTH;x+=160){const y=PLATFORMS.find(p=>x>=p.x&&x<p.x+p.w)?.y??650;rect(c,x,y+45,70,3,'#c78850');rect(c,x+20,y+48,3,40,'#a66b43');rect(c,x+40,y+87,45,2,'#bf8350');}
  if(biome.hue){const tinted=document.createElement('canvas');tinted.width=canvas.width;tinted.height=canvas.height;const tc=tinted.getContext('2d');tc.filter=biome.type==='snow'?'saturate(.5) brightness(1.08)':`hue-rotate(${biome.hue}deg) saturate(.8)`;tc.drawImage(canvas,0,0);return tinted;}
  return canvas;
}

export function drawSword(c, x, y, scale = 1, angle = 0, color = '#d5edda') {
  c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(angle); c.scale(scale,scale);
  polygon(c, [[-36,0],[-27,-4],[22,-4],[29,0],[22,4],[-27,4]], '#4b8f88');
  polygon(c, [[-36,0],[-24,-2],[22,-2],[27,0],[-23,1]], color);
  rect(c, 18,-7,3,14,'#d2bd78'); rect(c,23,-2,14,4,'#576d52'); rect(c,35,-4,4,8,'#d6c180');
  c.restore();
}

function paintCharacter(c, x, y, { time = 0, facing = 1, flying = false, meditating = false, npc = false, moving = false, scale = 1, casting = false, variant = 0 } = {}) {
  c.save(); c.translate(Math.round(x),Math.round(y)); c.scale(facing * scale, scale);
  const sway = Math.round(Math.sin(time * (moving ? 12 : 3)) * (moving ? 3 : 1));
  const coat=npc?['#a9b995','#b9a8c4','#97adba','#c4ab83','#9faf91','#a5a0c1'][variant%6]:'#c2d0b6';
  const hair=npc&&variant%2?'#69746e':'#dbe5d2';
  if(!flying)c.translate(0,Math.round(Math.sin(time*(moving?12:2))*1));
  if (flying) {
    rect(c,-43,8,86,3,'#87e8d135');rect(c,-25,14,50,2,'#b0efd26a');
    drawSword(c,0,4,1.2,Math.PI);
    rect(c,-36,9,55,2,'#97ddbe90');rect(c,-25,13,36,1,'#b6e3c580');
  }
  if (meditating) {
    polygon(c,[[-17,-7],[-12,-17],[12,-17],[20,-7],[13,-2],[-12,-2]],'#708e77');
    rect(c,-11,-8,21,6,'#c6ccb1');
  } else {
    rect(c,-9,-16,7,13+sway,'#304f4c'); rect(c,3,-15,7,14-sway,'#25413e');
    rect(c,-11,-4+sway,9,4,'#bfd1b3'); rect(c,3,-4-sway,12,4,'#c9d3b8');
  }
  // Long silver hair behind the shoulders, and a wind-swept teal ribbon.
  polygon(c,[[-9,-61],[-17,-48],[-16,-29],[-21,-24],[-13,-27],[-10,-39],[0,-41]],npc?'#c3c4ad':'#bfcfc1');
  polygon(c,[[-10,-43],[-18,-39],[-25+sway,-43],[-39+sway,-39],[-32+sway,-33],[-20,-34],[-8,-35]],npc?'#8e9670':'#6bb0a0');
  polygon(c,[[-12,-43],[10,-44],[15,-32],[10,-25],[16,-9],[7,-9],[0,-17],[-8,-9],[-18,-11],[-12,-25],[-16,-31]],'#25473f');
  polygon(c,[[-9,-42],[1,-39],[7,-43],[9,-31],[5,-24],[11,-10],[3,-11],[-1,-26],[-8,-11],[-13,-12],[-7,-28]],coat);
  rect(c,-9,-29,18,4,'#b2a66c'); rect(c,0,-29,4,5,'#e4cd8c');
  polygon(c,[[7,-42],[14,-40],[19,-27],[14,-23],[10,-30]],'#779a83');rect(c,15,-27,5,5,'#d9c5a0');
  polygon(c,[[-11,-42],[-16,-39],[-19,-28],[-13,-24],[-8,-31]],'#759780');rect(c,-18,-28,5,5,'#d9c5a0');
  rect(c,-8,-55,17,13,'#cfbd9d');rect(c,4,-52,6,7,'#e3d1ad');rect(c,-4,-46,9,3,'#b69c7c');
  rect(c,4,-51,2,2,'#253e39');rect(c,-2,-51,2,2,'#253e39');
  if(time%5>4.85){rect(c,4,-51,2,2,'#cfbd9d');rect(c,-2,-51,2,2,'#cfbd9d');}
  polygon(c,[[-13,-56],[-10,-63],[-4,-66],[6,-65],[12,-60],[12,-52],[8,-53],[5,-58],[0,-56],[-4,-59],[-6,-52],[-10,-48],[-13,-47]],hair);
  rect(c,-9,-61,16,3,'#f0edcd');rect(c,-8,-55,4,10,'#e0e5ce');rect(c,-9,-57,19,2,npc?'#a2ad7d':'#487b6b');rect(c,1,-59,3,4,'#ddc680');
  rect(c,-3,-68,7,5,'#dbe3cd');rect(c,-2,-70,5,2,'#e9e7cc');rect(c,-6,-66,13,2,'#5c8c77');
  if (npc) {
    polygon(c,[[-4,-44],[6,-45],[4,-38],[0,-34]],'#dae2c9');
    rect(c,22,-45,3,48,'#827e58');rect(c,20,-48,7,8,'#c5b77e');
  } else if(casting)drawSword(c,27,-33,.82,-1.1+Math.sin(time*18)*.8);
  else if (!flying && !meditating) drawSword(c,20,-21,.64,-1.1);
  c.restore();
}

function paintEnemy(c, enemy, time) {
  const {x,y,kind,hit} = enemy;
  const tone=({metal:['#7b8e68','#c3c38b'],wood:['#5c9360','#9cba71'],water:['#4c9395','#8bc9c3'],fire:['#bd7553','#e2b77a'],earth:['#9e8c5c','#cbba83'],wind:['#629a81','#abd1a2'],thunder:['#8b78a6','#c7add8'],ice:['#7aacb8','#c3e0d8']})[enemy.element]??['#5c9360','#9cba71'];
  const bounce = Math.round(Math.sin(time*4+enemy.id)*2);
  c.save();c.translate(Math.round(x),Math.round(y+bounce));
  if (hit > 0) c.filter = 'brightness(1.8)';
  if(kind==='boss'&&['dragon','serpent','thunder','void'].includes(enemy.form)){
    for(let i=0;i<18;i++){const x=-75+i*8,y=-38+Math.sin(time*3+i*.4)*19;rect(c,x-6,y-6,13,14,i%3?tone[0]:tone[1]);if(i%4===0)polygon(c,[[x,y-6],[x+5,y-23],[x+11,y-7]],tone[1]);}
    polygon(c,[[52,-53],[76,-56],[94,-41],[85,-33],[99,-26],[73,-17],[57,-23]],tone[1]);rect(c,77,-46,6,5,'#f3d49c');rect(c,86,-32,15,3,'#263f44');polygon(c,[[60,-55],[53,-83],[67,-70],[70,-56],[80,-78],[85,-71],[81,-52]],'#e0d6a1');
    for(let i=0;i<4;i++){const tx=-40+i*21;rect(c,tx,-25,4,18,'#a8c6ae');rect(c,tx-5,-8,15,3,'#d2d2a3');}
  }else if(kind==='boss'&&['phoenix','crane'].includes(enemy.form)){
    const wing=Math.sin(time*5)*18,white=enemy.form==='crane';
    for(const dir of [-1,1]){c.save();c.scale(dir,1);polygon(c,[[0,-36],[20,-50],[34,-80-wing],[53,-100-wing],[52,-64],[70,-76],[57,-45],[78,-51],[56,-26],[25,-17]],white?'#c9d8cc':'#ce9b5b');polygon(c,[[10,-35],[32,-60-wing],[45,-84-wing],[39,-50],[58,-62],[45,-37],[63,-40],[39,-23]],white?'#e4e7cf':'#f0cf82');c.restore();}
    polygon(c,[[-15,-17],[-15,-50],[-7,-65],[7,-65],[15,-51],[11,-22],[23,-7],[0,-15],[-22,-7]],white?'#e0e3c9':'#ecc47b');rect(c,-4,-74,10,15,white?'#e7e6d0':'#e0bc75');polygon(c,[[3,-74],[20,-67],[4,-63]],'#d5ab67');rect(c,3,-70,3,3,'#254143');
    for(let i=0;i<4;i++)polygon(c,[[i*7-13,-13],[i*12-20+Math.sin(time*3+i)*5,32+i*5],[i*12-13,24+i*5],[i*7-6,-14]],white?'#b1c8c6':'#d9b96e');
  }else if(kind==='boss'&&enemy.form==='tree'){
    polygon(c,[[-30,0],[-19,-26],[-25,-80],[-10,-114],[13,-108],[29,-77],[20,-22],[34,0],[12,-6],[-8,-2]],'#6c7952');rect(c,-16,-76,8,41,'#a3a16b');rect(c,9,-81,5,50,'#9b9563');
    for(const dir of [-1,1])polygon(c,[[dir*14,-66],[dir*43,-84],[dir*55,-60],[dir*48,-48],[dir*35,-63],[dir*23,-44]],'#728e58');
    for(let i=0;i<7;i++)pixelCircle(c,-55+i*18,-105-Math.sin(i)*18,25,i%2?'#729c61':'#9eb578',4);rect(c,-15,-87,9,6,'#e4d9a2');rect(c,9,-87,9,6,'#e4d9a2');rect(c,-3,-72,9,4,'#344b3b');
  }else if(kind==='boss'&&enemy.form==='scorpion'){
    for(let i=0;i<7;i++){const sx=28+i*5,sy=-30-i*8+Math.sin(time*3)*2;rect(c,sx,sy,13,12,i%2?'#c1a674':'#8f875e');}polygon(c,[[63,-84],[78,-93],[82,-78],[74,-72]],'#dfc18a');
    for(let i=0;i<4;i++)for(const dir of [-1,1])polygon(c,[[dir*10,-15-i*3],[dir*(29+i*6),-3],[dir*(38+i*5),0],[dir*(26+i*5),-13],[dir*16,-26]],'#a99565');
    pixelCircle(c,0,-27,28,'#b09e6c',4);pixelCircle(c,-9,-32,19,'#c8b47e',4);for(const dir of [-1,1]){polygon(c,[[dir*15,-35],[dir*47,-51],[dir*66,-43],[dir*59,-23],[dir*44,-19],[dir*38,-28],[dir*47,-34],[dir*33,-33],[dir*23,-20]],'#c6ae77');}rect(c,-13,-35,5,4,'#2d423c');rect(c,1,-35,5,4,'#2d423c');
  }else if(kind==='boss'&&enemy.form==='ghost'){
    const float=Math.sin(time*3)*7;c.translate(0,float);polygon(c,[[0,-116],[-27,-89],[-32,-48],[-49,-1],[-20,-12],[-5,2],[13,-12],[37,0],[27,-52],[22,-87]],'#7f789c');polygon(c,[[0,-105],[-17,-80],[-14,-57],[14,-57],[17,-80]],'#233743');rect(c,-13,-77,8,4,'#c8dfcb');rect(c,6,-77,8,4,'#c8dfcb');polygon(c,[[-22,-54],[-55,-38],[-64,-12],[-48,-24],[-29,-31]],'#a3a1bd');polygon(c,[[22,-54],[54,-39],[65,-12],[48,-25],[29,-31]],'#a3a1bd');
  }else if(kind==='boss'&&enemy.form==='god'){
    drawCharacter(c,0,0,{time,npc:true,scale:1.8,variant:4});polygon(c,[[-9,-125],[0,-144],[8,-124],[20,-134],[17,-116],[-17,-116],[-20,-134]],'#dfc880');
  }else if (kind === 'wood') {
    polygon(c,[[-23,-9],[-22,-28],[-15,-39],[-6,-43],[7,-43],[20,-32],[24,-13],[19,-3],[-15,-3]],'#234e3d');
    polygon(c,[[-20,-13],[-17,-29],[-10,-35],[8,-37],[18,-28],[19,-10],[10,-5],[-13,-5]],tone[0]);
    rect(c,-15,-27,6,9,tone[1]);rect(c,11,-24,5,7,tone[1]);
    rect(c,-10,-26,5,6,'#172f31');rect(c,7,-26,5,6,'#172f31');rect(c,-9,-26,2,2,'#f3e2ad');rect(c,8,-26,2,2,'#f3e2ad');rect(c,-3,-16,7,2,'#253c31');
    polygon(c,[[-5,-37],[-13,-53],[-7,-57],[3,-46],[12,-58],[17,-56],[10,-38]],'#82aa65');
    polygon(c,[[-12,-48],[-16,-56],[-7,-53],[-2,-44]],'#b3c67c');rect(c,8,-51,4,8,'#b4c67c');
    rect(c,-17,-5,10,5,'#395f3e');rect(c,10,-5,10,5,'#395f3e');
  } else {
    const boss = kind === 'boss', s = boss ? 2 : 1;
    c.scale(s,s);
    polygon(c,[[-19,-11],[-32,-12],[-45,-25],[-47,-41],[-39,-38],[-31,-23],[-16,-22]],boss?'#9b6551':'#b49b7c');
    polygon(c,[[-39,-33],[-48,-44],[-45,-24],[-39,-20],[-35,-26]],'#dfcb9e');
    polygon(c,[[-24,-7],[-25,-25],[-13,-35],[2,-38],[17,-32],[27,-23],[24,-10],[16,-5],[-11,-4]],boss?tone[0]:'#b39c75');
    polygon(c,[[-12,-36],[-20,-51],[-12,-49],[-5,-42],[9,-41],[19,-49],[20,-32]],boss?'#cc9163':'#d3bd91');
    polygon(c,[[-15,-40],[-17,-48],[-10,-43]],'#5b6850');polygon(c,[[12,-39],[17,-47],[17,-38]],'#5b6850');
    polygon(c,[[-9,-30],[7,-31],[22,-23],[11,-15],[-2,-17]],'#e0d8b5');
    rect(c,7,-32,4,3,boss?'#f4d08a':'#263d35');rect(c,20,-25,5,4,'#263d35');
    rect(c,-17,-10,7,10,'#6b7860');rect(c,9,-11,7,11,'#6b7860');
    if(boss){polygon(c,[[-7,-40],[-10,-65],[0,-54],[7,-72],[13,-49],[20,-54],[16,-36]],'#e4b86c');rect(c,2,-57,3,12,'#ffe0a3');}
    if(enemy.form==='tiger'){for(let i=0;i<4;i++)polygon(c,[[-20+i*7,-29],[-17+i*7,-13],[-13+i*7,-29]],'#3c5144');}
  }
  c.restore();
}

const spriteCache=new Map();
function outlinedSprite(key,width,height,paint){
  if(spriteCache.has(key))return spriteCache.get(key);
  const sprite=document.createElement('canvas');sprite.width=width/2;sprite.height=height/2;
  const context=sprite.getContext('2d',{willReadFrequently:true});context.imageSmoothingEnabled=false;context.scale(.5,.5);paint(context);
  const pixels=context.getImageData(0,0,sprite.width,sprite.height),source=new Uint8ClampedArray(pixels.data);
  for(let y=0;y<sprite.height;y++)for(let x=0;x<sprite.width;x++){
    const offset=(y*sprite.width+x)*4;
    if(source[offset+3]>=110){pixels.data[offset+3]=255;for(let channel=0;channel<3;channel++)pixels.data[offset+channel]=Math.round(source[offset+channel]/8)*8;}
    else{
      const neighbor=[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>x+dx>=0&&x+dx<sprite.width&&y+dy>=0&&y+dy<sprite.height&&source[((y+dy)*sprite.width+x+dx)*4+3]>=110);
      pixels.data[offset]=16;pixels.data[offset+1]=34;pixels.data[offset+2]=31;pixels.data[offset+3]=neighbor?255:0;
    }
  }
  context.putImageData(pixels,0,0);spriteCache.set(key,sprite);if(spriteCache.size>512)spriteCache.delete(spriteCache.keys().next().value);return sprite;
}
export function drawCharacter(c,x,y,options={}){
  if(drawCultivator(c,x,y,options))return;
  const time=options.time??0,frame=Math.floor(time*(options.moving?10:4))%8,blink=time%5>4.85;
  const key=`hero:${options.npc??false}:${options.variant??0}:${options.facing??1}:${options.flying??false}:${options.meditating??false}:${options.casting??false}:${options.moving??false}:${frame}:${blink}`;
  const sprite=outlinedSprite(key,160,112,context=>paintCharacter(context,80,100,{...options,scale:1,time:blink?4.9:frame/(options.moving?10:4)}));
  const scale=options.scale??1;c.imageSmoothingEnabled=false;c.drawImage(sprite,Math.round(x-80*scale),Math.round(y-100*scale),160*scale,112*scale);
}
export function drawEnemy(c,enemy,time){
  if(drawBeast(c,enemy,time))return;
  const frame=Math.floor(time*6)%6,key=`enemy:${enemy.kind}:${enemy.form??''}:${enemy.element}:${enemy.id%3}:${enemy.hit>0}:${frame}`;
  const sprite=outlinedSprite(key,256,176,context=>paintEnemy(context,{...enemy,x:128,y:160},frame/6));
  c.imageSmoothingEnabled=false;c.drawImage(sprite,Math.round(enemy.x-128),Math.round(enemy.y-160),256,176);
}

export function drawSkillArt(canvas, id) {
  if(drawTechniqueIcon(canvas,id))return;
  canvas.width=24;canvas.height=24;const c=canvas.getContext('2d'),rng=random(id.length*81);c.imageSmoothingEnabled=false;c.scale(.5,.5);
  const colors = { attack:['#203f3e','#7bc6b3'],swords:['#1c3b4d','#91e6e5'],flame:['#533021','#efbc64'],heal:['#1e4639','#a1db9a'],storm:['#302c4e','#c3ace4'],potion:['#303d29','#d2b872'],spirit:['#233d45','#9ed4d6'],robe:['#253f3b','#b0d8b6'],jade:['#223e35','#aedb98'] };
  const aliases={dragon:'spirit',ice:'swords',vortex:'storm',shield:'jade',meteor:'flame',clone:'spirit',blades:'attack',lotus:'heal',dash:'attack'};
  const [dark,light] = colors[id] ?? colors[aliases[id]] ?? colors.jade;
  c.clearRect(0,0,48,48);rect(c,0,0,48,48,dark);rect(c,6,6,36,36,light+'25');rect(c,12,12,24,24,light+'35');rect(c,0,0,48,2,light+'60');rect(c,0,0,2,48,light+'40');
  for(let i=0;i<30;i++)rect(c,rng()*48,rng()*48,1,1,light+'50');
  c.save();c.translate(24,24);
  if(id==='dragon'){
    for(let i=0;i<9;i++){const a=i*.65;rect(c,-16+i*4,Math.sin(a)*9,6,6,i%2?'#c3e0cb':'#70b3bb');}polygon(c,[[13,-2],[21,-9],[18,1],[22,5],[14,9],[10,3]],'#c9e7cd');rect(c,16,0,2,2,'#234546');
  }else if(id==='ice'){
    for(const [x,h]of [[-12,21],[0,32],[12,25]])polygon(c,[[x-6,17],[x-6,17-h+6],[x,17-h],[x+6,17-h+6],[x+6,17]],x===0?'#bde9e4':'#6fb4c2');rect(c,-2,-10,2,25,'#f1f3db');
  }else if(id==='vortex'){
    c.strokeStyle='#b6a8de';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.arc(0,0,7+i*6,i*1.3,i*1.3+4.2);c.stroke();}pixelCircle(c,0,0,5,'#152635',2);
  }else if(id==='shield'){
    polygon(c,[[0,-19],[16,-12],[13,7],[0,20],[-13,7],[-16,-12]],'#9fae72');polygon(c,[[0,-14],[11,-8],[9,5],[0,14],[-9,5],[-11,-8]],'#d9d6a0');rect(c,-2,-8,4,15,'#709377');rect(c,-7,-2,14,3,'#709377');
  }else if(id==='meteor'){
    polygon(c,[[-15,16],[-7,-5],[21,-23],[12,-2],[4,12]],'#e6ac5f');polygon(c,[[-13,13],[-7,0],[13,-15],[5,3],[0,12]],'#f9da94');pixelCircle(c,-9,10,9,'#d6bb81',3);pixelCircle(c,-12,8,5,'#f2dda3',2);
  }else if(id==='clone'){
    for(const[x,color]of[[-13,'#72a99e'],[13,'#72a99e'],[0,'#d8e1bd']]){pixelCircle(c,x,-10,4,color,2);polygon(c,[[x-4,-3],[x+4,-3],[x+8,15],[x-8,15]],color);}
  }else if(id==='blades'){
    for(let i=0;i<5;i++){c.save();c.rotate(i*Math.PI*2/5);drawSword(c,0,13,.3,Math.PI/2);c.restore();}
  }else if(id==='lotus'){
    for(let i=0;i<8;i++){c.save();c.rotate(i*Math.PI/4);polygon(c,[[0,0],[-7,-10],[0,-20],[7,-10]],i%2?'#ba9ed3':'#dbc3d9');c.restore();}pixelCircle(c,0,0,6,'#e7d4a3',2);
  }else if(id==='attack')drawSword(c,0,1,.55,-.85);
  else if(id==='swords'){
    for(const [x,y,a] of [[-11,5,-.65],[1,-3,-1.05],[12,5,-1.5]])drawSword(c,x,y,.43,a);
    rect(c,-18,12,7,2,'#75d8cf');rect(c,0,14,14,2,'#75d8cf');
  }else if(id==='flame'){
    polygon(c,[[-17,15],[-19,4],[-11,-3],[-14,7],[-4,0],[0,-20],[6,-10],[5,2],[14,-6],[18,3],[14,15],[3,20],[-9,18]],'#c87943');
    polygon(c,[[-13,11],[-7,2],[-5,12],[1,-10],[6,1],[6,10],[13,4],[12,14],[1,18],[-8,15]],'#f2c66d');
    polygon(c,[[-5,14],[1,0],[4,12],[8,11],[5,17],[-2,18]],'#fff0b0');
  }else if(id==='heal'){
    for(let i=0;i<7;i++){c.save();c.rotate(i*Math.PI*2/7);polygon(c,[[0,6],[-7,-4],[-6,-14],[0,-20],[6,-14],[7,-4]],i%2?'#80c590':'#b9dfa1');c.restore();}
    pixelCircle(c,0,0,6,'#f1e6ac',2);rect(c,-18,17,36,2,'#7ab98b');
  }else if(id==='storm'){
    for(const dx of [-11,8]){polygon(c,[[dx-2,-21],[dx+7,-21],[dx-1,-5],[dx+8,-6],[dx-7,19],[dx-3,2],[dx-10,3]],dx<0?'#948fca':'#e0d5f0');}
    rect(c,-16,18,31,2,'#c5b0df');
  }else if(id==='potion'||id==='spirit'){
    rect(c,-5,-19,10,5,'#ae9567');rect(c,-4,-14,8,6,'#c4cab0');
    polygon(c,[[-5,-9],[-13,-2],[-13,12],[-7,19],[7,19],[13,12],[13,-2],[5,-9]],'#304d3c');
    polygon(c,[[-4,-7],[-10,-1],[-10,11],[-6,16],[6,16],[10,11],[10,-1],[4,-7]],id==='spirit'?'#67a7ac':'#c1a253');
    rect(c,-6,-1,3,11,'#e6d6a2');rect(c,-4,3,13,5,id==='spirit'?'#b4ddcf':'#f0d98c');rect(c,0,0,4,11,'#7e7f4e');
  }else if(id==='robe'){
    polygon(c,[[-8,-17],[-20,-7],[-15,2],[-9,-1],[-13,18],[13,18],[9,-1],[15,2],[20,-7],[8,-17],[0,-10]],'#c1cdb0');rect(c,-9,-1,18,4,'#b49e65');rect(c,0,2,3,14,'#5f9c85');
  }else{
    polygon(c,[[0,-19],[13,-10],[14,7],[0,19],[-13,8],[-14,-10]],'#7caf88');polygon(c,[[0,-15],[9,-9],[10,5],[0,14],[-9,5],[-9,-8]],'#c1ddac');rect(c,-3,-6,6,12,'#669778');
  }
  c.restore();
}
