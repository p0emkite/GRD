'use strict';
// Shared content catalog for game and creator studio. No credentials are stored.
const catalogDB='grd-creator-v1', catalogStore='catalog';
const roleOptions=['기본','속사','저격','광역','감속','치명타','지원'];
const defaultCatalog=()=>({version:1,groups:groups.map(g=>({...g,members:[...g.members]})),memberPhotos:{}});
function safeAsset(v,kind='image'){
 if(typeof v!=='string'||!v.trim())return '';
 v=v.trim();if(v.length>45_000_000)throw Error('파일이 너무 큽니다.');
 const allowed=kind==='audio'?/^data:audio\/(?:mpeg|mp3|mp4|wav|wave|x-wav|ogg|webm|aac|flac);base64,/i:/^data:image\/(?:png|jpeg|webp|gif|avif);base64,/i;
 if(allowed.test(v))return v;
 if(/^https?:\/\//i.test(v)){const u=new URL(v);if(u.username||u.password)throw Error('인증 정보가 포함된 주소는 사용할 수 없습니다.');return u.href}
 if(/^(?:\.\/)?assets\/[a-zA-Z0-9_./%-]+$/.test(v)&&!v.includes('..'))return v;
 throw Error('HTTPS 주소, assets/ 경로 또는 지원되는 업로드 파일을 사용하세요.');
}
function numField(v,min,max){if(v===undefined||v===null||v==='')return null;const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error('전투 설정 범위를 확인하세요.');return n}
function normalizeCombat(v={}){const skill=v.skill||{};const kind=['tempo','blast','pierce','critical','freeze','cheer'].includes(skill.kind)?skill.kind:'';return {damage:numField(v.damage,1,100000),interval:numField(v.interval,.15,10),range:numField(v.range,40,900),skill:kind?{name:String(skill.name||'SHOWTIME').slice(0,80),kind,every:Math.round(numField(skill.every,1,50)??5),power:numField(skill.power,.1,10)??1.5,radius:numField(skill.radius,20,500)??110}:null}}
function normalizeCatalog(raw){
 if(!raw||!Array.isArray(raw.groups)||!raw.groups.length||raw.groups.length>500)throw Error('그룹은 1~500개가 필요합니다.');
 const seen=new Set(),names=new Set();
 const list=raw.groups.map(g=>{
  const id=String(g.id||'').trim(),name=String(g.name||'').trim();
  if(!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id)||seen.has(id))throw Error('그룹 ID가 잘못되었거나 중복됩니다: '+id);
  if(!name||name.length>80)throw Error('그룹 이름을 확인하세요.');
  seen.add(id);
  if(!Array.isArray(g.members))throw Error(name+'의 멤버가 없습니다.');
  const ms=g.members.map(n=>String(n).trim());
  if(!ms.length||ms.length>50||new Set(ms).size!==ms.length||ms.some(n=>!n||n.length>80))throw Error(name+'의 멤버 이름 또는 중복을 확인하세요.');
  ms.forEach(n=>names.add(n));
  return {id,name,members:ms,role:roleOptions.includes(g.role)?g.role:'기본',color:/^#[0-9a-f]{6}$/i.test(g.color||'')?g.color:'#e1b0ff',sub:!!g.sub,generation:String(g.generation||'').slice(0,24),agency:String(g.agency||'').slice(0,80),country:String(g.country||'').slice(0,40),combat:normalizeCombat(g.combat||{}),photo:safeAsset(g.photo),logo:safeAsset(g.logo),reveal:safeAsset(g.reveal),audio:safeAsset(g.audio,'audio')};
 });
 const photos=Object.create(null);for(const n of names){const p=raw.memberPhotos&&Object.hasOwn(raw.memberPhotos,n)?raw.memberPhotos[n]:'';if(p)photos[n]=safeAsset(p)}
 return {version:1,groups:list,memberPhotos:photos};
}
function openCatalogDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(catalogDB,1);req.onupgradeneeded=()=>req.result.createObjectStore(catalogStore);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('콘텐츠 저장소가 잠겨 있습니다.'))})}
async function localCatalog(write){
 const db=await openCatalogDB();return new Promise((resolve,reject)=>{const tx=db.transaction(catalogStore,write===undefined?'readonly':'readwrite'),store=tx.objectStore(catalogStore),req=write===undefined?store.get('active'):store.put(write,'active');let value;req.onsuccess=()=>value=req.result;tx.oncomplete=()=>{db.close();resolve(value)};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||req.error)}})
}
async function loadCatalog(){
 try{return await fetchPublished()}catch(e){console.warn('Cloud catalog unavailable; fallback',e)}
 try{const local=await localCatalog();if(local)return {data:normalizeCatalog(local),source:'studio'}}catch(e){console.warn('Studio catalog unavailable',e)}
 try{const res=await fetch('catalog.json',{cache:'no-store'});if(res.ok)return {data:normalizeCatalog(await res.json()),source:'published'}}catch(e){console.warn('Published catalog unavailable',e)}
 return {data:normalizeCatalog(defaultCatalog()),source:'default'};
}
let activeCatalog=defaultCatalog();
async function initGameCatalog(){const loaded=await loadCatalog();activeCatalog=loaded.data;groups.splice(0,groups.length,...activeCatalog.groups);members.splice(0,members.length,...new Set(groups.flatMap(g=>g.members)));return loaded}
function portraitURL(u){return u.type==='group'?(groups.find(g=>g.id===u.gid)?.photo||groups.find(g=>g.id===u.gid)?.logo||''):(activeCatalog.memberPhotos[u.name]||'')}
