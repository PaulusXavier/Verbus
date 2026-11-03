/* Verbus — Salvar/Salvar como e armazenamento de arquivos
   (js/salvar.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ================= Mais funções =================
  function loadScript(src){
    return new Promise((ok, no)=>{ const t = document.createElement('script'); t.src = src; t.onload = ok; t.onerror = no; document.head.appendChild(t); });
  }

  // Tamanho da fonte em pontos
  $('size').addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); e.target.dispatchEvent(new Event('change')); page.focus(); } });
  $('size').addEventListener('change', e=>{
    const pt = String(e.target.value).replace(',', '.').replace(/\s*pt$/i, '').trim();
    const n = parseFloat(pt);
    if(!(n >= 1 && n <= 1638) || !/^\d+(\.\d+)?$/.test(pt)){ syncSize(); return; }
    restore(); if(typingSet({fs:n})) return; exec('fontSize', 7);
    page.querySelectorAll('font[size="7"]').forEach(f=>{
      const sp = fontToSpan(f); sp.style.fontSize = pt + 'pt';
    });
    changed();
  });

  // Baixar .docx de verdade (html-docx-js) + cabeçalho/rodapé e página A4 (JSZip)
  async function docxComCabecalho(blob, ab){
    if(!window.JSZip || !window.JSZip.loadAsync) await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    const zip = await window.JSZip.loadAsync(await blob.arrayBuffer());
    const hh = hfData(), hasH = hfHas('h'), hasF = hfHas('f'), imgsL = hfImgList(), any = hasH || hasF || imgsL.length > 0;
    const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
    const xe = t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const rprOf = (k, s0)=>{ const sy = hfResolve(k, s0), z = Math.round(sy.fs * 2); return '<w:rPr><w:rFonts w:ascii="' + sy.ff + '" w:hAnsi="' + sy.ff + '" w:cs="' + sy.ff + '"/>' + (sy.b ? '<w:b/>' : '') + (sy.i ? '<w:i/>' : '') + (sy.c ? '<w:color w:val="' + sy.c.slice(1).toUpperCase() + '"/>' : '') + '<w:sz w:val="' + z + '"/><w:szCs w:val="' + z + '"/>' + (sy.u ? '<w:u w:val="single"/>' : '') + '</w:rPr>'; };
    const imgRuns = [], imgRels = [], imgTypes = new Set();
    for(let i = 0; i < imgsL.length; i++){
      const b = await imgBytes(imgsL[i].src), nm = 'verba_img' + i + '.' + b.ext;
      zip.file('word/media/' + nm, b.data); imgTypes.add(b.ext);
      imgRels.push('<Relationship Id="rIdVerbaImg' + i + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + nm + '"/>');
      imgRuns.push(anchorXml(imgsL[i], 'rIdVerbaImg' + i, i));
    }
    function part(k, root){
      const lines = [k === 'h' ? [imgRuns.join('')] : []];
      if(!lines[0].length) lines[0] = [];
      hfRuns(hh[k]).forEach(t=>{
        if(t.br){ lines.push([]); return; }
        const rpr = rprOf(k, t.s);
        if(t.f) lines[lines.length - 1].push('<w:fldSimple w:instr=" ' + (t.f === 'pages' ? 'NUMPAGES' : 'PAGE') + ' "><w:r>' + rpr + '<w:t>1</w:t></w:r></w:fldSimple>');
        else if(t.t) lines[lines.length - 1].push('<w:r>' + rpr + '<w:t xml:space="preserve">' + xe(t.t) + '</w:t></w:r>');
      });
      const jc = hh[k + 'a'] === 'center' ? 'center' : hh[k + 'a'] === 'right' ? 'right' : 'left';
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:' + root + ' ' + NS + '>' +
        lines.map(l=>'<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="' + jc + '"/></w:pPr>' + l.join('') + '</w:p>').join('') + '</w:' + root + '>';
    }
    let doc = await zip.file('word/document.xml').async('string');
    const pgx = pgOf(), tw = cm=>Math.round(cm * 566.93);
    doc = doc.replace(/<w:pgSz[^>]*\/>/, '<w:pgSz w:w="' + tw(pgx.w) + '" w:h="' + tw(pgx.h) + '" w:orient="' + (pgx.land ? 'landscape' : 'portrait') + '" />');
    doc = doc.replace(/<w:cols[^>]*\/>/, '');
    if(pgx.cols > 1){ const cl = '<w:cols w:num="' + pgx.cols + '" w:space="709" />'; doc = /<w:pgMar[^>]*\/>/.test(doc) ? doc.replace(/(<w:pgMar[^>]*\/>)/, '$1' + cl) : doc.replace('</w:sectPr>', cl + '</w:sectPr>'); }
    if(any){
      doc = doc.replace(/<w:sectPr(\s[^>]*)?>/, m=>m + '<w:headerReference w:type="default" r:id="rIdVerbaH"/><w:footerReference w:type="default" r:id="rIdVerbaF"/>');
      if(hh.dif) doc = doc.replace('</w:sectPr>', '<w:titlePg/></w:sectPr>');
      zip.file('word/header1.xml', part('h', 'hdr')); zip.file('word/footer1.xml', part('f', 'ftr'));
      if(imgRels.length) zip.file('word/_rels/header1.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + imgRels.join('') + '</Relationships>');
      let rels = await zip.file('word/_rels/document.xml.rels').async('string');
      rels = rels.replace('</Relationships>', '<Relationship Id="rIdVerbaH" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdVerbaF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>');
      zip.file('word/_rels/document.xml.rels', rels);
      let ct = await zip.file('[Content_Types].xml').async('string');
      imgTypes.forEach(x=>{ if(!new RegExp('Extension="' + x + '"', 'i').test(ct)) ct = ct.replace(/(<Types[^>]*>)/, '$1<Default Extension="' + x + '" ContentType="image/' + x + '"/>'); });
      ct = ct.replace('</Types>', '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>');
      zip.file('[Content_Types].xml', ct);
    }
    zip.file('word/document.xml', doc);
    return zip.generateAsync({type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  async function makeDocx(){
    if(!window.htmlDocx) await loadScript('https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.js');
    const ab = page.classList.contains('abnt'), m = effMar();
    let out = window.htmlDocx.asBlob(wrap(), {margins:{top:Math.round(m.t*15), right:Math.round(m.r*15), bottom:Math.round(m.b*15), left:Math.round(m.l*15)}});
    try{ out = await docxComCabecalho(out, ab); }catch(e){ if(hfHas('h') || hfHas('f')) alert('O .docx foi gerado sem o cabeçalho/rodapé (não foi possível carregar a biblioteca). Use o botão .doc ou verifique a internet.'); }
    return out;
  }
  // botão ".docx" da barra antiga: só baixa uma cópia
  $('btnDocx').addEventListener('click', async ()=>{
    try{ download(await makeDocx(), fileName('.docx'), DOCX_MIME); }
    catch(err){ alert('Não foi possível gerar o .docx. Verifique a conexão com a internet ou use o botão .doc.'); }
  });

  // ---------- Salvar e Salvar como, como no Word ----------
  // Chrome/Edge: a primeira vez abre a janela "Salvar como" do computador (pasta, nome, tipo); depois, Ctrl+S grava direto no mesmo arquivo.
  // Outros navegadores (Firefox, Safari, celular) não deixam um site gravar em arquivo: aí o Salvar baixa uma cópia.
  const FTYPES = {
    docx:{ext:'.docx', mime:DOCX_MIME, desc:'Documento do Word (*.docx)'},
    doc:{ext:'.doc', mime:'application/msword', desc:'Documento do Word 97-2003 (*.doc)'},
    html:{ext:'.html', mime:'text/html', desc:'Página da Web (*.html)'},
    txt:{ext:'.txt', mime:'text/plain', desc:'Texto simples (*.txt)'}
  };
  const FS_SAVE = ()=>!!(window.showSaveFilePicker && window.isSecureContext && window.top === window);
  const kindOf = n=>{ const m = /\.([a-z0-9]+)$/i.exec(n || ''), k = m ? m[1].toLowerCase() : ''; return k === 'htm' ? 'html' : (FTYPES[k] ? k : 'docx'); };
  const baseName = n=>String(n || '').replace(/\.(docx|doc|html?|txt)$/i, '');
  window.__fileFS = FS_SAVE;
  async function makeFile(kind){
    if(kind === 'docx') return await makeDocx();
    if(kind === 'doc') return new Blob(['\ufeff' + wrap(true)], {type:'application/msword'});
    if(kind === 'html') return new Blob([wrap()], {type:'text/html'});
    return new Blob([page.innerText], {type:'text/plain'});
  }
  // as ligações documento -> arquivo sobrevivem ao recarregar a página (o navegador pede permissão de novo ao gravar)
  const FHDB = ()=>new Promise((res, rej)=>{ try{ const r = indexedDB.open(IDB_ARQUIVOS, 1); r.onupgradeneeded = ()=>r.result.createObjectStore('h'); r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error); }catch(e){ rej(e); } });
  async function fhPut(id){
    try{
      const e = FH.get(id), db = await FHDB(), st = db.transaction('h', 'readwrite').objectStore('h');
      if(e) st.put({handle:e.handle, name:e.name, t:e.t, dirty:e.dirty}, id); else st.delete(id);
    }catch(err){}
  }
  (async()=>{
    try{
      const db = await FHDB(), st = db.transaction('h').objectStore('h');
      const all = await new Promise(r=>{ const q = st.openCursor(), o = []; q.onsuccess = ()=>{ const c = q.result; if(c){ o.push([c.key, c.value]); c.continue(); } else r(o); }; q.onerror = ()=>r(o); });
      all.forEach(([k, v])=>{ if(v && v.handle && !FH.has(k)) FH.set(k, v); });
      if(all.length) setStatus(true);
    }catch(err){}
  })();
  function fileTouch(){
    const e = FH.get(store.current);
    if(e && !e.dirty){ e.dirty = true; fhPut(store.current); setStatus(true); }
  }
  async function writeTo(h, blob){
    if(h.requestPermission && (await h.requestPermission({mode:'readwrite'})) !== 'granted') throw new Error('o navegador não deixou gravar neste arquivo');
    const w = await h.createWritable();
    try{ await w.write(blob); await w.close(); }catch(err){ try{ await w.abort(); }catch(_){} throw err; }
  }
  // as = true: "Salvar como" (sempre pergunta). Devolve {cancel} | {how:'arquivo'|'baixado', name}
  async function fileSave(as, kind, name){
    const id = store.current, ent = FH.get(id);
    save();
    if(!as && ent){
      const blob = await makeFile(kindOf(ent.name));
      await writeTo(ent.handle, blob);
      ent.t = Date.now(); ent.dirty = false; fhPut(id); setStatus(true);
      return {how:'arquivo', name:ent.name};
    }
    const k0 = kind || (ent ? kindOf(ent.name) : 'docx'), T = FTYPES[k0];
    const base = baseName(name || (ent ? ent.name : fileName(''))).replace(/[\\/:*?"<>|]+/g, '-').replace(/[. ]+$/, '') || 'documento';
    // o arquivo é gerado ANTES de abrir a janela: se a geração falhar (ex.: sem internet para a biblioteca do .docx), não sobra arquivo vazio
    const blob0 = await makeFile(k0);
    if(!FS_SAVE()){
      download(blob0, base + T.ext, T.mime);
      return {how:'baixado', name:base + T.ext};
    }
    const types = [k0].concat(Object.keys(FTYPES).filter(x=>x !== k0)).map(k=>({description:FTYPES[k].desc, accept:{[FTYPES[k].mime]:[FTYPES[k].ext]}}));
    let h;
    try{ h = await window.showSaveFilePicker({id:'verbus', suggestedName:base + T.ext, types, excludeAcceptAllOption:true}); }
    catch(err){
      if(err && err.name === 'AbortError') return {cancel:true};
      if(err && err.name === 'SecurityError') throw new Error('o arquivo demorou para ficar pronto e o navegador fechou a janela de salvar; clique em Salvar de novo (agora vai direto)');
      if(err && err.name === 'TypeError'){ try{ h = await window.showSaveFilePicker({id:'verbus', suggestedName:'documento' + T.ext, types, excludeAcceptAllOption:true}); }catch(e2){ if(e2 && e2.name === 'AbortError') return {cancel:true}; throw e2; } }
      else throw err;
    }
    const kf = kindOf(h.name);
    await writeTo(h, kf === k0 ? blob0 : await makeFile(kf));
    FH.set(id, {handle:h, name:h.name, t:Date.now(), dirty:false}); fhPut(id);
    const tt = baseName(h.name);   // como no Word, o título do documento passa a ser o nome do arquivo
    if(tt && tt !== title.value){ title.value = tt; save(); if(!$('side').hidden) renderSide(); }
    setStatus(true);
    return {how:'arquivo', name:h.name};
  }
  // devolve a mensagem para mostrar ('' se a pessoa cancelou)
  async function fileDo(as, kind, name){
    try{
      const r = await fileSave(as, kind, name);
      if(r.cancel) return '';
      if(r.how === 'baixado'){
        savedEl.textContent = 'Baixado: ' + r.name; savedEl.style.color = '';
        return 'Arquivo baixado: ' + r.name + '. Este navegador não grava direto no arquivo (no Chrome ou no Edge do computador, sim).';
      }
      return 'Salvo em ' + r.name + ' às ' + hhmm() + '.';
    }catch(err){
      const m = 'Não foi possível salvar: ' + (err && err.message ? err.message : (err && err.type === 'error' ? 'não deu para carregar a biblioteca do .docx (verifique a internet ou salve como .doc)' : String(err)));
      setStatus(false, m); return m;
    }
  }
  window.__fileDo = fileDo;

  // Painel: documentos e estrutura
  function openDoc(id){
    if(window.__hfClose) window.__hfClose();
    if(id !== store.current && store.docs[store.current]) save();
    store.current = id; const d = store.docs[id];
    title.value = d.title || 'Documento sem título'; page.innerHTML = d.html || '';
    if(page.classList.contains('abnt') === !!d.free) setAbnt(!d.free);   // todo documento é ABNT, salvo os marcados como livres (modelos prontos)
    applyMar(); persist(); updateCount(); renderSide();
    if(window.__tabsSoon) window.__tabsSoon();
  }
  function newDoc(free){
    save(); const id = uid();
    store.docs[id] = {title:'Documento sem título', html:'', t:Date.now()};
    if(free === true) store.docs[id].free = true;
    openDoc(id); page.focus();
  }
