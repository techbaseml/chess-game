const CACHE='nexa-__BUILD_HASH__';
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch('/offline-assets.json',{cache:'no-store'});if(!response.ok)throw Error('Offline manifest unavailable');
 const {assets}=await response.json();const cache=await caches.open(CACHE);
 await cache.addAll([...new Set(['/','/manifest.webmanifest','/icon-192.png','/icon-512.png',...assets])]);
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('nexa-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const request=event.request,u=new URL(request.url);
 if(request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/')||u.pathname.includes('signin')||u.pathname.includes('signout')||u.search||request.headers.get('RSC'))return;
 const asset=/\.(js|css|svg|png|webp|wasm|bin|webmanifest)$/.test(u.pathname);
 if(!asset&&request.mode!=='navigate')return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);if(asset){const hit=await cache.match(request);if(hit)return hit;}
  try{const response=await fetch(request);if(response.ok&&!response.redirected){try{await cache.put(request,response.clone());}catch{}}return response;}
  catch{const hit=await cache.match(request);if(hit)return hit;if(request.mode==='navigate'){const home=await cache.match('/');if(home)return home;}return Response.error();}
 })());
});
