import './style.css';
import { Game, ZONES } from './game/model.js';
import { Renderer } from './game/renderer.js';
import { drawCharacter, drawSkillArt } from './game/art.js';
import { Soundscape } from './game/audio.js';
import { hydrateIcons, icon } from './icons.js';
import { createExpansionUI, WIDE_SCREENS } from './expansion/ui.js';
import { MAPS } from './expansion/content.js';
import './expansion/style.css';
import '@fontsource/vt323/400.css';
import './pixel/style.css';
import './pixel/refinement.css';
import { artworkReady, cultivators, swordsmanActions } from './pixel/assets.js';
import { drawSwordPreview } from './pixel/sword-preview.js';
import { clearPixelTextCache, paintPixelScenes } from './pixel/graphics.js';

const SAVE_KEY='van-mong-tien-lo:v1';
const $=(s)=>document.querySelector(s);
const format=(v)=>Math.floor(v).toLocaleString('vi-VN');
let saved=null;
try{saved=JSON.parse(localStorage.getItem(SAVE_KEY));}catch{/* A corrupt or blocked local save starts a new journey. */}
const game=new Game(saved);
const renderer=new Renderer($('#world'),game);
const sound=new Soundscape();
const keys=new Set(),held=new Set();
const dialog=$('#game-dialog');
let modal=null,lastSave=0,lastUI=0,lastFrame=performance.now(),lastToast='',lastToastAt=0;
let storageAvailable=true;
const ui={};
['hp-fill','hp-label','mp-fill','mp-label','level-badge','realm-label','currency-jade','currency-coins','xp-label','xp-fill','xp-level','potion-count','zone-title','zone-description','coordinates','flight-button','auto-button','meditation-notice','interaction-prompt','quest-name','quest-objective','quest-count','quest-claim','quest-notice'].forEach(id=>ui[id]=document.getElementById(id));
const skillButtons=[...document.querySelectorAll('[data-skill]')];

function portrait(canvas,npc=false,full=false){
  const width=Number(canvas.dataset.logicalWidth??canvas.width),height=Number(canvas.dataset.logicalHeight??canvas.height);
  canvas.dataset.logicalWidth=width;canvas.dataset.logicalHeight=height;canvas.width=width/2;canvas.height=height/2;
  const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.scale(.5,.5);c.clearRect(0,0,width,height);
  if(!full){c.fillStyle='#153537';c.fillRect(0,0,width,height);c.fillStyle='#294f43';c.fillRect(6,6,width-12,height-12);}
  if(!npc&&swordsmanActions.image.complete&&swordsmanActions.image.naturalWidth){
    const hero=swordsmanActions.image;c.fillStyle='#1c3047';if(!full)c.fillRect(0,0,width,height);
    if(full)c.drawImage(hero,30,0,350,341,0,height-width*341/350,width,width*341/350);
    else c.drawImage(hero,72,30,220,220,0,0,width,height);
    return;
  }
  const image=cultivators.image;
  if(image.complete&&image.naturalWidth){
    if(full){const size=Math.min(width,height*.75);c.drawImage(image,npc?image.naturalWidth/2:0,npc?image.naturalHeight/2:0,image.naturalWidth/4,image.naturalHeight/2,(width-size)/2,height-size*4/3,size,size*4/3);}
    else{c.fillStyle='#232c47';c.fillRect(0,0,width,height);c.drawImage(image,(npc?image.naturalWidth/2:0)+135,(npc?image.naturalHeight/2+30:70),180,180,0,0,width,height);}
    return;
  }
  drawCharacter(c,width/2,full?height-15:height+13,{npc,scale:full?1.6:1.08});
}
function drawUIArt(root=document){hydrateIcons(root);root.querySelectorAll('[data-skill-art]').forEach(c=>drawSkillArt(c,c.dataset.skillArt));root.querySelectorAll('[data-portrait]').forEach(c=>portrait(c,c.dataset.portrait==='npc',c.dataset.full==='true'));paintPixelScenes(root);}
drawUIArt();portrait($('#portrait'));
artworkReady.then(()=>{document.querySelectorAll('.pixel-landscape').forEach(el=>el.remove());drawUIArt();portrait($('#portrait'));renderer.refreshArt();});
document.fonts.load('24px VT323','Vân Mộng Tiên Lộ Độ Kiếp Trường Sinh').then(()=>{clearPixelTextCache();});

function toast(text,tone=''){
  const now=performance.now();if(text===lastToast&&now-lastToastAt<1800)return;lastToast=text;lastToastAt=now;
  const el=document.createElement('div');el.className=`toast ${tone}`;el.textContent=text;$('#toasts').append(el);
  while($('#toasts').children.length>3)$('#toasts').firstElementChild.remove();
  setTimeout(()=>{el.classList.add('fade');setTimeout(()=>el.remove(),350);},3500);
}
function journal(text,label='Tiên lộ',npc=false){
  const p=document.createElement('p'),time=document.createElement('time');time.textContent=label;time.className=npc?'npc-time':'';p.append(time,document.createTextNode(text));$('#journal-entries').append(p);
  while($('#journal-entries').children.length>3)$('#journal-entries').firstElementChild.remove();
}
function save(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.serialize()));$('#save-status').textContent='Đã lưu tiến trình';storageAvailable=true;}
  catch{storageAvailable=false;$('#save-status').textContent='Lưu trữ bị chặn · Tiến trình chỉ giữ trong phiên này';}
}
function handleEvents(){
  for(const event of game.drainEvents()){
    renderer.onEvent(event);sound.effect(event);
    if(event.type==='notice'){toast(event.text,event.tone);if(event.tone)journal(event.text);}
    if(event.type==='kill')journal(`Hạ ${event.name} · +${event.xp} tu vi · +${event.coins} đồng.`,'Chiến đấu');
    if(event.type==='travel'){renderer.camera.x=Math.max(0,game.player.x-renderer.w*.44);renderer.camera.y=100;}
  }
}

function modalHeader(eyebrow,title,ico){return `<header class="modal-header"><i>${icon(ico)}</i><div class="modal-title-group"><span class="modal-eyebrow">${eyebrow}</span><h2>${title}</h2></div><button class="modal-close" data-action="close" aria-label="Đóng">×</button></header>`;}
const modalFooter=()=>`<footer class="modal-footer"><span><i>${icon('save')}</i> ${storageAvailable?'Tiến trình được lưu tự động':'Lưu trữ trên thiết bị đang bị chặn'}</span><span><kbd>ESC</kbd> Đóng</span></footer>`;
const art=(id,size=48)=>`<canvas width="48" height="48" style="width:${size}px;height:${size}px" data-skill-art="${id}"></canvas>`;
function button(text,action,classes=''){return `<button class="jade-button ${classes}" data-action="${action}">${text}</button>`;}

function mapContent(){return modalHeader('THANH VÂN GIỚI','Linh cảnh đồ','world')+`<div class="modal-body"><p class="modal-intro">Theo dòng linh mạch, tìm tiên duyên giữa núi rừng. Chọn điểm dừng trong khu vực để dịch chuyển miễn phí. Mở Đại bản đồ [O] để khám phá 120 linh cảnh.</p><div class="map-art"><div class="map-mountain one"></div><div class="map-mountain two"></div><div class="map-mountain three"></div><div class="map-path"></div>${ZONES.map((z,i)=>`<div class="map-marker ${i===game.zoneIndex?'current':''}" style="left:${20+i*31}%;top:${67-i*10}%"><i></i><span>${z.name}</span><small>${i===game.zoneIndex?'BẠN ĐANG Ở ĐÂY':['KHỞI ĐẦU','LINH LÂM','CỔ TRẬN'][i]}</small></div>`).join('')}</div><div class="map-zones">${ZONES.map((z,i)=>`<div class="zone-card"><strong>${z.name}</strong><small>${['Trưởng lão · Mộc Yêu','Linh Hồ · Rừng trúc','Cổ trận · Linh Vương'][i]}</small><button class="jade-button ${i===game.zoneIndex?'secondary':''}" data-action="teleport" data-zone="${i}">Dịch chuyển ${icon('arrow')}</button></div>`).join('')}</div><div class="modal-actions"><button class="jade-button" data-action="atlas">Mở đại bản đồ · 120 linh cảnh</button></div><p class="settings-note">Bạn cũng có thể tự ngự kiếm khám phá toàn bộ bản đồ bằng A / D. Linh Vương ở phía đông Thiên Vân Đài; hãy chuẩn bị kỹ năng và đan dược.</p></div>`+modalFooter();}
function shopContent(){return modalHeader('THƯƠNG NHÂN VÂN DU','Linh Dược Các','shop')+`<div class="modal-body"><p class="modal-intro">“Một viên linh đan, thêm một phần tiên duyên.”<br><strong>Bạn có <span id="shop-coins">${format(game.player.coins)}</span> đồng.</strong></p><div class="shop-product">${art('potion')}<div><strong>Hồi Xuân Đan</strong><p>Hồi 60% sinh lực tối đa.</p><small><i class="gold-coin"></i>80 đồng · Đang có ${game.player.potions}</small></div>${button('Mua ×1','buy-potion')}</div><div class="shop-product">${art('spirit')}<div><strong>Tụ Linh Đan</strong><p>Hồi 60% linh lực tối đa.</p><small><i class="gold-coin"></i>120 đồng · Đang có ${game.player.spiritPotions}</small></div>${button('Mua ×1','buy-spirit')}</div><div class="modal-actions"><button class="jade-button" data-action="alchemy">Luyện đan · 120 linh đan</button><button class="jade-button secondary" data-action="forge">Luyện khí & pháp bảo</button></div><p class="settings-note">Đồng nhận được khi đánh bại linh vật. Đan dược mua được sẽ vào hành trang ngay lập tức.</p></div>`+modalFooter();}
function settingsContent(){return modalHeader('TÙY CHỈNH TRẢI NGHIỆM','Cài đặt','settings')+`<div class="modal-body"><div class="settings-row"><div><strong>Âm thanh tiên cảnh</strong><p>Giai điệu nhẹ và âm thanh kỹ năng.</p></div><button class="toggle" role="switch" aria-checked="${game.settings.sound}" aria-label="Âm thanh tiên cảnh" data-action="sound"></button></div><div class="settings-row"><div><strong>Hoa bay & đom đóm</strong><p>Hiệu ứng không gian, có thể tắt để giảm tải.</p></div><button class="toggle" role="switch" aria-checked="${game.settings.particles}" aria-label="Hoa bay và đom đóm" data-action="particles"></button></div><div class="settings-row"><div><strong>Giảm chuyển động</strong><p>Tắt rung nhân vật, hoa bay và di chuyển camera mượt.</p></div><button class="toggle" role="switch" aria-checked="${game.settings.reducedMotion}" aria-label="Giảm chuyển động" data-action="motion"></button></div><div class="settings-row"><div><strong>Tiến trình trên thiết bị</strong><p>Trò chơi đơn nhân. Dữ liệu lưu trên trình duyệt này.</p></div><button class="danger-button" data-action="reset-prompt">Chơi lại từ đầu</button></div><div id="reset-warning" hidden class="reset-warning">Bạn sẽ mất tiến trình, vật phẩm và cảnh giới đang lưu trên thiết bị này.<div class="modal-actions">${button('Xác nhận chơi lại','reset','gold-button')}${button('Giữ hành trình hiện tại','reset-cancel','secondary')}</div></div><p class="settings-note">Cửu Thiên 2.0 · Game tu tiên pixel đơn nhân với bộ hình ảnh riêng và âm thanh tổng hợp. Không cần tài khoản hay kết nối máy chủ để chơi sau khi tải.</p></div>`+modalFooter();}
function helpContent(){
  const controls=[['Di chuyển','A','D'],['Bay lên / xuống','W','S'],['Khinh công / bay lên','SPACE'],['Trảm kiếm','J'],['Bốn kiếm quyết','1','2','3','4'],['Ngự kiếm / hạ kiếm','F'],['Tương tác','E'],['Hồi Xuân Đan','H'],['Tự động chiến đấu','T'],['Nhập định tu luyện','M'],['Hành trang','B'],['Nhân vật','C'],['Bản đồ khu vực','L'],['Đại bản đồ','O'],['Nhiệm vụ','Q'],['Kiếm quyết','K'],['Luyện đan','U'],['Tộc & linh căn','R'],['Tông môn','N'],['Vạn vật chí','I'],['Lướt né','SHIFT'],['Đóng bảng','ESC'],['Hướng dẫn','?']];
  return modalHeader('TÂN THỦ NHẬP ĐẠO','Bí kíp du hành','help')+`<div class="modal-body"><p class="modal-intro">Bạn là một tán tu vừa đặt chân đến <strong>Vân Mộng Cốc</strong>. Tiến về phía đông, đánh bại linh vật để tích tu vi, hoặc tìm nơi an toàn để nhập định. Đủ tu vi, hãy mở Tu luyện để đột phá.</p><div class="help-grid">${controls.map(([label,...keys])=>`<div class="help-key"><span>${label}</span><span>${keys.map(k=>`<kbd>${k}</kbd>`).join('')}</span></div>`).join('')}</div><p class="settings-note">Trên điện thoại, dùng các nút mũi tên để di chuyển và chạm biểu tượng kỹ năng để thi triển. Khi mở bảng thông tin, chiến đấu tạm dừng. Chạm nút tương tác E trên màn hình để hái thảo hoặc gặp NPC. Mở Cửu Thiên để vào các hệ thống mở rộng. Tiến trình tự lưu sau mỗi 3 giây; bản lưu nằm trên thiết bị này.</p></div>`+modalFooter();
}
const contents={map:mapContent,shop:shopContent,settings:settingsContent,help:helpContent};
const expansion=createExpansionUI(game,{header:modalHeader,footer:modalFooter,art,button,open:openModal,close:closeModal});
Object.assign(contents,expansion.screens);
function openModal(type){
  if(!contents[type])return;modal=type;expansion.onOpen(type);dialog.classList.toggle('expanded',WIDE_SCREENS.includes(type));keys.clear();held.clear();$('#dialog-content').innerHTML=contents[type]();drawUIArt($('#dialog-content'));
  if(!dialog.open)dialog.showModal();
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.action===type||(type==='map'&&el.dataset.action==='world')));
}
function closeModal(){keys.clear();held.clear();dialog.close();}
dialog.addEventListener('close',()=>{modal=null;document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.action==='world'));$('#world').focus({preventScroll:true});save();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeModal();}});

async function action(id,buttonEl){
  if(contents[id])openModal(id);
  else switch(id){
    case 'world':if(dialog.open)closeModal();$('#world').focus({preventScroll:true});break;
    case 'close':closeModal();break;
    case 'x':expansion.onAction(buttonEl);break;
    case 'interact':{const result=game.interact();if(typeof result==='string')openModal(result);break;}
    case 'flight':game.toggleFlight();break;
    case 'auto':game.player.auto=!game.player.auto;game.toggleMeditation(false);toast(game.player.auto?'Tự chiến đã bật · Nhấn T để điều khiển lại.':'Đã tắt tự chiến.');break;
    case 'meditate':game.toggleMeditation();if(dialog.open)closeModal();break;
    case 'breakthrough':game.breakthrough();if(game.tribulation?.active)closeModal();else openModal('cultivation');break;
    case 'claim':game.claimQuest();openModal('quests');break;
    case 'teleport':game.teleport(Number(buttonEl.dataset.zone));closeModal();renderer.camera.x=Math.max(0,Math.min(5200-renderer.w,game.player.x-renderer.w*.44));break;
    case 'use-potion':game.usePotion();if(modal==='inventory')openModal('inventory');break;
    case 'use-spirit':game.usePotion(true);openModal('inventory');break;
    case 'buy-potion':game.buy();openModal('shop');break;
    case 'buy-spirit':game.buy(true);openModal('shop');break;
    case 'sound':game.settings.sound=await sound.setEnabled(!game.settings.sound);$('#sound-icon').innerHTML=icon(game.settings.sound?'sound':'sound-off');document.querySelector('[data-action="sound"]').setAttribute('aria-label',game.settings.sound?'Tắt âm thanh':'Bật âm thanh');if(modal==='settings')openModal('settings');break;
    case 'particles':game.settings.particles=!game.settings.particles;openModal('settings');break;
    case 'motion':game.settings.reducedMotion=!game.settings.reducedMotion;openModal('settings');break;
    case 'reset-prompt':$('#reset-warning').hidden=false;break;
    case 'reset-cancel':$('#reset-warning').hidden=true;break;
    case 'reset':try{localStorage.removeItem(SAVE_KEY);location.reload();}catch{toast('Trình duyệt đang chặn lưu trữ. Hãy cho phép lưu trữ để chơi lại.');}return;
    case 'journal':openModal('quests');break;
  }
  handleEvents();updateUI();save();
}
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-action],[data-skill]');if(!button)return;
  if(button.dataset.skill){if(dialog.open)return;button.dataset.skill==='potion'?game.usePotion():game.cast(button.dataset.skill);handleEvents();updateUI();}
  else void action(button.dataset.action,button);
});
let inputDebounce;
document.addEventListener('input',e=>{if(!e.target.matches('[data-exp-input]'))return;clearTimeout(inputDebounce);const el=e.target;inputDebounce=setTimeout(()=>{if(el.isConnected)expansion.onInput(el);},120);});

const mappedKeys=new Set(['a','d','w','s','arrowleft','arrowright','arrowup','arrowdown',' ','j','1','2','3','4','f','h','t','m','b','c','l','q','e','?','k','i','n','u','o','r','shift']);
document.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(dialog.open)return;
  if(mappedKeys.has(k))e.preventDefault();
  keys.add(k);
  if(e.repeat)return;
  const skills=Object.fromEntries(game.loadout.map((id,i)=>[String(i+1),id]));
  if(k==='j'){game.cast('attack');handleEvents();}
  if(skills[k]){game.cast(skills[k]);handleEvents();}
  const actions={f:'flight',h:'use-potion',t:'auto',m:'meditate',b:'inventory',c:'character',l:'map',q:'quests','?':'help',k:'skills',i:'codex',n:'sects',u:'alchemy',o:'atlas',r:'profile'};
  if(actions[k])void action(actions[k]);
  if(k==='e'){
    const result=game.interact();if(typeof result==='string')openModal(result);handleEvents();updateUI();save();
  }
  if(k==='shift'){game.dash();handleEvents();}
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();held.clear();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();held.clear();save();}});
window.addEventListener('pagehide',save);
document.querySelectorAll('[data-hold]').forEach(el=>{
  el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);held.add(el.dataset.hold);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(name,()=>held.delete(el.dataset.hold));
});
$('#world').addEventListener('pointerdown',()=>$('#world').focus({preventScroll:true}));
document.addEventListener('pointerdown',()=>{if(game.settings.sound&&!sound.enabled)void sound.setEnabled(true);},{once:true});

function updateUI(){
  const p=game.player,q=game.quest,z=ZONES[game.zoneIndex];
  ui['hp-fill'].style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;ui['hp-label'].textContent=`${format(p.hp)} / ${format(p.maxHp)}`;
  ui['mp-fill'].style.width=`${p.mp/p.maxMp*100}%`;ui['mp-label'].textContent=`${format(p.mp)} / ${format(p.maxMp)}`;
  ui['realm-label'].textContent=`${game.realm.name} · Tầng ${game.realm.stage}`;ui['level-badge'].textContent=p.level;
  ui['currency-jade'].textContent=format(p.jade);ui['currency-coins'].textContent=format(p.coins);
  $('#currency-fairy').textContent=format(p.fairy);$('#currency-divine').textContent=format(p.divine);
  ui['xp-label'].textContent=`${format(p.xp)} / ${format(game.xpRequired)} tu vi`;ui['xp-fill'].style.width=`${Math.min(100,p.xp/game.xpRequired*100)}%`;ui['xp-level'].textContent=['I','II','III','IV','V','VI','VII','VIII','IX'][game.realm.stage-1];
  $('.cultivation-track>span:first-child').firstChild.textContent=game.realm.name.toLocaleUpperCase('vi-VN')+' ';
  ui['potion-count'].textContent=p.potions;
  ui['flight-button'].classList.toggle('active',p.flying);ui['flight-button'].setAttribute('aria-pressed',String(p.flying));ui['auto-button'].classList.toggle('active',p.auto);ui['auto-button'].setAttribute('aria-pressed',String(p.auto));
  ui['meditation-notice'].hidden=!p.meditating;
  ui['zone-title'].textContent=game.mapId===MAPS[0].id?z.name:game.activeMap.name;ui['zone-description'].textContent=game.mapId===MAPS[0].id?z.subtitle:`${game.activeMap.world} · Linh cảnh bậc ${game.activeMap.tier}`;
  $('.minimap-heading>span').innerHTML=`<i class="live-dot"></i> ${ui['zone-title'].textContent.toLocaleUpperCase('vi-VN')}`;
  ui['coordinates'].textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`;
  const near=game.nearby;
  ui['interaction-prompt'].hidden=!near||dialog.open;
  ui['interaction-prompt'].querySelector('span').textContent=near?.label??'';
  if(p.meditating)$('#meditation-notice b').textContent=`+${format(game.cultivationRate)} tu vi / giây`;
  ui['quest-name'].textContent=q.claimed?'Trấn áp Linh Vương':'Khởi đầu tiên lộ';
  ui['quest-objective'].textContent=q.claimed?'Đánh bại Linh Vương':'Đánh bại Mộc Yêu';
  ui['quest-count'].textContent=q.claimed?(q.bossKilled?'1/1':'0/1'):`${q.kills}/3`;
  const canClaim=(!q.claimed&&q.kills>=3)||(q.claimed&&q.bossKilled&&!q.bossClaimed);
  ui['quest-claim'].hidden=!canClaim;ui['quest-notice'].classList.toggle('visible',canClaim);
  if(q.bossClaimed){ui['quest-name'].textContent='Cửu Thiên · Tiên duyên';ui['quest-objective'].textContent='Mở Cửu Thiên để nhận tiên duyên';ui['quest-count'].textContent='>';}
  let loadoutIndex=0;
  for(const b of skillButtons){let id=b.dataset.skill;if(!['attack','potion'].includes(id)){id=game.loadout[loadoutIndex++];b.dataset.skill=id;const def=game.skillDefinition(id),canvas=b.querySelector('canvas');if(canvas.dataset.current!==id){drawSkillArt(canvas,def.effect);canvas.dataset.current=id;const shortName=def.name.includes(' · ')?def.name.split(' · ')[1]:def.name;b.querySelector('.skill-label').textContent=({swords:'Vạn Kiếm',flame:'Phượng Hỏa',heal:'Thanh Tâm',storm:'Thiên Lôi',dragon:'Thần Long',ice:'Băng Phong',vortex:'Ma Vực',shield:'Kim Thân',meteor:'Thiên Thạch',clone:'Phân Thân',blades:'Kiếm Trận',lotus:'Phật Liên','wind-edge':'Kiếm Khí','wind-step':'Lướt Chém','wind-wheel':'Phong Quyển','wind-wall':'Phong Bích','wind-final':'Vô Song'})[def.effect]??shortName;b.title=`${def.name} · ${def.cost} linh lực`;}}const cd=id==='potion'?game.potionCooldown:(id==='windStep'&&game.windStepRecastUntil>game.time?0:game.cooldowns[id]??0);b.classList.toggle('recast-ready',id==='windStep'&&game.windStepRecastUntil>game.time);const overlay=b.querySelector('.cooldown');overlay.classList.toggle('active',cd>0);overlay.textContent=cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):'';b.setAttribute('aria-label',`${id==='potion'?'Hồi Xuân Đan':game.skillDefinition(id)?.name}${cd>0?` · hồi ${Math.ceil(cd)} giây`:''}`);}
  const tr=game.tribulation;$('#tribulation-hud').hidden=!tr?.active;if(tr?.active){$('#tribulation-wave').textContent=`${tr.wave} / 9`;$('#tribulation-progress').innerHTML=Array.from({length:9},(_,i)=>`<i class="${i<tr.wave?'lit':''}"></i>`).join('');}
  $('#active-buffs').innerHTML=Object.entries(game.buffs).filter(([,end])=>end>game.time).map(([id,end])=>`<span title="${id}"><i>${icon(({attack:'sword',crit:'spark',speed:'arrow',regen:'heart',insight:'lotus',resist:'storm',loot:'jade'})[id]??'spark')}</i><b>${Math.ceil(end-game.time)}s</b></span>`).join('')+(p.shield>0?`<span title="Lá chắn"><i>${icon('shield')}</i><b>${format(p.shield)}</b></span>`:'');
  renderer.drawMinimap($('#minimap'));
}
function tick(now){
  const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
  if(!dialog.open&&!document.hidden){
    const left=keys.has('a')||keys.has('arrowleft')||held.has('left'),right=keys.has('d')||keys.has('arrowright')||held.has('right'),up=keys.has('w')||keys.has('arrowup')||keys.has(' ')||held.has('up'),down=keys.has('s')||keys.has('arrowdown');
    game.update(dt,{axisX:Number(right)-Number(left),axisY:Number(down)-Number(up),jump:up,attack:keys.has('j')});
    handleEvents();
  }
  renderer.frame(dt);
  if(dialog.open&&modal==='skills'){const preview=dialog.querySelector('[data-sword-preview]');if(preview)drawSwordPreview(preview,now/1000,game.settings);}
  sound.update(now/1000);
  if(now-lastUI>90){updateUI();lastUI=now;}
  if(now-lastSave>3000){save();lastSave=now;}
  requestAnimationFrame(tick);
}
if(game.settings.sound)$('#sound-icon').innerHTML=icon('sound');
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)game.settings.reducedMotion=true;
updateUI();requestAnimationFrame(tick);
setTimeout(()=>{if(!saved)toast('Tiên lộ đã mở. Dùng A / D để du hành, phím 1–4 để thi triển kiếm quyết.','jade');},1400);
