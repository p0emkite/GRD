'use strict';
// Recruitment / combat tuning. All values are per-run and use existing currencies.
const skillProfiles={
 davichi:{name:'8282',kind:'tempo',every:5,power:1.45},
 '2ne1':{name:'I AM THE BEST',kind:'blast',every:5,power:1.15,radius:115},
 bp:{name:'DDU-DU DDU-DU',kind:'pierce',every:4,power:2.5},
 ive:{name:'LOVE DIVE',kind:'critical',every:4,power:2.2},
 snsd:{name:'Into the New World',kind:'freeze',every:5,power:1.1,radius:115},
 izone:{name:'La Vie en Rose',kind:'blast',every:4,power:1.4,radius:145},
 twice:{name:'CHEER UP',kind:'cheer',every:5,power:1.25},
 tts:{name:'Twinkle',kind:'pierce',every:5,power:2.1},
 misamo:{name:'Do not touch',kind:'freeze',every:5,power:1.2,radius:95}
};
function groupSkill(g){if(g.combat?.skill)return g.combat.skill;return Object.hasOwn(skillProfiles,g.id)?skillProfiles[g.id]:({광역:{name:'ENCORE',kind:'blast',every:5,power:1.2,radius:110},감속:{name:'SPOTLIGHT',kind:'freeze',every:5,power:1.1,radius:100},지원:{name:'CHEER',kind:'cheer',every:5,power:1.25},저격:{name:'FINALE',kind:'pierce',every:5,power:2.1}}[g.role]||{name:'SHOWTIME',kind:'critical',every:5,power:2})}
function focusGroup(){return groups.find(g=>g.id===state.focusId)||groups[0]}
function setFocus(id){if(!state||state.done||state.paused||!groups.some(g=>g.id===id))return;state.focusId=id;render()}
function groupDrawCost(g){return g.members.length<=5?2:1}
function castCost(kind){return kind==='normal'?1:kind==='group'?groupDrawCost(focusGroup()):kind==='gamble'?5:0}
function groupDraw(g){const missing=g.members.filter(n=>!state.units.some(u=>u.type==='member'&&u.name===n));const p=g.members.length>=6?.88:g.members.length>=4?.7:.35;return pick(missing.length&&Math.random()<p?missing:g.members)}
function normalDraw(){const missing=members.filter(n=>!state.units.some(u=>u.type==='member'&&u.name===n));return pick(missing.length&&Math.random()<.65?missing:members)}
function gambleTier(){const r=Math.random();return r<.01?3:r<.1?2:1}
function duplicateFactor(u){if(u.slot<0)return 1;const copies=state.units.filter(v=>v.slot>=0&&v.type==='group'&&v.gid===u.gid).sort((a,b)=>b.level-a.level||a.id-b.id);const i=copies.findIndex(v=>v.id===u.id);return [1,.72,.50,.35,.27][i]??.20}
function groupBase(g){if(g.combat?.damage!=null)return g.combat.damage;const n=g.members.length,raw=originalGroupRaw[g.id],factor=raw?Math.max(.94,Math.min(1.06,Math.pow(raw/500,.08))):1;return 38*Math.pow(n,1.28)*factor}
const trainingCosts=[1500,2500,4000,6000,8500,11500,15000,19000];
function trainTeam(){if(!state||state.done||state.paused)return false;const cost=trainingCosts[state.training];if(!cost||state.gold<cost)return false;state.gold-=cost;state.training++;log('TEAM TRAINING +'+state.training,'good');render();return true}
function teamBoost(){return 1+.12*(state.training||0)}
function combatHit(u,e,st,source,deployed){let damage=st.damage,crit=st.role==='치명타'&&Math.random()<.25;if(crit)damage*=2.1;
 const p=point(e.d),g=u.type==='group'?groupOf(u):null,skill=g?groupSkill(g):null;u.attacks=(u.attacks||0)+1;const proc=skill&&u.attacks%skill.every===0;
 if(proc&&(skill.kind==='pierce'||skill.kind==='critical'||skill.kind==='tempo')){damage*=skill.power;crit=crit||skill.kind==='critical'}
 if(proc&&skill.kind==='tempo')u.cd*=.35;
 if(proc&&skill.kind==='cheer')for(const v of deployed)if(v!==u&&Math.hypot(slots[v.slot].x-source.x,slots[v.slot].y-source.y)<220)v.cd=Math.max(0,v.cd-.18);
 e.hp-=damage;const color=g?g.color:unitHue(u);effects.push({kind:'hit',x:source.x,y:source.y,tx:p.x,ty:p.y,t:.15,color});
 effects.push({kind:'number',x:p.x,y:p.y,t:.55,color:crit?'#ffe18c':'#fff1ff',text:(crit?'CRIT ':'')+Math.round(damage),crit});
 if(st.role==='감속')e.slow=1.6;
 if(st.role==='광역'||proc&&['blast','freeze'].includes(skill.kind)){const radius=proc&&skill.radius?skill.radius:65,ratio=proc&&skill.kind==='blast'?skill.power*.65:.45;effects.push({kind:'area',x:p.x,y:p.y,t:.35,color,radius});for(const other of state.enemies){if(other===e||other.hp<=0)continue;const q=point(other.d);if(Math.hypot(q.x-p.x,q.y-p.y)<radius){other.hp-=damage*ratio;if(proc&&skill.kind==='freeze')other.slow=3.2}}if(proc&&skill.kind==='freeze')e.slow=3.2}
 if(proc){effects.push({kind:'skill',x:source.x,y:source.y-28,t:.85,color,text:skill.name});}
 if(effects.length>180)effects.splice(0,effects.length-180);
}
