'use strict';
const $s=id=>document.getElementById(id);
let draft,index=0,editorSerial=0,pending=0,revision=0,admin=false,saving=false;
function status(msg,bad=false){$s('status').textContent=msg;$s('status').classList.toggle('bad',bad)}
function current(){return draft.groups[index]}
function sync(){
 const g=current();if(!g)return;
 g.id=$s('gid').value.trim();g.name=$s('gname').value.trim();g.role=$s('role').value;g.color=$s('color').value;g.sub=$s('sub').checked;
 g.generation=$s('generation').value;g.agency=$s('agency').value;g.country=$s('country').value;
 g.combat=readCombatFields();
 g.members=$s('memberNames').value.split(/\r?\n/).map(n=>n.trim()).filter(Boolean);
}
function readAsset(file,kind){
 if(!file)return Promise.resolve('');
 if(file.size> (kind==='audio'?25:8)*1024*1024)return Promise.reject(Error('이미지 8MB / 음원 25MB 이하 파일을 사용하세요.'));
 return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{try{res(safeAsset(String(r.result),kind))}catch(e){rej(e)}};r.onerror=()=>rej(r.error);r.readAsDataURL(file)})
}
function assetRow(title,value,kind,change){
 const box=document.createElement('div');box.className='asset-row';const preview=document.createElement(kind==='audio'?'audio':'img');if(kind==='audio'){preview.controls=true;preview.preload='none';preview.style.width='58px'}else preview.alt='';
 const controls=document.createElement('div');controls.className='asset-controls';const label=document.createElement('label');label.textContent=title;
 const url=document.createElement('input');url.placeholder='HTTPS URL / assets/…';url.value=value.startsWith('data:')?'':value;
 const state=document.createElement('small');state.textContent=value.startsWith('data:')?'파일 첨부됨':'';
 const file=document.createElement('input');file.type='file';file.accept=kind==='audio'?'audio/*':'image/png,image/jpeg,image/webp,image/gif,image/avif';
 const clear=document.createElement('button');clear.textContent='제거';clear.type='button';
 function update(v){change(v);if(v)preview.src=v;else preview.removeAttribute('src');state.textContent=v.startsWith('data:')?'파일 첨부됨':v?'URL 등록됨':'';url.value=v.startsWith('data:')?'':v}
 if(value)preview.src=value;
 url.onchange=()=>{try{update(safeAsset(url.value,kind))}catch(e){status(e.message,true)}};
 file.onchange=async()=>{const serial=editorSerial;pending++;try{if(!admin)throw Error('관리자 로그인 필요');const v=await uploadAsset(file.files[0],kind);if(serial!==editorSerial)throw Error('다른 그룹으로 이동하여 업로드가 취소됐습니다.');if(v)update(v);status('파일 등록됨 · 저장 필요')}catch(e){status(e.message,true)}finally{pending--;file.value=''}};
 clear.onclick=()=>{update('');file.value=''};label.append(url);controls.append(label,file,state,clear);if(kind==='image'&&title!=='그룹 로고 (반복 연출)'&&title!=='최초 등장 전체 화면 이미지'){const crop=document.createElement('button');crop.type='button';crop.textContent='사진 크롭';crop.onclick=()=>{if(!preview.getAttribute('src'))return status('사진을 먼저 등록하세요.',true);openCrop(preview.src,update).catch(e=>status(e.message,true))};controls.append(crop)}box.append(preview,controls);return box;
}
function refreshMembers(){
 const container=$s('memberEditor');container.replaceChildren();
 for(const n of current().members){container.append(assetRow(n,draft.memberPhotos[n]||'','image',v=>{if(v)draft.memberPhotos[n]=v;else delete draft.memberPhotos[n]}))}
}
function show(){
 editorSerial++;const g=current();if(!g)return;
 $s('gid').value=g.id;$s('gname').value=g.name;$s('role').value=g.role;$s('color').value=g.color;$s('sub').checked=g.sub;$s('memberNames').value=g.members.join('\n');$s('editorTitle').textContent=g.name||'새 그룹';renderMetadata(g);const c=g.combat||{},sk=c.skill||{};$s('atk').value=c.damage??'';$s('interval').value=c.interval??'';$s('range').value=c.range??'';$s('skillKind').value=sk.kind||'';$s('skillName').value=sk.name||'';$s('skillEvery').value=sk.every??5;$s('skillPower').value=sk.power??1.5;$s('skillRadius').value=sk.radius??110;writeFXFields(c);renderCombatFields();
 const list=$s('groupList');list.replaceChildren();draft.groups.forEach((item,i)=>{const q=$s('groupSearch').value.trim().toLowerCase();if(q&&i!==index&&![item.name,item.id,item.generation,item.agency,item.country].some(v=>String(v||'').toLowerCase().includes(q)))return;const b=document.createElement('button');b.textContent=(item.name||'새 그룹')+' · '+item.members.length;b.classList.toggle('active',i===index);b.onclick=()=>{if(pending)return status('파일 등록 중입니다.',true);sync();index=i;show()};list.append(b)});
 const assets=$s('groupAssets');assets.replaceChildren();for(const [key,title,kind] of [['photo','그룹 원형 사진','image'],['logo','그룹 로고 (반복 연출)','image'],['reveal','최초 등장 전체 화면 이미지','image'],['audio','등장 음원','audio']])assets.append(assetRow(title,g[key]||'',kind,v=>g[key]=v));refreshMembers()
}
function validated(){if(!admin||saving)throw Error('관리자 로그인 또는 저장 상태를 확인하세요.');if(pending)throw Error('파일 등록 중입니다.');sync();return normalizeCatalog(draft)}
async function reloadPublished(){const loaded=await fetchPublished();draft=loaded.data;revision=loaded.revision;index=Math.min(index,draft.groups.length-1);$s('sourceLabel').textContent='CLOUD · r'+revision;show()}
function access(){const root=$s('studioMain');root.inert=!admin||saving;$s('loginForm').hidden=admin;$s('logout').hidden=!admin;$s('logout').disabled=saving||pending>0;$s('authState').textContent=admin?'GRD 관리자 · 공개 편집 가능':'GRD 관리자 계정으로 로그인'}
async function boot(){for(const role of roleOptions){const o=document.createElement('option');o.value=o.textContent=role;$s('role').append(o)}bindStudioFields();await reloadPublished();try{admin=await cloudAdmin()}catch(e){console.warn(e)}access()}
$s('loginForm').onsubmit=async ev=>{ev.preventDefault();try{await cloudLogin($s('loginName').value,$s('loginPassword').value);admin=true;await reloadPublished();status('관리자 로그인 완료')}catch(e){admin=false;status(e.message||'로그인 실패',true);$s('authState').textContent=e.message||'로그인 실패'}finally{$s('loginPassword').value='';access();if(!admin)$s('authState').textContent='로그인 실패 · 계정과 권한을 확인하세요.'}};
$s('logout').onclick=async()=>{if(saving||pending)return;await cloudLogout();admin=false;access()};
$s('reloadCloud').onclick=async()=>{if(pending||saving||!admin)return;if(!confirm('미저장 변경을 버리고 최신 공개 데이터를 불러올까요?'))return;try{await reloadPublished();status('최신 공개 데이터 로드 완료')}catch(e){status(e.message,true)}};
$s('importLocal').onclick=async()=>{if(pending||saving||!admin)return;try{const old=await localCatalog();if(!old)throw Error('이 브라우저에 이전 데이터가 없습니다.');if(!confirm('현재 편집 내용을 이전 로컬 카탈로그로 교체할까요?'))return;draft=normalizeCatalog(old);index=0;show();status('이전 데이터 로드 완료 · 공개 저장 시 파일도 이전됩니다.')}catch(e){status(e.message,true)}};
$s('groupSearch').oninput=()=>{if(!draft||pending||saving)return;sync();show()};
$s('addGroup').onclick=()=>{if(pending)return;sync();let i=1;while(draft.groups.some(g=>g.id==='new-'+i))i++;draft.groups.push({id:'new-'+i,name:'새 그룹 '+i,members:[],role:'기본',color:'#e1b0ff',sub:false});index=draft.groups.length-1;show()};
$s('removeGroup').onclick=()=>{if(pending||draft.groups.length===1)return;if(confirm(current().name+' 그룹을 삭제할까요?')){draft.groups.splice(index,1);index=Math.max(0,index-1);show()}};
$s('applyMembers').onclick=()=>{if(pending)return;sync();show()};
$s('save').onclick=async()=>{try{const data=validated();if(!confirm('전체 플레이어에게 이 카탈로그를 공개할까요?'))return;saving=true;access();const published=await publishCatalog(data,revision);draft=published.data;revision=published.revision;$s('sourceLabel').textContent='CLOUD · r'+revision;show();status('공개 완료 · 새로 접속하는 게임에 적용됩니다.')}catch(e){status(e.message,true)}finally{saving=false;access()}};
$s('export').onclick=()=>{try{const data=validated();const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='catalog.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('catalog.json 내보내기 완료')}catch(e){status(e.message,true)}};
$s('import').onclick=()=>$s('importFile').click();$s('importFile').onchange=async()=>{try{if(pending)throw Error('파일 등록 중입니다.');const f=$s('importFile').files[0];if(!f)return;draft=normalizeCatalog(JSON.parse(await f.text()));index=0;show();status('가져오기 완료 · 저장 필요')}catch(e){status(e.message,true)}finally{$s('importFile').value=''}};
let cropImage=null,cropUpdate=null,cropSerial=0;
async function openCrop(url,update){if(!admin||saving||pending)return;const image=new Image();if(!url.startsWith('data:')&&!url.startsWith('blob:'))image.crossOrigin='anonymous';await new Promise((res,rej)=>{image.onload=res;image.onerror=()=>rej(Error('크롭을 위해 이미지를 불러올 수 없습니다. 파일로 업로드하세요.'));image.src=url});cropImage=image;cropUpdate=update;cropSerial=editorSerial;for(const [id,value] of [['cropZoom',1],['cropX',0],['cropY',0]])$s(id).value=value;paintCrop();$s('cropDialog').showModal()}
function paintCrop(){if(!cropImage)return;const c=$s('cropCanvas'),ctx=c.getContext('2d'),z=Number($s('cropZoom').value),x=Number($s('cropX').value),y=Number($s('cropY').value),d=Math.min(cropImage.naturalWidth,cropImage.naturalHeight)/z,sx=(cropImage.naturalWidth-d)*(x+1)/2,sy=(cropImage.naturalHeight-d)*(y+1)/2;ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(cropImage,sx,sy,d,d,0,0,c.width,c.height)}
for(const id of ['cropZoom','cropX','cropY'])$s(id).oninput=paintCrop;
$s('cropCancel').onclick=()=>$s('cropDialog').close();
$s('cropApply').onclick=async()=>{if(pending||!admin)return;pending++;try{const blob=await new Promise(res=>$s('cropCanvas').toBlob(res,'image/png'));if(!blob)throw Error('이미지 변환 실패');const url=await uploadAsset(blob,'image');if(cropSerial!==editorSerial)throw Error('편집 대상이 변경되었습니다.');cropUpdate(url);$s('cropDialog').close();status('크롭 이미지 등록 · 공개 저장 필요')}catch(e){status(e.message,true)}finally{pending--}};
let previewAudio=null,previewTimer=0;
function previewReveal(repeat){if(!draft)return;sync();const g=current(),dlg=$s('previewDialog'),img=$s('previewArt'),art=repeat?g.logo:g.reveal||g.photo||g.logo;dlg.classList.toggle('repeat',repeat);img.hidden=!art;if(art)img.src=art;else img.removeAttribute('src');$s('previewTitle').textContent=g.name;dlg.showModal();if(g.audio){previewAudio=new Audio(g.audio);previewAudio.play().catch(()=>{})}previewTimer=setTimeout(()=>dlg.close(),repeat?2800:6500)}
$s('previewReveal').onclick=()=>previewReveal(false);$s('previewRepeat').onclick=()=>previewReveal(true);$s('previewClose').onclick=()=>$s('previewDialog').close();$s('previewDialog').onclose=()=>{clearTimeout(previewTimer);if(previewAudio){previewAudio.pause();previewAudio=null}};
boot().catch(e=>{$s('authState').textContent='서버 연결 실패';status(e.message||'서버 연결 실패',true)});

