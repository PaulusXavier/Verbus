/* Verbus — Localizar e substituir avançado e funções extras de edição
   (js/localizar.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ---- Localizar e Substituir avançado: curingas, códigos especiais (^p ^t ^l …) e formatação ----
  const FBLK = 'p,h1,h2,h3,h4,h5,h6,li,td,th,div,blockquote,pre,figcaption';
  const WORDC = '\\p{L}\\p{N}_';
  let fmtF = null, fmtR = null;   // {font,size,b,i,u,s,color,hl}
  const rxEsc = c=>/[.*+?^${}()|[\]\\\/]/.test(c) ? '\\' + c : c;
  const CODE = {p:'\\n', l:'\\n', t:'\\t', '?':'[^\\n]', '#':'\\d', '$':'\\p{L}', w:'[ \\t\\u00A0]+', s:'\\u00A0', '^':'\\^'};
  function toRe(q, wild){
    let o = '';
    for(let i = 0; i < q.length; i++){
      const c = q[i];
      if(c === '^' && i + 1 < q.length && CODE[q[i + 1]]){ o += CODE[q[++i]]; continue; }
      if(!wild){ o += rxEsc(c); continue; }
      if(c === '\\' && i + 1 < q.length){ o += rxEsc(q[++i]); continue; }
      if(c === '?') o += '[^\\n]';
      else if(c === '*') o += '[^\\n]*?';
      else if(c === '<') o += '(?<![' + WORDC + '])(?=[' + WORDC + '])';
      else if(c === '>') o += '(?<=[' + WORDC + '])(?![' + WORDC + '])';
      else if(c === '@') o += '+';
      else if(c === '['){ const j = q.indexOf(']', i + 2); if(j < 0) throw new Error('classe'); let cl = q.slice(i + 1, j); if(cl[0] === '!') cl = '^' + cl.slice(1); o += '[' + cl.replace(/[\\\[]/g, '\\$&') + ']'; i = j; }
      else if(c === '{'){ const j = q.indexOf('}', i); if(j < 0) throw new Error('chave'); o += q.slice(i, j + 1); i = j; }
      else if(c === '(' || c === ')') o += c;
      else o += rxEsc(c);
    }
    return o;
  }
  function flatDoc(){
    const segs = []; let txt = '', prev = null;
    const w = document.createTreeWalker(page, NodeFilter.SHOW_TEXT); let n;
    while((n = w.nextNode())){
      const pe = n.parentElement; if(!pe || pe.closest('.pb,.sbk')) continue;
      if(!n.data.trim() && (pe === page || pe.matches('ul,ol,table,tbody,thead,tfoot,tr'))) continue;
      if(!n.data) continue;
      const blk = pe.closest(FBLK) || page;
      if(prev && blk !== prev) txt += '\n';
      segs.push({n, s:txt.length}); txt += n.data; prev = blk;
    }
    return {segs, txt};
  }
  function loc(segs, i, end){
    if(end){
      for(const k of segs){ const l = k.n.data.length; if(i > k.s && i <= k.s + l) return [k.n, i - k.s]; }
      for(const k of segs) if(k.s >= i) return [k.n, 0];
    }else{
      for(const k of segs){ const l = k.n.data.length; if(i >= k.s && i < k.s + l) return [k.n, i - k.s]; }
      for(let j = segs.length - 1; j >= 0; j--) if(segs[j].s + segs[j].n.data.length <= i) return [segs[j].n, segs[j].n.data.length];
    }
    return null;
  }
  function fmtOk(node, f){
    const el = node.nodeType === 3 ? node.parentElement : node; if(!el) return false;
    const cs = getComputedStyle(el);
    if(f.font && !cs.fontFamily.toLowerCase().includes(f.font.toLowerCase())) return false;
    if(f.size && Math.abs(parseFloat(cs.fontSize) * 0.75 - f.size) > 0.26) return false;
    if(f.b != null && (parseInt(cs.fontWeight) >= 600) !== f.b) return false;
    if(f.i != null && /italic|oblique/.test(cs.fontStyle) !== f.i) return false;
    if(f.u != null || f.s != null || f.hl != null){
      let u = false, st = false, hl = false;
      for(let e = el; e && e !== page.parentElement; e = e.parentElement){
        const c = getComputedStyle(e), td = c.textDecorationLine || '';
        if(td.includes('underline')) u = true;
        if(td.includes('line-through')) st = true;
        const bg = c.backgroundColor; if(bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg) && e !== page) hl = true;
        if(e === page) break;
      }
      if(f.u != null && u !== f.u) return false;
      if(f.s != null && st !== f.s) return false;
      if(f.hl != null && hl !== f.hl) return false;
    }
    if(f.color){ const t = document.createElement('i'); t.style.color = f.color; document.body.appendChild(t); const want = getComputedStyle(t).color; t.remove(); if(cs.color !== want) return false; }
    return true;
  }
  function matches(){
    const q = fi.value; if(!q && !fmtF) return [];
    const wild = $('fwild').checked, out = [], {segs, txt} = flatDoc();
    if(!q){   // só formatação: cada trecho de texto com o formato
      segs.forEach(k=>{ if(k.n.data.trim() && fmtOk(k.n, fmtF)){ const r = document.createRange(); r.setStart(k.n, 0); r.setEnd(k.n, k.n.data.length); out.push({r, m:[k.n.data]}); } });
      return out;
    }
    let src;
    try{
      src = toRe(q, wild);
      if(!wild && $('fword').checked) src = '(?<![' + WORDC + '])' + src + '(?![' + WORDC + '])';
      var re = new RegExp(src, 'gu' + (fcase.checked ? '' : 'i'));
    }catch(e){ $('fstat').textContent = 'Padrão inválido'; return []; }
    let m;
    while((m = re.exec(txt))){
      if(!m[0].length){ re.lastIndex++; continue; }
      const a = loc(segs, m.index, false), b = loc(segs, m.index + m[0].length, true);
      if(!a || !b) continue;
      if(fmtF && !(fmtOk(a[0], fmtF) && fmtOk(b[0], fmtF))) continue;
      const r = document.createRange(); r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]);
      if(r.collapsed) continue;
      out.push({r, m});
    }
    return out;
  }
  // realça todas as ocorrências (CSS Custom Highlight API; sem suporte, só a ocorrência atual aparece selecionada)
  function hlAll(ms){
    try{
      if(!window.CSS || !CSS.highlights || typeof Highlight === 'undefined') return;
      if(!ms.length) CSS.highlights.delete('vfindcur');
      if(!ms.length || !$('fhl').checked){ CSS.highlights.delete('vfind'); return; }
      CSS.highlights.set('vfind', new Highlight(...ms.map(m=>m.r.cloneRange())));
    }catch(e){}
  }
  function step(dir){
    const ms = matches();
    if(!ms.length){ if($('fstat').textContent !== 'Padrão inválido') $('fstat').textContent = 'Nenhum resultado'; hlAll([]); return; }
    fIdx = (fIdx + dir + ms.length) % ms.length;
    $('fstat').textContent = (fIdx + 1) + ' de ' + ms.length;
    hlAll(ms);
    const r = ms[fIdx].r, s = getSelection();
    // selecionar dentro da folha (contenteditable) rouba o foco da caixa de busca no Chrome e o resto do que se digita iria para o documento
    const ae = document.activeElement, keep = ae && ae !== page && fb.contains(ae) ? ae : null;
    s.removeAllRanges(); s.addRange(r.cloneRange());
    if(keep){
      keep.focus({preventScroll:true});
      try{ if(window.CSS && CSS.highlights && typeof Highlight !== 'undefined') CSS.highlights.set('vfindcur', new Highlight(r.cloneRange())); }catch(e){}   // a seleção some quando a caixa mantém o foco: a ocorrência atual fica em destaque
    }
    const el = r.startContainer.nodeType === 3 ? r.startContainer.parentElement : r.startContainer;
    if(el) el.scrollIntoView({block:'center'});
  }
  // expande ^& ^p ^t ^l ^s ^^ e \1..\9 (curingas) na substituição
  function expand(str, m, wild){
    let o = '';
    for(let i = 0; i < str.length; i++){
      const c = str[i];
      if(c === '^' && i + 1 < str.length){
        const d = str[i + 1];
        if(d === '&'){ o += m[0]; i++; continue; }
        if(d === 'p' || d === 'l'){ o += '\n'; i++; continue; }
        if(d === 't'){ o += '\t'; i++; continue; }
        if(d === 's'){ o += ' '; i++; continue; }
        if(d === '^'){ o += '^'; i++; continue; }
      }
      if(wild && c === '\\' && /[1-9]/.test(str[i + 1] || '')){ o += m[+str[i + 1]] || ''; i++; continue; }
      o += c;
    }
    return o;
  }
  function styleSpan(sp, f){
    if(f.font) sp.style.fontFamily = f.font;
    if(f.size) sp.style.fontSize = f.size + 'pt';
    if(f.b != null) sp.style.fontWeight = f.b ? 'bold' : 'normal';
    if(f.i != null) sp.style.fontStyle = f.i ? 'italic' : 'normal';
    const td = []; if(f.u) td.push('underline'); if(f.s) td.push('line-through');
    if(f.u != null || f.s != null) sp.style.textDecoration = td.join(' ') || 'none';
    if(f.color) sp.style.color = f.color;
    if(f.hl != null) sp.style.backgroundColor = f.hl ? '#ffff00' : 'transparent';
  }
  function fmtRange(r, f){   // aplica formato a cada trecho de texto dentro do intervalo
    const w = document.createTreeWalker(r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentNode : r.commonAncestorContainer, NodeFilter.SHOW_TEXT);
    const list = []; let n; while((n = w.nextNode())) if(r.intersectsNode(n) && n.data) list.push(n);
    list.forEach(t=>{
      let a = 0, b = t.data.length;
      if(t === r.endContainer) b = r.endOffset;
      if(t === r.startContainer) a = r.startOffset;
      if(b <= a) return;
      if(b < t.data.length) t.splitText(b);
      let mid = a > 0 ? t.splitText(a) : t;
      const sp = document.createElement('span'); mid.replaceWith(sp); sp.appendChild(mid); styleSpan(sp, f);
    });
  }
  function blockOf(n){ const e = n.nodeType === 3 ? n.parentElement : n; return e && e.closest(FBLK) || null; }
  function firstText(el){ const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); return w.nextNode(); }
  function replaceOne(mt){
    const wild = $('fwild').checked, rv = ri.value, r = mt.r;
    if(rv === '' && fmtR){ fmtRange(r, fmtR); return; }
    const txt = expand(rv, mt.m, wild);
    const sb = blockOf(r.startContainer), eb = blockOf(r.endContainer);
    const sc = r.startContainer, so = r.startOffset;
    r.deleteContents();
    if(sb && eb && sb !== eb && page.contains(eb) && !sb.contains(eb) && !eb.contains(sb)){
      while(eb.firstChild) sb.appendChild(eb.firstChild); eb.remove();
    }
    if(sc.nodeType === 3 && sc.isConnected){ r.setStart(sc, Math.min(so, sc.data.length)); r.collapse(true); }
    if(!txt) return;
    const parts = txt.split('\n');
    const made = [sb].filter(Boolean);
    parts.forEach((part, j)=>{
      if(j > 0){
        const last = r.startContainer, blk = blockOf(last);
        if(blk && page.contains(blk)){
          const r2 = document.createRange(); r2.setStart(r.startContainer, r.startOffset);
          r2.setEndAfter(blk.lastChild || blk);
          const frag = r2.extractContents(), nb = blk.cloneNode(false); nb.removeAttribute('id');
          nb.appendChild(frag); if(!nb.textContent && !nb.querySelector('img,br,table')) nb.innerHTML = '<br>';
          blk.after(nb);
          made.push(nb);
          const ft = firstText(nb);
          if(ft) r.setStart(ft, 0); else r.setStart(nb, 0);
          r.collapse(true);
        }else{ const br = document.createElement('br'); r.insertNode(br); r.setStartAfter(br); r.collapse(true); }
      }
      if(part){
        const t = document.createTextNode(part);
        if(fmtR){ const sp = document.createElement('span'); sp.appendChild(t); styleSpan(sp, fmtR); r.insertNode(sp); r.setStartAfter(sp); }
        else{ r.insertNode(t); r.setStartAfter(t); }
        r.collapse(true);
      }
    });
    made.forEach(b=>{ if(b.isConnected && !b.textContent && !b.querySelector('img,br,table')) b.innerHTML = '<br>'; });
  }
  $('btnFind').addEventListener('click', e=>{
    if(e.target.closest('.car')){ e.stopPropagation(); findMenu(); return; }
    openFind();
  });
  function findMenu(){
    const old = $('fmenu'); if(old){ old.remove(); return; }
    const r = $('btnFind').getBoundingClientRect(), m = document.createElement('div');
    m.id = 'fmenu'; m.style.left = r.left + 'px'; m.style.top = r.bottom + 2 + 'px';
    [['Localizar','Ctrl+F',()=>openFind()],['Localização Avançada…','',()=>{ openFind(); $('replIn').focus(); }],['Ir para…','Ctrl+G',()=>openGoto()]].forEach(([t,k,fn])=>{
      const b = document.createElement('button'); b.type = 'button'; b.textContent = t + (k ? '   (' + k + ')' : '');
      b.addEventListener('mousedown', ev=>ev.preventDefault());
      b.addEventListener('click', ()=>{ m.remove(); fn(); });
      m.appendChild(b);
    });
    document.body.appendChild(m);
    setTimeout(()=>document.addEventListener('click', function f(){ m.remove(); document.removeEventListener('click', f); }), 0);
  }
  window.__findMenu = findMenu;

  // Paleta de cores (cor da fonte, realce e sombreamento), como a do Word: automática, tons, padrão, recentes, mais cores
  (function(){
    const BASE = ['#ffffff','#000000','#e7e6e6','#44546a','#4472c4','#ed7d31','#a5a5a5','#ffc000','#5b9bd5','#70ad47'];
    const STD = ['#c00000','#ff0000','#ffc000','#ffff00','#92d050','#00b050','#00b0f0','#0070c0','#002060','#7030a0'];
    const recent = [];
    function mix(h, t){ const n = parseInt(h.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v=>Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t))); return '#' + c.map(v=>v.toString(16).padStart(2, '0')).join(''); }
    let only = false;
    function close(){ const o = $('cpal'); if(o) o.remove(); }
    function open(id, anchor){
      close();
      const inp = $(id), pal = document.createElement('div'); pal.id = 'cpal'; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-label', 'Paleta de cores');
      const pick = c=>{ inp.value = c; inp.dispatchEvent(new Event('input', {bubbles:true})); const k = recent.indexOf(c); if(k >= 0) recent.splice(k, 1); recent.unshift(c); if(recent.length > 10) recent.pop(); close(); };
      const act = (t, fn)=>{ const b = document.createElement('button'); b.type = 'button'; b.className = 'act'; b.textContent = t; b.addEventListener('mousedown', e=>e.preventDefault()); b.addEventListener('click', ()=>{ close(); fn(); }); pal.appendChild(b); };
      const row = (title, cols)=>{ const h = document.createElement('h4'); h.textContent = title; pal.appendChild(h); const r = document.createElement('div'); r.className = 'row'; cols.forEach(c=>{ const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.style.background = c; b.title = c.toUpperCase(); b.setAttribute('aria-label', 'Cor ' + c); b.addEventListener('mousedown', e=>e.preventDefault()); b.addEventListener('click', ()=>pick(c)); r.appendChild(b); }); pal.appendChild(r); };
      if(id === 'fore') act('Automático (preto)', ()=>pick('#000000'));
      else if(id === 'back') act('Sem cor', ()=>{ restore(); exec('hiliteColor', 'transparent'); changed(); });
      else act('Sem cor', ()=>$('shade').dispatchEvent(new Event('dblclick')));
      const h = document.createElement('h4'); h.textContent = 'Cores do tema'; pal.appendChild(h);
      const g = document.createElement('div'); g.className = 'row'; g.style.gridTemplateRows = 'repeat(6,auto)'; g.style.gridAutoFlow = 'column'; g.style.gridTemplateColumns = 'repeat(10,1fr)';
      BASE.forEach(c=>{ [0, .8, .6, .4, -.25, -.5].forEach(t=>{ const col = t === 0 ? c : mix(c, t); const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.style.background = col; b.title = col.toUpperCase(); b.setAttribute('aria-label', 'Cor ' + col); b.addEventListener('mousedown', e=>e.preventDefault()); b.addEventListener('click', ()=>pick(col)); g.appendChild(b); }); });
      pal.appendChild(g);
      row('Cores padrão', STD);
      if(recent.length) row('Cores recentes', recent);
      act('Mais cores…', ()=>{ only = true; try{ inp.showPicker ? inp.showPicker() : inp.click(); }catch(e){ inp.click(); } setTimeout(()=>only = false, 300); });
      const r = anchor.getBoundingClientRect(); pal.style.left = Math.min(r.left, innerWidth - 220) + 'px'; pal.style.top = r.bottom + 2 + 'px';
      document.body.appendChild(pal);
      setTimeout(()=>document.addEventListener('mousedown', function f(e){ if(!e.target.closest('#cpal')){ close(); document.removeEventListener('mousedown', f); } }), 0);
    }
    ['fore','back','shade'].forEach(id=>{
      const inp = $(id), dd = inp.closest('.dd');
      inp.addEventListener('click', e=>{ if(only) return; e.preventDefault(); e.stopPropagation(); open(id, dd); }, true);
      inp.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(id, dd); } });
      inp.addEventListener('mousedown', e=>{ if(!only) e.preventDefault(); });
    });
    document.addEventListener('keydown', e=>{ if(e.key === 'Escape') close(); });
  })();

  // Minibarra de ferramentas: aparece ao selecionar texto, com os comandos mais usados
  (function(){
    const bar = document.createElement('div'); bar.id = 'minibar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Minibarra de ferramentas'); bar.hidden = true;
    const items = [
      ['N','Negrito','bold','font-weight:700'],['I','Itálico','italic','font-style:italic'],['S','Sublinhado','underline','text-decoration:underline'],
      ['|'],['≡','Alinhar à esquerda','justifyLeft'],['≣','Centralizar','justifyCenter'],['☰','Justificar','justifyFull'],
      ['|'],['•','Marcadores','insertUnorderedList'],['1.','Numeração','insertOrderedList'],
      ['|'],['A▲','Aumentar fonte','#btnGrow'],['A▼','Diminuir fonte','#btnShrink'],['🖌','Pincel de Formatação','#btnPainter']
    ];
    items.forEach(it=>{
      if(it[0] === '|'){ const i = document.createElement('i'); bar.appendChild(i); return; }
      const b = document.createElement('button'); b.type = 'button'; b.textContent = it[0]; b.title = it[1]; b.setAttribute('aria-label', it[1]); if(it[3]) b.style.cssText = it[3];
      b.addEventListener('mousedown', e=>e.preventDefault());
      b.addEventListener('click', ()=>{ if(it[2][0] === '#') $(it[2].slice(1)).click(); else { page.focus(); exec(it[2]); } hide(); });
      bar.appendChild(b);
    });
    document.body.appendChild(bar);
    function hide(){ bar.hidden = true; }
    function show(){
      const s = getSelection();
      if(!s.rangeCount || s.isCollapsed || !page.contains(s.anchorNode) || !page.isContentEditable || document.body.classList.contains('hfedit')){ hide(); return; }
      const r = s.getRangeAt(0).getBoundingClientRect(); if(!r.width && !r.height){ hide(); return; }
      bar.hidden = false;
      const w = bar.offsetWidth, h = bar.offsetHeight;
      let x = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)), y = r.top - h - 8;
      if(y < 6) y = r.bottom + 8;
      bar.style.left = x + 'px'; bar.style.top = y + 'px';
    }
    page.addEventListener('mouseup', ()=>setTimeout(show, 10));
    page.addEventListener('keyup', e=>{ if(e.shiftKey && /^Arrow|Home|End/.test(e.key)) show(); else if(e.key === 'Escape') hide(); });
    page.addEventListener('keydown', e=>{ if(!e.shiftKey && !e.ctrlKey) hide(); });
    page.addEventListener('scroll', hide); document.addEventListener('scroll', hide, true);
    page.addEventListener('mousedown', hide);
  })();

  // Atalhos de teclado da Página Inicial (iguais aos do Word)
  page.addEventListener('keydown', e=>{
    if(!(e.ctrlKey || e.metaKey) && !(e.shiftKey && e.key === 'F3')) return;
    const k = e.key, sh = e.shiftKey, al = e.altKey;
    const go = fn=>{ e.preventDefault(); fn(); };
    const clickGs = id=>{ const b = document.querySelector('#gallery [data-gs=' + id + ']'); if(b) b.click(); };
    const sp = v=>{ const l = $('lh'); l.value = v; l.dispatchEvent(new Event('change')); };
    if(e.shiftKey && k === 'F3' && !e.ctrlKey){ go(()=>{ const c = $('case'); const t = getSelection().toString(); if(!t) return; c.value = t === t.toUpperCase() ? 'low' : t === t.toLowerCase() ? 'cap' : 'up'; c.dispatchEvent(new Event('change')); }); return; }
    if(!al && !sh && k === '[') go(()=>setSizePt(Math.max(1, curPt() - 1), true));
    else if(!al && !sh && k === ']') go(()=>setSizePt(Math.min(1638, curPt() + 1), true));
    else if(!al && sh && (k === 'A' || k === 'a')) go(()=>{ const c = $('case'); c.value = 'up'; c.dispatchEvent(new Event('change')); });
    else if(!al && !sh && k === ' ') go(()=>{ document.execCommand('removeFormat'); changed(); });
    else if(!al && !sh && k === '=') go(()=>{ document.execCommand('subscript'); changed(); });
    else if(!al && sh && (k === '+' || k === '=')) go(()=>{ document.execCommand('superscript'); changed(); });
    else if(!al && !sh && (k === 'm' || k === 'M')) go(()=>{ document.execCommand('indent'); changed(); });
    else if(!al && sh && (k === 'M' || k === 'm')) go(()=>{ document.execCommand('outdent'); changed(); });
    else if(!al && !sh && k === '1') go(()=>sp('1'));
    else if(!al && !sh && k === '2') go(()=>sp('2'));
    else if(!al && !sh && k === '5') go(()=>sp('1.5'));
    else if(!al && sh && (k === 'L' || k === 'l')) go(()=>document.execCommand('insertUnorderedList'));
    else if(!al && sh && (k === 'N' || k === 'n')) go(()=>clickGs('normal'));
    else if(!al && sh && (k === 'C' || k === 'c')) go(()=>$('btnPainter').click());
    else if(al && !sh && k === '1') go(()=>clickGs('h1'));
    else if(al && !sh && k === '2') go(()=>clickGs('h2'));
  });
  // Ir para (página, título, nota de rodapé, tabela, imagem)
  function openGoto(){ $('gtMsg').textContent = ''; try{ $('gotoDlg').showModal(); }catch(e){ $('gotoDlg').setAttribute('open',''); } $('gtNum').focus(); $('gtNum').select(); }
  function gotoGo(){
    const what = $('gtWhat').value, n = Math.max(1, parseInt($('gtNum').value, 10) || 1);
    let el = null;
    if(what === 'page'){
      const m = effMar(), use = Math.max(CMPX, pgOf().h * CMPX - m.t - m.b), tot = pageCount();
      if(n > tot){ $('gtMsg').textContent = 'O documento tem ' + tot + ' página(s).'; return; }
      const y = m.t + (n - 1) * use + page.getBoundingClientRect().top * 0;
      const kids = [...page.children].filter(c=>!c.classList.contains('fnotes'));
      el = kids.find(c=>c.offsetTop + c.offsetHeight > y + 1) || kids[kids.length - 1];
    }
    else if(what === 'head') el = page.querySelectorAll('h1,h2,h3')[n - 1];
    else if(what === 'fn') el = [...page.querySelectorAll('sup.fn')].filter(x=>!x.closest('.fnotes'))[n - 1];
    else if(what === 'en') el = [...page.querySelectorAll('sup.en')].filter(x=>!x.closest('.endnotes'))[n - 1];
    else if(what === 'tbx') el = page.querySelectorAll('.tbx')[n - 1];
    else if(what === 'tbl') el = page.querySelectorAll('table')[n - 1];
    else if(what === 'img') el = page.querySelectorAll('img')[n - 1];
    if(!el){ $('gtMsg').textContent = 'Não encontrado: ' + $('gtWhat').selectedOptions[0].textContent.toLowerCase() + ' ' + n + '.'; return; }
    $('gotoDlg').close();
    el.scrollIntoView({block:'start', behavior:'smooth'});
    try{ page.focus(); const r = document.createRange(); (el.tagName === 'IMG' || el.tagName === 'TABLE') ? r.selectNode(el) : r.selectNodeContents(el); if(el.tagName !== 'IMG' && el.tagName !== 'TABLE') r.collapse(true); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); }catch(x){}
  }
  $('gtOk').addEventListener('click', gotoGo);
  $('gtNum').addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); gotoGo(); } });
  $('gtClose').addEventListener('click', ()=>$('gotoDlg').close());
  document.addEventListener('keydown', e=>{ if(e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === 'g' || e.key === 'G')){ e.preventDefault(); openGoto(); } });
  $('fclose').addEventListener('click', ()=>{ fb.hidden = true; try{ CSS.highlights.delete('vfind'); CSS.highlights.delete('vfindcur'); }catch(e){} page.focus(); });
  $('fword').addEventListener('change', ()=>{ fIdx = -1; step(1); });
  $('fhl').addEventListener('change', ()=>{ fIdx = -1; step(1); });
  $('fnext').addEventListener('click', ()=>step(1));
  $('fprev').addEventListener('click', ()=>step(-1));
  fi.addEventListener('input', ()=>{ fIdx = -1; step(1); });
  fcase.addEventListener('change', ()=>{ fIdx = -1; step(1); });
  fi.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); step(e.shiftKey ? -1 : 1); } });
  $('frepl').addEventListener('click', ()=>{
    const ms = matches(); if(!ms.length) return;
    if(fIdx < 0 || fIdx >= ms.length) fIdx = 0;
    replaceOne(ms[fIdx]);
    changed(); fIdx--; step(1);
  });
  $('freplAll').addEventListener('click', ()=>{
    const ms = matches();
    for(let i = ms.length - 1; i >= 0; i--) replaceOne(ms[i]);
    $('fstat').textContent = ms.length + ' substituído(s)'; changed(); fIdx = -1; try{ CSS.highlights.delete('vfind'); CSS.highlights.delete('vfindcur'); }catch(e){}
  });
  $('fwild').addEventListener('change', ()=>{ fIdx = -1; step(1); });
  // códigos especiais
  let lastField = fi; fi.addEventListener('focus', ()=>lastField = fi); ri.addEventListener('focus', ()=>lastField = ri);
  $('fspec').addEventListener('click', e=>{
    e.stopPropagation();
    const old = $('fmenu'); if(old){ old.remove(); return; }
    const r = $('fspec').getBoundingClientRect(), m = document.createElement('div');
    m.id = 'fmenu'; m.style.left = r.left + 'px'; m.style.top = r.bottom + 2 + 'px';
    const inRepl = lastField === ri;
    const L = inRepl
      ? [['Marca de parágrafo','^p'],['Tabulação','^t'],['Quebra de linha','^l'],['Espaço não separável','^s'],['Texto localizado','^&'],['Acento circunflexo','^^']]
      : [['Marca de parágrafo','^p'],['Tabulação','^t'],['Quebra de linha','^l'],['Qualquer caractere','^?'],['Qualquer dígito','^#'],['Qualquer letra','^$'],['Espaço em branco','^w'],['Espaço não separável','^s'],['Acento circunflexo','^^']];
    L.forEach(([t,c])=>{
      const b = document.createElement('button'); b.type = 'button'; b.textContent = t + '   ' + c;
      b.addEventListener('mousedown', ev=>ev.preventDefault());
      b.addEventListener('click', ()=>{
        m.remove(); const f = lastField, a = f.selectionStart ?? f.value.length, z = f.selectionEnd ?? a;
        f.value = f.value.slice(0, a) + c + f.value.slice(z); f.focus(); f.setSelectionRange(a + c.length, a + c.length);
        if(f === fi){ fIdx = -1; step(1); }
      });
      m.appendChild(b);
    });
    document.body.appendChild(m);
    setTimeout(()=>document.addEventListener('click', function g(){ m.remove(); document.removeEventListener('click', g); }), 0);
  });
  // formato a localizar / a aplicar
  const fmDlg = $('fmtDlg'); let fmTarget = 'F';
  const SEL = {b:'fmB', i:'fmI', u:'fmU', s:'fmS', hl:'fmH'};
  function fmtSummary(f){
    if(!f) return '';
    const p = [];
    if(f.font) p.push(f.font); if(f.size) p.push(f.size + ' pt');
    [['b','negrito'],['i','itálico'],['u','sublinhado'],['s','tachado'],['hl','realce']].forEach(([k,n])=>{ if(f[k] != null) p.push((f[k] ? '' : 'sem ') + n); });
    if(f.color) p.push('cor ' + f.color);
    return p.join(', ');
  }
  function updSum(){
    const a = fmtSummary(fmtF), b = fmtSummary(fmtR);
    $('ffsum').textContent = [a && 'Localizar: ' + a, b && 'Substituir: ' + b].filter(Boolean).join(' · ');
    $('ffmtF').style.fontWeight = fmtF ? '700' : ''; $('ffmtR').style.fontWeight = fmtR ? '700' : '';
  }
  function openFmt(t){
    fmTarget = t; const f = (t === 'F' ? fmtF : fmtR) || {};
    $('fmtTitle').textContent = t === 'F' ? 'Localizar formato' : 'Formato da substituição';
    $('fmFont').value = f.font || ''; $('fmSize').value = f.size || '';
    for(const k in SEL) $(SEL[k]).value = f[k] == null ? '' : (f[k] ? '1' : '0');
    $('fmCOn').checked = !!f.color; if(f.color) $('fmColor').value = f.color;
    fmDlg.showModal();
  }
  $('ffmtF').addEventListener('click', ()=>openFmt('F'));
  $('ffmtR').addEventListener('click', ()=>openFmt('R'));
  $('fmCancel').addEventListener('click', ()=>fmDlg.close());
  $('fmClear').addEventListener('click', ()=>{ if(fmTarget === 'F') fmtF = null; else fmtR = null; updSum(); fmDlg.close(); fIdx = -1; step(1); });
  $('fmOk').addEventListener('click', ()=>{
    const f = {}, font = $('fmFont').value.trim(), size = parseFloat(($('fmSize').value || '').replace(',', '.'));
    if(font) f.font = font; if(size > 0) f.size = size;
    for(const k in SEL){ const v = $(SEL[k]).value; if(v !== '') f[k] = v === '1'; }
    if($('fmCOn').checked) f.color = $('fmColor').value;
    const v = Object.keys(f).length ? f : null;
    if(fmTarget === 'F') fmtF = v; else fmtR = v;
    updSum(); fmDlg.close(); fIdx = -1; step(1);
  });

  // Atalhos
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey){
      const k = e.key.toLowerCase();
      if(k==='f' || k==='h'){ e.preventDefault(); openFind(); if(k==='h') ri.focus(); }
      else if(k==='s'){ e.preventDefault(); fileDo(false); }
      else if('lerj'.includes(k) && k.length === 1 && page.contains(document.activeElement) && page.isContentEditable){
        e.preventDefault(); exec({l:'justifyLeft', e:'justifyCenter', r:'justifyRight', j:'justifyFull'}[k]);
      }
    }
    if(e.altKey && !e.ctrlKey && (e.key === 'q' || e.key === 'Q')){ e.preventDefault(); $('tell').focus(); }
    if(e.key==='Escape' && !fb.hidden){ fb.hidden = true; page.focus(); }
  });

  // Exportar .txt
  $('btnTxt').addEventListener('click', ()=>download(page.innerText, fileName('.txt'), 'text/plain'));

  // Ler em voz alta
  if('speechSynthesis' in window){
    $('btnSpeak').addEventListener('click', ()=>{
      const b = $('btnSpeak');
      if(speechSynthesis.speaking){ speechSynthesis.cancel(); b.classList.remove('on'); return; }
      const t = (savedRange && savedRange.toString().trim()) || page.innerText;
      if(!t.trim()) return;
      const u = new SpeechSynthesisUtterance(t); u.lang = 'pt-BR';
      u.onend = u.onerror = ()=>b.classList.remove('on');
      speechSynthesis.speak(u); b.classList.add('on');
    });
  }else{ $('btnSpeak').hidden = true; }

  // Zoom e tema
  $('zoom').addEventListener('change', e=>{ $('sheet').style.zoom = e.target.value; });
  const root = document.documentElement;
  try{ const th = localStorage.getItem(LS_KEYS.theme); if(th) root.dataset.theme = th; }catch(e){}
  $('btnTheme').addEventListener('click', ()=>{
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try{ localStorage.setItem(LS_KEYS.theme, root.dataset.theme); }catch(e){}
  });
