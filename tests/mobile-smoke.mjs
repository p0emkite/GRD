import { chromium, webkit, devices } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const origin='http://127.0.0.1:8765';
await fs.mkdir('mobile-qa',{recursive:true});
const cases=[
 ['android-chromium',chromium,{...devices['Pixel 7'],viewport:{width:360,height:800},deviceScaleFactor:3}],
 ['iphone-webkit',webkit,{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:3}],
 ['small-iphone-webkit',webkit,{...devices['iPhone SE'],viewport:{width:375,height:667},deviceScaleFactor:2}]
];
let failed=0;
for(const [name,engine,config] of cases){
 let browser;
 try{
 browser=await engine.launch({headless:true});
 const context=await browser.newContext({...config,hasTouch:true,isMobile:true});
 // Isolated guest run, no network requests to Supabase, external fonts or CDN.
 await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/index.html');
 await page.locator('#launchTour').waitFor({state:'visible',timeout:30000});
 await page.locator('#launchTour').tap();
 await page.waitForFunction(()=>document.documentElement.classList.contains('touch-portrait')&&!state.setup);await page.evaluate(()=>{state.nextIn=60;dismissGuide();render()});
 const check=async (v,msg)=>assert.ok(await v,msg);
 const visible=async id=>page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1});
 for(const id of ['mobile-normal','mobile-gamble','mobile-choose','mobile-auto'])await check(visible(id),name+' quick button '+id);
 await check(page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
 const before=await page.evaluate(()=>state.gold);
 await page.locator('#mobile-normal').tap();
 assert.equal(await page.evaluate(()=>state.gold),before-100);
 await page.locator('#mobile-normal').tap();
 const after=await page.evaluate(()=>state.units.length);assert.equal(after,2);
 await page.locator('#mobile-auto').tap();await check(page.evaluate(()=>state.autoCast),'auto on');
 await page.locator('#mobile-auto').tap();await check(page.evaluate(()=>!state.autoCast),'auto off');
 // Fill the board, prove blocked draws do not spend gold, then sell via the radial menu.
 await page.evaluate(()=>{while(canRecruit())addUnit('member',members[state.units.length%members.length]);render()});
 await check(page.evaluate(()=>state.units.length===capacity()&&state.units.every(u=>isSlotOpen(u.slot))),'board cap');
 await check(page.locator('#mobile-normal').isDisabled(),'full board disables cast');
 const id=await page.evaluate(()=>state.units[0].id),slot=await page.evaluate(()=>state.units[0].slot),pos=await page.evaluate(i=>slots[i],slot);
 await page.locator('#board').evaluate(e=>e.scrollIntoView({block:'center'}));
 const b=await page.locator('#board').boundingBox();
 await page.touchscreen.tap(b.x+b.width*pos.x/900,b.y+b.height*pos.y/420);
 await page.locator('#unitWheel').waitFor({state:'visible',timeout:5000});
 assert.equal(await page.evaluate(()=>selected),id);
 assert.equal(await page.locator('#unitWheel .wheel-action').count(),5);
 await page.locator('[data-wheel="lock"]').tap();assert.equal(await page.evaluate(id=>state.units.find(u=>u.id===id).locked,id),true);
 await page.locator('[data-wheel="lock"]').tap();assert.equal(await page.evaluate(id=>state.units.find(u=>u.id===id).locked,id),false);
 const gold=await page.evaluate(()=>state.gold);await page.locator('[data-wheel="sell"]').tap();
 assert.equal(await page.evaluate(()=>state.gold),gold+50);
 await check(page.evaluate(()=>state.units.length===capacity()-1),'sell frees slot');
 if(await page.evaluate(()=>state.wave===0))await page.locator('#nextWave').tap();await page.waitForFunction(()=>state.wave>=1&&state.enemies.length>0);
 await page.locator('#s3').tap();await check(page.evaluate(()=>state.speed===3),'3x');
 await page.waitForTimeout(1000);
 await page.screenshot({path:'mobile-qa/'+name+'-portrait.png'});
 // Test rotation, real controls and state retention.
 const portrait=page.viewportSize();await page.setViewportSize({width:portrait.height,height:portrait.width});
 await page.waitForFunction(()=>document.documentElement.classList.contains('touch-landscape'));
 await check(page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'landscape overflow');
 await check(page.evaluate(()=>getComputedStyle(document.querySelector('main')).display==='grid'),'landscape split view');
 await page.locator('#normal').scrollIntoViewIfNeeded();await check(visible('normal'),'landscape cast visible');
 const tickets=await page.evaluate(()=>state.gold);await page.locator('#normal').tap();assert.equal(await page.evaluate(()=>state.gold),tickets-100);
 await page.screenshot({path:'mobile-qa/'+name+'-landscape.png'});
 assert.deepEqual(errors,[],'uncaught browser errors');
 console.log('PASS '+name+' '+JSON.stringify(await page.evaluate(()=>({round:state.wave,units:state.units.length,scale:stageScale,renderer:$('rendererStatus').textContent}))));
 }catch(e){failed++;console.error('FAIL '+name,e)}
 finally{await browser?.close()}
}
if(failed)process.exitCode=1;
