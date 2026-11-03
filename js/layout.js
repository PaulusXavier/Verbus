/* Verbus — Guia Layout: Configurar Página (margens, orientação, papel, colunas)
   (js/layout.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   Reconstruído a partir da v66 (index.html monolítico), com as chaves de armazenamento portadas para LS_KEYS. */
  // ================= Configurar página (guia Layout) =================
  function pgSync(){
    const s = $('pgSize'); if(!s) return;
    const pg = pgOf(), d = store.docs[store.current], e = effMar(), c = v=>v / CMPX;
    s.value = pg.size; $('pgOri').value = pg.land ? 'l' : 'p'; $('pgCols').value = String(pg.cols);
    { const dd = store.docs[store.current]; $('lnMode').value = dd && dd.ln ? dd.ln : ''; $('pgHyph').value = dd && dd.hyph ? 'auto' : ''; }
    let k = 'custom';
    if(!d || !d.mar) k = 'padrao';
    else for(const n in PG_MAR){ const v = PG_MAR[n]; if(Math.abs(c(e.t) - v[0]) < .03 && Math.abs(c(e.r) - v[1]) < .03 && Math.abs(c(e.b) - v[2]) < .03 && Math.abs(c(e.l) - v[3]) < .03){ k = n; break; } }
    $('pgMar').value = k;
  }
  function pgDlgOpen(){
    const e = effMar(), pg = pgOf(), r2 = v=>String(Math.round(v / CMPX * 100) / 100);
    $('pgT').value = r2(e.t); $('pgB').value = r2(e.b); $('pgL').value = r2(e.l); $('pgR').value = r2(e.r);
    $('pgDlgSize').value = pg.size; $('pgDlgOri').value = pg.land ? 'l' : 'p'; $('pgDlgCols').value = String(pg.cols);
    $('pgMsg').textContent = ''; $('pgDlg').showModal();
  }
  $('pgMar').addEventListener('change', e=>{ if(e.target.value === 'custom'){ pgSync(); pgDlgOpen(); } else marSet(e.target.value); });
  $('pgOri').addEventListener('change', e=>pgSet({land: e.target.value === 'l'}));
  $('pgSize').addEventListener('change', e=>pgSet({size: e.target.value}));
  $('pgCols').addEventListener('change', e=>pgSet({cols: parseInt(e.target.value, 10)}));
  $('lnMode').addEventListener('change', e=>{ const d = store.docs[store.current]; if(!d) return; if(e.target.value) d.ln = e.target.value; else delete d.ln; persist(); lnRender(); });
  addEventListener('resize', ()=>lnRender());
  $('btnPgDlg').addEventListener('click', pgDlgOpen);
  $('pgCancel').addEventListener('click', ()=>$('pgDlg').close());
  $('pgDefault').addEventListener('click', ()=>{ marSet('padrao'); $('pgDlg').close(); });
  function pgDlgApply(){
    const n = id=>parseFloat(String($(id).value).replace(',', '.'));
    const t = n('pgT'), b = n('pgB'), l = n('pgL'), r = n('pgR'), s = PG_SIZES[$('pgDlgSize').value], land = $('pgDlgOri').value === 'l';
    const w = land ? s[1] : s[0], hh = land ? s[0] : s[1], msg = $('pgMsg');
    if([t, b, l, r].some(v=>!(v >= 0 && v <= 15))){ msg.textContent = 'Use margens entre 0 e 15 cm.'; return; }
    if(w - l - r < 2){ msg.textContent = 'As margens esquerda e direita deixam menos de 2 cm de largura para o texto.'; return; }
    if(hh - t - b < 2){ msg.textContent = 'As margens superior e inferior deixam menos de 2 cm de altura para o texto.'; return; }
    const d = store.docs[store.current]; if(!d) return;
    d.mar = {t:t * CMPX, r:r * CMPX, b:b * CMPX, l:l * CMPX};
    pgSet({size:$('pgDlgSize').value, land, cols:parseInt($('pgDlgCols').value, 10)});
    $('pgDlg').close();
  }

  // ---------- Layout: quebras, hifenização, recuos e espaçamento sincronizados com o cursor ----------
  $('pgHyph').addEventListener('change', e=>{
    const d = store.docs[store.current]; if(!d) return;
    if(e.target.value) d.hyph = 1; else delete d.hyph;
    persist(); applyMar(); changed();
  });
  $('pgBrk').addEventListener('change', e=>{
    const v = e.target.value; e.target.selectedIndex = 0; restore();
    if(v === 'page') $('btnPb').click();
    else if(v === 'col'){
      if(pgOf().cols < 2 && !confirm('O documento está com uma coluna só; a quebra de coluna só tem efeito com duas ou mais colunas (Layout > Colunas). Inserir mesmo assim?')) return;
      exec('insertHTML', '<p><br></p><div class="colb" contenteditable="false"></div><p><br></p>');
    }
    else if(v === 'line') exec('insertLineBreak');
    else if(/^sec-/.test(v)) exec('insertHTML', '<div class="sbk" data-t="' + v.slice(4) + '" contenteditable="false"></div><p><br></p>');
  });
  (function(){
    const iL = $('lyIndL'), iR = $('lyIndR'), sB = $('spB'), sA = $('spA'); let tm = null;
    const NOBLK = 'td,th,.fnotes,.endnotes,.hf';
    const num = v=>parseFloat(String(v).replace(',', '.'));
    const fmtCm = v=>String(Math.round(num(v) * 100) / 100).replace('.', ',') + ' cm';
    const fmtPt = v=>String(Math.round(num(v) * 10) / 10).replace('.', ',') + ' pt';
    function curBlock(){
      const s = getSelection(); if(!s.rangeCount || !page.contains(s.anchorNode)) return null;
      const el = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement;
      const b = el && el.closest ? el.closest('p,h1,h2,h3,h4,h5,h6,blockquote,div:not(.pb):not(.sbk):not(.biblio):not(.tbx):not(.sum)') : null;
      return b && page.contains(b) && b !== page && !b.closest(NOBLK) ? b : null;
    }
    function sync(){
      const act = document.activeElement; if(act === iL || act === iR || act === sB || act === sA) return;
      const b = curBlock(); if(!b) return;
      const cs = getComputedStyle(b), rtl = b.dir === 'rtl', cm = v=>String(Math.round(parseFloat(v) / CMPX * 100) / 100);
      const l = cm(rtl ? cs.marginRight : cs.marginLeft), r = cm(rtl ? cs.marginLeft : cs.marginRight);
      { const fl = fmtCm(l), fr = fmtCm(r); if(iL.value !== fl) iL.value = fl; if(iR.value !== fr) iR.value = fr; }
      [[sB, cs.marginTop], [sA, cs.marginBottom]].forEach(([inp, comp])=>{
        const v = fmtPt(parseFloat(comp) * 0.75);
        if(inp.value !== v) inp.value = v;
      });
    }
    document.addEventListener('selectionchange', ()=>{ clearTimeout(tm); tm = setTimeout(sync, 80); });
    function aplicarRecuo(side, input){
      const n = parseFloat(String(input.value).replace(',', '.'));
      if(!(n >= 0 && n <= 20)) { sync(); return; }
      restore();
      blocksInSel().filter(b=>!/^(TD|TH)$/.test(b.tagName)).forEach(b=>{
        const rtl = b.dir === 'rtl', prop = (side === 'L') !== rtl ? 'marginLeft' : 'marginRight';
        b.style[prop] = n ? n + 'cm' : '';
        if(!b.getAttribute('style')) b.removeAttribute('style');
      });
      changed();
    }
    iL.addEventListener('change', ()=>{ aplicarRecuo('L', iL); const n = num(iL.value); if(n >= 0 && n <= 20) iL.value = fmtCm(n); });
    iR.addEventListener('change', ()=>{ aplicarRecuo('R', iR); const n = num(iR.value); if(n >= 0 && n <= 20) iR.value = fmtCm(n); });
    // Espaço antes/depois do parágrafo (em pt; vazio = volta ao padrão)
    [[sB, 'marginTop'], [sA, 'marginBottom']].forEach(([inp, prop])=>{
      inp.addEventListener('change', ()=>{
        const raw = String(inp.value).trim(), n = num(raw);
        if(raw !== '' && !(n >= 0 && n <= 200)){ sync(); return; }
        restore();
        blocksInSel().filter(b=>!/^(TD|TH)$/.test(b.tagName)).forEach(b=>{
          b.style[prop] = raw === '' ? '' : n + 'pt';
          if(!b.getAttribute('style')) b.removeAttribute('style');
        });
        changed();
        if(raw !== '') inp.value = fmtPt(n);
      });
    });
    // Campos com botões ▲▼ e setas do teclado (Recuar: 0,25 cm; Espaçamento: 6 pt)
    const SPIN = {lyIndL:{st:.25, mx:20, f:fmtCm}, lyIndR:{st:.25, mx:20, f:fmtCm}, spB:{st:6, mx:200, f:fmtPt}, spA:{st:6, mx:200, f:fmtPt}};
    function spin(id, d){
      const inp = $(id), c = SPIN[id]; let n = num(inp.value); if(!(n >= 0)) n = 0;
      n = Math.min(c.mx, Math.max(0, Math.round((n + d * c.st) * 100) / 100));
      inp.value = c.f(n); inp.dispatchEvent(new Event('change', {bubbles:true}));
    }
    document.querySelectorAll('#tp-layout .spn .sp b').forEach(b=>{
      b.addEventListener('mousedown', e=>{ e.preventDefault(); spin(b.dataset.for, +b.dataset.d); });
    });
    Object.keys(SPIN).forEach(id=>$(id).addEventListener('keydown', e=>{
      if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){ e.preventDefault(); spin(id, e.key === 'ArrowUp' ? 1 : -1); }
    }));
    Object.keys(SPIN).forEach(id=>$(id).addEventListener('focus', e=>e.target.select()));
    Object.keys(SPIN).forEach(id=>$(id).addEventListener('blur', ()=>{ clearTimeout(tm); tm = setTimeout(sync, 30); }));
  })();

  // ---------- Botões da guia Layout (menus que usam as caixas de seleção ocultas) ----------
  (function(){
    let pop = null, cur = null;
    function close(){ if(pop){ pop.remove(); pop = null; } if(cur){ cur.setAttribute('aria-expanded', 'false'); cur = null; } document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); }
    function outside(e){ if(pop && !pop.contains(e.target) && !(cur && cur.contains(e.target))) close(); }
    function esc(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    const lab = t=>{ t = t.replace(/^[^:]+:\s*/, ''); return t.charAt(0).toUpperCase() + t.slice(1); };
    function open(btn){
      if(cur === btn){ close(); return; }
      close(); pgSync();
      const sel = $(btn.dataset.lysel); if(!sel) return;
      pop = document.createElement('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
      const add = o=>{
        if(o.disabled && o.hidden) return;
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitemradio');
        const on = sel.value === o.value && o.value !== '' || (o.value === '' && sel.value === '' && sel.id !== 'pgBrk');
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.innerHTML = '<span class="ck">✓</span>'; b.appendChild(document.createTextNode(lab(o.textContent)));
        b.addEventListener('click', ()=>{ close(); sel.value = o.value; sel.dispatchEvent(new Event('change', {bubbles:true})); pgSync(); });
        pop.appendChild(b);
      };
      [...sel.children].forEach(c=>{
        if(c.tagName === 'OPTGROUP'){ const h = document.createElement('div'); h.className = 'mh'; h.textContent = c.label; pop.appendChild(h); [...c.children].forEach(add); }
        else add(c);
      });
      pop.addEventListener('mousedown', e=>e.preventDefault());
      document.body.appendChild(pop);
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.max(4, Math.min(r.left, innerWidth - pop.offsetWidth - 4)) + 'px';
      pop.style.top = Math.max(4, Math.min(r.bottom, innerHeight - pop.offsetHeight - 4)) + 'px';
      cur = btn; btn.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
    }
    document.querySelectorAll('#tp-layout [data-lysel]').forEach(b=>{
      b.addEventListener('mousedown', e=>e.preventDefault());
      b.addEventListener('click', ()=>open(b));
    });
  })();


  // ---------- Layout > Organizar (como no Word): atua na imagem selecionada; fica acinzentado sem imagem ----------
  (function(){
    const bar = $('imgbar'), btns = [...document.querySelectorAll('#orgGb .orgb')];
    const live = new Set(['orgFwd', 'orgBack']);   // Painel de Seleção, Agrupar e Girar ainda não existem no Verbus: ficam sempre acinzentados
    const on = ()=>!bar.hidden;
    function sync(){ btns.forEach(b=>{ const ok = on() && (b.dataset.lysel || live.has(b.id)); b.disabled = !ok; }); }
    new MutationObserver(sync).observe(bar, {attributes:true, attributeFilter:['hidden']}); sync();
    const setWrap = v=>{ const w = $('imWrap'); if(!on() || ![...w.options].some(o=>o.value === v)) return; w.value = v; w.dispatchEvent(new Event('change', {bubbles:true})); };
    $('orgFwd').addEventListener('click', ()=>setWrap('front'));
    $('orgBack').addEventListener('click', ()=>setWrap('behind'));
    $('orgWrap').addEventListener('change', e=>{ setWrap(e.target.value); });
    ['orgPos', 'orgAlignSel'].forEach(id=>$(id).addEventListener('change', e=>{
      const [k, v] = e.target.value.split(':'); const b = bar.querySelector(k === 'ia' ? '[data-ia="' + v + '"]' : '[data-iv="' + v + '"]'); if(on() && b) b.click();
    }));
  })();
  $('pgOk').addEventListener('click', pgDlgApply);
  $('pgDlg').addEventListener('keydown', e=>{ if(e.key === 'Enter' && e.target.tagName === 'INPUT'){ e.preventDefault(); pgDlgApply(); } });
  pgSync();

  // ---------- Detalhes de comportamento da interface ----------
  (function(){
    const main = document.querySelector('main'), sheet = $('sheet'), vr = $('vruler');
    const zsel = $('zoom'), slide = $('zSlide'), pctBtn = $('zPct');

    // barras de cor sob os ícones (realce, cor da fonte, sombreamento)
    [['back', 'barBack'], ['shade', 'barShade'], ['fore', 'barFore']].forEach(([i, b])=>{
      $(i).addEventListener('input', e=>{ $(b).style.background = e.target.value; });
    });

    // Recortar/Copiar e Desfazer/Refazer ficam acinzentados quando não valem
    function sync(){
      try{
        const sel = getSelection(), has = sel.rangeCount && !sel.isCollapsed && page.contains(sel.anchorNode);
        $('btnCut').classList.toggle('dis', !has); $('btnCopy').classList.toggle('dis', !has);
        document.querySelectorAll('#qat [data-cmd=undo]').forEach(b=>b.classList.toggle('dis', !document.queryCommandEnabled('undo')));
        document.querySelectorAll('#qat [data-cmd=redo]').forEach(b=>b.classList.toggle('dis', !document.queryCommandEnabled('redo')));
      }catch(e){}
    }
    let syT = 0; const syncSoon = ()=>{ clearTimeout(syT); syT = setTimeout(sync, 120); };
    document.addEventListener('selectionchange', syncSoon);
    page.addEventListener('input', syncSoon);
    document.addEventListener('click', syncSoon);
    sync();

    // título do documento: largura acompanha o texto (navegadores sem field-sizing)
    if(!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'))){
      const fit = ()=>{ title.style.width = Math.min(innerWidth * .45, Math.max(24, title.value.length * 6.6 + 8)) + 'px'; };
      title.addEventListener('input', fit); fit(); setInterval(fit, 600);
    }

    // régua vertical fica na borda esquerda da área do documento, como no Word
    function placeV(){
      const z = parseFloat(sheet.style.zoom) || 1, m = main.getBoundingClientRect(), sh = sheet.getBoundingClientRect();
      vr.style.left = ((m.left + 5) - sh.left) / z + 'px';
    }
    window.addEventListener('resize', placeV);
    if(window.ResizeObserver) new ResizeObserver(placeV).observe(main);
    $('btnRuler').addEventListener('click', ()=>setTimeout(placeV, 0));

    // zoom (barra de status)
    const toPct = v=>v <= 50 ? 10 + v / 50 * 90 : 100 + (v - 50) / 50 * 400;
    const toVal = p=>p <= 100 ? (p - 10) / 90 * 50 : 50 + (p - 100) / 400 * 50;
    let autoZ = false; const narrow = ()=>innerWidth <= 700;
    const fitPct = ()=>{ const cs = getComputedStyle(main); return Math.max(10, Math.floor((main.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) - 8) / (pgOf().w * CMPX) * 100)); };   // largura da página = largura da tela
    function curPct(){ return Math.round((parseFloat(sheet.style.zoom) || 1) * 100); }
    function setZoom(p){
      p = Math.max(10, Math.min(500, Math.round(p)));
      const z = p / 100;
      let o = [...zsel.options].find(x=>Math.abs(parseFloat(x.value) - z) < 1e-6 && !x.dataset.c);
      if(!o){
        o = zsel.querySelector('option[data-c]') || document.createElement('option');
        o.dataset.c = '1'; o.value = String(z); o.textContent = p + '%'; if(!o.parentNode) zsel.appendChild(o);
      }
      zsel.value = o.value; zsel.dispatchEvent(new Event('change'));
    }
    zsel.addEventListener('change', ()=>{
      const p = curPct(); pctBtn.textContent = p + '%'; slide.value = toVal(p);
      try{ if(!autoZ) localStorage.setItem(LS_KEYS.zoom, String(p)); if(narrow() && !autoZ) localStorage.setItem(LS_KEYS.zoomMob, String(p)); }catch(e){}
      placeV(); pgUpdate(); pgMarks();
    });
    slide.addEventListener('input', ()=>setZoom(toPct(parseFloat(slide.value))));
    $('zOut').addEventListener('click', ()=>setZoom(Math.ceil(curPct() / 10) * 10 - 10));
    $('zIn').addEventListener('click', ()=>setZoom(Math.floor(curPct() / 10) * 10 + 10));
    pctBtn.addEventListener('click', ()=>setZoom(narrow() ? fitPct() : 100));
    // pinça com dois dedos para ampliar/reduzir a folha (celular), como no Word
    main.style.touchAction = 'pan-x pan-y';
    let pd = 0, pz = 100;
    const pdist = t=>Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    main.addEventListener('touchstart', e=>{ if(e.touches.length === 2){ pd = pdist(e.touches); pz = curPct(); } }, {passive:true});
    main.addEventListener('touchmove', e=>{ if(e.touches.length === 2 && pd){ e.preventDefault(); setZoom(pz * pdist(e.touches) / pd); } }, {passive:false});
    main.addEventListener('touchend', ()=>{ pd = 0; }, {passive:true});
    let z0 = innerWidth >= 1000 ? 110 : 100;
    try{ const sv = parseInt(localStorage.getItem(LS_KEYS.zoom), 10); if(sv >= 10 && sv <= 500 && (innerWidth >= 1000 || sv <= 100)) z0 = sv; }catch(e){}
    if(narrow()){ z0 = fitPct(); try{ const sv = parseInt(localStorage.getItem(LS_KEYS.zoomMob), 10); if(sv >= 10 && sv <= 500) z0 = sv; }catch(e){} autoZ = true; }
    if(!narrow()){ const f = fitPct(); if(z0 > f){ z0 = f; autoZ = true; } }   // a folha nunca fica cortada: se não cabe na janela, ajusta à largura
    setZoom(z0); autoZ = false;
    let lastW = innerWidth;
    addEventListener('resize', ()=>{      // girar o celular: reajusta à largura, a não ser que a pessoa tenha escolhido um zoom
      if(innerWidth === lastW) return; lastW = innerWidth;
      let m = null; try{ m = localStorage.getItem(LS_KEYS.zoomMob); }catch(e){}
      if(narrow() && !m){ autoZ = true; setZoom(fitPct()); autoZ = false; }
      else if(!narrow()){ const f = fitPct(); let sv = 0; try{ sv = parseInt(localStorage.getItem(LS_KEYS.zoom), 10) || 0; }catch(e){} const want = Math.min(sv || (innerWidth >= 1000 ? 110 : 100), f); if(want !== curPct()){ autoZ = true; setZoom(want); autoZ = false; } }
    });

    // "Página x de y"
    function pgUpdate(){
      try{
        const n = pageCount(); let cur = 1;
        const sel = getSelection();
        if(n > 1 && sel.rangeCount && page.contains(sel.anchorNode)){
          const r = sel.getRangeAt(0).cloneRange(); r.collapse(true);
          const rc = r.getClientRects()[0] || (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement).getBoundingClientRect();
          if(pgState){
            const sr = sheet.getBoundingClientRect(), sc = sheet.offsetWidth ? sr.width / sheet.offsetWidth : 1, y = (rc.top - sr.top) / sc - pgState.base;
            cur = 1; if(pgState.shifted) cur = Math.max(1, Math.min(n, Math.floor((y + pgState.et) / pgState.P) + 1)); else pgState.starts.forEach((v, i)=>{ if(y + 1 >= v) cur = i + 1; });
          }else{
            const z = parseFloat(sheet.style.zoom) || 1, ph = pgOf().h * CMPX * z;
            cur = Math.max(1, Math.min(n, Math.floor((rc.top - page.getBoundingClientRect().top) / ph) + 1));
          }
        }
        $('pgInfo').textContent = 'Página ' + cur + ' de ' + n;
      }catch(e){}
    }
    window.__pgUpdate = pgUpdate;
    let pgUT = 0; const pgUpdateSoon = ()=>{ clearTimeout(pgUT); pgUT = setTimeout(pgUpdate, 120); };
    document.addEventListener('selectionchange', pgUpdateSoon);
    page.addEventListener('input', pgUpdateSoon);
    setTimeout(pgUpdate, 400); setTimeout(pgUpdate, 1500);

    // idioma na barra de status
    const lang = $('revLang');
    function langTxt(){ if(lang && lang.selectedOptions[0]) $('langInfo').textContent = lang.selectedOptions[0].textContent; }
    if(lang) lang.addEventListener('change', langTxt); langTxt();
    $('langInfo').addEventListener('click', ()=>$('btnRev').click());
    $('langInfo').addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); $('btnRev').click(); } });

    // recolher/expandir a faixa de opções
    function ribbon(collapse){ document.body.classList.toggle('rcol', collapse); setTimeout(()=>window.dispatchEvent(new Event('resize')), 0); }
    $('btnCollapse').addEventListener('click', ()=>ribbon(true));
    $('btnRibOpt').addEventListener('click', ()=>ribbon(!document.body.classList.contains('rcol')));
    document.querySelectorAll('#tabs .tab').forEach(t=>t.addEventListener('click', ()=>{ if(document.body.classList.contains('rcol')) ribbon(false); }));
    document.addEventListener('keydown', e=>{ if(e.ctrlKey && e.key === 'F1'){ e.preventDefault(); ribbon(!document.body.classList.contains('rcol')); } });

    // roda do mouse rola a faixa quando a janela é estreita
    document.querySelectorAll('.tabpanel').forEach(p=>p.addEventListener('wheel', e=>{
      if(p.scrollWidth > p.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)){ p.scrollLeft += e.deltaY; e.preventDefault(); }
    }, {passive:false}));

    // galeria de estilos: setas e "mais"
    const gal = $('gallery'), up = $('galUp'), dn = $('galDn'), more = $('galMore');
    function galState(){
      up.disabled = gal.scrollLeft <= 1;
      dn.disabled = gal.scrollLeft + gal.clientWidth >= gal.scrollWidth - 1;
    }
    up.addEventListener('click', ()=>{ gal.scrollLeft -= 216; setTimeout(galState, 350); });
    dn.addEventListener('click', ()=>{ gal.scrollLeft += 216; setTimeout(galState, 350); });
    gal.addEventListener('scroll', galState);
    new (window.ResizeObserver || function(){ this.observe = ()=>{}; })(galState).observe(gal);
    function galClose(){ gal.classList.remove('pop'); gal.style.cssText = ''; }
    more.addEventListener('click', e=>{
      e.stopPropagation();
      if(gal.classList.contains('pop')){ galClose(); return; }
      const r = gal.parentElement.getBoundingClientRect();
      gal.classList.add('pop');
      gal.style.left = r.left + 'px'; gal.style.top = r.top + 'px'; gal.style.width = Math.max(r.width - 15, 300) + 'px';
    });
    document.addEventListener('click', e=>{ if(gal.classList.contains('pop') && !e.target.closest('.gallery')) galClose(); });
    gal.addEventListener('click', e=>{ if(e.target.closest('button') && gal.classList.contains('pop')) setTimeout(galClose, 0); });
    document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && gal.classList.contains('pop')) galClose(); });
    galState();
    setTimeout(()=>{ if(!gal.querySelector('.on')){ const n = gal.querySelector('[data-gs=normal]'); if(n) n.classList.add('on'); } }, 500);

    // cursor piscando no texto ao abrir (computador)
    if(innerWidth >= 900) setTimeout(()=>{ try{ if(!document.activeElement || document.activeElement === document.body) page.focus(); }catch(e){} }, 600);
  })();

  // Word-like: Ctrl + roda do mouse muda o zoom; clicar no cinza ao redor da folha volta o cursor ao texto
  (function(){
    const main = document.querySelector('main'), zsel = $('zoom'), sheet = $('sheet');
    main.addEventListener('wheel', e=>{
      if(!e.ctrlKey) return;
      e.preventDefault();
      const cur = Math.round((parseFloat(sheet.style.zoom) || 1) * 100);
      const next = e.deltaY < 0 ? Math.floor(cur / 10) * 10 + 10 : Math.ceil(cur / 10) * 10 - 10;
      $('zPct').dispatchEvent(new Event('zoomto'));
      const z = Math.max(10, Math.min(500, next)) / 100;
      let o = [...zsel.options].find(x=>Math.abs(parseFloat(x.value) - z) < 1e-6 && !x.dataset.c);
      if(!o){ o = zsel.querySelector('option[data-c]') || document.createElement('option'); o.dataset.c = '1'; o.value = String(z); o.textContent = Math.round(z * 100) + '%'; if(!o.parentNode) zsel.appendChild(o); }
      zsel.value = o.value; zsel.dispatchEvent(new Event('change'));
    }, {passive:false});
    main.addEventListener('mousedown', e=>{
      if(e.target !== main) return;
      e.preventDefault();
      page.focus();
      const r = document.createRange(); r.selectNodeContents(page); r.collapse(false);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    });
  })();
