const CACHE='the-last-ship-v148';
const ROOT=self.registration.scope;
const ASSETS=['./marine-realistic.png','./alien-realistic.png','./bioscan-embryo.png','./release.js?v=148','./version.json','./science-facility.webp','./field-manual-tiles.webp','./last-stand.js?v=148','./bioscanner-bodies.png','./','./index.html','./style.css?v=148','./game.js?v=148','./artwork.js?v=148','./wrist-terminal.js?v=148','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./alien-planet.webp','./sound-check.html','./board-ground.webp','./board-valley.webp','./apate-schematic.webp','./terrain.js?v=148','./marine-tokens.png','./alien-overhead.png','./alien-body.webp','./alien-tail.webp','./flare-overhead.webp','./dropship-landing.webp','./sentry-overhead-parts.png','./orbital-ending.png','./quarantine-schematic.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('the-last-ship-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(ROOT))return;
 if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return}
 const isCode=event.request.mode==='navigate'||/\.(?:html|js|css|webmanifest)$/.test(url.pathname);
 const key=event.request.mode==='navigate'?new Request(new URL('./index.html',ROOT)):event.request;
 if(isCode){event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(event.request,{cache:'no-store'});if(response.ok)await cache.put(key,response.clone());return response}catch(e){return await cache.match(key)||Response.error()}})());return}
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(event.request);if(cached)return cached;const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response})());
});
