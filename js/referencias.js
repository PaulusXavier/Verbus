/* Verbus — Guia Referências: índice, legendas, referência cruzada e índice remissivo
   (js/referencias.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   Reconstruído a partir da v66 (index.html monolítico), com as chaves de armazenamento portadas para LS_KEYS. */
  // ---------- Referências (estilo Word): Índice, Pesquisar, Legendas, Referência Cruzada e Índice Remissivo ----------
  (function(){
    const PLUR = {'Figura':'FIGURAS', 'Tabela':'TABELAS', 'Quadro':'QUADROS', 'Gráfico':'GRÁFICOS', 'Equação':'EQUAÇÕES'}, LABELS = Object.keys(PLUR);
    const capRe = /^(\S+)\s+(\d+)\s*[–-]\s*([\s\S]*)$/;
    const uid = ()=>Math.random().toString(36).slice(2, 9);
    const caps = t=>[...page.querySelectorAll('p.leg')].filter(p=>!t || (p.dataset.t || 'Figura') === t);
    const capT = p=>p.dataset.t || 'Figura';
    const num = (p, n)=>{ const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), t = w.nextNode(); if(t) t.nodeValue = t.nodeValue.replace(/^(\s*\S+\s+)\d+/, '$1' + n); };
    const later = fn=>{ setTimeout(fn, 350); setTimeout(fn, 1000); };
    const same = (a, h)=>{ const t = document.createElement('div'); t.innerHTML = h; return !!t.firstChild && a.isEqualNode(t.firstChild); };
    const hasSel = ()=>{ const s = getSelection(); return s.rangeCount && !s.isCollapsed && page.contains(s.anchorNode) && page.contains(s.focusNode); };

    // menu simples ligado a um botão
    function menu(btn, build){
      let pop = null;
      function close(){ if(pop){ pop.remove(); pop = null; } btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); }
      function outside(e){ if(pop && !pop.contains(e.target) && !btn.contains(e.target)) close(); }
      function esc(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
      btn.addEventListener('mousedown', e=>e.preventDefault());
      btn.addEventListener('click', ()=>{
        if(pop){ close(); return; }
        pop = document.createElement('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
        build().forEach(it=>{
          if(it === '-'){ pop.appendChild(document.createElement('hr')); return; }
          if(it.hd){ const h = document.createElement('div'); h.className = 'mh'; h.textContent = it.hd; pop.appendChild(h); return; }
          const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = it.t; if(it.h) b.title = it.h;
          b.addEventListener('click', ()=>{ close(); it.f(); }); pop.appendChild(b);
        });
        pop.addEventListener('mousedown', e=>e.preventDefault());
        document.body.appendChild(pop);
        const r = btn.getBoundingClientRect();
        pop.style.left = Math.max(4, Math.min(r.left, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.max(4, Math.min(r.bottom + 2, innerHeight - pop.offsetHeight - 4)) + 'px';
        btn.setAttribute('aria-expanded', 'true');
        document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
      });
    }
    const fire = (id, v)=>{ const sl = $(id); sl.value = v; sl.dispatchEvent(new Event('change', {bubbles:true})); };

    // ---- Índice (sumário) ----
    menu($('btnToc'), ()=>[
      {t:'Sumário Automático', h:'Insere o sumário com os Títulos 1, 2 e 3 e a página de cada um (ou atualiza o que já existe)', f:()=>sumario()},
      ...(page.querySelector(TOCQ) ? [{t:'Remover Sumário', f:()=>{ const o = page.querySelector(TOCQ); if(o){ const b4 = tSnap(); o.remove(); tCommit(b4); changed(); } }}] : []),
      '-', {t:'Numerar Títulos', h:'Numera os títulos: 1, 1.1, 1.1.1', f:()=>$('btnNum').click()},
      '-', {hd:'Elementos ABNT'},
      {t:'Capa', f:()=>fire('abntIns', 'capa')}, {t:'Folha de rosto', f:()=>fire('abntIns', 'rosto')}, {t:'Resumo', f:()=>fire('abntIns', 'resumo')}]);
    const lvl = v=>()=>{ restore(); blockChange(v); };
    menu($('btnTocAdd'), ()=>[
      {t:'Não Mostrar no Índice', h:'Volta o parágrafo para texto normal', f:lvl('p')},
      {t:'Nível 1', f:lvl('h1')}, {t:'Nível 2', f:lvl('h2')}, {t:'Nível 3', f:lvl('h3')},
      '-', {t:'Título sem número', h:'Título 1 centralizado, sem numeração (ex.: RESUMO, REFERÊNCIAS)', f:lvl('h1sn')},
      {t:'Citação longa (ABNT)', f:lvl('blockquote')}]);
    $('btnTocUpd').addEventListener('click', ()=>{ if(page.querySelector(TOCQ)) sumario(); });

    // ---- Pesquisar ----
    $('btnLookup').addEventListener('mousedown', e=>e.preventDefault());
    $('btnLookup').addEventListener('click', ()=>{
      let q = hasSel() ? getSelection().toString().trim() : '';
      if(!q) q = (prompt('O que você quer procurar na web?', '') || '').trim();
      if(q) window.open('https://www.google.com/search?q=' + encodeURIComponent(q.slice(0, 200)), '_blank', 'noopener');
    });

    // ---- Legendas ----
    function renumber(){
      const cnt = {}; let ch = false;
      caps().forEach(p=>{
        const t = capT(p); cnt[t] = (cnt[t] || 0) + 1;
        const m = capRe.exec(p.textContent.trim()); if(m && +m[2] !== cnt[t]){ num(p, cnt[t]); ch = true; }
        if(!p.dataset.cid){ p.dataset.cid = uid(); ch = true; }
      });
      return ch;
    }
    const capLabel = p=>{ const m = capRe.exec(p.textContent.trim()); return m ? m[1] + ' ' + m[2] : p.textContent.trim(); };
    const capTitle = p=>{ const m = capRe.exec(p.textContent.trim()); return m ? m[3].trim() : p.textContent.trim(); };
    const nextN = t=>caps(t).length + 1;
    function capPrev(){ $('capPrev').textContent = 'Será inserida: ' + $('capLab').value + ' ' + nextN($('capLab').value) + ' – ' + ($('capTxt').value.trim() || 'Título'); }
    $('btnCap').addEventListener('mousedown', e=>e.preventDefault());
    $('btnCap').addEventListener('click', ()=>{
      $('capTxt').value = ''; capPrev(); $('capDlg').showModal(); $('capTxt').focus();
    });
    $('capLab').addEventListener('change', capPrev); $('capTxt').addEventListener('input', capPrev);
    $('capCancel').addEventListener('click', ()=>$('capDlg').close());
    $('capDlg').addEventListener('keydown', e=>{ if(e.key === 'Enter' && e.target.id === 'capTxt'){ e.preventDefault(); $('capOk').click(); } });
    $('capOk').addEventListener('click', ()=>{
      const t = $('capLab').value, tx = $('capTxt').value.trim() || 'Título';
      $('capDlg').close();
      putBlock('<p class="leg" data-t="' + t + '" data-cid="' + uid() + '">' + t + ' ' + nextN(t) + ' – ' + esc(tx) + '</p>' +
        ($('capBlank').checked ? '<p style="text-indent:0;text-align:center"><br></p>' : '') +
        ($('capSrc').checked ? '<p class="fonte">Fonte: autoria própria (' + new Date().getFullYear() + ').</p>' : ''));
      renumber(); later(refreshAll);
    });

    // listas de ilustrações
    const lstHtml = t=>{
      const rows = caps(t).map(p=>tocRow(capLabel(p) + ' – ' + capTitle(p), pageOfEl(p), 0, false)).join('');
      return '<div class="sum lst" data-t="' + t + '"><h1 class="sn">LISTA DE ' + PLUR[t] + '</h1>' + rows + '</div>';
    };
    menu($('btnTof'), ()=>{
      const it = LABELS.filter(t=>caps(t).length).map(t=>({t:'Lista de ' + PLUR[t].toLowerCase() + ' (' + caps(t).length + ')', h:'Insere (ou atualiza) a lista com as legendas “' + t + '”', f:()=>putList(t)}));
      return it.length ? it : [{t:'Nenhuma legenda no documento', h:'Use Inserir Legenda primeiro', f:()=>{}}];
    });
    function putList(t){
      renumber();
      const old = [...page.querySelectorAll('.sum.lst')].find(x=>x.dataset.t === t), h = lstHtml(t);
      if(old) swapEl(old, h); else putBlock(h + PB);
      later(refreshAll);
    }
    $('btnLstUpd').addEventListener('click', ()=>{ renumber(); refreshAll(); });

    // ---- Referência Cruzada: abre a janela da guia Inserir (que também lista as legendas) ----
    $('btnXrefR').addEventListener('mousedown', e=>e.preventDefault());
    $('btnXrefR').addEventListener('click', ()=>{ renumber(); $('btnXref').click(); });

    // ---- Índice Remissivo ----
    const norm = x=>x.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    function idxHtml(){
      const M = new Map();
      page.querySelectorAll('span.xe').forEach(x=>{
        const e = (x.dataset.e || '').trim(); if(!e) return;
        const s = (x.dataset.s || '').trim(), pg = pageOfEl(x);
        if(!M.has(e)) M.set(e, {p:new Set(), s:new Map()});
        const o = M.get(e);
        if(s){ if(!o.s.has(s)) o.s.set(s, new Set()); o.s.get(s).add(pg); } else o.p.add(pg);
      });
      const pg = set=>[...set].sort((a, b)=>a - b).join(', '), col = (a, b)=>a.localeCompare(b, 'pt-BR');
      let out = '', letter = '';
      [...M.keys()].sort(col).forEach(e=>{
        const L = norm(e).charAt(0) || '#'; if(L !== letter){ letter = L; out += '<p class="il"><b>' + esc(L) + '</b></p>'; }
        const o = M.get(e); out += '<p class="ie">' + esc(e) + (o.p.size ? ', ' + pg(o.p) : '') + '</p>';
        [...o.s.keys()].sort(col).forEach(s=>{ out += '<p class="ie" style="margin-left:.6cm">' + esc(s) + ', ' + pg(o.s.get(s)) + '</p>'; });
      });
      return '<div class="sum idx"><h1 class="sn">ÍNDICE</h1>' + out + '</div>';
    }
    $('btnIdx').addEventListener('mousedown', e=>e.preventDefault());
    $('btnIdx').addEventListener('click', ()=>{
      if(!page.querySelector('span.xe')){ alert('Nenhuma entrada marcada. Selecione um termo no texto e use Marcar Entrada.'); return; }
      const old = page.querySelector('.sum.idx'), h = idxHtml();
      if(old) swapEl(old, h); else putBlock(h);
      later(refreshAll);
    });
    $('btnIdxUpd').addEventListener('click', ()=>refreshAll());
    let mkR = null, mkEl = null;
    $('btnMark').addEventListener('mousedown', e=>e.preventDefault());
    $('btnMark').addEventListener('click', ()=>{
      const s = getSelection(); if(!s.rangeCount || !page.contains(s.anchorNode)){ alert('Selecione, no texto, a palavra ou a expressão que vai para o índice.'); return; }
      const r = s.getRangeAt(0).cloneRange(), n = r.commonAncestorContainer, host = (n.nodeType === 1 ? n : n.parentElement).closest('span.xe');
      if(r.collapsed && !host){ alert('Selecione, no texto, a palavra ou a expressão que vai para o índice.'); return; }
      mkR = r; mkEl = host && page.contains(host) ? host : null;
      $('mkE').value = mkEl ? mkEl.dataset.e || '' : r.toString().replace(/\s+/g, ' ').trim(); $('mkS').value = mkEl ? mkEl.dataset.s || '' : '';
      $('mkRm').hidden = !mkEl; $('mkOk').textContent = mkEl ? 'Salvar' : 'Marcar'; $('mkShow').checked = document.body.classList.contains('showxe');
      $('mkDlg').showModal(); $('mkE').focus(); $('mkE').select();
    });
    $('mkCancel').addEventListener('click', ()=>$('mkDlg').close());
    $('mkShow').addEventListener('change', e=>document.body.classList.toggle('showxe', e.target.checked));
    $('mkRm').addEventListener('click', ()=>{
      if(mkEl && mkEl.parentNode){ const b4 = tSnap(); mkEl.replaceWith(...mkEl.childNodes); tCommit(b4); changed(); refreshAll(); }
      $('mkDlg').close();
    });
    $('mkOk').addEventListener('click', ()=>{
      const e = $('mkE').value.trim(), sb = $('mkS').value.trim(); if(!e){ $('mkE').focus(); return; }
      if(mkEl){ mkEl.dataset.e = e; if(sb) mkEl.dataset.s = sb; else delete mkEl.dataset.s; }
      else{
        const sp = document.createElement('span'); sp.className = 'xe'; sp.dataset.e = e; if(sb) sp.dataset.s = sb;
        const b4 = tSnap();
        try{ mkR.surroundContents(sp); tCommit(b4); }
        catch(err){ alert('Selecione um trecho dentro de um único parágrafo, sem abrir ou fechar formatações pela metade.'); return; }
      }
      $('mkDlg').close(); changed(); later(refreshAll);
    });

    // ---- atualização geral (páginas, numeração, referências) ----
    function refreshAll(){
      let ch = renumber();
      const t = page.querySelector(TOCQ); if(t){ const h = tocHtml(); if(!same(t, h)){ t.outerHTML = h; ch = true; } }
      page.querySelectorAll('.sum.lst').forEach(l=>{ const h = lstHtml(l.dataset.t || 'Figura'); if(!same(l, h)){ l.outerHTML = h; ch = true; } });
      const ix = page.querySelector('.sum.idx'); if(ix){ const h = idxHtml(); if(!same(ix, h)){ ix.outerHTML = h; ch = true; } }
      if(ch) changed();
      sync();
    }
    window.__refsLater = ()=>later(refreshAll);
    // botões "Atualizar" ficam acinzentados quando o documento não tem o índice correspondente
    let tm = 0;
    function sync(){
      $('btnTocUpd').disabled = !page.querySelector(TOCQ);
      $('btnLstUpd').disabled = !page.querySelector('.sum.lst');
      $('btnIdxUpd').disabled = !page.querySelector('.sum.idx');
    }
    new MutationObserver(()=>{ clearTimeout(tm); tm = setTimeout(sync, 150); }).observe(page, {childList:true, subtree:true});
    sync();
  })();
