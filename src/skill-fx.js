'use strict';
// Presentation only. Each event corresponds to one real skill proc, never an extra hit.
const skillFXPresets={
 burst:{label:'연속 탄환 · 핑크 버스트',duration:.78,color:'#ff78bc'},
 shockwave:{label:'광역 폭발 · 충격파',duration:.82,color:'#ffad65'},
 heart:{label:'하트 · 크리스탈 폭발',duration:.86,color:'#ff95db'},
 frost:{label:'빙결 · 서리 확산',duration:.9,color:'#8eeaff'},
 cheer:{label:'아군 지원 · 오라',duration:.9,color:'#96f6bf'},
 tempo:{label:'속도 · 리듬 파동',duration:.72,color:'#72efdc'},
 prism:{label:'프리즘 · 집중 광선',duration:.78,color:'#d9bdff'},
 petals:{label:'꽃잎 · 로즈 스톰',duration:.9,color:'#ffb4cf'},
 lightning:{label:'번개 · 전기 충격',duration:.72,color:'#ffc870'}
};
const skillFXDefaults={tempo:'tempo',blast:'shockwave',pierce:'prism',critical:'heart',freeze:'frost',cheer:'cheer'};
const signatureFX={bp:['pierce','burst'],davichi:['tempo','tempo'],'2ne1':['blast','lightning'],ive:['critical','heart'],snsd:['freeze','frost'],izone:['blast','petals'],twice:['cheer','cheer'],tts:['pierce','prism'],misamo:['freeze','frost']};
function resolveSkillFX(g,skill){const custom=g.combat?.effect,signature=signatureFX[g.id],id=Object.hasOwn(skillFXPresets,custom)?custom:signature?.[0]===skill.kind?signature[1]:skillFXDefaults[skill.kind]||'prism';const preset=skillFXPresets[id],color=/^#[0-9a-f]{6}$/i.test(g.combat?.effectColor||'')?g.combat.effectColor:preset.color;return {id,color,duration:preset.duration,label:preset.label}}
function createSkillFX(g,sk,source,target,allies=[]){const p=resolveSkillFX(g,sk);return {...p,kind:sk.kind,name:sk.name,x:source.x,y:source.y,tx:target.x,ty:target.y,radius:sk.kind==='cheer'?220:['blast','freeze'].includes(sk.kind)?sk.radius||110:75,allies:allies.map(a=>({x:a.x,y:a.y})),age:0}}
let activeSkillFX=[],skillLayer=null,skillLayerCtx=null,skillLayerDirty=false;
function emitSkillFX(g,sk,source,target,allies){activeSkillFX.push(createSkillFX(g,sk,source,target,allies));if(activeSkillFX.length>24)activeSkillFX.shift()}
function clearSkillFX(){activeSkillFX=[]}
function advanceSkillFX(dt){for(const e of activeSkillFX)e.age+=dt;activeSkillFX=activeSkillFX.filter(e=>e.age<e.duration)}
function fxLine(c,x,y,xx,yy,color,w){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke()}
function fxRing(c,x,y,r,color,w){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.arc(x,y,Math.max(0,r),0,Math.PI*2);c.stroke()}
function fxGlow(c,x,y,r,color){if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffffffd0');g.addColorStop(.23,color+'a0');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r)}
let fxAtlas=null,fxTintCache=new Map();if(typeof Image!=='undefined'){const im=new Image();im.onload=()=>{fxAtlas=im;fxTintCache.clear()};im.src='assets/encore/fx-atlas.svg'}
function tintedFX(kind,color){if(!fxAtlas)return null;const id=({star:0,heart:1,ice:2,petal:3,ring:4})[kind]??0,key=id+':'+color;if(fxTintCache.has(key))return fxTintCache.get(key);const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.drawImage(fxAtlas,id*96,0,96,96,0,0,96,96);g.globalCompositeOperation='source-atop';g.globalAlpha=.62;g.fillStyle=color;g.fillRect(0,0,96,96);if(fxTintCache.size>80)fxTintCache.clear();fxTintCache.set(key,c);return c}
function fxShape(c,x,y,r,rot,kind,color){const tex=tintedFX(kind,color);if(tex){c.save();c.translate(x,y);c.rotate(rot);c.drawImage(tex,-r*1.4,-r*1.4,r*2.8,r*2.8);c.restore();return}c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=color;c.beginPath();if(kind==='heart'){c.moveTo(0,r);c.bezierCurveTo(-r*2,-r*.15,-r,-r*1.8,0,-r*.45);c.bezierCurveTo(r,-r*1.8,r*2,-r*.15,0,r)}else if(kind==='petal'){c.ellipse(0,0,r*.48,r,0,0,Math.PI*2)}else if(kind==='ice'){c.moveTo(0,-r);c.lineTo(r*.5,0);c.lineTo(0,r);c.lineTo(-r*.5,0)}else{for(let i=0;i<8;i++){const a=i*Math.PI/4,v=i%2?r*.25:r;if(i===0)c.moveTo(Math.cos(a)*v,Math.sin(a)*v);else c.lineTo(Math.cos(a)*v,Math.sin(a)*v)}}c.closePath();c.fill();c.restore()}
function paintSkillFX(c,e,reduced=false){const p=Math.max(0,Math.min(1,e.age/e.duration)),fade=Math.min(1,(1-p)*3),col=e.color,dx=e.tx-e.x,dy=e.ty-e.y,L=Math.max(1,Math.hypot(dx,dy)),nx=-dy/L,ny=dx/L,angle=Math.atan2(dy,dx);const ox=e.kind==='cheer'?e.x:e.tx,oy=e.kind==='cheer'?e.y:e.ty;const rad=Math.min(220,Math.max(35,e.radius));c.save();c.globalAlpha=fade;c.globalCompositeOperation='lighter';
 const rings=(x,y,r,n=2)=>{for(let j=0;j<n;j++){const f=Math.max(0,p-j*.09);fxRing(c,x,y,r*(.18+.82*f),col,Math.max(1,4*(1-f)))}};
 const scatter=(x,y,r,kind,n)=>{for(let j=0;j<(reduced?Math.min(n,6):n);j++){const a=j*2.399963+angle,rr=r*(.18+.82*p)*(0.6+(j%4)*.13);fxShape(c,x+Math.cos(a)*rr,y+Math.sin(a)*rr,(3+j%4)*(1-.5*p),a+p*2,kind,j%3===0?'#fff4ec':col)}};
 if(e.id==='burst'){for(let i=0;i<5;i++){const q=(p-i*.075)/.35;if(q<0||q>1)continue;const off=(i-2)*6;const x=e.x+dx*q+nx*off*Math.sin(Math.PI*q),y=e.y+dy*q+ny*off*Math.sin(Math.PI*q),tail=Math.min(.16,q);fxLine(c,x-dx*tail,y-dy*tail,x,y,col,6);fxLine(c,x-dx*tail*.65,y-dy*tail*.65,x,y,'#fff5ff',2.2);fxGlow(c,x,y,13,col)}if(p>.22){const q=(p-.22)/.78;fxGlow(c,ox,oy,48*(1-.65*q),col);rings(ox,oy,60,3);scatter(ox,oy,72,'star',18)}if(p<.22)fxGlow(c,e.x,e.y,27,col)}
 else if(e.id==='prism'){const a=Math.min(1,p*5),tail=Math.max(0,(p-.55)/.45);for(let i=-2;i<=2;i++){fxLine(c,e.x+dx*tail+nx*i*7,e.y+dy*tail+ny*i*7,e.x+dx*a,e.y+dy*a,col,Math.abs(i)===0?11:2.4)}fxLine(c,e.x+dx*tail,e.y+dy*tail,e.x+dx*a,e.y+dy*a,'#fff8ff',3);if(p>.17){fxShape(c,ox,oy,22*(1-p)+5,p*2,'ice','#fff5ff');rings(ox,oy,55);scatter(ox,oy,60,'ice',12)}}
 else if(e.id==='heart'){const q=Math.min(1,p*3.8);fxShape(c,e.x+dx*q,e.y+dy*q,14+8*Math.sin(Math.PI*q),angle+Math.PI/2,'heart',col);if(p>.25){fxGlow(c,ox,oy,45,col);rings(ox,oy,63);scatter(ox,oy,85,'heart',16)}}
 else if(e.id==='frost'){fxLine(c,e.x,e.y,ox,oy,col,3);fxGlow(c,ox,oy,rad*.65,col);rings(ox,oy,rad,3);for(let j=0;j<6;j++){const a=j*Math.PI/3,rr=rad*(.2+.8*p),x=ox+Math.cos(a)*rr,y=oy+Math.sin(a)*rr;fxLine(c,ox,oy,x,y,col,2);fxShape(c,x,y,12*(1-.5*p),a+Math.PI/2,'ice','#d9fbff')}scatter(ox,oy,rad,'ice',16)}
 else if(e.id==='cheer'){fxGlow(c,ox,oy,rad*.62,col);rings(ox,oy,rad,3);for(const a of e.allies){fxRing(c,a.x,a.y,20+12*p,col,2);fxShape(c,a.x,a.y-25-10*p,8,0,'star','#fff6ce')}scatter(ox,oy,rad,'star',12)}
 else if(e.id==='tempo'){for(let j=0;j<3;j++){const q=p*1.8-j*.18;if(q>=0&&q<=1){const x=e.x+dx*q,y=e.y+dy*q;fxRing(c,x,y,9+20*q,col,3);fxGlow(c,x,y,17,col)}}rings(e.x,e.y,48,3);scatter(ox,oy,50,'star',10)}
 else if(e.id==='petals'){fxGlow(c,ox,oy,rad*.55,col);rings(ox,oy,rad,2);for(let j=0;j<(reduced?7:24);j++){const a=j*2.399963+p*4,rr=rad*(.13+.85*p)*(0.5+j%5*.1);fxShape(c,ox+Math.cos(a)*rr,oy+Math.sin(a)*rr,6+j%5,a+p*3,'petal',j%3===0?'#fff3f8':col)}}
 else if(e.id==='lightning'){c.strokeStyle=col;c.lineWidth=6;c.beginPath();c.moveTo(e.x,e.y);for(let j=1;j<9;j++){const q=j/9,offset=(j%2?1:-1)*12*Math.sin(Math.PI*q);c.lineTo(e.x+dx*q+nx*offset,e.y+dy*q+ny*offset)}c.lineTo(ox,oy);c.stroke();c.strokeStyle='#fff8e1';c.lineWidth=2;c.stroke();fxGlow(c,ox,oy,rad*.55,col);rings(ox,oy,rad,2);scatter(ox,oy,rad,'star',18)}
 else{fxGlow(c,ox,oy,rad*(.4+.3*p),col);rings(ox,oy,rad,3);scatter(ox,oy,rad,'star',20)}
 // A custom visual preset is independent of the real skill radius/targeting.
 c.restore();c.save();c.globalAlpha=fade;c.textAlign='center';c.textBaseline='middle';c.font='900 16px Freesentation, "Malgun Gothic", sans-serif';const text=String(e.name||'SKILL').slice(0,40),labelX=Math.max(82,Math.min((c.canvas.width/(c.getTransform().a||1))-82,e.x)),labelY=Math.max(16,e.y-43);c.lineWidth=5;c.strokeStyle='#0b1023';c.strokeText(text,labelX,labelY);c.fillStyle=col;c.fillText(text,labelX,labelY);c.restore();
}
function drawSkillLayer(){if(!activeSkillFX.length&&!skillLayerDirty)return;if(!skillLayer){skillLayer=document.createElement('canvas');skillLayer.className='skill-fx-layer';skillLayer.setAttribute('aria-hidden','true');canvas.parentElement.append(skillLayer);skillLayerCtx=skillLayer.getContext('2d');if(!skillLayerCtx)return}const c=skillLayerCtx;if(!c)return;if(skillLayer.width!==canvas.width||skillLayer.height!==canvas.height){skillLayer.width=canvas.width;skillLayer.height=canvas.height}c.setTransform(skillLayer.width/BOARD_W,0,0,skillLayer.height/BOARD_H,0,0);c.clearRect(0,0,BOARD_W,BOARD_H);skillLayerDirty=activeSkillFX.length>0;for(const e of activeSkillFX)paintSkillFX(c,e,typeof stageReduced!=='undefined'&&stageReduced||qualityMode()!=='high')}
