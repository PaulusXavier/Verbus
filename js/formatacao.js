/* Verbus — Colar, símbolos, fonte, parágrafo, listas e bordas
   (js/formatacao.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ---------- Área de Transferência: colar, recortar, copiar ----------
  ['btnPaste','btnCut','btnCopy','btnPainter','btnGrow','btnShrink'].forEach(id=>$(id).addEventListener('mousedown', e=>e.preventDefault()));
  const NOCLIP = 'O navegador bloqueou o acesso à área de transferência. Use Ctrl+V para colar.';
  $('btnCut').addEventListener('click', ()=>{ restore(); if(!document.execCommand('cut')) alert('Selecione um trecho para recortar.'); changed(); });
  $('btnCopy').addEventListener('click', ()=>{ restore(); document.execCommand('copy'); });
  async function pasteFromClipboard(mode){      // sem argumento = só texto; 'keep' = mantém a formatação de origem
    const plain = mode !== 'keep';
    restore();
    try{
      if(navigator.clipboard && navigator.clipboard.read){
        const items = await navigator.clipboard.read();
        for(const it of items){
          const img = it.types.find(t=>t.startsWith('image/'));
          if(!plain && img && !it.types.includes('text/html')){
            const blob = await it.getType(img); restore(); window.__insImgFile(blob); return;
          }
          if(!plain && it.types.includes('text/html')){
            const h = await (await it.getType('text/html')).text(); restore(); exec('insertHTML', cleanPasted(h)); if(window.__pstShow) setTimeout(()=>window.__pstShow(h, null, 'keep'), 0); return;
          }
          if(plain && it.types.includes('text/html')){
            const h = await (await it.getType('text/html')).text();
            const t = it.types.includes('text/plain') ? await (await it.getType('text/plain')).text() : '';
            restore(); exec('insertText', htmlToPlain(h, t)); if(window.__pstShow) setTimeout(()=>window.__pstShow(h, t, 'text'), 0); return;
          }
          if(it.types.includes('text/plain')){
            const t = await (await it.getType('text/plain')).text(); restore(); exec('insertText', t); return;
          }
        }
        return;
      }
      const t = await navigator.clipboard.readText(); restore(); exec('insertText', t);
    }catch(err){
      try{ const t = await navigator.clipboard.readText(); restore(); exec('insertText', t); }
      catch(e2){ alert(NOCLIP); }
    }
  }
  $('btnPaste').addEventListener('click', ()=>pasteFromClipboard());

  // Painel da Área de Transferência: guarda o que foi copiado/recortado aqui (até 24 itens)
  const clipHist = [], clipDlg = $('clipDlg');
  function clipRender(){
    const box = $('clipList'); box.textContent = '';
    clipHist.forEach((it, i)=>{
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'listitem');
      b.textContent = it.text.length > 140 ? it.text.slice(0, 140) + '…' : it.text; b.title = 'Clique para colar';
      b.addEventListener('mousedown', e=>e.preventDefault());
      b.addEventListener('click', ()=>{ restore(); exec('insertHTML', it.html); });
      box.appendChild(b);
    });
    $('clipEmpty').hidden = clipHist.length > 0;
  }
  function clipCapture(){
    const s = getSelection(); if(!s.rangeCount || s.isCollapsed) return;
    const r = s.getRangeAt(0); if(!page.contains(r.commonAncestorContainer)) return;
    const text = s.toString().trim(); if(!text) return;
    const d = document.createElement('div'); d.appendChild(r.cloneContents());
    const html = d.innerHTML;
    const k = clipHist.findIndex(x=>x.html === html); if(k >= 0) clipHist.splice(k, 1);
    clipHist.unshift({text, html}); if(clipHist.length > 24) clipHist.pop();
    clipRender();
  }
  document.addEventListener('copy', clipCapture);
  document.addEventListener('cut', clipCapture);
  window.__openClip = ()=>{ clipRender(); if(!clipDlg.open) clipDlg.show(); };
  $('clipClose').addEventListener('click', ()=>clipDlg.close());
  // ---------- Símbolos (Inserir > Símbolos > Mais símbolos…) ----------
  const SYM = (()=>{
    return [
      ['Mais usados', 'º ª ° § © ® ™ € £ ¥ ¢ – — ‘ ’ “ ” « » … • · ² ³ ½ ¼ ¾ ± × ÷ ≠ ≤ ≥ → ✓ №'],
      ['Ordinais e frações', 'º ª ° № ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁰ ₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉ ¼ ½ ¾ ⅓ ⅔ ⅛ ⅜ ⅝ ⅞ ‰ ‱ ′ ″'],
      ['Pontuação e aspas', '– — ― ‘ ’ “ ” ‚ „ « » ‹ › … • · ¿ ¡ † ‡ ¶ § ¦   ­ ‑ ‐ ‑ ※'],
      ['Moeda e marcas', 'R$ € £ ¥ ¢ ₹ ₽ ₩ ₿ ¤ © ® ™ ℠ ℗'],
      ['Matemática', '± × ÷ ≠ ≈ ≤ ≥ < > ∞ √ ∑ ∏ ∫ ∆ π µ ¬ ∈ ∩ ∪ ⊂ ⊃ ∅ ∴ ∵ ≡ ∝ ∂ ∇ ‰ °'],
      ['Setas', '← ↑ → ↓ ↔ ↕ ⇐ ⇒ ⇔ ↩ ↪ ➔ ➜ ➤ ▶ ◀ ▲ ▼ ► ◄ ↗ ↘ ↙ ↖'],
      ['Marcas e formas', '✓ ✔ ✗ ✘ ☐ ☑ ☒ ★ ☆ ● ○ ■ □ ◆ ◇ ♥ ♦ ♠ ♣ ☎ ✉ ☺ ⚠ ✂ ♀ ♂ ♿ ⚖ ✆ ✍'],
      ['Letras maiúsculas acentuadas', 'À Á Â Ã Ä Å Æ Ç È É Ê Ë Ì Í Î Ï Ð Ñ Ò Ó Ô Õ Ö Ø Ù Ú Û Ü Ý Þ ß Œ Š Ž Ÿ'],
      ['Letras minúsculas acentuadas', 'à á â ã ä å æ ç è é ê ë ì í î ï ð ñ ò ó ô õ ö ø ù ú û ü ý þ ÿ œ š ž']
    ].map(([n, t])=>({n, c:t.split(' ').filter(Boolean)}));
  })();
  const SYMNAME = {'º':'Ordinal masculino (1º, 2º)','ª':'Ordinal feminino (1ª, 2ª)','°':'Sinal de grau','§':'Parágrafo / seção','©':'Direitos autorais','®':'Marca registrada','™':'Marca comercial','€':'Euro','£':'Libra','¥':'Iene','¢':'Centavo','–':'Travessão curto (en dash)','—':'Travessão longo (em dash)','―':'Barra horizontal','‘':'Aspa simples de abertura','’':'Aspa simples de fechamento / apóstrofo','“':'Aspas de abertura','”':'Aspas de fechamento','«':'Aspas angulares de abertura','»':'Aspas angulares de fechamento','…':'Reticências','•':'Marcador','·':'Ponto médio','²':'Sobrescrito 2 (ao quadrado)','³':'Sobrescrito 3 (ao cubo)','½':'Um meio','¼':'Um quarto','¾':'Três quartos','±':'Mais ou menos','×':'Multiplicação','÷':'Divisão','≠':'Diferente','≤':'Menor ou igual','≥':'Maior ou igual','→':'Seta para a direita','✓':'Marca de seleção','№':'Número (Nº)',' ':'Espaço sem quebra','­':'Hífen opcional','‑':'Hífen sem quebra','¶':'Marca de parágrafo','†':'Adaga','‰':'Por mil','∞':'Infinito','√':'Raiz quadrada','π':'Pi','µ':'Micro','≈':'Aproximadamente igual','R$':'Real (R$)','☎':'Telefone','✉':'Envelope','☐':'Caixa vazia','☑':'Caixa marcada','☒':'Caixa com X','★':'Estrela cheia','☆':'Estrela vazia','⚠':'Aviso','♀':'Feminino','♂':'Masculino','♿':'Acessibilidade','⚖':'Balança (justiça)','¿':'Interrogação invertida','¡':'Exclamação invertida'};
  const symDlg = $('symDlg'), symGrid = $('symGrid'), symCat = $('symCat'), symInfo = $('symInfo'), symRecent = $('symRecent');
  let symRec = []; try{ symRec = JSON.parse(localStorage.getItem(LS_KEYS.symRec) || '[]').filter(x=>typeof x === 'string').slice(0, 16); }catch(e){}
  const symLabel = ch=>{
    const cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    const shown = ch === ' ' ? '␣' : ch === '­' ? '-' : ch === '‑' ? '‑' : ch;
    return {shown, text:(SYMNAME[ch] || 'Símbolo') + '  ·  U+' + cp + (ch.length > 1 ? ' …' : '')};
  };
  const symBtn = ch=>{
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'listitem');
    const l = symLabel(ch); b.textContent = l.shown; b.title = l.text; b.setAttribute('aria-label', l.text);
    b.addEventListener('mousedown', e=>e.preventDefault());
    const info = ()=>{ symInfo.textContent = ''; const bb = document.createElement('b'); bb.textContent = l.shown; symInfo.append(bb, l.text); };
    b.addEventListener('mouseenter', info); b.addEventListener('focus', info);
    b.addEventListener('click', ()=>{
      restore(); exec('insertText', ch); info();
      symRec = [ch].concat(symRec.filter(x=>x !== ch)).slice(0, 16);
      try{ localStorage.setItem(LS_KEYS.symRec, JSON.stringify(symRec)); }catch(e){}
      symRecRender();
    });
    return b;
  };
  function symRecRender(){ symRecent.textContent = ''; symRec.forEach(ch=>symRecent.appendChild(symBtn(ch))); if(!symRec.length){ const s = document.createElement('span'); s.style.cssText = 'font-size:12px;color:var(--muted)'; s.textContent = 'Nenhum ainda.'; symRecent.appendChild(s); } }
  function symRender(){ symGrid.textContent = ''; (SYM[+symCat.value] || SYM[0]).c.forEach(ch=>symGrid.appendChild(symBtn(ch))); }
  SYM.forEach((g, i)=>{ const o = document.createElement('option'); o.value = i; o.textContent = g.n; symCat.appendChild(o); });
  symCat.addEventListener('change', symRender);
  window.__openSym = ()=>{ symRender(); symRecRender(); if(!symDlg.open) symDlg.show(); };
  $('symClose').addEventListener('click', ()=>symDlg.close());
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && symDlg.open && !e.defaultPrevented) symDlg.close(); });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && clipDlg.open && !e.defaultPrevented) clipDlg.close(); });
  $('clipClear').addEventListener('click', ()=>{ clipHist.length = 0; clipRender(); });
  $('clipAll').addEventListener('click', ()=>{ if(!clipHist.length) return; restore(); exec('insertHTML', clipHist.slice().reverse().map(x=>x.html).join('<br>')); });
  [$('clipAll'), $('clipClear')].forEach(b=>b.addEventListener('mousedown', e=>e.preventDefault()));

  // ---------- Fonte: aumentar/diminuir, efeitos, pincel ----------
  // Aplica um estilo ao trecho selecionado (via <font size=7> temporário) e mantém a seleção
  // troca <font size=7> temporário por <span>, mantendo cor, fonte e estilo que o <font> já tinha
  function fontToSpan(f){
    const sp = document.createElement('span'); sp.innerHTML = f.innerHTML;
    if(f.getAttribute('style')) sp.setAttribute('style', f.getAttribute('style'));
    if(f.color) sp.style.color = f.color;
    if(f.face) sp.style.fontFamily = f.face;
    f.replaceWith(sp); return sp;
  }
  function wrapStyle(fn, keepSel){
    if(!keepSel) restore(); else page.focus();
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, 7);
    const spans = [];
    page.querySelectorAll('font[size="7"]').forEach(f=>{
      const sp = fontToSpan(f); fn(sp); spans.push(sp);
    });
    if(spans.length){
      const r = document.createRange(); r.setStartBefore(spans[0]); r.setEndAfter(spans[spans.length - 1]);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    changed();
  }
  function setSizePt(pt, keepSel){
    wrapStyle(sp=>{ sp.style.fontSize = pt + 'pt'; sp.querySelectorAll('span').forEach(x=>x.style.fontSize = ''); }, keepSel);
    syncSize();
  }
  function selEl(){
    const s = getSelection(); if(!s.rangeCount) return page;
    const r = s.getRangeAt(0); let n = r.startContainer;
    if(n.nodeType === 1 && n.childNodes[r.startOffset] && !r.collapsed) n = n.childNodes[r.startOffset];
    while(n && n.nodeType === 1 && n.firstChild && !r.collapsed && n.firstChild.nodeType === 1) n = n.firstChild;
    if(n && n.nodeType === 3) n = n.parentNode;
    return n && page.contains(n) ? n : page;
  }
  function curPt(){ return Math.round(parseFloat(getComputedStyle(selEl()).fontSize) * 0.75 * 2) / 2; }
  function syncSize(){
    if(typingActive()) return;
    const sel = $('size'), v = String(curPt()); if(!v || v === 'NaN') return;
    if(document.activeElement !== sel) sel.value = v;
  }
  document.addEventListener('selectionchange', ()=>{ try{ syncSize(); }catch(e){} });
  const STEPS = [6,7,8,9,10,10.5,11,12,13,14,15,16,18,20,22,24,26,28,30,32,36,40,44,48,54,60,66,72,80,88,96,120,144];
  function stepSize(dir){
    const c = typingActive() ? ty.fs : curPt(); let n;
    if(dir > 0) n = STEPS.find(x=>x > c) || Math.min(c + 10, 400);
    else n = [...STEPS].reverse().find(x=>x < c) || Math.max(c - 1, 1);
    restore(); if(typingSet({fs:n})) return;
    setSizePt(n);
  }
  $('btnGrow').addEventListener('click', ()=>stepSize(1));
  $('btnShrink').addEventListener('click', ()=>stepSize(-1));
  // menu de tamanhos: mostra a lista inteira (o datalist só mostrava o valor igual ao atual)
  (function(){
    const inp = $('size'), menu = document.createElement('div');
    menu.id = 'sizeMenu'; menu.setAttribute('role', 'listbox'); document.body.appendChild(menu);
    STEPS.forEach(n=>{ const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'option'); b.dataset.v = n; b.textContent = String(n).replace('.', ','); menu.appendChild(b); });
    function open(){
      const r = inp.getBoundingClientRect();
      menu.style.left = r.left + 'px'; menu.style.top = r.bottom + 'px'; menu.style.minWidth = r.width + 'px';
      menu.style.display = 'block'; inp.setAttribute('aria-expanded', 'true');
      const cur = String(parseFloat(String(inp.value).replace(',', '.')));
      let on = null; menu.querySelectorAll('button').forEach(b=>{ const m = b.dataset.v === cur; b.classList.toggle('on', m); if(m) on = b; });
      if(on) menu.scrollTop = Math.max(0, on.offsetTop - menu.clientHeight / 2 + on.offsetHeight / 2);
    }
    function close(){ menu.style.display = 'none'; inp.setAttribute('aria-expanded', 'false'); }
    inp.addEventListener('focus', ()=>{ inp.select(); open(); });
    inp.addEventListener('click', ()=>{ if(menu.style.display === 'none') open(); });
    inp.addEventListener('keydown', e=>{ if(e.key === 'ArrowDown' && menu.style.display === 'none'){ e.preventDefault(); open(); } else if(e.key === 'Escape') close(); else if(e.key === 'Enter') close(); });
    inp.addEventListener('blur', ()=>setTimeout(close, 120));
    menu.addEventListener('mousedown', e=>e.preventDefault());
    menu.addEventListener('click', e=>{
      const b = e.target.closest('button'); if(!b) return;
      inp.value = b.dataset.v; close(); inp.dispatchEvent(new Event('change')); page.focus();
    });
    window.addEventListener('resize', close);
    document.addEventListener('scroll', e=>{ if(e.target !== menu) close(); }, true);
  })();
  page.addEventListener('keydown', e=>{
    if(e.ctrlKey && e.shiftKey && (e.key === '>' || e.key === '.')){ e.preventDefault(); stepSize(1); }
    else if(e.ctrlKey && e.shiftKey && (e.key === '<' || e.key === ',')){ e.preventDefault(); stepSize(-1); }
    else if(e.key === 'Escape' && painter){ stopPainter(); }
  });


  // ---------- Estilo de digitação: fonte/tamanho escolhidos com o cursor parado (sem seleção) valem para o que for digitado ----------
  // O navegador perde o "estilo pendente" ao mexer na barra, no Enter ou ao trocar a seleção (e volta para Calibri 11).
  // Aqui o estilo fica guardado até o usuário clicar em outro lugar ou mover o cursor com as setas.
  var ty = null;
  function typingActive(){ return !!(ty && ty.ff && ty.fs); }
  window.__tyActive = typingActive;
  function tyCaretOk(){
    const s = getSelection();
    return s.rangeCount && s.isCollapsed && page.contains(s.anchorNode) && page.isContentEditable && !document.body.classList.contains('hfedit');
  }
  function tyFam(el){ return ((getComputedStyle(el).fontFamily || '').split(',')[0] || '').replace(/["']/g, '').trim(); }
  function tyStyle(sp){
    sp.style.fontFamily = '"' + ty.ff + '",Carlito,"Liberation Serif",sans-serif';
    sp.style.fontSize = ty.fs + 'pt';
  }
  function tyMatches(el){
    if(!el) return false;
    return tyFam(el).toLowerCase() === String(ty.ff).toLowerCase() && Math.abs(parseFloat(getComputedStyle(el).fontSize) * 0.75 - ty.fs) < 0.26;
  }
  function tyShow(){
    if(!typingActive()) return;
    const f = $('font'), z = $('size');
    if(document.activeElement !== f){ const o = [...f.options].find(o=>o.value.toLowerCase() === String(ty.ff).toLowerCase()); if(o) f.value = o.value; }
    if(document.activeElement !== z) z.value = String(ty.fs);
  }
  function tyEnsure(){
    if(!typingActive() || !tyCaretOk()) return;
    const s = getSelection(), r = s.getRangeAt(0);
    const el = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
    if(!el || !page.contains(el)) return;
    const cur = el.closest('span[data-ty]');
    if(cur && page.contains(cur) && cur.textContent.replace(/​/g, '') === ''){ tyStyle(cur); return; }
    if(tyMatches(el)) return;
    const sp = document.createElement('span'); sp.dataset.ty = '1'; tyStyle(sp); sp.textContent = '​';
    r.insertNode(sp);
    const nr = document.createRange(); nr.setStart(sp.firstChild, 1); nr.collapse(true);
    s.removeAllRanges(); s.addRange(nr);    return true;
  }
  function typingSet(p){
    if(!tyCaretOk()) return false;
    if(!typingActive()){
      const el = selEl();
      ty = {ff: tyFam(el) || 'Arial', fs: curPt() || 12};
    }
    Object.assign(ty, p);
    tyEnsure(); tyShow();
    return true;
  }
  function tyCleanup(){
    const s = getSelection(), an = s.rangeCount ? s.anchorNode : null;
    if(typingActive() || !an || !page.contains(an)) return;
    page.querySelectorAll('span[data-ty]').forEach(sp=>{
      if(sp.textContent.replace(/​/g, '') !== '' || (an && sp.contains(an))) return;
      sp.remove();
    });
  }
  page.addEventListener('beforeinput', e=>{
    if(!typingActive()) return;
    if(e.inputType === 'insertText' && e.data){ if(tyEnsure()){ e.preventDefault(); document.execCommand('insertText', false, e.data); } }
    else if(e.inputType === 'insertCompositionText') tyEnsure();
  });
  page.addEventListener('input', e=>{
    if(!typingActive()) return;
    if(e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak'){ tyEnsure(); return; }
    if(e.isComposing) return;
    const s = getSelection(), n = s.rangeCount ? s.anchorNode : null;
    if(n && n.nodeType === 3 && n.data.length > 1 && n.data.charCodeAt(0) === 0x200B && n.parentElement && n.parentElement.closest('span[data-ty]')) n.deleteData(0, 1);
  });
  page.addEventListener('mousedown', ()=>{ ty = null; setTimeout(()=>{ try{ tyCleanup(); syncSize(); }catch(_){} }, 0); });
  page.addEventListener('touchstart', ()=>{ ty = null; }, {passive:true});
  page.addEventListener('keydown', e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key)) ty = null;
  });
  document.addEventListener('selectionchange', ()=>{
    try{ tyCleanup(); }catch(_){}
    if(typingActive()) setTimeout(tyShow, 90);
  });

  const FX = {
    shadow:  {textShadow:'2px 2px 3px rgba(0,0,0,.5)', webkitTextStroke:''},
    outline: {textShadow:'', webkitTextStroke:'1px currentColor', color:'transparent'},
    glow:    {textShadow:'0 0 6px #4aa3ff, 0 0 12px #4aa3ff', webkitTextStroke:''},
    emboss:  {textShadow:'1px 1px 0 #fff, -1px -1px 0 rgba(0,0,0,.45)', webkitTextStroke:''},
    none:    {textShadow:'', webkitTextStroke:''}
  };
  $('fx').addEventListener('change', e=>{
    const fx = FX[e.target.value]; e.target.selectedIndex = 0; if(!fx) return;
    restore(); const keepPt = curPt(), basePt = Math.round(parseFloat(getComputedStyle(page).fontSize) * 0.75 * 2) / 2;
    wrapStyle(sp=>{
      sp.querySelectorAll('span').forEach(x=>{ x.style.textShadow = ''; x.style.webkitTextStroke = ''; });
      sp.style.textShadow = fx.textShadow || ''; sp.style.webkitTextStroke = fx.webkitTextStroke || '';
      if(fx.color) sp.style.color = fx.color;
      if(keepPt !== basePt) sp.style.fontSize = keepPt + 'pt';
    });
  });


  // ---------- Parágrafo: listas, classificar, marcas, sombreamento, bordas ----------
  ['btnMulti','btnSort','btnMarks'].forEach(id=>$(id).addEventListener('mousedown', e=>e.preventDefault()));
  const BLK = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,td,th,div';
  // Envolve em <p> o texto solto no topo da página (primeira linha digitada sem parágrafo)
  function wrapLoose(){
    const INL = n=>n.nodeType === 3 || (n.nodeType === 1 && !n.matches('p,h1,h2,h3,h4,h5,h6,ul,ol,table,blockquote,div,hr,pre'));
    const s = getSelection(); let r = s.rangeCount ? s.getRangeAt(0) : null;
    const sC = r && r.startContainer, sO = r && r.startOffset, eC = r && r.endContainer, eO = r && r.endOffset;
    let n = page.firstChild, did = false;
    while(n){
      if(INL(n)){
        const p = document.createElement('p'); page.insertBefore(p, n);
        let m = n; while(m && INL(m)){ const nx = m.nextSibling; p.appendChild(m); m = nx; }
        did = true; n = p.nextSibling;
      } else n = n.nextSibling;
    }
    if(did && r){
      try{
        const nr = document.createRange();
        if(sC === page) nr.setStartBefore(page.firstChild); else nr.setStart(sC, sO);
        if(eC === page) nr.setEndAfter(page.lastChild); else nr.setEnd(eC, eO);
        s.removeAllRanges(); s.addRange(nr);
      }catch(e){}
    }
  }
  function blocksInSel(){
    wrapLoose();
    const s = getSelection(); if(!s.rangeCount) return [];
    const r = s.getRangeAt(0);
    let list = [...page.querySelectorAll(BLK)].filter(b=>!b.querySelector(BLK) && r.intersectsNode(b) && !b.closest('.hf'));
    if(!list.length){ const b = selEl().closest(BLK); if(b && page.contains(b)) list = [b]; }
    return list;
  }
  function closestList(tag){ const l = selEl().closest(tag || 'ul,ol'); return l && page.contains(l) ? l : null; }
  function ensureList(kind){
    let l = closestList(kind);
    if(!l){ exec(kind === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'); l = closestList(kind); }
    return l;
  }
  $('ulStyle').addEventListener('change', e=>{
    let v = e.target.value; e.target.selectedIndex = 0; restore();
    if(v === '__new'){
      const c = [...(prompt('Digite o símbolo do marcador (ex.: ★ ♦ ► ✔ •):') || '').trim()].slice(0, 2).join('');
      if(!c) return; v = '"' + c.replace(/["\\]/g, '') + ' "';
    }
    const l = ensureList('ul'); if(!l) return;
    l.style.listStyleType = v; changed();
  });
  $('olStyle').addEventListener('change', e=>{
    const v = e.target.value; e.target.selectedIndex = 0; restore();
    if(v === '__fmt'){ openNf(); return; }
    if(v === '__val'){ openNv(); return; }
    if(v === '__lvl'){ openNl(); return; }
    const l = ensureList('ol'); if(!l) return;
    window.__mlStrip && window.__mlStrip(l); [...l.classList].forEach(c=>{ if(c.startsWith('nf-')) l.classList.remove(c); }); l.style.removeProperty('--pre'); l.style.removeProperty('--suf');
    l.style.listStyleType = v; if(l.getAttribute('type')) l.removeAttribute('type'); changed();
  });

  // ---------- Numeração: novo formato, valor inicial e nível da lista ----------
  const TYPE_ATTR = {'decimal':'1', 'decimal-leading-zero':'1', 'lower-alpha':'a', 'upper-alpha':'A', 'lower-roman':'i', 'upper-roman':'I'};
  const toRoman = n=>{ let r = ''; [[1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],[40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']].forEach(([v, t])=>{ while(n >= v){ r += t; n -= v; } }); return r; };
  function sample(t, n){
    return t === 'decimal-leading-zero' ? String(n).padStart(2, '0') : t === 'lower-alpha' ? String.fromCharCode(96 + n) : t === 'upper-alpha' ? String.fromCharCode(64 + n)
      : t === 'lower-roman' ? toRoman(n) : t === 'upper-roman' ? toRoman(n).toUpperCase() : String(n);
  }
  const liNow = ()=>{
    let li = selEl().closest('li');
    if(!li){   // cursor na borda da lista (ex.: depois do último item): usa o item vizinho
      const sl = getSelection(), n = sl.rangeCount ? sl.anchorNode : null;
      if(n && n.nodeType === 1 && /^(OL|UL)$/.test(n.tagName)){ const c = n.childNodes[sl.anchorOffset - 1] || n.childNodes[sl.anchorOffset]; if(c && c.tagName === 'LI'){ li = c; sl.collapse(li, li.childNodes.length); } }
    }
    return li && page.contains(li) ? li : null;
  };
  function olNow(){
    const li = liNow(); let l = li && li.closest('ol'); if(l && !page.contains(l)) l = null;
    return l;
  }
  const cssStr = t=>'"' + t.replace(/[\\"\n]/g, '') + '"';
  const nf = $('nfDlg');
  function nfPrev(){
    const t = $('nfType').value, pre = $('nfPre').value, suf = $('nfSuf').value;
    $('nfPrev').textContent = [1, 2, 3].map(n=>pre + sample(t, n) + suf).join('   ');
  }
  function openNf(){
    let l = olNow(); if(!l){ exec('insertOrderedList'); l = olNow(); } if(!l) return;
    const cur = [...l.classList].find(c=>c.startsWith('nf-'));
    const ty = cur ? cur.slice(3) : (l.style.listStyleType || 'decimal');
    $('nfType').value = TYPE_ATTR[ty] ? ty : 'decimal';
    const g = k=>{ const v = l.style.getPropertyValue(k).trim(); return v ? v.replace(/^"|"$/g, '') : null; };
    $('nfPre').value = cur ? (g('--pre') || '') : ''; $('nfSuf').value = cur ? (g('--suf') === null ? '.' : g('--suf')) : '.';
    nfPrev(); nf.showModal();
  }
  ['nfType','nfPre','nfSuf'].forEach(id=>$(id).addEventListener('input', nfPrev));
  $('nfCancel').addEventListener('click', ()=>nf.close());
  $('nfOk').addEventListener('click', ()=>{
    nf.close(); restore();
    const l = olNow(); if(!l) return;
    const t = $('nfType').value;
    window.__mlStrip && window.__mlStrip(l); [...l.classList].forEach(c=>{ if(c.startsWith('nf-')) l.classList.remove(c); });
    l.classList.add('nf-' + t);
    l.style.setProperty('--pre', cssStr($('nfPre').value)); l.style.setProperty('--suf', cssStr($('nfSuf').value));
    l.style.listStyleType = t === 'decimal-leading-zero' ? 'decimal-leading-zero' : t;
    l.setAttribute('type', TYPE_ATTR[t]);   // nos arquivos exportados o número cai no tipo padrão (1, a, A, i, I)
    changed();
  });

  const nv = $('nvDlg');
  function openNv(){
    const li = liNow(); if(!li){ alert('Clique em um item de uma lista numerada e tente de novo.'); return; }
    const l = li.closest('ol'); if(!l){ alert('Este item não está em uma lista numerada.'); return; }
    const prev = l.previousElementSibling && l.previousElementSibling.tagName === 'OL' ? l.previousElementSibling : null;
    nv._li = li; $('nvCont').disabled = !prev; $('nvNew').checked = true;
    const idx = [...l.children].filter(x=>x.tagName === 'LI').indexOf(li), st = parseInt(l.getAttribute('start') || '1', 10) || 1;
    $('nvVal').value = st + idx;
    $('nvMsg').textContent = prev ? '' : 'Não há lista numerada logo antes desta para continuar.';
    nv.showModal();
  }
  $('nvCancel').addEventListener('click', ()=>nv.close());
  function setStart(l, n){
    if(l.classList.contains('ml')) l.style.counterReset = 'ml ' + (n - 1);
    if(n === 1 && !l.classList.contains('ml')) l.removeAttribute('start'); else l.setAttribute('start', String(n));
  }
  $('nvOk').addEventListener('click', ()=>{
    const cont = $('nvCont').checked, n = parseInt($('nvVal').value, 10);
    if(!cont && !(n >= 1 && n <= 9999)){ $('nvMsg').textContent = 'Informe um valor de 1 a 9999.'; return; }
    nv.close(); restore();
    if(nv._li && page.contains(nv._li)){ getSelection().collapse(nv._li, nv._li.childNodes.length); }
    const li = liNow(); if(!li) return; let l = li.closest('ol'); if(!l) return;
    const items = [...l.children].filter(x=>x.tagName === 'LI'), idx = items.indexOf(li);
    if(idx > 0){
      // o item e os seguintes viram uma nova lista, como no Word
      const nl = l.cloneNode(false); nl.removeAttribute('start'); nl.style.counterReset = '';
      items.slice(idx).forEach(x=>nl.appendChild(x));
      l.parentNode.insertBefore(nl, l.nextSibling); l = nl;
    }
    if(cont){
      const prev = l.previousElementSibling && l.previousElementSibling.tagName === 'OL' ? l.previousElementSibling : null;
      if(prev){
        const cnt = [...prev.children].filter(x=>x.tagName === 'LI').length, ps = parseInt(prev.getAttribute('start') || '1', 10) || 1;
        setStart(l, ps + cnt);
      }
    }else setStart(l, n);
    changed();
  });

  const nl = $('nlDlg');
  const depthOf = li=>{ let d = 0, n = li.parentElement; while(n && n !== page){ if(n.tagName === 'UL' || n.tagName === 'OL') d++; n = n.parentElement; } return d; };
  function openNl(){
    const li = liNow(); if(!li){ alert('Clique em um item de lista e tente de novo.'); return; }
    nl._li = li; $('nlLvl').value = String(Math.min(9, Math.max(1, depthOf(li)))); $('nlMsg').textContent = ''; nl.showModal();
  }
  $('nlCancel').addEventListener('click', ()=>nl.close());
  $('nlOk').addEventListener('click', ()=>{
    const target = parseInt($('nlLvl').value, 10);
    nl.close(); restore();
    if(nl._li && page.contains(nl._li)){ getSelection().collapse(nl._li, nl._li.childNodes.length); }   // o item que estava ativo ao abrir a caixa
    let li = liNow(); if(!li) return;
    for(let guard = 0; guard < 12; guard++){
      li = liNow(); if(!li) break;
      const cur = depthOf(li); if(cur === target) break;
      exec(cur < target ? 'indent' : 'outdent');
      const l2 = liNow(); if(!l2 || depthOf(l2) === cur) break;
    }
    changed();
  });
  // biblioteca de listas de vários níveis (os números vêm de contadores CSS, por nível)
  (function(){
    const F = {
      jur:['"Art. " counter(p1) ". "', '"§ " counter(p2) "º "', 'counter(p3,upper-roman) " – "', 'counter(p4,lower-alpha) ") "'],
      out:['counter(p1,upper-roman) ". "', 'counter(p2,upper-alpha) ". "', 'counter(p3) ". "', 'counter(p4,lower-alpha) ". "'],
      par:['counter(p1) ") "', 'counter(p2,lower-alpha) ") "', 'counter(p3,lower-roman) ") "', 'counter(p4) ") "'],
      alf:['counter(p1) ". "', 'counter(p2,lower-alpha) ". "', 'counter(p3,lower-roman) ". "', 'counter(p4) ". "'],
      bul:['"● "', '"○ "', '"■ "', '"– "']
    };
    let css = '';
    Object.keys(F).forEach(k=>{
      const b = '#page ol.mp-' + k, lv = [b + ' > li', b + ' ol > li', b + ' ol ol > li', b + ' ol ol ol > li'], ol = [b, b + ' ol', b + ' ol ol', b + ' ol ol ol'];
      css += b + ',' + b + ' ol{list-style:none;padding-left:0}' + b + ' ol{padding-left:1.6em}' + b + ' li{display:block}';
      for(let i = 0; i < 4; i++) css += ol[i] + '{counter-reset:p' + (i + 1) + '}' + lv[i] + '{counter-increment:p' + (i + 1) + '}' + lv[i] + '::before{content:' + F[k][i] + '}';
    });
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    window.__mlStrip = l=>{ l.classList.remove('ml'); [...l.classList].forEach(c=>{ if(c.startsWith('mp-')) l.classList.remove(c); }); };
    $('mlStyle').addEventListener('change', e=>{
      const v = e.target.value; e.target.selectedIndex = 0; restore();
      let l = closestList('ol');
      if(!l){ if(v === 'none') return; exec('insertOrderedList'); l = closestList('ol'); }
      if(!l) return;
      let top = l; while(top.parentNode && top.parentNode.closest && top.parentNode.closest('ol') && page.contains(top.parentNode.closest('ol'))) top = top.parentNode.closest('ol');
      window.__mlStrip(top); [...top.classList].forEach(c=>{ if(c.startsWith('nf-')) top.classList.remove(c); });
      top.style.listStyleType = ''; top.style.removeProperty('--pre'); top.style.removeProperty('--suf'); top.removeAttribute('type');
      if(v === 'num') top.classList.add('ml'); else if(v !== 'none') top.classList.add('mp-' + v);
      if(!top.getAttribute('class')) top.removeAttribute('class');
      changed();
    });
  })();
  $('btnMulti').addEventListener('click', ()=>{
    restore();
    let l = closestList('ol');
    if(!l){ exec('insertOrderedList'); l = closestList('ol'); }
    if(!l) return;
    let top = l; while(top.parentNode && top.parentNode.closest && top.parentNode.closest('ol') && page.contains(top.parentNode.closest('ol'))) top = top.parentNode.closest('ol');
    const had = top.classList.contains('ml'); window.__mlStrip(top); if(!had) top.classList.add('ml'); top.style.listStyleType = ''; if(!top.getAttribute('class')) top.removeAttribute('class'); changed();
  });
  page.addEventListener('keydown', e=>{
    if(e.key !== 'Tab') return;
    const li = selEl().closest('li'); if(!li || !page.contains(li)) return;
    e.preventDefault(); exec(e.shiftKey ? 'outdent' : 'indent');
  });
  function cellMove(td, back){
    const table = td.closest('table'); if(!table) return;
    const cells = ()=>[...table.querySelectorAll('td, th')].filter(c=>c.closest('table') === table);
    let all = cells(), i = all.indexOf(td) + (back ? -1 : 1);
    if(i < 0) return;
    if(i >= all.length){   // última célula: Tab cria uma nova linha (como no Word)
      const last = all[all.length - 1].parentNode, n = last.cloneNode(true);
      n.querySelectorAll('td, th').forEach(x=>{ x.innerHTML = '<br>'; });
      last.parentNode.insertBefore(n, last.nextSibling); changed(); all = cells();
    }
    const c = all[i], r = document.createRange(), sl = getSelection();
    r.selectNodeContents(c); if(!c.textContent.trim() && !c.querySelector('img')) r.collapse(true);
    sl.removeAllRanges(); sl.addRange(r);
  }
  // Tabulação (passo 1): Tab fora de listas e tabelas insere um caractere de tabulação; paradas padrão a cada 1,25 cm (como no Word)
  page.addEventListener('keydown', e=>{
    if(e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
    const el = selEl(); if(!el || !page.contains(el) || el.closest('li')) return;
    const cell = el.closest('td, th');
    if(cell){ e.preventDefault(); cellMove(cell, e.shiftKey); return; }   // na tabela: Tab vai para a próxima célula, Shift+Tab para a anterior
    e.preventDefault(); if(e.shiftKey) return;
    exec('insertHTML', '<span class="tb">&#9;</span>');
  });

  let sortAsc = true;
  $('btnSort').addEventListener('click', ()=>{
    restore();
    let bl = blocksInSel().filter(b=>!/^(TD|TH)$/.test(b.tagName));
    if(bl.length < 2){ alert('Selecione dois ou mais parágrafos (ou itens de lista) para classificar.'); return; }
    const par = bl[0].parentNode;
    if(!bl.every(b=>b.parentNode === par)){ alert('Selecione parágrafos ou itens do mesmo nível.'); return; }
    const mark = document.createComment('s'); par.insertBefore(mark, bl[0]);
    const key = b=>b.textContent.trim();
    bl.sort((a,b)=>(sortAsc ? 1 : -1) * key(a).localeCompare(key(b), 'pt-BR', {sensitivity:'base', numeric:true}));
    bl.forEach(b=>par.insertBefore(b, mark)); mark.remove();
    sortAsc = !sortAsc; $('btnSort').textContent = sortAsc ? 'A↓Z' : 'Z↓A'; changed();
  });

  $('btnMarks').addEventListener('click', ()=>{ $('btnMarks').classList.toggle('on', page.classList.toggle('marks')); });
  page.addEventListener('keydown', e=>{ if(e.ctrlKey && e.shiftKey && (e.key === '*' || e.key === '8')){ e.preventDefault(); $('btnMarks').click(); } });

  $('shade').addEventListener('input', e=>{
    const v = e.target.value; restore();
    blocksInSel().forEach(b=>{ b.style.backgroundColor = v; }); changed();
  });
  $('shade').addEventListener('dblclick', ()=>{ restore(); blocksInSel().forEach(b=>{ b.style.backgroundColor = ''; if(!b.getAttribute('style')) b.removeAttribute('style'); }); changed(); });
  // ---------- Bordas (como no Word): bordas externas/internas, diagonais, linha horizontal e caixa Bordas e Sombreamento ----------
  const SIDE_CSS = {top:'borderTop', bottom:'borderBottom', left:'borderLeft', right:'borderRight'};
  const isCell = b=>/^(TD|TH)$/.test(b.tagName);
  const DIAG = {dd:'linear-gradient(to top right,transparent calc(50% - .6px),COLOR,transparent calc(50% + .6px))', du:'linear-gradient(to bottom right,transparent calc(50% - .6px),COLOR,transparent calc(50% + .6px))'};
  // vizinho selecionado de um bloco: dentro de tabelas pelas células, fora delas pelos parágrafos seguidos
  function hasNb(set, b, side){
    if(isCell(b)){
      const row = b.parentElement, idx = b.cellIndex; let c = null;
      if(side === 'top') c = row.previousElementSibling && row.previousElementSibling.cells[idx];
      else if(side === 'bottom') c = row.nextElementSibling && row.nextElementSibling.cells[idx];
      else if(side === 'left') c = row.cells[idx - 1];
      else c = row.cells[idx + 1];
      return !!c && set.has(c);
    }
    if(side === 'top') return !!b.previousElementSibling && set.has(b.previousElementSibling);
    if(side === 'bottom') return !!b.nextElementSibling && set.has(b.nextElementSibling);
    return false;
  }
  const bdLine = o=>o.w + 'pt ' + o.st + ' ' + o.c;
  const BD0 = {w:1, st:'solid', c:'#000000'};
  function clearBorders(b){
    ['borderTop','borderBottom','borderLeft','borderRight'].forEach(k=>b.style[k] = '');
    if(isCell(b)) b.style.border = ''; else b.style.border = '';
    if(b.style.backgroundImage.includes('gradient')) b.style.backgroundImage = '';
  }
  function setDiag(b, which, on, o){
    const bg = b.style.backgroundImage, f = {dd:/to (top right|right top)/.test(bg), du:/to (bottom right|right bottom)/.test(bg)};
    f[which] = on;
    const g = ['dd','du'].filter(k=>f[k]).map(k=>DIAG[k].replace('COLOR', o.c));
    if(g.length) b.style.backgroundImage = g.join(','); else b.style.removeProperty('background-image');
  }
  // spec: {top,bottom,left,right (bordas externas), ih, iv, dd, du} (true = aplicar)
  function applyBorders(list, spec, o){
    const set = new Set(list), line = bdLine(o || BD0);
    list.forEach(b=>{
      ['top','bottom','left','right'].forEach(sd=>{
        if(spec[sd] && !hasNb(set, b, sd)) b.style[SIDE_CSS[sd]] = line;
      });
      if(spec.ih){ if(hasNb(set, b, 'bottom')) b.style.borderBottom = line; if(hasNb(set, b, 'top')) b.style.borderTop = line; }
      if(spec.iv){ if(hasNb(set, b, 'right')) b.style.borderRight = line; if(hasNb(set, b, 'left')) b.style.borderLeft = line; }
      if(spec.dd) setDiag(b, 'dd', true, o || BD0);
      if(spec.du) setDiag(b, 'du', true, o || BD0);
      if(!isCell(b) && (b.style.borderTop || b.style.borderBottom || b.style.borderLeft || b.style.borderRight) && !b.style.padding) b.style.padding = '2px 6px';
    });
  }
  // já tem a borda pedida em todos os blocos? (botão liga/desliga como no Word)
  function hasSpec(list, v){
    const set = new Set(list);
    const has = (b, sd)=>!!b.style[SIDE_CSS[sd]] && b.style[SIDE_CSS[sd]] !== 'none';
    return list.every(b=>{
      if(v === 'dd') return /to (top right|right top)/.test(b.style.backgroundImage);
      if(v === 'du') return /to (bottom right|right bottom)/.test(b.style.backgroundImage);
      if(v === 'ih') return (!hasNb(set, b, 'bottom') || has(b, 'bottom'));
      if(v === 'iv') return (!hasNb(set, b, 'right') || has(b, 'right'));
      return hasNb(set, b, v) || has(b, v);
    }) && list.some(b=>{
      if(v === 'dd' || v === 'du') return true;
      if(v === 'ih') return hasNb(set, b, 'bottom');
      if(v === 'iv') return hasNb(set, b, 'right');
      return !hasNb(set, b, v);
    });
  }
  function unsetSpec(list, v){
    const set = new Set(list);
    list.forEach(b=>{
      if(v === 'dd' || v === 'du'){ setDiag(b, v, false, BD0); return; }
      if(v === 'ih'){ if(hasNb(set, b, 'bottom')) b.style.borderBottom = ''; if(hasNb(set, b, 'top')) b.style.borderTop = ''; return; }
      if(v === 'iv'){ if(hasNb(set, b, 'right')) b.style.borderRight = ''; if(hasNb(set, b, 'left')) b.style.borderLeft = ''; return; }
      if(!hasNb(set, b, v)) b.style[SIDE_CSS[v]] = '';
    });
  }
  function tidy(list){ list.forEach(b=>{ if(!b.getAttribute('style')) b.removeAttribute('style'); }); }
  $('bord').addEventListener('change', e=>{
    const v = e.target.value; e.target.selectedIndex = 0; restore();
    if(v === 'dlg'){ openBd(); return; }
    if(v === 'hr'){
      exec('insertHTML', '<hr style="border:0;border-top:1px solid #000;margin:.6em 0"><p><br></p>'); return;
    }
    const list = blocksInSel(); if(!list.length) return;
    if(v === 'none'){ list.forEach(b=>{ clearBorders(b); if(!isCell(b)) b.style.padding = ''; }); tidy(list); changed(); return; }
    if(v === 'all') applyBorders(list, {top:1, bottom:1, left:1, right:1, ih:1, iv:1});
    else if(v === 'box') applyBorders(list, {top:1, bottom:1, left:1, right:1});
    else if(v === 'inside') applyBorders(list, {ih:1, iv:1});
    else if(hasSpec(list, v)) unsetSpec(list, v);
    else applyBorders(list, {[v]:1});
    tidy(list); changed();
  });

  // Bordas e Sombreamento…
  const bd = $('bdDlg'), bdSides = {top:false, bottom:false, left:false, right:false};
  function bdPrev(){
    const o = {w:+$('bdWidth').value, st:$('bdStyle').value, c:$('bdColor').value}, box = $('bdBox');
    ['top','bottom','left','right'].forEach(sd=>{ box.style[SIDE_CSS[sd]] = bdSides[sd] ? bdLine({w:Math.max(o.w, o.st === 'double' ? 2.25 : 0), st:o.st, c:o.c}) : '1px dotted #ccc'; });
    const g = [$('bdDD').checked && DIAG.dd, $('bdDU').checked && DIAG.du].filter(Boolean).map(x=>x.replace('COLOR', o.c));
    box.style.backgroundImage = g.join(','); box.style.backgroundColor = $('bdNoFill').checked ? '#fff' : $('bdFill').value;
    bd.querySelectorAll('[data-side]').forEach(b=>b.classList.toggle('on', bdSides[b.dataset.side]));
  }
  function openBd(){
    const list = blocksInSel(); if(!list.length){ alert('Clique dentro de um parágrafo ou selecione células e tente de novo.'); return; }
    const b = list[0], cs = getComputedStyle(b);
    ['top','bottom','left','right'].forEach(sd=>{ const k = SIDE_CSS[sd]; bdSides[sd] = !!b.style[k] && b.style[k] !== 'none' && parseFloat(cs[k + 'Width']) > 0; });
    const first = ['top','bottom','left','right'].find(sd=>bdSides[sd]);
    if(first){
      const k = SIDE_CSS[first], w = Math.round(parseFloat(cs[k + 'Width']) * 0.75 * 100) / 100;
      const opts = [...$('bdWidth').options].map(x=>+x.value), near = opts.reduce((a, c)=>Math.abs(c - w) < Math.abs(a - w) ? c : a, 1);
      $('bdWidth').value = String(near); $('bdStyle').value = ['solid','dashed','dotted','double','groove','ridge'].includes(cs[k + 'Style']) ? cs[k + 'Style'] : 'solid';
      const m = (cs[k + 'Color'].match(/\d+/g) || [0,0,0]).slice(0,3); $('bdColor').value = '#' + m.map(n=>(+n).toString(16).padStart(2,'0')).join('');
    }else{ $('bdWidth').value = '1'; $('bdStyle').value = 'solid'; $('bdColor').value = '#000000'; }
    $('bdIH').checked = list.some(x=>hasNb(new Set(list), x, 'bottom') && x.style.borderBottom);
    $('bdIV').checked = list.some(x=>hasNb(new Set(list), x, 'right') && x.style.borderRight);
    $('bdDD').checked = /to (top right|right top)/.test(b.style.backgroundImage); $('bdDU').checked = /to (bottom right|right bottom)/.test(b.style.backgroundImage);
    const bg = cs.backgroundColor, bm = bg.match(/\d+(\.\d+)?/g) || [];
    const clear = !bm.length || (bm.length > 3 && +bm[3] === 0);
    $('bdNoFill').checked = clear;
    if(!clear) $('bdFill').value = '#' + bm.slice(0,3).map(n=>(+n).toString(16).padStart(2,'0')).join('');
    $('bdApply').textContent = 'Aplicar a: ' + (isCell(b) ? 'célula(s) selecionada(s)' : list.length > 1 ? list.length + ' parágrafos selecionados' : 'parágrafo atual') + (list.length < 2 ? ' (as bordas internas só valem com mais de um parágrafo ou célula)' : '');
    bdPrev(); bd.showModal();
  }
  bd.querySelectorAll('[data-side]').forEach(b=>b.addEventListener('click', ()=>{ bdSides[b.dataset.side] = !bdSides[b.dataset.side]; bdPrev(); }));
  bd.querySelectorAll('[data-set]').forEach(b=>b.addEventListener('click', ()=>{
    const m = b.dataset.set;
    ['top','bottom','left','right'].forEach(sd=>bdSides[sd] = m !== 'none');
    $('bdIH').checked = $('bdIV').checked = m === 'all';
    if(m === 'none'){ $('bdDD').checked = $('bdDU').checked = false; }
    bdPrev();
  }));
  ['bdStyle','bdColor','bdWidth','bdDD','bdDU','bdFill','bdNoFill','bdIH','bdIV'].forEach(id=>$(id).addEventListener('input', bdPrev));
  $('bdFill').addEventListener('input', ()=>{ $('bdNoFill').checked = false; bdPrev(); });
  $('bdCancel').addEventListener('click', ()=>bd.close());
  $('bdOk').addEventListener('click', ()=>{
    const o = {w:+$('bdWidth').value, st:$('bdStyle').value, c:$('bdColor').value};
    if(o.st === 'double') o.w = Math.max(o.w, 2.25);
    bd.close(); restore();
    const list = blocksInSel(); if(!list.length) return;
    list.forEach(clearBorders);
    applyBorders(list, {top:bdSides.top, bottom:bdSides.bottom, left:bdSides.left, right:bdSides.right, ih:$('bdIH').checked, iv:$('bdIV').checked, dd:$('bdDD').checked, du:$('bdDU').checked}, o);
    list.forEach(b=>{
      if($('bdNoFill').checked) b.style.backgroundColor = ''; else b.style.backgroundColor = $('bdFill').value;
      if(!['top','bottom','left','right'].some(sd=>b.style[SIDE_CSS[sd]]) && !isCell(b)) b.style.padding = '';
    });
    tidy(list); changed();
  });

  // Pincel de Formatação
  let painter = null;
  function stopPainter(){ painter = null; document.body.classList.remove('painting'); $('btnPainter').classList.remove('on'); }
  function grabFormat(){
    const cs = getComputedStyle(selEl());
    const fam = (cs.fontFamily.split(',')[0] || '').replace(/["']/g,'').trim();
    const bg = cs.backgroundColor;
    return {
      bold: parseInt(cs.fontWeight, 10) >= 600 || cs.fontWeight === 'bold',
      italic: cs.fontStyle === 'italic',
      underline: cs.textDecorationLine.includes('underline'),
      strike: cs.textDecorationLine.includes('line-through'),
      sup: cs.verticalAlign === 'super', sub: cs.verticalAlign === 'sub',
      fam, pt: curPt(), color: cs.color,
      bg: (!bg || bg === 'transparent' || /rgba\(.*,\s*0\)$/.test(bg)) ? null : bg
    };
  }
  function applyFormat(f){
    page.focus();
    const st = (c, want)=>{ let cur = false; try{ cur = document.queryCommandState(c); }catch(e){} if(cur !== want) document.execCommand(c, false, null); };
    document.execCommand('styleWithCSS', false, false);
    st('bold', f.bold); st('italic', f.italic); st('underline', f.underline); st('strikeThrough', f.strike);
    st('superscript', f.sup); st('subscript', f.sub);
    if(f.fam) document.execCommand('fontName', false, f.fam);
    document.execCommand('foreColor', false, f.color);
    document.execCommand('hiliteColor', false, f.bg || 'transparent');
    if(f.pt) setSizePt(f.pt, true);
    refresh(); changed();
  }
  $('btnPainter').addEventListener('click', ()=>{
    if(painter){ stopPainter(); return; }
    if(!savedRange){ alert('Clique no texto cuja formatação você quer copiar e depois no Pincel.'); return; }
    restore();
    painter = {fmt: grabFormat(), sticky: false};
    document.body.classList.add('painting'); $('btnPainter').classList.add('on');
  });
  $('btnPainter').addEventListener('dblclick', ()=>{ if(painter) painter.sticky = true; });
  page.addEventListener('mouseup', ()=>{
    if(!painter) return;
    setTimeout(()=>{
      const s = getSelection();
      if(!painter || !s.rangeCount || s.isCollapsed || !page.contains(s.anchorNode)) return;
      applyFormat(painter.fmt);
      if(!painter.sticky) stopPainter();
    }, 0);
  });

  // Comandos de voz = atalhos do Word (só valem se a frase inteira for o comando)
  let voiceCmdOn = true; try{ voiceCmdOn = localStorage.getItem(LS_KEYS.voicecmd) !== '0'; }catch(e){}
  const VCMD = [
    [['desfazer','control z','controle z','ctrl z'], ()=>exec('undo')],
    [['refazer','control y','controle y','ctrl y'], ()=>exec('redo')],
    [['negrito','control b','controle b','ctrl b'], ()=>exec('bold')],
    [['itálico','italico','control i','controle i','ctrl i'], ()=>exec('italic')],
    [['sublinhado','sublinhar','control u','controle u','ctrl u'], ()=>exec('underline')],
    [['copiar','control c','controle c','ctrl c'], ()=>{ restore(); document.execCommand('copy'); }],
    [['recortar','cortar','control x','controle x','ctrl x'], ()=>{ restore(); document.execCommand('cut'); changed(); }],
    [['colar','control v','controle v','ctrl v'], ()=>$('btnPaste').click()],
    [['selecionar tudo','seleciona tudo','control a','controle a','ctrl a'], ()=>{ page.focus(); document.execCommand('selectAll'); }],
    [['salvar','control s','controle s','ctrl s'], ()=>fileDo(false)],
    [['localizar','procurar','control f','controle f','ctrl f'], ()=>openFind()],
    [['imprimir','control p','controle p','ctrl p'], ()=>window.print()],
    [['centralizar','control e','controle e','ctrl e'], ()=>exec('justifyCenter')],
    [['justificar','control j','controle j','ctrl j'], ()=>exec('justifyFull')],
    [['alinhar à esquerda','alinhar a esquerda','control l','controle l','ctrl l'], ()=>exec('justifyLeft')],
    [['alinhar à direita','alinhar a direita','control r','controle r','ctrl r'], ()=>exec('justifyRight')],
    [['novo parágrafo','novo paragrafo','nova linha','enter'], ()=>exec('insertParagraph')]
  ];
  const norm = t=>t.toLowerCase().replace(/[.,;:!?]/g, '').replace(/^(comando|atalho)\s+/, '').replace(/\s+/g, ' ').trim();
  function runVoiceCmd(t){
    const n = norm(t);
    for(const [names, fn] of VCMD){
      if(names.includes(n)){ restore(); fn(); return true; }
    }
    return false;
  }
  (function(){
    const b = $('btnVoiceCmd'); if(!b) return;
    const paint = ()=>{ b.classList.toggle('on', voiceCmdOn); b.setAttribute('aria-pressed', voiceCmdOn ? 'true' : 'false'); };
    b.addEventListener('mousedown', e=>e.preventDefault());
    b.addEventListener('click', ()=>{ voiceCmdOn = !voiceCmdOn; try{ localStorage.setItem(LS_KEYS.voicecmd, voiceCmdOn ? '1' : '0'); }catch(e){} paint(); });
    paint();
  })();

  // Ditar por voz
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(SR){
    let rec = null;
    $('btnDict').addEventListener('click', ()=>{
      const b = $('btnDict');
      if(rec){ rec.stop(); return; }
      rec = new SR(); rec.lang = 'pt-BR'; rec.continuous = true;
      rec.onresult = ev=>{
        for(let i = ev.resultIndex; i < ev.results.length; i++){
          if(!ev.results[i].isFinal) continue;
          const txt = ev.results[i][0].transcript.trim();
          if(voiceCmdOn && runVoiceCmd(txt)) continue;
          restore(); exec('insertText', txt + ' ');
        }
      };
      rec.onend = rec.onerror = ()=>{ rec = null; b.classList.remove('on'); };
      rec.start(); b.classList.add('on');
    });
  }else{ $('btnDict').hidden = true; if($('btnVoiceCmd')) $('btnVoiceCmd').hidden = true; }
