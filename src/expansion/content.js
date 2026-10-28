// Deterministic content: curated foundations + explicit elemental/rank variants.
// Recipes are deliberately excluded from CONTENT_COUNT to avoid double counting.
export const ELEMENTS = [
  { id:'metal', name:'Kim', color:'#e4cc87', icon:'swords', effect:'blades' },
  { id:'wood', name:'Mộc', color:'#a8d88c', icon:'heal', effect:'lotus' },
  { id:'water', name:'Thủy', color:'#8bcfdf', icon:'spirit', effect:'dragon' },
  { id:'fire', name:'Hỏa', color:'#edaa70', icon:'flame', effect:'flame' },
  { id:'earth', name:'Thổ', color:'#d4b484', icon:'jade', effect:'shield' },
  { id:'wind', name:'Phong', color:'#a8e0cd', icon:'attack', effect:'vortex' },
  { id:'thunder', name:'Lôi', color:'#c0abea', icon:'storm', effect:'storm' },
  { id:'ice', name:'Băng', color:'#a1e3ed', icon:'swords', effect:'ice' },
];
export const REALMS = ['Luyện Khí','Trúc Cơ','Kim Đan','Nguyên Anh','Hóa Thần','Luyện Hư','Hợp Thể','Đại Thừa','Độ Kiếp','Nhân Tiên','Địa Tiên','Thiên Tiên','Kim Tiên','Tiên Vương','Tiên Đế','Thần Cảnh'];
export const MAX_LEVEL = REALMS.length * 9;
export const realmAt = level => ({name:REALMS[Math.min(REALMS.length-1,Math.floor((level-1)/9))],stage:(level-1)%9+1,index:Math.floor((level-1)/9)});
export const levelAtTier = tier => [1,10,19,28,46,64,82,100,118,136][tier-1];
export const tierAtLevel = level => Math.min(10,1+[10,19,28,46,64,82,100,118,136].filter(n=>level>=n).length);
export const RACES = [
  {id:'human',name:'Nhân Tộc',title:'Vạn pháp quy nguyên',description:'Cân bằng, không giảm chỉ số; nhận thêm 10% tu vi nhiệm vụ.',attack:1,hp:1,regen:1,questXp:1.1},
  {id:'spirit',name:'Linh Tộc',title:'Thiên địa chi tử',description:'Hồi linh lực +35%, sinh lực −8%.',attack:1,hp:.92,regen:1.35,questXp:1},
  {id:'demon',name:'Ma Tộc',title:'Nghịch thiên hành đạo',description:'Sát thương +18%, hồi linh lực −15%.',attack:1.18,hp:1,regen:.85,questXp:1},
  {id:'dragon',name:'Long Tộc',title:'Chân long huyết mạch',description:'Sinh lực +20%, sát thương +8%, tốc độ −8%.',attack:1.08,hp:1.2,regen:1,speed:.92,questXp:1},
  {id:'fox',name:'Thiên Hồ Tộc',title:'Cửu vĩ huyễn tâm',description:'Bạo kích +12%, tốc độ +8%.',attack:1,hp:1,regen:1,crit:.12,speed:1.08,questXp:1},
  {id:'phoenix',name:'Phượng Tộc',title:'Dục hỏa trùng sinh',description:'Sinh lực +8%; kỹ năng hệ Hỏa +25% sát thương.',attack:1,hp:1.08,regen:1,element:'fire',elementBonus:.25,questXp:1},
  {id:'ancient',name:'Cổ Thần Tộc',title:'Bất diệt kim thân',description:'Sinh lực +30%, tốc độ −12%, sát thương +5%.',attack:1.05,hp:1.3,regen:1,speed:.88,questXp:1},
  {id:'celestial',name:'Thiên Nhân Tộc',title:'Vạn cổ tiên duyên',description:'Tu luyện nhanh hơn 25%, hồi linh lực +15%.',attack:1,hp:1,regen:1.15,cultivation:1.25,questXp:1},
];
export const ROOTS = [{id:'mixed',name:'Tạp Linh Căn',description:'Chưa thức tỉnh. Có thể chọn linh căn lần đầu miễn phí.',element:null,bonus:0},...ELEMENTS.map(e=>({id:e.id,name:`Thiên ${e.name} Linh Căn`,description:`Kỹ năng hệ ${e.name} tăng 30% sát thương; tu luyện tăng 12%.`,element:e.id,bonus:.3}))];
export const SECTS = [
  ['thanh-van','Thanh Vân Kiếm Tông','metal','Nhất kiếm khai thiên','swords'],
  ['dan-ha','Đan Hà Cốc','wood','Dược đạo thông huyền','heal'],
  ['huyen-bang','Huyền Băng Cung','ice','Băng phong vạn giới','ice'],
  ['xich-diem','Xích Diệm Thần Giáo','fire','Phượng hỏa phần thiên','flame'],
  ['long-cung','Thương Hải Long Cung','water','Long du tứ hải','dragon'],
  ['thien-loi','Thiên Lôi Điện','thunder','Lôi đình chính pháp','storm'],
  ['vo-tuong','Vô Tướng Thiền Tông','earth','Kim cang bất hoại','shield'],
  ['phong-linh','Phong Linh Tiên Các','wind','Tiêu dao vô cực','vortex'],
  ['van-thu','Vạn Thú Sơn','wood','Ngự thú thông linh','clone'],
  ['thai-hu','Thái Hư Đạo Môn','metal','Thái hư kiếm ý','blades'],
  ['u-minh','U Minh Huyền Tông','water','Huyền minh thôn phệ','vortex'],
  ['tinh-ha','Tinh Hà Thánh Địa','thunder','Tinh thần diệt thế','meteor'],
].map(([id,name,element,motto,skill],i)=>({id,name,element,motto,skill,color:ELEMENTS.find(e=>e.id===element).color,description:`${motto}. Kỹ năng hệ ${ELEMENTS.find(e=>e.id===element).name} +12% sát thương; hoàn thành tiên duyên nhận công hiến.`,bonus:.12,index:i}));
export const BIOMES = [
  {name:'Vân Mộng Cốc',short:'Vân Mộng',type:'forest',sky:['#173442','#486966','#6d8e78'],color:'#8bc5ae',hue:0,monsters:['Mộc Yêu','Thanh Diệp Tinh','Linh Hồ','Sơn Linh','Độc Đằng Yêu','Ngọc Giáp Trùng'],boss:'Xích Diệm Linh Vương',element:'wood'},
  {name:'Trúc Ảnh Lâm',short:'Trúc Ảnh',type:'bamboo',sky:['#102f31','#315e50','#84936b'],color:'#a6ca84',hue:22,monsters:['Trúc Yêu','Bích Xà','Ảnh Lang','Linh Hầu','Độc Phong','Cổ Mộc Tinh'],boss:'Vạn Niên Trúc Tổ',element:'wood'},
  {name:'Thúy Vân Sơn',short:'Thúy Vân',type:'mountain',sky:['#24374d','#5c7391','#a2b6b1'],color:'#a6c7de',hue:165,monsters:['Sơn Thạch Quái','Vân Ưng','Bạch Viên','Huyền Quy','Ngọc Lân Thú','Phong Linh'],boss:'Bạch Hổ Sơn Quân',element:'metal'},
  {name:'Lạc Nhật Sa Mạc',short:'Lạc Nhật',type:'desert',sky:['#45334a','#ba7862','#d4b17a'],color:'#dfba7b',hue:-45,monsters:['Sa Trùng','Xích Hạt','Sa Lang','Cát Linh','Hoàng Xà','Thiết Giáp Hạt'],boss:'Hoàng Sa Cự Hạt',element:'earth'},
  {name:'Huyền Băng Nguyên',short:'Huyền Băng',type:'snow',sky:['#1d354d','#60899b','#bfd5c7'],color:'#a9e5e7',hue:130,monsters:['Băng Lang','Tuyết Yêu','Hàn Ngọc Tinh','Băng Hùng','Sương Hồn','Bạch Xà'],boss:'Huyền Băng Cự Long',element:'ice'},
  {name:'Xích Diệm Cốc',short:'Xích Diệm',type:'volcano',sky:['#331e36','#7a4646','#ad6f50'],color:'#edaa73',hue:-70,monsters:['Hỏa Linh','Dung Nham Quái','Xích Hồ','Viêm Xà','Hỏa Giáp Thú','Tro Tàn Tinh'],boss:'Phần Thiên Hỏa Phượng',element:'fire'},
  {name:'U Minh Lâm',short:'U Minh',type:'haunted',sky:['#1d1f39','#41425d','#718873'],color:'#b0a0d4',hue:90,monsters:['U Hồn','Minh Lang','Ám Mộc Yêu','Quỷ Hỏa','Huyết Biên Bức','Ảnh Ma'],boss:'Cửu U Minh Chủ',element:'water'},
  {name:'Thương Hải Bờ',short:'Thương Hải',type:'ocean',sky:['#173c51','#4c8a97','#acd0ba'],color:'#93d6db',hue:125,monsters:['Hải Linh','Thanh Giao','Bích Ngư','Thủy Mẫu','Hải Giáp Thú','Sóng Linh'],boss:'Thương Hải Giao Vương',element:'water'},
  {name:'Thiên Lôi Cảnh',short:'Thiên Lôi',type:'storm',sky:['#1c203e','#505375','#9294a3'],color:'#c5b4ed',hue:100,monsters:['Lôi Linh','Tử Điện Xà','Lôi Ưng','Thiên Lôi Thú','Điện Quang Tinh','Kiếp Hồn'],boss:'Cửu Thiên Lôi Đế',element:'thunder'},
  {name:'Cửu Tiêu Thiên',short:'Cửu Tiêu',type:'heaven',sky:['#344664','#8795a6','#ddd8b5'],color:'#e3d8a5',hue:25,monsters:['Vân Linh','Kim Ô','Thiên Vũ Thú','Ngọc Kỳ Lân','Phong Thần Tinh','Bạch Hạc Yêu'],boss:'Cửu Tiêu Thiên Quân',element:'wind'},
  {name:'Thái Hư Cổ Giới',short:'Thái Hư',type:'void',sky:['#13172f','#3c3b67','#8f82a2'],color:'#c4ace6',hue:115,monsters:['Hư Không Thú','Tinh Hồn','Hắc Lân Long','Thái Hư Ma','Nguyệt Linh','Thôn Tinh Trùng'],boss:'Thái Hư Cổ Thần',element:'metal'},
  {name:'Thần Vực Cấm Địa',short:'Thần Vực',type:'divine',sky:['#30283e','#776b6b','#c9ae78'],color:'#edcb83',hue:-25,monsters:['Thần Giáp Vệ','Kim Lân Thánh Thú','Cổ Thần Hồn','Thánh Hỏa Tinh','Thiên Mệnh Thú','Bất Diệt Linh'],boss:'Hỗn Độn Thần Vương',element:'earth'},
];
const regions=['Ngoại Vi','Nội Lâm','Linh Tuyền','Cổ Đạo','Động Thiên','Bí Cảnh','Tiên Vực','Thánh Địa','Thần Cung','Cấm Địa'];
export const MAPS=[];
for(let tier=1;tier<=10;tier++)BIOMES.forEach((biome,b)=>MAPS.push({id:`map-${tier}-${b}`,kind:'maps',name:tier===1?biome.name:`${biome.short} · ${regions[tier-1]}`,description:`${regions[tier-1]} của ${biome.name}. Có 6 loại linh vật, một trấn cảnh boss, 2 NPC và tài nguyên bậc ${tier}.`,tier,biome:b,requiredLevel:levelAtTier(tier),world:tier<7?'Phàm Giới':tier<10?'Tiên Giới':'Thần Giới',icon:'world',color:biome.color}));

const materialNames=['Thanh Tâm Thảo','Huyết Linh Hoa','Tụ Linh Diệp','Ngưng Sương Chi','Hỏa Liên Tử','Nguyệt Quang Thảo','Long Huyết Đằng','Thiên Tinh Quả','Bồ Đề Căn','Tử Vân Linh Chi','Cửu Diệp Liên','U Minh Hoa','Huyền Thiết','Tinh Ngân','Xích Đồng','Hàn Ngọc','Thiên Lôi Thạch','Thái Hư Tinh','Mộc Linh Tủy','Yêu Đan','Linh Thú Cốt','Hỏa Linh Tinh','Băng Phách','Thần Hồn Sa'];
export const MATERIALS=Array.from({length:10},(_,t)=>materialNames.map((name,b)=>({id:`mat-${t+1}-${b}`,kind:'materials',name:`${name} · Bậc ${t+1}`,description:`${b<12?'Linh thảo':b<18?'Khoáng thạch':'Tinh túy'} dùng luyện đan và rèn pháp khí. Tìm tại các linh cảnh bậc ${t+1}.`,tier:t+1,base:b,icon:b<12?'heal':b<18?'jade':'storm',color:ELEMENTS[b%8].color,value:(t+1)*15,source:b<12?'Hái linh thảo':b<18?'Khai khoáng':'Linh vật rơi ra'}))).flat();

export const GEAR_SLOTS={weapon:'Vũ khí',armor:'Pháp y',head:'Mũ / trâm',boots:'Giày',accessory:'Linh ngọc',artifact:'Pháp khí'};
const bases=[
  ['Thanh Phong Kiếm','weapon','attack'],['Trảm Nguyệt Đao','weapon','attack'],['Phá Quân Thương','weapon','swords'],['Thiên Cơ Trượng','weapon','storm'],['Càn Khôn Phiến','weapon','swords'],
  ['Vân Du Pháp Y','armor','robe'],['Long Lân Giáp','armor','robe'],['Tinh Hà Bào','armor','robe'],['Huyền Minh Pháp Y','armor','robe'],['Bất Diệt Tiên Y','armor','robe'],
  ['Ngọc Thanh Quan','head','jade'],['Thiên Tâm Trâm','head','jade'],['Cửu Tiêu Miện','head','jade'],['Huyền Vũ Khôi','head','jade'],['Tinh Thần Quan','head','jade'],
  ['Lưu Vân Ngoa','boots','attack'],['Trục Phong Hài','boots','attack'],['Đạp Tuyết Ngoa','boots','spirit'],['Hư Không Lý','boots','storm'],['Thần Hành Ngoa','boots','attack'],
  ['Ngọc Bích Hộ Thân','accessory','jade'],['Long Hồn Bội','accessory','jade'],['Phượng Huyết Châu','accessory','flame'],['Bồ Đề Niệm Châu','accessory','heal'],['Thiên Mệnh Hoàn','accessory','jade'],
  ['Trấn Hồn Chung','artifact','jade'],['Chiếu Thiên Kính','artifact','spirit'],['Cửu Long Đỉnh','artifact','flame'],['Sơn Hà Ấn','artifact','jade'],['Hỗn Thiên Hồ','artifact','storm'],
];
export const EQUIPMENT=[];
for(let tier=1;tier<=10;tier++)bases.forEach(([baseName,slot,art],b)=>ELEMENTS.forEach((element,e)=>[0,1].forEach(r=>{
  const power=Math.round((8+b%5*2)*tier**2*(r?1.65:1)),stat=slot==='weapon'?'attack':slot==='armor'?'defense':slot==='head'?'mp':slot==='boots'?'speed':slot==='accessory'?'hp':'attack';
  EQUIPMENT.push({id:`gear-${tier}-${b}-${e}-${r}`,kind:'equipment',name:`${r?'Cực Phẩm':'Thượng Phẩm'} ${element.name} ${baseName} · ${tier}`,description:`${GEAR_SLOTS[slot]} hệ ${element.name}. Có thể trang bị, cường hóa và chế tạo từ tài nguyên bậc ${tier}.`,tier,base:b,slot,element:element.id,rarity:r?'Cực Phẩm':'Thượng Phẩm',requiredLevel:levelAtTier(tier),stats:{[stat]:stat==='hp'?power*7:stat==='mp'?power*3:stat==='speed'?Math.min(40,power/3):power},icon:art,color:element.color,value:60*tier**2*(r?3:1)});
})));
export const STARTER_GEAR=[{id:'starter-sword',name:'Thanh Phong Kiếm',slot:'weapon',icon:'attack'},{id:'starter-robe',name:'Vân Du Pháp Y',slot:'armor',icon:'robe'},{id:'starter-jade',name:'Ngọc Bích Hộ Thân',slot:'accessory',icon:'jade'}].map(i=>({...i,kind:'equipment',tier:1,stats:{},element:'metal',description:'Trang bị nhập môn Thanh Vân, chỉ số đã tính trong căn cốt.',requiredLevel:1,color:'#acc6a0'}));

export const PILL_BASES=[
  ['Hồi Xuân Đan','heal','Phục hồi sinh lực.','potion'],['Tụ Linh Đan','mana','Phục hồi linh lực.','spirit'],['Bồi Nguyên Đan','xp','Bổ sung tu vi trực tiếp.','jade'],['Cuồng Huyết Đan','attack','Tăng 30% sát thương trong 90 giây.','flame'],['Hộ Mạch Đan','shield','Tạo lá chắn hấp thụ sát thương.','jade'],['Ngưng Thần Đan','crit','Tăng 20% tỉ lệ bạo kích trong 90 giây.','storm'],['Phong Hành Đan','speed','Tăng 35% tốc độ trong 90 giây.','attack'],['Tịnh Tâm Đan','regen','Hồi linh lực và sinh lực trong 90 giây.','heal'],['Phá Chướng Đan','insight','Nhận tu vi và tăng 20% hấp thu linh khí trong 90 giây.','swords'],['Ngự Lôi Đan','resist','Giảm 50% sát thương lôi kiếp trong 90 giây.','storm'],['Tẩy Tủy Đan','root','Dưỡng linh căn: tăng vĩnh viễn tu vi tu luyện, tối đa 5 lần.','heal'],['Tụ Bảo Đan','loot','Tăng gấp đôi nguyên liệu rơi ra trong 90 giây.','jade'],
];
export const PILLS=Array.from({length:10},(_,t)=>PILL_BASES.map(([name,effect,description,art],b)=>({id:`pill-${t+1}-${b}`,kind:'pills',name:`${name} · Bậc ${t+1}`,tier:t+1,base:b,effect,description:description.replace('90 giây',`${60+(t+1)*30} giây`),requiredLevel:levelAtTier(t+1),icon:art,color:ELEMENTS[b%8].color,value:30*(t+1)**2}))).flat();

// Forty-eight authored forms; each has eight affinities and three power ranks.
export const FORMS=[
  ['Vạn Kiếm Quy Tông','swords',100,480,4,25],['Phượng Hỏa Phần Thiên','flame',145,390,7,40],['Thanh Tâm Quyết','heal',0,0,12,50],['Cửu Thiên Thần Lôi','storm',210,530,11,70],
  ['Thần Long Xuất Hải','dragon',175,560,8,45],['Huyền Băng Vạn Lý','ice',110,430,8,38],['Thôn Thiên Ma Vực','vortex',95,470,9,40],['Kim Cang Bất Hoại','shield',0,0,14,45],
  ['Tinh Hà Trụy Lạc','meteor',260,590,13,75],['Nhất Khí Hóa Tam Thanh','clone',55,550,15,65],['Tru Tiên Kiếm Trận','blades',180,460,10,55],['Nộ Hải Phật Liên','lotus',155,440,9,45],
  ['Thái Hư Kiếm Ý','swords',125,510,5,30],['Bách Điểu Triều Phượng','flame',180,450,9,50],['Cửu Chuyển Hồi Sinh','heal',0,0,15,65],['Thiên Phạt Lôi Đình','storm',280,600,14,85],
  ['Long Ngâm Cửu Tiêu','dragon',195,580,9,50],['Băng Phách Thần Châm','ice',145,520,9,45],['Hắc Nhật Thôn Phệ','vortex',135,500,11,55],['Huyền Vũ Hộ Thể','shield',0,0,18,60],
  ['Vạn Tinh Diệt Thế','meteor',330,650,16,95],['Huyễn Ảnh Thiên Quân','clone',75,600,18,80],['Lục Tiên Kiếm Đồ','blades',225,500,12,65],['Bồ Đề Tịnh Thế','lotus',195,480,11,55],
  ['Nhất Kiếm Khai Thiên','swords',200,680,9,60],['Thái Dương Chân Hỏa','flame',240,550,12,75],['Trường Sinh Bất Diệt','heal',0,0,20,85],['Tử Tiêu Lôi Ngục','storm',340,650,17,105],
  ['Cửu Long Tranh Châu','dragon',260,620,12,75],['Vĩnh Dạ Băng Phong','ice',200,600,12,65],['Lục Đạo Luân Hồi','vortex',205,590,15,80],['Bất Động Minh Vương','shield',0,0,22,80],
  ['Thiên Ngoại Phi Tinh','meteor',410,700,20,120],['Tam Sinh Huyễn Thể','clone',110,650,22,100],['Thập Phương Kiếm Vực','blades',300,580,16,90],['Cửu Sắc Liên Hoa','lotus',250,550,15,80],
  ['Hỗn Độn Kiếm Quyết','swords',270,720,12,80],['Phần Thiên Nộ Diễm','flame',320,620,16,100],['Sinh Sinh Tạo Hóa','heal',0,0,24,110],['Hồng Mông Thần Lôi','storm',440,700,22,130],
  ['Thái Cổ Chân Long','dragon',340,700,17,100],['Tuyệt Đối Linh Độ','ice',270,660,16,85],['Hư Không Táng Thiên','vortex',290,650,20,105],['Vạn Pháp Bất Xâm','shield',0,0,26,100],
  ['Tinh Thần Đại Hải','meteor',520,750,25,150],['Vạn Ảnh Quy Nhất','clone',150,700,27,125],['Vạn Cổ Tru Thần','blades',390,650,21,115],['Sáng Thế Thanh Liên','lotus',330,620,20,105],
].map(([name,effect,damage,range,cooldown,cost],i)=>({id:`form-${i}`,name,effect,damage,range,cooldown,cost,index:i}));
export const TECHNIQUES=[];
FORMS.forEach((form,b)=>ELEMENTS.forEach((element,e)=>['Nhân','Tiên','Thần'].forEach((rank,g)=>TECHNIQUES.push({
  id:`tech-${b}-${e}-${g}`,kind:'techniques',name:`${element.name} · ${form.name} · ${rank}`,description:`${form.name}. ${({ice:'Đóng băng linh vật 3 giây.',vortex:'Kéo linh vật về tâm pháp trận.',shield:'Hấp thụ sát thương bằng kim thân.',clone:'Triệu hồi 3 phân thân tự động công kích 8 giây.',meteor:'Thiên thạch giáng sau 0,8 giây.',lotus:'Gây độc kéo dài và hồi sinh lực.',flame:'Thiêu đốt trong 4 giây.',dragon:'Đẩy lùi linh vật.',heal:'Hồi sinh lực theo cảnh giới.',storm:'Lôi đình đánh xuyên toàn vùng.',blades:'Kiếm trận gây sát thương và giảm phòng ngự.',swords:'Triệu hồi nhiều phi kiếm trong tầm.'})[form.effect]}`,
  form:b,element:element.id,effect:form.effect,tier:g+1,rank,requiredLevel:[1,82,136][g],damage:Math.round(form.damage*[1,3,8][g]*(1+e*.025)),range:form.range+g*60,cooldown:form.cooldown,cost:form.cost*(g+1),icon:form.effect,color:element.color,value:40+(b+1)*9+g*2000,
}))));
export const MANUALS=TECHNIQUES.map(s=>({id:`manual-${s.id}`,kind:'manuals',name:`Bí tịch ${s.name}`,description:`Lĩnh ngộ ${s.name}. Đọc sẽ tiêu hao bí tịch và mở khóa kiếm quyết để gắn vào thanh kỹ năng.`,skillId:s.id,requiredLevel:s.requiredLevel,tier:s.tier,icon:'swords',color:s.color,value:s.value,element:s.element}));

export const MONSTERS=[], BOSSES=[], NPCS=[], QUESTS=[];
const npcNames=['Thanh Vân Tử','Linh Dược Nương','Mặc Kiếm Sinh','Tô Nhược Tuyết','Vân Du Tử','Huyền Chân Nhân','Đan Tâm Tử','Phong Vô Ngân','Lôi Chấn Thiên','Ngọc Linh Nhi','Thái Hư Lão Nhân','Thiên Mệnh Sứ'];
const roles=['Trưởng lão','Luyện đan sư','Rèn khí sư','Thương nhân','Tông môn sứ','Tiên lộ dẫn đường'];
MAPS.forEach((map,index)=>{
  const biome=BIOMES[map.biome],t=map.tier;
  for(let b=0;b<6;b++)MONSTERS.push({id:`mob-${map.id}-${b}`,kind:'monsters',name:`${biome.monsters[b]} · ${regions[t-1]}`,description:`Linh vật tại ${map.name}. Rơi đồng, tu vi và nguyên liệu bậc ${t}.`,mapId:map.id,tier:t,base:b,element:biome.element,requiredLevel:map.requiredLevel,hp:Math.round((180+(b>3?60:0))*t**2.4),damage:Math.round(42*t**1.9),xp:Math.round(35*t**2.5),icon:b%2?'storm':'jade',color:biome.color});
  BOSSES.push({id:`boss-${map.id}`,kind:'bosses',name:`${biome.boss}${t>1?` · ${regions[t-1]}`:''}`,description:`Trấn cảnh linh vương ${map.name}. Có đòn đánh vùng báo trước; rơi pháp khí, bí tịch và tinh túy.`,mapId:map.id,tier:t,element:biome.element,hp:Math.round(1800*t**2.6),damage:Math.round(145*t**1.9),xp:Math.round(280*t**2.5),icon:biome.element==='fire'?'flame':'storm',color:biome.color});
  for(let n=0;n<2;n++)NPCS.push({id:`npc-${map.id}-${n}`,kind:'npcs',name:t===1?npcNames[(map.biome+n)%12]:`${npcNames[(map.biome+n)%12]} · ${regions[t-1]}`,description:`${roles[(map.biome+n)%6]} trú tại ${map.name}. Dẫn dắt tiên duyên và trao đổi vật phẩm.`,mapId:map.id,tier:t,role:roles[(map.biome+n)%6],roleIndex:(map.biome+n)%6,x:n?2130:360,icon:'person',color:biome.color});
  const objectives=[
    {type:'kill',target:`mob-${map.id}-0`,required:3,label:`Trấn áp ${biome.monsters[0]}`},
    {type:'kill',target:'any',required:6,label:'Dẹp yên linh cảnh'},
    {type:'boss',target:`boss-${map.id}`,required:1,label:`Thảo phạt ${biome.boss}`},
    {type:'gather',target:`mat-${t}-${map.biome%12}`,required:3,label:'Thu hái linh thảo'},
    {type:'gather',target:`mat-${t}-${12+map.biome%6}`,required:3,label:'Tìm huyền khoáng'},
    {type:'craft-pill',target:'any',required:2,label:'Luyện đan nhập đạo'},
    {type:'craft-gear',target:'any',required:1,label:'Rèn pháp khí đầu tiên'},
    {type:'learn',target:'any',required:1,label:'Lĩnh ngộ bí tịch'},
    {type:'visit',target:map.id,required:1,label:'Khám phá linh mạch'},
    {type:'talk',target:`npc-${map.id}-0`,required:1,label:'Bái kiến tiền bối'},
    {type:'cultivate',target:'any',required:30,label:'Tĩnh tâm ngộ đạo'},
    {type:'breakthrough',target:'any',required:1,label:'Phá cảnh cầu trường sinh'},
  ];
  objectives.forEach((objective,q)=>QUESTS.push({id:`quest-${map.id}-${q}`,kind:'quests',name:`${objective.label} · ${map.name}`,description:`${NPCS[index*2].name} giao phó: ${objective.label.toLowerCase()} tại ${map.name}. Nhận nhiệm vụ trước khi thực hiện; mục tiêu có đếm tiến độ và thưởng một lần.`,mapId:map.id,tier:t,objective,rewards:{xp:Math.round((60+q*15)*t**2.4),jade:(20+q*5)*t,coins:(80+q*20)*t**2,merit:10+t*2,materials:[{id:`mat-${t}-${18+q%6}`,count:2}]},icon:'scroll',color:biome.color}));
});

export const RECIPES=[...EQUIPMENT.map(g=>({id:`recipe-${g.id}`,output:g.id,kind:'gear',count:1,tier:g.tier,requiredLevel:g.requiredLevel,coins:40*g.tier**2,ingredients:[{id:`mat-${g.tier}-${12+g.base%6}`,count:g.rarity==='Cực Phẩm'?5:3},{id:`mat-${g.tier}-${18+g.base%6}`,count:2},{id:`mat-${g.tier}-${ELEMENTS.findIndex(e=>e.id===g.element)}`,count:1}]})),...PILLS.map(p=>({id:`recipe-${p.id}`,output:p.id,kind:'pill',count:1,tier:p.tier,requiredLevel:p.requiredLevel,coins:20*p.tier**2,ingredients:[{id:`mat-${p.tier}-${p.base}`,count:2},{id:`mat-${p.tier}-${(p.base+2)%12}`,count:1}]}))];
export const COLLECTIONS={equipment:EQUIPMENT,techniques:TECHNIQUES,manuals:MANUALS,materials:MATERIALS,pills:PILLS,maps:MAPS,npcs:NPCS,monsters:MONSTERS,bosses:BOSSES,quests:QUESTS};
export const CONTENT_COUNT=Object.values(COLLECTIONS).reduce((sum,list)=>sum+list.length,0);
export const CONTENT_BY_ID=new Map([...Object.values(COLLECTIONS).flat(),...STARTER_GEAR].map(item=>[item.id,item]));
export const RECIPE_BY_OUTPUT=new Map(RECIPES.map(r=>[r.output,r]));
export const CATEGORIES={equipment:'Trang bị & pháp khí',techniques:'Chiêu thức',manuals:'Bí tịch',materials:'Nguyên liệu',pills:'Đan dược',maps:'Linh cảnh',npcs:'NPC',monsters:'Linh vật',bosses:'Boss',quests:'Tiên duyên'};
export const normalize=text=>text.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d');
export function searchContent(kind,query='',tier=0){const q=normalize(query);return (COLLECTIONS[kind]??[]).filter(item=>(!tier||item.tier===Number(tier))&&(!q||normalize(item.name).includes(q)));}
