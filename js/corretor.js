/* Verbus — Contagem, ortografia, gramática, sinônimos e dicionário
   (js/corretor.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ---------- Contagem detalhada ----------
  let savedSelStats = null;
  function statsOf(text, paras){
    const clean = text.replace(/[\u200b\u00ad]/g, '');
    const words = (clean.trim().match(/\S+/g) || []).length;
    const noSp = clean.replace(/\s/g, '').length;
    const withSp = clean.replace(/[\r\n]+/g, ' ').replace(/\s+$/,'').length;
    const mins = n=>{ if(!n) return '0 min'; const m = n / 200; return m < 1 ? '< 1 min' : Math.round(m) + ' min'; };
    const talk = w=>{ if(!w) return '0 min'; const m = w / 130; return m < 1 ? '< 1 min' : Math.round(m) + ' min'; };
    return {words, noSp, withSp, paras, read: mins(words), talk: talk(words)};
  }
  function docStats(inclNotes){
    let text = page.innerText || '', paras = 0;
    const box = page.querySelector(':scope > .fnotes');
    const blocks = [...page.querySelectorAll('p,h1,h2,h3,h4,li,blockquote,td,th')].filter(b=>!b.querySelector('p,h1,h2,h3,h4,li,blockquote,td,th') && b.textContent.replace(/[\u200b\s]/g,''));
    if(box && !inclNotes){ const nt = box.innerText || ''; if(text.endsWith(nt)) text = text.slice(0, text.length - nt.length); }
    paras = blocks.filter(b=>inclNotes || !b.closest('.fnotes,.endnotes')).length;
    return statsOf(text, paras);
  }
  function selStats(){
    const s = getSelection(); if(!s.rangeCount || s.isCollapsed || !page.contains(s.anchorNode)) return null;
    const r = s.getRangeAt(0), t = s.toString();
    const paras = [...page.querySelectorAll('p,h1,h2,h3,h4,li,blockquote')].filter(b=>!b.querySelector('p,h1,h2,h3,h4,li,blockquote') && r.intersectsNode(b) && b.textContent.replace(/[\u200b\s]/g,'')).length;
    return statsOf(t, paras);
  }
  function pagesEst(){
    const m = effMar(), use = Math.max(CMPX, pgOf().h * CMPX - m.t - m.b);
    const k = [...page.children].filter(x=>x.nodeType === 1); if(!k.length) return 1;
    const h = k[k.length - 1].offsetTop + k[k.length - 1].offsetHeight - k[0].offsetTop;
    return Math.max(1, Math.ceil((h - 2) / use));
  }
  function showCount(){
    const sel = savedSelStats;
    const d = docStats($('cntNotes').checked);
    const row = (label, k)=>'<tr><td>' + label + '</td>' + (sel ? '<td>' + sel[k].toLocaleString('pt-BR') + '</td>' : '') + '<td>' + d[k].toLocaleString('pt-BR') + '</td></tr>';
    $('cntTbl').innerHTML = '<tr><th></th>' + (sel ? '<th>Seleção</th>' : '') + '<th>Documento</th></tr>' +
      '<tr><td>Páginas (estimativa A4)</td>' + (sel ? '<td></td>' : '') + '<td>' + pagesEst() + '</td></tr>' +
      row('Palavras','words') + row('Caracteres (sem espaços)','noSp') + row('Caracteres (com espaços)','withSp') + row('Parágrafos','paras') +
      row('Tempo de leitura (200 palavras/min)','read') + row('Tempo de fala (130 palavras/min)','talk');
  }
  function openCount(){ savedSelStats = selStats(); showCount(); $('cntDlg').showModal(); }
  $('btnCount').addEventListener('mousedown', e=>e.preventDefault());
  $('btnCount').addEventListener('click', openCount);
  $('count').addEventListener('click', openCount);
  $('count').addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openCount(); } });
  $('cntNotes').addEventListener('change', showCount);
  $('cntClose').addEventListener('click', ()=>$('cntDlg').close());


  // ---------- Revisão: ortografia, erros comuns e sinônimos ----------
  // Idioma e marcação do corretor do navegador
  (function(){
    let lang = 'pt-BR', on = true;
    try{ lang = localStorage.getItem(LS_KEYS.lang) || lang; on = localStorage.getItem(LS_KEYS.spell) !== '0'; }catch(e){}
    const apply = ()=>{
      [page, ...document.querySelectorAll('.hfb')].forEach(el=>{ el.lang = lang; el.spellcheck = on; });
      $('revLang').value = lang; $('revSpell').checked = on;
    };
    apply();
    $('revLang').addEventListener('change', e=>{ lang = e.target.value; try{ localStorage.setItem(LS_KEYS.lang, lang); }catch(_){} apply(); });
    $('revSpell').addEventListener('change', e=>{ on = e.target.checked; try{ localStorage.setItem(LS_KEYS.spell, on ? '1' : '0'); }catch(_){} apply(); });
  })();

  // Somente formas que não existem sem acento (evita falsos alertas como "esta/está", "pais/país")
  const RV_ACENTOS = {nao:'não', voce:'você', voces:'vocês', tambem:'também', entao:'então', ate:'até', porem:'porém', alem:'além', atraves:'através', tres:'três', mes:'mês', apos:'após', ninguem:'ninguém', alguem:'alguém', estao:'estão', irao:'irão', familias:'famílias', saude:'saúde', beneficio:'benefício', beneficios:'benefícios', servico:'serviço', servicos:'serviços', orgao:'órgão', orgaos:'órgãos', relatorio:'relatório', relatorios:'relatórios', psicologica:'psicológica', psicologico:'psicológico', assistencia:'assistência', experiencia:'experiência', diferenca:'diferença', necessario:'necessário', necessaria:'necessária', obrigatorio:'obrigatório', basico:'básico', basica:'básica', juridico:'jurídico', juridica:'jurídica', numeros:'números', unico:'único', unica:'única', facil:'fácil', dificil:'difícil', possivel:'possível', responsavel:'responsável', vulneravel:'vulnerável', ola:'olá'};
  function matchCase(orig, rep){
    if(orig.length > 1 && orig === orig.toUpperCase()) return rep.toUpperCase();
    if(orig[0] !== orig[0].toLowerCase()) return rep[0].toUpperCase() + rep.slice(1);
    return rep;
  }
  // ---------- Dicionário de português (Hunspell em WebAssembly + dicionário pt-BR do LibreOffice/VERO) ----------
  // Tudo fica dentro do app (pasta spell/): funciona offline desde a primeira vez e não depende de CDN. O Hunspell roda num Web Worker:
  // a tela continua livre e as palavras são conferidas em lotes (o resultado volta por mensagem).
  const DIC_EXTRA = 'condicionalidade condicionalidades socioassistencial socioassistenciais socioeducativo socioeducativa socioeducativos socioeducativas intersetorial intersetoriais intersetorialidade pix emoji emojis podcast podcasts selfie selfies online offline smartphone smartphones wifi whatsapp instagram wi-fi app apps gov genograma genogramas ecomapa ecomapas déficit déficits psicoeducação matriciamento socioemocional socioemocionais neurodivergente neurodivergentes neurodivergência cisgênero heteroagressividade intrafamiliar intrafamiliares transgeracional transgeracionais contrarreferência contrarreferências referenciamento vulnerabilização revitimização parentalidade coparentalidade homoparental homoparentais cadúnico';
  const spMem = {}, spOk = new Map(), spIgnore = new Set();
  const spLang = ()=>{ let l = 'pt-BR'; try{ l = localStorage.getItem(LS_KEYS.lang) || l; }catch(e){} return l === 'pt-BR' ? l : null; };   // outros idiomas: só o corretor do navegador
  const spUser = ()=>{ try{ return JSON.parse(localStorage.getItem(LS_KEYS.dicUser) || '[]'); }catch(e){ return []; } };
  function spProxy(w){
    const res = new Map(), want = new Map(), sent = new Set(); let tm = 0, waiters = [];
    const settle = ()=>{ if(!sent.size && !want.size){ const f = waiters; waiters = []; f.forEach(g=>g()); } };
    const flush = ()=>{
      tm = 0; const plain = [], withSug = [];
      want.forEach((ns, x)=>{ if(!sent.has(x)) (ns ? withSug : plain).push(x); });
      want.clear();
      [plain, withSug].forEach((words, i)=>{ if(!words.length) return; words.forEach(x=>sent.add(x)); w.postMessage({t:'check', words, sug:!!i}); });
      settle();
    };
    w.onmessage = ev=>{
      const m = ev.data;
      if(m.t === 'res'){
        m.out.forEach(([x, ok, sug])=>{ res.set(x, {ok, sug}); sent.delete(x); });
        spOk.clear(); if(typeof liveSoon === 'function' && liveOn) liveSoon(true); settle();
      }else if(m.t === 'sug'){ const r = res.get(m.w); if(r) r.sug = m.sug; }
    };
    const px = {
      async:true,
      look(x, ns){                                   // undefined = ainda esperando o Worker (a conferência é refeita quando a resposta chega)
        const r = res.get(x);
        if(r && (r.ok || !ns || r.sug)) return r.ok;
        if(!want.has(x) || ns) want.set(x, !!ns);
        if(!tm) tm = setTimeout(flush, 25);
        return r && r.ok;
      },
      correct(x){ const r = res.get(x); if(r) return r.ok; px.look(x); return !RV_ACENTOS[x.toLowerCase()]; },
      suggest(x){ const r = res.get(x); return (r && r.sug) || []; },
      add(x){ res.set(x, {ok:true, sug:null}); w.postMessage({t:'add', w:x}); },
      idle(){ return new Promise(ok=>{ if(tm){ clearTimeout(tm); flush(); } if(sent.size || want.size) waiters.push(ok); else ok(); }); }
    };
    return px;
  }
  function spWorker(){
    return new Promise((ok, no)=>{
      let w; try{ w = new Worker('spell/spell-worker.js', {type:'module'}); }catch(e){ return no(e); }
      const fim = setTimeout(()=>{ try{ w.terminate(); }catch(_){} no(new Error('o dicionário demorou')); }, 60000);
      w.onerror = e=>{ clearTimeout(fim); try{ w.terminate(); }catch(_){} no(new Error('worker')); };
      w.onmessage = ev=>{
        if(ev.data.t === 'ready'){ clearTimeout(fim); ok(spProxy(w)); }
        else if(ev.data.t === 'fail'){ clearTimeout(fim); try{ w.terminate(); }catch(_){} no(new Error(ev.data.e)); }
      };
      w.postMessage({t:'init', extra:DIC_EXTRA.split(' ').concat(spUser())});
    });
  }
  function spLoad(){
    const lang = spLang(); if(!lang) return Promise.reject(new Error('sem dicionário'));
    if(!window.Worker) return Promise.reject(new Error('sem Worker'));
    if(!spMem[lang]) spMem[lang] = spWorker().catch(e=>{ console.warn('Dicionário indisponível; fica o corretor do navegador.', e); delete spMem[lang]; throw e; });
    return spMem[lang];
  }
  function spAdd(w){
    try{ localStorage.setItem(LS_KEYS.dicUser, JSON.stringify([...new Set(spUser().concat(w))])); }catch(_){}
    spOk.clear(); return spLoad().then(sp=>{ sp.add(w); spOk.clear(); liveSoon(true); });
  }
  const spStrip = x=>x.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const rvCmp = (a, b)=>(a.node === b.node ? a.start - b.start : (a.node.compareDocumentPosition(b.node) & 4 ? -1 : 1));
  function rvOrto(sp, noSug, only, root){   // root: varre só os textos que pertencem a esse bloco (verificação ao vivo)
    const out = [], memo = spOk, tw = document.createTreeWalker(root || page, NodeFilter.SHOW_TEXT, root ? {acceptNode:n=>lvBlock(n) === root ? 1 : 2} : null);
    const rx = /(?<![\p{L}\p{N}@\/._-])\p{L}+(?:-\p{L}+)*(?![\p{L}\p{N}@\/_]|\.\p{L})/gu;
    for(let n = only || tw.nextNode(); n; n = only ? null : tw.nextNode()){
      if(n.parentNode.closest('.fnsep,script,style,a[href],code,pre')) continue;
      const t = n.data; let m; rx.lastIndex = 0;
      while((m = rx.exec(t))){
        const w = m[0];
        if(w.length < 2 || w === w.toUpperCase() || spIgnore.has(w)) continue;                                   // siglas
        if(w[0] !== w[0].toLowerCase() && !/(^|[.!?…]\s+)$/.test(t.slice(0, m.index))) continue; // nomes próprios no meio da frase
        let ok = memo.get(w);
        if(ok === undefined){
          if(sp.async){ ok = sp.look(w, !noSug); if(ok === undefined) continue; }   // dicionário em segundo plano: pula até o Worker responder
          else ok = sp.correct(w) || (w.includes('-') && w.split('-').every(x=>sp.correct(x)));
          memo.set(w, ok);
        }
        if(ok) continue;
        const sug = noSug ? [] : sp.suggest(w).slice(0, 5).sort((a, b)=>(spStrip(b) === spStrip(w)) - (spStrip(a) === spStrip(w))).slice(0, 4);   // mesma palavra com acento corrigido vem primeiro
        out.push({node:n, start:m.index, len:w.length, rep:sug[0] || null, sug, kind:'orto', label:'Ortografia: “' + w + '”', text:w});
      }
    }
    return out;
  }
  // Regras de gramática/estilo de um trecho de texto (usadas na janela de revisão e na marcação ao vivo; live = sem a regra de acentos, que a ortografia já cobre)
  function rvGramNode(n, live){
    const found = [], t = n.data; if(!t.trim()) return found;
      const add = (kind, start, len, rep, label)=>found.push({node:n, start, len, rep, kind, label, text:t.substr(start, len)});
      let m, rx;
      rx = /(^|[^\p{L}\p{N}])(\p{L}{2,})(\s+)\2(?![\p{L}\p{N}])/giu;           // palavra repetida
      while((m = rx.exec(t))){ const w = m[2]; if(/^(\p{Lu}+|\d+)$/u.test(w)) continue; add('rep', m.index + m[1].length, w.length * 2 + m[3].length, w, 'Palavra repetida'); rx.lastIndex = m.index + m[0].length - w.length; }
      rx = /(?<=\S) {2,}(?=\S)/g;                                                  // espaços duplos
      while((m = rx.exec(t))) add('sp', m.index, m[0].length, ' ', 'Espaço duplo');
      rx = /(?<=[\p{L}\p{N})\]”"]) +(?=[,;:!?](?![.!?]))/gu;                        // espaço antes da pontuação
      while((m = rx.exec(t))) add('pre', m.index, m[0].length, '', 'Espaço antes de pontuação');
      rx = /(?<=\p{L}{2})([,;:!?])(?=\p{L})/gu;                                    // sem espaço depois
      while((m = rx.exec(t))){ const tok = t.slice(Math.max(0, t.lastIndexOf(' ', m.index) + 1), t.indexOf(' ', m.index) < 0 ? t.length : t.indexOf(' ', m.index)); if(/[@\/]|https?:/.test(tok)) continue; add('after', m.index, 1, m[1] + ' ', 'Falta espaço depois de “' + m[1] + '”'); }
      rx = /(?<=\p{Ll}{3})\.(?=\p{Lu}\p{Ll})/gu;
      while((m = rx.exec(t))){ const tok = t.slice(Math.max(0, t.lastIndexOf(' ', m.index) + 1), t.indexOf(' ', m.index) < 0 ? t.length : t.indexOf(' ', m.index)); if(/[@\/]|https?:|www\./i.test(tok)) continue; add('after', m.index, 1, '. ', 'Falta espaço depois do ponto'); }
      if(!live){
      rx = /(?<![\p{L}\p{N}_-])(\p{L}+)(?![\p{L}\p{N}_-])/gu;                       // acentos esquecidos
      while((m = rx.exec(t))){
        const w = m[1], lw = w.toLowerCase();
        let rep = RV_ACENTOS[lw];
        if(!rep && /(ç|c)ao$/.test(lw) && /[^c]cao$/.test(lw) && lw.length > 4) rep = lw.replace(/cao$/, 'ção');
        if(!rep && /coes$/.test(lw) && lw.length > 5) rep = lw.replace(/coes$/, 'ções');
        if(rep) add('acc', m.index, w.length, matchCase(w, rep), 'Acentuação: “' + w + '” → “' + matchCase(w, rep) + '”');
      }
      }
    return found;
  }
  function rvScan(){
    const found = [], tw = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    let n;
    while((n = tw.nextNode())){
      if(n.parentNode.closest('.fnsep,script,style,a[href],code,pre')) continue;
      found.push(...rvGramNode(n));
    }
    found.sort(rvCmp);
    return found;
  }
  let rvItems = [];
  function rvRender(){
    const ul = $('revList'); ul.innerHTML = '';
    rvItems.forEach((it, i)=>{
      const li = document.createElement('li');
      const ctx = it.node.data.slice(Math.max(0, it.start - 18), it.start + it.len + 18).replace(/\s+/g, ' ');
      li.innerHTML = '<span class="k"><b></b><small></small></span><button data-a="go">Ir</button>' + (it.kind === 'orto' ? it.sug.map((x, j)=>'<button data-a="sug" data-j="' + j + '"></button>').join('') + '<button data-a="add">Adicionar ao dicionário</button>' : '<button data-a="fix">Corrigir</button>') + '<button data-a="ign">Ignorar</button>';
      li.querySelectorAll('[data-a=sug]').forEach(b=>{ b.textContent = it.sug[+b.dataset.j]; });
      li.querySelector('b').textContent = it.label; li.querySelector('small').textContent = '…' + ctx + '…';
      li.dataset.i = i; ul.appendChild(li);
    });
    $('revStat').textContent = rvItems.length ? rvItems.length + ' ponto(s) para revisar' : 'Nada encontrado. ✓';
    $('revFixAll').disabled = !rvItems.length;
  }
  function rvFix(it){
    if(!it.node.isConnected) return;
    it.node.replaceData(it.start, it.len, it.rep);
  }
  function rvGo(it){
    if(!it.node.isConnected) return;
    const r = document.createRange(); r.setStart(it.node, it.start); r.setEnd(it.node, Math.min(it.node.length, it.start + it.len));
    page.focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    (it.node.parentElement || page).scrollIntoView({block:'center'});
  }
  async function rvRescan(){
    rvItems = rvScan(); rvRender();
    if(!spLang()) return;   // idioma sem dicionário próprio
    $('revStat').textContent = 'Carregando o dicionário de português…';
    try{
      const sp = await spLoad(), base = rvItems;
      if(sp.async){ rvOrto(sp); await sp.idle(); rvOrto(sp); await sp.idle(); }   // pede as palavras ao Worker e espera as respostas (com sugestões)
      rvItems = base.concat(rvOrto(sp).filter(o=>!base.some(a=>a.node === o.node && a.start === o.start))).sort(rvCmp);
      rvRender();
    }catch(e){ rvRender(); $('revStat').textContent += ' (Não consegui carregar o dicionário de português. Atualize a página e tente de novo.)'; }
  }
  $('btnRev').addEventListener('mousedown', e=>e.preventDefault());
  $('btnRev').addEventListener('click', ()=>{ rvRescan(); $('revDlg').showModal(); });
  $('revScan').addEventListener('click', rvRescan);
  $('revClose').addEventListener('click', ()=>$('revDlg').close());
  $('revFixAll').addEventListener('click', ()=>{
    // do fim para o começo em cada trecho de texto, pulando itens que se sobrepõem
    const byNode = new Map(); rvItems.forEach(it=>{ if(it.kind === 'orto') return; if(!byNode.has(it.node)) byNode.set(it.node, []); byNode.get(it.node).push(it); });
    byNode.forEach(list=>{
      let limit = Infinity;
      list.sort((x, y)=>y.start - x.start).forEach(it=>{ if(it.start + it.len <= limit){ rvFix(it); limit = it.start; } });
    });
    changed(); rvRescan();
  });
  $('revList').addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b) return;
    const li = b.closest('li'), it = rvItems[+li.dataset.i]; if(!it) return;
    if(b.dataset.a === 'go'){ $('revDlg').close(); rvGo(it); return; }
    if(b.dataset.a === 'fix'){ rvFix(it); changed(); rvRescan(); return; }
    if(b.dataset.a === 'sug'){ it.rep = it.sug[+b.dataset.j]; rvFix(it); changed(); rvRescan(); return; }
    if(b.dataset.a === 'add'){
      spAdd(it.text).then(rvRescan); return;
    }
    rvItems.splice(+li.dataset.i, 1); rvRender();
  });

  // ---------- Como no Word: sublinhado ondulado vermelho ao digitar + clique direito com sugestões ----------
  let spReady = null, liveOn = false, liveT = 0;
  // Verificação incremental: guarda os trechos errados por bloco (parágrafo, item, célula…) e só refaz os blocos que mudaram
  const LV_SEL = 'p,li,h1,h2,h3,h4,h5,h6,td,th,blockquote,pre,div', LV_SKIP = '.fnsep,script,style,a[href],code,pre';
  const lvMap = new Map(), lvDirty = new Set(), lvOnce = new WeakMap();
  let lvHl = null, lvGr = null, lvCaretBlk = null, lvGramOn = true;
  try{ lvGramOn = localStorage.getItem(LS_KEYS.gram) !== '0'; }catch(e){}
  const lvOnceHas = (n, t)=>{ const x = lvOnce.get(n); return !!x && x.has(t); };       // "Ignorar uma vez" (vale para essa palavra neste trecho de texto)
  const lvOnceAdd = (n, t)=>{ let x = lvOnce.get(n); if(!x) lvOnce.set(n, x = new Set()); x.add(t); };
  function lvBlock(n){ const e = n && (n.nodeType === 1 ? n : n.parentElement), b = e && e.closest ? e.closest(LV_SEL) : null; return b && b !== page && page.contains(b) ? b : page; }
  function lvAll(){ lvDirty.clear(); lvDirty.add(page); page.querySelectorAll(LV_SEL).forEach(b=>lvDirty.add(b)); }
  function liveSoon(full){ if(full === true) lvAll(); clearTimeout(liveT); liveT = setTimeout(liveRun, 350); }
  function liveNative(on){ [page, ...document.querySelectorAll('.hfb')].forEach(el=>{ el.spellcheck = on; }); }
  function lvNodes(b){
    const out = [];
    if(b === page){ page.childNodes.forEach(n=>{ if(n.nodeType === 3) out.push(n); }); return out; }   // texto solto direto na folha
    const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, {acceptNode:n=>lvBlock(n) === b ? 1 : 2});
    for(let n; (n = tw.nextNode());) out.push(n);
    return out;
  }
  function lvDrop(ent){ ent.s.forEach(r=>lvHl && lvHl.delete(r)); ent.g.forEach(r=>lvGr && lvGr.delete(r)); }
  function lvScan(b, caret, off){
    const old = lvMap.get(b); if(old) lvDrop(old);
    if(b !== page && !b.isConnected){ lvMap.delete(b); return; }
    const ent = {s:[], g:[]};
    // não marca a palavra que ainda está sendo digitada, nem o que o usuário mandou ignorar
    const skip = o=>(o.node === caret && off >= o.start && off <= o.start + o.len) || lvOnceHas(o.node, o.text);
    const mk = o=>{ const r = document.createRange(); r.setStart(o.node, o.start); r.setEnd(o.node, o.start + o.len); r._it = o; return r; };
    lvNodes(b).forEach(n=>{
      rvOrto(spReady, true, n).forEach(o=>{ if(!skip(o)) ent.s.push(mk(o)); });
      if(lvGramOn && !n.parentNode.closest(LV_SKIP)) rvGramNode(n, true).forEach(o=>{ if(!skip(o)) ent.g.push(mk(o)); });
    });
    lvMap.set(b, ent); ent.s.forEach(r=>lvHl.add(r)); ent.g.forEach(r=>lvGr.add(r));
  }
  function lvProof(){   // ícone da barra de status: visto azul = sem problemas; X vermelho = há problemas (clique vai ao próximo)
    const ic = document.getElementById('proofIc'), mk = document.getElementById('proofMk'); if(!ic || !mk) return;
    if(!liveOn){ mk.setAttribute('d', 'M8.6 11.2l1.8 1.8 3.4-4'); mk.setAttribute('stroke', '#9aa0a6'); ic.title = 'Revisão (F7) — a marcação ao vivo está desligada ou carregando'; return; }
    let ns = 0, ng = 0; lvMap.forEach(e=>{ ns += e.s.length; ng += e.g.length; });
    const n = ns + ng;
    mk.setAttribute('d', n ? 'M8.9 9.1l3.8 3.8M12.7 9.1l-3.8 3.8' : 'M8.6 11.2l1.8 1.8 3.4-4');
    mk.setAttribute('stroke', n ? '#d93025' : '#2b79c9');
    ic.title = n ? (ns ? ns + ' erro(s) de ortografia' : '') + (ns && ng ? ' · ' : '') + (ng ? ng + ' de gramática/estilo' : '') + ' — clique para ir ao próximo' : 'Nenhum erro encontrado — clique para abrir a Revisão (F7)';
  }
  function lvNext(){   // como clicar no ícone do Word: vai para o próximo problema depois do cursor
    const all = []; lvMap.forEach(e=>e.s.concat(e.g).forEach(r=>{ if(r.startContainer.isConnected) all.push(r); }));
    if(!liveOn || !all.length){ $('btnRev').click(); return; }
    all.sort((a, b)=>a.compareBoundaryPoints(Range.START_TO_START, b));
    const s = getSelection(), cur = s.rangeCount && page.contains(s.anchorNode) ? s.getRangeAt(0) : null;
    const nx = (cur && all.find(r=>r.compareBoundaryPoints(Range.START_TO_START, cur) > 0)) || all[0];
    page.focus(); s.removeAllRanges(); s.addRange(nx.cloneRange());
    (nx.startContainer.parentElement || page).scrollIntoView({block:'center'});
  }
  function liveRun(){
    if(!liveOn) return;
    if(!lvHl){ lvHl = new Highlight(); CSS.highlights.set('vspell', lvHl); lvGr = new Highlight(); CSS.highlights.set('vgram', lvGr); }
    lvMap.forEach((ent, b)=>{ if(b !== page && !b.isConnected){ lvDrop(ent); lvMap.delete(b); } });   // blocos apagados
    const s = getSelection(), caret = s.rangeCount && s.isCollapsed ? s.anchorNode : null, off = s.anchorOffset;
    const cb = caret && page.contains(caret) ? lvBlock(caret) : null;
    if(lvCaretBlk && lvCaretBlk !== cb) lvDirty.add(lvCaretBlk);   // o bloco que o cursor deixou volta a marcar a palavra que estava aberta
    lvCaretBlk = cb;
    const t0 = performance.now();
    if(cb){ lvDirty.delete(cb); lvScan(cb, caret, off); }
    for(const b of lvDirty){
      lvDirty.delete(b); lvScan(b, caret, off);
      if(lvDirty.size && performance.now() - t0 > 14){ clearTimeout(liveT); liveT = setTimeout(liveRun, 40); break; }   // fatia o trabalho para não travar a digitação
    }
    if(!lvDirty.size) lvProof();
  }
  async function liveStart(){
    liveOn = false; try{ CSS.highlights.delete('vspell'); CSS.highlights.delete('vgram'); }catch(e){}
    lvMap.clear(); lvDirty.clear(); lvHl = lvGr = null; lvCaretBlk = null; lvProof();
    let on = true; try{ on = localStorage.getItem(LS_KEYS.spell) !== '0'; }catch(e){}
    if(!on || !window.CSS || !CSS.highlights || typeof Highlight === 'undefined') return;
    const lang = spLang();
    if(!lang){ liveNative(on); return; }
    try{ const sp = await spLoad(); if(lang !== spLang()) return; spReady = sp; }catch(e){ return; }   // sem dicionário: continua o corretor do navegador
    liveOn = true; liveNative(false); lvAll(); liveRun();
  }
  window.__vsMenu = ()=>{      // itens no topo do menu do botão direito: sugestões em negrito, ignorar, dicionário (como no Word)
    const s = getSelection(), r = liveOn && s.rangeCount ? s.getRangeAt(0) : null, n = r && r.startContainer;
    if(!n || n.nodeType !== 3 || !page.contains(n)) return [];
    const off = r.startOffset, items = [];
    const apply = (o, txt)=>{
      const rr = document.createRange(); rr.setStart(o.node, o.start); rr.setEnd(o.node, o.start + o.len);
      page.focus(); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rr);
      const ok = txt === '' ? document.execCommand('delete') : document.execCommand('insertText', false, txt);
      if(!ok){ o.node.replaceData(o.start, o.len, txt); changed(); }
      liveSoon();
    };
    const once = o=>({t:'Ignorar uma vez', fn:()=>{ lvOnceAdd(o.node, o.text); lvDirty.add(lvBlock(o.node)); liveSoon(); }});
    const o = rvOrto(spReady, false, n).find(x=>off >= x.start && off <= x.start + x.len);
    if(o) items.push(...(o.sug.length ? o.sug.map(sg=>({t:sg, b:1, fn:()=>apply(o, sg)})) : [{t:'(sem sugestões)', dis:true}]), {sep:1},
      once(o), {t:'Ignorar tudo', fn:()=>{ spIgnore.add(o.text); liveSoon(true); }}, {t:'Adicionar ao dicionário', fn:()=>spAdd(o.text)},
      {t:'Ortografia…', fn:()=>$('btnRev').click()}, {sep:1});
    if(lvGramOn && !n.parentNode.closest(LV_SKIP)){
      const g = rvGramNode(n, true).find(x=>off >= x.start && off <= x.start + x.len);
      if(g) items.push({t:g.label, dis:true}, {t:g.rep === '' ? 'Excluir' : g.kind === 'after' ? 'Inserir espaço' : '“' + g.rep.trim() + '”', b:1, fn:()=>apply(g, g.rep)}, once(g), {sep:1});
    }
    return items;
  };
  // Autocorreção ao digitar (como no Word): acentos esquecidos e letra maiúscula depois de ponto final — Ctrl+Z desfaz
  const AUTO_ABBR = new Set('etc ex pág págs sr sra srs dr dra av tel obs art arts inc ltda cia prof profa cap fig vol ed org aprox'.split(' '));
  function autoRep(w){
    if(spReady && spReady.correct(w)) return null;
    const lw = w.toLowerCase(); let r = RV_ACENTOS[lw];
    if(!r && /[^c]cao$/.test(lw) && lw.length > 4) r = lw.replace(/cao$/, 'ção');
    if(!r && /coes$/.test(lw) && lw.length > 5) r = lw.replace(/coes$/, 'ções');
    return r ? matchCase(w, r) : null;
  }
  const revAuto = $('revAuto');
  try{ revAuto.checked = localStorage.getItem(LS_KEYS.auto) !== '0'; }catch(_){}
  revAuto.addEventListener('change', ()=>{ try{ localStorage.setItem(LS_KEYS.auto, revAuto.checked ? '1' : '0'); }catch(_){} });
  page.addEventListener('input', e=>{
    if(e.inputType !== 'insertText' || !e.data || e.data.length !== 1 || e.isComposing || !revAuto.checked || !/^pt/i.test(page.lang || 'pt') || !/[\s.,;:!?)\]”"]/.test(e.data)) return;
    const s = getSelection(), n = s.anchorNode, off = s.anchorOffset;
    if(!s.isCollapsed || !n || n.nodeType !== 3 || !page.contains(n) || n.parentNode.closest('a[href],code,pre,.fnsep')) return;
    const before = n.data.slice(0, off - 1), m = /\p{L}+$/u.exec(before); if(!m) return;
    const w = m[0], pre = before.slice(0, m.index);
    if(/[\p{N}@\/._-]$/u.test(pre)) return;
    let r = autoRep(w) || w;
    if(r[0] !== r[0].toUpperCase()){
      const c = /(\p{L}*)[.!?…]\s+$/u.exec(pre);
      if(c && c[1].length > 1 && !AUTO_ABBR.has(c[1].toLowerCase())) r = r[0].toUpperCase() + r.slice(1);
    }
    if(r === w) return;
    const rr = document.createRange(); rr.setStart(n, m.index); rr.setEnd(n, off);
    s.removeAllRanges(); s.addRange(rr);
    document.execCommand('insertText', false, r + e.data);
  });
  $('revSpell').addEventListener('change', liveStart);
  $('revGram').checked = lvGramOn;
  $('revGram').addEventListener('change', e=>{ lvGramOn = e.target.checked; try{ localStorage.setItem(LS_KEYS.gram, lvGramOn ? '1' : '0'); }catch(_){} if(liveOn) liveSoon(true); });
  $('proofIc').addEventListener('mousedown', e=>e.preventDefault());
  $('proofIc').addEventListener('click', lvNext);
  $('proofIc').addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); lvNext(); } });
  $('revLang').addEventListener('change', ()=>{ spOk.clear(); liveStart(); });
  new MutationObserver(recs=>{
    if(!liveOn) return;
    for(const r of recs){
      if(!(r.type === 'childList' && r.target === page)) lvDirty.add(lvBlock(r.target));
      r.addedNodes.forEach(n=>{
        if(n.nodeType === 1){ lvDirty.add(lvBlock(n)); n.querySelectorAll(LV_SEL).forEach(x=>lvDirty.add(x)); }
        else if(n.nodeType === 3) lvDirty.add(lvBlock(n));
      });
    }
    liveSoon();
  }).observe(page, {childList:true, subtree:true, characterData:true});
  document.addEventListener('selectionchange', ()=>{ if(liveOn) liveSoon(); });
  document.addEventListener('keydown', e=>{ if(e.key === 'F7'){ e.preventDefault(); $('btnRev').click(); } });
  // O dicionário carrega quando o navegador está ocioso e você não está digitando
  let lvLastKey = 0;
  page.addEventListener('keydown', ()=>{ lvLastKey = Date.now(); }, {passive:true});
  function liveBoot(){
    if(Date.now() - lvLastKey < 1200) return setTimeout(liveBoot, 800);
    if(window.requestIdleCallback) requestIdleCallback(()=>{ if(Date.now() - lvLastKey < 1200) setTimeout(liveBoot, 800); else liveStart(); }, {timeout:6000});
    else setTimeout(liveStart, 0);
  }
  setTimeout(liveBoot, 1500);

  // Sinônimos (base local "sinonimos-local", baixada só na primeira vez)
  let synDb = null;
  const SYN_URL = 'https://cdn.jsdelivr.net/npm/sinonimos-local@1.0.3/db/db_compiled.json';
  function synSing(w){ const l = w.length;
    if(w.endsWith('ns')) return w.slice(0, l - 2) + 'm'; if(w.endsWith('ões')) return w.slice(0, l - 3) + 'ão';
    if(w.endsWith('es')) return w.slice(0, l - 2); if(w.endsWith('eis')) return w.slice(0, l - 3) + 'il';
    if(w.endsWith('ais')) return w.slice(0, l - 3) + 'al'; if(w.endsWith('óis')) return w.slice(0, l - 3) + 'ol';
    if(w.endsWith('is')) return w.slice(0, l - 1) + 'l'; if(w.endsWith('s')) return w.slice(0, l - 1); return w; }
  function synMasc(w){ const l = w.length;
    if(w.endsWith('tra')) return w.slice(0, l - 1) + 'o'; if(w.endsWith('ra')) return w.slice(0, l - 1);
    if(w.endsWith('a')) return w.slice(0, l - 1) + 'o'; if(w.endsWith('as')) return w.slice(0, l - 2) + 'os'; return w; }
  function synLookup(db, word){
    const w = word.toLowerCase(), cand = [w, synMasc(w), synSing(w), synSing(synMasc(w))];
    for(const c of cand){ const i = db.palavras.indexOf(c); if(i >= 0) return db.sinonimos[i].map(k=>db.palavras[k]); }
    return [];
  }
  function wordRange(){
    const s = getSelection(); let r = (s.rangeCount && page.contains(s.anchorNode)) ? s.getRangeAt(0) : savedRange;
    if(!r) return null;
    if(!r.collapsed){ const t = r.toString().trim(); return /\s/.test(t) ? null : {range:r.cloneRange(), word:t}; }
    const n = r.startContainer; if(n.nodeType !== 3) return null;
    const t = n.data; let a = r.startOffset, b = a;
    while(a > 0 && /[\p{L}\p{M}-]/u.test(t[a - 1])) a--; while(b < t.length && /[\p{L}\p{M}-]/u.test(t[b])) b++;
    if(a === b) return null;
    const rr = document.createRange(); rr.setStart(n, a); rr.setEnd(n, b); return {range:rr, word:t.slice(a, b)};
  }
  async function openSyn(){
    const wr = wordRange();
    $('synList').innerHTML = ''; $('synDlg').showModal();
    if(!wr){ $('synWord').textContent = 'Selecione uma palavra (ou clique dentro dela) e tente de novo.'; return; }
    $('synWord').textContent = 'Procurando sinônimos de “' + wr.word + '”…';
    try{
      if(!synDb){ $('synWord').textContent = 'Baixando o dicionário de sinônimos (5 MB, só na primeira vez)…'; synDb = await (await fetch(SYN_URL)).json(); }
    }catch(e){ $('synWord').textContent = 'Não consegui baixar o dicionário de sinônimos. Conecte-se à internet e tente de novo.'; return; }
    const list = synLookup(synDb, wr.word);
    if(!list.length){ $('synWord').textContent = 'Sem sinônimos para “' + wr.word + '”.'; return; }
    $('synWord').textContent = 'Sinônimos de “' + wr.word + '” — clique para trocar:';
    list.forEach(w=>{
      const b = document.createElement('button'); b.textContent = w;
      b.addEventListener('click', ()=>{
        $('synDlg').close(); page.focus();
        const s = getSelection(); s.removeAllRanges(); s.addRange(wr.range);
        exec('insertText', matchCase(wr.word, w));
      });
      $('synList').appendChild(b);
    });
  }
  $('btnSyn').addEventListener('mousedown', e=>e.preventDefault());
  $('btnSyn').addEventListener('click', openSyn);
  $('synClose').addEventListener('click', ()=>$('synDlg').close());
  page.addEventListener('keydown', e=>{ if(e.shiftKey && e.key === 'F7'){ e.preventDefault(); openSyn(); } });

  // Redimensionar imagem: clique duplo
  page.addEventListener('dblclick', e=>{
    if(e.target.tagName !== 'IMG') return;
    const n = parseInt(prompt('Largura da imagem em % da página (10 a 100):', '50'), 10);
    if(n >= 10 && n <= 100){ e.target.style.width = n + '%'; e.target.style.height = 'auto'; changed(); }
  });

  // Localizar e substituir
  const fb = $('findbar'), fi = $('findIn'), ri = $('replIn'), fcase = $('fcase');
  let fIdx = -1;
  function openFind(){
    fb.hidden = false;
    const t = (savedRange ? savedRange.toString() : '');
    if(t && t.length < 80 && !/\n/.test(t)) fi.value = t;
    fi.focus(); fi.select();
  }
