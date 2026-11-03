/* Verbus — Salvamento automático, abrir/salvar no navegador e carregamento inicial
   (js/armazenamento.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
  // Data por extenso em português: o dia 1 leva ordinal (1º de novembro de 2026), como na redação oficial
  const dataLongaBR = d=>(d || new Date()).toLocaleDateString('pt-BR', {day:'numeric', month:'long', year:'numeric'}).replace(/^1 de /, '1º de ');
  const page = document.getElementById('page');
  const title = document.getElementById('title');
  let store = {current:null, docs:{}};
  let saveTimer;

  // ---------- Salvamento automático (IndexedDB; localStorage só como reserva) ----------
  // O objeto `store` continua igual em memória. No disco, cada documento é um registro próprio e as
  // imagens (data:image...) ficam em um repositório à parte, referenciadas por "verba-img:<hash>".
  function uid(){ return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
  const savedEl = document.getElementById('saved');
  const MSG_OK = 'Salvo automaticamente neste navegador';
  const FH = new Map();   // id do documento -> arquivo do computador ligado a ele (o Salvar grava direto nele, como no Word)
  const hhmm = t=>new Date(t || Date.now()).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  function fileText(){
    const e = FH.get(store.current); if(!e) return '';
    return e.dirty ? e.name + ' — alterações ainda não gravadas no arquivo (Ctrl+S)' : 'Salvo em ' + e.name + ' às ' + hhmm(e.t);
  }
  let useIDB = false, avisou = false;
  const dirty = new Set(), known = new Set(), imgKnown = new Set(), hashCache = new Map();
  let queue = Promise.resolve(), flushTimer = null, lastCurrent = null;

  const IDB = {
    db: null,
    open(){
      return new Promise((res, rej)=>{
        if(!window.indexedDB) return rej(new Error('IndexedDB indisponível'));
        let r; try{ r = indexedDB.open(IDB_DOCS, 1); }catch(e){ return rej(e); }
        r.onupgradeneeded = ()=>{ const d = r.result; d.createObjectStore('docs', {keyPath:'id'}); d.createObjectStore('images'); d.createObjectStore('meta'); };
        r.onsuccess = ()=>{ IDB.db = r.result; IDB.db.onversionchange = ()=>IDB.db.close(); res(); };
        r.onerror = ()=>rej(r.error); r.onblocked = ()=>rej(new Error('bloqueado'));
      });
    },
    tx(names, mode, fn){
      if(window.__vLimpando && mode !== 'readonly') return Promise.resolve();   // limpando tudo: nada pode ser regravado
      return new Promise((res, rej)=>{
        const t = IDB.db.transaction(names, mode); let out;
        t.oncomplete = ()=>res(out); t.onerror = ()=>rej(t.error); t.onabort = ()=>rej(t.error || new Error('abortado'));
        out = fn(t);
      });
    },
    async readAll(){
      let docs = [], meta = null;
      await IDB.tx(['docs','meta'], 'readonly', t=>{
        const a = t.objectStore('docs').getAll(), m = t.objectStore('meta').get('state');
        a.onsuccess = ()=>{ docs = a.result; }; m.onsuccess = ()=>{ meta = m.result || null; };
      });
      return {docs, meta};
    },
    async getImages(hashes){
      const out = new Map(); if(!hashes.length) return out;
      await IDB.tx(['images'], 'readonly', t=>{
        const st = t.objectStore('images');
        hashes.forEach(h=>{ const r = st.get(h); r.onsuccess = ()=>{ if(r.result != null) out.set(h, r.result); }; });
      });
      return out;
    },
    // grava tudo de uma vez (transação atômica): documentos, exclusões, imagens novas e o documento atual
    write(recs, gone, imgs, meta){
      return IDB.tx(['docs','images','meta'], 'readwrite', t=>{
        const d = t.objectStore('docs'), i = t.objectStore('images');
        recs.forEach(r=>d.put(r)); gone.forEach(id=>d.delete(id));
        imgs.forEach(([h, u])=>i.put(u, h));
        t.objectStore('meta').put(meta, 'state');
      });
    },
    // remove imagens que nenhum documento usa mais
    async gc(){
      let docs = [], keys = [];
      await IDB.tx(['docs','images'], 'readonly', t=>{
        const a = t.objectStore('docs').getAll(), k = t.objectStore('images').getAllKeys();
        a.onsuccess = ()=>{ docs = a.result; }; k.onsuccess = ()=>{ keys = k.result; };
      });
      const usadas = new Set();
      docs.forEach(d=>{ const m = (d.html || '').match(/verba-img:[0-9a-f]{16,64}/g); if(m) m.forEach(x=>usadas.add(x.slice(10))); });
      const lixo = keys.filter(k=>!usadas.has(k));
      if(!lixo.length) return;
      await IDB.tx(['images'], 'readwrite', t=>{ const st = t.objectStore('images'); lixo.forEach(k=>st.delete(k)); });
      lixo.forEach(k=>imgKnown.delete(k));
    }
  };

  // hash do conteúdo da imagem (SHA-256; reserva simples quando crypto.subtle não existe, ex.: file://)
  function hashSimples(str){
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for(let i = 0; i < str.length; i++){ const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hx = n=>(n >>> 0).toString(16).padStart(8, '0');
    return hx(h1) + hx(h2) + str.length.toString(16).padStart(8, '0');
  }
  async function hashImg(u){
    let h = hashCache.get(u); if(h) return h;
    if(window.crypto && crypto.subtle){
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(u));
      h = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2, '0')).join('');
    }else h = hashSimples(u);
    if(hashCache.size > 200) hashCache.clear();
    hashCache.set(u, h); return h;
  }
  const RE_IMG = /data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]+/gi;
  async function packHtml(html, novas){
    const achadas = html.match(RE_IMG); if(!achadas) return html;
    const mapa = new Map();
    for(const u of new Set(achadas)){ const h = await hashImg(u); mapa.set(u, h); if(!imgKnown.has(h)) novas.set(h, u); }
    return html.replace(RE_IMG, u=>'verba-img:' + mapa.get(u));
  }
  function unpackHtml(html, imgs){ return html.replace(/verba-img:([0-9a-f]{16,64})/g, (m, h)=>imgs.get(h) || m); }

  function setStatus(ok, msg){
    const f = ok ? fileText() : '', e = FH.get(store.current);
    savedEl.textContent = ok ? (f || MSG_OK) : (msg || 'Não foi possível salvar');
    savedEl.style.color = ok ? (f && e.dirty ? '#b26a00' : '') : '#c0392b';
    savedEl.title = f ? 'O documento também é guardado sozinho neste navegador' : '';
  }
  async function doFlush(){
    const ids = Array.from(dirty); dirty.clear();
    const gone = Array.from(known).filter(id=>!store.docs[id]);
    if(!ids.length && !gone.length && store.current === lastCurrent) return;
    const cur = store.current, recs = [], novas = new Map();
    try{
      for(const id of ids){
        const d = store.docs[id]; if(!d) continue;
        const {html, ...resto} = d;
        const rec = JSON.parse(JSON.stringify(resto)); rec.id = id;
        rec.html = await packHtml(html || '', novas);
        if(rec.hf && rec.hf.imgs) for(const it of rec.hf.imgs) it.src = await packHtml(it.src || '', novas);
        recs.push(rec);
      }
      await IDB.write(recs, gone, Array.from(novas), {current: cur});
      recs.forEach(r=>known.add(r.id)); gone.forEach(id=>known.delete(id));
      novas.forEach((u, h)=>imgKnown.add(h)); lastCurrent = cur;
      setStatus(true);
      if(gone.length) queue = queue.then(()=>IDB.gc()).catch(()=>{});
    }catch(e){
      ids.forEach(id=>dirty.add(id));
      const cheio = e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e.message)));
      setStatus(false, cheio ? 'Armazenamento do navegador cheio — exporte o documento!' : 'Não foi possível salvar — exporte uma cópia (.doc)');
      if(!avisou){ avisou = true; alert(cheio
        ? 'O armazenamento do navegador está cheio e as últimas alterações NÃO foram salvas.\n\nExporte o documento (.doc/.docx) agora para não perder nada e libere espaço excluindo documentos ou imagens grandes.'
        : 'Não foi possível salvar as últimas alterações neste navegador.\n\nExporte o documento (.doc/.docx) para guardar uma cópia e tente de novo.'); }
    }
  }
  function enqueue(){ queue = queue.then(doFlush).catch(()=>{}); return queue; }

  function persist(){
    if(!useIDB){ try{ localStorage.setItem(LS_KEYS.docs, JSON.stringify(store)); return true; }catch(e){ return false; } }
    if(store.current && store.docs[store.current]) dirty.add(store.current);
    Object.keys(store.docs).forEach(id=>{ if(!known.has(id)) dirty.add(id); });
    clearTimeout(flushTimer); flushTimer = setTimeout(enqueue, 60);
    return true;
  }
  // salva já e devolve uma promessa que termina quando tudo foi gravado (usada antes de recarregar a página)
  function flushNow(){
    try{ save(); }catch(e){}
    if(!useIDB) return Promise.resolve();
    clearTimeout(flushTimer); return enqueue();
  }
  function save(){
    const d = store.docs[store.current]; if(!d) return;
    d.title = title.value; d.html = page.innerHTML; d.t = Date.now();
    const ok = persist();
    if(!useIDB) setStatus(ok, 'Não foi possível salvar (armazenamento cheio?)');
  }

  function novoStoreLegado(){
    // dados antigos: LS_KEYS.docs (vários documentos) ou LS_KEYS.doc (versão com um só documento)
    try{
      const d = JSON.parse(localStorage.getItem(LS_KEYS.docs) || 'null');
      if(d && d.docs){ store = d; return true; }
      const o = JSON.parse(localStorage.getItem(LS_KEYS.doc) || 'null'), id = uid();
      store = {current:id, docs:{[id]:{title:o ? o.title : 'Documento sem título', html:o ? o.html : '', t:Date.now()}}};
      return !!o;
    }catch(e){ return false; }
  }
  // Apaga os dados do Verbus neste navegador. soDocs = só documentos/modelos/estilos (mantém tema, zoom etc.)
  async function limparTudoDados(soDocs){
    window.__vLimpando = true; clearTimeout(flushTimer);
    try{ if(IDB.db){ IDB.db.close(); IDB.db = null; } }catch(e){}
    await new Promise(res=>{ try{ const r = indexedDB.deleteDatabase(IDB_DOCS); r.onsuccess = r.onerror = r.onblocked = ()=>res(); }catch(e){ res(); } });
    try{
      const ks = []; for(let i = 0; i < localStorage.length; i++) ks.push(localStorage.key(i));
      ks.forEach(k=>{
        if(k === LS_KEYS.limpasessao) return;
        if(soDocs ? LS_KEYS_DOCS.includes(k) : (/^verbus:/.test(k) || LS_LEGADO.test(k))) localStorage.removeItem(k);
      });
    }catch(e){}
  }
  window.__limparVerbus = limparTudoDados;
  async function load(){
    // 0) opção "apagar ao fechar": numa sessão nova (aba fechada e aberta de novo), apaga o que sobrou da anterior
    try{
      if(localStorage.getItem(LS_KEYS.limpasessao) === '1' && !sessionStorage.getItem(LS_KEYS.sessao)){ await limparTudoDados(true); window.__vLimpando = false; }
      sessionStorage.setItem(LS_KEYS.sessao, '1');
    }catch(e){}
    // 1) tenta abrir o IndexedDB
    try{ await IDB.open(); useIDB = true; }catch(e){ useIDB = false; }
    let veioDoIDB = false;
    if(useIDB){
      try{
        const {docs, meta} = await IDB.readAll();
        if(docs.length){
          const hashes = new Set();
          docs.forEach(d=>{ const m = ((d.html || '') + ' ' + ((d.hf && d.hf.imgs) || []).map(i=>i.src).join(' ')).match(/verba-img:[0-9a-f]{16,64}/g); if(m) m.forEach(x=>hashes.add(x.slice(10))); });
          const imgs = await IDB.getImages(Array.from(hashes));
          imgs.forEach((u, h)=>{ imgKnown.add(h); });
          store = {current: meta && meta.current, docs:{}};
          docs.forEach(r=>{ const id = r.id; delete r.id; r.html = unpackHtml(r.html || '', imgs); if(r.hf && r.hf.imgs) r.hf.imgs.forEach(it=>{ it.src = unpackHtml(it.src || '', imgs); }); store.docs[id] = r; known.add(id); });
          if(!store.docs[store.current]) store.current = Object.keys(store.docs).find(i=>!store.docs[i].modelo) || Object.keys(store.docs)[0];
          lastCurrent = store.current; veioDoIDB = true;
        }
      }catch(e){ useIDB = false; }
    }
    // 2) primeira vez com IndexedDB: importa o que já estava no localStorage (o original NÃO é apagado)
    if(!veioDoIDB) novoStoreLegado();
    if(!store.docs[store.current]){ const id = uid(); store.docs[id] = {title:'Documento sem título', html:'', t:Date.now()}; store.current = id; }
    const d = store.docs[store.current];
    title.value = d.title || 'Documento sem título'; page.innerHTML = d.html || '';
    try{ setAbnt(!d.free); }catch(e){}   // formato (ABNT ou livre) guardado no documento
    applyMar(); renderSide();
    if(useIDB){
      persist(); await enqueue();                     // grava a migração (e o documento em branco, se for o caso)
      queue = queue.then(()=>IDB.gc()).catch(()=>{});
      try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}   // pede ao navegador para não apagar os dados sozinho
    }
  }
  // salva ao esconder/fechar a aba
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') flushNow(); });
  window.addEventListener('pagehide', ()=>{ flushNow(); });
