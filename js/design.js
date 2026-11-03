/* Verbus — Guia Design (temas, cores, fontes), Repetir (F4) e carregamento inicial do documento
   (js/design.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   Reconstruído a partir da v66 (index.html monolítico), com as chaves de armazenamento portadas para LS_KEYS. */
  // ================= Design: temas, cores, fontes, espaçamento, cor da página =================
  (function(){
    const PRE = window.__stySetters.PRE;
    const norm = v=>(!v.f && !v.hc && v.sp === 'padrao') ? null : v;
    const getSt = ()=>Object.assign({f:'', hc:'', sp:'padrao'}, window.__curSty() || {});
    const same = (a, b)=>(a.f || '') === (b.f || '') && (a.hc || '') === (b.hc || '') && (a.sp || 'padrao') === (b.sp || 'padrao');
    function sync(){
      const ab = page.classList.contains('abnt'), st = getSt();
      document.querySelectorAll('#tp-design .dsc[data-p]').forEach(c=>c.classList.toggle('on', !ab && same(st, PRE[c.dataset.p])));
      $('btnAbnt').classList.toggle('on', ab);
    }
    function change(patch){
      if(page.classList.contains('abnt') && !confirm('Este documento está no padrão ABNT, que usa fonte e espaçamento fixos. Sair do ABNT para aplicar?')) return;
      if(page.classList.contains('abnt')) $('btnAbnt').click();
      window.__setSty(norm(Object.assign(getSt(), patch))); sync();
    }
    // menu simples (usa o mesmo visual do menu de tabelas)
    let pop = null, popBtn = null;
    function closePop(){ if(pop){ pop.remove(); pop = null; } if(popBtn){ popBtn.setAttribute('aria-expanded', 'false'); popBtn = null; } document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); }
    function outside(e){ if(pop && !pop.contains(e.target) && !(popBtn && popBtn.contains(e.target))) closePop(); }
    function esc(e){ if(e.key === 'Escape'){ e.preventDefault(); closePop(); } }
    function menu(btn, build){
      btn.addEventListener('mousedown', e=>e.preventDefault());
      btn.addEventListener('click', ()=>{
        if(pop && popBtn === btn){ closePop(); return; } closePop();
        pop = document.createElement('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
        build().forEach(it=>{
          if(it === '-'){ pop.appendChild(document.createElement('hr')); return; }
          const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitemcheckbox');
          b.textContent = (it.chk ? '✓ ' : '\u2003') + it.t;
          if(it.sw){ const sw = document.createElement('span'); sw.style.cssText = 'display:inline-block;width:12px;height:12px;margin:0 6px 0 4px;vertical-align:-1px;border:1px solid #888;background:' + it.sw; b.insertBefore(sw, b.firstChild); }
          b.addEventListener('click', ()=>{ closePop(); it.f(); }); pop.appendChild(b);
        });
        pop.style.maxHeight = '70vh'; pop.style.overflowY = 'auto'; pop.addEventListener('mousedown', e=>e.preventDefault());
        document.body.appendChild(pop);
        const r = btn.getBoundingClientRect();
        pop.style.left = Math.max(4, Math.min(r.left, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.min(r.bottom + 2, innerHeight - pop.offsetHeight - 4) + 'px';
        popBtn = btn; btn.setAttribute('aria-expanded', 'true');
        document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
      });
    }
    const NAMES = {padrao:'Padrão', classico:'Clássico', moderno:'Moderno', elegante:'Elegante'};
    // cartões da galeria
    document.querySelectorAll('#tp-design .dsc[data-p]').forEach(c=>{
      c.addEventListener('mousedown', e=>e.preventDefault());
      c.addEventListener('click', ()=>change(Object.assign({}, PRE[c.dataset.p])));
    });
    menu($('btnDsTema'), ()=>{ const st = getSt(), ab = page.classList.contains('abnt');
      return [...Object.keys(NAMES).map(k=>({t:NAMES[k], chk:!ab && same(st, PRE[k]), f:()=>change(Object.assign({}, PRE[k]))})), '-', {t:'Mais opções…', f:()=>$('btnChgSty').click()}]; });
    const COLORS = [['Padrão (texto)', ''], ['Azul', '#2f5496'], ['Verde', '#2e7d32'], ['Vinho', '#8b1e3f'], ['Cinza escuro', '#4d4d4d']];
    menu($('btnDsCor'), ()=>COLORS.map(([t, v])=>({t, sw:v || '#fff', chk:getSt().hc === v, f:()=>change({hc:v})})));
    const FONTS = [['Padrão (Arial)', ''], ['Cambria', 'Cambria'], ['Arial', 'Arial'], ['Times New Roman', 'Times New Roman'], ['Georgia', 'Georgia'], ['Verdana', 'Verdana'], ['Tahoma', 'Tahoma'], ['Trebuchet MS', 'Trebuchet MS'], ['Palatino Linotype', 'Palatino Linotype'], ['Garamond', 'Garamond']];
    menu($('btnDsFonte'), ()=>FONTS.map(([t, v])=>({t, chk:getSt().f === v, f:()=>change({f:v})})));
    menu($('btnDsEsp'), ()=>[['Padrão', 'padrao'], ['Compacto', 'compacto'], ['Relaxado', 'relaxado']].map(([t, v])=>({t, chk:getSt().sp === v, f:()=>change({sp:v})})));
    $('btnDsReset').addEventListener('mousedown', e=>e.preventDefault());
    $('btnDsReset').addEventListener('click', ()=>{ window.__setSty(null); sync(); });
    $('btnAbnt').addEventListener('click', ()=>setTimeout(sync, 0));
    $('tab-design').addEventListener('click', sync);

    // Cor da Página (por documento)
    const sheet = $('sheet');
    const curDoc = ()=>store.docs[store.current];
    function applyPgc(){ const d = curDoc(), c = d && d.pgc; if(c) sheet.style.setProperty('--paper', c); else sheet.style.removeProperty('--paper'); if(!sheet.getAttribute('style')) sheet.removeAttribute('style'); }
    const oAp = window.__applySty; window.__applySty = function(){ oAp(); try{ applyPgc(); }catch(e){} };
    const oCss = window.__styCss; window.__styCss = function(){ const d = curDoc(), x = oCss(); return d && d.pgc ? x + 'body{background:' + d.pgc + '}' : x; };
    const PGC = [['Sem cor', ''], ['Amarelo claro', '#fff9d6'], ['Verde claro', '#e6f4e6'], ['Azul claro', '#e3effb'], ['Rosa claro', '#fbe8ee'], ['Cinza claro', '#eeeeee']];
    menu($('btnDsCorPg'), ()=>{ const d = curDoc() || {}; return PGC.map(([t, v])=>({t, sw:v || '#fff', chk:(d.pgc || '') === v, f:()=>{ const dd = curDoc(); if(!dd) return; if(v) dd.pgc = v; else delete dd.pgc; applyPgc(); persist(); }})); });
    applyPgc(); sync();
  })();

  // ================= Repetir (F4) e Selecionar texto com formatação semelhante =================
  (function(){
    const NOREP = new Set(['btnCut','btnCopy','btnPaste','pasteSp','btnPainter','btnMarks','btnFind','btnRepl','selAll','btnCollapse','btnDictHome','btnEditorHome','btnSort','btnChgSty','galUp','galDn','galMore','gsCreate','gsClear2','gsModify','gsUpdate','gsApply','gsInspect','gsManage']);
    const BLKQ = 'p,h1,h2,h3,h4,h5,h6,li,div,blockquote,pre,td,th';
    let last = null, replaying = false, multi = null, internal = false;
    const inRibbon = t=>!!(t.closest && t.closest('#tp-inicio, #minibar') && !t.closest('.gdl') && !t.dataset.dlg && !NOREP.has(t.id));
    const rec = a=>{ if(!replaying) last = a; };

    // ---- grava a última ação da faixa de opções ----
    document.addEventListener('click', e=>{
      const b = e.target.closest && e.target.closest('button'); if(!b || !inRibbon(b)) return;
      rec({k:'ctl', el:b, evt:'click'}); afterCtl();
    }, true);
    document.addEventListener('change', e=>{
      const t = e.target; if(!(t instanceof HTMLSelectElement || t instanceof HTMLInputElement) || !inRibbon(t)) return;
      if(t.value === '' || String(t.value).startsWith('__')) return;
      rec({k:'ctl', el:t, evt:'change', value:t.value}); afterCtl();
    }, true);
    document.addEventListener('input', e=>{
      const t = e.target; if(t.matches && t.matches('#fore, #back, #shade')){ rec({k:'ctl', el:t, evt:'input', value:t.value}); afterCtl(); }
    }, true);
    // ---- grava o último trecho digitado ----
    page.addEventListener('beforeinput', e=>{
      if(replaying) return;
      if(e.inputType === 'insertText' && e.data){
        if(last && last.k === 'type' && last.live) last.text += e.data; else last = {k:'type', text:e.data, live:true};
      }else if(!/^format|Composition/.test(e.inputType) && last && last.k === 'type') last.live = false;   // Enter, apagar etc. encerram o trecho
    });
    page.addEventListener('keydown', e=>{
      if(!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      const m = {b:'bold', i:'italic', u:'underline', l:'justifyLeft', e:'justifyCenter', r:'justifyRight', j:'justifyFull'}[e.key.toLowerCase()];
      if(m) rec({k:'cmd', cmd:m});
    });

    function setSel(r){ internal = true; const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); savedRange = r.cloneRange(); internal = false; }
    function replayOne(a){
      if(a.k === 'type'){ page.focus(); document.execCommand('insertText', false, a.text); changed(); }
      else if(a.k === 'cmd'){ exec(a.cmd); }
      else if(a.k === 'ctl'){
        if(!a.el.isConnected) return;
        if(a.evt === 'click') a.el.click(); else{ a.el.value = a.value; a.el.dispatchEvent(new Event(a.evt, {bubbles:true})); }
      }
    }
    // Os trechos são guardados como posições no texto da página (formatar não muda o texto), então continuam certos depois de cada ação
    function tIndex(){
      const tw = document.createTreeWalker(page, NodeFilter.SHOW_TEXT), nodes = [], starts = []; let t = 0, n;
      while((n = tw.nextNode())){ nodes.push(n); starts.push(t); t += n.data.length; }
      return {nodes, starts, total:t};
    }
    function offOf(ix, node, off){ const i = ix.nodes.indexOf(node); return i < 0 ? 0 : ix.starts[i] + off; }
    function rangeOf(ix, s, e){
      const r = document.createRange(), find = (pos, isEnd)=>{
        for(let i = 0; i < ix.nodes.length; i++){ const a = ix.starts[i], b = a + ix.nodes[i].data.length; if(isEnd ? (pos > a && pos <= b) : (pos >= a && pos < b)) return [ix.nodes[i], pos - a]; }
        const l = ix.nodes.length - 1; return l >= 0 ? [ix.nodes[l], ix.nodes[l].data.length] : null;
      };
      const a = find(s, false), b = find(e, true); if(!a || !b) return null;
      r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]); return r;
    }
    function runAll(a, offs){
      replaying = true;
      try{
        if(!offs){ replayOne(a); return; }
        offs.forEach(o=>{ const r = rangeOf(tIndex(), o.s, o.e); if(!r || r.collapsed) return; setSel(r); replayOne(a); });
      }finally{ replaying = false; }
    }
    function selFirst(){ if(!multi || !multi.offs.length) return; const r = rangeOf(tIndex(), multi.offs[0].s, multi.offs[0].e); if(r) setSel(r); }
    // com vários trechos selecionados, a ação da faixa vale para todos (o primeiro já foi tratado pelo próprio botão)
    function afterCtl(){
      if(!multi || replaying) return;
      const a = last, rest = multi.offs.slice(1);
      selFirst();   // o próprio botão age no primeiro trecho
      setTimeout(()=>{ runAll(a, rest); selFirst(); hl(); }, 0);
    }
    function doRepeat(){
      if(!last) return;
      const sl = getSelection(); if(sl.rangeCount && page.contains(sl.anchorNode)) savedRange = sl.getRangeAt(0).cloneRange();   // o selectionchange é assíncrono: sincroniza antes de repetir
      if(multi){ runAll(last, multi.offs.slice()); selFirst(); hl(); } else runAll(last, null);
    }
    document.addEventListener('keydown', e=>{
      if(e.key !== 'F4' || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
      e.preventDefault(); doRepeat();
    });
    $('btnRepeat').addEventListener('mousedown', e=>e.preventDefault());
    $('btnRepeat').addEventListener('click', doRepeat);

    // ---- Selecionar texto com formatação semelhante ----
    const info = document.createElement('span'); info.className = 'sb'; info.id = 'simInfo'; info.hidden = true; $('count').after(info);
    function hl(){
      try{
        if(!multi){ CSS.highlights.delete('vsim'); info.hidden = true; return; }
        const ix = tIndex(), rs = multi.offs.map(o=>rangeOf(ix, o.s, o.e)).filter(r=>r && !r.collapsed);
        if(!rs.length){ multi = null; CSS.highlights.delete('vsim'); info.hidden = true; return; }
        CSS.highlights.set('vsim', new Highlight(...rs));
        info.textContent = rs.length + ' trecho(s) com a mesma formatação'; info.hidden = false;
      }catch(_){}
    }
    function clearMulti(){ multi = null; hl(); }
    function charSig(n){
      const el = n.parentElement, cs = getComputedStyle(el); let bg = '';
      for(let x = el; x && x !== page; x = x.parentElement){ const c = getComputedStyle(x).backgroundColor; if(c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'){ bg = c; break; } if(x.matches(BLKQ)) break; }
      return [cs.fontFamily, cs.fontSize, cs.fontWeight, cs.fontStyle, cs.color, cs.textDecorationLine, cs.textDecorationStyle, cs.verticalAlign, cs.textTransform, cs.fontVariantCaps, cs.letterSpacing, bg].join('|');
    }
    function firstText(n){ if(n.nodeType === 3) return n; return document.createTreeWalker(n, NodeFilter.SHOW_TEXT).nextNode(); }
    function anchorText(){
      const sl = getSelection(), r = sl.rangeCount && page.contains(sl.anchorNode) ? sl.getRangeAt(0) : savedRange; if(!r) return null;
      const n = r.startContainer; if(n.nodeType === 3) return n;
      const c = n.childNodes[r.startOffset], t = c && firstText(c); if(t) return t;
      const pc = n.childNodes[r.startOffset - 1];
      if(pc){ const w = document.createTreeWalker(pc, NodeFilter.SHOW_TEXT); let x, l = null; while((x = w.nextNode())) l = x; if(l) return l; }
      return firstText(n);
    }
    window.__selSimilar = function(){
      const a = anchorText();
      if(!a || !page.contains(a) || !a.data.trim()){ alert('Clique no texto cuja formatação você quer procurar e escolha de novo.'); return; }
      const want = charSig(a), ix = tIndex(), groups = []; let cur = null;
      ix.nodes.forEach(n=>{
        if(n.parentElement.closest('.hf, [data-hid]') || !n.data.trim()) return;
        const blk = n.parentElement.closest(BLKQ);
        if(charSig(n) === want){
          if(cur && cur.blk === blk) cur.last = n; else{ if(cur) groups.push(cur); cur = {first:n, last:n, blk}; }
        }else if(cur){ groups.push(cur); cur = null; }
      });
      if(cur) groups.push(cur);
      const offs = groups.map(g=>({s:offOf(ix, g.first, 0), e:offOf(ix, g.last, g.last.data.length)}));
      if(!offs.length) return;
      multi = {offs}; selFirst(); page.focus(); hl();
    };
    // qualquer clique, tecla ou digitação no texto desfaz a seleção múltipla
    page.addEventListener('mousedown', ()=>{ if(multi && !replaying) clearMulti(); });
    page.addEventListener('keydown', e=>{ if(multi && !replaying && !/^(Shift|Control|Alt|Meta|F4)$/.test(e.key)) clearMulti(); });
    page.addEventListener('input', e=>{ if(multi && !replaying && /^(insertText|insertParagraph|insertFromPaste|delete)/.test(e.inputType || '')) clearMulti(); });
  })();

  // Ferramentas de desenho de tabelas e borracha
  (function(){
    const overlay=document.createElement('div'), hint=document.createElement('div'); overlay.id='tblDrawOv';hint.id='tblHint';document.body.append(overlay,hint);
    let mode='', start=null, last=null, target=null;
    const messages={draw:'Desenhar Tabela: arraste dentro de uma tabela para dividir; em área vazia, arraste para criar. Esc cancela.',erase:'Borracha: arraste sobre uma divisória para unir células. Esc sai.'};
    function activate(m){mode=mode===m?'':m;start=last=target=null;overlay.style.display='none';page.classList.toggle('tbl-draw',mode==='draw');page.classList.toggle('tbl-erase',mode==='erase');$('tDraw').classList.toggle('on',mode==='draw');$('tErase').classList.toggle('on',mode==='erase');hint.textContent=mode?messages[mode]:'';hint.style.display=mode?'block':'none'}
    $('tDraw').addEventListener('mousedown',e=>e.preventDefault());$('tErase').addEventListener('mousedown',e=>e.preventDefault());$('tDraw').onclick=()=>activate('draw');$('tErase').onclick=()=>activate('erase');
    document.addEventListener('keydown',e=>{if(mode&&e.key==='Escape'){e.preventDefault();activate('')}} ,true);
    function cellAtPoint(x,y){const el=document.elementFromPoint(x,y);return el&&el.closest?el.closest('#page td,#page th'):null}
    function gridLine(table,axis,p){const G=gridOf(table), rows=[...table.rows], scale=tblScale(table); if(axis==='v'){const xs=[];for(const c of G.pos.keys()){const r=c.getBoundingClientRect();const q=G.pos.get(c);xs.push({x:r.left,q:q.c},{x:r.right,q:q.c+q.cs})}xs.sort((a,b)=>Math.abs(a.x-p)-Math.abs(b.x-p));return xs[0]&&xs[0].q}const ys=[];rows.forEach((tr,i)=>{const r=tr.getBoundingClientRect();ys.push({y:r.top,q:i},{y:r.bottom,q:i+1})});ys.sort((a,b)=>Math.abs(a.y-p)-Math.abs(b.y-p));return ys[0]&&ys[0].q}
    function splitVertical(table,k){let G=gridOf(table),n=Math.max(...G.g.map(r=>r.length));if(k<=0||k>=n)return false;const before=tblSnap(table);insCol(table,G,k,n);if(before)tblAdjust(table,before,'ins'+k);return true}
    function drawBoundary(table,axis,x,y){const c=cellAtPoint(x,y);if(!c||c.closest('table')!==table)return null;const G=gridOf(table),q=G.pos.get(c);if(!q)return null;return axis==='v'?q.c+Math.max(1,Math.ceil(q.cs/2)):q.r+Math.max(1,Math.ceil(q.rs/2))}
    function splitHorizontal(table,k){
      const G=gridOf(table),oldRows=[...table.rows];if(k<=0||k>=oldRows.length)return false;
      const width=Math.max(...G.g.map(r=>r.length)),tr=table.insertRow(k),spanning=[];
      for(const [cell,q] of G.pos){if(q.r<k&&q.r+q.rs>k){const lower=newCellLike(cell);lower.rowSpan=q.r+q.rs-k;if(lower.rowSpan===1)lower.removeAttribute('rowspan');cell.rowSpan=k-q.r;if(cell.rowSpan===1)cell.removeAttribute('rowspan');let before=null;for(const x of [...tr.cells]){const z=gridOf(table).pos.get(x);if(z&&z.c>q.c){before=x;break}}tr.insertBefore(lower,before);spanning.push(cell)}}
      let now=gridOf(table);for(let c=0;c<width;c++){if(now.g[k]&&now.g[k][c])continue;const ref=G.g[k]&&G.g[k][c]||G.g[k-1]&&G.g[k-1][c];if(!ref)continue;const n=newCellLike(ref);let before=null;for(const x of [...tr.cells]){const z=now.pos.get(x);if(z&&z.c>c){before=x;break}}tr.insertBefore(n,before);now=gridOf(table)}return true
    }
    function makeTable(a,b){const rect={left:Math.min(a.x,b.x),right:Math.max(a.x,b.x),top:Math.min(a.y,b.y),bottom:Math.max(a.y,b.y)};if(rect.right-rect.left<35||rect.bottom-rect.top<24)return;const scale=tblScale(page),cw=Math.max(30,Math.round(70*scale)),rh=Math.max(22,Math.round(28*scale)),cols=Math.max(1,Math.min(12,Math.round((rect.right-rect.left)/cw))),rows=Math.max(1,Math.min(30,Math.round((rect.bottom-rect.top)/rh)));const range=document.caretRangeFromPoint?document.caretRangeFromPoint(a.x,a.y):(document.caretPositionFromPoint?(()=>{const q=document.caretPositionFromPoint(a.x,a.y);if(!q)return null;const r=document.createRange();r.setStart(q.offsetNode,q.offset);r.collapse(true);return r})():null);if(!range||!page.contains(range.startContainer))return;const sel=getSelection();sel.removeAllRanges();sel.addRange(range);savedRange=range.cloneRange();const t=insertTable(rows,cols);if(t){t.style.width=Math.max(80,rect.right-rect.left)+'px';t.style.tableLayout='fixed';t.querySelectorAll('td').forEach(c=>c.style.height=Math.max(20,(rect.bottom-rect.top)/rows)+'px');changed()}}
    page.addEventListener('pointerdown',e=>{if(!mode||e.button!==0||document.body.classList.contains('hfedit'))return;const c=cellAtPoint(e.clientX,e.clientY);if(mode==='erase'&&!c)return;e.preventDefault();e.stopImmediatePropagation();start=last={x:e.clientX,y:e.clientY};target=c&&c.closest('table');page.setPointerCapture&&page.setPointerCapture(e.pointerId);overlay.style.display='block';overlay.style.left=start.x+'px';overlay.style.top=start.y+'px';overlay.style.width='1px';overlay.style.height='1px'},true);
    page.addEventListener('pointermove',e=>{if(!start)return;last={x:e.clientX,y:e.clientY};overlay.style.left=Math.min(start.x,last.x)+'px';overlay.style.top=Math.min(start.y,last.y)+'px';overlay.style.width=Math.max(1,Math.abs(last.x-start.x))+'px';overlay.style.height=Math.max(1,Math.abs(last.y-start.y))+'px'},true);
    document.addEventListener('pointerup',e=>{if(!start)return;const a=start,b={x:e.clientX,y:e.clientY},t=target;start=null;overlay.style.display='none';if(t&&a.x!==b.x||t&&a.y!==b.y){const vertical=Math.abs(b.x-a.x)<Math.abs(b.y-a.y);if(mode==='draw'){const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2,k=drawBoundary(t,vertical?'v':'h',midX,midY);const ok=k!=null&&(vertical?splitVertical(t,k):splitHorizontal(t,k));if(ok)changed()}else eraseLine(t,a,b,vertical)}else if(!t&&mode==='draw')makeTable(a,b)},true);
    function eraseLine(table,a,b,vertical){
      let did=false;
      if(vertical){const k=gridLine(table,'v',(a.x+b.x)/2),G=gridOf(table),r0=Math.min(a.y,b.y),r1=Math.max(a.y,b.y),seen=new Set();if(k<=0)return;for(let r=0;r<G.g.length;r++){const cell=G.g[r][k-1],other=G.g[r][k];if(!cell||!other||cell===other||seen.has(cell)||seen.has(other))continue;const box=cell.getBoundingClientRect();if(box.bottom<r0||box.top>r1)continue;seen.add(cell);seen.add(other);if(mergeCells([cell,other]))did=true;}}
      else{const k=gridLine(table,'h',(a.y+b.y)/2),G=gridOf(table),c0=Math.min(a.x,b.x),c1=Math.max(a.x,b.x),seen=new Set();if(k<=0)return;for(let c=0;c<(G.g[k-1]||[]).length;c++){const cell=G.g[k-1][c],other=(G.g[k]||[])[c];if(!cell||!other||cell===other||seen.has(cell)||seen.has(other))continue;const box=cell.getBoundingClientRect();if(box.right<c0||box.left>c1)continue;seen.add(cell);seen.add(other);if(mergeCells([cell,other]))did=true;}}
      if(did)changed()
    }
  })();

  load().then(updateCount, updateCount);
