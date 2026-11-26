'use strict';
// Concert backdrop and photo tokens; custom images are loaded from the creator catalog.
let stageBackdrop;
function vRound(c,x,y,w,h,r,fill,stroke,line=1){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function vOval(c,x,y,rx,ry,fill,stroke,line=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function vPoly(c,points,fill,stroke,line=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function vStar(c,x,y,r,color){vPoly(c,[[x,y-r],[x+r*.23,y-r*.23],[x+r,y],[x+r*.23,y+r*.23],[x,y+r],[x-r*.23,y+r*.23],[x-r,y],[x-r*.23,y-r*.23]],color)}
function vTrack(c,color,width){c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function buildStage(){
 const layer=document.createElement('canvas');layer.width=BOARD_W;layer.height=BOARD_H;const c=layer.getContext('2d');
 const bg=c.createLinearGradient(0,0,BOARD_W,BOARD_H);bg.addColorStop(0,'#452759');bg.addColorStop(.48,'#171b3c');bg.addColorStop(1,'#35245a');c.fillStyle=bg;c.fillRect(0,0,BOARD_W,BOARD_H);
 for(let i=0;i<6;i++){let x=35+i*165;let grad=c.createLinearGradient(x,0,x+80,360);grad.addColorStop(0,i%2?'#8dcfff36':'#f298e947');grad.addColorStop(1,'#f9ccff00');vPoly(c,[[x,0],[x+20,0],[x+175,420],[x-110,420]],grad)}
 c.save();c.translate(0,4);vTrack(c,'#090718',59);c.restore();
 c.shadowBlur=13;c.shadowColor='#b674ec';vTrack(c,'#a17bc9',55);c.shadowBlur=0;vTrack(c,'#392b61',50);vTrack(c,'#7663a9',44);vTrack(c,'#2c284c',36);c.setLineDash([2,13]);vTrack(c,'#bca8eb85',1);c.setLineDash([]);
 for(let i=0;i<4;i++){const a=path[i],b=path[i+1],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);for(let dist=60;dist<L-30;dist+=90){const x=a.x+dx*dist/L,y=a.y+dy*dist/L;c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));vPoly(c,[[-8,-7],[2,0],[-8,7],[-2,7],[8,0],[-2,-7]],'#caa5fa66');c.restore()}}
 vRound(c,185,77,530,266,12,'#100c26','#9777c7',2);
 for(const s of slots){const g=c.createLinearGradient(s.x,s.y-TILE/2,s.x,s.y+TILE/2);g.addColorStop(0,'#493863');g.addColorStop(1,'#27203e');vRound(c,s.x-TILE/2+3,s.y-TILE/2+3,TILE-6,TILE-6,5,g,'#9e83ca80',1.2);vRound(c,s.x-TILE/2+7,s.y-TILE/2+7,TILE-14,TILE-14,3,null,'#e0baff12')}
 for(const [x,y] of [[55,45],[845,45],[55,375],[845,375]]){vRound(c,x-16,y-21,32,42,5,'#100e27','#7661a1');for(const q of [-10,10]){vOval(c,x,y+q,10,8,'#262443','#514674');vOval(c,x,y+q,4,4,'#9277bc')}}
 for(let i=0;i<16;i++){const x=i%2?810+(i*7)%74:15+(i*7)%70,y=20+(i*43)%380;vStar(c,x,y,2+i%3,'#f9d4ff37')}
 c.shadowBlur=14;c.shadowColor='#a4ffe5';vOval(c,path[0].x,path[0].y,20,20,'#2a4d5d','#a4ffe5',2);c.shadowBlur=0;vStar(c,path[0].x,path[0].y,11,'#cefff0');
 return layer;
}
function unitHue(u){return u.type==='group'?groupOf(u).color:['#bd9bff','#ff9ddc','#91e5ff','#8af1cc','#ffd89b','#ffa9ad'][hashName(u.name)%6]}
const portraitCache=new Map();
function cachedPortrait(url){if(!url)return null;if(!portraitCache.has(url)){const i=new Image();i.src=url;portraitCache.set(url,i)}const i=portraitCache.get(url);return i.complete&&i.naturalWidth?i:null}
function drawIdol(c,u,x,y,alpha=1){
 c.save();c.globalAlpha=alpha;const group=u.type==='group',color=unitHue(u),rank=group?['#d5b8ff','#b5e7ff','#ffdb82'][u.level-1]:rankColors[u.level-1],radius=group?24:21;
 vOval(c,x,y+20,27,9,'#080517a0');c.shadowColor=rank;c.shadowBlur=u.id===selected?17:5;vOval(c,x,y+2,radius+3,radius+3,'#180d2d',rank,2.4);c.shadowBlur=0;
 c.save();c.beginPath();c.arc(x,y+2,radius,0,Math.PI*2);c.clip();const art=cachedPortrait(portraitURL(u));if(art){const d=Math.min(art.naturalWidth,art.naturalHeight);c.drawImage(art,(art.naturalWidth-d)/2,(art.naturalHeight-d)/2,d,d,x-radius,y+2-radius,radius*2,radius*2)}else{const grad=c.createLinearGradient(x-radius,y-radius,x+radius,y+radius);grad.addColorStop(0,color);grad.addColorStop(1,'#302041');c.fillStyle=grad;c.fillRect(x-radius,y+2-radius,radius*2,radius*2);c.font='bold 13px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText(nameOf(u).slice(0,3),x,y+2,radius*1.8)}c.restore();
 c.textAlign='center';c.textBaseline='middle';vRound(c,x-29,y+26,58,14,5,'#170e2ae8',rank,.8);c.font='bold 10px system-ui';c.fillStyle='#fff3ff';c.fillText(nameOf(u),x,y+33,54);
 const badge=group?'★'.repeat(u.level):'Lv.'+u.level;c.font='bold 10px system-ui';const w=Math.max(26,c.measureText(badge).width+8);vRound(c,x-w/2,y-30,w,12,5,'#170e2a',rank,.9);c.fillStyle=rank;c.fillText(badge,x,y-24);
 vRound(c,x-23,y+41,46,3,1.5,'#120a22');const f=Math.min(1,Math.max(0,1-u.cd/stats(u).interval));if(f>0)vRound(c,x-23,y+41,46*f,3,1.5,'#a6f4d1');c.restore()
}
function drawArena(){
 if(!stageBackdrop)stageBackdrop=buildStage();ctx.clearRect(0,0,900,420);ctx.drawImage(stageBackdrop,0,0);
 const t=performance.now()/1000;
 for(const [x,y,color] of [[path[0].x,path[0].y,'#9cf7dc']]){ctx.save();ctx.globalAlpha=.5+.25*Math.sin(t*3);ctx.shadowBlur=14;ctx.shadowColor=color;vOval(ctx,x,y,13,23,null,color,2);ctx.restore()}
 const chosen=state.units.find(u=>u.id===selected&&u.slot>=0);if(chosen){const s=slots[chosen.slot],r=stats(chosen).range;vOval(ctx,s.x,s.y,r,r,'#d5b2ff12','#e4bcff77',1.3)}
 const moving=drag&&drag.moved?state.units.find(u=>u.id===drag.id):null;
 slots.forEach((s,i)=>{const u=state.units.find(v=>v.slot===i),hover=moving&&slotAt(drag)===i,valid=moving&&(u||moving.slot>=0||deployedCount()<capacity()),merge=canMerge(moving,u);if(moving){const color=merge?'#ffdb82':valid?'#a2f4d1':'#ff8fa8';vRound(ctx,s.x-TILE/2+4,s.y-TILE/2+4,TILE-8,TILE-8,5,hover?color+'30':null,color,hover?3:1)}if(u){if(moving?.id!==u.id)drawIdol(ctx,u,s.x,s.y-8)}else{ctx.fillStyle='#bca2e18a';ctx.font='bold 19px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',s.x,s.y)}if(hover&&merge){vRound(ctx,s.x-30,s.y-37,60,14,4,'#ffdb82');ctx.fillStyle='#29173f';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('MERGE ★',s.x,s.y-30)}});

 for(const e of state.enemies){const p=point(e.d),r=e.boss?17:9,bob=Math.sin(t*10+e.d*.035)*1.5,cy=p.y+bob,color=e.boss?'#ffbf65':e.slow>0?'#9deeff':'#ed80c5';ctx.save();vOval(ctx,p.x,p.y+r*.85,r*1.1,r*.46,'#0706169c');ctx.shadowColor=color;ctx.shadowBlur=e.boss?13:5;vPoly(ctx,[[p.x,p.y-r-2],[p.x+r,cy-r*.5],[p.x+r*.85,cy+r*.75],[p.x,cy+r],[p.x-r*.85,cy+r*.75],[p.x-r,cy-r*.5]],'#39224f',color,1.8);ctx.shadowBlur=0;vOval(ctx,p.x,cy,r*.7,r*.55,'#1b142e');vRound(ctx,p.x-r*.45,cy-2,r*.29,4,2,color);vRound(ctx,p.x+r*.15,cy-2,r*.29,4,2,color);vStar(ctx,p.x,cy-r*.66,r*.28,'#ffe6fc');vRound(ctx,p.x-r,p.y-r-8,r*2,4,2,'#090716');const hp=Math.max(0,Math.min(1,e.hp/e.max));if(hp>0)vRound(ctx,p.x-r,p.y-r-8,r*2*hp,4,2,hp>.5?'#a5f2bc':hp>.2?'#ffd47e':'#ff7c99');if(e.boss){ctx.font='bold 10px system-ui';ctx.fillStyle='#ffde94';ctx.textAlign='center';ctx.fillText('BOSS',p.x,p.y+r+12)}ctx.restore()}
 for(const e of effects){ctx.save();const a=Math.min(1,e.t*7);ctx.globalAlpha=a;ctx.shadowColor=e.color;ctx.shadowBlur=11;ctx.lineWidth=4;ctx.strokeStyle=e.color;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle='#fff5ff';ctx.stroke();const f=1-Math.max(0,e.t/.15);vStar(ctx,e.tx,e.ty,5+f*11,'#fff3da');vOval(ctx,e.tx,e.ty,7+f*14,7+f*14,null,e.color,1.4);ctx.restore()}

}
function switchGameTab(tab){document.querySelectorAll('[data-screen]').forEach(el=>{el.hidden=el.dataset.screen!==tab});document.querySelectorAll('[data-tab]').forEach(el=>{const active=el.dataset.tab===tab;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active))})}
