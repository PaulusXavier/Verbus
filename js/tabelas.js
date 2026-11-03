/* Verbus — Guia Desenvolvedor e tabelas (layout, arrastar, mesclar)
   (js/tabelas.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ================= Desenvolvedor =================
  (function(){
    const E = t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const put = h=>{ restore(); exec('insertHTML', h); };
    $('dvCheck').addEventListener('click', ()=>put('<span class="ccx" contenteditable="false">☐</span>&nbsp;'));
    $('dvText').addEventListener('click', ()=>put('<span class="ccf" data-ph="1" contenteditable="true">[Clique e digite]</span>&nbsp;'));
    $('dvList').addEventListener('click', ()=>{
      const v = prompt('Opções da lista, separadas por ponto e vírgula:', 'Sim;Não');
      if(!v) return; const o = v.split(';').map(x=>x.trim()).filter(Boolean); if(!o.length) return;
      put('<select class="ccs" contenteditable="false"><option value="">Escolha…</option>' + o.map(x=>'<option>' + E(x) + '</option>').join('') + '</select>&nbsp;');
    });
    $('dvDate').addEventListener('click', ()=>put('<input type="date" class="ccd" contenteditable="false">&nbsp;'));

    // comportamento dos controles dentro do documento
    page.addEventListener('click', e=>{
      const x = e.target.closest && e.target.closest('.ccx');
      if(x && page.contains(x)){ x.textContent = x.textContent.trim() === '☒' ? '☐' : '☒'; changed(); return; }
      const f = e.target.closest && e.target.closest('.ccf[data-ph]');
      if(f && page.contains(f)){ const r = document.createRange(); r.selectNodeContents(f); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); }
    });
    page.addEventListener('input', e=>{ const f = e.target.closest && e.target.closest('.ccf[data-ph]'); if(f) f.removeAttribute('data-ph'); });
    page.addEventListener('change', e=>{
      const t = e.target;
      if(t.matches && t.matches('select.ccs')){ [...t.options].forEach(o=>{ if(o.selected) o.setAttribute('selected', ''); else o.removeAttribute('selected'); }); changed(); }
      else if(t.matches && t.matches('input.ccd')){ t.setAttribute('value', t.value); changed(); }
    });

    // modo formulário
    const bf = $('dvForm');
    bf.addEventListener('click', ()=>{
      const on = !document.body.classList.contains('formmode');
      document.body.classList.toggle('formmode', on); bf.classList.toggle('on', on); bf.setAttribute('aria-pressed', on ? 'true' : 'false');
      page.contentEditable = on ? 'false' : 'true';
      page.querySelectorAll('.ccf').forEach(f=>{ f.contentEditable = 'true'; });
    });

    // backup
    $('dvBackup').addEventListener('click', ()=>{
      save();
      const docs = {}; Object.keys(store.docs).forEach(id=>{ if(!store.docs[id].modelo) docs[id] = store.docs[id]; });
      const blob = new Blob([JSON.stringify({app:'Verbus', versao:1, data:new Date().toISOString(), docs})], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'verbus-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
    });
    $('dvRestore').addEventListener('click', ()=>$('dvFile').click());
    $('dvFile').addEventListener('change', async e=>{
      const f = e.target.files[0]; e.target.value = ''; if(!f) return;
      try{
        const j = JSON.parse(await f.text()); const docs = j && j.docs; if(!docs || typeof docs !== 'object') throw new Error('x');
        const ids = Object.keys(docs).filter(k=>docs[k] && typeof docs[k].html === 'string');
        if(!ids.length) throw new Error('x');
        save(); ids.forEach(k=>{ store.docs[uid()] = docs[k]; });
        persist(); renderSide();
        alert(ids.length + ' documento(s) restaurado(s). Eles aparecem no painel de documentos (Exibir > Painel de Navegação).');
      }catch(err){ alert('Não foi possível ler este arquivo de backup.'); }
    });

    // código HTML
    const hd = $('dvHtmlDlg');
    $('dvHtml').addEventListener('click', ()=>{ $('dvHtmlTxt').value = page.innerHTML; hd.showModal(); });
    $('dvHtmlClose').addEventListener('click', ()=>hd.close());
    $('dvHtmlCopy').addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText($('dvHtmlTxt').value); }catch(e){ $('dvHtmlTxt').select(); document.execCommand('copy'); } });
    $('dvHtmlApply').addEventListener('click', ()=>{
      if(!confirm('Substituir o conteúdo do documento por este código?')) return;
      page.innerHTML = $('dvHtmlTxt').value; changed(); save(); hd.close();
    });
  })();
  $('btnCode').addEventListener('click', ()=>{
    restore(); const t = getSelection().toString(); if(!t) return;
    exec('insertHTML','<code>' + esc(t) + '</code>');
  });

  // Editar tabela
  function delTable(table){   // nas caixas dos modelos (data-flow) o título da seção ("05 – Situação…") sai junto, para não sobrar sozinho
    if((table.hasAttribute('data-flow') || table.hasAttribute('data-sec')) && table.parentNode === page){
      let pv = table.previousElementSibling;
      while(pv && pv.tagName !== 'TABLE' && pv.tagName !== 'DIV' && (pv.style.breakAfter || pv.style.pageBreakAfter) === 'avoid'){ const x = pv; pv = pv.previousElementSibling; x.remove(); }
    }
    table.remove();
  }
  function insCol(table, G, k, nC){               // coluna nova na posição k da grade
    const done = new Set();
    [...table.rows].forEach((tr, ri)=>{
      const x = k < nC ? G.g[ri][k] : null, q = x ? G.pos.get(x) : null;
      if(q && q.c < k){ if(!done.has(x)){ done.add(x); x.colSpan = q.cs + 1; } return; }   // cai dentro de uma célula mesclada
      const own = [...tr.cells]; let before = null;
      for(const cell of own){ if(G.pos.get(cell).c >= k){ before = cell; break; } }
      const nb = own.filter(cell=>G.pos.get(cell).c < k).pop() || own[0]; if(!nb) return;   // vizinho que serve de modelo de estilo
      const n = nb.cloneNode(false); n.removeAttribute('colspan'); n.removeAttribute('rowspan'); n.innerHTML = '<br>';
      tr.insertBefore(n, before);
    });
  }
  function cellOf(){
    let n = savedRange ? savedRange.startContainer : getSelection().anchorNode;
    while(n && n !== page){ if(n.nodeName==='TD' || n.nodeName==='TH') return n; n = n.parentNode; }
    return null;
  }
  $('tbl').addEventListener('change', e=>{
    const a = e.target.value; e.target.value = '';
    const c = cellOf();
    if(!c){ alert('Clique dentro de uma célula da tabela e escolha de novo.'); return; }
    const row = c.parentNode, table = c.closest('table'), idx = [...row.children].indexOf(c);
    const gcol = (gridOf(table).pos.get(c) || {c:idx}).c, tw = tblSnap(table);   // larguras antes da mudança (tabelas redimensionadas)
    let kIns = -1;
    if(a==='rowA' || a==='rowB'){
      const n = row.cloneNode(true); n.querySelectorAll('td,th').forEach(x=>x.innerHTML = '<br>');
      const big = v=>parseFloat(v) > 60;   // caixa alta (ex.: "Situação" com 370 px): a linha nova nasce com altura normal, e não com outra caixa inteira
      if(big(n.style.height)) n.style.height = '';
      n.querySelectorAll('td,th').forEach(x=>{ if(big(x.style.height)){ x.style.height = ''; if(!x.getAttribute('style')) x.removeAttribute('style'); } });
      row.parentNode.insertBefore(n, a==='rowA' ? row.nextSibling : row);
    }else if(a==='colA' || a==='colB'){
      // pela grade (e não pelo índice da célula na linha): células mescladas (ex.: "Nome:" do modelo) só ficam mais largas
      const G = gridOf(table), q0 = G.pos.get(c) || {c:idx, cs:1};
      kIns = a==='colA' ? q0.c + q0.cs : q0.c;
      insCol(table, G, kIns, Math.max(0, ...G.g.map(r=>r.length)));
    }else if(a==='rowD'){ table.rows.length > 1 ? row.remove() : delTable(table);
    }else if(a==='colD'){
      const G = gridOf(table), seen = new Set();
      [...table.rows].forEach((tr, ri)=>{
        const x = G.g[ri] && G.g[ri][gcol]; if(!x || seen.has(x)) return; seen.add(x);
        if((x.colSpan || 1) > 1) x.colSpan = x.colSpan - 1; else x.remove();
      });
      [...table.rows].forEach(tr=>{ if(!tr.cells.length) tr.remove(); });
      if(!table.querySelector('td,th')) delTable(table);
    }else if(a==='tblD'){ delTable(table); }
    if(tw && table.isConnected) tblAdjust(table, tw, kIns >= 0 ? 'ins' + kIns : a==='colD' ? 'del' + gcol : '');
    changed();
  });


  // ---------- Layout da tabela ----------
  ['cellShade'].forEach(id=>$(id).addEventListener('mousedown', e=>e.stopPropagation()));
  function cellAt(n){ while(n && n !== page){ if(n.nodeName === 'TD' || n.nodeName === 'TH') return n; n = n.parentNode; } return null; }
  function selCells(){
    const c = cellOf(); if(!c) return [];
    const table = c.closest('table'), s = getSelection();
    const r = savedRange || (s.rangeCount ? s.getRangeAt(0) : null);
    if(!r || r.collapsed) return [c];
    let a = cellAt(r.startContainer), z = cellAt(r.endContainer);
    if(r.startContainer.nodeType === 1 && r.startContainer.nodeName === 'TR') a = r.startContainer.cells[r.startOffset] || a;
    if(!a || !z || a === z || a.closest('table') !== table || z.closest('table') !== table) return [a || c];
    const {g, pos} = gridOf(table), pa = pos.get(a), pz = pos.get(z);
    const r0 = Math.min(pa.r, pz.r), r1 = Math.max(pa.r + pa.rs - 1, pz.r + pz.rs - 1);
    const c0 = Math.min(pa.c, pz.c), c1 = Math.max(pa.c + pa.cs - 1, pz.c + pz.cs - 1);
    const set = new Set();
    for(let i = r0; i <= r1; i++) for(let j = c0; j <= c1; j++) if(g[i][j]) set.add(g[i][j]);
    return [...set];
  }
  function gridOf(table){
    const g = [], pos = new Map();
    [...table.rows].forEach((tr, ri)=>{
      g[ri] = g[ri] || [];
      let ci = 0;
      [...tr.cells].forEach(cell=>{
        while(g[ri][ci]) ci++;
        const rs = cell.rowSpan || 1, cs = cell.colSpan || 1;
        pos.set(cell, {r:ri, c:ci, rs, cs});
        for(let i = 0; i < rs; i++){ g[ri + i] = g[ri + i] || []; for(let j = 0; j < cs; j++) g[ri + i][ci + j] = cell; }
        ci += cs;
      });
    });
    return {g, pos};
  }
  function rowBlockBounds(table,index,G=gridOf(table)){
    const rows=[...table.rows],section=rows[index]&&rows[index].parentElement;if(!section)return null;let start=index,end=index,again=true;
    while(again){again=false;for(let r=start;r<=end;r++){if(!rows[r]||rows[r].parentElement!==section)continue;for(const cell of new Set(G.g[r]||[])){const q=G.pos.get(cell);if(!q||rows[q.r]?.parentElement!==section)continue;const last=Math.min(rows.length-1,q.r+q.rs-1);if(q.r<=end&&last>=start&&(q.r<start||last>end)){start=Math.min(start,q.r);end=Math.max(end,last);again=true}}}}
    return {start,end,section};
  }
  function moveTableRow(table,from,to,step=false){
    const rows=[...table.rows];if(!rows[from]||!rows[to]||from===to)return false;const G=gridOf(table),src=rowBlockBounds(table,from,G);let dst=rowBlockBounds(table,to,G);if(!src||!dst)return false;
    const down=from<to;if(dst.start>=src.start&&dst.end<=src.end){if(!step)return false;const next=down?src.end+1:src.start-1;if(next<0||next>=rows.length)return false;dst=rowBlockBounds(table,next,G);if(!dst||dst.start>=src.start&&dst.end<=src.end)return false}
    const source=rows.slice(src.start,src.end+1),target=rows.slice(dst.start,dst.end+1);if(source.some(r=>r.parentElement!==src.section))return false;
    const before=tSnap(),frag=document.createDocumentFragment();source.forEach(r=>frag.appendChild(r));
    if(down){const anchor=target[target.length-1].nextSibling;dst.section.insertBefore(frag,anchor)}else dst.section.insertBefore(frag,target[0]);
    [...table.children].filter(x=>/^(THEAD|TBODY|TFOOT)$/.test(x.tagName)&&!x.rows.length).forEach(x=>x.remove());
    tCommit(before);changed();return true;
  }
  function moveTableColumn(table,from,to){
    const rows=[...table.rows],G=gridOf(table),n=Math.max(0,...G.g.map(r=>r.length));if(from===to||from<0||to<0||from>=n||to>=n||!rows.length)return false;
    let s=from,e=from+1,again=true;while(again){again=false;for(const [,q] of G.pos){if(q.c<e&&q.c+q.cs>s){const ns=Math.min(s,q.c),ne=Math.max(e,q.c+q.cs);if(ns<s||ne>e){s=ns;e=ne;again=true}}}}
    const targetCells=[...G.pos].filter(([cell,q])=>q.c<=to&&q.c+q.cs>to).map(([cell,q])=>q);if(!targetCells.length)return false;let ts=Math.min(...targetCells.map(q=>q.c)),te=Math.max(...targetCells.map(q=>q.c+q.cs));if(ts<e&&te>s)return false;
    const left=to<s;let boundary=left?ts:te;again=true;while(again){again=false;for(const q of G.pos.values())if(q.c<boundary&&q.c+q.cs>boundary){const next=left?q.c:q.c+q.cs;if(next!==boundary){boundary=next;again=true}}}
    if(boundary<=s&&boundary>=s&&boundary<=e)return false;const order=Array.from({length:n},(_,i)=>i),block=order.splice(s,e-s);let dest=boundary-(s<boundary?e-s:0);dest=Math.max(0,Math.min(order.length,dest));order.splice(dest,0,...block);if(order.every((v,i)=>v===i))return false;
    const newPos=new Map(order.map((old,i)=>[old,i])),before=tSnap();
    rows.forEach(tr=>{const cells=[...tr.cells].map(cell=>{const q=G.pos.get(cell),cols=Array.from({length:q.cs},(_,k)=>newPos.get(q.c+k));return {cell,pos:Math.min(...cols)}}).sort((a,b)=>a.pos-b.pos);cells.forEach(x=>tr.appendChild(x.cell))});
    const cg=table.querySelector(':scope > colgroup');if(cg&&cg.children.length===n){const cols=[...cg.children].map((col,i)=>({col,pos:newPos.get(i)})).sort((a,b)=>a.pos-b.pos);cols.forEach(x=>cg.appendChild(x.col))}
    tCommit(before);changed();return true;
  }
  function mergeCells(list){
    const cells = list || selCells();
    if(cells.length < 2){ alert('Selecione duas ou mais células (arraste o mouse sobre elas) para mesclar.'); return false; }
    const table = cells[0].closest('table'); const {g, pos} = gridOf(table);
    let r0 = 1e9, c0 = 1e9, r1 = -1, c1 = -1;
    cells.forEach(x=>{ const q = pos.get(x); r0 = Math.min(r0, q.r); c0 = Math.min(c0, q.c); r1 = Math.max(r1, q.r + q.rs - 1); c1 = Math.max(c1, q.c + q.cs - 1); });
    // expande o retângulo até não cortar nenhuma célula já mesclada
    for(let ch = true; ch;){
      ch = false;
      for(let r = r0; r <= r1; r++) for(let c = c0; c <= c1; c++){
        const q = pos.get(g[r][c]);
        if(q.r < r0 || q.c < c0 || q.r + q.rs - 1 > r1 || q.c + q.cs - 1 > c1){
          r0 = Math.min(r0, q.r); c0 = Math.min(c0, q.c); r1 = Math.max(r1, q.r + q.rs - 1); c1 = Math.max(c1, q.c + q.cs - 1); ch = true;
        }
      }
    }
    const keep = g[r0][c0], seen = new Set([keep]); let html = [];
    if(keep.textContent.trim() || keep.querySelector('img')) html.push(keep.innerHTML);
    for(let r = r0; r <= r1; r++) for(let c = c0; c <= c1; c++){
      const x = g[r][c]; if(seen.has(x)) continue; seen.add(x);
      if(x.textContent.trim() || x.querySelector('img')) html.push(x.innerHTML);
      x.remove();
    }
    keep.innerHTML = html.join('<br>') || '<br>';
    keep.colSpan = c1 - c0 + 1; keep.rowSpan = r1 - r0 + 1;
    if(keep.colSpan === 1) keep.removeAttribute('colspan'); if(keep.rowSpan === 1) keep.removeAttribute('rowspan');
    return true;
  }
  function newCellLike(ref){ const n = ref.cloneNode(false); n.removeAttribute('colspan'); n.removeAttribute('rowspan'); n.innerHTML = '<br>'; return n; }
  function insertCellAt(g, pos, r, c, cell){
    const tr = g.tr[r]; let before = null;
    for(let j = c + 1; j < g.g[r].length; j++){ const x = g.g[r][j]; if(x && x.parentNode === tr && pos.get(x).r === r && pos.get(x).c > c){ before = x; break; } }
    tr.insertBefore(cell, before);
  }
  function splitCell(){
    const c = cellOf(); if(!c) return false;
    const table = c.closest('table'), G = gridOf(table); G.tr = [...table.rows];
    const q = G.pos.get(c);
    if(q.cs > 1 || q.rs > 1){
      c.removeAttribute('colspan'); c.removeAttribute('rowspan');
      for(let r = q.r; r < q.r + q.rs; r++) for(let k = q.c; k < q.c + q.cs; k++){
        if(r === q.r && k === q.c) continue;
        insertCellAt(G, G.pos, r, k, newCellLike(c));
      }
      return true;
    }
    const n = parseInt(prompt('Dividir a célula em quantas colunas?', '2'), 10);
    if(!(n > 1 && n <= 12)) return false;
    // outras células que cruzam esta coluna ganham largura
    const done = new Set([c]);
    G.g.forEach(row=>{ const x = row[q.c]; if(x && !done.has(x)){ done.add(x); x.colSpan = (x.colSpan || 1) + n - 1; } });
    for(let i = 1; i < n; i++) c.parentNode.insertBefore(newCellLike(c), c.nextSibling);
    return true;
  }
  // Dividir tabela (como no Word): a linha do cursor vira a 1ª linha de uma nova tabela, com um parágrafo vazio entre as duas
  function splitTable(c){
    const table = c.closest('table'), rows = [...table.rows], tr = c.parentNode, i = rows.indexOf(tr);
    const gap = ()=>{ const p = document.createElement('p'); p.innerHTML = '<br>'; return p; };
    if(i <= 0){ table.parentNode.insertBefore(gap(), table); return true; }   // 1ª linha: só abre um parágrafo acima da tabela
    for(let r = 0; r < i; r++) for(const x of rows[r].cells) if(r + x.rowSpan > i){ alert('Não dá para dividir aqui: uma célula mesclada atravessa esta linha.'); return false; }
    const t2 = table.cloneNode(false); t2.removeAttribute('id');
    const cg = [...table.children].find(k=>k.tagName === 'COLGROUP'); if(cg) t2.appendChild(cg.cloneNode(true));
    const tb = document.createElement('tbody'); t2.appendChild(tb);
    rows.slice(i).forEach(r=>tb.appendChild(r));
    [...table.children].forEach(k=>{ if(/^(TBODY|THEAD|TFOOT)$/.test(k.tagName) && !k.rows.length) k.remove(); });
    table.parentNode.insertBefore(t2, table.nextSibling);
    table.parentNode.insertBefore(gap(), t2);
    const r = document.createRange(), sl = getSelection(); r.selectNodeContents(t2.rows[0].cells[0]); r.collapse(true); sl.removeAllRanges(); sl.addRange(r);
    return true;
  }
  // Converter tabela em texto: cada linha vira um parágrafo, com Tab entre as células (usado pelo menu Tabela e pela aba Layout da Tabela)
  window.__tblToText = function(){
    restore(); const c = cellOf(); if(!c){ alert('Clique dentro da tabela e tente de novo.'); return; }
    const t = c.closest('table'), fr = document.createDocumentFragment();
    [...t.rows].forEach(r=>{
      const p = document.createElement('p');
      [...r.cells].forEach((cell, i)=>{
        if(i){ const tb = document.createElement('span'); tb.className = 'tb'; tb.textContent = '\t'; p.appendChild(tb); }
        p.appendChild(document.createTextNode(cell.innerText.replace(/\s*\n+\s*/g, ' ').trim()));
      });
      if(!p.textContent) p.appendChild(document.createElement('br'));
      fr.appendChild(p);
    });
    t.replaceWith(fr); changed();
    setTimeout(()=>{ const tt = document.getElementById('tab-tabela'); if(tt && !(cellOf() && cellOf().closest('table'))){ tt.hidden = true; if(tt.classList.contains('on')) $('tab-inicio').click(); } }, 0);
  };
  function setBorders(table, mode){
    const line = {bAll:'1px solid #000', bThick:'2pt solid #000', bOuter:'1px solid #000', bDash:'1px dashed #000', bNone:'none'}[mode];
    table.style.borderCollapse = 'collapse';
    table.style.border = mode === 'bNone' ? 'none' : line;
    table.querySelectorAll('td,th').forEach(x=>{
      if(x.closest('table') !== table) return;
      x.style.border = mode === 'bOuter' ? 'none' : line;
    });
  }
  $('tbl2').addEventListener('change', e=>{
    const a = e.target.value; e.target.selectedIndex = 0; restore();
    const c = cellOf();
    if(!c){ alert('Clique dentro de uma célula da tabela e escolha de novo.'); return; }
    const table = c.closest('table');
    if(a === 'merge'){ if(!mergeCells()) return; }
    else if(a === 'split'){ const tw = tblSnap(table), q0 = (gridOf(table).pos.get(c) || {c:0, cs:1, rs:1}); const was = q0.cs > 1 || q0.rs > 1; if(!splitCell()) return; if(tw && !was) tblAdjust(table, tw, 'spl' + q0.c); else if(tw) tblAdjust(table, tw, ''); }
    else if(a === 'splitTbl'){ if(!splitTable(c)) return; }
    else if(/^v(Top|Mid|Bot)$/.test(a)){ const v = {vTop:'top', vMid:'middle', vBot:'bottom'}[a]; selCells().forEach(x=>x.style.verticalAlign = v); }
    else if(/^h(Left|Center|Right)$/.test(a)){ const v = a.slice(1).toLowerCase(); selCells().forEach(x=>x.style.textAlign = v); }
    else if(/^b(All|Thick|Outer|Dash|None)$/.test(a)) setBorders(table, a);
    else if(a === 'header'){
      const on = !table.tHead || !table.tHead.rows.length;
      if(on){
        const th = table.tHead || table.createTHead(), tr = table.rows[0];
        th.appendChild(tr);
        [...tr.cells].forEach(x=>{ x.style.fontWeight = 'bold'; x.style.backgroundColor = '#e7e6e6'; });
      }else{
        const tr = table.tHead.rows[0], tb = table.tBodies[0] || table.appendChild(document.createElement('tbody'));
        tb.insertBefore(tr, tb.firstChild);
        [...tr.cells].forEach(x=>{ x.style.fontWeight = ''; x.style.backgroundColor = ''; });
        table.tHead.remove();
      }
    }
    else if(a === 'equal'){
      const n = tblCols(table).length, cw = tblCont(table), room = tblRoom(table, cw);
      tblApply(table, new Array(n).fill(room / n), cw);
    }
    else if(a === 'fit'){
      const w = tblCols(table), cw = tblCont(table), t = w.reduce((x, y)=>x + y, 0), room = tblRoom(table, cw);
      tblApply(table, w.map(x=>x * room / t), cw);
    }
    else if(a === 'auto'){
      table.style.tableLayout = ''; table.style.width = '';
      const cg = table.querySelector(':scope > colgroup'); if(cg) cg.remove();
      table.querySelectorAll('td,th').forEach(x=>{ if(x.closest('table') !== table) return; x.style.width = ''; x.style.boxSizing = ''; if(!x.getAttribute('style')) x.removeAttribute('style'); });
    }
    else if(a === 'tCenter'){ if(table.style.width === '100%') table.style.width = '80%'; table.style.marginLeft = 'auto'; table.style.marginRight = 'auto'; }
    else if(a === 'tLeft'){ table.style.marginLeft = ''; table.style.marginRight = ''; }
    else if(/^pad[SML]$/.test(a)){ const v = {padS:'2px 4px', padM:'6px 8px', padL:'12px 14px'}[a]; table.querySelectorAll('td,th').forEach(x=>{ if(x.closest('table') === table) x.style.padding = v; }); }
    changed();
  });
  $('cellShade').addEventListener('input', e=>{
    const v = e.target.value; restore(); selCells().forEach(x=>x.style.backgroundColor = v); changed();
  });
  $('cellShade').addEventListener('dblclick', ()=>{ restore(); selCells().forEach(x=>{ x.style.backgroundColor = ''; if(!x.getAttribute('style')) x.removeAttribute('style'); }); changed(); });

  // ---------- Tabela: largura/altura por arrastar, alça de tamanho e guia contextual "Layout da Tabela" ----------
  function tblScale(table){ const w = table.offsetWidth; return w ? table.getBoundingClientRect().width / w : 1; }
  function tblCont(table){ const p = table.parentElement, cs = getComputedStyle(p); return Math.max(40, p.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)); }
  function tblCols(table){                       // largura de cada coluna da grade (px de layout)
    const G = gridOf(table), n = Math.max(0, ...G.g.map(r=>r.length)), w = new Array(n).fill(0), sc = tblScale(table);
    G.pos.forEach((q, cell)=>{ if(q.cs === 1) w[q.c] = Math.max(w[q.c], cell.getBoundingClientRect().width / sc); });
    G.pos.forEach((q, cell)=>{
      if(q.cs < 2) return;
      const idx = []; let known = 0;
      for(let k = q.c; k < q.c + q.cs; k++){ if(w[k]) known += w[k]; else idx.push(k); }
      if(idx.length){ const rest = Math.max(cell.getBoundingClientRect().width / sc - known, idx.length * 24) / idx.length; idx.forEach(k=>w[k] = rest); }
    });
    return w.map(x=>x || 40);
  }
  function tblApply(table, w, cw){                // grava larguras em % (tabela, colgroup e células)
    const total = w.reduce((a, b)=>a + b, 0), G = gridOf(table);
    table.style.tableLayout = 'fixed'; table.style.width = (total / cw * 100).toFixed(3) + '%';
    let cg = table.querySelector(':scope > colgroup');
    if(!cg){ cg = document.createElement('colgroup'); table.insertBefore(cg, table.firstChild); }
    cg.innerHTML = w.map(x=>'<col style="width:' + (x / total * 100).toFixed(3) + '%">').join('');
    G.pos.forEach((q, cell)=>{
      let sum = 0; for(let k = q.c; k < q.c + q.cs; k++) sum += w[k];
      cell.style.width = (sum / total * 100).toFixed(3) + '%'; cell.style.boxSizing = 'border-box';
    });
  }
  function tblSnap(table){ return (table.querySelector(':scope > colgroup') || table.style.tableLayout === 'fixed') ? {w:tblCols(table), cw:tblCont(table)} : null; }
  function tblRoom(table, cw){ return Math.max(40, cw - (parseFloat(table.style.marginLeft) || 0) - (parseFloat(table.style.marginRight) || 0)); }   // largura útil descontando as margens da tabela
  function tblAdjust(table, snap, op){            // após inserir/excluir/dividir coluna, mantém as larguras que o usuário definiu
    let w = snap.w.slice(); const m = /^(ins|del|spl)(\d+)$/.exec(op || ''), k = m ? +m[2] : -1, now = gridOf(table).g.reduce((a, r)=>Math.max(a, r.length), 0);
    if(m && m[1] === 'ins') w.splice(k, 0, snap.w[Math.min(k, snap.w.length - 1)]);
    else if(m && m[1] === 'del') w.splice(k, 1);
    else if(m && m[1] === 'spl'){ const n = now - w.length + 1; w.splice(k, 1, ...new Array(n).fill(snap.w[k] / n)); }
    if(w.length !== now) w = new Array(now).fill(snap.cw / now);
    const t = w.reduce((a, b)=>a + b, 0), room = tblRoom(table, snap.cw); if(t > room) w = w.map(x=>x * room / t);
    tblApply(table, w, snap.cw);
  }
  function setRowH(tr, h){                        // a altura da linha vale também para células com height fixo (modelos), senão a linha não encolhe
    tr.style.height = h.toFixed(1) + 'px';
    [...tr.cells].forEach(c=>{ if(c.style.height){ c.style.height = ''; if(!c.getAttribute('style')) c.removeAttribute('style'); } });
  }
  function rowH(table, r){ return table.rows[r].getBoundingClientRect().height / tblScale(table); }

  (function(){
    const HIT = 4, MINW = 24, MINH = 14, handle = document.createElement('div');
    handle.id = 'tblHandle'; handle.title = 'Arraste para mudar o tamanho da tabela'; document.body.appendChild(handle);
    const mv = document.createElement('div'); mv.id = 'tblMove'; mv.textContent = '✥'; mv.title = 'Arraste para mover a tabela (para cima/baixo entre os blocos e para os lados)'; document.body.appendChild(mv);
    const drop = document.createElement('div'); drop.id = 'tblDrop'; document.body.appendChild(drop);
    let drag = null, hoverT = null, mdrag = null;
    const off = ()=>document.body.classList.contains('hfedit');
    function hit(e){
      const pts = [[0, 0], [HIT, 0], [-HIT, 0], [0, HIT], [0, -HIT]], cells = new Set();
      pts.forEach(([dx, dy])=>{ const el = document.elementFromPoint(e.clientX + dx, e.clientY + dy), c = el && el.closest && el.closest('td,th'); if(c && page.contains(c)) cells.add(c); });
      let best = null;
      cells.forEach(c=>{
        const r = c.getBoundingClientRect(), table = c.closest('table'), q = gridOf(table).pos.get(c); if(!q) return;
        const dR = Math.abs(e.clientX - r.right), dB = Math.abs(e.clientY - r.bottom);
        if(dR <= HIT && e.clientY >= r.top - 1 && e.clientY <= r.bottom + 1 && (!best || dR < best.d)) best = {t:'col', table, k:q.c + q.cs - 1, d:dR};
        if(dB <= HIT && e.clientX >= r.left - 1 && e.clientX <= r.right + 1 && (!best || dB < best.d - 0.01)) best = {t:'row', table, k:q.r + q.rs - 1, d:dB};
      });
      return best;
    }
    function cursorFor(h){ page.classList.toggle('tbl-cr', !!h && h.t === 'col'); page.classList.toggle('tbl-rr', !!h && h.t === 'row'); }
    function placeHandle(table){
      if(!table || off()){ handle.style.display = 'none'; mv.style.display = 'none'; return; }
      const r = table.getBoundingClientRect(), pr = page.getBoundingClientRect();
      if(r.bottom < pr.top - 2 || r.top > innerHeight){ handle.style.display = 'none'; mv.style.display = 'none'; return; }
      handle.style.display = 'block'; handle.style.left = Math.round(r.right + 1) + 'px'; handle.style.top = Math.round(r.bottom + 1) + 'px';
      if(!mdrag){ mv.style.display = 'block'; mv.style.left = Math.round(Math.max(2, r.left - 19)) + 'px'; mv.style.top = Math.round(Math.max(r.top, pr.top) + 1) + 'px'; }
    }
    page.addEventListener('mousemove', e=>{
      if(drag || off()) return;
      const h = hit(e); cursorFor(h);
      const c = e.target.closest && e.target.closest('td,th'); const t = c ? c.closest('table') : null;
      if(t !== hoverT){ hoverT = t; placeHandle(t); }
    });
    page.addEventListener('mouseleave', ()=>{ cursorFor(null); setTimeout(()=>{ if(!drag && !mdrag && !handle.matches(':hover') && !mv.matches(':hover')){ hoverT = null; handle.style.display = 'none'; mv.style.display = 'none'; } }, 250); });
    handle.addEventListener('mouseleave', ()=>{ if(!drag && !mdrag && !page.matches(':hover') && !mv.matches(':hover')){ hoverT = null; handle.style.display = 'none'; mv.style.display = 'none'; } });
    mv.addEventListener('mouseleave', ()=>{ if(!mdrag && !page.matches(':hover')){ hoverT = null; handle.style.display = 'none'; mv.style.display = 'none'; } });
    document.addEventListener('scroll', ()=>{ if(!drag && !mdrag) { hoverT = null; handle.style.display = 'none'; mv.style.display = 'none'; } }, true);

    // ----- mover a tabela: ✥ no canto; solta entre blocos (muda a ordem) e para os lados (recuo à esquerda) -----
    // o título da seção (parágrafo com "manter com o próximo") anda junto com a caixa
    function grpOf(t){
      const g = []; let pv = t.previousElementSibling;
      while(pv && pv.tagName !== 'TABLE' && pv.tagName !== 'DIV' && (pv.style.breakAfter || pv.style.pageBreakAfter) === 'avoid'){ g.unshift(pv); pv = pv.previousElementSibling; }
      return g.concat([t]);
    }
    function slotAt(y, tbl){
      const skip = Array.isArray(tbl) ? tbl : [tbl];
      const ks = [...page.children].filter(k=>skip.indexOf(k) < 0 && !k.hasAttribute('data-hid') && !k.classList.contains('hf') && !/^(absolute|fixed)$/.test(getComputedStyle(k).position));
      const keepN = n=>n && n.tagName !== 'TABLE' && n.tagName !== 'DIV' && (n.style.breakAfter || n.style.pageBreakAfter) === 'avoid' && skip.indexOf(n) < 0;
      for(const k of ks){
        const r = k.getBoundingClientRect();
        if(y < r.top + r.height / 2){ let ref = k; while(keepN(ref.previousElementSibling)) ref = ref.previousElementSibling; return {ref, y:ref.getBoundingClientRect().top}; }   // nunca solta entre o título e a caixa dele
      }
      const l = ks[ks.length - 1]; return {ref:null, y:l ? l.getBoundingClientRect().bottom : 0};
    }
    mv.addEventListener('pointerdown', e=>{
      if(e.button !== 0 || !hoverT) return; e.preventDefault(); e.stopPropagation();
      let t = hoverT; while(t && t.parentNode !== page){ t = t.parentNode && t.parentNode.closest ? t.parentNode.closest('table') : null; if(!t) break; }
      t = t || hoverT; if(t.parentNode !== page){ return; }
      mdrag = {hb:tSnap(), t, grp:grpOf(t), x0:e.clientX, y0:e.clientY, sc:tblScale(t), ml0:parseFloat(getComputedStyle(t).marginLeft) || 0, moved:false};
      mv.classList.add('drag'); mv.setPointerCapture(e.pointerId); document.body.style.cursor = 'move';
    });
    mv.addEventListener('pointermove', e=>{
      if(!mdrag) return; const d = mdrag, dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if(!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return; d.moved = true;
      d.grp.forEach(n=>{ n.style.opacity = '.55'; n.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; });
      const s = slotAt(e.clientY, d.grp), pr = page.getBoundingClientRect();
      drop.style.display = 'block'; drop.style.left = Math.round(pr.left + 10) + 'px'; drop.style.width = Math.round(pr.width - 20) + 'px'; drop.style.top = Math.round(s.y - 1) + 'px';
      d.slot = s;
    });
    const mend = (e, cancel)=>{
      if(!mdrag) return; const d = mdrag; mdrag = null;
      d.grp.forEach(n=>{ n.style.opacity = ''; n.style.transform = ''; if(!n.getAttribute('style')) n.removeAttribute('style'); });
      drop.style.display = 'none'; mv.classList.remove('drag'); document.body.style.cursor = '';
      try{ mv.releasePointerCapture(e.pointerId); }catch(_){}
      if(cancel || !d.moved){ placeHandle(d.t); return; }
      const t = d.t, dx = (e.clientX - d.x0) / d.sc, s = d.slot;
      if(s){
        const here = t.nextElementSibling === s.ref || (!s.ref && !t.nextElementSibling);
        if(!here && s.ref !== t){ d.grp.forEach(n=>{ if(s.ref) page.insertBefore(n, s.ref); else page.appendChild(n); }); }
      }
      if(Math.abs(dx) > 3){
        const cw = tblCont(t), w = t.offsetWidth, ml = Math.max(0, Math.min(Math.max(0, cw - w), d.ml0 + dx));
        t.style.marginLeft = Math.round(ml) + 'px';
      }
      if(!t.nextElementSibling || t.nextElementSibling.tagName === 'TABLE'){ const p = document.createElement('p'); p.innerHTML = '<br>'; t.after(p); }
      tCommit(d.hb); changed(); placeHandle(t);
    };
    mv.addEventListener('pointerup', e=>mend(e, false));
    mv.addEventListener('pointercancel', e=>mend(e, true));
    document.addEventListener('keydown', e=>{ if(mdrag && e.key === 'Escape') mend({clientX:mdrag.x0, clientY:mdrag.y0, pointerId:0}, true); });

    function start(e, kind, table, k){
      const w0 = tblCols(table), sc = tblScale(table);
      drag = {hb:tSnap(), kind, table, k, x0:e.clientX, y0:e.clientY, sc, w0, cw:tblCont(table), t0:w0.reduce((a, b)=>a + b, 0),
              h0:[...table.rows].map((r, i)=>rowH(table, i))};
      document.body.classList.add('tbl-drag'); document.body.style.cursor = kind === 'col' ? 'col-resize' : kind === 'row' ? 'row-resize' : 'nwse-resize';
      if(kind === 'corner') handle.classList.add('drag');
    }
    page.addEventListener('mousedown', e=>{
      if(e.button !== 0 || off()) return;
      const h = hit(e); if(!h) return;
      e.preventDefault(); e.stopPropagation(); start(e, h.t, h.table, h.k);
    }, true);
    handle.addEventListener('pointerdown', e=>{
      if(e.button !== 0 || !hoverT) return; e.preventDefault(); e.stopPropagation(); start(e, 'corner', hoverT, 0);
      try{ handle.setPointerCapture(e.pointerId); }catch(_){}
    });
    document.addEventListener('pointermove', e=>{
      if(!drag) return; e.preventDefault();
      const d = drag, dx = (e.clientX - d.x0) / d.sc, dy = (e.clientY - d.y0) / d.sc;
      if(d.kind === 'col'){
        const w = d.w0.slice(), k = d.k, last = k === w.length - 1;
        if(!last && !e.shiftKey){ const x = Math.max(MINW - w[k], Math.min(dx, w[k + 1] - MINW)); w[k] += x; w[k + 1] -= x; }
        else { w[k] += Math.max(MINW - w[k], Math.min(dx, Math.max(0, d.cw - d.t0))); }
        tblApply(d.table, w, d.cw);
      }else if(d.kind === 'row'){
        setRowH(d.table.rows[d.k], Math.max(MINH, d.h0[d.k] + dy));
      }else{
        const t = Math.max(MINW * d.w0.length, Math.min(d.cw, d.t0 + dx)), f = t / d.t0;
        tblApply(d.table, d.w0.map(x=>x * f), d.cw);
        if(Math.abs(dy) > 2){ const H = d.h0.reduce((a, b)=>a + b, 0), g = Math.max(.2, (H + dy) / H); [...d.table.rows].forEach((r, i)=>setRowH(r, Math.max(MINH, d.h0[i] * g))); }
        placeHandle(d.table);
      }
    });
    const dragEnd = ()=>{
      if(!drag) return;
      const t = drag.table; tCommit(drag.hb); drag = null; handle.classList.remove('drag');
      document.body.classList.remove('tbl-drag'); document.body.style.cursor = ''; cursorFor(null);
      placeHandle(t); changed(); syncT();
    };
    document.addEventListener('pointerup', dragEnd); document.addEventListener('pointercancel', dragEnd); document.addEventListener('mouseup', dragEnd);

    // ----- guia contextual "Layout da Tabela" -----
    const tabT = $('tab-tabela'), panelT = $('tp-tabela'), hI = $('tCellH'), wI = $('tCellW');
    function inTable(){
      const s = getSelection(); if(off() || !s.rangeCount || !page.contains(s.anchorNode)) return null;
      return cellAt(s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode);
    }
    function syncT(){
      const c = inTable(); if(!c || panelT.hidden) return;
      const table = c.closest('table'), q = gridOf(table).pos.get(c); if(!q) return;
      if(document.activeElement !== hI) hI.value = (rowH(table, q.r) / CMPX).toFixed(2);
      if(document.activeElement !== wI){ const w = tblCols(table); let sum = 0; for(let k = q.c; k < q.c + q.cs; k++) sum += w[k]; wI.value = (sum / CMPX).toFixed(2); }
    }
    document.addEventListener('selectionchange', ()=>{
      if(document.activeElement && document.activeElement.closest && document.activeElement.closest('#toolbar')) return;
      const c = inTable(); tabT.hidden = !c;
      if(c && !drag && !mdrag && matchMedia('(pointer:coarse)').matches){   // celular/tablet não tem "passar o mouse": mostra as alças da tabela onde está o cursor
        let top = c.closest('table'); while(top && top.parentNode !== page){ const up = top.parentNode && top.parentNode.closest ? top.parentNode.closest('table') : null; if(!up) break; top = up; }
        if(top && top.parentNode === page && top !== hoverT){ hoverT = top; placeHandle(top); }
      }
      if(!c && tabT.classList.contains('on')) $('tab-inicio').click();
      syncT();
    });
    tabT.addEventListener('click', ()=>setTimeout(syncT, 0));
    let tPend = null;
    [[panelT, 'click'], [$('tbl'), 'change'], [$('tbl2'), 'change'], [$('tblStyle') || panelT, 'change']].forEach(([el, ev])=>{
      if(!el) return;
      el.addEventListener(ev, ()=>{ if(tPend !== null) return; tPend = tSnap(); setTimeout(()=>{ const b = tPend; tPend = null; tCommit(b); }, 80); }, true);
    });
    function run(a){
      restore();
      let next = null;                                   // após excluir linha/coluna, o cursor vai para a célula vizinha
      if(a === 'rowD' || a === 'colD'){
        const c = inTable(), table = c && c.closest('table'), G = table && gridOf(table), q = G && G.pos.get(c);
        if(q) next = a === 'colD' ? (G.g[q.r][q.c + q.cs] || G.g[q.r][q.c - 1]) : ((G.g[q.r + q.rs] || [])[q.c] || (G.g[q.r - 1] || [])[q.c]);
      }
      const sel = /^(rowB|rowA|colB|colA|rowD|colD|tblD)$/.test(a) ? $('tbl') : $('tbl2');
      sel.value = a; sel.dispatchEvent(new Event('change'));
      if(next && next.isConnected){ const r = document.createRange(), s = getSelection(); r.selectNodeContents(next); r.collapse(true); s.removeAllRanges(); s.addRange(r); }
      setTimeout(()=>{ const c = inTable(); tabT.hidden = !c; if(!c && tabT.classList.contains('on')) $('tab-inicio').click(); syncT(); }, 0);
    }
    panelT.querySelectorAll('button[data-t]').forEach(b=>{
      b.addEventListener('mousedown', e=>e.preventDefault());
      b.addEventListener('click', ()=>{
        if(b.dataset.t === 'dRows') return distRows();
        run(b.dataset.t);
      });
    });
    // Dados e propriedades de tabela
    const sortDlg=$('tSortDlg'), propDlg=$('tPropDlg');let sortTarget=null, propTarget=null, propCell=null;
    function tableOfCursor(){const c=inTable();return c&&c.closest('table')}
    function parseTableNumber(v){let x=String(v||'').trim().replace(/[^0-9,.-]/g,'');if(!x)return null;if(x.includes(','))x=x.replace(/\./g,'').replace(',','.');const n=Number(x);return Number.isFinite(n)?n:null}
    function cellValue(G,row,col){const c=G.g[row]&&G.g[row][col];return c?(c.innerText||c.textContent||'').trim():''}
    function formulaValue(table,cell,kind){const G=gridOf(table),q=G.pos.get(cell);if(!q||q.r===0)return null;const vals=[],seen=new Set();for(let r=0;r<q.r;r++){const c=G.g[r]&&G.g[r][q.c];if(!c||c===cell||seen.has(c))continue;seen.add(c);const n=parseTableNumber(c.innerText||c.textContent);if(n!==null)vals.push(n)}if(kind==='COUNT_ABOVE')return vals.length;if(!vals.length)return 0;return kind==='AVG_ABOVE'?vals.reduce((a,b)=>a+b,0)/vals.length:vals.reduce((a,b)=>a+b,0)}
    function formatFormula(n){return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:4}).format(n)}
    function recalcFormulaCell(cell){const f=cell.dataset.formula;if(!f)return false;const n=formulaValue(cell.closest('table'),cell,f);if(n===null)return false;const text=formatFormula(n);if(cell.textContent!==text){cell.textContent=text;return true}return false}
    function recalcTableFormulas(table){let any=false;table.querySelectorAll('td[data-formula],th[data-formula]').forEach(c=>{if(c.closest('table')===table)any=recalcFormulaCell(c)||any});return any}
    function addFormula(kind){const c=inTable(),table=c&&c.closest('table');if(!c)return;const before=tSnap(),n=formulaValue(table,c,kind);if(n===null){alert('Selecione uma célula abaixo dos valores a calcular.');return}c.dataset.formula=kind;c.contentEditable='false';c.textContent=formatFormula(n);tCommit(before);changed()}
    $('tSum').addEventListener('mousedown',e=>e.preventDefault());$('tAvg').addEventListener('mousedown',e=>e.preventDefault());$('tCount').addEventListener('mousedown',e=>e.preventDefault());
    { // Exibir Linhas de Grade (só tela): classe no body + preferência guardada no navegador
      const gb=$('tGrid'); let on=false; try{ on=localStorage.getItem(LS_KEYS.tblgrid)==='1'; }catch(_){}
      const apply=()=>{ document.body.classList.toggle('tblgrid',on); gb.setAttribute('aria-pressed',on?'true':'false'); gb.classList.toggle('on',on); };
      gb.addEventListener('mousedown',e=>e.preventDefault());
      gb.onclick=()=>{ on=!on; try{ localStorage.setItem(LS_KEYS.tblgrid,on?'1':'0'); }catch(_){} apply(); };
      apply();
    }
    $('tSum').onclick=()=>addFormula('SUM_ABOVE');$('tAvg').onclick=()=>addFormula('AVG_ABOVE');$('tCount').onclick=()=>addFormula('COUNT_ABOVE');
    let fmT=0;page.addEventListener('input',e=>{if(e.target.closest&&e.target.closest('[data-formula]'))return;clearTimeout(fmT);fmT=setTimeout(()=>{let any=false;page.querySelectorAll('table').forEach(t=>any=recalcTableFormulas(t)||any);if(any)changed()},400)});
    $('tSortOpen').addEventListener('mousedown',e=>e.preventDefault());$('tSortCancel').onclick=()=>sortDlg.close();
    $('tSortOpen').onclick=()=>{const t=sortTarget=tableOfCursor();if(!t){alert('Clique em uma célula da tabela que deseja classificar.');return}const n=Math.max(0,...gridOf(t).g.map(r=>r.length)),sel=$('tSortCol');sel.innerHTML='';for(let i=0;i<n;i++)sel.add(new Option('Coluna '+(i+1),String(i)));$('tSortHead').checked=!!(t.tHead&&t.tHead.rows.length);$('tSortMsg').textContent='';sortDlg.showModal()};
    function sortRowBlocks(table,section,G){const all=[...table.rows],rows=[...section.rows];if(!rows.length)return [];const base=all.indexOf(rows[0]),blocks=[];let i=0;while(i<rows.length){let end=i,again=true;while(again){again=false;for(let j=i;j<=end;j++)for(const cell of new Set(G.g[base+j]||[])){const q=G.pos.get(cell);if(!q)continue;const a=q.r-base,z=Math.min(rows.length-1,q.r+q.rs-1-base);if(a<=end&&z>=i&&z>end){end=z;again=true}}}end=Math.min(end,rows.length-1);blocks.push({rows:rows.slice(i,end+1),i});i=end+1}return blocks}
    $('tSortApply').onclick=()=>{const t=sortTarget;if(!t||!t.isConnected)return;const col=+$('tSortCol').value,numeric=$('tSortType').value==='number',desc=$('tSortDir').value==='desc',hasHead=$('tSortHead').checked,G=gridOf(t),bodies=[...t.tBodies];if(!bodies.length){$('tSortMsg').textContent='A tabela não contém linhas de dados.';return}const before=tSnap(),coll=new Intl.Collator('pt-BR',{numeric:true,sensitivity:'base'});bodies.forEach((body,bi)=>{const blocks=sortRowBlocks(t,body,G);if(!blocks.length)return;const pinHeader=hasHead&&!t.tHead&&bi===0?blocks[0]:null,data=pinHeader?blocks.slice(1):blocks;const keyed=data.map((b,i)=>{const gi=[...t.rows].indexOf(b.rows[0]);return {...b,order:i,key:cellValue(G,gi,col)}});keyed.sort((a,b)=>{let d;if(numeric){const x=parseTableNumber(a.key),y=parseTableNumber(b.key);if(x===null||y===null){if(x===null&&y!==null)return 1;if(y===null&&x!==null)return -1;d=0}else d=x-y}else d=coll.compare(a.key,b.key);return (desc?-d:d)||a.order-b.order});const ordered=(pinHeader?[pinHeader]:[]).concat(keyed);ordered.forEach(group=>group.rows.forEach(row=>body.appendChild(row)))});recalcTableFormulas(t);tCommit(before);changed();sortDlg.close()};
    $('tRepeatHeader').addEventListener('mousedown',e=>e.preventDefault());$('tRepeatHeader').onclick=()=>{const t=tableOfCursor();if(!t){alert('Clique dentro da tabela primeiro.');return}const before=tSnap();if(t.dataset.repeatTitle==='1'){delete t.dataset.repeatTitle;if(t.tHead){const rows=[...t.tHead.rows],body=t.tBodies[0]||t.createTBody();rows.reverse().forEach(r=>body.insertBefore(r,body.firstChild));t.tHead.remove()}}else{let row=t.tHead&&t.tHead.rows[0];if(!row){const body=t.tBodies[0];row=body&&body.rows[0];if(row){const h=t.createTHead();h.appendChild(row)}}if(!row){alert('A tabela não tem linha para repetir.');return}t.dataset.repeatTitle='1';t.tHead.style.display='table-header-group'}tCommit(before);changed()};
    $('tTextDir').addEventListener('mousedown',e=>e.preventDefault());$('tTextDir').onclick=()=>{const c=inTable();if(!c){alert('Clique dentro da célula que deseja formatar.');return}const before=tSnap(),v=c.style.writingMode==='vertical-rl';c.style.writingMode=v?'horizontal-tb':'vertical-rl';c.style.textOrientation=v?'':'mixed';tCommit(before);changed()};
    // Dialogo de propriedades tabulado
    $('tPropOpen').addEventListener('mousedown',e=>e.preventDefault());
    document.querySelectorAll('#tPropDlg [data-prop-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#tPropDlg [data-prop-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));document.querySelectorAll('#tPropDlg [data-prop-panel]').forEach(x=>x.hidden=x.dataset.propPanel!==b.dataset.propTab)}));
    $('tpPropCancel').onclick=()=>propDlg.close();
    $('tPropOpen').onclick=()=>{const c=inTable(),t=c&&c.closest('table');if(!t){alert('Clique dentro da tabela para abrir as propriedades.');return}propTarget=t;propCell=c;const w=t.style.width||'',m=w.match(/^\s*([\d.]+)\s*(%|px|cm)?/i);$('tpWidth').value=m?m[1]:((t.getBoundingClientRect().width/CMPX).toFixed(2));$('tpWidthUnit').value=m&&m[2]?m[2].toLowerCase():'cm';$('tpAlign').value=t.style.marginLeft==='auto'?(t.style.marginRight==='0px'?'right':'center'):'left';const row=c.parentElement;$('tpRowBreak').value=row.dataset.allowPageBreak==='1'?'auto':'avoid';const G=gridOf(t),q=G.pos.get(c),ws=tblCols(t);$('tpColWidth').value=q?(ws[q.c]/CMPX).toFixed(2):'';$('tpColUnit').value='cm';$('tpCellPad').value=(parseFloat(getComputedStyle(c).padding)||0)/CMPX;$('tpCellGap').value=(parseFloat(getComputedStyle(t).borderSpacing)||0)/CMPX;$('tpTextDir').value=c.style.writingMode==='vertical-rl'?'vertical-rl':'horizontal-tb';$('tpAltTitle').value=t.getAttribute('aria-label')||t.title||'';$('tpAltDesc').value=t.getAttribute('aria-description')||'';$('tpPropMsg').textContent='';document.querySelector('#tPropDlg [data-prop-tab="table"]').click();propDlg.showModal()};
    $('tpPropApply').onclick=()=>{const t=propTarget,c=propCell;if(!t||!t.isConnected||!c||!c.isConnected)return;const v=parseFloat($('tpWidth').value),unit=$('tpWidthUnit').value;if(!(v>0)){ $('tpPropMsg').textContent='Informe uma largura preferida maior que zero.';return}const before=tSnap();t.style.width=v+unit;const al=$('tpAlign').value;t.style.marginLeft=al==='left'?'0':'auto';t.style.marginRight=al==='right'?'0':'auto';const row=c.parentElement;if($('tpRowBreak').value==='auto'){row.dataset.allowPageBreak='1';row.style.breakInside='auto';row.style.pageBreakInside='auto'}else{delete row.dataset.allowPageBreak;row.style.breakInside='avoid';row.style.pageBreakInside='avoid'}const G=gridOf(t),q=G.pos.get(c),ws=tblCols(t);if(q&&ws.length){const cv=parseFloat($('tpColWidth').value),cu=$('tpColUnit').value,room=tblCont(t);if(cv>0){const target=cu==='%'?room*cv/100:cu==='px'?cv:cv*CMPX,others=ws.reduce((a,b,i)=>a+(i===q.c?0:b),0),remain=Math.max(24,room-target);ws[q.c]=Math.min(target,room-24*(ws.length-1));if(others>0)ws.forEach((x,i)=>{if(i!==q.c)ws[i]=remain*x/others});tblApply(t,ws,room)}}const pad=parseFloat($('tpCellPad').value),gap=parseFloat($('tpCellGap').value);if(pad>=0)c.style.padding=(pad*CMPX)+'px';if(gap>=0){t.style.borderSpacing=(gap*CMPX)+'px';t.style.borderCollapse=gap>0?'separate':'collapse'}c.style.writingMode=$('tpTextDir').value;c.style.textOrientation=c.style.writingMode==='vertical-rl'?'mixed':'';const title=$('tpAltTitle').value.trim(),desc=$('tpAltDesc').value.trim();if(title){t.setAttribute('aria-label',title);t.title=title}else{t.removeAttribute('aria-label');t.removeAttribute('title')}if(desc)t.setAttribute('aria-description',desc);else t.removeAttribute('aria-description');t.style.width=v+unit;t.style.marginLeft=al==='left'?'0':'auto';t.style.marginRight=al==='right'?'0':'auto';tCommit(before);changed();propDlg.close()};
    // Inserção direta de tabela dentro da célula atual
    $('tToText').addEventListener('mousedown', e=>e.preventDefault()); $('tToText').addEventListener('click', ()=>window.__tblToText());
    const nestDlg=$('tNestDlg');let nestTarget=null,nestRange=null;$('tNestOpen').addEventListener('mousedown',e=>e.preventDefault());$('tNestCancel').onclick=()=>{nestTarget=null;nestRange=null;nestDlg.close()};
    $('tNestOpen').onclick=()=>{nestTarget=inTable();if(!nestTarget){alert('Clique dentro da célula onde deseja inserir a tabela aninhada.');return}const sel=getSelection();nestRange=sel.rangeCount?sel.getRangeAt(0).cloneRange():(savedRange&&savedRange.cloneRange());$('tNestMsg').textContent='';nestDlg.showModal()};
    $('tNestApply').onclick=()=>{const c=nestTarget,nr=Math.max(1,Math.min(20,parseInt($('tNestRows').value,10)||0)),nc=Math.max(1,Math.min(12,parseInt($('tNestCols').value,10)||0));if(!c||!c.isConnected){$('tNestMsg').textContent='A célula de destino não está mais disponível.';return}if(!nr||!nc){$('tNestMsg').textContent='Informe pelo menos uma linha e uma coluna.';return}const before=tSnap(),nt=document.createElement('table');nt.className='verbus-nested-table';nt.style.width='100%';nt.style.borderCollapse='collapse';nt.style.tableLayout='auto';for(let i=0;i<nr;i++){const tr=nt.insertRow();for(let j=0;j<nc;j++){const td=tr.insertCell();td.style.border='1px solid #777';td.style.padding='4px';td.innerHTML='<br>'}}if(nestRange&&c.contains(nestRange.commonAncestorContainer)){if(!nestRange.collapsed)nestRange.deleteContents();nestRange.insertNode(nt)}else c.appendChild(nt);caretIn(nt.rows[0].cells[0]);tCommit(before);changed();nestTarget=null;nestRange=null;nestDlg.close()};
    // Alt+Shift+seta move a linha da célula ativa, respeitando seções thead/tbody.
    page.addEventListener('keydown',e=>{if(!(e.altKey&&e.shiftKey&&!e.ctrlKey&&!e.metaKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')))return;const c=inTable();if(!c)return;const t=c.closest('table'),from=[...t.rows].indexOf(c.parentElement),to=from+(e.key==='ArrowUp'?-1:1);if(moveTableRow(t,from,to,true)){e.preventDefault();e.stopPropagation()}},true);
    // Explicit metadata controls for repeated headings and row-level page breaks.
    [['tRowUp', -1], ['tRowDown', 1]].forEach(([id, dir])=>{
      const b=$(id); b.addEventListener('mousedown', e=>e.preventDefault());
      b.addEventListener('click', ()=>{const c=inTable();if(!c)return;const t=c.closest('table'),from=[...t.rows].indexOf(c.parentElement);moveTableRow(t,from,from+dir,true)});
    });
    // ----- Estilos de tabela prontos + opções (linha de cabeçalho, totais, tiras, colunas) -----
    const TS = {
      grade:  {n:'Grade de Tabela',            mode:'box',  b:'1px solid #000',    hbg:'',        hfg:'',     band:'#f2f2f2'},
      clara:  {n:'Grade Clara',                mode:'box',  b:'1px solid #bfbfbf', hbg:'#f2f2f2', hfg:'',     band:'#f7f7f7'},
      azul:   {n:'Azul',                       mode:'box',  b:'1px solid #9dc3e6', hbg:'#2e74b5', hfg:'#fff', band:'#deeaf6'},
      verde:  {n:'Verde',                      mode:'box',  b:'1px solid #a9d18e', hbg:'#548235', hfg:'#fff', band:'#e2efd9'},
      laranja:{n:'Laranja',                    mode:'box',  b:'1px solid #f4b183', hbg:'#c55a11', hfg:'#fff', band:'#fbe4d5'},
      cinza:  {n:'Cinza Escuro',               mode:'box',  b:'1px solid #a6a6a6', hbg:'#404040', hfg:'#fff', band:'#ededed'},
      linhas: {n:'Só linhas horizontais',      mode:'rows', b:'1px solid #7f7f7f', hbg:'',        hfg:'',     band:'#f2f2f2'},
      tiras:  {n:'Sem bordas, em tiras',       mode:'none', b:'',                  hbg:'#d9d9d9', hfg:'',     band:'#f2f2f2'},
      tres:   {n:'Três linhas (ABNT)',         mode:'three',b:'',                  hbg:'',        hfg:'',     band:''}
    };
    const TS_RESET = ['backgroundColor', 'color', 'fontWeight', 'border', 'borderTop', 'borderBottom', 'borderLeft', 'borderRight'];
    const tsOpts = t=>new Set((t.dataset.to === undefined ? 'h,r' : t.dataset.to).split(',').filter(Boolean));
    function tsApply(table, key, o){
      const st = TS[key]; if(!st) return;
      const rows = [...table.rows], n = rows.length, G = gridOf(table), ncol = Math.max(0, ...G.g.map(r=>r.length));
      table.style.borderCollapse = 'collapse';
      table.style.border = st.mode === 'box' ? st.b : 'none';
      rows.forEach((tr, ri)=>{
        const isH = o.has('h') && ri === 0, isT = o.has('t') && ri === n - 1 && n > (o.has('h') ? 2 : 1), bi = ri - (o.has('h') ? 1 : 0);
        [...tr.cells].forEach(c=>{
          if(c.closest('table') !== table) return;
          TS_RESET.forEach(k=>c.style[k] = '');
          const q = G.pos.get(c) || {c:0, cs:1}, last = q.c + q.cs - 1 === ncol - 1;
          let bg = '';
          if(isH) bg = st.hbg;
          else if(!isT){ if(st.band && ((o.has('r') && bi % 2 === 0) || (o.has('bc') && q.c % 2 === 0))) bg = st.band; }
          if(bg) c.style.backgroundColor = bg;
          if(isH && st.hfg) c.style.color = st.hfg;
          if(isH || isT || (o.has('fc') && q.c === 0) || (o.has('lc') && last)) c.style.fontWeight = 'bold';
          if(st.mode === 'box'){ c.style.border = st.b; if(isT) c.style.borderTop = '2px solid ' + st.b.split(' ').pop(); }
          else if(st.mode === 'rows'){
            c.style.border = 'none';
            c.style.borderBottom = isH ? '2px solid #000' : st.b;
            if(isT) c.style.borderTop = '2px solid #000';
          }else if(st.mode === 'three'){
            c.style.border = 'none';
            if(ri === 0) c.style.borderTop = '1.5pt solid #000';
            if(isH) c.style.borderBottom = '1pt solid #000';
            if(isT) c.style.borderTop = '1pt solid #000';
            if(ri === n - 1) c.style.borderBottom = '1.5pt solid #000';
          }
          if(st.mode === 'none') c.style.border = 'none';
          if(!c.getAttribute('style')) c.removeAttribute('style');
        });
      });
      table.dataset.ts = key; table.dataset.to = [...o].join(',');
    }
    window.__tsApply = tsApply;
    (function(){
      const gal = $('tsGal'); if(!gal) return;
      Object.keys(TS).forEach(k=>{
        const b = document.createElement('button'); b.type = 'button'; b.dataset.ts = k; b.title = TS[k].n; b.setAttribute('role', 'option'); b.setAttribute('aria-label', TS[k].n);
        const t = document.createElement('table'); t.innerHTML = '<tbody>' + '<tr><td></td><td></td><td></td><td></td></tr>'.repeat(4) + '</tbody>';
        tsApply(t, k, new Set(['h', 'r'])); t.removeAttribute('data-ts'); t.removeAttribute('data-to');
        b.appendChild(t); gal.appendChild(b);
        b.addEventListener('mousedown', e=>e.preventDefault());
        b.addEventListener('click', ()=>{
          restore(); const c = inTable(); if(!c) return;
          const table = c.closest('table'); tsApply(table, k, tsOpts(table)); changed(); tsSync();
        });
      });
      panelT.querySelectorAll('input[data-to]').forEach(i=>{
        i.addEventListener('mousedown', e=>e.stopPropagation());
        i.addEventListener('change', ()=>{
          restore(); const c = inTable(); if(!c){ tsSync(); return; }
          const table = c.closest('table'), o = tsOpts(table);
          i.checked ? o.add(i.dataset.to) : o.delete(i.dataset.to);
          tsApply(table, table.dataset.ts || 'grade', o); changed(); tsSync();
        });
      });
    })();
    function tsSync(){
      const c = inTable(); if(!c || panelT.hidden) return;
      const t = c.closest('table'), o = tsOpts(t);
      panelT.querySelectorAll('input[data-to]').forEach(i=>{ if(document.activeElement !== i) i.checked = o.has(i.dataset.to); });
      panelT.querySelectorAll('#tsGal button').forEach(b=>b.classList.toggle('on', b.dataset.ts === t.dataset.ts));
    }
    document.addEventListener('selectionchange', ()=>setTimeout(tsSync, 0));
    tabT.addEventListener('click', ()=>setTimeout(tsSync, 0));

    // ----- Bordas completas: lado, estilo, espessura e cor, só nas células selecionadas -----
    const SIDE = {top:'borderTop', bottom:'borderBottom', left:'borderLeft', right:'borderRight'};
    function penCss(){
      let w = parseFloat($('tBdW').value) || .5; const st = $('tBdS').value || 'solid';
      if(st === 'double' && w < 2.25) w = 2.25;
      return w + 'pt ' + st + ' ' + ($('tBdC').value || '#000');
    }
    function applyBorders(mode){
      const cells = selCells(); if(!cells.length) return;
      const table = cells[0].closest('table'), {g, pos} = gridOf(table), pen = penCss();
      const R = cells.map(c=>pos.get(c));
      const r0 = Math.min(...R.map(q=>q.r)), r1 = Math.max(...R.map(q=>q.r + q.rs - 1)), c0 = Math.min(...R.map(q=>q.c)), c1 = Math.max(...R.map(q=>q.c + q.cs - 1));
      table.style.borderCollapse = 'collapse';
      const val = mode === 'none' ? 'none' : pen;
      const set = (cell, side, v)=>{ if(cell && cell.closest('table') === table) cell.style[SIDE[side]] = v; };
      // aplica a linha no encontro entre duas células (nas duas, para não haver conflito entre elas)
      const horiz = (r, c, v)=>{ set((g[r - 1] || [])[c], 'bottom', v); set((g[r] || [])[c], 'top', v); };   // linha acima da linha r, na coluna c
      const vert = (r, c, v)=>{ set((g[r] || [])[c - 1], 'right', v); set((g[r] || [])[c], 'left', v); };    // linha à esquerda da coluna c, na linha r
      const m = mode;
      for(let c = c0; c <= c1; c++){
        if(m === 'top' || m === 'outer' || m === 'all' || m === 'none') horiz(r0, c, val);
        if(m === 'bottom' || m === 'outer' || m === 'all' || m === 'none') horiz(r1 + 1, c, val);
        if(m === 'inner' || m === 'innerH' || m === 'all' || m === 'none') for(let r = r0 + 1; r <= r1; r++) horiz(r, c, val);
      }
      for(let r = r0; r <= r1; r++){
        if(m === 'left' || m === 'outer' || m === 'all' || m === 'none') vert(r, c0, val);
        if(m === 'right' || m === 'outer' || m === 'all' || m === 'none') vert(r, c1 + 1, val);
        if(m === 'inner' || m === 'innerV' || m === 'all' || m === 'none') for(let c = c0 + 1; c <= c1; c++) vert(r, c, val);
      }
      table.querySelectorAll('td,th').forEach(x=>{ if(x.closest('table') === table && !x.getAttribute('style')) x.removeAttribute('style'); });
      changed();
    }
    $('tBd').addEventListener('change', e=>{ const v = e.target.value; e.target.selectedIndex = 0; if(!v) return; restore(); if(!inTable()) return; applyBorders(v); });
    ['tBdC'].forEach(id=>$(id).addEventListener('mousedown', e=>e.stopPropagation()));

    // ----- Excluir célula (com deslocamento) e limpar formatação da tabela -----
    function caretIn(cell){ if(cell && cell.isConnected){ const r = document.createRange(), s = getSelection(); r.selectNodeContents(cell); r.collapse(true); s.removeAllRanges(); s.addRange(r); } }
    function deleteCells(dir){
      const cells = selCells(); if(!cells.length) return;
      const table = cells[0].closest('table'), G = gridOf(table), first = G.pos.get(cells[0]);
      if(dir === 'U'){
        const q = first;
        if(cells.length > 1 || [...table.rows].some(tr=>[...tr.cells].some(x=>(x.rowSpan > 1 || x.colSpan > 1)))){ alert('Para deslocar para cima, use uma célula só e uma tabela sem células mescladas. Use "deslocar para a esquerda" ou exclua a linha/coluna.'); return; }
        const col = G.g.map(r=>r[q.c]).filter(Boolean);
        for(let i = q.r; i < col.length - 1; i++) col[i].innerHTML = col[i + 1].innerHTML;
        const last = col[col.length - 1];
        const row = last.parentNode; last.remove();
        if(!row.cells.length) row.remove();
        caretIn(col[Math.min(q.r, col.length - 2)] || table.rows[0] && table.rows[0].cells[0]);
      }else{
        const rows = new Set(cells.map(c=>c.parentNode));
        const nb = cells[cells.length - 1].nextElementSibling || cells[0].previousElementSibling;
        cells.forEach(c=>c.remove());
        rows.forEach(tr=>{ if(!tr.cells.length) tr.remove(); });
        caretIn(nb && nb.isConnected ? nb : table.rows[0] && table.rows[0].cells[0]);
      }
      if(!table.querySelector('td,th')) delTable(table);
      changed(); syncT();
    }
    // Inserir células (como no Word): deslocar as existentes para a direita ou para baixo
    function insertCells(dir){
      const cells = selCells(); if(!cells.length) return;
      const table = cells[0].closest('table'), G = gridOf(table), q = G.pos.get(cells[0]);
      const blank = c=>{ const n = c.cloneNode(false); n.removeAttribute('rowspan'); n.removeAttribute('colspan'); n.innerHTML = '<br>'; return n; };
      const merged = [...table.rows].some(tr=>[...tr.cells].some(x=>(x.rowSpan > 1 || x.colSpan > 1)));
      if(dir === 'D'){
        if(cells.length > 1 || merged){ alert('Para deslocar para baixo, use uma célula só e uma tabela sem células mescladas. Use "deslocar para a direita" ou insira uma linha.'); return; }
        const last = table.rows[table.rows.length - 1], nr = last.cloneNode(true);
        nr.querySelectorAll('td,th').forEach(x=>{ x.innerHTML = '<br>'; });
        last.parentNode.insertBefore(nr, last.nextSibling);
        const col = [...table.rows].map(r=>r.cells[q.c]).filter(Boolean);
        for(let i = col.length - 1; i > q.r; i--) col[i].innerHTML = col[i - 1].innerHTML;
        col[q.r].innerHTML = '<br>';
        caretIn(col[q.r]);
      }else{
        let first = null;
        cells.forEach(c=>{ const n = blank(c); c.parentNode.insertBefore(n, c); if(!first) first = n; });
        caretIn(first);
      }
      changed(); syncT(); tselDraw();
    }
    $('tIns').addEventListener('change', e=>{
      const v = e.target.value; e.target.selectedIndex = 0; if(!v) return;
      restore(); if(!inTable()) return;
      insertCells(v === 'cellD' ? 'D' : 'R');
    });
    $('tDel').addEventListener('change', e=>{
      const v = e.target.value; e.target.selectedIndex = 0; if(!v) return;
      restore(); if(!inTable()) return;
      if(v === 'cellL') deleteCells('L'); else if(v === 'cellU') deleteCells('U'); else run(v);
    });
    $('tClear').addEventListener('mousedown', e=>e.preventDefault());
    $('tClear').addEventListener('click', ()=>{
      restore(); const c = inTable(); if(!c) return;
      const table = c.closest('table');
      table.style.border = ''; table.style.borderCollapse = ''; table.removeAttribute('data-ts'); table.removeAttribute('data-to'); if(!table.getAttribute('style')) table.removeAttribute('style');
      table.querySelectorAll('td,th').forEach(x=>{
        if(x.closest('table') !== table) return;
        ['backgroundColor', 'color', 'fontWeight', 'border', 'borderTop', 'borderBottom', 'borderLeft', 'borderRight', 'padding'].forEach(k=>x.style[k] = '');
        if(!x.getAttribute('style')) x.removeAttribute('style');
      });
      if(table.tHead && table.tHead.rows.length){ const tr = table.tHead.rows[0], tb = table.tBodies[0] || table.appendChild(document.createElement('tbody')); tb.insertBefore(tr, tb.firstChild); table.tHead.remove(); }
      changed(); tsSync();
    });

    // ----- Selecionar célula / coluna / linha / tabela + realce das células selecionadas -----
    $('tSel').addEventListener('change', e=>{
      const a = e.target.value; e.target.selectedIndex = 0; if(!a) return;
      restore();
      const c = inTable(); if(!c) return;
      const table = c.closest('table'), {g, pos} = gridOf(table), q = pos.get(c), rows = [...table.rows];
      let first, last;
      if(a === 'cell'){ first = last = c; }
      else if(a === 'row'){ const tr = c.parentNode; first = tr.cells[0]; last = tr.cells[tr.cells.length - 1]; }
      else if(a === 'col'){ first = g[0][q.c]; last = g[g.length - 1][q.c]; }
      else{ first = rows[0].cells[0]; const lr = rows[rows.length - 1]; last = lr.cells[lr.cells.length - 1]; }
      if(!first || !last) return;
      const r = document.createRange(); r.setStart(first, 0); r.setEnd(last, last.childNodes.length);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      syncT(); tselDraw();
    });
    const tselOv = document.createElement('div'); tselOv.id = 'tselOv'; tselOv.setAttribute('aria-hidden', 'true'); document.body.appendChild(tselOv);
    function tselCells(){
      const s = getSelection(); if(!s.rangeCount || s.isCollapsed || !page.contains(s.anchorNode) || !page.isContentEditable) return [];
      const r = s.getRangeAt(0), a = cellAt(r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode), z = cellAt(r.endContainer.nodeType === 1 ? r.endContainer : r.endContainer.parentNode);
      if(!a || !z) return [];
      if(a === z){   // uma célula só: realça apenas se ela estiver toda selecionada
        return (r.startContainer === a && r.startOffset === 0 && r.endContainer === a && r.endOffset === a.childNodes.length) ? [a] : [];
      }
      if(a.closest('table') !== z.closest('table')) return [];
      const table = a.closest('table'), {g, pos} = gridOf(table), pa = pos.get(a), pz = pos.get(z); if(!pa || !pz) return [];
      const r0 = Math.min(pa.r, pz.r), r1 = Math.max(pa.r + pa.rs - 1, pz.r + pz.rs - 1), c0 = Math.min(pa.c, pz.c), c1 = Math.max(pa.c + pa.cs - 1, pz.c + pz.cs - 1), set = new Set();
      for(let i = r0; i <= r1; i++) for(let j = c0; j <= c1; j++) if(g[i] && g[i][j]) set.add(g[i][j]);
      return [...set];
    }
    function scroller(){ let n = page.parentNode; while(n && n !== document.body){ const o = getComputedStyle(n).overflowY; if(o === 'auto' || o === 'scroll') return n; n = n.parentNode; } return document.documentElement; }
    let tselRaf = 0;
    function tselDraw(){
      cancelAnimationFrame(tselRaf);
      tselRaf = requestAnimationFrame(()=>{
        const ae = document.activeElement;
        if(ae && ae.closest && ae.closest('dialog')) return;
        const s = getSelection();
        if(s.rangeCount && !page.contains(s.anchorNode) && !(ae && ae.closest && ae.closest('#toolbar'))){ tselOv.innerHTML = ''; document.body.classList.remove('tsel'); return; }
        const cells = (s.rangeCount && page.contains(s.anchorNode)) ? tselCells() : (tselOv.children.length ? tselLast : []);
        tselLast = cells;
        tselOv.innerHTML = '';
        document.body.classList.toggle('tsel', cells.length > 0);
        if(!cells.length || !page.isContentEditable) return;
        const sc = scroller(), cr = sc === document.documentElement ? {left:0, top:0, right:innerWidth, bottom:innerHeight} : sc.getBoundingClientRect();
        tselOv.style.cssText = 'left:' + cr.left + 'px;top:' + cr.top + 'px;width:' + (cr.right - cr.left) + 'px;height:' + (cr.bottom - cr.top) + 'px';
        cells.forEach(c=>{
          if(!c.isConnected) return;
          const b = c.getBoundingClientRect(), d = document.createElement('i');
          d.style.cssText = 'left:' + (b.left - cr.left) + 'px;top:' + (b.top - cr.top) + 'px;width:' + b.width + 'px;height:' + b.height + 'px';
          tselOv.appendChild(d);
        });
      });
    }
    var tselLast = [];
    document.addEventListener('selectionchange', tselDraw);
    document.addEventListener('scroll', tselDraw, true);
    window.addEventListener('resize', tselDraw);
    page.addEventListener('input', tselDraw);
    ['tFit', 'tBord', 'tPad'].forEach(id=>$(id).addEventListener('change', e=>{ const v = e.target.value; e.target.selectedIndex = 0; if(v) run(v); }));
    function distRows(){
      restore(); const c = inTable(); if(!c){ alert('Clique dentro de uma célula da tabela e escolha de novo.'); return; }
      const table = c.closest('table'), G = gridOf(table), cells = selCells(), rs = new Set();
      cells.forEach(x=>{ const q = G.pos.get(x); if(q) for(let r = q.r; r < q.r + q.rs; r++) rs.add(r); });
      const idx = rs.size > 1 ? [...rs] : [...table.rows].map((_, i)=>i);
      const avg = idx.reduce((a, r)=>a + rowH(table, r), 0) / idx.length;
      idx.forEach(r=>table.rows[r].style.height = avg.toFixed(1) + 'px'); changed(); syncT();
    }
    hI.addEventListener('change', ()=>{
      restore(); const c = inTable(), v = parseFloat(String(hI.value).replace(',', '.')); if(!c || !(v > 0)) return;
      const q = gridOf(c.closest('table')).pos.get(c); c.closest('table').rows[q.r].style.height = Math.max(MINH, v * CMPX).toFixed(1) + 'px'; changed(); syncT();
    });
    wI.addEventListener('change', ()=>{
      restore(); const c = inTable(), v = parseFloat(String(wI.value).replace(',', '.')); if(!c || !(v > 0)) return;
      const table = c.closest('table'), q = gridOf(table).pos.get(c), w = tblCols(table), cw = tblCont(table);
      const k = q.c + q.cs - 1, want = Math.max(MINW, v * CMPX), cur = w.slice(q.c, k + 1).reduce((a, b)=>a + b, 0), x = want - cur;
      w[k] += x;
      if(w.length > 1){ const j = k < w.length - 1 ? k + 1 : k - 1; if(j >= 0 && w[j] - x >= MINW && !(q.cs > 1 && j >= q.c && j <= k)) w[j] -= x; }
      const t = w.reduce((a, b)=>a + b, 0); tblApply(table, t > cw ? w.map(y=>y * cw / t) : w, cw); changed(); syncT();
    });
    ['mousedown'].forEach(ev=>$('tShade').addEventListener(ev, e=>e.stopPropagation()));
    $('tShade').addEventListener('input', e=>{ const v = e.target.value; restore(); selCells().forEach(x=>x.style.backgroundColor = v); changed(); });
    $('tShade').addEventListener('dblclick', ()=>{ restore(); selCells().forEach(x=>{ x.style.backgroundColor = ''; if(!x.getAttribute('style')) x.removeAttribute('style'); }); changed(); });

    // ----- Mouse como no Word: selecionar linha/coluna pela margem da tabela, linha de texto pela margem da folha,
    //       Delete/Backspace em células selecionadas e menu do botão direito -----
    let barRange = null, selDrag = null, moveDrag = null, moveHover = null;
    const moveHandle=document.createElement('button');moveHandle.id='tblReorderHandle';moveHandle.type='button';moveHandle.title='Arraste para trocar a ordem';moveHandle.textContent='⠿';moveHandle.setAttribute('aria-label','Alça para reordenar linha ou coluna');moveHandle.hidden=true;document.body.appendChild(moveHandle);
    function selRect(table, r0, r1, c0, c1){
      const G = gridOf(table); r1 = Math.min(r1, G.g.length - 1); c1 = Math.min(c1, ((G.g[r1] || []).length || 1) - 1); const first = (G.g[r0] || [])[c0], last = (G.g[r1] || [])[c1]; if(!first || !last) return;
      const r = document.createRange(); r.setStart(first, 0); r.setEnd(last, last.childNodes.length);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); savedRange = r.cloneRange(); barRange = r.cloneRange();
      syncT(); tselDraw();
    }
    function rowAtY(table, y){
      const rows = [...table.rows]; if(!rows.length) return -1;
      if(y <= rows[0].getBoundingClientRect().top) return 0;
      for(let i = 0; i < rows.length; i++){ const b = rows[i].getBoundingClientRect(); if(y >= b.top && y <= b.bottom) return i; }
      return rows.length - 1;
    }
    function colAtX(table, x){
      const G = gridOf(table), seen = new Set(), list = [];
      (G.g[0] || []).forEach(c=>{ if(c && !seen.has(c)){ seen.add(c); list.push(c); } });
      if(!list.length) return null;
      let pick = null;
      for(const c of list){ const b = c.getBoundingClientRect(); if(x >= b.left && x <= b.right){ pick = c; break; } }
      if(!pick) pick = x < list[0].getBoundingClientRect().left ? list[0] : list[list.length - 1];
      const q = G.pos.get(pick); return {c:q.c, n:q.cs};
    }
    function pageLeftInfo(){
      const pr = page.getBoundingClientRect(), sc = page.offsetWidth ? pr.width / page.offsetWidth : 1;
      return {left:pr.left, content:pr.left + (parseFloat(getComputedStyle(page).paddingLeft) || 0) * sc};
    }
    function zoneAt(e){
      if(off() || !page.isContentEditable) return null;
      const el = document.elementFromPoint(e.clientX, e.clientY), P = pageLeftInfo();
      const tables=[...page.querySelectorAll('table')].sort((a,b)=>{const depth=t=>{let n=0;for(let p=t.parentElement;p;p=p.parentElement)if(p.tagName==='TABLE')n++;return n};return depth(b)-depth(a)});
      for(const t of tables){
        if(t.closest('.hf')) continue;
        const r = t.getBoundingClientRect(); if(!r.width) continue;
        if(e.clientX >= P.left + 4 && e.clientX <= r.left - 3 && e.clientY >= r.top && e.clientY <= r.bottom && (el === page || t.contains(el))){
          const i = rowAtY(t, e.clientY); if(i >= 0) return {k:'row', table:t, i, n:1};
        }
        if(e.clientY >= r.top - 7 && e.clientY <= r.top - 2 && e.clientX >= r.left && e.clientX <= r.right && (el === page || el === t || t.contains(el) || (el && el.nodeName === 'DIV'))){
          const j = colAtX(t, e.clientX); if(j) return {k:'col', table:t, i:j.c, n:j.n};
        }
      }
      const tc = el && el.closest ? el.closest('td,th') : null;
      if(tc && page.contains(tc) && !tc.closest('.hf')){
        const b = tc.getBoundingClientRect();
        if(e.clientX >= b.left + 5 && e.clientX <= b.left + 11 && e.clientY >= b.top + 4 && e.clientY <= b.bottom - 4) return {k:'cell', table:tc.closest('table'), cell:tc};
      }
      return null;
    }
    function lineBarAt(e){
      if(off() || !page.isContentEditable) return false;
      const P = pageLeftInfo(); if(e.clientX < P.left + 4 || e.clientX > P.content - 8) return false;
      return document.elementFromPoint(e.clientX, e.clientY) === page;
    }
    function caretAt(x, y){
      if(document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
      if(document.caretPositionFromPoint){ const p = document.caretPositionFromPoint(x, y); if(!p) return null; const r = document.createRange(); r.setStart(p.offsetNode, p.offset); r.collapse(true); return r; }
      return null;
    }
    function selectLine(e, para){
      const P = pageLeftInfo(), r = caretAt(P.content + 3, e.clientY); if(!r || !page.contains(r.startContainer)) return;
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      if(para){
        let n = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
        while(n && n !== page && !/^(P|H[1-6]|LI|TD|TH|BLOCKQUOTE|DIV|PRE)$/.test(n.nodeName)) n = n.parentNode;
        if(n && n !== page){ const q = document.createRange(); q.selectNodeContents(n); s.removeAllRanges(); s.addRange(q); }
      }else if(s.modify){ s.modify('move', 'backward', 'lineboundary'); s.modify('extend', 'forward', 'lineboundary'); }
      if(s.rangeCount) savedRange = s.getRangeAt(0).cloneRange();
    }
    function showMoveHandle(z){
      if(!z||!['row','col'].includes(z.k)){moveHover=null;moveHandle.hidden=true;return}
      const t=z.table,rect=t.getBoundingClientRect();let x,y;
      if(z.k==='row'){const row=t.rows[z.i];if(!row){moveHandle.hidden=true;return}const b=row.getBoundingClientRect();x=rect.left-23;y=(b.top+b.bottom)/2-11;moveHandle.title='Arraste para reordenar esta linha';}
      else{const G=gridOf(t),cell=(G.g[0]||[]).find(c=>c&&G.pos.get(c).c===z.i);if(!cell){moveHandle.hidden=true;return}const b=cell.getBoundingClientRect();x=(b.left+b.right)/2-11;y=rect.top-23;const merged=[...t.rows].some(r=>[...r.cells].some(c=>(c.rowSpan||1)>1||(c.colSpan||1)>1));moveHandle.title=merged?'Arraste para reordenar; colunas unidas movem-se como bloco':'Arraste para reordenar esta coluna';}
      moveHover=z;moveHandle.hidden=false;moveHandle.style.left=Math.max(2,x)+'px';moveHandle.style.top=Math.max(2,y)+'px';
    }
    function zoneForHandle(e){let z=zoneAt(e);if(z&&['row','col'].includes(z.k))return z;const el=document.elementFromPoint(e.clientX,e.clientY),cell=el&&el.closest?el.closest('#page td,#page th'):null;if(!cell)return null;const t=cell.closest('table'),b=cell.getBoundingClientRect(),G=gridOf(t),q=G.pos.get(cell);if(!q)return null;if(e.clientX<=b.left+15)return {k:'row',table:t,i:q.r,n:1};if(q.r===0&&e.clientY<=b.top+14)return {k:'col',table:t,i:q.c,n:q.cs};return null}
    moveHandle.addEventListener('pointerdown',e=>{if(e.button!==0||!moveHover)return;e.preventDefault();e.stopPropagation();moveDrag={k:moveHover.k,table:moveHover.table,from:moveHover.k==='row'?moveHover.i:moveHover.i};moveHandle.classList.add('dragging');try{moveHandle.setPointerCapture(e.pointerId)}catch(_){}});
    document.addEventListener('pointermove',e=>{if(!moveDrag)return;const el=document.elementFromPoint(e.clientX,e.clientY),cell=el&&el.closest?el.closest('#page td,#page th'):null;if(!cell||cell.closest('table')!==moveDrag.table)return;const d=moveDrag;if(d.k==='row'){const to=[...d.table.rows].indexOf(cell.parentElement);moveHandle.dataset.drop=String(to)}else{const q=gridOf(d.table).pos.get(cell);if(q)moveHandle.dataset.drop=String(q.c)}});
    const finishMove=()=>{if(!moveDrag)return;const d=moveDrag,to=Number(moveHandle.dataset.drop);moveDrag=null;moveHandle.classList.remove('dragging');delete moveHandle.dataset.drop;if(Number.isFinite(to)){if(d.k==='row')moveTableRow(d.table,d.from,to);else moveTableColumn(d.table,d.from,to)}moveHandle.hidden=true;moveHover=null};
    moveHandle.addEventListener('pointerup',finishMove);moveHandle.addEventListener('pointercancel',()=>{moveDrag=null;moveHandle.classList.remove('dragging');delete moveHandle.dataset.drop;moveHandle.hidden=true;moveHover=null});
    page.addEventListener('mousemove', e=>{
      if(selDrag || drag || moveDrag) return;
      const z=zoneAt(e),lb=!z&&lineBarAt(e);page.classList.toggle('tbl-sr',!!(z&&z.k==='row')||!!lb);page.classList.toggle('tbl-sc',!!(z&&z.k==='col'));page.classList.toggle('tbl-cl',!!(z&&z.k==='cell'));showMoveHandle(zoneForHandle(e));
    });
    page.addEventListener('mouseleave', e=>{page.classList.remove('tbl-sr','tbl-sc','tbl-cl');if(e.relatedTarget!==moveHandle&&!moveHandle.contains(e.relatedTarget))moveHandle.hidden=true});
    page.addEventListener('mousedown', e=>{
      if(e.button !== 0 || off() || drag || !page.isContentEditable) return;
      const z = zoneAt(e);
      if(z){
        e.preventDefault(); page.focus({preventScroll:true});
        if(z.k === 'cell'){
          const q0 = gridOf(z.table).pos.get(z.cell); if(!q0) return;
          selDrag = {k:'cell', table:z.table, a:z.cell}; selRect(z.table, q0.r, q0.r + q0.rs - 1, q0.c, q0.c + q0.cs - 1); return;
        }
        selDrag = {k:z.k, table:z.table, a:z.i, an:z.n};
        if(z.k === 'row') selRect(z.table, z.i, z.i, 0, 1e4); else selRect(z.table, 0, 1e4, z.i, z.i + z.n - 1);
        return;
      }
      if(lineBarAt(e)){ e.preventDefault(); page.focus({preventScroll:true}); selectLine(e, e.detail > 1); }
    }, true);
    document.addEventListener('mousemove', e=>{
      if(!selDrag) return; e.preventDefault();
      const d = selDrag;
      if(d.k === 'cell'){
        const el = document.elementFromPoint(e.clientX, e.clientY), c2 = el && el.closest ? el.closest('td,th') : null;
        if(c2 && c2.closest('table') === d.table){
          const G = gridOf(d.table), pa = G.pos.get(d.a), pb = G.pos.get(c2);
          if(pa && pb) selRect(d.table, Math.min(pa.r, pb.r), Math.max(pa.r + pa.rs - 1, pb.r + pb.rs - 1), Math.min(pa.c, pb.c), Math.max(pa.c + pa.cs - 1, pb.c + pb.cs - 1));
        }
        return;
      }
      if(d.k === 'row'){ const i = rowAtY(d.table, e.clientY); if(i >= 0) selRect(d.table, Math.min(d.a, i), Math.max(d.a, i), 0, 1e4); }
      else{ const j = colAtX(d.table, e.clientX); if(j) selRect(d.table, 0, 1e4, Math.min(d.a, j.c), Math.max(d.a + d.an - 1, j.c + j.n - 1)); }
    });
    document.addEventListener('mouseup', ()=>{ selDrag = null; });

    // apagar linhas / colunas / conteúdo das células selecionadas
    function delRows(table, set){
      const idx = [...set].sort((a, b)=>b - a);
      idx.forEach(r=>{
        const tr = table.rows[r]; if(!tr) return;
        const G = gridOf(table), seen = new Set();
        (G.g[r] || []).forEach(c=>{
          if(!c || seen.has(c)) return; seen.add(c);
          const q = G.pos.get(c); if(q && q.r < r){ c.rowSpan = Math.max(1, c.rowSpan - 1); if(c.rowSpan === 1) c.removeAttribute('rowspan'); }
        });
        tr.remove();
      });
      if(!table.querySelector('td,th')) delTable(table);
    }
    function delCols(table, set){
      [...set].sort((a, b)=>b - a).forEach(j=>{
        const tw = tblSnap(table), G = gridOf(table), seen = new Set();
        G.g.forEach(row=>{
          const c = row[j]; if(!c || seen.has(c)) return; seen.add(c);
          if(c.colSpan > 1){ c.colSpan--; if(c.colSpan === 1) c.removeAttribute('colspan'); } else c.remove();
        });
        [...table.rows].forEach(tr=>{ if(!tr.cells.length) tr.remove(); });
        if(tw && table.isConnected && table.querySelector('td,th')) tblAdjust(table, tw, 'del' + j);
      });
      if(!table.querySelector('td,th')) delTable(table);
    }
    function spans(cells){
      const table = cells[0].closest('table'), G = gridOf(table), R = new Set(), C = new Set();
      cells.forEach(c=>{ const q = G.pos.get(c); if(!q) return; for(let i = 0; i < q.rs; i++) R.add(q.r + i); for(let j = 0; j < q.cs; j++) C.add(q.c + j); });
      return {table, G, R, C};
    }
    function afterDel(table, r, c){
      if(table.isConnected){ const row = table.rows[Math.min(r, table.rows.length - 1)]; caretIn(row && (row.cells[Math.min(c, row.cells.length - 1)] || row.cells[0])); }
      else{ const s = getSelection(); if(s.rangeCount) savedRange = s.getRangeAt(0).cloneRange(); }
      changed(); syncT(); tselDraw();
    }
    function ctxDel(kind){
      restore(); const cells = selCells(); if(!cells.length) return;
      const {table, R, C} = spans(cells), r0 = Math.min(...R), c0 = Math.min(...C);
      if(kind === 'row') delRows(table, R); else delCols(table, C);
      afterDel(table, r0, c0);
    }
    function clearCells(cells){
      cells.forEach(c=>{ c.innerHTML = '<br>'; });
      caretIn(cells[0]); changed(); tselDraw();
    }
    page.addEventListener('keydown', e=>{
      if(e.key !== 'Delete' && e.key !== 'Backspace') return;
      if(e.ctrlKey || e.metaKey || e.altKey || off()) return;
      const cells = tselCells(); if(!cells.length) return;
      e.preventDefault(); e.stopPropagation();
      if(e.key === 'Delete'){ clearCells(cells); return; }
      const sp = spans(cells), {table, G, R, C} = sp, set = new Set(cells);
      const s = getSelection(), viaBar = !!(barRange && s.rangeCount && s.getRangeAt(0).compareBoundaryPoints(Range.START_TO_START, barRange) === 0 && s.getRangeAt(0).compareBoundaryPoints(Range.END_TO_END, barRange) === 0);
      if(cells.length < 2 && !viaBar){ clearCells(cells); return; }
      const rowsFull = [...R].every(r=>(G.g[r] || []).every(c=>!c || set.has(c)));
      const nCols = G.g.reduce((m, r)=>Math.max(m, r.length), 0);
      const colsFull = [...C].every(j=>G.g.every(row=>!row[j] || set.has(row[j])));
      const r0 = Math.min(...R), c0 = Math.min(...C);
      if(rowsFull && R.size === G.g.length){ delTable(table); changed(); syncT(); tselDraw(); return; }
      if(rowsFull){ delRows(table, R); afterDel(table, r0, 0); return; }
      if(colsFull && C.size >= nCols){ delTable(table); changed(); syncT(); tselDraw(); return; }
      if(colsFull){ delCols(table, C); afterDel(table, 0, c0); return; }
      clearCells(cells);
    }, true);

    // ----- Menu do botão direito -----
    let ctxEl = null;
    function ctxClose(){ if(ctxEl){ ctxEl.remove(); ctxEl = null; } }
    function ctxOpen(x, y, items){
      ctxClose();
      const m = document.createElement('div'); m.id = 'ctxMenu'; m.setAttribute('role', 'menu');
      const build = (list, parent)=>list.forEach(it=>{
        if(it.sep){ parent.appendChild(document.createElement('hr')); return; }
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.disabled = !!it.dis;
        const l = document.createElement('span'); l.textContent = it.t; if(it.b) l.style.fontWeight = '700'; b.appendChild(l);
        if(it.k){ const k = document.createElement('em'); k.textContent = it.k; b.appendChild(k); }
        if(it.sub){
          const w = document.createElement('div'); w.className = 'cm-has';
          const sub = document.createElement('div'); sub.className = 'cm-sub'; build(it.sub, sub);
          const ar = document.createElement('em'); ar.textContent = '▸'; b.appendChild(ar);
          w.appendChild(b); w.appendChild(sub);
          w.addEventListener('mouseenter', ()=>{
            sub.classList.remove('flip'); sub.style.top = ''; sub.style.display = 'block';
            const r = sub.getBoundingClientRect();
            if(r.right > innerWidth - 4) sub.classList.add('flip');
            if(r.bottom > innerHeight - 4) sub.style.top = Math.min(-4, innerHeight - 4 - r.bottom - 4) + 'px';
            sub.style.display = '';
          });
          parent.appendChild(w); return;
        }
        b.addEventListener('click', ()=>{ ctxClose(); try{ it.fn(); }catch(err){ console.error(err); } });
        parent.appendChild(b);
      });
      build(items, m);
      m.addEventListener('mousedown', e=>e.preventDefault());
      m.addEventListener('contextmenu', e=>e.preventDefault());
      document.body.appendChild(m); ctxEl = m;
      const r = m.getBoundingClientRect();
      m.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px';
      m.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 4)) + 'px';
    }
    document.addEventListener('mousedown', e=>{ if(ctxEl && !ctxEl.contains(e.target)) ctxClose(); }, true);
    document.addEventListener('keydown', e=>{ if(e.key === 'Escape') ctxClose(); }, true);
    document.addEventListener('scroll', e=>{ if(ctxEl && !ctxEl.contains(e.target)) ctxClose(); }, true);
    window.addEventListener('resize', ctxClose); window.addEventListener('blur', ctxClose);

    function insideSel(e){
      const s = getSelection(); if(!s.rangeCount || s.isCollapsed || !page.contains(s.anchorNode)) return false;
      const hit = b=>e.clientX >= b.left - 2 && e.clientX <= b.right + 2 && e.clientY >= b.top - 2 && e.clientY <= b.bottom + 2;
      const cs = tselCells(); if(cs.length) return cs.some(c=>hit(c.getBoundingClientRect()));
      return [...s.getRangeAt(0).getClientRects()].some(hit);
    }
    const dlgOpen = sel=>{ const b = document.querySelector(sel); if(b) b.click(); };
    const SHADES = [['Sem sombreamento', ''], ['Cinza claro', '#f2f2f2'], ['Amarelo claro', '#fff2cc'], ['Azul claro', '#deeaf6'], ['Verde claro', '#e2efd9'], ['Laranja claro', '#fbe4d5']];
    function ctxItems(cell, img){
      const s = getSelection(), has = !!img || (s.rangeCount && !s.isCollapsed) || tselCells().length > 0;
      const clip = [
        {t:'Recortar', k:'Ctrl+X', dis:!has, fn:()=>$('btnCut').click()},
        {t:'Copiar', k:'Ctrl+C', dis:!has, fn:()=>$('btnCopy').click()},
        {t:'Colar', k:'Ctrl+V', fn:()=>$('btnPaste').click()},
        {t:'Colar somente o texto', fn:()=>pasteFromClipboard(true)}
      ];
      if(img) return clip.slice(0, 3).concat([{sep:1}, {t:'Excluir imagem', k:'Del', fn:()=>{ const d = $('imDel'); if(d) d.click(); else{ img.remove(); changed(); } }}]);
      const text = [
        {t:'Fonte…', k:'Ctrl+D', fn:()=>dlgOpen('.gdl[data-dlg="fontDlg"]')},
        {t:'Parágrafo…', fn:()=>$('parDlgOpen').click()},
        {t:'Negrito', k:'Ctrl+B', fn:()=>exec('bold')}, {t:'Itálico', k:'Ctrl+I', fn:()=>exec('italic')}, {t:'Sublinhado', k:'Ctrl+U', fn:()=>exec('underline')},
        {t:'Marcadores', fn:()=>exec('insertUnorderedList')}, {t:'Numeração', fn:()=>exec('insertOrderedList')},
        {t:'Hiperlink…', fn:()=>$('btnLink').click()}
      ];
      if(!cell) return clip.concat([{sep:1}], text, [{sep:1}, {t:'Selecionar tudo', k:'Ctrl+A', fn:()=>{ page.focus(); document.execCommand('selectAll'); }}]);
      const cs = selCells(), sp = cs.length ? spans(cs) : null, nR = sp ? sp.R.size : 1, nC = sp ? sp.C.size : 1;
      const rep = (a, n)=>()=>{ for(let i = 0; i < n; i++) run(a); };
      const sel = a=>()=>{ restore(); const v = $('tSel'); v.value = a; v.dispatchEvent(new Event('change')); };
      const shade = v=>()=>{ restore(); selCells().forEach(x=>{ x.style.backgroundColor = v; if(!v && !x.getAttribute('style')) x.removeAttribute('style'); }); changed(); };
      return clip.concat([{sep:1},
        {t:'Inserir', sub:[
          {t:nC > 1 ? 'Colunas à esquerda' : 'Coluna à esquerda', fn:rep('colB', nC)}, {t:nC > 1 ? 'Colunas à direita' : 'Coluna à direita', fn:rep('colA', nC)},
          {t:nR > 1 ? 'Linhas acima' : 'Linha acima', fn:rep('rowB', nR)}, {t:nR > 1 ? 'Linhas abaixo' : 'Linha abaixo', fn:rep('rowA', nR)},
          {sep:1}, {t:'Células (deslocar para a direita)', fn:()=>{ restore(); insertCells('R'); }}, {t:'Células (deslocar para baixo)', fn:()=>{ restore(); insertCells('D'); }}]},
        {t:'Excluir', sub:[
          {t:'Células (deslocar para a esquerda)', fn:()=>{ restore(); deleteCells('L'); }}, {t:'Células (deslocar para cima)', fn:()=>{ restore(); deleteCells('U'); }},
          {t:nC > 1 ? 'Colunas' : 'Coluna', fn:()=>ctxDel('col')}, {t:nR > 1 ? 'Linhas' : 'Linha', fn:()=>ctxDel('row')}, {t:'Tabela', fn:()=>run('tblD')}]},
        {t:'Selecionar', sub:[{t:'Célula', fn:sel('cell')}, {t:'Coluna', fn:sel('col')}, {t:'Linha', fn:sel('row')}, {t:'Tabela', fn:sel('tbl')}]},
        {t:'Mesclar células', dis:cs.length < 2, fn:()=>run('merge')}, {t:'Dividir célula…', fn:()=>run('split')}, {sep:1},
        {t:'Bordas', sub:[['Todas as bordas', 'bAll'], ['Somente externas', 'bOuter'], ['Bordas grossas (2 pt)', 'bThick'], ['Pontilhadas', 'bDash'], ['Sem bordas', 'bNone']].map(([t, a])=>({t, fn:()=>run(a)}))},
        {t:'Sombreamento', sub:SHADES.map(([t, v])=>({t, fn:shade(v)}))},
        {t:'Alinhamento da célula', sub:[['Ao topo', 'vTop'], ['Centralizado na vertical', 'vMid'], ['Embaixo', 'vBot'], ['Texto à esquerda', 'hLeft'], ['Texto centralizado', 'hCenter'], ['Texto à direita', 'hRight']].map(([t, a])=>({t, fn:()=>run(a)}))},
        {t:'Ajustar', sub:[{t:'Distribuir colunas igualmente', fn:()=>run('equal')}, {t:'Distribuir linhas igualmente', fn:()=>distRows()}, {t:'Ajustar largura automaticamente', fn:()=>run('auto')}, {t:'Linha de cabeçalho (liga/desliga)', fn:()=>run('header')}]},
        {sep:1}], text.slice(0, 2), text.slice(2, 5), [{t:'Hiperlink…', fn:()=>$('btnLink').click()}]);
    }
    page.addEventListener('contextmenu', e=>{
      if(off() || !page.isContentEditable) return;
      if(e.target.closest && e.target.closest('.hf,.himg')) return;
      e.preventDefault();
      let x = e.clientX, y = e.clientY;
      const img = e.target.tagName === 'IMG' ? e.target : null;
      if(img){ img.dispatchEvent(new MouseEvent('click', {bubbles:true})); }
      else if(!insideSel(e)){
        const r = caretAt(x, y);
        if(r && page.contains(r.startContainer)){ const s = getSelection(); s.removeAllRanges(); s.addRange(r); savedRange = r.cloneRange(); }
      }
      const cell = img ? null : cellAt(e.target) || (savedRange ? cellAt(savedRange.startContainer) : null);
      ctxOpen(x, y, (!img && window.__vsMenu ? window.__vsMenu() : []).concat(ctxItems(cell && page.contains(cell) ? cell : null, img)));
    });
  })();
