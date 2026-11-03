/* Verbus — Cabeçalho e rodapé (edição), lista de fontes, número de página, opções de colagem e atualização automática
   (js/cabecalho.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   Reconstruído a partir da v66 (index.html monolítico), com as chaves de armazenamento portadas para LS_KEYS. */
  // ---------- Cabeçalho e rodapé: edição ----------
  (function(){
    const body = document.body, bar = $('hfbar'), sheet = $('sheet');
    const els = {h:$('hdr'), f:$('ftr')}, bs = {h:els.h.querySelector('.hfb'), f:els.f.querySelector('.hfb')};
    let active = 'h', timer;
    const editing = ()=>body.classList.contains('hfedit');
    function goBtn(){ $('hfGoH').classList.toggle('on', active === 'h'); $('hfGoF').classList.toggle('on', active === 'f'); }
    function open(k){
      if(!editing()){
        body.classList.add('hfedit'); page.contentEditable = 'false'; bar.hidden = false;
        ['h','f'].forEach(x=>{ bs[x].contentEditable = 'true'; bs[x].innerHTML = hfData()[x]; bs[x].dataset.v = hfData()[x]; });
        hfRender();
      }
      active = k; goBtn(); const b = bs[k]; b.focus(); syncFont(); syncPos();
      const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
      const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r);
      b.scrollIntoView({block:'nearest'});
    }
    function close(){
      if(!editing()) return;
      clearTimeout(timer); store_();
      closeMenu(); body.classList.remove('hfedit'); bar.hidden = true; page.contentEditable = 'true';
      ['h','f'].forEach(x=>{ bs[x].contentEditable = 'false'; });
      applyMar(); page.focus();
    }
    function store_(){
      const hh = hfData();
      ['h','f'].forEach(x=>{
        const c = bs[x].cloneNode(true); c.querySelectorAll('.fld').forEach(sp=>{ sp.textContent = '#'; sp.removeAttribute('contenteditable'); });
        const v = c.innerHTML.replace(/^(<br>)+|(<br>)+$/g, ''); hh[x] = hfTokens(v).some(t=>typeof t === 'string' ? t.trim() : !t.br) ? v : '';
      });
      persist(); applyMar();
    }
    function later(){ clearTimeout(timer); timer = setTimeout(store_, 400); }
    ['h','f'].forEach(k=>{
      bs[k].addEventListener('focus', ()=>{ active = k; goBtn(); });
      bs[k].addEventListener('input', later);
      bs[k].addEventListener('paste', e=>{
        e.preventDefault();
        const cd = e.clipboardData, imgs = [];
        [...(cd.items || [])].forEach(it=>{ if(it.kind === 'file' && /^image\//.test(it.type)){ const f = it.getAsFile(); if(f) imgs.push(f); } });
        const txt = (cd.getData('text/plain') || '').replace(/\r/g, '');
        if(txt.trim() || !imgs.length){
          txt.replace(/\n+$/, '').split('\n').forEach((ln, i)=>{ if(i) document.execCommand('insertLineBreak'); if(ln) document.execCommand('insertText', false, ln); });
          later();
        }
        active = k; imgs.forEach(f=>{ if(window.__insImgFile) window.__insImgFile(f); });
      });
      bs[k].addEventListener('keydown', e=>{
        if(e.key === 'Escape'){ e.preventDefault(); close(); return; }
        if((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && /^[biu]$/i.test(e.key)){ e.preventDefault(); toggle(e.key.toLowerCase()); }
        // tamanho da fonte: Ctrl+Shift+> / < e Ctrl+] / [ (como na Página Inicial)
        if((e.ctrlKey || e.metaKey) && !e.altKey){
          const up = e.key === ']' || (e.shiftKey && (e.key === '>' || e.key === '.')), dn = e.key === '[' || (e.shiftKey && (e.key === '<' || e.key === ','));
          if(up || dn){ e.preventDefault(); e.stopPropagation(); stepFs(up ? 1 : -1); }
        }
      });
    });
    function ins(html){ bs[active].focus(); document.execCommand('insertHTML', false, html); later(); }
    const fld = f=>'<span class="fld" data-f="' + f + '" contenteditable="false">' + (f === 'pages' ? pageCount() : active === 'h' ? 1 : pageCount()) + '</span>&#8203;';
    bar.querySelectorAll('button').forEach(b=>b.addEventListener('mousedown', e=>e.preventDefault()));
    // ---- menus da guia (modelos de cabeçalho/rodapé, número de página, data, informações) ----
    const fldK = (f, k)=>'<span class="fld" data-f="' + f + '" contenteditable="false">' + (f === 'pages' ? pageCount() : k === 'h' ? 1 : pageCount()) + '</span>&#8203;';
    const docTitle = ()=>esc(($('title').value || '').trim() || 'Documento sem título');
    // troca o conteúdo de uma caixa (k) inteira e o alinhamento dela
    function setBox(k, html, al){
      open(k); bs[k].innerHTML = html; hfData()[k + 'a'] = al || 'left'; bs[k].style.textAlign = al || 'left';
      store_(); syncFont(); syncPos();
      const r = document.createRange(); r.selectNodeContents(bs[k]); r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r);
    }
    // acrescenta um campo (número de página) ao fim da caixa, no alinhamento escolhido
    function addTo(k, html, al){
      const had = bs[k].textContent.replace(/\u200b/g, '').trim();
      setBox(k, had ? bs[k].innerHTML + '<br>' + html : html, al);
    }
    const dataExt = ()=>dataLongaBR();
    function closeMenu(){ const m = $('hfmenu'); if(m){ m.remove(); } }
    function showMenu(anchor, items){
      const old = $('hfmenu'); if(old){ const same = old.dataset.for === anchor.id; old.remove(); if(same) return; }
      const m = document.createElement('div'); m.id = 'hfmenu'; m.dataset.for = anchor.id; m.setAttribute('role', 'menu');
      items.forEach(it=>{
        if(it === '-'){ m.appendChild(document.createElement('hr')); return; }
        if(it.h){ const h = document.createElement('h5'); h.textContent = it.h; m.appendChild(h); return; }
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = it.t;
        b.addEventListener('mousedown', e=>e.preventDefault());
        b.addEventListener('click', ()=>{ closeMenu(); it.fn(); });
        m.appendChild(b);
      });
      const r = anchor.getBoundingClientRect(); m.style.left = Math.max(4, Math.min(r.left, innerWidth - 250)) + 'px'; m.style.top = r.bottom + 2 + 'px';
      bar.appendChild(m);
      setTimeout(()=>document.addEventListener('mousedown', function f(e){ if(!e.target.closest('#hfmenu')){ closeMenu(); document.removeEventListener('mousedown', f); } }), 0);
    }
    const pgXY = k=>'Página ' + fldK('page', k) + ' de ' + fldK('pages', k);
    $('hfMenuH').addEventListener('click', e=>showMenu(e.currentTarget, [
      {h:'Cabeçalho'},
      {t:'Em Branco', fn:()=>setBox('h', '', 'left')},
      {t:'Título do documento (centralizado)', fn:()=>setBox('h', docTitle(), 'center')},
      {t:'Título do documento (à esquerda)', fn:()=>setBox('h', docTitle(), 'left')},
      {t:'Título e data (à direita)', fn:()=>setBox('h', docTitle() + '<br>' + dataExt(), 'right')},
      {t:'Página X de Y (à direita)', fn:()=>setBox('h', pgXY('h'), 'right')},
      '-', {t:'Remover Cabeçalho', fn:()=>setBox('h', '', 'left')}
    ]));
    $('hfMenuF').addEventListener('click', e=>showMenu(e.currentTarget, [
      {h:'Rodapé'},
      {t:'Em Branco', fn:()=>setBox('f', '', 'left')},
      {t:'Página X de Y (centralizado)', fn:()=>setBox('f', pgXY('f'), 'center')},
      {t:'Página X (à direita)', fn:()=>setBox('f', 'Página ' + fldK('page', 'f'), 'right')},
      {t:'Título do documento (à esquerda)', fn:()=>setBox('f', docTitle(), 'left')},
      {t:'Título e Página X de Y (à direita)', fn:()=>setBox('f', docTitle() + '<br>' + pgXY('f'), 'right')},
      '-', {t:'Remover Rodapé', fn:()=>setBox('f', '', 'left')}
    ]));
    const num = (k, al)=>()=>addTo(k, fldK('page', k), al);
    $('hfMenuN').addEventListener('click', e=>showMenu(e.currentTarget, [
      {h:'Início da Página'},
      {t:'Número simples, à esquerda', fn:num('h', 'left')}, {t:'Número simples, centralizado', fn:num('h', 'center')}, {t:'Número simples, à direita', fn:num('h', 'right')},
      {h:'Fim da Página'},
      {t:'Número simples, à esquerda', fn:num('f', 'left')}, {t:'Número simples, centralizado', fn:num('f', 'center')}, {t:'Número simples, à direita', fn:num('f', 'right')},
      {t:'Página X de Y, centralizado', fn:()=>addTo('f', pgXY('f'), 'center')}, {t:'Página X de Y, à direita', fn:()=>addTo('f', pgXY('f'), 'right')},
      {h:'Posição Atual'},
      {t:'Inserir número de página no cursor', fn:()=>ins(fld('page'))},
      '-',
      {t:'Remover Números de Página', fn:()=>{
        ['h', 'f'].forEach(k=>{
          bs[k].innerHTML = bs[k].innerHTML.replace(/P[áa]gina\s*<span[^>]*data-f="page"[^>]*>.*?<\/span>(?:&#8203;|\u200b)?(?:\s*de\s*<span[^>]*data-f="pages"[^>]*>.*?<\/span>(?:&#8203;|\u200b)?)?/g, '');
          bs[k].querySelectorAll('.fld').forEach(x=>x.remove());
        });
        later(); store_();
      }}
    ]));
    $('hfMenuI').addEventListener('click', e=>showMenu(e.currentTarget, [
      {t:'Título do documento', fn:()=>ins(docTitle())},
      {t:'Número da página', fn:()=>ins(fld('page'))},
      {t:'Total de páginas', fn:()=>ins(fld('pages'))},
      {t:'Página X de Y', fn:()=>ins(pgXY(active))}
    ]));
    $('hfDate').addEventListener('click', e=>showMenu(e.currentTarget, [
      {t:new Date().toLocaleDateString('pt-BR') + '  (dd/mm/aaaa)', fn:()=>ins(new Date().toLocaleDateString('pt-BR'))},
      {t:dataExt(), fn:()=>ins(dataExt())},
      {t:new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) + '  (hora)', fn:()=>ins(new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}))},
      {t:'Data e hora', fn:()=>ins(new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}))}
    ]));
    // posição: distância do cabeçalho/rodapé à borda do papel (cm)
    function syncPos(){
      const e = effMar(), r = v=>Math.round(v / CMPX * 100) / 100;
      $('hfDt').value = r(hfDist(true, e)); $('hfDb').value = r(hfDist(false, e));
    }
    [['hfDt', 'dt'], ['hfDb', 'db']].forEach(([id, k])=>$(id).addEventListener('change', ev=>{
      const v = parseFloat(String(ev.target.value).replace(',', '.'));
      if(v >= 0 && v <= 10) hfData()[k] = v; else delete hfData()[k];
      persist(); applyMar(); syncPos();
    }));
    $('hfShow').addEventListener('change', ev=>body.classList.toggle('hfnotext', !ev.target.checked));
    $('tab-hf').addEventListener('click', ()=>{ bs[active].focus(); });
    document.querySelectorAll('#tabs [role=tab]').forEach(t=>t.addEventListener('click', ()=>{ if(editing()) close(); }));
    bar.querySelectorAll('[data-ha]').forEach(b=>b.addEventListener('click', ()=>{
      hfData()[active + 'a'] = b.dataset.ha; bs[active].style.textAlign = b.dataset.ha; bs[active].focus(); later();
    }));
    let saved = null;                                        // último trecho selecionado dentro da caixa (a seleção some quando o foco vai para o campo de tamanho)
    const inside = g=>g.rangeCount && bs[active].contains(g.anchorNode) && bs[active].contains(g.focusNode);
    const ctl = ()=>['hfFont', 'hfSize', 'hfColor'].includes(document.activeElement && document.activeElement.id);
    const inBox = viaCtl=>{
      if(!editing()) return false; const g = getSelection();
      if(inside(g) && !g.isCollapsed) return true;
      return !!((viaCtl || ctl()) && saved && bs[active].contains(saved.commonAncestorContainer));
    };
    function volta(){ bs[active].focus(); if(saved && !(inside(getSelection()) && !getSelection().isCollapsed)){ const g = getSelection(); g.removeAllRanges(); g.addRange(saved); } }
    function syncFont(){
      let sy = hfStyle(active);
      if(inBox()){
        const g = getSelection(); let el0 = g.anchorNode.nodeType === 1 ? (g.anchorNode.childNodes[g.anchorOffset] || g.anchorNode) : g.anchorNode; if(el0.nodeType !== 1) el0 = el0.parentElement; const cs = getComputedStyle(el0);
        const fam = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim(), rgb = cs.color.match(/\d+/g) || [0, 0, 0];
        const st = c=>{ try{ return document.queryCommandState(c); }catch(e){ return false; } };
        sy = {ff:fam || sy.ff, fs:Math.round(parseFloat(cs.fontSize) * 0.75 * 2) / 2, b:st('bold'), i:st('italic'), u:st('underline'), c:'#' + rgb.slice(0, 3).map(n=>(+n).toString(16).padStart(2, '0')).join('')};
      }
      const f = $('hfFont');
      if(![...f.options].some(o=>o.value === sy.ff)){ const o = document.createElement('option'); o.textContent = sy.ff; f.appendChild(o); }
      f.value = sy.ff; $('hfSize').value = sy.fs; $('hfColor').value = sy.c || '#000000';
      $('hfB').classList.toggle('on', sy.b); $('hfI').classList.toggle('on', sy.i); $('hfU').classList.toggle('on', sy.u);
      const h = bs[active].innerHTML; $('hfHint').hidden = !(hfRich(active, h) && hfHasFld(active, h));
    }
    function setSt(ch){ hfStyleSet(active, ch); persist(); hfRender(); applyMar(); syncFont(); }
    // com texto selecionado a formatação vale só para o trecho; sem seleção vale para a caixa inteira
    function runCmd(c, v){ volta(); document.execCommand('styleWithCSS', false, true); document.execCommand(c, false, v || null); later(); syncFont(); }
    function runSize(pt){
      volta(); document.execCommand('styleWithCSS', false, false); document.execCommand('fontSize', false, '7');
      const novos = [...bs[active].querySelectorAll('font[size="7"]')].map(f=>{
        const sp = document.createElement('span'); sp.style.fontSize = pt + 'pt';
        while(f.firstChild) sp.appendChild(f.firstChild); f.replaceWith(sp);
        sp.querySelectorAll('[style]').forEach(x=>x.style.removeProperty('font-size')); return sp;
      });
      if(novos.length){ const r = document.createRange(); r.setStartBefore(novos[0]); r.setEndAfter(novos[novos.length - 1]); const g = getSelection(); g.removeAllRanges(); g.addRange(r); }
      later(); syncFont();
    }
    function toggle(x){
      if(inBox()){ runCmd({b:'bold', i:'italic', u:'underline'}[x]); return; }
      const sy = hfStyle(active); setSt({[x]: !sy[x]}); bs[active].focus();
    }
    $('hfFont').addEventListener('change', e=>{ if(inBox(true)) runCmd('fontName', e.target.value); else{ setSt({ff:e.target.value}); bs[active].focus(); } });
    const aplicaSize = (ev, final)=>{ const v = parseFloat(String(ev.target.value).replace(',', '.')); if(!(v >= 6 && v <= 48)){ if(final) syncFont(); return; } if(inBox(true)) runSize(v); else setSt({fs:v}); };
    $('hfSize').addEventListener('change', e=>aplicaSize(e, true));
    $('hfSize').addEventListener('input', e=>aplicaSize(e, false));          // vale já ao digitar ou usar as setinhas, sem precisar de Enter
    $('hfSize').addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); aplicaSize(e, true); volta(); } });
    function stepFs(d){
      const cur = parseFloat(String($('hfSize').value).replace(',', '.')) || 10;
      const v = Math.max(6, Math.min(48, Math.round((cur + d) * 2) / 2));
      $('hfSize').value = v; if(inBox(true)) runSize(v); else setSt({fs:v});
    }
    $('hfGrow').addEventListener('click', ()=>stepFs(1));
    $('hfShrink').addEventListener('click', ()=>stepFs(-1));
    $('hfColor').addEventListener('input', e=>{ if(!inBox(true)) setSt({c:e.target.value}); });
    $('hfColor').addEventListener('change', e=>{ if(inBox(true)) runCmd('foreColor', e.target.value); });
    ['B','I','U'].forEach(x=>$('hf' + x).addEventListener('click', ()=>toggle(x.toLowerCase())));
    bs.h.addEventListener('focus', syncFont); bs.f.addEventListener('focus', syncFont);
    document.addEventListener('selectionchange', ()=>{
      if(!editing()) return; const g = getSelection();
      if(inside(g)){ saved = g.isCollapsed ? null : g.getRangeAt(0).cloneRange(); }
      if(!ctl()) syncFont();
    });
    $('hfGoH').addEventListener('click', ()=>open('h'));
    $('hfGoF').addEventListener('click', ()=>open('f'));
    $('hfPrev').addEventListener('click', ()=>open('h'));
    $('hfNext').addEventListener('click', ()=>open('f'));
    $('hfTabAl').addEventListener('click', ()=>ins('\t\t'));
    $('hfMenuQ').addEventListener('click', e=>showMenu(e.currentTarget, [
      {h:'Peças Rápidas'},
      {t:'Título do documento', fn:()=>ins(docTitle())},
      {t:'Página X de Y (centralizado)', fn:()=>addTo(active, pgXY(active), 'center')},
      {t:'Título à esquerda, página à direita', fn:()=>ins(docTitle() + '\t\tPágina ' + fld('page'))},
      {t:'Data por extenso', fn:()=>ins(dataExt())}
    ]));
    $('hfDif').addEventListener('change', e=>{ hfData().dif = e.target.checked; persist(); applyMar(); });
    $('hfClose').addEventListener('click', close);
    $('btnHF').addEventListener('click', ()=>editing() ? close() : open('h'));
    page.addEventListener('mousedown', ()=>{ if(editing()) close(); });
    document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && editing()) close(); });
    // clique duplo na margem superior/inferior abre o cabeçalho/rodapé
    sheet.addEventListener('dblclick', e=>{
      if(editing()) return;
      const r = sheet.getBoundingClientRect(), sc = sheet.offsetWidth ? r.width / sheet.offsetWidth : 1, y = (e.clientY - r.top) / sc;
      const cs = getComputedStyle(page), pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
      if(y < pt) open('h'); else if(y > sheet.offsetHeight - pb) open('f');
    });
    window.__hfClose = close; window.__hfIns = ins;
    window.__hfActive = ()=>active; window.__hfOpen = open; window.__hfEditing = editing;
  })();


  // ---------- Lista de fontes (como no Word): cada nome na própria fonte, recentes no topo, mostra a fonte do cursor ----------
  (function(){
    const sel = document.getElementById('font'); if(!sel) return;
    const BASE = ['Calibri','Calibri Light','Cambria','Arial','Times New Roman','Georgia','Verdana','Tahoma','Trebuchet MS','Palatino Linotype','Garamond','Courier New','Consolas'];
    const MAIS = ['Arial Narrow','Arial Black','Book Antiqua','Bookman Old Style','Calibri Light','Cambria Math','Candara','Century Gothic','Century Schoolbook','Comic Sans MS','Constantia','Corbel','Franklin Gothic Medium','Impact','Lucida Console','Lucida Sans Unicode','Segoe UI','Segoe UI Light','Sylfaen','Times','Helvetica','Carlito','Liberation Serif','Liberation Sans','Noto Sans','Noto Serif','Roboto','Open Sans'];
    const cv = document.createElement('canvas').getContext('2d'), T = 'mmmmmmmmmmlliWWW áçãõ 0123';
    const w = f=>{ cv.font = '72px ' + f; return cv.measureText(T).width; };
    const w1 = w('monospace'), w2 = w('serif'), w3 = w('sans-serif');
    const instalada = n=>{ const q = '"' + n + '"'; return w(q + ',monospace') !== w1 || w(q + ',serif') !== w2 || w(q + ',sans-serif') !== w3; };
    let todas = BASE.slice();
    MAIS.forEach(n=>{ if(!todas.includes(n) && instalada(n)) todas.push(n); });
    todas.sort((a, b)=>a.localeCompare(b, 'pt'));
    let rec = []; try{ rec = JSON.parse(localStorage.getItem(LS_KEYS.fontesRecentes) || '[]').filter(x=>typeof x === 'string').slice(0, 5); }catch(e){}
    const opt = n=>{ const o = document.createElement('option'); o.value = o.textContent = n; o.style.fontFamily = '"' + n + '",sans-serif'; o.style.fontSize = '15px'; return o; };
    function montar(extra){
      const atual = sel.value; sel.innerHTML = '';
      const lista = todas.slice(); if(extra && !lista.some(x=>x.toLowerCase() === extra.toLowerCase())){ lista.push(extra); lista.sort((a, b)=>a.localeCompare(b, 'pt')); }
      if(rec.length){ const g = document.createElement('optgroup'); g.label = 'Fontes recentes'; rec.forEach(n=>g.appendChild(opt(n))); sel.appendChild(g); }
      const g2 = document.createElement('optgroup'); g2.label = 'Todas as fontes'; lista.forEach(n=>g2.appendChild(opt(n))); sel.appendChild(g2);
      if(atual) sel.value = atual;
    }
    montar();
    sel.addEventListener('change', ()=>{
      const n = sel.value; if(!n) return;
      rec = [n].concat(rec.filter(x=>x !== n)).slice(0, 5);
      try{ localStorage.setItem(LS_KEYS.fontesRecentes, JSON.stringify(rec)); }catch(e){}
      montar();
    });
    // a caixa mostra a fonte do texto onde está o cursor
    let t;
    document.addEventListener('selectionchange', ()=>{
      clearTimeout(t); t = setTimeout(()=>{
        if(document.activeElement === sel || document.body.classList.contains('hfedit') || (window.__tyActive && window.__tyActive())) return;
        const s = getSelection(); if(!s.rangeCount || !page.contains(s.anchorNode)) return;
        let el = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement; if(!el) return;
        const fam = (getComputedStyle(el).fontFamily.split(',')[0] || '').replace(/["']/g, '').trim(); if(!fam) return;
        const ach = [...sel.options].find(o=>o.value.toLowerCase() === fam.toLowerCase());
        if(ach) sel.value = ach.value; else{ montar(fam); sel.value = fam; }
      }, 60);
    });
  })();


  // ---------- Número de Página e Remover Cabeçalho/Rodapé (guia Inserir) ----------
  (function(){
    const selN = document.getElementById('pgNum'), selF = document.getElementById('pgNumFmt'), selR = document.getElementById('hfRm'); if(!selN) return;
    const fld = f=>'<span class="fld" data-f="' + f + '" contenteditable="false">1</span>&#8203;';
    const FM = {n:()=>fld('page'), p:()=>'Página ' + fld('page'), pd:()=>'Página ' + fld('page') + ' de ' + fld('pages'), s:()=>fld('page') + ' / ' + fld('pages'), t:()=>'– ' + fld('page') + ' –'};
    try{ const v = localStorage.getItem(LS_KEYS.pgnumFmt); if(v && FM[v]) selF.value = v; }catch(e){}
    selF.addEventListener('change', ()=>{ try{ localStorage.setItem(LS_KEYS.pgnumFmt, selF.value); }catch(e){} });
    const fechar = ()=>{ try{ if(window.__hfEditing && window.__hfEditing() && window.__hfClose) window.__hfClose(); }catch(e){} };
    const lerBranco = html=>!hfTokens(html).some(t=>typeof t === 'string' ? t.trim() : !t.br);
    function tirarNum(hh, k){
      const add = hh.pn && hh.pn[k];
      if(add && hh[k] && hh[k].endsWith(add)){ hh[k] = hh[k].slice(0, -add.length).replace(/(<br>)+$/, ''); if(lerBranco(hh[k])) hh[k] = ''; }
      else if(hh[k]){ const d = document.createElement('div'); d.innerHTML = hh[k]; d.querySelectorAll('.fld').forEach(x=>x.remove()); hh[k] = lerBranco(d.innerHTML) ? '' : d.innerHTML; }
      if(hh.pn) delete hh.pn[k];
    }
    selN.addEventListener('change', ()=>{
      const v = selN.value; selN.selectedIndex = 0; if(!v) return;
      if(v === 'cur'){                       // número no ponto do cursor dentro do cabeçalho/rodapé (abre o rodapé se nada estiver aberto)
        if(!(window.__hfEditing && window.__hfEditing()) && window.__hfOpen) window.__hfOpen('f');
        if(window.__hfIns) window.__hfIns(FM[selF.value]());
        return;
      }
      fechar(); const hh = hfData();
      if(v === 'rm'){ tirarNum(hh, 'h'); tirarNum(hh, 'f'); persist(); applyMar(); return; }
      const [k, al] = v.split(':'), frag = FM[selF.value]();
      tirarNum(hh, 'h'); tirarNum(hh, 'f');            // um só número por documento, como no Word
      hh.pn = hh.pn || {};
      if(lerBranco(hh[k] || '')){ hh[k] = frag; hh[k + 'a'] = al; hh.pn[k] = frag; }
      else{ hh[k] = hh[k] + '<br>' + frag; hh.pn[k] = '<br>' + frag; }
      persist(); applyMar();
    });
    selR.addEventListener('change', ()=>{
      const v = selR.value; selR.selectedIndex = 0; if(!v) return;
      if(!confirm(v === 'hf' ? 'Remover o cabeçalho e o rodapé (texto e imagens)?' : 'Remover o ' + (v === 'h' ? 'cabeçalho' : 'rodapé') + ' (texto e imagens)?')) return;
      fechar(); const hh = hfData(), pg = pgOf(), e = effMar(), PH = pg.h * CMPX;
      v.split('').forEach(k=>{
        hh[k] = ''; if(hh.pn) delete hh.pn[k];
        hh.imgs = hfImgs().filter(i=>{ if(i.bg) return true; const c = i.y + i.h / 2; return k === 'h' ? c >= e.t : c <= PH - e.b; });
      });
      persist(); applyMar();
    });
  })();


  // ---------- Opções de Colagem (botão que aparece depois de colar, como o Ctrl do Word) ----------
  (function(){
    const btn = document.createElement('button'), menu = document.createElement('div');
    btn.id = 'pstBtn'; btn.type = 'button'; btn.hidden = true; btn.title = 'Opções de Colagem (Ctrl)'; btn.setAttribute('aria-haspopup', 'menu'); btn.innerHTML = '<span aria-hidden="true">📋</span><span aria-hidden="true" style="font-size:10px">▾</span><span style="position:absolute;width:1px;height:1px;overflow:hidden">Opções de Colagem</span>';
    menu.id = 'pstMenu'; menu.hidden = true; menu.setAttribute('role', 'menu');
    const MODES = [['keep', 'Manter formatação de origem'], ['merge', 'Mesclar formatação'], ['text', 'Manter somente texto']];
    MODES.forEach(m=>{ const b = document.createElement('button'); b.type = 'button'; b.dataset.m = m[0]; b.setAttribute('role', 'menuitem'); b.textContent = m[1]; menu.appendChild(b); });
    document.body.append(btn, menu);
    let ctx = null, ctrlAlone = false, busy = false;
    const hide = ()=>{ btn.hidden = true; menu.hidden = true; ctx = null; };
    const merge = h=>{
      const d = new DOMParser().parseFromString(h, 'text/html');
      d.querySelectorAll('script,style,iframe,object,embed,meta,link').forEach(n=>n.remove());
      d.querySelectorAll('*').forEach(n=>{ ['style', 'class', 'color', 'face', 'size', 'bgcolor', 'width', 'height', 'align'].forEach(a=>n.removeAttribute(a)); [...n.attributes].forEach(a=>{ if(/^on/i.test(a.name) || /^[\x00-\x20]*j[\t\n\r]*a[\t\n\r]*v[\t\n\r]*a[\t\n\r]*s[\t\n\r]*c[\t\n\r]*r[\t\n\r]*i[\t\n\r]*p[\t\n\r]*t[\t\n\r]*:/i.test(a.value)) n.removeAttribute(a.name); }); });
      return d.body.innerHTML;
    };
    const plain = (h, t)=>{ if(t) return t; const d = new DOMParser().parseFromString(h, 'text/html'); return (d.body.innerText || d.body.textContent || '').trim(); };
    function marcar(){ menu.querySelectorAll('button').forEach(b=>b.classList.toggle('on', ctx && b.dataset.m === ctx.mode)); }
    function pos(){
      const g = getSelection(); let r = null;
      if(g.rangeCount){ const rr = g.getRangeAt(0).getClientRects(); r = rr.length ? rr[rr.length - 1] : g.getRangeAt(0).getBoundingClientRect(); }
      if(!r || (!r.width && !r.height && !r.top)) r = page.getBoundingClientRect();
      const x = Math.max(8, Math.min(innerWidth - 60, r.right || r.left)), y = Math.max(8, Math.min(innerHeight - 40, (r.bottom || r.top) + 6));
      btn.style.left = x + 'px'; btn.style.top = y + 'px';
    }
    function mostra(h, t, mode){
      if(!h || !h.trim()) return;
      ctx = {h, t, mode:mode || 'text'}; pos(); btn.hidden = false; menu.hidden = true; marcar();
    }
    window.__pstShow = mostra;
    page.addEventListener('paste', e=>{
      const cd = e.clipboardData; if(!cd || [...cd.files].some(f=>f.type.startsWith('image/'))) return;
      const h = cd.getData('text/html'), t = cd.getData('text/plain'); if(!h) return;
      setTimeout(()=>mostra(h, t), 0);
    });
    function abrir(){
      if(!ctx) return; marcar(); const b = btn.getBoundingClientRect();
      menu.hidden = false; const mh = menu.offsetHeight, mw = menu.offsetWidth;
      menu.style.left = Math.max(8, Math.min(innerWidth - mw - 8, b.left)) + 'px';
      menu.style.top = (b.bottom + mh + 8 > innerHeight ? Math.max(8, b.top - mh - 4) : b.bottom + 4) + 'px';
    }
    btn.addEventListener('mousedown', e=>e.preventDefault());
    menu.addEventListener('mousedown', e=>e.preventDefault());
    btn.addEventListener('click', ()=>{ if(menu.hidden) abrir(); else menu.hidden = true; });
    menu.addEventListener('click', e=>{
      const b = e.target.closest('button'); if(!b || !ctx) return;
      const m = b.dataset.m, c = ctx; menu.hidden = true;
      if(m === c.mode) return;
      busy = true; page.focus();
      try{ document.execCommand('undo'); }catch(err){}                    // desfaz a colagem e cola de novo no modo escolhido
      page.focus(); document.execCommand('styleWithCSS', false, false);
      if(m === 'text') document.execCommand('insertText', false, plain(c.h, c.t));
      else document.execCommand('insertHTML', false, m === 'merge' ? merge(c.h) : cleanPasted(c.h));
      try{ refresh(); changed(); }catch(err){}
      busy = false; ctx = c; ctx.mode = m; btn.hidden = false; pos(); marcar();
    });
    // qualquer outra ação no texto some com o botão
    page.addEventListener('mousedown', ()=>{ if(!busy) hide(); }); page.addEventListener('input', e=>{ if(ctx && !busy && e.inputType !== 'insertFromPaste' && e.inputType !== 'insertText' && e.inputType !== 'insertHTML') hide(); });
    document.addEventListener('keydown', e=>{
      if(e.key === 'Control'){ ctrlAlone = true; return; }
      ctrlAlone = false;
      if(e.key === 'Shift' || e.key === 'Alt' || e.key === 'Meta' || !ctx) return;
      if(e.key === 'Escape' && !menu.hidden){ menu.hidden = true; return; }
      if(!(e.ctrlKey && /^[vz]$/i.test(e.key))) hide();
    }, true);
    document.addEventListener('keyup', e=>{ if(e.key === 'Control' && ctrlAlone && ctx && !btn.hidden){ if(menu.hidden) abrir(); else menu.hidden = true; } });
    document.addEventListener('mousedown', e=>{ if(!menu.hidden && !e.target.closest('#pstMenu,#pstBtn')) menu.hidden = true; });
    addEventListener('scroll', ()=>{ if(ctx) pos(); }, true);
  })();

  // ---------- Atualização automática (service worker) ----------
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    const tinha = !!navigator.serviceWorker.controller;
    let recarregando = false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(!tinha || recarregando) return;      // primeira instalação: não recarrega
      recarregando = true;
      flushNow().then(()=>location.reload(), ()=>location.reload());
    });
    navigator.serviceWorker.register('sw.js').then(reg=>{
      // compara o index.html publicado com o carregado; se mudou, salva e recarrega
      const url = location.pathname.endsWith('/') || !/\.html?$/.test(location.pathname) ? location.pathname : location.pathname;
      let base = null;
      const lerRemoto = ()=>fetch(url, {cache:'no-store'}).then(r=>r.ok ? r.text() : null).catch(()=>null);
      lerRemoto().then(t=>{ base = t; });
      const checar = ()=>{
        reg.update().catch(()=>{});
        lerRemoto().then(t=>{
          if(t && base && t !== base && !recarregando){ recarregando = true; flushNow().then(()=>location.reload(), ()=>location.reload()); }
        });
      };
      setInterval(checar, 5 * 60 * 1000);
      document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) checar(); });
      window.addEventListener('online', checar);
    }).catch(()=>{});
  }
