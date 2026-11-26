'use strict';
// Original vector artwork, rendered locally. No external art or photo dependencies.
let stageBackdrop;
function vRound(c,x,y,w,h,r,fill,stroke,line=1){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function vOval(c,x,y,rx,ry,fill,stroke,line=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function vPoly(c,points,fill,stroke,line=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function vStar(c,x,y,r,color){vPoly(c,[[x,y-r],[x+r*.23,y-r*.23],[x+r,y],[x+r*.23,y+r*.23],[x,y+r],[x-r*.23,y+r*.23],[x-r,y],[x-r*.23,y-r*.23]],color)}
function vTrack(c,color,width){c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function buildStage(){
 const layer=document.createElement('canvas');layer.width=900;layer.height=420;const c=layer.getContext('2d');
 const bg=c.createLinearGradient(0,0,900,420);bg.addColorStop(0,'#452759');bg.addColorStop(.48,'#171b3c');bg.addColorStop(1,'#35245a');c.fillStyle=bg;c.fillRect(0,0,900,420);
 // Tiered floor, luminous metallic inlays and concert lighting.
 for(let y=0;y<420;y+=24){for(let x=0;x<900;x+=36){c.fillStyle=((x/36+y/24)%2===0?'#f2bbff08':'#0000000b');c.fillRect(x,y,35,23)}}
 for(let i=0;i<6;i++){let x=35+i*165;let grad=c.createLinearGradient(x,0,x+80,360);grad.addColorStop(0,i%2?'#8dcfff36':'#f298e947');grad.addColorStop(1,'#f9ccff00');vPoly(c,[[x,0],[x+20,0],[x+175,420],[x-110,420]],grad)}
 for(const y of [6,414]){vRound(c,5,y-4,890,8,4,'#100b25','#a984db55');for(let i=0;i<45;i++){c.shadowBlur=6;c.shadowColor=i%2?'#e996ff':'#86d9ff';vOval(c,12+i*20,y,2,2,c.shadowColor)}c.shadowBlur=0}
 c.save();c.translate(0,5);vTrack(c,'#090718',58);c.restore();
 c.shadowBlur=15;c.shadowColor='#b674ec';vTrack(c,'#a17bc9',56);c.shadowBlur=0;vTrack(c,'#392b61',51);vTrack(c,'#7663a9',46);vTrack(c,'#41365f',41);vTrack(c,'#2c284c',35);
 c.setLineDash([2,13]);vTrack(c,'#bca8eb85',1);c.setLineDash([]);
 // Direction arrows on the three stage catwalks.
 for(const y of [85,210,335])for(let x=125;x<800;x+=100){const d=y===210?-1:1;vPoly(c,[[x-d*7,y-7],[x+d*3,y],[x-d*7,y+7],[x-d*2,y+7],[x+d*8,y],[x-d*2,y-7]],'#caa5fa45')}
 // Decorative speaker stacks, stars and runway edge lights.
 for(const [x,y] of [[25,145],[875,145],[25,270],[875,270]]){vRound(c,x-14,y-24,28,48,5,'#100e27','#7661a1');for(const q of [-11,11]){vOval(c,x,y+q,10,9,'#262443','#514674');vOval(c,x,y+q,4,4,'#9277bc')}}
 for(let i=0;i<22;i++){let x=24+(i*83)%850,y=19+(i*97)%380;vStar(c,x,y,2+(i%3),'#f9d4ff37')}
 for(const [x,y,word,color] of [[6,85,'IN','#b4ffe9'],[894,335,'OUT','#ffd3a0']]){c.shadowBlur=12;c.shadowColor=color;vRound(c,x-6,y-24,12,48,4,color);c.shadowBlur=0;c.fillStyle=color;c.font='bold 10px system-ui';c.textAlign=x<20?'left':'right';c.fillText(word,x+(x<20?9:-9),y-29)}
 return layer;
}
function unitHue(u){return u.type==='group'?groupOf(u).color:['#bd9bff','#ff9ddc','#91e5ff','#8af1cc','#ffd89b','#ffa9ad'][hashName(u.name)%6]}
function drawIdol(c,u,x,y,alpha=1){
 c.save();c.globalAlpha=alpha;const color=unitHue(u),rank=rankColors[u.level-1],isGroup=u.type==='group',seed=hashName(nameOf(u));
 vOval(c,x,y+20,29,10,'#080517a0');c.shadowColor=color;c.shadowBlur=u.id===selected?16:7;
 vOval(c,x,y+14,25,9,'#362447',rank,2);c.shadowBlur=0;vOval(c,x,y+10,22,7,'#584170',color,1);
 // Stylized original chibi stage performers. Color and hair silhouettes vary by member.
 function idol(px,py,scale,index){c.save();c.translate(px,py);c.scale(scale,scale);
 const hair=['#372438','#725047','#b58666','#3a2c5b','#29344e'][(seed+index)%5];const skin=['#ffe3cc','#f5cfb7','#f8d9c6'][(seed+index)%3];
 vOval(c,0,-8,11,15,hair,'#160f2c',1);vRound(c,-8,4,16,13,5,color,'#fff0f6',.8);
 vPoly(c,[[-9,6],[-13,15],[-8,17],[-5,11]],skin);vPoly(c,[[9,6],[13,12],[9,16],[5,11]],skin);
 vPoly(c,[[-7,13],[7,13],[12,21],[-12,21]],color,'#2b2049',.8);vRound(c,-7,19,5,7,2,'#26213d');vRound(c,2,19,5,7,2,'#26213d');
 vOval(c,0,-7,9,10,skin);vPoly(c,[[-10,-9],[-9,-17],[-2,-20],[8,-16],[11,-7],[5,-12],[0,-14],[-6,-9]],hair);vOval(c,-3,-6,1.1,1.7,'#372c49');vOval(c,3,-6,1.1,1.7,'#372c49');vOval(c,0,-2,1.4,.7,'#d78b98');vStar(c,7,-16,3,'#fff3a6');vStar(c,0,9,3,'#fff1cf');c.restore();}
 if(isGroup){idol(x-12,y-6,.68,0);idol(x+12,y-6,.68,1);idol(x,y-5,.86,2)}else idol(x,y-7,1,0);
 c.textAlign='center';c.textBaseline='middle';vRound(c,x-29,y+23,58,15,5,'#170e2ae8',rank,.8);c.font='bold 10px system-ui';c.fillStyle='#fff3ff';c.fillText(nameOf(u),x,y+30,54);
 vRound(c,x-27,y-31,24,12,5,'#170e2a',rank,.9);c.font='bold 9px system-ui';c.fillStyle=rank;c.fillText('Lv.'+u.level,x-15,y-25);
 vRound(c,x-23,y+40,46,3,1.5,'#120a22');const f=Math.min(1,Math.max(0,1-u.cd/stats(u).interval));if(f>0)vRound(c,x-23,y+40,46*f,3,1.5,'#a6f4d1');c.restore();
}
function drawArena(){
 if(!stageBackdrop)stageBackdrop=buildStage();ctx.clearRect(0,0,900,420);ctx.drawImage(stageBackdrop,0,0);
 const t=performance.now()/1000;
 for(const [x,y,color] of [[0,85,'#9cf7dc'],[900,335,'#ffce99']]){ctx.save();ctx.globalAlpha=.5+.25*Math.sin(t*3);ctx.shadowBlur=14;ctx.shadowColor=color;vOval(ctx,x,y,13,23,null,color,2);ctx.restore()}
 const chosen=state.units.find(u=>u.id===selected&&u.slot>=0);if(chosen){const s=slots[chosen.slot],r=stats(chosen).range;vOval(ctx,s.x,s.y,r,r,'#d5b2ff12','#e4bcff77',1.3)}
 slots.forEach((s,i)=>{const u=state.units.find(v=>v.slot===i),highlight=drag&&drag.moved&&slotAt(drag)===i;vOval(ctx,s.x,s.y+16,33,13,'#09081980');vOval(ctx,s.x,s.y+10,32,13,u?'#382654':'#211a3f',highlight?'#b9ffeb':u?'#c09be799':'#8d77bf88',highlight?3:1.4);vOval(ctx,s.x,s.y+5,26,9,null,'#ad94dd55');if(u){if(!(drag&&drag.moved&&drag.id===u.id))drawIdol(ctx,u,s.x,s.y-8)}else{ctx.fillStyle='#bca2e1aa';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText('+',s.x,s.y+9)}});
 for(const e of state.enemies){const p=point(e.d),r=e.boss?17:9,bob=Math.sin(t*10+e.d*.035)*1.5,cy=p.y+bob,color=e.boss?'#ffbf65':e.slow>0?'#9deeff':'#ed80c5';ctx.save();vOval(ctx,p.x,p.y+r*.85,r*1.1,r*.46,'#0706169c');ctx.shadowColor=color;ctx.shadowBlur=e.boss?13:5;vPoly(ctx,[[p.x,p.y-r-2],[p.x+r,cy-r*.5],[p.x+r*.85,cy+r*.75],[p.x,cy+r],[p.x-r*.85,cy+r*.75],[p.x-r,cy-r*.5]],'#39224f',color,1.8);ctx.shadowBlur=0;vOval(ctx,p.x,cy,r*.7,r*.55,'#1b142e');vRound(ctx,p.x-r*.45,cy-2,r*.29,4,2,color);vRound(ctx,p.x+r*.15,cy-2,r*.29,4,2,color);vStar(ctx,p.x,cy-r*.66,r*.28,'#ffe6fc');vRound(ctx,p.x-r,p.y-r-8,r*2,4,2,'#090716');const hp=Math.max(0,Math.min(1,e.hp/e.max));if(hp>0)vRound(ctx,p.x-r,p.y-r-8,r*2*hp,4,2,hp>.5?'#a5f2bc':hp>.2?'#ffd47e':'#ff7c99');if(e.boss){ctx.font='bold 10px system-ui';ctx.fillStyle='#ffde94';ctx.textAlign='center';ctx.fillText('BOSS',p.x,p.y+r+12)}ctx.restore()}
 for(const e of effects){ctx.save();const a=Math.min(1,e.t*7);ctx.globalAlpha=a;ctx.shadowColor=e.color;ctx.shadowBlur=11;ctx.lineWidth=4;ctx.strokeStyle=e.color;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle='#fff5ff';ctx.stroke();const f=1-Math.max(0,e.t/.15);vStar(ctx,e.tx,e.ty,5+f*11,'#fff3da');vOval(ctx,e.tx,e.ty,7+f*14,7+f*14,null,e.color,1.4);ctx.restore()}
 if(drag&&drag.moved){const u=state.units.find(v=>v.id===drag.id);if(u)drawIdol(ctx,u,drag.x,drag.y-10,.86)}
}
function switchGameTab(tab){document.querySelectorAll('[data-screen]').forEach(el=>{el.hidden=el.dataset.screen!==tab});document.querySelectorAll('[data-tab]').forEach(el=>{const active=el.dataset.tab===tab;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active))})}
