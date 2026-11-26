'use strict';
// First acquisition per group per run: pause the simulation during a fullscreen reveal.
let revealTimer=0,revealAudio=null,revealEpoch=0;
function stopReveal(){revealEpoch++;clearTimeout(revealTimer);revealTimer=0;if(revealAudio){revealAudio.pause();revealAudio=null}for(const id of ['groupCinematic','groupFlash']){const el=$(id);el.hidden=true;el.classList.remove('playing');el.querySelector('img').removeAttribute('src')}if(state)state.paused=false}
function showGroupReveal(g){
 const first=!state.revealed.has(g.id);stopReveal();state.revealed.add(g.id);const epoch=revealEpoch;
 const layer=$(first?'groupCinematic':'groupFlash'),img=layer.querySelector('img'),name=layer.querySelector('.reveal-name'),art=first?(g.reveal||g.photo||g.logo):(g.logo||'');
 name.textContent=g.name;img.hidden=!art;if(art){img.src=art;img.onerror=()=>{if(epoch===revealEpoch)img.hidden=true}}layer.style.setProperty('--group-accent',g.color);
 layer.hidden=false;void layer.offsetWidth;layer.classList.add('playing');
 if(first){state.paused=true;drag=null;$('revealSkip').focus({preventScroll:true})}
 if(g.audio){try{const a=new Audio(g.audio);a.volume=.75;revealAudio=a;void a.play().catch(()=>{})}catch(e){console.warn('Reveal audio unavailable',e)}}
 revealTimer=setTimeout(()=>{if(epoch===revealEpoch)stopReveal()},first?6500:2800);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state?.paused){e.preventDefault();stopReveal();render()}});
