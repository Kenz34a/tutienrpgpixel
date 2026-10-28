import { PLATFORMS, WORLD_WIDTH } from '../game/model.js';
import { random, rect, polygon } from '../game/art.js';
import { terrainTexture } from './assets.js';

const THEMES = {
  forest: ['#0b1328', '#292845', '#3b3d5b', '#286a65', '#5bab89', '#abe4ad'],
  bamboo: ['#122a33', '#203f46', '#39545a', '#26785a', '#74b975', '#c0d897'],
  mountain: ['#1b213c', '#303a56', '#4d5871', '#347d77', '#69b5a0', '#bddebf'],
  snow: ['#253553', '#3f5571', '#667e9a', '#9cc4d3', '#c5e9ed', '#eef7ef'],
  desert: ['#34253b', '#62414d', '#93655d', '#b68a60', '#d5b677', '#f7dfa0'],
  volcano: ['#261b31', '#422839', '#654047', '#814049', '#d77854', '#ffc37d'],
  haunted: ['#20192f', '#36273f', '#4c3d58', '#564e72', '#9185aa', '#c0bccb'],
  ocean: ['#142c45', '#24455f', '#3a6077', '#428b91', '#6bbcae', '#b9e2c6'],
  storm: ['#221c3e', '#393252', '#534766', '#61567b', '#a29bc7', '#e0d7ed'],
  heaven: ['#25334b', '#3a5066', '#5c7383', '#529490', '#99c4ae', '#f2e3b8'],
  void: ['#1d1638', '#34264f', '#514066', '#6a527e', '#a384bf', '#e4c9eb'],
  divine: ['#28213c', '#4a3c57', '#6e5d70', '#9e8a7f', '#c8b28d', '#ffe5ad'],
};

function lamp(c, x, y) {
  rect(c, x - 2, y - 68, 4, 68, '#34425b');
  rect(c, x, y - 65, 2, 62, '#7f8b91');
  rect(c, x - 11, y - 65, 22, 4, '#7e624d');
  rect(c, x - 9, y - 62, 18, 19, '#9b4854');
  rect(c, x - 6, y - 60, 12, 15, '#ed9d68');
  rect(c, x - 3, y - 59, 6, 13, '#ffe5a8');
  rect(c, x - 11, y - 44, 22, 3, '#9b754f');
  rect(c, x, y - 41, 2, 9, '#dba66d');
  rect(c, x - 14, y - 5, 28, 5, '#51516c');
}

export function createScenery(biome = { type: 'forest' }) {
  const canvas = document.createElement('canvas');
  canvas.width = WORLD_WIDTH / 2; canvas.height = 550;
  const c = canvas.getContext('2d'); c.scale(.5, .5); c.imageSmoothingEnabled = false;
  const rng = random(9026), [dark, rock, face, moss, grass, light] = THEMES[biome.type] ?? THEMES.forest;
  for (const p of PLATFORMS) {
    rect(c, p.x, p.y + 4, p.w, 1100 - p.y, dark);
    // Stone strata have clear clusters and deliberate highlights, with quiet dark depth below.
    for (let row = 0; row < 5; row++) {
      const y = p.y + 13 + row * 26;
      for (let x = p.x - (row % 2) * 32; x < p.x + p.w; x += 64) {
        const width = Math.min(59, p.x + p.w - Math.max(x, p.x));
        if (width < 1) continue;
        rect(c, Math.max(x, p.x), y, width, 22, row < 2 ? rock : dark);
        if (row < 3 && rng() > .45) {
          rect(c, Math.max(x, p.x) + 2, y, width - 4, 2, face);
          rect(c, Math.max(x, p.x), y + 3, 2, 8, face);
        }
      }
    }
    rect(c, p.x, p.y + 6, p.w, 7, moss);
    rect(c, p.x, p.y + 2, p.w, 6, grass);
    rect(c, p.x, p.y, p.w, 2, light);
    for (let x = p.x; x < p.x + p.w; x += 8) {
      const h = 2 + Math.floor(rng() * 4) * 2;
      if (rng() > .5) {
        rect(c, x, p.y - h, 2, h, grass);
        rect(c, x + 2, p.y - h + 2, 2, h - 2, light);
      }
      if (rng() > .91) {
        const vine = 12 + Math.floor(rng() * 8) * 4;
        rect(c, x, p.y + 9, 2, vine, moss);
        for (let i = 0; i < vine; i += 8) rect(c, x - 2, p.y + 10 + i, 6, 2, grass);
      }
      if (rng() > .975) {
        rect(c, x, p.y - 8, 2, 8, moss);
        rect(c, x - 2, p.y - 10, 6, 4, '#e4a8c9');
        rect(c, x, p.y - 12, 2, 2, '#ffe2cf');
      }
    }
    // Roots and cracks stay grouped, rather than applying noise across the whole ground.
    for (let x = p.x + 20; x < p.x + p.w; x += 136) {
      rect(c, x, p.y + 21, 2, 27, dark);
      rect(c, x - 8, p.y + 48, 10, 2, dark);
      rect(c, x - 8, p.y + 48, 2, 18, dark);
    }
    const texture=terrainTexture.image;
    if(texture.complete&&texture.naturalWidth&&['forest','bamboo','mountain','heaven','snow'].includes(biome.type)){
      c.save();c.beginPath();c.rect(p.x,0,p.w,1100);c.clip();
      if(biome.type==='snow')c.filter='saturate(.2) brightness(1.3)';
      const tileWidth=384,tileHeight=256;
      for(let x=p.x;x<p.x+p.w;x+=tileWidth)c.drawImage(texture,x,p.y-80,tileWidth,tileHeight);
      c.restore();
    }
  }
  for (const x of [440, 670, 950, 1550, 2100, 2980, 3550, 3900]) {
    lamp(c, x, PLATFORMS.find(p => x >= p.x && x < p.x + p.w)?.y ?? 650);
  }
  // A compact jade altar under the quest elder, leaving the central play lane clear.
  for (let i = 0; i < 4; i++) rect(c, 310 + i * 7, 616 - i * 4, 104 - i * 14, 4, i % 2 ? '#709e99' : '#354f66');
  for (const x of [1250, 2350, 4100, 4950]) {
    const y = PLATFORMS.find(p => x >= p.x && x < p.x + p.w)?.y ?? 650;
    polygon(c, [[x - 18, y], [x - 22, y - 18], [x - 8, y - 32], [x + 9, y - 29], [x + 23, y - 11], [x + 18, y]], rock);
    rect(c, x - 10, y - 27, 17, 3, face);
    rect(c, x - 4, y - 22, 2, 9, '#70c9c4');
    rect(c, x - 8, y - 17, 10, 2, '#70c9c4');
  }
  return canvas;
}
