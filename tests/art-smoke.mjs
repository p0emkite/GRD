import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const origin='http://127.0.0.1:8765';
await fs.mkdir('art-qa',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];const forceBake=process.env.GRD_BAKE==='1';let requestedThree=0;page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&m.text().includes('GRD premium'))console.log(m.text())});
await page.route('**/*',async route=>{const u=route.request().url();if(u.startsWith(origin)){if(forceBake&&/\/assets\/premium\/venue-.*\.webp$/.test(u))return route.abort();return route.continue()}if(u.startsWith('https://cdn.jsdelivr.net/npm/three@0.180.0/build/')){requestedThree++;if(!forceBake)return route.abort();const file=u.split('/').at(-1);if(!['three.module.js','three.core.js'].includes(file))return route.abort();return route.fulfill({path:'node_modules/three/build/'+file,contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'}})}return route.abort()});
await page.goto(origin+'/index.html');await page.locator('#launchTour').waitFor({state:'visible',timeout:30000});
await page.waitForFunction(()=>!!premiumStageArt&&premiumStageKey==='concert',undefined,{timeout:90000});
await page.screenshot({path:'art-qa/lobby.png'});
await page.locator('#launchTour').click();
await page.waitForFunction(()=>!state.setup);
const seen=[];
for(const key of ['concert','broadcast','awards']){
 if(key!=='concert'){await page.evaluate(key=>{prefs.venueSkin=key;loadVenueSkin()},key);await page.waitForFunction(key=>!!premiumStageArt&&premiumStageKey===key,key,{timeout:90000})}
 const stat=await page.evaluate(()=>{const art=premiumStageArt,c=art.getContext('2d'),w=art.width,h=art.height;const samples=[];for(let i=0;i<15;i++){const p=c.getImageData(Math.floor(w*(.05+.061*i)),Math.floor(h*(.2+.05*(i%8))),1,1).data;samples.push([...p.slice(0,3)].join(','))}return {w,h,distinct:new Set(samples).size,signature:samples.join('|')}});
 assert.equal(stat.w,1800);assert.equal(stat.h,840);assert.ok(stat.distinct>=6,'render is not flat');seen.push(stat.signature);
 if(forceBake){const webp=await page.evaluate(()=>premiumStageArt.toDataURL('image/webp',.85).split(',')[1]);await fs.writeFile('art-qa/'+key+'.webp',Buffer.from(webp,'base64'))}await page.screenshot({path:'art-qa/'+key+'.png'});console.log('PASS',key,stat.w,stat.h,stat.distinct);
}
assert.equal(new Set(seen).size,3,'skin differentiation');
const count=await page.evaluate(()=>state.gold);await page.locator('#normal').click();assert.equal(await page.evaluate(()=>state.gold),count-100);
await page.evaluate(()=>{prefs.quality='low';loadVenueSkin()});if(forceBake)await page.waitForFunction(()=>!premiumStageArt&&!document.documentElement.classList.contains('premium-stage-ready'));else{await page.waitForFunction(()=>premiumStageArt?.width===900&&document.documentElement.classList.contains('premium-stage-ready'));assert.equal(requestedThree,0,'baked assets do not request Three.js')}
await page.screenshot({path:'art-qa/low-fallback.png'});
assert.deepEqual(errors,[]);console.log('PASS casting and low quality',forceBake?'runtime fallback':'local asset; no CDN');
}finally{await browser.close()}
