import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('service worker precaches unique assets and excludes online/auth requests',async()=>{
 const events={},saved=new Map();let offline=false;
 const cache={addAll:async urls=>{assert.equal(new Set(urls).size,urls.length);for(const url of urls)saved.set(url,new Response('cached '+url));},match:async r=>saved.get(typeof r==='string'?r:new URL(r.url).pathname)?.clone(),put:async(r,response)=>saved.set(new URL(r.url).pathname,response)};
 const context={URL,Response,Set,location:{origin:'https://nexa.test'},self:{addEventListener:(n,fn)=>events[n]=fn,clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},fetch:async()=>{if(offline)throw Error('offline');return Response.json({assets:['/icon-192.png','/app.js','/pieces/cburnett/wK.svg']});}};
 vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),context);
 let install;events.install({waitUntil:p=>install=p});await install;assert(saved.has('/app.js'));assert(saved.has('/pieces/cburnett/wK.svg'));
 for(const path of ['/api/rooms','/signin-with-chatgpt','/signout-with-chatgpt']){let intercepted=false;events.fetch({request:new Request('https://nexa.test'+path),respondWith:()=>intercepted=true});assert.equal(intercepted,false);}
 offline=true;let response;events.fetch({request:new Request('https://nexa.test/app.js'),respondWith:p=>response=p});assert.equal(await (await response).text(),'cached /app.js');
});
