/* Verbus — Réguas horizontal e vertical (recuos, tabulações, margens)
   (js/reguas.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   Reconstruído a partir da v66 (index.html monolítico), com as chaves de armazenamento portadas para LS_KEYS. */
  // ---------- Réguas (horizontal e vertical, estilo clássico) ----------
  (function(){
    const wrap = $('rulerWrap'), ruler = $('ruler'), svg = $('rsvg'), btn = $('btnRuler');
    const sheet = $('sheet'), vr = $('vruler'), vsvg = $('vsvg'), guide = $('rulerGuide');
    const mk = {first:ruler.querySelector('.rm-first'), left:ruler.querySelector('.rm-left'), both:ruler.querySelector('.rm-both'), right:ruler.querySelector('.rm-right')};
    const mg = {L:$('mgL'), R:$('mgR'), T:$('mgT'), B:$('mgB')};
    const CM = CMPX, Q = CM / 4, BLK = 'p,h1,h2,h3,h4,h5,h6,li,div,blockquote,pre';
    const MARGIN = '#c6c6c6', INK = '#404040', TICK = '#5a5a5a', RH = 12;   // cores e altura da faixa iguais às do Word
    let key = '', vkey = '', W = 0, H = 0, pad = {t:0, r:0, b:0, l:0}, s = 1, drag = null, tType = 'l', tdrag = null;

    function zoomNow(){ return parseFloat(sheet.style.zoom) || 1; }
    function blocks(){
      const sel = getSelection(); if(!sel.rangeCount || !page.contains(sel.anchorNode)) return [];
      const r = sel.getRangeAt(0);
      return [...page.querySelectorAll(BLK)].filter(b=>!b.querySelector(BLK) && r.intersectsNode(b));
    }
    const f1 = v=>Math.round(v * 10) / 10;

    // Régua horizontal (estilo clássico): faixa fina, margens cinza; número a cada 1 cm, traço a 0,5 e ponto a 0,25
    function drawH(){
      const k = W + '|' + pad.l + '|' + pad.r; if(k === key) return; key = k;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + RH);
      let h = '<rect width="' + W + '" height="' + RH + '" fill="#fff"/>' +
        '<rect width="' + pad.l + '" height="' + RH + '" fill="' + MARGIN + '"/>' +
        '<rect x="' + (W - pad.r) + '" width="' + pad.r + '" height="' + RH + '" fill="' + MARGIN + '"/>', d = '';
      const j0 = -Math.floor(pad.l / Q), j1 = Math.floor((W - pad.l) / Q), edge = W - pad.r;
      for(let j = j0; j <= j1; j++){
        const x = pad.l + j * Q; if(x > W - 1) continue;
        if(x < 1){   // como no Word, o número da ponta esquerda aparece inteiro (deslocado para dentro)
          if(j % 4 === 0 && j !== 0) h += '<text x="5" y="9.3" text-anchor="middle" font-size="9" fill="' + INK + '" font-family="Segoe UI,Arial,sans-serif">' + Math.abs(j / 4) + '</text>';
          continue;
        }
        const px = f1(x) + .5;
        if(j % 4 === 0){
          if(j !== 0 && Math.abs(x - edge) > 6) h += '<text x="' + f1(x) + '" y="9.3" text-anchor="middle" font-size="9" fill="' + INK + '" font-family="Segoe UI,Arial,sans-serif">' + Math.abs(j / 4) + '</text>';
        }
        else if(j % 2 === 0) d += 'M' + px + ' 3.5V8.5';
        else d += 'M' + px + ' 5.5V6.5';
      }
      h += '<path d="' + d + '" stroke="' + TICK + '" stroke-width="1" fill="none"/>';
      svg.innerHTML = h;
    }
    // Régua vertical: 0 na margem superior, cm para baixo (e para cima dentro da margem); números girados
    function drawV(){
      const ps = (typeof pgState !== 'undefined' && pgState && pgState.shifted && pgState.P > 0 && pgState.starts.length > 1) ? pgState : null;
      const k = H + '|' + pad.t + '|' + pad.b + '|' + (ps ? ps.P + 'x' + ps.starts.length : '1'); if(k === vkey) return; vkey = k;
      vsvg.setAttribute('viewBox', '0 0 12 ' + H);
      if(ps){   // várias páginas: a régua recomeça do 0 em cada folha, como no Word
        const PH = ps.H, n = ps.starts.length;
        let h = '<rect width="12" height="' + H + '" fill="' + MARGIN + '" fill-opacity=".0"/>', d = '';
        for(let q = 0; q < n; q++){
          const y0 = q * ps.P, bodyTop = y0 + pad.t, bodyBot = y0 + PH - pad.b;
          h += '<rect y="' + f1(y0) + '" width="12" height="' + PH + '" fill="#fff"/>' +
               '<rect y="' + f1(y0) + '" width="12" height="' + pad.t + '" fill="' + MARGIN + '"/>' +
               '<rect y="' + f1(bodyBot) + '" width="12" height="' + pad.b + '" fill="' + MARGIN + '"/>';
          for(let j = -Math.floor(pad.t / Q); bodyTop + j * Q < bodyBot; j++){
            const y = bodyTop + j * Q; if(y < y0 + 1) continue;
            if(j % 4 === 0){ if(j !== 0) h += '<text transform="translate(9.2 ' + f1(y) + ') rotate(-90)" text-anchor="middle" font-size="9" fill="' + INK + '" font-family="Segoe UI,Arial,sans-serif">' + Math.abs(j / 4) + '</text>'; }
            else d += (j % 2 === 0 ? 'M3.5 ' + (f1(y) + .5) + 'H8.5' : 'M5.5 ' + (f1(y) + .5) + 'H6.5');
          }
          for(let j = 1; bodyBot + j * Q < y0 + PH - 1; j++){
            const y = bodyBot + j * Q;
            if(j % 4 === 0) h += '<text transform="translate(9.2 ' + f1(y) + ') rotate(-90)" text-anchor="middle" font-size="9" fill="' + INK + '" font-family="Segoe UI,Arial,sans-serif">' + (j / 4) + '</text>';
            else d += (j % 2 === 0 ? 'M3.5 ' + (f1(y) + .5) + 'H8.5' : 'M5.5 ' + (f1(y) + .5) + 'H6.5');
          }
        }
        vsvg.innerHTML = h + '<path d="' + d + '" stroke="' + TICK + '" stroke-width="1" fill="none"/>';
        return;
      }
      const bodyEnd = H - pad.b;
      let h = '<rect width="12" height="' + H + '" fill="#fff"/>' +
        '<rect width="12" height="' + pad.t + '" fill="' + MARGIN + '"/>' +
        '<rect y="' + bodyEnd + '" width="12" height="' + pad.b + '" fill="' + MARGIN + '"/>', d = '';
      const lab = (y, n)=>'<text transform="translate(9.2 ' + f1(y) + ') rotate(-90)" text-anchor="middle" font-size="9" fill="' + INK + '" font-family="Segoe UI,Arial,sans-serif">' + n + '</text>';
      const tick = (y, j)=>{
        const py = f1(y) + .5;
        d += j % 2 === 0 ? 'M3.5 ' + py + 'H8.5' : 'M5.5 ' + py + 'H6.5';
      };
      if(H < 60000){
        for(let j = -Math.floor(pad.t / Q); j * Q + pad.t < bodyEnd; j++){
          const y = pad.t + j * Q; if(y < 1) continue;
          if(j % 4 === 0){ if(j !== 0) h += lab(y, Math.abs(j / 4)); } else tick(y, j);
        }
        for(let j = 1; bodyEnd + j * Q < H - 1; j++){
          const y = bodyEnd + j * Q;
          if(j % 4 === 0) h += lab(y, j / 4); else tick(y, j);
        }
      }
      h += '<path d="' + d + '" stroke="' + TICK + '" stroke-width="1" fill="none"/>';
      vsvg.innerHTML = h;
    }
    function state(){
      const bs = blocks(), b = bs[0], pr = page.getBoundingClientRect();
      if(b){
        const br = b.getBoundingClientRect(), cs = getComputedStyle(b);
        const l = (br.left - pr.left) / s, r = (pr.right - br.right) / s, ti = parseFloat(cs.textIndent) || 0;
        return {b, bs, l, f:l + ti, r:W - r};
      }
      return {b:null, bs:[], l:pad.l, f:pad.l, r:W - pad.r};
    }
    function place(){
      const st = state();
      mk.first.style.left = st.f + 'px'; mk.left.style.left = st.l + 'px'; mk.both.style.left = st.l + 'px'; mk.right.style.left = st.r + 'px';
      mg.L.style.left = pad.l + 'px'; mg.R.style.left = (W - pad.r) + 'px';
      mg.T.style.top = pad.t + 'px'; mg.B.style.top = (H - pad.b) + 'px';
      if(!tdrag) renderTabs();
    }
    function update(){
      if(wrap.hidden) return;
      applyMar();
      const pr = page.getBoundingClientRect(), cs = getComputedStyle(page);
      W = page.offsetWidth; H = page.offsetHeight; s = W ? pr.width / W : 1;
      pad = {t:parseFloat(cs.paddingTop) || 0, r:parseFloat(cs.paddingRight) || 0, b:parseFloat(cs.paddingBottom) || 0, l:parseFloat(cs.paddingLeft) || 0};
      ruler.style.width = W + 'px'; ruler.style.zoom = zoomNow();
      drawH(); drawV();
      if(!drag || drag.m) place();
    }

    const xOf = e=>{ const r = ruler.getBoundingClientRect(); return (e.clientX - r.left) / s; };
    const yOf = e=>{ const r = vr.getBoundingClientRect(); return (e.clientY - r.top) / s; };
    const snap = (x, free)=>free ? x : pad.l + Math.round((x - pad.l) / Q) * Q;
    const snapM = (v, free)=>free ? v : Math.round(v / (CM / 10)) * (CM / 10);

    // --- marcadores de recuo ---
    ruler.addEventListener('pointerdown', e=>{
      const m = e.target.closest('.rm'), g = e.target.closest('.mg');
      if(g){ e.preventDefault(); drag = {m:g.dataset.m, st:{...pad}}; g.setPointerCapture(e.pointerId); return; }
      if(!m) return;
      e.preventDefault();
      let bs = blocks();
      if(!bs.length){ page.focus(); document.execCommand('formatBlock', false, 'p'); bs = blocks(); }
      if(!bs.length) return;
      const st = state();
      drag = {k:m.dataset.k, x0:xOf(e), st, items:bs.map(b=>{ const cs = getComputedStyle(b);
        return {b, ml:parseFloat(cs.marginLeft) || 0, mr:parseFloat(cs.marginRight) || 0, ti:parseFloat(cs.textIndent) || 0}; })};
      m.classList.add('drag'); m.setPointerCapture(e.pointerId);
      guide.style.display = 'block'; guide.style.left = (drag.k === 'first' ? st.f : drag.k === 'right' ? st.r : st.l) + 'px';
    });
    ruler.addEventListener('pointermove', e=>{
      if(!drag) return;
      const d = drag, free = e.altKey;
      if(d.m){   // margem esquerda/direita
        const x = xOf(e);
        if(d.m === 'L') setMar('l', Math.max(0, Math.min(W - pad.r - 3 * CM, snapM(x, free))));
        else setMar('r', Math.max(0, Math.min(W - pad.l - 3 * CM, snapM(W - x, free))));
        update(); return;
      }
      const st = d.st;
      const start = d.k === 'first' ? st.f : d.k === 'right' ? st.r : st.l;
      let x = snap(start + (xOf(e) - d.x0), free);
      x = d.k === 'right' ? Math.min(W, Math.max(st.l + 10, x)) : Math.min(st.r - 10, Math.max(0, x));
      const dx = x - start;
      d.items.forEach(o=>{
        if(d.k === 'first'){ o.b.style.textIndent = (o.ti + dx) + 'px'; }
        else if(d.k === 'left'){ o.b.style.marginLeft = (o.ml + dx) + 'px'; o.b.style.textIndent = (o.ti - dx) + 'px'; }
        else if(d.k === 'both'){ o.b.style.marginLeft = (o.ml + dx) + 'px'; }
        else{ o.b.style.marginRight = (o.mr - dx) + 'px'; }
      });
      if(d.k === 'first') mk.first.style.left = x + 'px';
      else if(d.k === 'right') mk.right.style.left = x + 'px';
      else{
        mk.left.style.left = x + 'px'; mk.both.style.left = x + 'px';
        mk.first.style.left = (d.k === 'both' ? st.f + dx : st.f) + 'px';
      }
      guide.style.left = x + 'px';
    });
    function end(){
      if(!drag) return;
      const wasMargin = !!drag.m; drag = null;
      ruler.querySelectorAll('.rm.drag').forEach(n=>n.classList.remove('drag')); guide.style.display = 'none';
      if(wasMargin) persist(); else save();
      update();
    }
    ruler.addEventListener('pointerup', end); ruler.addEventListener('pointercancel', end);
    ruler.addEventListener('dblclick', e=>{
      if(e.target.closest('.rm')){
        blocks().forEach(b=>{ b.style.marginLeft = b.style.marginRight = b.style.textIndent = ''; if(!b.getAttribute('style')) b.removeAttribute('style'); });
        save(); update();
      }else{
        const g = e.target.closest('.mg'); if(g){ resetMar(g.dataset.m.toLowerCase()); update(); }
      }
    });

    // --- margens superior e inferior (régua vertical) ---
    vr.addEventListener('pointerdown', e=>{
      const g = e.target.closest('.mgv'); if(!g) return;
      e.preventDefault(); drag = {m:g.dataset.m, st:{...pad}}; g.setPointerCapture(e.pointerId);
    });
    vr.addEventListener('pointermove', e=>{
      if(!drag || !drag.m || (drag.m !== 'T' && drag.m !== 'B')) return;
      const y = yOf(e), free = e.altKey;
      if(drag.m === 'T') setMar('t', Math.max(0, Math.min(15 * CM, H - pad.b - 3 * CM, snapM(y, free))));
      else setMar('b', Math.max(0, Math.min(15 * CM, H - pad.t - 3 * CM, snapM(H - y, free))));
      update();
    });
    vr.addEventListener('pointerup', end); vr.addEventListener('pointercancel', end);
    vr.addEventListener('dblclick', e=>{
      const g = e.target.closest('.mgv'); if(g){ resetMar(g.dataset.m.toLowerCase()); update(); }
    });


    // --- tabulações personalizadas (paradas na régua) ---
    const TT = ['l','c','r','d'], TN = {l:'Esquerda', c:'Centralizada', r:'Direita', d:'Decimal'};
    const TSVG = {l:'<path d="M2 1V7.5H7.5"/>', c:'<path d="M4.5 1V7.5M1.5 7.5H7.5"/>', r:'<path d="M7 1V7.5H1.5"/>', d:'<path d="M3.2 1V7.5M.8 7.5H5.6"/><circle cx="7.4" cy="6.9" r=".7" fill="currentColor" stroke="none"/>'};
    const tsvg = t=>'<svg viewBox="0 0 9 9" aria-hidden="true">' + TSVG[t] + '</svg>';
    const defTab = ()=>((store.docs[store.current] || {}).tabdef || 1.25) * CM;
    const tabSel = document.createElement('button'); tabSel.type = 'button'; tabSel.id = 'tabSel'; wrap.appendChild(tabSel);
    function tabSelDraw(){ tabSel.innerHTML = tsvg(tType); tabSel.title = 'Tipo de tabulação: ' + TN[tType] + ' (clique para trocar; depois clique na régua para criar a parada)'; tabSel.setAttribute('aria-label', tabSel.title); }
    tabSel.addEventListener('mousedown', e=>e.preventDefault());
    tabSel.addEventListener('click', ()=>{ tType = TT[(TT.indexOf(tType) + 1) % TT.length]; tabSelDraw(); });
    tabSelDraw();
    const rcm = v=>Math.round(v * 100) / 100;
    function getTabs(b){
      return (b.dataset.tabs || '').split(',').map(q=>{ const a = q.split(':'); return {x:parseFloat(a[0]), t:TT.includes(a[1]) ? a[1] : 'l', l:'dhu'.includes(a[2] || 'n') && a[2] ? a[2] : ''}; }).filter(o=>isFinite(o.x)).sort((a, b)=>a.x - b.x);
    }
    function setTabs(b, arr){
      if(arr.length) b.dataset.tabs = arr.map(o=>rcm(o.x) + ':' + o.t + (o.l ? ':' + o.l : '')).join(',');
      else b.removeAttribute('data-tabs');
      tabLayout(b);
    }
    // largura do texto de um trecho (até o primeiro separador decimal, se dec)
    function runWidth(rg, dec){
      if(dec){
        const txt = rg.toString(), m = /,/.exec(txt) || /\./.exec(txt);   // em português o separador decimal é a vírgula
        if(m){
          const w = document.createTreeWalker(rg.commonAncestorContainer.nodeType === 3 ? rg.commonAncestorContainer.parentNode : rg.commonAncestorContainer, NodeFilter.SHOW_TEXT);
          let n = w.nextNode(), left = m.index, started = false;
          while(n){
            if(n === rg.startContainer || rg.intersectsNode(n)){
              let from = n === rg.startContainer ? rg.startOffset : 0, to = n === rg.endContainer ? rg.endOffset : n.data.length;
              const len = to - from; started = true;
              if(left <= len){ const r2 = rg.cloneRange(); r2.setEnd(n, from + left); return r2.getBoundingClientRect().width; }
              left -= len;
            }
            n = w.nextNode();
          }
        }
      }
      return rg.getBoundingClientRect().width;
    }
    function tabLayout(b){
      const tabs = getTabs(b), spans = [...b.querySelectorAll('.tb')];
      if(!spans.length) return;
      if(!tabs.length){ spans.forEach(t=>{ t.classList.remove('tbc', 'tl-d', 'tl-h', 'tl-u'); t.style.removeProperty('width'); if(!t.getAttribute('style')) t.removeAttribute('style'); }); return; }
      const pr = page.getBoundingClientRect(), sc = page.offsetWidth ? pr.width / page.offsetWidth : 1, padL = parseFloat(getComputedStyle(page).paddingLeft) || 0;
      const stops = tabs.map(o=>({x:o.x * CM, t:o.t, l:o.l}));
      spans.forEach(t=>{ t.classList.add('tbc'); t.classList.remove('tl-d', 'tl-h', 'tl-u'); t.style.width = '0px'; });
      spans.forEach((t, i)=>{
        const x = (t.getBoundingClientRect().left - pr.left) / sc - padL;
        const rg = document.createRange(); rg.setStartAfter(t);
        if(spans[i + 1]) rg.setEndBefore(spans[i + 1]); else rg.setEnd(b, b.childNodes.length);
        const tw = (t.nextSibling || spans[i + 1]) ? runWidth(rg, false) / sc : 0;
        let w = null, used = null;
        for(const st of stops){
          if(st.x <= x + 1) continue;
          let c = st.x - x;
          if(st.t === 'c') c -= tw / 2; else if(st.t === 'r') c -= tw; else if(st.t === 'd') c -= runWidth(rg, true) / sc;
          if(c >= 0){ w = c; used = st; break; }
        }
        if(w == null){   // depois da última parada personalizada valem as paradas padrão (1,25 cm)
          const D = defTab(), g = (Math.floor((Math.max(x, stops[stops.length - 1].x) + 1) / D) + 1) * D; w = g - x;
        }
        t.style.width = rcm(w) + 'px';
        if(used && used.l) t.classList.add('tl-' + used.l);
      });
    }
    let tabRaf = 0;
    function tabsAll(){
      tabRaf = 0;
      const set = new Set();
      page.querySelectorAll('[data-tabs]').forEach(b=>set.add(b));
      page.querySelectorAll('.tb.tbc').forEach(t=>{ const b = t.closest(BLK); if(b) set.add(b); });
      set.forEach(tabLayout);
    }
    window.__tabsSoon = ()=>{ if(!tabRaf) tabRaf = setTimeout(tabsAll, 150); };
    function renderTabs(){
      ruler.querySelectorAll('.ts').forEach(n=>n.remove());
      const st = state(); if(!st.b) return;
      getTabs(st.b).forEach(o=>{
        const i = document.createElement('i'); i.className = 'ts'; i.dataset.x = o.x; i.style.left = (pad.l + o.x * CM) + 'px';
        i.innerHTML = tsvg(o.t); i.title = 'Parada de tabulação ' + TN[o.t].toLowerCase() + ': arraste para mover; arraste para fora da régua para remover; clique duas vezes para abrir a caixa Tabulações';
        ruler.appendChild(i);
      });
    }
    ruler.addEventListener('pointerdown', e=>{
      if(e.target.closest('.rm') || e.target.closest('.mg')) return;
      const x = xOf(e);
      let el = e.target.closest('.ts'), bs;
      if(!el && (x < pad.l || x > W - pad.r)) return;
      e.preventDefault();
      bs = blocks();
      if(!bs.length){ page.focus(); document.execCommand('formatBlock', false, 'p'); bs = blocks(); }
      if(!bs.length) return;
      let cm;
      if(el){ cm = parseFloat(el.dataset.x); }
      else{
        cm = rcm((e.altKey ? x - pad.l : Math.round((x - pad.l) / Q) * Q) / CM);
        bs.forEach(b=>{ const t = getTabs(b).filter(o=>Math.abs(o.x - cm) > .01); t.push({x:cm, t:tType}); setTabs(b, t); });
        renderTabs(); el = [...ruler.querySelectorAll('.ts')].find(n=>Math.abs(parseFloat(n.dataset.x) - cm) < .011);
      }
      if(!el) return;
      tdrag = {bs, cm, el}; el.classList.add('drag'); try{ el.setPointerCapture(e.pointerId); }catch(_){}
    });
    ruler.addEventListener('pointermove', e=>{
      if(!tdrag) return;
      const d = tdrag, rr = ruler.getBoundingClientRect(), out = Math.abs(e.clientY - (rr.top + rr.height / 2)) > 26;
      d.el.classList.toggle('rm-off', out); d.out = out;
      if(out) return;
      const x = xOf(e), max = (W - pad.l - pad.r) / CM;
      const cm = Math.max(0, Math.min(max, rcm((e.altKey ? x - pad.l : Math.round((x - pad.l) / Q) * Q) / CM)));
      if(Math.abs(cm - d.cm) < .001) return;
      d.bs.forEach(b=>{ const t = getTabs(b), k = t.find(o=>Math.abs(o.x - d.cm) < .011); if(k){ k.x = cm; setTabs(b, t.filter(o=>o === k || Math.abs(o.x - cm) > .01)); } });
      d.cm = cm; d.el.dataset.x = cm; d.el.style.left = (pad.l + cm * CM) + 'px';
    });
    function tend(){
      if(!tdrag) return;
      const d = tdrag; tdrag = null;
      if(d.out) d.bs.forEach(b=>setTabs(b, getTabs(b).filter(o=>Math.abs(o.x - d.cm) > .011)));
      save(); update();
    }
    ruler.addEventListener('pointerup', tend); ruler.addEventListener('pointercancel', tend);
    ruler.addEventListener('dblclick', e=>{ if(e.target.closest('.ts')) openTabDlg(); });
    // ---- caixa Tabulações… ----
    const td = $('tabDlg'), tdList = $('tdList'), pcm = v=>String(rcm(v)).replace('.', ',');
    let tdWork = [];
    function tdFill(sel){
      tdList.innerHTML = '';
      tdWork.forEach((o, i)=>{ const op = document.createElement('option'); op.value = i; op.textContent = pcm(o.x) + ' cm — ' + TN[o.t] + (o.l ? ' — ' + {d:'pontos', h:'tracejado', u:'sublinhado'}[o.l] : ''); tdList.appendChild(op); });
      if(sel != null && tdWork[sel]){ tdList.value = String(sel); }
    }
    function tdPick(){
      const o = tdWork[+tdList.value]; if(!o) return;
      $('tdPos').value = pcm(o.x); $('tdAlign').value = o.t; $('tdLead').value = o.l || '';
    }
    tdList.addEventListener('change', tdPick);
    function openTabDlg(){
      restore();
      let bs = blocks(); if(!bs.length){ page.focus(); try{ document.execCommand('formatBlock', false, 'p'); }catch(_){} bs = blocks(); }
      if(!bs.length){ alert('Clique dentro de um parágrafo e abra a caixa Tabulações de novo.'); return; }
      tdWork = getTabs(bs[0]); tdFill(tdWork.length ? 0 : null); $('tdMsg').textContent = '';
      if(tdWork.length) tdPick(); else{ $('tdPos').value = ''; $('tdAlign').value = 'l'; $('tdLead').value = ''; }
      $('tdDef').value = pcm((store.docs[store.current] || {}).tabdef || 1.25);
      td.showModal(); $('tdPos').focus();
    }
    window.__tabDlg = openTabDlg;
    $('tdSet').addEventListener('click', ()=>{
      const v = parseFloat(String($('tdPos').value).replace(',', '.')), max = (W - pad.l - pad.r) / CM;
      if(!(v >= 0 && v <= (max || 40))){ $('tdMsg').textContent = 'Informe a posição em cm, de 0 até ' + pcm(max || 40) + '.'; return; }
      $('tdMsg').textContent = '';
      const x = rcm(v); tdWork = tdWork.filter(o=>Math.abs(o.x - x) > .005); tdWork.push({x, t:$('tdAlign').value, l:$('tdLead').value}); tdWork.sort((a, b)=>a.x - b.x);
      tdFill(tdWork.findIndex(o=>Math.abs(o.x - x) < .006)); $('tdPos').select();
    });
    $('tdClear').addEventListener('click', ()=>{
      const i = +tdList.value; if(!tdWork[i]) return; tdWork.splice(i, 1); tdFill(tdWork.length ? Math.min(i, tdWork.length - 1) : null); tdPick();
    });
    $('tdClearAll').addEventListener('click', ()=>{ tdWork = []; tdFill(null); $('tdPos').value = ''; });
    $('tdCancel').addEventListener('click', ()=>td.close());
    $('tdPos').addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); $('tdSet').click(); } });
    $('tdOk').addEventListener('click', ()=>{
      const pend = String($('tdPos').value).trim(); if(pend && !tdWork.some(o=>pcm(o.x) === pend)) $('tdSet').click();   // posição digitada e ainda não definida
      if($('tdMsg').textContent) return;
      const dv = parseFloat(String($('tdDef').value).replace(',', '.'));
      if(!(dv >= 0.1 && dv <= 10)){ $('tdMsg').textContent = 'A tabulação padrão vai de 0,1 a 10 cm.'; return; }
      const dd = store.docs[store.current]; if(dd){ if(Math.abs(dv - 1.25) < .001) delete dd.tabdef; else dd.tabdef = rcm(dv); }
      td.close(); restore();
      applyMar();
      blocks().forEach(b=>setTabs(b, tdWork.map(o=>({...o}))));
      save(); persist(); update();
    });
    page.addEventListener('input', window.__tabsSoon);
    $('zoom').addEventListener('change', window.__tabsSoon);
    if(window.ResizeObserver) new ResizeObserver(window.__tabsSoon).observe(page);
    window.__tabsSoon();
    document.addEventListener('selectionchange', ()=>{ if(!drag) update(); });
    page.addEventListener('input', ()=>{ if(!drag) update(); });
    $('zoom').addEventListener('change', update);
    window.addEventListener('resize', update);
    if(window.ResizeObserver) new ResizeObserver(()=>{ if(!drag) update(); }).observe(page);

    function setRuler(on){
      wrap.hidden = !on; vr.hidden = !on; btn.classList.toggle('on', on);
      try{ localStorage.setItem(LS_KEYS.ruler, on ? '1' : '0'); }catch(e){}
      update();
    }
    btn.addEventListener('click', ()=>setRuler(wrap.hidden));
    let on = true; try{ on = localStorage.getItem(LS_KEYS.ruler) !== '0'; }catch(e){}
    setRuler(on);
  })();
