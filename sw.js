// Verbus — service worker: sempre tenta a rede primeiro (versão nova), usa o cache só offline.
const CACHE = 'verbus-v73', DIC = 'verbus-dic'; // DIC: dicionário de português e sinônimos (CDN), mantidos para uso offline
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon-32.png', './style.css', './style-word.css',
  './js/chaves.js', './js/armazenamento.js', './js/pagina.js', './js/edicao-base.js', './js/arquivo.js', './js/mala-direta.js', './js/tabelas.js', './js/notas-inserir.js', './js/inserir.js', './vendor/pdf.min.js', './vendor/pdf.worker.min.js', './js/corretor.js', './js/localizar.js', './js/salvar.js', './js/modelos-imagens.js', './js/modelos.js', './js/formatacao.js', './js/abnt.js', './js/referencias.js', './js/reguas.js', './js/cabecalho.js', './js/menu-arquivo.js', './js/estilos-imagens.js', './js/layout.js', './js/interface.js', './js/design.js'];

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
  // dicionário de português (≈5 MB): vem do cache e só vai à rede na primeira vez
  if(/\/spell\/pt\.(aff|dic)$/.test(u.pathname)){
    e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(m=>m || fetch(r).then(res=>{ if(res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  e.respondWith(
    fetch(r, {cache:'no-cache'}).then(res=>{
      if(res.ok){ const cp = res.clone(); caches.open(CACHE).then(c=>c.put(r, cp)); }
      return res;
    }).catch(()=>caches.match(r).then(m=>m || caches.match('./index.html')))
  );
});
