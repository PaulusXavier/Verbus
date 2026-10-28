// Verbus — service worker: sempre tenta a rede primeiro (versão nova), usa o cache só offline.
const CACHE = 'verbus-v53', DIC = 'verbus-dic'; // DIC: dicionário de português e sinônimos (CDN), mantidos para uso offline
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQUIVOS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k !== CACHE && k !== DIC).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const r = e.request;
  const u = new URL(r.url);
  if(r.method !== 'GET') return;
  if(u.hostname === 'cdn.jsdelivr.net'){
    e.respondWith(caches.open(DIC).then(c=>c.match(r).then(m=>{
      const net = fetch(r).then(res=>{ if(res.ok) c.put(r, res.clone()); return res; });
      return m ? (net.catch(()=>{}), m) : net;
    })));
    return;
  }
  if(u.origin !== location.origin) return;
  e.respondWith(
    fetch(r, {cache:'no-cache'}).then(res=>{
      if(res.ok){ const cp = res.clone(); caches.open(CACHE).then(c=>c.put(r, cp)); }
      return res;
    }).catch(()=>caches.match(r).then(m=>m || caches.match('./index.html')))
  );
});
