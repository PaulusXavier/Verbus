/* Verbus — Notas de rodapé e de fim, referências e Inserir > Páginas/Cabeçalho
   (js/notas-inserir.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ---------- Notas de rodapé (numeração automática; na tela e na impressão cada nota fica no pé da página do seu número) ----------
  const FN_NOTE = 'font-size:10pt;line-height:1.15;margin:0;padding-left:1.5em;text-indent:-1.5em;text-align:left';   // recuo deslocado (ABNT): as linhas seguintes ficam alinhadas sob a 1ª letra do texto, não sob o número
  const FN_PAD = 12, FN_LINE = 6;   // espaço acima da 1ª nota de cada página e posição do filete (px)
  const FN_SEP = 'width:5cm;border-top:1px solid #000;margin:14pt 0 6pt;height:0';
  function fnBox(create){
    let box = page.querySelector(':scope > .fnotes');
    if(!box && create){
      box = document.createElement('div'); box.className = 'fnotes';
      box.innerHTML = '<div class="fnsep" contenteditable="false" style="' + FN_SEP + '"></div>';
      page.appendChild(box);
    }
    return box;
  }
  function fnNoteHtml(id, n, text){
    return '<p class="fnote" data-id="' + id + '" style="' + FN_NOTE + '"><span class="fnn" contenteditable="false">' + n + '</span> <span class="fnt">' + (text || '<br>') + '</span></p>';
  }
  function fnRenumber(){
    const marks = [...page.querySelectorAll('sup.fn')].filter(m=>!m.closest('.fnotes'));
    let box = fnBox(false);
    if(!marks.length){ if(box) box.remove(); return; }
    box = fnBox(true);
    if(page.lastElementChild !== box) page.appendChild(box);
    const notes = new Map(); box.querySelectorAll('p.fnote').forEach(n=>{ if(!notes.has(n.dataset.id)) notes.set(n.dataset.id, n); });
    const used = new Set(), order = [];
    marks.forEach((m, i)=>{
      let id = m.dataset.id;
      if(!id || used.has(id)){            // marcador duplicado (copiar/colar): cria nova nota com o mesmo texto
        const old = notes.get(id); id = 'n' + Date.now().toString(36) + i; m.dataset.id = id;
        if(old){ const c = old.cloneNode(true); c.dataset.id = id; notes.set(id, c); }
      }
      used.add(id);
      if(m.textContent !== String(i + 1)) m.textContent = i + 1;
      let n = notes.get(id);
      if(!n){ const t = document.createElement('div'); t.innerHTML = fnNoteHtml(id, i + 1, ''); n = t.firstChild; notes.set(id, n); }
      const num = n.querySelector('.fnn'); if(num && num.textContent !== String(i + 1)) num.textContent = i + 1;
      if(n.getAttribute('style') !== FN_NOTE) n.setAttribute('style', FN_NOTE);
      order.push(n);
    });
    const cur = [...box.querySelectorAll('p.fnote')];
    if(cur.length !== order.length || cur.some((x, i)=>x !== order[i])){
      cur.forEach(x=>x.remove()); order.forEach(x=>box.appendChild(x));
    }
  }
  // O Chrome joga o número para fora do parágrafo quando o cursor está no fim dele (o número ficava sozinho numa linha): traz de volta para o fim do parágrafo
  function tuckMark(mk){
    if(!mk || (mk.parentNode !== page && !/^(TD|TH)$/.test(mk.parentNode.nodeName))) return;
    const pv = mk.previousSibling;
    if(!pv || pv.nodeType !== 1 || !/^(P|H[1-6]|BLOCKQUOTE)$/.test(pv.tagName)) return;
    const z = mk.nextSibling && mk.nextSibling.nodeType === 3 && mk.nextSibling.data === '\u200b' ? mk.nextSibling : null;
    if(pv.childNodes.length === 1 && pv.firstChild.nodeName === 'BR') pv.removeChild(pv.firstChild);
    pv.appendChild(mk); if(z) pv.appendChild(z);
  }
  function fnInsert(){
    restore();
    const t = prompt('Texto da nota de rodapé:'); if(!t || !t.trim()) return;
    const id = 'n' + Date.now().toString(36);
    const box = fnBox(true);
    const tmp = document.createElement('div'); tmp.innerHTML = fnNoteHtml(id, 0, '');
    tmp.querySelector('.fnt').textContent = t.trim(); box.appendChild(tmp.firstChild);
    restore();
    exec('insertHTML', '<sup class="fn" data-id="' + id + '" contenteditable="false">0</sup>&#8203;');
    // o cursor fica depois do número da nota, para continuar digitando
    const mk = page.querySelector('sup.fn[data-id="' + id + '"]'); tuckMark(mk);
    if(mk){
      const r = document.createRange(), nx = mk.nextSibling;
      if(nx && nx.nodeType === 3) r.setStart(nx, nx.length); else r.setStartAfter(mk);
      r.collapse(true); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r);
    }
  }
  $('btnFn').addEventListener('mousedown', e=>e.preventDefault());
  $('btnFn').addEventListener('click', fnInsert);
  page.addEventListener('keydown', e=>{ if(e.ctrlKey && e.altKey && (e.key === 'f' || e.key === 'F')){ e.preventDefault(); fnInsert(); } });
  function fnJump(el){ el.scrollIntoView({block:'center', behavior:'smooth'}); el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'), 1200); }
  page.addEventListener('click', e=>{
    const m = e.target.closest && e.target.closest('sup.fn');
    if(m && !m.closest('.fnotes')){ const n = page.querySelector('p.fnote[data-id="' + m.dataset.id + '"]'); if(n) fnJump(n); return; }
    const num = e.target.closest && e.target.closest('.fnn');
    if(num){ const n = num.closest('p.fnote'); const mk = n && [...page.querySelectorAll('sup.fn')].find(x=>x.dataset.id === n.dataset.id); if(mk) fnJump(mk); }
  });


  // ---------- Notas de fim (numeração romana, reunidas no final do documento) e navegação entre notas ----------
  const EN_NOTE = FN_NOTE;
  function roman(n){
    let r = '';
    [[1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],[40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']].forEach(a=>{ while(n >= a[0]){ r += a[1]; n -= a[0]; } });
    return r;
  }
  function enBox(create){
    let box = page.querySelector(':scope > .endnotes');
    if(!box && create){
      box = document.createElement('div'); box.className = 'endnotes';
      box.innerHTML = '<div class="fnsep" contenteditable="false" style="' + FN_SEP + '"></div>';
      page.insertBefore(box, fnBox(false) || null);     // as notas de rodapé continuam sendo o último bloco
    }
    return box;
  }
  function enNoteHtml(id, n, text){
    return '<p class="enote" data-id="' + id + '" style="' + EN_NOTE + '"><span class="enn" contenteditable="false">' + n + '</span> <span class="ent">' + (text || '<br>') + '</span></p>';
  }
  function enRenumber(){
    const marks = [...page.querySelectorAll('sup.en')].filter(m=>!m.closest('.fnotes,.endnotes'));
    let box = enBox(false);
    if(!marks.length){ if(box) box.remove(); return; }
    box = enBox(true);
    const fb = fnBox(false);
    if(fb ? box.nextElementSibling !== fb : page.lastElementChild !== box) page.insertBefore(box, fb || null);
    const notes = new Map(); box.querySelectorAll('p.enote').forEach(n=>{ if(!notes.has(n.dataset.id)) notes.set(n.dataset.id, n); });
    const used = new Set(), order = [];
    marks.forEach((m, i)=>{
      let id = m.dataset.id; const num = roman(i + 1);
      if(!id || used.has(id)){            // marcador duplicado (copiar/colar): cria nova nota com o mesmo texto
        const old = notes.get(id); id = 'e' + Date.now().toString(36) + i; m.dataset.id = id;
        if(old){ const c = old.cloneNode(true); c.dataset.id = id; notes.set(id, c); }
      }
      used.add(id);
      if(m.textContent !== num) m.textContent = num;
      let n = notes.get(id);
      if(!n){ const t = document.createElement('div'); t.innerHTML = enNoteHtml(id, num, ''); n = t.firstChild; notes.set(id, n); }
      const nn = n.querySelector('.enn'); if(nn && nn.textContent !== num) nn.textContent = num;
      if(n.getAttribute('style') !== EN_NOTE) n.setAttribute('style', EN_NOTE);
      order.push(n);
    });
    const cur = [...box.querySelectorAll('p.enote')];
    if(cur.length !== order.length || cur.some((x, i)=>x !== order[i])){
      cur.forEach(x=>x.remove()); order.forEach(x=>box.appendChild(x));
    }
  }
  function caretAfter(el){
    const r = document.createRange(), nx = el.nextSibling;
    if(nx && nx.nodeType === 3) r.setStart(nx, nx.length); else r.setStartAfter(el);
    r.collapse(true); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r);
  }
  function enInsert(){
    restore();
    if(boxOfNote(curEl())){ alert('Clique no texto do documento (fora das notas) para inserir uma nota de fim.'); return; }
    const t = prompt('Texto da nota de fim:'); if(!t || !t.trim()) return;
    const id = 'e' + Date.now().toString(36);
    const box = enBox(true);
    const tmp = document.createElement('div'); tmp.innerHTML = enNoteHtml(id, '', '');
    tmp.querySelector('.ent').textContent = t.trim(); box.appendChild(tmp.firstChild);
    restore();
    exec('insertHTML', '<sup class="en" data-id="' + id + '" contenteditable="false">i</sup>&#8203;');
    const mk = page.querySelector('sup.en[data-id="' + id + '"]'); tuckMark(mk);
    if(mk) caretAfter(mk);
  }
  function curEl(){
    const s = getSelection(); let n = s.rangeCount && page.contains(s.anchorNode) ? s.anchorNode : (savedRange && savedRange.startContainer);
    return n ? (n.nodeType === 1 ? n : n.parentElement) : null;
  }
  function boxOfNote(el){ return el && el.closest ? el.closest('p.fnote,p.enote,.fnotes,.endnotes') : null; }
  function curRange(){
    const s = getSelection();
    return s.rangeCount && page.contains(s.anchorNode) ? s.getRangeAt(0) : savedRange;
  }
  const noteMarks = k=>[...page.querySelectorAll('sup.' + k)].filter(m=>!m.closest('.fnotes,.endnotes'));
  function atMark(m, r){
    const nx = m.nextSibling;
    if(!r.collapsed) return false;
    if(r.startContainer === m.parentNode && r.startOffset === [...m.parentNode.childNodes].indexOf(m) + 1) return true;
    return !!nx && nx.nodeType === 3 && r.startContainer === nx && nx.data === '\u200b' && r.startOffset === 1;
  }
  function goNote(k, dir){
    const ms = noteMarks(k);
    if(!ms.length){ alert(k === 'fn' ? 'Não há notas de rodapé no documento.' : 'Não há notas de fim no documento.'); return; }
    const r = curRange(); let tg;
    if(!r) tg = dir > 0 ? ms[0] : ms[ms.length - 1];
    else if(dir > 0) tg = ms.find(m=>r.comparePoint(m, 0) > 0) || ms[0];
    else tg = ms.slice().reverse().find(m=>r.comparePoint(m, 0) < 0 && !atMark(m, r)) || ms[ms.length - 1];   // o número em que o cursor acabou de parar não conta como anterior
    page.focus(); caretAfter(tg); fnJump(tg);
  }
  function showNotes(){
    const el = curEl(), note = el && el.closest && el.closest('p.fnote,p.enote');
    if(note){                                  // dentro de uma nota: volta para o número no texto
      const k = note.classList.contains('fnote') ? 'fn' : 'en', mk = noteMarks(k).find(x=>x.dataset.id === note.dataset.id);
      if(mk){ page.focus(); caretAfter(mk); fnJump(mk); }
      return;
    }
    const all = noteMarks('fn').concat(noteMarks('en')).sort((a, b)=>a.compareDocumentPosition(b) & 4 ? -1 : 1);
    if(!all.length){ alert('Este documento não tem notas de rodapé nem de fim.'); return; }
    const r = curRange();
    const mk = (r && all.slice().reverse().find(m=>r.comparePoint(m, 0) < 0)) || all[0];   // a nota do número que vem antes do cursor
    const nt = page.querySelector('p.' + (mk.classList.contains('fn') ? 'fnote' : 'enote') + '[data-id="' + mk.dataset.id + '"]');
    if(!nt) return;
    const tx = nt.querySelector('.fnt,.ent');
    if(tx){ const rg = document.createRange(); rg.selectNodeContents(tx); rg.collapse(false); page.focus(); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(rg); }
    fnJump(nt);
  }
  ['btnEn', 'btnNoteShow', 'btnNoteNav'].forEach(id=>{ const b = $(id); if(b) b.addEventListener('mousedown', e=>e.preventDefault()); });
  $('btnEn').addEventListener('click', enInsert);
  $('btnNoteShow').addEventListener('click', showNotes);
  page.addEventListener('keydown', e=>{ if(e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')){ e.preventDefault(); enInsert(); } });
  page.addEventListener('click', e=>{
    const m = e.target.closest && e.target.closest('sup.en');
    if(m && !m.closest('.endnotes')){ const n = page.querySelector('p.enote[data-id="' + m.dataset.id + '"]'); if(n) fnJump(n); return; }
    const num = e.target.closest && e.target.closest('.enn');
    if(num){ const n = num.closest('p.enote'); const mk = n && noteMarks('en').find(x=>x.dataset.id === n.dataset.id); if(mk) fnJump(mk); }
  });
  (function(){
    const btn = $('btnNoteNav'); let pop = null;
    function close(){ if(pop){ pop.remove(); pop = null; } btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); }
    function outside(e){ if(pop && !pop.contains(e.target) && !btn.contains(e.target)) close(); }
    function esc(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    btn.addEventListener('click', ()=>{
      if(pop){ close(); return; }
      const items = [['Nota de rodapé seguinte', ()=>goNote('fn', 1)], ['Nota de rodapé anterior', ()=>goNote('fn', -1)], '-', ['Nota de fim seguinte', ()=>goNote('en', 1)], ['Nota de fim anterior', ()=>goNote('en', -1)]];
      pop = document.createElement('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
      items.forEach(it=>{
        if(it === '-'){ pop.appendChild(document.createElement('hr')); return; }
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = it[0];
        b.addEventListener('click', ()=>{ close(); it[1](); }); pop.appendChild(b);
      });
      pop.addEventListener('mousedown', e=>e.preventDefault());
      document.body.appendChild(pop);
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.max(4, Math.min(r.left, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.min(r.bottom + 2, innerHeight - pop.offsetHeight - 4) + 'px';
      btn.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
    });
  })();


  // ---------- Referências: botão ↘ das notas e "Mostrar Notas" acinzentado quando não há notas ----------
  (function(){
    const dlg = $('notesDlg'), show = $('btnNoteShow'); let tm = null;
    $('notesDlgOpen').addEventListener('click', ()=>dlg.showModal());
    $('notesClose').addEventListener('click', ()=>dlg.close());
    $('notesIns').addEventListener('click', ()=>{
      const k = dlg.querySelector('input[name=notesKind]:checked').value; dlg.close();
      $(k === 'en' ? 'btnEn' : 'btnFn').click();
    });
    $('notesNav').addEventListener('click', ()=>{ dlg.close(); if(!show.disabled) show.click(); });
    function sync(){ show.disabled = !page.querySelector('sup.fn, sup.en'); }
    new MutationObserver(()=>{ clearTimeout(tm); tm = setTimeout(sync, 120); }).observe(page, {childList:true, subtree:true, characterData:true});
    document.addEventListener('selectionchange', ()=>{ clearTimeout(tm); tm = setTimeout(sync, 120); });
    sync();
  })();

  // ---------- Inserir > Páginas: Folha de Rosto ▾ e Página em Branco ----------
  (function(){
    const btn = $('btnCover'); let pop = null;
    function close(){ if(pop){ pop.remove(); pop = null; } btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); }
    function outside(e){ if(pop && !pop.contains(e.target) && !btn.contains(e.target)) close(); }
    function esc(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    [btn, $('btnBlank'), $('btnPb')].forEach(b=>b.addEventListener('mousedown', e=>e.preventDefault()));
    btn.addEventListener('click', ()=>{
      if(pop){ close(); return; }
      pop = document.createElement('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
      [['Capa', 'capa'], ['Folha de rosto', 'rosto']].forEach(([t, v])=>{
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = t;
        b.addEventListener('click', ()=>{ close(); const sl = $('abntIns'); sl.value = v; sl.dispatchEvent(new Event('change', {bubbles:true})); });
        pop.appendChild(b);
      });
      pop.addEventListener('mousedown', e=>e.preventDefault());
      document.body.appendChild(pop);
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.max(4, Math.min(r.left, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.min(r.bottom + 2, innerHeight - pop.offsetHeight - 4) + 'px';
      btn.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
    });
    $('btnBlank').addEventListener('click', ()=>{ restore(); exec('insertHTML', '<div class="pb" contenteditable="false"></div><p><br></p><div class="pb" contenteditable="false"></div><p><br></p>'); });
  })();

  // ---------- Inserir: Cabeçalho ▾, Rodapé ▾, Número de Página ▾ e Símbolo ▾ ----------
  (function(){
    let pop = null, cur = null;
    function close(){ if(pop){ pop.remove(); pop = null; } if(cur){ cur.setAttribute('aria-expanded', 'false'); cur = null; } document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); }
    function outside(e){ if(pop && !pop.contains(e.target) && !(cur && cur.contains(e.target))) close(); }
    function esc(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    // itens: '-' | {h:'Título'} | {t, f, chk} | {grid:[...], f:(c)=>{}}
    function menu(btn, items){
      if(cur === btn){ close(); return; }
      close(); pop = document.createElement('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
      items.forEach(it=>{
        if(it === '-'){ pop.appendChild(document.createElement('hr')); return; }
        if(it.h){ const h = document.createElement('div'); h.className = 'mh'; h.textContent = it.h; pop.appendChild(h); return; }
        if(it.grid){
          const g = document.createElement('div'); g.className = 'symg';
          it.grid.forEach(c=>{ const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', ()=>{ close(); it.f(c); }); g.appendChild(b); });
          pop.appendChild(g); return;
        }
        const b = document.createElement('button'); b.type = 'button';
        if(it.chk !== undefined){ b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', it.chk ? 'true' : 'false'); b.innerHTML = '<span class="ck">✓</span>'; b.appendChild(document.createTextNode(it.t)); }
        else{ b.setAttribute('role', 'menuitem'); b.textContent = it.t; }
        b.addEventListener('click', ()=>{ close(); it.f(); }); pop.appendChild(b);
      });
      pop.addEventListener('mousedown', e=>e.preventDefault());
      document.body.appendChild(pop);
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.max(4, Math.min(r.left, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.max(4, Math.min(r.bottom + 2, innerHeight - pop.offsetHeight - 4)) + 'px';
      cur = btn; btn.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
    }
    const fire = (id, v)=>{ const sl = $(id); sl.value = v; sl.dispatchEvent(new Event('change', {bubbles:true})); };
    ['btnHdr', 'btnFtr', 'btnPgNum', 'btnSymb'].forEach(id=>$(id).addEventListener('mousedown', e=>e.preventDefault()));
    $('btnHdr').addEventListener('click', e=>menu(e.currentTarget, [
      {t:'Editar Cabeçalho', f:()=>{ if(window.__hfEditing && window.__hfEditing() && window.__hfClose) window.__hfClose(); window.__hfOpen('h'); }},
      {t:'Remover Cabeçalho', f:()=>fire('hfRm', 'h')}]));
    $('btnFtr').addEventListener('click', e=>menu(e.currentTarget, [
      {t:'Editar Rodapé', f:()=>{ if(window.__hfEditing && window.__hfEditing() && window.__hfClose) window.__hfClose(); window.__hfOpen('f'); }},
      {t:'Remover Rodapé', f:()=>fire('hfRm', 'f')}]));
    $('btnPgNum').addEventListener('click', e=>{
      const fm = $('pgNumFmt'), ops = [];
      ops.push({h:'Início da Página'});
      [['Esquerda', 'h:left'], ['Centralizado', 'h:center'], ['Direita', 'h:right']].forEach(([t, v])=>ops.push({t, f:()=>fire('pgNum', v)}));
      ops.push({h:'Final da Página'});
      [['Esquerda', 'f:left'], ['Centralizado', 'f:center'], ['Direita', 'f:right']].forEach(([t, v])=>ops.push({t, f:()=>fire('pgNum', v)}));
      ops.push('-', {t:'Posição Atual (no cabeçalho/rodapé aberto)', f:()=>fire('pgNum', 'cur')}, {t:'Remover Números de Página', f:()=>fire('pgNum', 'rm')}, '-', {h:'Formato do Número'});
      [...fm.options].forEach(o=>ops.push({t:o.textContent, chk:fm.value === o.value, f:()=>{ fm.value = o.value; fm.dispatchEvent(new Event('change', {bubbles:true})); }}));
      menu(e.currentTarget, ops);
    });
    $('btnSymb').addEventListener('click', e=>{
      const sl = $('symb'), ch = [...sl.options].filter(o=>o.value && o.value !== '__mais').map(o=>o.value);
      menu(e.currentTarget, [{grid:ch, f:c=>fire('symb', c)}, '-', {t:'Mais Símbolos…', f:()=>fire('symb', '__mais')}]);
    });
  })();
