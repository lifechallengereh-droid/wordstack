const CACHE='wordstack-v7-2-6-2-firstscreen';
const ASSETS=['./','./index.html','./styles.css','./app.js','./google-sync.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(ASSETS.map(a=>c.add(a))))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return resp;}).catch(()=>caches.match('./index.html')))));
