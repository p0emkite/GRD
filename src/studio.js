'use strict';
const $s=id=>document.getElementById(id);
let draft,index=0,editorSerial=0,pending=0;
function status(msg,bad=false){$s('status').textContent=msg;$s('status').classList.toggle('bad',bad)}
function current(){return draft.groups[index]}
function sync(){
 const g=current();if(!g)return;
 g.id=$s('gid').value.trim();g.name=$s('gname').value.trim();g.role=$s('role').value;g.color=$s('color').value;g.sub=$s('sub').checked;
 g.members=$s('memberNames').value.split(/\r?\n/).map(n=>n.trim()).filter(Boolean);
}
function readAsset(file,kind){
 if(!file)return Promise.resolve('');
 if(file.size> (kind==='audio'?25:8)*1024*1024)return Promise.reject(Error('이미지 8MB / 음원 25MB 이하 파일을 사용하세요.'));
 return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{try{res(safeAsset(String(r.result),kind))}catch(e){rej(e)}};r.onerror=()=>rej(r.error);r.readAsDataURL(file)})
}
function assetRow(title,value,kind,change){
 const box=document.createElement('div');box.className='asset-row';const preview=document.createElement(kind==='audio'?'span':'img');if(kind==='audio')preview.textContent='♫';else preview.alt='';
 const controls=document.createElement('div');controls.className='asset-controls';const label=document.createElement('label');label.textContent=title;
 const url=document.createElement('input');url.placeholder='HTTPS URL / assets/…';url.value=value.startsWith('data:')?'':value;
 const state=document.createElement('small');state.textContent=value.startsWith('data:')?'파일 첨부됨':'';
 const file=document.createElement('input');file.type='file';file.accept=kind==='audio'?'audio/*':'image/png,image/jpeg,image/webp,image/gif,image/avif';
 const clear=document.createElement('button');clear.textContent='제거';clear.type='button';
 function update(v){change(v);if(kind==='image'){if(v)preview.src=v;else preview.removeAttribute('src')}state.textContent=v.startsWith('data:')?'파일 첨부됨':v?'URL 등록됨':'';url.value=v.startsWith('data:')?'':v}
 if(kind==='image'&&value)preview.src=value;
 url.onchange=()=>{try{update(safeAsset(url.value,kind))}catch(e){status(e.message,true)}};
 file.onchange=async()=>{const serial=editorSerial;pending++;try{const v=await readAsset(file.files[0],kind);if(serial!==editorSerial)throw Error('다른 그룹으로 이동하여 업로드가 취소됐습니다.');if(v)update(v);status('파일 등록됨 · 저장 필요')}catch(e){status(e.message,true)}finally{pending--;file.value=''}};
 clear.onclick=()=>{update('');file.value=''};label.append(url);controls.append(label,file,state,clear);box.append(preview,controls);return box;
}
function refreshMembers(){
 const container=$s('memberEditor');container.replaceChildren();
 for(const n of current().members){container.append(assetRow(n,draft.memberPhotos[n]||'','image',v=>{if(v)draft.memberPhotos[n]=v;else delete draft.memberPhotos[n]}))}
}
function show(){
 editorSerial++;const g=current();if(!g)return;
 $s('gid').value=g.id;$s('gname').value=g.name;$s('role').value=g.role;$s('color').value=g.color;$s('sub').checked=g.sub;$s('memberNames').value=g.members.join('\n');$s('editorTitle').textContent=g.name||'새 그룹';
 const list=$s('groupList');list.replaceChildren();draft.groups.forEach((item,i)=>{const b=document.createElement('button');b.textContent=(item.name||'새 그룹')+' · '+item.members.length;b.classList.toggle('active',i===index);b.onclick=()=>{if(pending)return status('파일 등록 중입니다.',true);sync();index=i;show()};list.append(b)});
 const assets=$s('groupAssets');assets.replaceChildren();for(const [key,title,kind] of [['photo','그룹 원형 사진','image'],['logo','그룹 로고 (반복 연출)','image'],['reveal','최초 등장 전체 화면 이미지','image'],['audio','등장 음원','audio']])assets.append(assetRow(title,g[key]||'',kind,v=>g[key]=v));refreshMembers()
}
function validated(){if(pending)throw Error('파일 등록 중입니다.');sync();return normalizeCatalog(draft)}
async function boot(){const loaded=await loadCatalog();draft=loaded.data;$s('sourceLabel').textContent=loaded.source==='studio'?'로컬 스튜디오':loaded.source==='published'?'공개 카탈로그':'기본 DB';for(const role of roleOptions){const o=document.createElement('option');o.value=o.textContent=role;$s('role').append(o)}show()}
$s('addGroup').onclick=()=>{if(pending)return;sync();let i=1;while(draft.groups.some(g=>g.id==='new-'+i))i++;draft.groups.push({id:'new-'+i,name:'새 그룹 '+i,members:[],role:'기본',color:'#e1b0ff',sub:false});index=draft.groups.length-1;show()};
$s('removeGroup').onclick=()=>{if(pending||draft.groups.length===1)return;if(confirm(current().name+' 그룹을 삭제할까요?')){draft.groups.splice(index,1);index=Math.max(0,index-1);show()}};
$s('applyMembers').onclick=()=>{if(pending)return;sync();show()};
$s('save').onclick=async()=>{try{const data=validated();await localCatalog(data);draft=data;show();status('저장 완료 · 게임을 새로 열면 적용됩니다.')}catch(e){status(e.message,true)}};
$s('export').onclick=()=>{try{const data=validated();const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='catalog.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('catalog.json 내보내기 완료')}catch(e){status(e.message,true)}};
$s('import').onclick=()=>$s('importFile').click();$s('importFile').onchange=async()=>{try{if(pending)throw Error('파일 등록 중입니다.');const f=$s('importFile').files[0];if(!f)return;draft=normalizeCatalog(JSON.parse(await f.text()));index=0;show();status('가져오기 완료 · 저장 필요')}catch(e){status(e.message,true)}finally{$s('importFile').value=''}};
boot().catch(e=>status(e.message,true));
