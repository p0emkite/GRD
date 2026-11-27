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
 await page.waitForFunction(()=>document.documentElement.classList.contains('touch-portrait')&&!state.setup);
 const check=async (v,msg)=>assert.ok(await v,msg);
 const visible=async id=>page.locator('#'+id).evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1});
 for(const id of ['mobile-normal','mobile-group','mobile-gamble','mobile-choose','mobile-auto'])await check(visible(id),name+' quick button '+id);
 await check(page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
 const before=await page.evaluate(()=>state.tickets);
 await page.locator('#mobile-normal').tap();
 assert.equal(await page.evaluate(()=>state.tickets),before-1);
 await page.locator('#mobile-group').tap();
 const after=await page.evaluate(()=>state.units.length);assert.equal(after,2);
 await page.locator('#mobile-auto').tap();await check(page.evaluate(()=>state.autoCast),'auto on');
 await page.locator('#mobile-auto').tap();await check(page.evaluate(()=>!state.autoCast),'auto off');
 // Real taps, deterministic extra bench setup for movement/scroll checks.
 await page.evaluate(()=>{while(deployedCount()<capacity())addUnit('member',members[state.units.length%members.length]);$('filter').value='all';for(let j=0;j<Math.min(14,members.length);j++)addUnit('member',members[j]);render()});
 await page.locator('#inventory').scrollIntoViewIfNeeded();
 await check(page.locator('#inventory').evaluate(e=>e.children.length>4&&e.scrollWidth>e.clientWidth),'bench scrollable');
 await check(page.locator('.bench-token').first().evaluate(e=>getComputedStyle(e).touchAction==='pan-x'),'bench swipe enabled');
 if(name==='android-chromium'){
  const box=await page.locator('#inventory').boundingBox();const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width-20,y:box.y+box.height/2}]});
  for(let j=1;j<=8;j++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width-20-j*(box.width-40)/8,y:box.y+box.height/2}]});await page.waitForTimeout(16)}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
  await check(page.locator('#inventory').evaluate(e=>e.scrollLeft>0),'native swipe');
 }
 await page.locator('#inventory').evaluate(e=>e.scrollLeft=0);
 const card=page.locator('.bench-token').first(),id=Number(await card.getAttribute('data-unit'));
 await card.tap();assert.equal(await page.evaluate(()=>selected),id);
 await page.locator('#board').scrollIntoViewIfNeeded();
 const slot=await page.evaluate(()=>unlockOrder[0]),pos=await page.evaluate(i=>slots[i],slot),b=await page.locator('#board').boundingBox();
 await page.touchscreen.tap(b.x+b.width*pos.x/900,b.y+b.height*pos.y/420);
 assert.equal(await page.evaluate(id=>state.units.find(u=>u.id===id).slot,id),slot,'bench to occupied slot');
 // Field selection and explicit move control.
 await page.locator('#mobile-move').tap();
 await check(page.evaluate(()=>touchMoveId===selected),'move mode');
 const slot2=await page.evaluate(()=>unlockOrder[1]),pos2=await page.evaluate(i=>slots[i],slot2);
 const b2=await page.locator('#board').boundingBox();
 await page.touchscreen.tap(b2.x+b2.width*pos2.x/900,b2.y+b2.height*pos2.y/420);
 assert.equal(await page.evaluate(id=>state.units.find(u=>u.id===id).slot,id),slot2,'field swap');
 await page.locator('#nextWave').tap();await page.waitForFunction(()=>state.wave===1&&state.enemies.length>0);
 await page.locator('#s3').tap();await check(page.evaluate(()=>state.speed===3),'3x');
 await page.waitForTimeout(1000);
 await page.screenshot({path:'mobile-qa/'+name+'-portrait.png'});
 // Test rotation, real controls and state retention.
 const portrait=page.viewportSize();await page.setViewportSize({width:portrait.height,height:portrait.width});
 await page.waitForFunction(()=>document.documentElement.classList.contains('touch-landscape'));
 await check(page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'landscape overflow');
 await check(page.evaluate(()=>getComputedStyle(document.querySelector('main')).display==='grid'),'landscape split view');
 await page.locator('#normal').scrollIntoViewIfNeeded();await check(visible('normal'),'landscape cast visible');
 const tickets=await page.evaluate(()=>state.tickets);await page.locator('#normal').tap();assert.equal(await page.evaluate(()=>state.tickets),tickets-1);
 await page.screenshot({path:'mobile-qa/'+name+'-landscape.png'});
 assert.deepEqual(errors,[],'uncaught browser errors');
 console.log('PASS '+name+' '+JSON.stringify(await page.evaluate(()=>({round:state.wave,units:state.units.length,scale:stageScale,renderer:$('rendererStatus').textContent}))));
 }catch(e){failed++;console.error('FAIL '+name,e)}
 finally{await browser?.close()}
}
if(failed)process.exitCode=1;
