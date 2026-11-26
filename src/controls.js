'use strict';
function unitRank(u){return u.type==='group'?['#d5b8ff','#b5e7ff','#ffdb82'][u.level-1]:rankColors[u.level-1]}
function portraitMarkup(u){const url=portraitURL(u);return '<span class="unit-art" aria-hidden="true">'+(url?'<img src="'+esc(url)+'" alt="" draggable="false" onerror="this.remove()">':'')+'<span>'+esc(nameOf(u).slice(0,3))+'</span></span>'}
function renderStage(){
 $('stageLevel').textContent='Lv.'+state.stageLevel;
 $('deployedCount').textContent=deployedCount()+' / '+capacity();
 $('capacityFill').style.width=(deployedCount()/capacity()*100)+'%';
 const cost=stageCosts[state.stageLevel-1],btn=$('expandStage');btn.textContent=cost?'확장 +2 · '+fmt(cost)+' G':'MAX LEVEL';btn.disabled=!cost||state.gold<cost||state.done||state.paused;
}
function renderBench(){
 const filter=$('filter').value,order=$('benchOrder').value,root=$('inventory');
 const all=state.units.filter(u=>u.slot<0);let us=all.filter(u=>filter==='all'||filter===u.type);
 const dps=u=>{const s=stats(u);return s.damage/s.interval};
 us.sort((a,b)=>order==='power'?dps(b)-dps(a)||a.id-b.id:order==='recent'?b.id-a.id:(b.type==='group')-(a.type==='group')||b.level-a.level||a.id-b.id);
 const stacks=new Map();for(const u of us){const key=JSON.stringify([u.type,u.type==='group'?u.gid:u.name,u.level]);if(!stacks.has(key))stacks.set(key,[]);stacks.get(key).push(u)}
 $('count').textContent='대기 '+all.length+' · 보유 '+state.units.length;
 const signature=JSON.stringify([...stacks.values()].map(items=>[items.map(u=>u.id),items[0].level,items[0].type==='group'?progressFor(items[0].gid).level:0,items.some(u=>u.id===selected)]));
 if(root.dataset.signature===signature)return;root.dataset.signature=signature;
 root.innerHTML=stacks.size?[...stacks.values()].map(items=>{const u=items.find(u=>u.id===selected)||items[0];return '<button class="bench-token '+(u.id===selected?'selected':'')+'" data-unit="'+u.id+'" style="--rank:'+unitRank(u)+'" aria-label="'+esc(nameOf(u))+' '+items.length+'장">'+portraitMarkup(u)+(items.length>1?'<b class="stack-count">×'+items.length+'</b>':'')+'<strong>'+esc(nameOf(u))+'</strong><small>'+(u.type==='group'?'★'.repeat(u.level)+' +'+progressFor(u.gid).level:'Lv.'+u.level)+'</small></button>'}).join(''):'<div class="empty-bench">—</div>';
}
function scrollBench(dir){$('inventory').scrollBy({left:dir*Math.max(180,$('inventory').clientWidth*.75),behavior:'smooth'})}

function renderCasting(){const blocked=state.done||state.paused;for(const kind of ['normal','group','gamble']){const cost=castCost(kind);$(kind).disabled=blocked||state.tickets<cost;$(kind).textContent='🎫 '+cost;if(kind!=='gamble'){const b=$(kind+'5');const count=Math.min(5,Math.floor(state.tickets/cost));b.disabled=blocked||count<2;b.textContent='×'+Math.max(2,count)+' · '+(cost*Math.max(2,count))}}$('choose').disabled=blocked||state.dia<3;$('trainTeam').disabled=blocked||!trainingCosts[state.training]||state.gold<trainingCosts[state.training];$('trainTeam').textContent=trainingCosts[state.training]?'팀 훈련 +'+state.training+' · '+fmt(trainingCosts[state.training])+' G':'팀 훈련 MAX';$('trainTeam').title='전체 유닛 공격력 ×'+teamBoost().toFixed(2)}
function renderFocus(){const g=focusGroup(),m=materials(g),n=m.filter(Boolean).length,root=$('focusProgress');$('castGroup').value=g.id;$('focusMini').textContent=n+'/'+g.members.length+' ♛';const sig=g.id+':'+m.map(u=>u?u.id:0).join(',')+':'+state.dia+':'+(state.gold>=g.members.length*50)+':'+state.done;if(root.dataset.signature===sig)return;root.dataset.signature=sig;root.innerHTML='<div class="focus-head"><strong>'+esc(g.name)+'</strong><b>'+n+'/'+g.members.length+'</b></div><div class="focus-bar"><i style="width:'+100*n/g.members.length+'%"></i></div><div class="focus-members">'+g.members.map((name,i)=>'<button class="focus-member '+(m[i]?'have':'')+'" onclick="openChoice(members['+members.indexOf(name)+'])" title="'+esc(name)+' · '+(m[i]?'보유':'선택 영입')+'">'+(activeCatalog.memberPhotos[name]?'<img src="'+esc(activeCatalog.memberPhotos[name])+'" alt="" onerror="this.remove()">':'')+'<span>'+esc(name)+'</span>'+(m[i]?' ✓':' +')+'</button>').join('')+'</div><button class="focus-combine" '+(n<g.members.length||state.gold<g.members.length*50||state.done?'disabled':'')+' onclick="combine(\''+g.id+'\')">조합 · '+(g.members.length*50)+' G</button>'}
let bannerSerial=0;
function battleBanner(text,kind){const el=$('battleEvent'),serial=++bannerSerial;el.textContent=text;el.className='battle-event '+kind;void el.offsetWidth;el.classList.add('show');setTimeout(()=>{if(serial===bannerSerial)el.classList.remove('show')},kind==='boss'?2000:950)}
