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
function castCost(kind){return kind==='normal'?100:kind==='gamble'?500:0}
function normalDraw(exclude=null){const pool=exclude===null?members:members.filter(n=>n!==exclude);if(!pool.length)return null;const missing=pool.filter(n=>!state.units.some(u=>u.type==='member'&&u.name===n));return pick(missing.length&&runRandom()<Math.min(.95,.65+.15*perk('talent')+.10*perk('contract'))?missing:pool)}
function gambleTier(){const r=runRandom();return r<.01?3:r<.1?2:1}
function duplicateFactor(u){if(u.slot<0)return 1;const copies=state.units.filter(v=>v.slot>=0&&v.type==='group'&&v.gid===u.gid).sort((a,b)=>b.level-a.level||a.id-b.id);const i=copies.findIndex(v=>v.id===u.id);return [1,.65,.38,.23,.16][i]??.10}
function groupBase(g){return g.combat?.damage??defaultGroupDamage(g)}
// Shared by the game engine and Creator Studio: unmodified base combat rules.
function groupAttackProfile(role){return role==='저격'?{interval:1.05,range:320}:role==='광역'?{interval:1.05,range:205}:role==='감속'?{interval:.85,range:200}:role==='지원'?{interval:.65,range:195}:{interval:.75,range:220}}
function recommendedGroupCombat(g){if(!g.members?.length)throw Error('멤버 이름을 먼저 입력하세요.');const bare={...g,combat:{}},base=groupAttackProfile(g.role);const original=groups.find(x=>x.id===g.id),skill=Object.hasOwn(skillProfiles,g.id)&&original?.role===g.role?groupSkill(bare):g.role==='속사'?{name:'TEMPO UP',kind:'tempo',every:5,power:1.45}:groupSkill({...bare,id:''});return {damage:Math.round(groupBase(bare)*100)/100,...base,skill:{...skill,radius:skill.radius??110}}}
const trainingCosts=[1500,2500,4000,6000,8500,11500,15000,19000];
function trainTeam(){if(!state||state.done||state.paused)return false;const cost=trainingCost();if(!cost||state.gold<cost)return false;state.gold-=cost;state.training++;soundEffect('upgrade');log('TEAM TRAINING +'+state.training,'good');render();return true}
function teamBoost(){return 1+.12*(state.training||0)}
function combatHit(u,e,st,source,deployed){let damage=st.damage,crit=st.role==='치명타'&&runRandom()<.25+.12*perk('critical');if(crit)damage*=2.1;
 const p=point(e.d),g=u.type==='group'?groupOf(u):null,skill=g?groupSkill(g):null;u.attacks=(u.attacks||0)+1;const proc=skill&&u.attacks%Math.max(2,skill.every-perk('encore')-perk('rehearsal')-synergyBoost(u).skill)===0;
 if(proc)playCombatSFX('skill',resolveSkillFX(g,skill).id,g.id);else playCombatSFX('attack',st.role,u.type==='group'?u.gid:u.name);
 if(proc&&(skill.kind==='pierce'||skill.kind==='critical'||skill.kind==='tempo')){damage*=skill.power;crit=crit||skill.kind==='critical'}
 if(proc&&skill.kind==='tempo')u.cd*=.35;
 if(proc&&skill.kind==='cheer')for(const v of deployed)if(v!==u&&Math.hypot(slots[v.slot].x-source.x,slots[v.slot].y-source.y)<220)v.cd=Math.max(0,v.cd-.18);
 const rawDamage=damage;damage=damageEnemy(u,e,damage);const color=g?g.color:unitHue(u);if(!proc)effects.push({kind:'hit',x:source.x,y:source.y,tx:p.x,ty:p.y,t:.15,color,style:st.role});
 effects.push({kind:'number',x:p.x,y:p.y,t:.55,color:crit?'#ffe18c':'#fff1ff',text:(crit?'CRIT ':'')+Math.round(damage),crit});
 if(st.role==='감속')e.slow=1.6*(1+.25*perk('chill'));
 if(st.role==='광역'||proc&&['blast','freeze'].includes(skill.kind)){const radius=proc&&skill.radius?skill.radius:65,ratio=proc&&skill.kind==='blast'?skill.power*.65:.45;effects.push({kind:'area',x:p.x,y:p.y,t:.35,color,radius});for(const other of state.enemies){if(other===e||other.hp<=0)continue;const q=point(other.d);if(Math.hypot(q.x-p.x,q.y-p.y)<radius){damageEnemy(u,other,rawDamage*ratio*(1+.15*perk('splash')));if(proc&&skill.kind==='freeze')other.slow=3.2*(1+.25*perk('chill'))}}if(proc&&skill.kind==='freeze')e.slow=3.2*(1+.25*perk('chill'))}
 if(proc)emitSkillFX(g,skill,source,p,skill.kind==='cheer'?deployed.filter(v=>v!==u&&Math.hypot(slots[v.slot].x-source.x,slots[v.slot].y-source.y)<220).map(v=>slots[v.slot]):[]);
 if(effects.length>180)effects.splice(0,effects.length-180);
}
