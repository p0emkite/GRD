'use strict';
// Concert backdrop and photo tokens; custom images are loaded from the creator catalog.
let stageBackdrop;
function vRound(c,x,y,w,h,r,fill,stroke,line=1){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function vOval(c,x,y,rx,ry,fill,stroke,line=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function vPoly(c,points,fill,stroke,line=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
function vStar(c,x,y,r,color){vPoly(c,[[x,y-r],[x+r*.23,y-r*.23],[x+r,y],[x+r*.23,y+r*.23],[x,y+r],[x-r*.23,y+r*.23],[x-r,y],[x-r*.23,y-r*.23]],color)}
function vTrack(c,color,width){c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.lineWidth=width;c.stroke()}
// Render in fixed logical coordinates. Backing resolution is independent of hit testing.
const stageReduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
let stageScale=0;
function syncStageResolution(){
 const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 // Supersample the actual CSS display size, including browser zoom and high DPI.
 const ratio=Math.max(1,Math.min(mobileRenderCap(),Math.ceil((Math.max(rect.width/BOARD_W,rect.height/BOARD_H)*dpr*1.35)*4)/4));
 if(stageScale===ratio&&stageBackdrop)return;
 stageScale=ratio;canvas.width=Math.round(BOARD_W*ratio);canvas.height=Math.round(BOARD_H*ratio);
 stageBackdrop=buildStage();
}
function stageGradient(c,x,y,w,h,stops){const g=c.createLinearGradient(x,y,x+w,y+h);for(const [p,col] of stops)g.addColorStop(p,col);return g}
function glow(c,x,y,r,col){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,col.slice(0,7)+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function buildStage(){
 const layer=document.createElement('canvas');layer.width=Math.round(BOARD_W*stageScale);layer.height=Math.round(BOARD_H*stageScale);const c=layer.getContext('2d');c.scale(stageScale,stageScale);
 if(typeof premiumStageArt!=='undefined'&&premiumStageArt){c.drawImage(premiumStageArt,0,0,900,420);return layer;}
 c.fillStyle=stageGradient(c,0,0,900,420,[[0,'#17233c'],[.48,'#0a1429'],[1,'#1f163a']]);c.fillRect(0,0,900,420);
 glow(c,190,20,250,'#587cc94a');glow(c,770,380,210,'#8651ba40');
 if(typeof venueArt!=='undefined'&&venueArt)c.drawImage(venueArt,0,0,900,420);else{
// Venue seating banks, trusses and audience lightsticks.
 for(const right of [false,true]){c.save();if(right){c.translate(900,0);c.scale(-1,1)}
 for(let row=0;row<6;row++){const x=8+row*17;vRound(c,x,12+row*3,14,396-row*6,5,row%2?'#131d32':'#1a2741','#40527765');for(let i=0;i<22;i++){const y=22+i*17+(row%2)*5;vOval(c,x+7,y,2,3.2,['#7cdbde60','#b9a4fa70','#ffe4ac55'][((i*7+row*3)%3)]);}}
 c.restore()}
 }
 for(let i=0;i<8;i++){const x=170+i*80;vPoly(c,[[x-7,0],[x+8,0],[x+110,240],[x-80,240]],stageGradient(c,x,0,30,240,[[0,i%2?'#bda2fa30':'#73e8e32c'],[1,'#ffffff00']]));vRound(c,x-12,0,24,9,3,'#0b1326','#8bbbc8',1);vRound(c,x-6,3,12,3,1,i%2?'#bca8ff':'#96f5df')}
 // Raised stage, with beveled outer track and illuminated directional lane.
 c.save();c.translate(0,9);vTrack(c,'#050914',68);c.restore();vTrack(c,'#263750',65);vTrack(c,'#60728c',60);vTrack(c,'#111c33',56);vTrack(c,'#344b68',49);vTrack(c,'#18263e',45);vTrack(c,'#22324c',38);c.setLineDash([16,7]);vTrack(c,'#a3e4e32c',1);c.setLineDash([]);
 for(let i=0;i<4;i++){const a=path[i],b=path[i+1],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);for(let d=65;d<L-30;d+=90){c.save();c.translate(a.x+dx*d/L,a.y+dy*d/L);c.rotate(Math.atan2(dy,dx));vPoly(c,[[-9,-7],[1,0],[-9,7],[-3,7],[7,0],[-3,-7]],'#83d7d65c');c.restore()}}
 vRound(c,182,78,536,273,12,'#060d1d','#43536c',2);
 vRound(c,185,77,530,266,10,stageGradient(c,185,77,530,266,[[0,'#25344e'],[1,'#10182c']]),'#71829c',1);
 for(const [x,y] of [[150,45],[750,45],[150,375],[750,375]]){glow(c,x,y,30,'#6faff34d');vOval(c,x,y,19,19,null,'#a8d7ff4d',2)}
 for(const [x,y] of [[126,90],[774,90],[126,330],[774,330]]){vRound(c,x-8,y-15,16,30,4,'#0b1326','#60748f');vRound(c,x-3,y-9,6,18,2,'#b9c9f5');}
 c.font='800 10px Freesentation, "Malgun Gothic", sans-serif';c.textAlign='center';c.fillStyle='#8498b8';c.fillText('N E O N   E N C O R E',450,414);
 glow(c,path[0].x,path[0].y,35,'#72ffe46d');vOval(c,path[0].x,path[0].y,17,17,'#173c46','#9dfce1',2);vStar(c,path[0].x,path[0].y,10,'#e3fff5');
 return layer;
}
function stageMotion(t){const c=ctx;if(!stageReduced){if(!premiumStageArt){for(let i=0;i<4;i++){const x=190+i*170,dx=Math.sin(t*.52+i*1.4)*90;vPoly(c,[[x-4,0],[x+4,0],[x+dx+45,420],[x+dx-45,420]],stageGradient(c,x,0,0,420,[[0,i%2?'#b8a0ff23':'#6ef5de20'],[1,'#ffffff00']]))}
 }
 for(let d=0;d<length;d+=48){const p=point(d+t*35);vOval(c,p.x,p.y,1.8,1.8,'#9bfff1a0')}
 }}
function unitHue(u){return u.type==='group'?groupOf(u).color:['#bd9bff','#ff9ddc','#91e5ff','#8af1cc','#ffd89b','#ffa9ad'][hashName(u.name)%6]}
const portraitCache=new Map();
function cachedPortrait(url){if(!url)return null;if(!portraitCache.has(url)){const i=new Image();i.src=url;portraitCache.set(url,i)}const i=portraitCache.get(url);return i.complete&&i.naturalWidth?i:null}
function drawIdol(c,u,x,y,alpha=1){
 c.save();c.globalAlpha=alpha;const group=u.type==='group',color=unitHue(u),rank=u.mythic?'#ff9ad8':group?['#d5b8ff','#b5e7ff','#ffdb82'][u.level-1]:rankColors[u.level-1],radius=group?27:24;
 vOval(c,x,y+22,30,11,'#050914c0');vOval(c,x,y+22,29,9,null,rank+'70',1.4);c.shadowColor=rank;c.shadowBlur=u.id===selected?9:2;vOval(c,x,y+2,radius+3,radius+3,'#0a1226',rank,2.4);c.shadowBlur=0;
 c.save();c.beginPath();c.arc(x,y+2,radius,0,Math.PI*2);c.clip();const art=cachedPortrait(portraitURL(u));if(art){const d=Math.min(art.naturalWidth,art.naturalHeight);c.drawImage(art,(art.naturalWidth-d)/2,(art.naturalHeight-d)/2,d,d,x-radius,y+2-radius,radius*2,radius*2)}else{const grad=c.createLinearGradient(x-radius,y-radius,x+radius,y+radius);grad.addColorStop(0,color);grad.addColorStop(1,'#14243c');c.fillStyle=grad;c.fillRect(x-radius,y+2-radius,radius*2,radius*2);c.font='bold 13px Freesentation, "Malgun Gothic", sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText(nameOf(u).slice(0,4),x,y+2,radius*1.8)}c.restore();if(typeof drawFrameArt==='function')drawFrameArt(c,u,x,y,radius);
 c.textAlign='center';c.textBaseline='middle';vRound(c,x-35,y+28,70,14,5,'#081425f2',rank,.8);c.font='bold 10px Freesentation, "Malgun Gothic", sans-serif';c.fillStyle='#fff3ff';c.fillText(nameOf(u),x,y+35,66);
 const badge=u.mythic?'MYTHIC':group?'★'.repeat(u.level):'Lv.'+u.level;c.font='bold 10px Freesentation, "Malgun Gothic", sans-serif';const w=Math.max(26,c.measureText(badge).width+8);vRound(c,x-w/2,y-33,w,12,5,'#091425',rank,.9);c.fillStyle=rank;c.fillText(badge,x,y-27);
 vRound(c,x-23,y+43,46,3,1.5,'#120a22');const f=Math.min(1,Math.max(0,1-u.cd/stats(u).interval));if(f>0)vRound(c,x-23,y+41,46*f,3,1.5,'#a6f4d1');c.restore()
}
function drawArena(){
 syncStageResolution();ctx.setTransform(stageScale,0,0,stageScale,0,0);ctx.clearRect(0,0,900,420);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(stageBackdrop,0,0,BOARD_W,BOARD_H);
 const t=performance.now()/1000;if(qualityMode()!=='low')stageMotion(t);
 for(const [x,y,color] of [[path[0].x,path[0].y,'#9cf7dc']]){ctx.save();ctx.globalAlpha=.5+.25*Math.sin(t*3);ctx.shadowBlur=14;ctx.shadowColor=color;vOval(ctx,x,y,13,23,null,color,2);ctx.restore()}
 const chosen=state.units.find(u=>u.id===selected&&u.slot>=0);if(chosen){const s=slots[chosen.slot],r=stats(chosen).range;vOval(ctx,s.x,s.y,r,r,'#d5b2ff12','#e4bcff77',1.3)}
 const moving=drag&&drag.moved?state.units.find(u=>u.id===drag.id):null;
 slots.forEach((s,i)=>{const u=state.units.find(v=>v.slot===i),open=isSlotOpen(i),hover=moving&&slotAt(drag)===i,valid=open&&moving&&(u||moving.slot>=0||deployedCount()<capacity()),merge=open&&canMerge(moving,u),x=s.x-TILE/2+3,y=s.y-TILE/2+3,w=TILE-6;
 if(!open){if(!premiumStageArt)vRound(ctx,x,y+3,w,w,7,'#080e1b');vRound(ctx,x,y,w,w,7,stageGradient(ctx,x,y,0,w,premiumStageArt?[[0,'#202b3caa'],[.48,'#111b2cbb'],[1,'#111827dd']]:[[0,'#333b4c'],[.48,'#20283a'],[1,'#131c2c']]),'#626d85',1.5);ctx.save();ctx.beginPath();ctx.roundRect(x+1,y+1,w-2,w-2,4);ctx.clip();ctx.strokeStyle='#bcb3cb18';ctx.lineWidth=2;for(let k=-w;k<w*2;k+=13){ctx.beginPath();ctx.moveTo(x+k,y);ctx.lineTo(x+k-w,y+w);ctx.stroke()}ctx.restore();ctx.save();ctx.strokeStyle='#9b93ac';ctx.lineWidth=2.3;ctx.beginPath();ctx.arc(s.x,s.y-5,8,Math.PI,0);ctx.stroke();vRound(ctx,s.x-12,s.y-5,24,18,4,'#394760','#b3c0d4',1.5);vOval(ctx,s.x,s.y+3,2,2,'#d7d1df');ctx.font='bold 12px Freesentation, "Malgun Gothic", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#b9b1c8';ctx.fillText('LOCKED',s.x,s.y+26);ctx.restore();if(hover)vRound(ctx,x,y,w,w,5,'#ff7c9920','#ff7c99',3);return}
 if(!premiumStageArt)vRound(ctx,x,y+3,w,w,8,'#060e1c');vRound(ctx,x,y,w,w,8,stageGradient(ctx,x,y,0,w,premiumStageArt?[[0,u?'#22495788':'#2463537a'],[.6,'#15304599'],[1,'#101b2aa6']]:[[0,u?'#254c56':'#2b5557'],[.6,'#173242'],[1,'#122233']]),u?'#7cafb7':'#95f2d9',u?1.5:2);vRound(ctx,x+4,y+4,w-8,w-8,5,null,'#b1f5e32e');if(moving){const color=merge?'#ffdb82':valid?'#a2f4d1':'#ff8fa8';vRound(ctx,x+1,y+1,w-2,w-2,5,hover?color+'30':null,color,hover?3:1.5)}if(u){if(moving?.id!==u.id)drawIdol(ctx,u,s.x,s.y-8)}else{ctx.fillStyle='#b7f7dc';ctx.font='bold 30px Freesentation, "Malgun Gothic", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',s.x,s.y-3);ctx.font='bold 10px Freesentation, "Malgun Gothic", sans-serif';ctx.fillText('OPEN',s.x,s.y+21)}if(hover&&merge){vRound(ctx,s.x-30,s.y-37,60,14,4,'#ffdb82');ctx.fillStyle='#29173f';ctx.font='bold 10px Freesentation, "Malgun Gothic", sans-serif';ctx.textAlign='center';ctx.fillText('MERGE ★',s.x,s.y-30)}});


 for(const e of state.enemies){const p=point(e.d),r=e.boss?19:10,cy=p.y+(stageReduced?0:Math.sin(t*9+e.d*.035)*1.5),color=e.boss?'#ffce79':enemyKind(e)[1];ctx.save();vOval(ctx,p.x,p.y+r*.85,r*1.1,r*.46,'#0706169c');if(!spriteReady&&!drawEnemyArt(ctx,e,p.x,cy,r)){vOval(ctx,p.x,cy,r,r,'#1b2435',color,2);vStar(ctx,p.x,cy,r*.6,color)}if(e.slow>0)vOval(ctx,p.x,cy,r*1.35,r*1.35,null,'#9deeff90',1.2);const hp=Math.max(0,Math.min(1,e.hp/e.max));vRound(ctx,p.x-r,p.y-r-12,r*2,4,2,'#090716');if(hp>0)vRound(ctx,p.x-r,p.y-r-12,r*2*hp,4,2,hp>.5?'#a5f2bc':hp>.2?'#ffd47e':'#ff7c99');if(e.maxShield>0&&e.shield>0)vRound(ctx,p.x-r,p.y-r-17,r*2*e.shield/e.maxShield,3,1,'#8dbbff');if(e.boss){ctx.font='bold 10px Freesentation, "Malgun Gothic", sans-serif';ctx.fillStyle='#ffde94';ctx.textAlign='center';ctx.fillText('BOSS',p.x,p.y+r+17);if((e.warnUntil||0)>e.age||e.warnPhase>e.phase)vOval(ctx,p.x,cy,r*1.6,r*1.6,null,'#ffd389',2)}ctx.restore()}
 for(const e of effects){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';if(e.kind==='number'||e.kind==='skill'){const duration=e.kind==='skill'?.85:.55,progress=1-e.t/duration;ctx.globalAlpha=Math.min(1,e.t*4);ctx.font=(e.kind==='skill'?'900 13px':e.crit?'900 15px':'bold 11px')+' Freesentation, "Malgun Gothic", sans-serif';ctx.lineWidth=3;ctx.strokeStyle='#160e28';ctx.strokeText(e.text,e.x,e.y-12-progress*25);ctx.fillStyle=e.color;ctx.fillText(e.text,e.x,e.y-12-progress*25);ctx.restore();continue}if(e.kind==='area'){const f=1-e.t/.35;ctx.globalAlpha=Math.max(0,e.t/.35)*.75;vOval(ctx,e.x,e.y,e.radius*(.35+.65*f),e.radius*(.35+.65*f),e.color+'22',e.color,2.5);ctx.restore();continue}const a=Math.min(1,e.t*7);ctx.globalAlpha=a;ctx.shadowColor=e.color;ctx.shadowBlur=6;ctx.lineWidth=3;ctx.strokeStyle=e.color;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle='#fff5ff';ctx.stroke();const f=1-Math.max(0,e.t/.15);if(!spriteReady)glow(ctx,e.tx,e.ty,22+f*16,e.color+'70');vStar(ctx,e.tx,e.ty,5+f*11,'#fff3da');for(let k=0;k<6;k++){const a=k*Math.PI/3+e.tx*.025,rad=8+f*21;vOval(ctx,e.tx+Math.cos(a)*rad,e.ty+Math.sin(a)*rad,1.5,1.5,e.color)}vOval(ctx,e.tx,e.ty,7+f*14,7+f*14,null,e.color,1.4);ctx.restore()}
}
function switchGameTab(tab){document.querySelectorAll('[data-screen]').forEach(el=>{el.hidden=el.dataset.screen!==tab});document.querySelectorAll('[data-tab]').forEach(el=>{const active=el.dataset.tab===tab;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active))})}

// Canvas does not automatically redraw cached text when webfonts finish loading.
if(document.fonts){const refreshCanvasFont=()=>{stageBackdrop=null};document.fonts.addEventListener?.('loadingdone',refreshCanvasFont);Promise.allSettled([400,700,800,900].map(w=>document.fonts.load(w+' 13px Freesentation','아이돌 ABC 123'))).then(refreshCanvasFont);}
