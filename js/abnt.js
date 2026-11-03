/* Verbus — Normas ABNT: numerar títulos, citações, referências e bibliografia automática
   (js/abnt.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   Reconstruído a partir da v66 (index.html monolítico), com as chaves de armazenamento portadas para LS_KEYS. */
  // ================= ABNT =================
  const ABNT_CSS = '@page Section1{size:21cm 29.7cm;margin:3cm 2cm 2cm 3cm}div.Section1{page:Section1}' +
    'body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.5;text-align:justify}p{margin:0;text-indent:1.25cm}' +
    'h1,h2,h3{font-size:12pt;text-align:left;text-indent:0;margin:18pt 0}h1{font-weight:bold}h2{font-weight:normal}h3{font-weight:bold}h1.sn{text-align:center}' +
    'blockquote{margin:12pt 0 12pt 4cm;font-size:10pt;line-height:1;border:0;padding:0}blockquote p,td p,li p,.cover p,.sum p,p.rs,p.ref,p.leg,p.fonte{text-indent:0}' +
    'p.leg,p.fonte{font-size:10pt;line-height:1;text-align:center}p.rs{line-height:1;margin-bottom:12pt}p.ref{text-align:left;line-height:1;margin-bottom:12pt}' +
    '.cover{text-align:center}.cover p{text-align:center}.nat{margin-left:8cm;font-size:10pt;line-height:1}.pb{page-break-after:always}table{font-size:10pt;line-height:1}' +
    '.sum p.tl{display:flex;align-items:baseline;margin:0}.sum p.tl .dl{flex:1 1 auto;min-width:12px;border-bottom:1px dotted #000;transform:translateY(-.25em)}.sum p.tl .tt{padding-right:4px}.sum p.tl .pn{padding-left:4px}.sum p.ie,.sum p.il{margin:0;text-indent:0}.sum p.il{margin-top:10pt}';
  const bAbnt = $('btnAbnt');
  function setAbnt(on, user){
    page.classList.toggle('abnt', on); $('sheet').classList.toggle('abnt', on); bAbnt.classList.toggle('on', on);
    const dd = store.docs[store.current]; if(dd){ if(on) delete dd.free; else dd.free = true; persist(); }   // o formato é guardado em cada documento
    if(user){ const d = store.docs[store.current]; if(d){ delete d.mar; if(on) delete d.pg; } persist(); }
    applyMar();
    updateCount();
  }
  bAbnt.addEventListener('click', ()=>setAbnt(!page.classList.contains('abnt'), true));
  setAbnt(!(store.docs[store.current] || {}).free);   // ABNT é a base do aplicativo; só os documentos livres/modelos prontos ficam fora

  function pagesTxt(){
    if(!page.classList.contains('abnt')) return '';
    return ' · ~' + pageCount() + ' pág.';
  }
  function curBlock(){
    let n = getSelection().anchorNode;
    while(n && n.parentNode !== page) n = n.parentNode;
    return n && n.nodeType === 1 ? n : null;
  }
  function blockChange(v){
    if(v === 'h1sn'){ exec('formatBlock', 'h1'); const b = curBlock(); if(b && b.tagName === 'H1'){ b.classList.add('sn'); changed(); } }
    else exec('formatBlock', v);
  }

  // Numerar títulos
  $('btnNum').addEventListener('click', ()=>{
    let a = 0, b = 0, c = 0;
    page.querySelectorAll('h1,h2,h3').forEach(h=>{
      if(h.classList.contains('sn') || h.closest('.sum')) return;
      const t = h.textContent.replace(/^\s*\d+(\.\d+)*\.?\s+/, '').trim(); let n;
      if(h.tagName === 'H1'){ a++; b = 0; c = 0; n = a + ' ' + t.toUpperCase(); }
      else if(h.tagName === 'H2'){ b++; c = 0; n = a + '.' + b + ' ' + t.toUpperCase(); }
      else{ c++; n = a + '.' + b + '.' + c + ' ' + t; }
      h.textContent = n;
    });
    changed();
  });

  // Inserir elementos
  const PB = '<div class="pb" contenteditable="false"></div><p><br></p>';
  const TPL = {
    capa:'<div class="cover"><div><p>NOME DA INSTITUIÇÃO</p><p>CURSO</p></div><div><p>NOME DO AUTOR</p><p><br></p><p><b>TÍTULO DO TRABALHO</b></p><p>subtítulo (se houver)</p></div><div><p>CIDADE</p><p>ANO</p></div></div>' + PB,
    rosto:'<div class="cover"><div><p>NOME DO AUTOR</p></div><div><p><b>TÍTULO DO TRABALHO</b></p><p>subtítulo (se houver)</p></div><div class="nat"><p>Trabalho de Conclusão de Curso apresentado ao curso de ..., da Instituição ..., como requisito parcial para a obtenção do grau de ....</p><p><br></p><p>Orientador(a): Prof(a). Nome</p></div><div><p>CIDADE</p><p>ANO</p></div></div>' + PB,
    resumo:'<h1 class="sn">RESUMO</h1><p class="rs">Escreva aqui o resumo, em parágrafo único, com 150 a 500 palavras.</p><p class="rs"><b>Palavras-chave:</b> palavra 1; palavra 2; palavra 3.</p>' + PB
  };
  // Insere blocos logo depois do parágrafo do cursor (ou no lugar dele, se estiver vazio), sem partir o parágrafo ao meio
  function putBlock(html){
    const b4 = tSnap(); restore();
    const sl = getSelection(); let n = sl.rangeCount ? sl.getRangeAt(0).startContainer : null;
    while(n && n.parentNode !== page) n = n.parentNode;
    const tp = document.createElement('template'); tp.innerHTML = html; const nodes = [...tp.content.childNodes];
    if(n && n.nodeType === 1 && page.contains(n)){
      if(n.tagName === 'P' && !n.textContent.trim() && !n.querySelector('img,table,svg')) n.replaceWith(...nodes); else n.after(...nodes);
    }else page.append(...nodes);
    tCommit(b4); changed();
  }
  const swapEl = (el, html)=>{ const b4 = tSnap(); el.outerHTML = html; tCommit(b4); changed(); };
  // Página (na tela) em que um elemento está: mesma conta do "Página x de y" da barra de status
  function pageOfEl(el){
    try{
      const n = pageCount(); if(n <= 1) return 1;
      const sheet = $('sheet'), rc = el.getBoundingClientRect();
      if(pgState){
        const sr = sheet.getBoundingClientRect(), sc = sheet.offsetWidth ? sr.width / sheet.offsetWidth : 1, y = (rc.top - sr.top) / sc - pgState.base;
        if(pgState.shifted) return Math.max(1, Math.min(n, Math.floor((y + pgState.et) / pgState.P) + 1));
        let cur = 1; pgState.starts.forEach((v, i)=>{ if(y + 1 >= v) cur = i + 1; }); return cur;
      }
      const z = parseFloat(sheet.style.zoom) || 1, ph = pgOf().h * CMPX * z;
      return Math.max(1, Math.min(n, Math.floor((rc.top - page.getBoundingClientRect().top) / ph) + 1));
    }catch(e){ return 1; }
  }
  const TOCQ = '.sum:not(.lst):not(.idx)';
  const tocRow = (txt, pg, ind, bold)=>'<p class="tl" style="margin-left:' + ind + 'cm"><span class="tt">' + (bold ? '<b>' + esc(txt) + '</b>' : esc(txt)) + '</span><span class="dl"></span><span class="pn">' + pg + '</span></p>';
  function tocHtml(){
    const hs = [...page.querySelectorAll('h1,h2,h3')].filter(h=>!h.closest('.sum') && !/^(sum[aá]rio|resumo|abstract)$/i.test(h.textContent.trim()));
    const rows = hs.map(h=>{
      const lv = +h.tagName[1]; let t = h.textContent.trim(); if(lv < 3) t = t.toUpperCase();
      return tocRow(t, pageOfEl(h), (lv - 1) * 0.6, lv === 1);
    }).join('');
    return '<div class="sum"><h1 class="sn">SUMÁRIO</h1>' + (rows || '<p class="tl"><span class="tt">Use os estilos Título 1, 2 e 3 para montar o sumário.</span></p>') + '</div>';
  }
  function sumario(){
    const html = tocHtml(), old = page.querySelector(TOCQ);
    if(old) swapEl(old, html); else putBlock(html + PB);
    if(window.__refsLater) window.__refsLater();     // as páginas mudam depois que o sumário entra no texto
  }
  $('abntIns').addEventListener('change', e=>{
    const v = e.target.value; e.target.value = '';
    if(TPL[v]){ restore(); exec('insertHTML', TPL[v]); }
    else if(v === 'sumario') sumario();
  });

  // Referências e citações
  const RT = {
    livro:[['aut','Autor(es): SOBRENOME, Nome; SOBRENOME, Nome'],['tit','Título'],['sub','Subtítulo (opcional)'],['ed','Edição (ex.: 2. ed.)'],['loc','Local'],['edi','Editora'],['ano','Ano']],
    artigo:[['aut','Autor(es): SOBRENOME, Nome'],['tit','Título do artigo'],['per','Título do periódico'],['loc','Local'],['vol','Volume'],['num','Número'],['pag','Páginas (ex.: 15-30)'],['mes','Mês abreviado (ex.: out.)'],['ano','Ano']],
    site:[['aut','Autor ou instituição'],['tit','Título da página'],['site','Nome do site'],['ano','Ano'],['url','Endereço (URL)'],['acc','Acesso (ex.: 22 out. 2026)']],
    tcc:[['aut','Autor: SOBRENOME, Nome'],['tit','Título'],['ano','Ano'],['tipo','Tipo (ex.: Trabalho de Conclusão de Curso (Graduação em Direito))'],['inst','Instituição'],['loc','Local']],
    capitulo:[['aut','Autor(es) do capítulo: SOBRENOME, Nome'],['tit','Título do capítulo'],['autl','Autor(es) do livro: SOBRENOME, Nome'],['titl','Título do livro'],['ed','Edição (ex.: 2. ed.)'],['loc','Local'],['edi','Editora'],['ano','Ano'],['pag','Páginas do capítulo (ex.: 15-30)']],
    legis:[['aut','Jurisdição ou órgão (ex.: BRASIL)'],['tit','Tipo e número (ex.: Lei nº 8.742, de 7 de dezembro de 1993)'],['ementa','Ementa (opcional)'],['veic','Publicação (ex.: Diário Oficial da União)'],['loc','Local (ex.: Brasília, DF)'],['dat','Data de publicação (ex.: 8 dez. 1993)'],['ano','Ano'],['url','Endereço (URL) (opcional)'],['acc','Acesso (ex.: 22 out. 2026)']],
    doc:[['aut','Instituição ou autor: BRASIL. Ministério ...'],['tit','Título'],['sub','Subtítulo (opcional)'],['loc','Local'],['edi','Editora ou órgão'],['ano','Ano'],['url','Endereço (URL) (opcional)'],['acc','Acesso (ex.: 22 out. 2026)']]
  };
  const DISP = f=>f.url ? ' Disponível em: ' + f.url + '.' + (f.acc ? ' Acesso em: ' + f.acc + '.' : '') : '';
  const refs = ()=>{ const d = store.docs[store.current]; return d.refs || (d.refs = []); };
  const surn = r=>(r.f.aut || '').split(';').map(x=>x.split(',')[0].trim()).filter(Boolean);
  const cap = t=>t.toLowerCase().replace(/(^|\s)\S/g, m=>m.toUpperCase());
  function fmtRef(r){
    const f = {}; for(const k in r.f) f[k] = esc(r.f[k] || '');
    const A = (r.f.aut || '').split(';').map(x=>{ x = x.trim(); const i = x.indexOf(','); return esc(i < 0 ? x.toUpperCase() : x.slice(0,i).toUpperCase() + x.slice(i)); }).join('; ');
    if(r.type === 'livro') return A + '. <b>' + f.tit + '</b>' + (f.sub ? ': ' + f.sub : '') + '. ' + (f.ed ? f.ed.replace(/\.$/, '') + '. ' : '') + (f.loc || '[S. l.]') + ': ' + (f.edi || '[s. n.]') + ', ' + (f.ano || '[s. d.]') + '.';
    if(r.type === 'artigo') return A + '. ' + f.tit + '. <b>' + f.per + '</b>, ' + (f.loc ? f.loc + ', ' : '') + (f.vol ? 'v. ' + f.vol + ', ' : '') + (f.num ? 'n. ' + f.num + ', ' : '') + (f.pag ? 'p. ' + f.pag + ', ' : '') + (f.mes ? f.mes + ' ' : '') + f.ano + '.';
    if(r.type === 'site') return A + '. ' + f.tit + '. <b>' + f.site + '</b>, ' + f.ano + '. Disponível em: ' + f.url + '. Acesso em: ' + f.acc + '.';
    if(r.type === 'capitulo'){
      const AL = (r.f.autl || r.f.aut || '').split(';').map(x=>{ x = x.trim(); const i = x.indexOf(','); return esc(i < 0 ? x.toUpperCase() : x.slice(0,i).toUpperCase() + x.slice(i)); }).join('; ');
      return A + '. ' + f.tit + '. In: ' + AL + '. <b>' + f.titl + '</b>. ' + (f.ed ? f.ed.replace(/\.$/, '') + '. ' : '') + (f.loc || '[S. l.]') + ': ' + (f.edi || '[s. n.]') + ', ' + (f.ano || '[s. d.]') + (f.pag ? '. p. ' + f.pag : '') + '.';
    }
    if(r.type === 'legis') return A + '. ' + f.tit + '.' + (f.ementa ? ' ' + f.ementa + (/[.!?]$/.test(f.ementa) ? '' : '.') : '') + ' ' + [f.veic ? '<b>' + f.veic + '</b>' : '', f.loc, f.dat || f.ano].filter(Boolean).join(', ') + '.' + DISP(f);
    if(r.type === 'doc') return A + '. <b>' + f.tit + '</b>' + (f.sub ? ': ' + f.sub : '') + '. ' + (f.loc || '[S. l.]') + ': ' + (f.edi || '[s. n.]') + ', ' + (f.ano || '[s. d.]') + '.' + DISP(f);
    return A + '. <b>' + f.tit + '</b>. ' + f.ano + '. ' + f.tipo + ' – ' + f.inst + ', ' + f.loc + ', ' + f.ano + '.';
  }
  function cite(r, narr, pg){
    let n = surn(r); if(n.length > 3) n = [n[0] + ' et al.'];
    const y = r.f.ano + (pg ? ', p. ' + pg : '');
    return narr ? (n.length > 1 ? cap(n.slice(0,-1).join(', ')) + ' e ' + cap(n[n.length-1]) : cap(n[0])) + ' (' + y + ')'
                : '(' + n.map(x=>x.toUpperCase()).join('; ') + ', ' + y + ')';
  }
  function renderFields(){
    const WIDE = ['aut','tit','autl','titl','ementa','url','tipo','sub'];
    $('rFields').innerHTML = RT[$('rType').value].map(([k,l])=>{
      let lab = l, ph = '', m = l.match(/^(.*?)\s*\((ex\.[\s\S]*)\)$/);
      if(m){ lab = m[1]; ph = m[2]; } else if((m = l.match(/^([^:]+):\s*(.+)$/))){ lab = m[1]; ph = m[2]; }
      return '<label class="' + (WIDE.includes(k) ? 'w' : '') + '"><span>' + esc(lab) + '</span><input type="text" data-k="' + k + '" placeholder="' + esc(ph) + '" aria-label="' + esc(l) + '"></label>';
    }).join('');
  }
  // Bibliografia automática: a lista de REFERÊNCIAS e as citações no texto acompanham as fontes cadastradas
  let refEdit = null;
  const ensureIds = ()=>{ refs().forEach((r, i)=>{ if(!r.id) r.id = 'r' + Date.now().toString(36) + i; }); };
  function bibFind(){
    let b = page.querySelector('.biblio'); if(b) return b;
    const old = [...page.querySelectorAll('h1.sn')].find(h=>/^refer[eê]ncias$/i.test(h.textContent.trim()));
    if(!old) return null;
    b = document.createElement('div'); b.className = 'biblio'; old.before(b); b.appendChild(old);   // converte o bloco manual (título + parágrafos .ref) em bloco automático
    let n = b.nextElementSibling; while(n && n.classList.contains('ref')){ const x = n.nextElementSibling; b.appendChild(n); n = x; }
    return b;
  }
  function bibInner(title){
    const it = refs().map(r=>{ const h = fmtRef(r); return {h, k:h.replace(/<[^>]+>/g, '')}; }).sort((a, b)=>a.k.localeCompare(b.k, 'pt'));
    return '<h1 class="sn">' + esc(title || 'REFERÊNCIAS') + '</h1>' + it.map(i=>'<p class="ref">' + i.h + '</p>').join('');
  }
  function citUpdate(){
    const m = new Map(refs().map(r=>[r.id, r]));
    page.querySelectorAll('span.cit').forEach(sp=>{
      const r = m.get(sp.dataset.ref);
      if(!r){ sp.classList.add('missing'); sp.title = 'Fonte não encontrada: ela foi excluída da lista'; return; }
      sp.classList.remove('missing'); sp.removeAttribute('title');
      const t = cite(r, sp.dataset.narr === '1', sp.dataset.pg || '');
      if(sp.textContent !== t) sp.textContent = t;
    });
  }
  function bibUpdate(){
    ensureIds(); citUpdate();
    const b = bibFind();
    if(b){
      if(!refs().length) b.remove();
      else{ const h = b.querySelector('h1'); b.innerHTML = bibInner(h ? h.textContent.trim() : ''); }
    }
    changed();
  }
  function renderRefs(){
    ensureIds();
    const ul = $('rList'); ul.innerHTML = '';
    refs().forEach((r,i)=>{
      const li = document.createElement('li'), sp = document.createElement('span'), tg = document.createElement('em'), ac = document.createElement('div');
      tg.className = 'rt'; tg.style.fontStyle = 'normal'; tg.textContent = ({livro:'Livro', capitulo:'Capítulo', artigo:'Artigo', site:'Site', tcc:'TCC', legis:'Legislação', doc:'Documento'})[r.type] || r.type;
      sp.className = 'rx'; sp.innerHTML = fmtRef(r); li.appendChild(tg); li.appendChild(sp); ac.className = 'ra'; li.appendChild(ac);
      [['(AUTOR, ano)', false], ['Autor (ano)', true]].forEach(([lbl, narr])=>{
        const b = document.createElement('button'); b.textContent = lbl; b.title = 'Inserir citação no texto';
        b.onclick = ()=>{
          const pg = (prompt('Página (opcional, ex.: 15):', '') || '').trim(); $('refDlg').close(); restore(); persist();
          exec('insertHTML', '<span class="cit" data-new="1" data-ref="' + r.id + '" data-narr="' + (narr ? 1 : 0) + '"' + (pg ? ' data-pg="' + esc(pg).replace(/"/g, '&quot;') + '"' : '') + ' contenteditable="false">' + esc(cite(r, narr, pg)) + '</span>&#8203;');
          const mk = page.querySelector('span.cit[data-new]');
          if(mk){ mk.removeAttribute('data-new'); tuckMark(mk); caretAfter(mk); changed(); }
        };
        ac.appendChild(b);
      });
      const ed = document.createElement('button'); ed.textContent = '✎'; ed.title = 'Editar referência';
      ed.onclick = ()=>{
        refEdit = i; $('rType').value = r.type; renderFields();
        $('rFields').querySelectorAll('input').forEach(inp=>{ inp.value = r.f[inp.dataset.k] || ''; });
        $('rAdd').textContent = 'Salvar alterações'; $('rCancelEdit').hidden = false; $('rFormTitle').textContent = 'Editando fonte';
        $('rFields').querySelector('input').focus();
      };
      ac.appendChild(ed);
      const x = document.createElement('button'); x.textContent = '✕'; x.title = 'Excluir referência';
      x.onclick = ()=>{ if(refEdit !== null) endEdit(); refs().splice(i, 1); persist(); renderRefs(); bibUpdate(); };
      ac.appendChild(x); ul.appendChild(li);
    });
    $('rEmpty').hidden = refs().length > 0; $('rCount').textContent = 'Fontes cadastradas (' + refs().length + ')';
  }
  function endEdit(){ refEdit = null; $('rAdd').textContent = 'Adicionar à lista'; $('rCancelEdit').hidden = true; $('rFormTitle').textContent = 'Nova fonte'; }
  $('rCancelEdit').addEventListener('click', ()=>{ endEdit(); renderFields(); });
  $('btnRefUpd').addEventListener('mousedown', e=>e.preventDefault());
  $('btnRefUpd').addEventListener('click', ()=>{
    if(!refs().length && !page.querySelector('.biblio,span.cit')){ alert('Nenhuma fonte cadastrada. Use o botão Referências para cadastrar.'); return; }
    bibUpdate();
  });
  $('btnRefs').addEventListener('click', ()=>{ endEdit(); renderFields(); renderRefs(); $('refDlg').showModal(); });
  $('rType').addEventListener('change', renderFields);
  $('rClose').addEventListener('click', ()=>{ endEdit(); $('refDlg').close(); });
  $('rX').addEventListener('click', ()=>$('rClose').click());
  $('rAdd').addEventListener('click', ()=>{
    const f = {}; $('rFields').querySelectorAll('input').forEach(i=>f[i.dataset.k] = i.value.trim());
    if(!f.aut || !f.tit){ alert('Preencha pelo menos o autor e o título.'); return; }
    if(refEdit !== null){ const old = refs()[refEdit]; refs()[refEdit] = {id:old && old.id, type:$('rType').value, f}; endEdit(); }
    else refs().push({type:$('rType').value, f});
    ensureIds(); persist(); renderFields(); renderRefs(); bibUpdate();
  });
  $('rInsert').addEventListener('click', ()=>{
    if(!refs().length) return;
    ensureIds(); persist(); endEdit();
    $('refDlg').close();
    if(bibFind()){ bibUpdate(); return; }
    restore(); exec('insertHTML', bibInner());
    bibFind(); changed();                // vira um bloco que se atualiza sozinho quando as fontes mudam
  });

  // Inserir Citação e Bibliografia (menus no estilo do Word)
  (function(){
    let narr = false, askPg = false;
    function insertCite(r, pg){
      restore(); persist();
      exec('insertHTML', '<span class="cit" data-new="1" data-ref="' + r.id + '" data-narr="' + (narr ? 1 : 0) + '"' + (pg ? ' data-pg="' + esc(pg).replace(/"/g, '&quot;') + '"' : '') + ' contenteditable="false">' + esc(cite(r, narr, pg)) + '</span>&#8203;');
      const mk = page.querySelector('span.cit[data-new]');
      if(mk){ mk.removeAttribute('data-new'); tuckMark(mk); caretAfter(mk); changed(); }
    }
    function insertBib(title){
      if(!refs().length){ alert('Nenhuma fonte cadastrada. Use Gerenciar Fontes para cadastrar.'); return; }
      ensureIds(); persist();
      const b = bibFind();
      if(b){ const h = b.querySelector('h1'); if(h) h.textContent = title; bibUpdate(); return; }
      restore(); exec('insertHTML', bibInner(title)); bibFind(); changed();
    }
    function popMenu(btn, build){
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
          const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', it.chk !== undefined ? 'menuitemcheckbox' : 'menuitem');
          b.textContent = (it.chk !== undefined ? (it.chk ? '✓ ' : '\u2003') : '') + it.t; if(it.h) b.title = it.h;
          b.addEventListener('click', ()=>{ close(); it.f(); }); pop.appendChild(b);
        });
        pop.style.maxHeight = '70vh'; pop.style.overflowY = 'auto';
        pop.addEventListener('mousedown', e=>e.preventDefault());
        document.body.appendChild(pop);
        const r = btn.getBoundingClientRect();
        pop.style.left = Math.max(4, Math.min(r.left, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.min(r.bottom + 2, innerHeight - pop.offsetHeight - 4) + 'px';
        btn.setAttribute('aria-expanded', 'true');
        document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
      });
    }
    popMenu($('btnCite'), ()=>{
      ensureIds();
      const it = refs().map(r=>({t:(surn(r).map(x=>x.toUpperCase()).join('; ') || r.f.tit) + ', ' + (r.f.ano || 's.d.') + ' — ' + (r.f.tit || ''), h:'Inserir citação desta fonte',
        f:()=>{ const pg = askPg ? (prompt('Página (opcional, ex.: 15):', '') || '').trim() : ''; insertCite(r, pg); }}));
      return [...it, ...(it.length ? ['-'] : []),
        {t:'Adicionar nova fonte…', f:()=>$('btnRefs').click()},
        {t:'Gerenciar Fontes…', f:()=>$('btnRefs').click()}, '-',
        {t:'Citação narrativa: Autor (ano)', chk:narr, f:()=>{ narr = !narr; }},
        {t:'Perguntar a página ao inserir', chk:askPg, f:()=>{ askPg = !askPg; }}];
    });
    popMenu($('btnBib'), ()=>[
      {t:'Referências', h:'Insere a lista com o título REFERÊNCIAS', f:()=>insertBib('REFERÊNCIAS')},
      {t:'Bibliografia', h:'Insere a lista com o título BIBLIOGRAFIA', f:()=>insertBib('BIBLIOGRAFIA')}, '-',
      {t:'Atualizar lista', f:()=>$('btnRefUpd').click()}]);
  })();
