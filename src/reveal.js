'use strict';
// First acquisition per group per run: pause the simulation during a fullscreen reveal.
let revealTimer=0,revealAudio=null,revealEpoch=0,revealOwnsPause=false;
const repeatRevealMs=300;
function stopReveal(){revealEpoch++;clearTimeout(revealTimer);revealTimer=0;if(revealAudio){revealAudio.pause();revealAudio=null}for(const id of ['groupCinematic','groupFlash']){const el=$(id);el.hidden=true;el.classList.remove('playing');el.querySelector('img').removeAttribute('src')}if(state&&revealOwnsPause)state.paused=false;revealOwnsPause=false}
function showGroupReveal(g){
 const first=!state.revealed.has(g.id);stopReveal();state.revealed.add(g.id);if(prefs.skipSeen&&(!first||profile.collection[g.id])){render();return;}const epoch=revealEpoch;
 const layer=$(first?'groupCinematic':'groupFlash'),img=layer.querySelector('img'),name=layer.querySelector('.reveal-name'),art=first?(g.reveal||g.photo||g.logo):(g.logo||'');
 name.textContent=g.name;name.hidden=!first&&!!art;img.hidden=!art;if(art){img.src=art;img.onerror=()=>{if(epoch===revealEpoch)img.hidden=true}}layer.style.setProperty('--group-accent',g.color);
 layer.hidden=false;void layer.offsetWidth;layer.classList.add('playing');
 if(first){revealOwnsPause=!state.paused;state.paused=true;clearDrag();closeChoice();$('revealSkip').focus({preventScroll:true})}
 if(first&&g.audio&&prefs.masterOn!==false&&prefs.bgmOn!==false){try{const a=new Audio(g.audio);a.volume=Math.max(0,Math.min(1,Number(prefs.bgm)||0));revealAudio=a;void a.play().catch(()=>{})}catch(e){console.warn('Reveal audio unavailable',e)}}
 revealTimer=setTimeout(()=>{if(epoch===revealEpoch){stopReveal();render()}},first?6500:repeatRevealMs);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state?.paused&&!$('groupCinematic').hidden){e.preventDefault();stopReveal();render()}});
