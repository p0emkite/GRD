'use strict';
// A baked, real orthographic 3D venue. Simulation and pointer coordinates remain 900x420.
// One temporary WebGL context per skin; the battle compositor still draws at its normal rate.
let premiumStageArt=null,premiumStageKey='',premiumStageSerial=0,premiumThreePromise=null;
const premiumStageCache=new Map();
const stageThemes={
 concert:{floor:0x151b32,metal:0x5c7291,accent:0x81e7ff,second:0xd7a5ff,deck:0x1e3049,light:0xb3d8ff},
 broadcast:{floor:0x121e33,metal:0x829bb8,accent:0x9eeaff,second:0x7392ff,deck:0x1b3553,light:0xd9f3ff},
 awards:{floor:0x201a30,metal:0xa88c66,accent:0xffdc99,second:0xe19add,deck:0x31253e,light:0xffebc8}
};
function threeForArt(){return premiumThreePromise??=import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js')}
function stageRng(){let n=17293;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
function buildVenue3D(T,key,scale=2){
 const theme=stageThemes[key]||stageThemes.concert,rand=stageRng(),scene=new T.Scene(),renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
 const W=900,H=420;renderer.setSize(W*scale,H*scale,false);renderer.setClearColor(0x090c16);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const camera=new T.OrthographicCamera(-450,450,210,-210,1,1800);// A slight orthographic tilt reveals actual platform sides. Stretch the ground axis so gameplay projection stays aligned.
 const tilt=14*Math.PI/180,stretch=1/Math.cos(tilt);scene.scale.z=stretch;camera.position.set(450,908,210*stretch+900*Math.tan(tilt));camera.up.set(0,1,0);camera.lookAt(450,8,210*stretch);
 const mat=(color,metalness=.16,roughness=.64)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const led=color=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.9,roughness:.35,metalness:.1});
 const metal=mat(theme.metal,.55,.32),black=mat(0x111827,.22,.52),deck=mat(theme.deck,.28,.54),floor=mat(theme.floor,.12,.85),rail=mat(0x778ca2,.48,.34),light=led(theme.accent),accent=led(theme.second),gold=led(0xffd79b),seat=mat(0x253449,.08,.78);
 const textures=[];
 function surfaceTexture(){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#8392a6';x.fillRect(0,0,512,512);for(let i=0;i<18000;i++){const n=Math.floor(rand()*90)+105;x.fillStyle='rgba('+n+','+n+','+n+',.13)';x.fillRect(rand()*512,rand()*512,1+rand()*5,1)}x.strokeStyle='#252c3b80';x.lineWidth=2;for(let i=0;i<4;i++){x.beginPath();x.moveTo(i*128,0);x.lineTo(i*128,512);x.moveTo(0,i*128);x.lineTo(512,i*128);x.stroke()}for(let a=0;a<4;a++)for(let b=0;b<4;b++){x.fillStyle='#e7ecf5';x.fillRect(a*128+7,b*128+7,3,3);x.fillRect(a*128+118,b*128+118,3,3)}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4,2);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.push(t);return t}
 deck.map=surfaceTexture();
 function mesh(geometry,material,x,y,z,cast=true){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;scene.add(m);return m}
 const box=(x,y,z,w,h,d,m,cast=true)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,cast);
 function cyl(x,y,z,r,h,m){return mesh(new T.CylinderGeometry(r,r,h,16),m,x,y,z)}
 function rod(ax,ay,az,bx,by,bz,r,m){const a=new T.Vector3(ax,ay,az),b=new T.Vector3(bx,by,bz),d=b.clone().sub(a);const o=mesh(new T.CylinderGeometry(r,r,d.length(),6),m,(ax+bx)/2,(ay+by)/2,(az+bz)/2);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
 function panel(x,z,w,d,y=1){box(x,y,z,w,2,d,black);box(x,y+1.5,z,w-3,1,d-3,deck)}
 box(450,-4,210,930,8,450,floor,false);
 // Stage runway, built with independent light strips at the original route coordinates.
 for(const z of [45,375]){box(450,2,z,654,5,64,black);box(450,5,z,648,2,58,metal);box(450,7,z,642,2,51,deck);for(const k of [-1,1]){box(450,8.5,z+k*27,644,1,2.2,light,false);box(450,8.5,z+k*31,650,1,1.2,accent,false)}for(let x=165;x<750;x+=42){box(x,8.4,z,1.1,.6,48,black,false);box(x,9,z-19,13,.4,1.2,metal,false)}}
 for(const x of [150,750]){box(x,2,210,64,5,330,black);box(x,5,210,58,2,324,metal);box(x,7,210,51,2,318,deck);for(const k of [-1,1]){box(x+k*27,8.5,210,2.2,1,324,light,false);box(x+k*31,8.5,210,1.2,1,330,accent,false)}for(let z=70;z<365;z+=42)box(x,8.4,z,48,.6,1.1,black,false)}
 // Corner plates and stage portals.
 for(const x of [150,750])for(const z of [45,375]){cyl(x,8,z,24,2,black);cyl(x,9.5,z,20,1,metal);const ring=mesh(new T.TorusGeometry(19,1.8,8,32),light,x,11,z);ring.rotation.x=-Math.PI/2}
 // Lowered stage deck and exact slot sockets. Fine bevels, panel seams, LED edges.
 box(450,1,210,549,4,282,black);box(450,4,210,543,2,276,metal);box(450,5.5,210,537,1,270,deck);
 for(const z of [77,343])box(450,7,z,537,1,1.5,accent,false);
 for(const x of [183,717])box(x,7,210,1.5,1,266,accent,false);
 for(let row=0;row<3;row++)for(let col=0;col<6;col++){const x=235+86*col,z=124+86*row;box(x,7,z,82,2.5,82,black);box(x,8.7,z,79,1.5,79,metal);box(x,10,z,75,1,75,deck);for(const k of [-1,1]){box(x+k*37,11,z,1,1,69,black);box(x,11,z+k*37,69,1,1,black);for(const j of [-1,1]){box(x+k*33,11.2,z+j*34,6,.6,2,light,false);box(x+k*34,11.2,z+j*33,2,.6,6,light,false)}}}
 // Side stands: tiered seating, individual audience silhouettes and lightsticks, not painted circles.
 const crowdColors=[0x4a425f,0x647b96,0x614759,0x323f5e,0x806e84,0x29374b].map(c=>mat(c,.02,.85));
 const head=mat(0x9b8b91,.01,.85),glows=[light,accent,gold];
 const people=[];for(const right of [false,true]){for(let row=0;row<5;row++){const x=right?894-row*20:6+row*20,h=20-row*3;
  box(x,h/2,210,18,h,398,black);box(x,h+.8,210,17,1.6,396,seat);box(x+(right?-8:8),h+2,210,1.6,2,396,metal);
  for(let z=20;z<405;z+=14){if(Math.abs(z-105)<11||Math.abs(z-210)<11||Math.abs(z-315)<11)continue;people.push({x:x+(rand()-.5)*3,z:z+(rand()-.5)*5,h:h+3,idx:Math.floor(rand()*6),glow:Math.floor(rand()*3)})}
 }for(const z of [105,210,315])box(right?845:55,5,z,108,10,10,metal);box(right?796:104,8,210,4,16,398,metal);for(let z=15;z<410;z+=32)box(right?796:104,18,z,3,3,7,light,false)}
 const dummy=new T.Object3D();
 function inst(geo,m,pts,place){if(!pts.length)return;const o=new T.InstancedMesh(geo,m,pts.length);pts.forEach((p,i)=>{dummy.position.set(...place(p));dummy.rotation.set(0,0,0);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix)});o.receiveShadow=true;scene.add(o)}
 for(let i=0;i<6;i++)inst(new T.BoxGeometry(7,7,8),crowdColors[i],people.filter(p=>p.idx===i),p=>[p.x,p.h,p.z]);
 inst(new T.SphereGeometry(3.1,7,5),head,people,p=>[p.x,p.h+5,p.z]);
 for(let i=0;i<3;i++)inst(new T.CylinderGeometry(.9,.9,7,5),glows[i],people.filter(p=>p.glow===i),p=>[p.x+3,p.h+4,p.z-3]);
 // Trusses, alternating moving-head lights and LED arrays, kept off the game path.
 for(const z of [4,416]){for(const y of [17,29])rod(122,y,z,778,y,z,1.9,rail);for(let x=126;x<777;x+=40){rod(x,17,z,x+20,29,z,1.1,rail);rod(x+20,29,z,x+40,17,z,1.1,rail);box(x,15,z,13,9,9,black);box(x,20,z,10,1,6,Math.floor(x/40)%2?accent:light,false)}}
 for(const x of [124,776])for(const z of [90,330]){box(x,9,z,14,18,27,black);box(x,19,z,11,2,24,metal);for(let j=-1;j<=1;j++)box(x,20.5,z+j*7,7,.7,3,accent,false)}
 scene.add(new T.HemisphereLight(theme.light,0x22203f,2.2));const sun=new T.DirectionalLight(0xf3eaff,2.4);sun.position.set(260,350,40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-520,right:520,top:330,bottom:-330,near:5,far:850});sun.target.position.set(450,0,210);sun.shadow.normalBias=1.5;scene.add(sun,sun.target);
 for(const [x,z,color] of [[110,25,theme.accent],[790,395,theme.second],[450,30,theme.light],[450,390,theme.second]]){const l=new T.PointLight(color,14500,400,2);l.position.set(x,65,z);scene.add(l)}
 renderer.render(scene,camera);const out=document.createElement('canvas');out.width=W*scale;out.height=H*scale;const ctx=out.getContext('2d');ctx.drawImage(renderer.domElement,0,0);
 // Post-composite restrained bloom and stadium atmosphere, not another game canvas.
 ctx.scale(scale,scale);
 const glow=(x,y,r,col,alpha)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col+alpha);g.addColorStop(.2,col+'21');g.addColorStop(1,col+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)};
 const a='#'+theme.accent.toString(16).padStart(6,'0'),b='#'+theme.second.toString(16).padStart(6,'0');ctx.globalCompositeOperation='screen';for(let x=140;x<780;x+=80){glow(x,8,62,a,'55');glow(x,410,62,b,'55')}for(const x of [75,825]){glow(x,90,115,a,'30');glow(x,330,115,b,'30')}ctx.globalCompositeOperation='source-over';
 const vig=ctx.createRadialGradient(450,210,170,450,210,520);vig.addColorStop(0,'#080a1500');vig.addColorStop(1,'#080a1566');ctx.fillStyle=vig;ctx.fillRect(0,0,900,420);
 // Dispose all transient GPU assets; the static result is reused.
 const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();return out;
}
// Ship the actual rendered art locally. Runtime 3D is an optional developer/failure path.
async function requestPremiumStage(){const key=Object.hasOwn(stageThemes,prefs.venueSkin)?prefs.venueSkin:'concert',serial=++premiumStageSerial,root=document.documentElement;
 premiumStageArt=null;premiumStageKey='';stageBackdrop=null;root.classList.remove('premium-stage-ready');root.style.removeProperty('--arena-keyart');
 const quality=qualityMode(),scale=quality==='high'?2:quality==='normal'?1.5:1,asset='assets/premium/venue-'+key+'.webp',cacheKey=key+':'+scale;
 try{let entry=premiumStageCache.get(cacheKey);
 if(!entry){let source='';let art;try{const im=await loadArt(asset);if(im.naturalWidth!==1800||im.naturalHeight!==840)throw Error('invalid baked venue');art=document.createElement('canvas');art.width=900*scale;art.height=420*scale;const c=art.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,0,0,art.width,art.height);source=asset}catch(e){if(quality==='low')return;const T=await threeForArt();if(serial!==premiumStageSerial)return;art=buildVenue3D(T,key,scale);source=art.toDataURL('image/webp',.78)}
 entry={art,source};if(premiumStageCache.size>=2)premiumStageCache.delete(premiumStageCache.keys().next().value);premiumStageCache.set(cacheKey,entry)}
 if(serial!==premiumStageSerial)return;premiumStageArt=entry.art;premiumStageKey=key;stageBackdrop=null;root.classList.add('premium-stage-ready');root.style.setProperty('--arena-keyart','url("'+new URL(entry.source,document.baseURI).href+'")');
 }catch(e){console.warn('GRD premium venue fallback',e);if(serial===premiumStageSerial)root.classList.remove('premium-stage-ready')}
}
