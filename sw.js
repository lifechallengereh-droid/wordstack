const CACHE='wordstack-v7-2-6-4-verified';
const ASSETS=['./','./index.html','./styles.css?v=7264','./app.js?v=7264','./google-sync.js?v=7264','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(ASSETS.map(a=>cache.add(a)))));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(resp=>{
      const cp=resp.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp)).catch(()=>{});
      return resp;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(req).then(resp=>{
    const cp=resp.clone();caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});
    return resp;
  }).catch(()=>caches.match(req)));
});
