// Verbus — service worker: sempre tenta a rede primeiro (versão nova), usa o cache só offline.
const CACHE = 'verbus-v24';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQUIVOS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k !== CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const r = e.request;
  if(r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r, {cache:'no-cache'}).then(res=>{
      if(res.ok){ const cp = res.clone(); caches.open(CACHE).then(c=>c.put(r, cp)); }
      return res;
    }).catch(()=>caches.match(r).then(m=>m || caches.match('./index.html')))
  );
});
