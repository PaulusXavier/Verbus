/* Verbus — Exibir (modos de exibição, grade, zoom), diálogos Fonte e Parágrafo e Colar Especial
   (js/interface.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   Reconstruído a partir da v66 (index.html monolítico), com as chaves de armazenamento portadas para LS_KEYS. */
  // ================= Exibir: modos de exibição, grade, zoom, nova janela =================
  (function(){
    const main = document.querySelector('main'), sheet = $('sheet'), zsel = $('zoom'), body = document.body;
    function zoomTo(p){
      p = Math.max(10, Math.min(500, Math.round(p))); const z = p / 100;
      let o = [...zsel.options].find(x=>Math.abs(parseFloat(x.value) - z) < 1e-6 && !x.dataset.c);
      if(!o){ o = zsel.querySelector('option[data-c]') || document.createElement('option'); o.dataset.c = '1'; o.value = String(z); o.textContent = p + '%'; if(!o.parentNode) zsel.appendChild(o); }
      zsel.value = o.value; zsel.dispatchEvent(new Event('change'));
    }
    const padX = ()=>{ const cs = getComputedStyle(main); return (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0); };
    const fitW = ()=>Math.max(10, Math.floor((main.clientWidth - padX() - 8) / (pgOf().w * CMPX) * 100));
    const fitOne = ()=>{ const rw = $('rulerWrap'), rh = rw && rw.offsetParent ? rw.offsetHeight : 0; return Math.max(10, Math.floor((main.clientHeight - rh - 40) / (pgOf().h * CMPX) * 100)); };
    $('btnZoom100').addEventListener('click', ()=>zoomTo(100));
    $('btnZoomW').addEventListener('click', ()=>zoomTo(fitW()));
    $('btnZoomOne').addEventListener('click', ()=>zoomTo(fitOne()));
    const zd = $('zmDlg');
    $('btnZoomDlg').addEventListener('click', ()=>{ $('zmPct').value = Math.round((parseFloat(sheet.style.zoom) || 1) * 100); zd.querySelector('input[value=pct]').checked = true; zd.showModal(); });
    $('zmCancel').addEventListener('click', ()=>zd.close());
    zd.addEventListener('change', e=>{ if(e.target.name === 'zmOpt' && /^\d+$/.test(e.target.value)) $('zmPct').value = e.target.value; });
    $('zmPct').addEventListener('focus', ()=>{ zd.querySelector('input[value=pct]').checked = true; });
    $('zmOk').addEventListener('click', ()=>{
      const v = (zd.querySelector('input[name=zmOpt]:checked') || {}).value;
      if(v === 'w') zoomTo(fitW()); else if(v === 'one') zoomTo(fitOne());
      else { const n = parseFloat($('zmPct').value); if(isFinite(n)) zoomTo(n); }
      zd.close();
    });
    zd.addEventListener('keydown', e=>{ if(e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'number'){ e.preventDefault(); $('zmOk').click(); } });

    $('btnGrid').addEventListener('click', ()=>{ const on = sheet.classList.toggle('grid'); $('btnGrid').classList.toggle('on', on); });
    const sd = $('side'), syncSide = ()=>$('btnSide').classList.toggle('on', !sd.hidden);
    new MutationObserver(syncSide).observe(sd, {attributes:true, attributeFilter:['hidden']}); syncSide();
    $('btnNewWin').addEventListener('click', ()=>{ window.open(location.href.split('#')[0], '_blank'); });
    $('btnVmOutline').addEventListener('click', ()=>{ if(sd.hidden) $('btnSide').click(); $('tabOut').click(); });

    // modos de exibição
    let mode = 'print';
    const pgStyles = ()=>['pgShift', 'fnPos'].map(id=>document.getElementById(id)).filter(Boolean);
    const sync = ()=>{ const off = mode === 'web' || mode === 'draft'; pgStyles().forEach(st=>{ st.disabled = off; }); };
    new MutationObserver(sync).observe(document.head, {childList:true, subtree:true});
    function setMode(m){
      if(m === mode) return; mode = m;
      body.classList.remove('vm-read', 'vm-web', 'vm-draft'); if(m !== 'print') body.classList.add('vm-' + m);
      page.contentEditable = m === 'read' ? 'false' : 'true';
      $('vmBar').hidden = m !== 'read';
      [['btnVmRead', 'read'], ['btnVmPrint', 'print'], ['btnVmWeb', 'web'], ['btnVmDraft', 'draft']].forEach(([id, k])=>$(id).classList.toggle('on', k === m));
      [['vbRead', 'read'], ['vbPrint', 'print'], ['vbWeb', 'web']].forEach(([id, k])=>{ const b = $(id); b.classList.toggle('on', k === m); b.setAttribute('aria-pressed', k === m ? 'true' : 'false'); });
      sync(); try{ pgMarks(); }catch(e){}
      setTimeout(()=>window.dispatchEvent(new Event('resize')), 0);
      if(m === 'print') setTimeout(()=>{ try{ pgMarks(); }catch(e){} }, 50);
    }
    $('btnVmRead').addEventListener('click', ()=>setMode('read')); $('vbRead').addEventListener('click', ()=>setMode('read'));
    $('btnVmPrint').addEventListener('click', ()=>setMode('print')); $('vbPrint').addEventListener('click', ()=>setMode('print'));
    $('btnVmWeb').addEventListener('click', ()=>setMode('web')); $('vbWeb').addEventListener('click', ()=>setMode('web'));
    $('btnVmDraft').addEventListener('click', ()=>setMode('draft'));
    $('vmExit').addEventListener('click', ()=>setMode('print'));
    document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && mode === 'read' && !document.querySelector('dialog[open]')) setMode('print'); });
  })();

  // ================= Página Inicial: diálogos Fonte e Parágrafo, sublinhado, Voz/Editor =================
  (function(){
    const num = (el, d)=>{ const v = parseFloat(String(el.value).replace(',', '.')); return isFinite(v) ? v : d; };
    const cm = px=>Math.round(px / 37.795 * 100) / 100;

    // Sublinhado com estilo (simples, duplo, pontilhado, tracejado, ondulado, nenhum)
    $('ulnStyle').addEventListener('change', e=>{
      const v = e.target.value; e.target.selectedIndex = 0; restore();
      let has = false; try{ has = document.queryCommandState('underline'); }catch(x){}
      if(has) document.execCommand('underline');
      if(v === 'none'){ changed(); return; }
      wrapStyle(sp=>{
        sp.querySelectorAll('span').forEach(x=>{ x.style.textDecorationLine = ''; x.style.textDecorationStyle = ''; });
        sp.style.textDecorationLine = 'underline'; sp.style.textDecorationStyle = v === 'thick' ? 'solid' : v;
        sp.style.textDecorationThickness = v === 'thick' ? '3px' : '';
      }, true);
    });

    // Iniciadores ↘
    document.querySelectorAll('#toolbar .gdl').forEach(b=>{
      b.addEventListener('mousedown', e=>e.preventDefault());
      b.addEventListener('click', ()=>openDlg(b.dataset.dlg));
    });
    const openDlg = id=>{ if(id === 'fontDlg') openFont(); else if(id === 'parDlg') openPar(); else if(id === 'clipPane') window.__openClip(); };
    page.addEventListener('keydown', e=>{ if(e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === 'd' || e.key === 'D')){ e.preventDefault(); openFont(); } });

    // ---------- Fonte ----------
    const fd = $('fontDlg');
    function fdPreview(){
      const p = $('fdPrev'), st = p.style, dec = [];
      st.fontFamily = $('fdFont').value; st.fontSize = Math.min(40, num($('fdSize'), 11) * (($('fdSup').checked || $('fdSub').checked) ? .65 : 1) + 5) + 'px';
      st.color = $('fdColor').value;
      if($('fdUl').value !== 'none') dec.push('underline');
      if($('fdStrike').checked || $('fdDStrike').checked) dec.push('line-through');
      st.textDecorationLine = dec.join(' ') || 'none';
      st.textDecorationStyle = $('fdDStrike').checked ? 'double' : ($('fdUl').value === 'none' ? 'solid' : $('fdUl').value);
      st.fontVariant = $('fdSmall').checked ? 'small-caps' : 'normal';
      st.textTransform = $('fdCaps').checked ? 'uppercase' : 'none';
      st.letterSpacing = ($('fdSpc').value === '0' ? 0 : num($('fdSpcBy'), 0)) + 'pt';
    }
    function openFont(){
      $('fdMsg').textContent = '';
      const fsel = $('fdFont'); fsel.innerHTML = '';
      const vistas = new Set(); [...$('font').options].forEach(o=>{ if(!o.value || vistas.has(o.value) || o.disabled) return; vistas.add(o.value); const n = document.createElement('option'); n.textContent = n.value = o.value; fsel.appendChild(n); });
      restore();
      const el = selEl(), cs = getComputedStyle(el);
      const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      if(![...fsel.options].some(o=>o.value.toLowerCase() === fam.toLowerCase())){ const n = document.createElement('option'); n.textContent = n.value = fam; fsel.insertBefore(n, fsel.firstChild); }
      fsel.value = [...fsel.options].find(o=>o.value.toLowerCase() === fam.toLowerCase()).value;
      $('fdSize').value = curPt();
      const rgb = cs.color.match(/\d+/g) || [0, 0, 0];
      $('fdColor').value = '#' + rgb.slice(0, 3).map(n=>(+n).toString(16).padStart(2, '0')).join('');
      fd.dataset.color0 = $('fdColor').value;
      const dl = cs.textDecorationLine || '';
      $('fdUl').value = dl.includes('underline') ? (['double', 'dotted', 'dashed', 'wavy'].includes(cs.textDecorationStyle) ? cs.textDecorationStyle : 'single') : 'none';
      $('fdStrike').checked = dl.includes('line-through') && cs.textDecorationStyle !== 'double';
      $('fdDStrike').checked = dl.includes('line-through') && cs.textDecorationStyle === 'double';
      $('fdSup').checked = cs.verticalAlign === 'super'; $('fdSub').checked = cs.verticalAlign === 'sub';
      $('fdSmall').checked = cs.fontVariantCaps === 'small-caps'; $('fdCaps').checked = cs.textTransform === 'uppercase';
      const ls = parseFloat(cs.letterSpacing); const lsPt = isFinite(ls) ? Math.round(ls * 0.75 * 10) / 10 : 0;
      $('fdSpcBy').value = lsPt; $('fdSpc').value = lsPt > 0 ? '1' : lsPt < 0 ? '-0.5' : '0';
      const va = cs.verticalAlign, vpx = parseFloat(va);
      if(/^-?[\d.]+px$/.test(va) && vpx !== 0){ $('fdPos').value = vpx > 0 ? 'u' : 'd'; $('fdPosBy').value = Math.round(Math.abs(vpx) * 0.75 * 2) / 2; } else { $('fdPos').value = 'n'; $('fdPosBy').value = 3; }
      $('fdKern').checked = cs.fontKerning !== 'none'; $('fdHid').checked = !!el.closest('[data-hid]');
      fdPreview(); fd.showModal();
    }
    ['fdFont', 'fdSize', 'fdColor', 'fdUl', 'fdStrike', 'fdDStrike', 'fdSup', 'fdSub', 'fdSmall', 'fdCaps', 'fdSpcBy'].forEach(id=>$(id).addEventListener('input', fdPreview));
    $('fdStrike').addEventListener('change', ()=>{ if($('fdStrike').checked) $('fdDStrike').checked = false; fdPreview(); });
    $('fdDStrike').addEventListener('change', ()=>{ if($('fdDStrike').checked) $('fdStrike').checked = false; fdPreview(); });
    $('fdSup').addEventListener('change', ()=>{ if($('fdSup').checked) $('fdSub').checked = false; fdPreview(); });
    $('fdSub').addEventListener('change', ()=>{ if($('fdSub').checked) $('fdSup').checked = false; fdPreview(); });
    $('fdSpc').addEventListener('change', ()=>{ const v = $('fdSpc').value; $('fdSpcBy').value = v === '0' ? 0 : v === '1' ? 1 : -0.5; fdPreview(); });
    $('fdCancel').addEventListener('click', ()=>fd.close());
    $('fdOk').addEventListener('click', ()=>{
      const pt = num($('fdSize'), 0);
      if(!(pt >= 1 && pt <= 400)){ $('fdMsg').textContent = 'Informe um tamanho entre 1 e 400 pt.'; return; }
      const s = getSelection();
      fd.close(); restore();
      if(s.rangeCount && s.isCollapsed && s.modify){ s.modify('move', 'backward', 'word'); s.modify('extend', 'forward', 'word'); }
      if(!s.rangeCount || s.isCollapsed){ alert('Selecione o texto que receberá a formatação e abra a caixa Fonte de novo.'); return; }
      // remove sublinhado/tachado nativos para o estilo do diálogo valer
      ['underline', 'strikeThrough', 'superscript', 'subscript'].forEach(c=>{ try{ if(document.queryCommandState(c)) document.execCommand(c); }catch(x){} });
      const dec = [];
      if($('fdUl').value !== 'none') dec.push('underline');
      const strike = $('fdStrike').checked || $('fdDStrike').checked; if(strike) dec.push('line-through');
      const sup = $('fdSup').checked, sub = $('fdSub').checked, by = num($('fdSpcBy'), 0);
      wrapStyle(sp=>{
        sp.querySelectorAll('span').forEach(x=>{ ['fontFamily', 'fontSize', 'color', 'textDecorationLine', 'textDecorationStyle', 'verticalAlign', 'fontVariant', 'textTransform', 'letterSpacing'].forEach(k=>x.style[k] = ''); });
        sp.style.fontFamily = '"' + $('fdFont').value + '"';
        sp.style.fontSize = ((sup || sub) ? Math.round(pt * 0.65 * 2) / 2 : pt) + 'pt';
        if($('fdColor').value !== fd.dataset.color0) sp.style.color = $('fdColor').value;
        if(dec.length){ sp.style.textDecorationLine = dec.join(' '); sp.style.textDecorationStyle = $('fdDStrike').checked ? 'double' : ($('fdUl').value !== 'none' ? $('fdUl').value : 'solid'); }
        if(sup) sp.style.verticalAlign = 'super'; else if(sub) sp.style.verticalAlign = 'sub';
        else if($('fdPos').value !== 'n'){ const pb = num($('fdPosBy'), 3); sp.style.verticalAlign = ($('fdPos').value === 'd' ? '-' : '') + pb + 'pt'; }
        if(!$('fdKern').checked) sp.style.fontKerning = 'none';
        if($('fdHid').checked) sp.dataset.hid = '1';
        if($('fdSmall').checked) sp.style.fontVariant = 'small-caps';
        if($('fdCaps').checked) sp.style.textTransform = 'uppercase';
        if(by) sp.style.letterSpacing = by + 'pt';
      }, true);
      syncSize();
    });

    // ---------- Parágrafo ----------
    const pd = $('parDlg');
    // "Entre linhas": simples/1,5/duplo fixam o valor; pelo menos/exatamente usam pontos
    function pdLhSync(keep){
      const m = $('pdLhMode').value, f = $('pdLh');
      if(m === 'single' || m === 'onehalf' || m === 'double'){ f.value = m === 'single' ? 1 : m === 'onehalf' ? 1.5 : 2; f.disabled = true; $('pdLhLbl').textContent = 'Em (múltiplo)'; f.min = .5; f.max = 5; f.step = .05; }
      else if(m === 'multi'){ f.disabled = false; $('pdLhLbl').textContent = 'Em (múltiplo)'; f.min = .5; f.max = 5; f.step = .05; }
      else{ f.disabled = false; $('pdLhLbl').textContent = 'Em (pt)'; f.min = 1; f.max = 1584; f.step = .5; if(!keep && +f.value < 6) f.value = 12; }
    }
    function pdMirSync(){
      const on = $('pdMirror').checked, rtl = $('pdDir').value === 'rtl';
      $('pdLLbl').textContent = on ? 'Dentro (cm)' : rtl ? 'Antes do texto (cm)' : 'À esquerda (cm)'; $('pdRLbl').textContent = on ? 'Fora (cm)' : rtl ? 'Depois do texto (cm)' : 'À direita (cm)';
    }
    $('pdLhMode').addEventListener('change', ()=>pdLhSync(false));
    $('pdMirror').addEventListener('change', pdMirSync);
    // trocar a direção inverte o alinhamento esquerda/direita, como no Word
    $('pdDir').addEventListener('change', ()=>{ const a = $('pdAlign'); if(a.value === 'left') a.value = 'right'; else if(a.value === 'right') a.value = 'left'; pdMirSync(); });
    function openPar(){
      $('pdMsg').textContent = '';
      restore();
      const b = blocksInSel()[0]; if(!b){ alert('Clique dentro de um parágrafo e abra a caixa Parágrafo de novo.'); return; }
      const cs = getComputedStyle(b);
      const ta = cs.textAlign;
      $('pdAlign').value = ta === 'center' ? 'center' : (ta === 'right' || ta === 'end') ? 'right' : ta === 'justify' ? 'justify' : 'left';
      const rtl = cs.direction === 'rtl'; $('pdDir').value = rtl ? 'rtl' : '';
      const ml = parseFloat(rtl ? cs.marginRight : cs.marginLeft) || 0, ti = parseFloat(cs.textIndent) || 0;
      $('pdR').value = Math.max(0, cm(parseFloat(rtl ? cs.marginLeft : cs.marginRight) || 0));
      if(ti < 0){ $('pdSpec').value = 'hang'; $('pdBy').value = cm(-ti); $('pdL').value = Math.max(0, cm(ml + ti)); }
      else if(ti > 0){ $('pdSpec').value = 'first'; $('pdBy').value = cm(ti); $('pdL').value = Math.max(0, cm(ml)); }
      else { $('pdSpec').value = 'none'; $('pdBy').value = 1.25; $('pdL').value = Math.max(0, cm(ml)); }
      $('pdB').value = Math.round((parseFloat(cs.marginTop) || 0) * 0.75);
      $('pdA').value = Math.round((parseFloat(cs.marginBottom) || 0) * 0.75);
      const lh = parseFloat(cs.lineHeight), fs = parseFloat(cs.fontSize), dl = b.dataset.lh;
      if(dl === 'min' || dl === 'exact'){ $('pdLhMode').value = dl; $('pdLh').value = isFinite(lh) ? Math.round(lh * 0.75 * 10) / 10 : 12; }
      else{
        const r = isFinite(lh) && fs ? Math.round(lh / fs * 100) / 100 : 1.15;
        $('pdLhMode').value = Math.abs(r - 1) < .005 ? 'single' : Math.abs(r - 1.5) < .005 ? 'onehalf' : Math.abs(r - 2) < .005 ? 'double' : 'multi';
        $('pdLh').value = r;
      }
      pdLhSync(true);
      $('pdMirror').checked = b.dataset.espelho === '1'; pdMirSync();
      $('pdNoLn').checked = b.dataset.sln === '1';
      const dn = /^H[1-3]$/.test(b.tagName) ? b.tagName[1] : '0';
      $('pdOutline').value = b.dataset.nivel !== undefined ? b.dataset.nivel : dn;
      const st = b.style;
      $('pdWrap').value = st.whiteSpace === 'nowrap' ? 'none' : st.wordBreak === 'break-all' ? 'any' : (st.overflowWrap === 'anywhere' || st.overflowWrap === 'break-word') ? 'long' : '';
      const tw = st.getPropertyValue('text-wrap'), lb = st.getPropertyValue('line-break');
      $('pdBrk').value = tw === 'balance' ? 'balance' : tw === 'pretty' ? 'pretty' : lb === 'strict' ? 'strict' : lb === 'loose' ? 'loose' : '';
      $('pdKeep').checked = (b.style.breakAfter || b.style.pageBreakAfter) === 'avoid';
      $('pdBreak').checked = (b.style.breakBefore || b.style.pageBreakBefore) === 'page';
      $('pdNoSplit').checked = (b.style.breakInside || b.style.pageBreakInside) === 'avoid';
      $('pdWidow').checked = !(b.style.orphans === '1' || b.style.widows === '1');
      $('pdNoHyph').checked = b.style.hyphens === 'none';
      $('pdCtx').checked = b.classList.contains('ctx');
      pd.showModal();
    }
    $('pdCancel').addEventListener('click', ()=>pd.close());
    $('pdTabs').addEventListener('click', ()=>{ pd.close(); if(window.__tabDlg) window.__tabDlg(); });
    $('pdOk').addEventListener('click', ()=>{
      const L = num($('pdL'), 0), R = num($('pdR'), 0), by = num($('pdBy'), 0), B = num($('pdB'), 0), A = num($('pdA'), 0), lh = num($('pdLh'), 0);
      const mode = $('pdLhMode').value, pts = mode === 'min' || mode === 'exact';
      if(L < 0 || R < 0 || by < 0 || B < 0 || A < 0){ $('pdMsg').textContent = 'Confira os valores: recuos e espaços não podem ser negativos.'; return; }
      if(pts ? !(lh >= 1 && lh <= 1584) : !(lh >= 0.5 && lh <= 5)){ $('pdMsg').textContent = pts ? 'Em "Pelo menos" e "Exatamente", informe de 1 a 1584 pt.' : 'O espaçamento múltiplo vai de 0,5 a 5.'; return; }
      const spec = $('pdSpec').value;
      pd.close(); restore();
      blocksInSel().forEach(b=>{
        b.style.textAlign = $('pdAlign').value;
        const rtl = $('pdDir').value === 'rtl', ini = L + (spec === 'hang' ? by : 0);
        b.style.marginLeft = b.style.marginRight = '';
        b.style[rtl ? 'marginRight' : 'marginLeft'] = ini ? ini + 'cm' : '';
        b.style[rtl ? 'marginLeft' : 'marginRight'] = R ? R + 'cm' : '';
        if(rtl){ b.dir = 'rtl'; b.style.direction = 'rtl'; b.style.unicodeBidi = 'embed'; }
        else{ b.removeAttribute('dir'); b.style.direction = ''; b.style.unicodeBidi = ''; }
        if($('pdNoLn').checked) b.dataset.sln = '1'; else delete b.dataset.sln;
        b.style.textIndent = spec === 'first' ? by + 'cm' : spec === 'hang' ? -by + 'cm' : '';
        if(!/^(TD|TH)$/.test(b.tagName)){ b.style.marginTop = B + 'pt'; b.style.marginBottom = A + 'pt'; }
        if(pts){ b.style.lineHeight = lh + 'pt'; b.dataset.lh = mode; }
        else{ b.style.lineHeight = String(lh); delete b.dataset.lh; }
        if($('pdMirror').checked) b.dataset.espelho = '1'; else delete b.dataset.espelho;
        const nv = $('pdOutline').value, dn = /^H[1-3]$/.test(b.tagName) ? b.tagName[1] : '0';
        if(nv === dn) delete b.dataset.nivel; else b.dataset.nivel = nv;
        const wv = $('pdWrap').value, kv = $('pdBrk').value;
        b.style.overflowWrap = wv === 'long' ? 'anywhere' : ''; b.style.wordBreak = wv === 'any' ? 'break-all' : ''; b.style.whiteSpace = wv === 'none' ? 'nowrap' : (b.style.whiteSpace === 'nowrap' ? '' : b.style.whiteSpace);
        b.style.setProperty('line-break', kv === 'strict' || kv === 'loose' ? kv : ''); b.style.setProperty('text-wrap', kv === 'balance' || kv === 'pretty' ? kv : '');
        b.style.breakAfter = b.style.pageBreakAfter = $('pdKeep').checked ? 'avoid' : '';
        b.style.breakBefore = b.style.pageBreakBefore = $('pdBreak').checked ? 'page' : '';
        b.style.breakInside = b.style.pageBreakInside = $('pdNoSplit').checked ? 'avoid' : '';
        b.style.orphans = b.style.widows = $('pdWidow').checked ? '' : '1';
        b.style.hyphens = $('pdNoHyph').checked ? 'none' : '';
        b.classList.toggle('ctx', $('pdCtx').checked); if(!b.getAttribute('class')) b.removeAttribute('class');
        if(!b.getAttribute('style')) b.removeAttribute('style');
      });
      changed(); try{ lnRender(); }catch(e){}
    });

    // ---------- Voz e Editor (atalhos para os recursos que já existem) ----------
    ['btnDictHome', 'btnEditorHome'].forEach(id=>$(id).addEventListener('mousedown', e=>e.preventDefault()));
    $('btnDictHome').addEventListener('click', ()=>$('btnDict').click());
    $('btnEditorHome').addEventListener('click', ()=>$('btnRev').click());
    if($('btnDict').hidden) $('btnDictHome').hidden = true;
  })();


  // ================= Página Inicial: Colar Especial, Alterar Estilos e Painel de Estilos =================
  (function(){
    // Colar Especial
    async function pasteMerge(){
      restore();
      try{
        const items = await navigator.clipboard.read();
        for(const it of items){
          if(it.types.includes('text/html')){
            const h = await (await it.getType('text/html')).text();
            const doc = new DOMParser().parseFromString(h, 'text/html');
            doc.querySelectorAll('script,style,iframe,object,embed,meta,link').forEach(n=>n.remove());
            doc.querySelectorAll('*').forEach(n=>{
              ['style', 'class', 'color', 'face', 'size', 'bgcolor', 'width', 'height', 'align'].forEach(a=>n.removeAttribute(a));
              [...n.attributes].forEach(a=>{ if(/^on/i.test(a.name) || /^[\x00-\x20]*j[\t\n\r]*a[\t\n\r]*v[\t\n\r]*a[\t\n\r]*s[\t\n\r]*c[\t\n\r]*r[\t\n\r]*i[\t\n\r]*p[\t\n\r]*t[\t\n\r]*:/i.test(a.value)) n.removeAttribute(a.name); });
            });
            restore(); exec('insertHTML', doc.body.innerHTML); return;
          }
          if(it.types.includes('text/plain')){ const t = await (await it.getType('text/plain')).text(); restore(); exec('insertText', t); return; }
        }
      }catch(e){
        try{ const t = await navigator.clipboard.readText(); restore(); exec('insertText', t); }
        catch(e2){ alert('O navegador bloqueou o acesso à área de transferência. Use Ctrl+V para colar.'); }
      }
    }
    $('pasteSp').addEventListener('change', e=>{
      const v = e.target.value; e.target.selectedIndex = 0;
      if(v === 'keep') pasteFromClipboard('keep'); else if(v === 'text') pasteFromClipboard(true); else if(v === 'merge') pasteMerge();
      else if(v === 'link'){
        restore();
        (navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : Promise.reject()).then(t=>{
          t = (t || '').trim(); if(!t) return;
          const u = /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : /^(www\.)|\.[a-z]{2,}(\/|$)/i.test(t) && !/\s/.test(t) ? 'https://' + t : null;
          if(!u){ alert('O que está copiado não parece um endereço de internet.'); return; }
          const sel = getSelection().toString();
          restore(); exec('insertHTML', '<a href="' + u.replace(/"/g, '&quot;') + '">' + (sel || t).replace(/</g, '&lt;') + '</a>');
        }, ()=>alert('O navegador bloqueou o acesso à área de transferência.'));
      }
    });

    // Alterar Estilos (por documento)
    const PRE = {padrao:{f:'', hc:'', sp:'padrao'}, classico:{f:'Times New Roman', hc:'', sp:'padrao'}, moderno:{f:'Arial', hc:'#2f5496', sp:'compacto'}, elegante:{f:'Georgia', hc:'#8b1e3f', sp:'relaxado'}};
    const SP = {padrao:{lh:'1.5', pa:'8pt'}, compacto:{lh:'1', pa:'0pt'}, relaxado:{lh:'1.3', pa:'12pt'}};
    const cur = ()=>{ const d = store.docs[store.current]; return d && d.sty; };
    window.__applySty = function(){
      const st = cur(), on = st && !page.classList.contains('abnt');
      page.classList.toggle('vset', !!on);
      ['--vf', '--vlh', '--vhc', '--vpa'].forEach(k=>page.style.removeProperty(k));
      if(!page.getAttribute('style')) page.removeAttribute('style');
      if(!on) return;
      const sp = SP[st.sp] || SP.padrao;
      if(st.f) page.style.setProperty('--vf', '"' + st.f + '",Arial,sans-serif');
      if(st.hc) page.style.setProperty('--vhc', st.hc);
      page.style.setProperty('--vlh', sp.lh); page.style.setProperty('--vpa', sp.pa);
    };
    window.__styCss = function(){
      const st = cur(), xo = window.__stOvrCss ? window.__stOvrCss() : ''; if(!st || page.classList.contains('abnt')) return xo;
      const sp = SP[st.sp] || SP.padrao;
      return 'body{' + (st.f ? 'font-family:"' + st.f + '",Arial,sans-serif;' : '') + 'line-height:' + sp.lh + '}' +
        (st.hc ? 'h1,h2,h3{color:' + st.hc + '}' : '') + 'p{margin:0 0 ' + sp.pa + '}' + xo;
    };
    const dlg = $('styDlg');
    function openSty(){
      const st = cur() || PRE.padrao;
      $('syPreset').value = ''; $('syFont').value = st.f || ''; $('syColor').value = st.hc || ''; $('sySp').value = st.sp || 'padrao';
      $('syMsg').textContent = page.classList.contains('abnt') ? 'Atenção: documentos no padrão ABNT usam fonte e espaçamento fixos; estas escolhas só valem fora do ABNT.' : 'Vale para o documento todo e aparece na impressão, no PDF e no .doc/.docx. Texto com fonte escolhida à mão não muda.';
      dlg.showModal();
    }
    $('btnChgSty').addEventListener('mousedown', e=>e.preventDefault());
    $('btnChgSty').addEventListener('click', openSty);
    $('syPreset').addEventListener('change', ()=>{ const p = PRE[$('syPreset').value]; if(!p) return; $('syFont').value = p.f; $('syColor').value = p.hc; $('sySp').value = p.sp; });
    $('syCancel').addEventListener('click', ()=>dlg.close());
    function setSty(v){
      const d = store.docs[store.current]; if(!d) return;
      if(v) d.sty = v; else delete d.sty;
      window.__applySty(); persist(); updateCount();
    }
    $('syOk').addEventListener('click', ()=>{
      const v = {f:$('syFont').value, hc:$('syColor').value, sp:$('sySp').value};
      dlg.close(); setSty(!v.f && !v.hc && v.sp === 'padrao' ? null : v);
    });
    $('syReset').addEventListener('click', ()=>{ dlg.close(); setSty(null); });
    window.__setSty = setSty; window.__curSty = cur; window.__stySetters = {PRE, SP};
    $('fdDefault').addEventListener('click', ()=>{
      const f = $('fdFont').value; if(!f) return;
      if(!confirm('Usar a fonte "' + f + '" como padrão de todo este documento?')) return;
      const st = cur() || {}; $('fontDlg').close();
      setSty({f:f, hc:st.hc || '', sp:st.sp || 'padrao'});
    });

    // Painel de Estilos: abre a lista completa da galeria
    document.querySelectorAll('#toolbar .gdl[data-dlg=stylePane]').forEach(b=>{
      b.addEventListener('mousedown', e=>e.preventDefault());
      b.addEventListener('click', e=>{ e.stopPropagation(); $('galMore').click(); });
    });
  })();
