export const WORLD_WIDTH=5200;
export const SKILLS={
  attack:{name:'Trảm kiếm',cost:0,cooldown:.42,damage:40,range:150,effect:'attack',element:'metal'},
  swords:{name:'Vạn Kiếm Quy Tông',cost:25,cooldown:4,damage:100,range:480,effect:'swords',element:'metal'},
  flame:{name:'Phượng Hỏa',cost:40,cooldown:7,damage:145,range:390,effect:'flame',element:'fire'},
  heal:{name:'Thanh Tâm Quyết',cost:50,cooldown:12,damage:0,range:0,effect:'heal',element:'wood'},
  storm:{name:'Thiên Lôi',cost:70,cooldown:11,damage:210,range:530,effect:'storm',element:'thunder'},
  dragon:{name:'Thần Long Xuất Hải',cost:45,cooldown:8,damage:175,range:560,effect:'dragon',element:'water'},
  ice:{name:'Huyền Băng Vạn Lý',cost:38,cooldown:8,damage:110,range:430,effect:'ice',element:'ice'},
  vortex:{name:'Thôn Thiên Ma Vực',cost:40,cooldown:9,damage:95,range:470,effect:'vortex',element:'wind'},
  shield:{name:'Kim Cang Bất Hoại',cost:45,cooldown:14,damage:0,range:0,effect:'shield',element:'earth'},
  meteor:{name:'Tinh Hà Trụy Lạc',cost:75,cooldown:13,damage:260,range:590,effect:'meteor',element:'fire'},
  clone:{name:'Nhất Khí Hóa Tam Thanh',cost:65,cooldown:15,damage:55,range:550,effect:'clone',element:'wind'},
  blades:{name:'Tru Tiên Kiếm Trận',cost:55,cooldown:10,damage:180,range:460,effect:'blades',element:'metal'},
  lotus:{name:'Nộ Hải Phật Liên',cost:45,cooldown:9,damage:155,range:440,effect:'lotus',element:'wood'},
  windEdge:{name:'Thanh Phong Kiếm',description:'Đâm kiếm và phóng kiếm khí thẳng về phía trước; xuyên các mục tiêu trên đường kiếm.',cost:28,cooldown:5,damage:135,range:480,effect:'wind-edge',element:'wind'},
  windStep:{name:'Ảnh Phong Bộ',description:'Lướt chém về phía trước. Có thể tái thi triển một lần trong 2,4 giây; mỗi lần tốn 20 linh lực.',cost:20,cooldown:8,damage:95,range:320,effect:'wind-step',element:'wind'},
  windWheel:{name:'Lăng Phong Quyển',description:'Quét kiếm tạo lốc, hất và khống chế mục tiêu 1,2 giây.',cost:42,cooldown:9,damage:155,range:330,effect:'wind-wheel',element:'wind'},
  windWall:{name:'Ngự Phong Bích',description:'Dựng phong bích 4,5 giây. Ở gần bích giảm 45% sát thương nhận; quái trong bích di chuyển chậm 65%.',cost:40,cooldown:13,damage:0,range:0,effect:'wind-wall',element:'wind'},
  windFinal:{name:'Thiên Vân Vô Song',description:'Bốn nhịp liên trảm xuyên mục tiêu phía trước; nhát cuối hất tung và đẩy lùi.',cost:75,cooldown:16,damage:280,range:520,effect:'wind-final',element:'wind'},
};
export const PLATFORMS=[{x:0,y:620,w:1100},{x:1100,y:660,w:400},{x:1500,y:620,w:850},{x:2350,y:680,w:550},{x:2900,y:610,w:900},{x:3800,y:650,w:1400}];
export const ZONES=[{name:'Vân Mộng Cốc',subtitle:'Gió khẽ lay, tiên lộ vừa mở',x:560},{name:'Trúc Ảnh Lâm',subtitle:'Linh khí hội tụ giữa rừng sâu',x:1850},{name:'Thiên Vân Đài',subtitle:'Vượt qua thử thách, chạm đến cửu thiên',x:3260}];
export const groundAt=x=>PLATFORMS.find(p=>x>=p.x&&x<p.x+p.w)?.y??650;
