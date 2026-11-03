/* Verbus — Imagens de fundo, comandos de formatação, tabelas (grade), caixa de texto e campos
   (js/edicao-base.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ---------- Imagens do cabeçalho/rodapé e de fundo: dados, tela, impressão e exportação ----------
  function hfImgs(){ const h = hfData(); return h.imgs || (h.imgs = []); }
  const hfImgList = ()=>{ const d = store.docs[store.current]; return (d && d.hf && d.hf.imgs) || []; };
  function hfLayers(){
    const B = document.getElementById('hfBack'), F = document.getElementById('hfFront'); if(!B || !F) return;
    const L = hfImgList(), seen = new Set();
    L.forEach(it=>{
      seen.add(it.id);
      let el = document.querySelector('.himg[data-id="' + it.id + '"]');
      if(!el){ el = document.createElement('img'); el.className = 'himg'; el.dataset.id = it.id; el.draggable = false; el.alt = it.alt || ''; }
      if(el.getAttribute('src') !== it.src) el.src = it.src;
      const host = it.z === 'front' ? F : B; if(el.parentNode !== host) host.appendChild(el);
      el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; el.style.width = it.w + 'px'; el.style.height = it.h + 'px';
      el.style.opacity = it.op ? String(1 - it.op / 100) : '';
    });
    document.querySelectorAll('.himg').forEach(el=>{ if(!seen.has(el.dataset.id)) el.remove(); });
    try{ pgClones(); }catch(e){}
    try{ window.__imgUpd && window.__imgUpd(); }catch(e){}
  }
  // camada de impressão: uma imagem do tamanho do papel, desenhada na caixa de margem (repete em todas as páginas, atrás do texto)
  let hfPK = '', hfPC = '';
  function hfPrintCss(pg, dif){
    const L = hfImgList(), e0 = effMar(), tx = hfSvgText('h', pg, e0) + hfSvgText('f', pg, e0); if(!L.length && !tx) return '';
    const key = pg.w + 'x' + pg.h + '|' + dif + '|' + tx + '|' + L.map(i=>[i.id, i.x, i.y, i.w, i.h, i.op || 0, i.z, i.src.length].join(',')).join(';');
    if(key === hfPK) return hfPC;
    const W = Math.round(pg.w * CMPX * 100) / 100, H = Math.round(pg.h * CMPX * 100) / 100, n = v=>Math.round(v * 100) / 100;
    const img = i=>'<image x="' + n(i.x) + '" y="' + n(i.y) + '" width="' + n(i.w) + '" height="' + n(i.h) + '" preserveAspectRatio="none"' + (i.op ? ' opacity="' + (1 - i.op / 100) + '"' : '') + ' xlink:href="' + i.src + '"/>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      L.filter(i=>i.z !== 'front').map(img).join('') + tx + L.filter(i=>i.z === 'front').map(img).join('') + '</svg>';
    hfPK = key;
    hfPC = '@top-left-corner{content:url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '");padding:0;margin:0;border:0;vertical-align:top;text-align:left;font-size:0;line-height:0;overflow:visible}';
    return hfPC;
  }
  // Listas cujo número vem de CSS (formato personalizado, 1.1 e biblioteca de vários níveis) viram parágrafos com o número escrito,
  // para o .docx/.doc/.html mostrarem exatamente o que aparece na tela (o Word não lê os contadores CSS).
  function flattenLists(c){
    const LV = {
      jur:[n=>'Art. ' + n + '. ', n=>'§ ' + n + 'º ', n=>toRoman(n).toUpperCase() + ' – ', n=>sample('lower-alpha', n) + ') '],
      out:[n=>sample('upper-roman', n) + '. ', n=>sample('upper-alpha', n) + '. ', n=>n + '. ', n=>sample('lower-alpha', n) + '. '],
      par:[n=>n + ') ', n=>sample('lower-alpha', n) + ') ', n=>sample('lower-roman', n) + ') ', n=>n + ') '],
      alf:[n=>n + '. ', n=>sample('lower-alpha', n) + '. ', n=>sample('lower-roman', n) + '. ', n=>n + '. '],
      bul:[()=>'● ', ()=>'○ ', ()=>'■ ', ()=>'– ']
    };
    const own = l=>[...l.classList].find(x=>/^(ml|mp-.+|nf-.+)$/.test(x)) || null;
    const cv = (l, k, d)=>{ const m = new RegExp('--' + k + ':\\s*"([^"]*)"').exec(l.getAttribute('style') || ''); return m ? m[1] : d; };
    const parse = (l, prev)=>{
      const k = own(l); if(!k) return prev;
      if(k === 'ml') return {mode:'ml'};
      if(k.startsWith('mp-')) return {mode:'mp', key:k.slice(3)};
      return {mode:'nf', type:k.slice(3), pre:cv(l, 'pre', ''), suf:cv(l, 'suf', '.')};
    };
    const tops = [...c.querySelectorAll('ol')].filter(l=>{
      if(!own(l)) return false;
      for(let a = l.parentNode; a && a !== c; a = a.parentNode) if(a.tagName === 'OL' && own(a)) return false;
      return true;
    });
    const conv = (list, ctx0, level, path, out)=>{
      const ctx = parse(list, ctx0), ol = list.tagName === 'OL';
      let n = ctx.mode === 'nf' && ol ? (parseInt(list.getAttribute('start'), 10) || 1) : 1;
      [...list.children].forEach(li=>{
        if(li.tagName !== 'LI') return;
        if(ctx.mode === 'nf' && li.hasAttribute('value')) n = parseInt(li.getAttribute('value'), 10) || n;
        const here = path.concat(n);
        let num;
        if(!ol) num = '• ';
        else if(ctx.mode === 'ml') num = here.join('.') + '. ';
        else if(ctx.mode === 'mp') num = (LV[ctx.key] || LV.alf)[Math.min(level, 3)](n);
        else num = ctx.pre + sample(ctx.type, n) + ctx.suf;
        const p = document.createElement('p'), st = li.getAttribute('style'), nested = [];
        if(st) p.setAttribute('style', st);
        [...li.childNodes].forEach(ch=>{ if(ch.nodeType === 1 && /^(OL|UL)$/.test(ch.tagName)) nested.push(ch); else p.appendChild(ch); });
        if(!p.firstChild) p.appendChild(document.createElement('br'));
        const sp = document.createElement('span'); sp.textContent = num.replace(/ $/, '\u00a0'); p.insertBefore(sp, p.firstChild);
        if(ctx.mode === 'nf'){
          p.style.marginLeft = (36 * (level + 1)) + 'px'; p.style.textIndent = '-24px';
          const tb = document.createElement('span'); tb.setAttribute('style', 'mso-tab-count:1'); tb.textContent = '    '; sp.after(tb);
        }else p.style.marginLeft = Math.round(level * 25.6 * 10) / 10 + 'px';
        out.push(p);
        nested.forEach(nl=>conv(nl, ctx, level + 1, here, out));
        n++;
      });
    };
    tops.forEach(top=>{
      const out = []; conv(top, {mode:'nf', type:'decimal', pre:'', suf:'.'}, 0, [], out);
      out.forEach(p=>top.parentNode.insertBefore(p, top)); top.remove();
    });
  }
  // Diagonais de célula (desenhadas com degradê na tela) também saem como borda diagonal do Word (mso-border-tl2br / tr2bl)
  function diagToMso(c){
    const hex = col=>{ const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(col); return m ? '#' + [m[1], m[2], m[3]].map(v=>(+v).toString(16).padStart(2, '0')).join('') : col; };
    c.querySelectorAll('td, th').forEach(b=>{
      const st = b.getAttribute('style') || '', re = /linear-gradient\(\s*to\s+(top right|right top|bottom right|right bottom)\s*,\s*transparent[^,]*,\s*(rgb\([^)]*\)|#[0-9a-fA-F]{3,8}|[a-zA-Z]+)\s*,\s*transparent/g;
      let m, add = '';
      while((m = re.exec(st))){
        const l = '.75pt solid ' + hex(m[2]);
        add += /top/.test(m[1]) ? ';mso-border-tl2br:' + l + ';mso-diagonal-down:' + l : ';mso-border-tr2bl:' + l + ';mso-diagonal-up:' + l;
      }
      if(add) b.setAttribute('style', st.replace(/;?\s*$/, '') + add);
    });
  }
  // HTML do corpo para exportar: imagens flutuantes viram posição absoluta de verdade e todas ganham largura/altura em px
  function bodyHtml(forDoc){
    const live = [...page.querySelectorAll('img')], c = page.cloneNode(true), cl = [...c.querySelectorAll('img')];
    c.querySelectorAll('[data-tabs]').forEach(b=>{
      const ts = (b.dataset.tabs || '').split(',').map(q=>{ const a = q.split(':'); return {x:parseFloat(a[0]), t:a[1], l:a[2]}; }).filter(o=>isFinite(o.x));
      if(!ts.length) return;
      const v = 'tab-stops:' + ts.map(o=>({c:'center ', r:'right ', d:'decimal '}[o.t] || '') + ({d:'dotted ', h:'dashed ', u:'lined '}[o.l] || '') + (Math.round(o.x * 28.35 * 10) / 10) + 'pt').join(' '), st = b.getAttribute('style') || '';
      b.setAttribute('style', st + (st && !/;\s*$/.test(st) ? ';' : '') + v);
    });
    c.querySelectorAll('.cf').forEach(f=>{   // campos de preenchimento: ficam como texto; os vazios viram uma linha para preencher à mão
      f.removeAttribute('contenteditable'); f.removeAttribute('role');
      if(f.hasAttribute('data-empty')) f.textContent = '____________________';
    });
    c.querySelectorAll('.tbx').forEach(b=>{   // caixa de texto: o Word entende melhor uma tabela de uma célula (a flutuante fica alinhada com o texto em volta)
      const st = b.style, fl = st.cssFloat || st.float, w = st.width || '100%';
      const t = document.createElement('table'), td = document.createElement('td');
      t.setAttribute('width', w); t.setAttribute('cellspacing', '0'); t.setAttribute('cellpadding', '0');
      if(fl === 'right' || fl === 'left') t.setAttribute('align', fl);
      t.setAttribute('style', 'border-collapse:collapse;width:' + w + ';margin:' + (st.margin || '6pt 0') + (fl ? ';mso-table-lspace:9pt;mso-table-rspace:9pt;mso-table-wrap:around' : ''));
      let tds = 'border:' + (st.border || 'none') + ';padding:' + (st.padding || '8px 10px') + ';vertical-align:top';
      if(st.borderLeft) tds += ';border-left:' + st.borderLeft;
      if(st.backgroundColor) tds += ';background:' + st.backgroundColor;
      td.setAttribute('style', tds);
      while(b.firstChild) td.appendChild(b.firstChild);
      const tr = document.createElement('tr'); tr.appendChild(td); const tb = document.createElement('tbody'); tb.appendChild(tr); t.appendChild(tb);
      b.parentNode.replaceChild(t, b);
    });
    c.querySelectorAll('table, col, td, th').forEach(el=>{   // (.doc, .docx e .html) Word e LibreOffice respeitam melhor o atributo width do que só o CSS (senão as tabelas do modelo encolhem)
      const w = el.style && el.style.width; if(el.hasAttribute('width') || !w || !/^[\d.]+(px|%)$/.test(w)) return;
      el.setAttribute('width', w.replace('px', ''));
    });
    c.querySelectorAll('.pb').forEach(q=>{ const br = document.createElement('br'); br.setAttribute('clear', 'all'); br.setAttribute('style', 'page-break-before:always;mso-break-type:page-break'); q.replaceWith(br); });   // quebra de página (sem isso o ANEXO e outras quebras se perdiam no .doc/.docx/.html)
    c.querySelectorAll('.sbk').forEach(q=>{ if(q.dataset.t === 'cont'){ q.remove(); return; } const br = document.createElement('br'); br.setAttribute('clear', 'all'); br.setAttribute('style', 'page-break-before:always;mso-break-type:page-break'); q.replaceWith(br); });   // seção: no .doc/.docx vira quebra de página
    c.querySelectorAll('.colb').forEach(q=>{ const br = document.createElement('br'); br.setAttribute('clear', 'all'); br.setAttribute('style', 'mso-break-type:column-break'); q.replaceWith(br); });
    c.querySelectorAll('span.cit').forEach(f=>{ f.removeAttribute('contenteditable'); f.removeAttribute('data-ref'); f.removeAttribute('data-narr'); f.removeAttribute('data-pg'); f.removeAttribute('class'); });
    flattenLists(c); diagToMso(c);
    c.querySelectorAll('.tb').forEach(t=>{ t.setAttribute('style', 'mso-tab-count:1'); t.textContent = '    '; });   // tabulação: o Word lê mso-tab-count como uma parada de tabulação
    cl.forEach((im, i)=>{
      const lv = live[i]; if(!lv) return;
      const w = lv.offsetWidth, h = lv.offsetHeight;
      if(w > 0 && h > 0){ im.setAttribute('width', w); im.setAttribute('height', h); im.style.width = w + 'px'; im.style.height = h + 'px'; }
      const wr = im.getAttribute('data-wrap');
      if(wr === 'behind' || wr === 'front'){
        const x = parseFloat(lv.style.getPropertyValue('--x')) || 0, y = parseFloat(lv.style.getPropertyValue('--y')) || 0;
        const sp = document.createElement('span');
        sp.setAttribute('style', 'mso-ignore:vglayout;position:absolute;z-index:' + (wr === 'behind' ? '-251658240' : '251658240') + ';mso-position-horizontal-relative:page;mso-position-vertical-relative:page;margin-left:' + x + 'px;margin-top:' + y + 'px;width:' + w + 'px;height:' + h + 'px');
        im.style.cssText = 'width:' + w + 'px;height:' + h + 'px' + (im.style.opacity ? ';opacity:' + im.style.opacity : '');
        im.parentNode.insertBefore(sp, im); sp.appendChild(im);
      }
    });
    c.querySelectorAll('[data-lh],[data-nivel]').forEach(n=>{
      let x = (n.getAttribute('style') || '').replace(/;?\s*$/, '');
      if(n.dataset.lh) x += ';mso-line-height-rule:' + (n.dataset.lh === 'min' ? 'at-least' : 'exactly');
      if(n.dataset.nivel && n.dataset.nivel !== '0') x += ';mso-outline-level:' + n.dataset.nivel;
      n.setAttribute('style', x.replace(/^;/, ''));
    });
    return c.innerHTML;
  }
  function hfImgsDoc(){
    return hfImgList().map(i=>{
      const st = 'mso-ignore:vglayout;position:absolute;z-index:' + (i.z === 'front' ? '251658240' : '-251658240') + ';mso-position-horizontal-relative:page;mso-position-vertical-relative:page;margin-left:' + Math.round(i.x) + 'px;margin-top:' + Math.round(i.y) + 'px;width:' + Math.round(i.w) + 'px;height:' + Math.round(i.h) + 'px';
      return '<span style=\'' + st + '\'><img width="' + Math.round(i.w) + '" height="' + Math.round(i.h) + '" src="' + i.src + '"></span>';
    }).join('');
  }
  function loadImg(src){ return new Promise((ok, no)=>{ const im = new Image(); im.onload = ()=>ok(im); im.onerror = no; im.src = src; }); }
  async function imgBytes(src){
    const m = /^data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+\/=]+)$/i.exec(src);
    let ext, b64;
    if(m){ ext = m[1].toLowerCase() === 'jpg' ? 'jpeg' : m[1].toLowerCase(); b64 = m[2]; }
    else{
      const im = await loadImg(src), cv = document.createElement('canvas'); cv.width = im.naturalWidth || 1; cv.height = im.naturalHeight || 1;
      cv.getContext('2d').drawImage(im, 0, 0); ext = 'png'; b64 = cv.toDataURL('image/png').split(',')[1];
    }
    const bin = atob(b64), u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return {ext, data:u};
  }
  // DrawingML: imagem ancorada na página (atrás ou na frente do texto), repetida em toda página pelo cabeçalho
  function anchorXml(it, rid, n){
    const E = v=>Math.round(v * 9525), cx = E(it.w), cy = E(it.h);
    const alpha = it.op ? '<a:alphaModFix amt="' + Math.round((100 - it.op) * 1000) + '"/>' : '';
    const descr = it.alt ? ' descr="' + String(it.alt).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;') + '"' : '';
    return '<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="' + (it.z === 'front' ? 251659264 + n : 1024 + n) + '" behindDoc="' + (it.z === 'front' ? 0 : 1) + '" locked="0" layoutInCell="1" allowOverlap="1">' +
      '<wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>' + E(it.x) + '</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>' + E(it.y) + '</wp:posOffset></wp:positionV>' +
      '<wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="' + (900 + n) + '" name="Imagem ' + (n + 1) + '"' + descr + '/><wp:cNvGraphicFramePr/>' +
      '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<pic:nvPicPr><pic:cNvPr id="' + (900 + n) + '" name="verba' + n + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + rid + '">' + alpha + '</a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>';
  }
  function setMar(k, v){
    const d = store.docs[store.current]; if(!d) return;
    (d.mar = d.mar || {})[k] = Math.round(v * 100) / 100; applyMar();
  }
  function resetMar(k){
    const d = store.docs[store.current]; if(!d || !d.mar) return;
    delete d.mar[k]; if(!Object.keys(d.mar).length) delete d.mar; applyMar(); persist();
  }
  function changed(){
    try{ fnRenumber(); }catch(e){}
    try{ enRenumber(); }catch(e){}
    updateCountSoon();
    try{ fileTouch(); }catch(e){}
    clearTimeout(saveTimer);
    saveTimer = setTimeout(()=>{
      const go = ()=>{ save(); if(!$('side').hidden) renderSide(); };   // salvar serializa o HTML todo (imagens inclusas): faz no tempo ocioso
      if(window.requestIdleCallback) requestIdleCallback(go, {timeout:2500}); else go();
    }, 600);
  }
  function updateCount(){
    try{ hfRender(); }catch(e){}
    try{ lnRender(); }catch(e){}
    try{ pgMarks(); }catch(e){}
    try{ window.__imgUpd && window.__imgUpd(); }catch(e){}
    const st = wordStats();
    document.getElementById('count').textContent = st.w + ' palavras';
    document.getElementById('chars').textContent = st.c + ' caracteres · leitura ~' + Math.max(st.w ? 1 : 0, Math.round(st.w / 200)) + ' min' + pagesTxt();
  }
  // Palavras e caracteres sem page.innerText (que força um novo layout da folha a cada chamada): percorre só os nós de texto
  function wordStats(){
    const WC_BLK = 'p,li,h1,h2,h3,h4,h5,h6,td,th,tr,blockquote,pre,div';
    const WC_FILTER = {acceptNode(n){
      if(n.nodeType === 3) return 1;
      if(n.hasAttribute('data-hid') || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return 2;   // oculto: pula o ramo todo
      return n.tagName === 'BR' ? 1 : 3;
    }};
    let w = 0, c = 0, inW = false, prev = null, lastP = null;
    const tw = document.createTreeWalker(page, 5, WC_FILTER);   // 5 = SHOW_ELEMENT | SHOW_TEXT
    for(let n; (n = tw.nextNode());){
      if(n.nodeType === 1){ inW = false; if(c) c++; continue; }   // <br>: nova linha
      const p = n.parentNode;
      if(p !== lastP){
        lastP = p;
        const b = p.closest ? p.closest(WC_BLK) : null;
        if(b !== prev){ prev = b; inW = false; if(c) c++; }
      }
      const t = n.data; if(!t) continue;
      if(!/[^\s\u200b]/.test(t)){ if(inW) c++; inW = false; continue; }   // só espaço: separa palavras
      c += t.replace(/\s+/g, ' ').length;
      let first = true;
      for(const m of t.matchAll(/[^\s\u200b]+/g)){ if(!(first && m.index === 0 && inW)) w++; first = false; }
      inW = /[^\s\u200b]$/.test(t);
    }
    return {w, c};
  }
  var ucT = 0;
  function updateCountSoon(){ clearTimeout(ucT); ucT = setTimeout(updateCount, 350); }   // cabeçalho/rodapé, paginação, contagem: só depois que a digitação dá uma pausa

  // ---------- Comandos de formatação ----------
  // ---------- Desfazer/refazer das operações em tabelas (mover, redimensionar, inserir linha/coluna, estilos): o desfazer nativo não enxerga mudanças feitas direto no DOM ----------
  const TH = {u:[], r:[], n:0};
  page.addEventListener('beforeinput', ()=>{ TH.n++; });
  const tSnap = ()=>page.innerHTML;
  function tCommit(before){
    if(before == null || page.innerHTML === before) return;
    TH.u.push({h:before, n:TH.n}); if(TH.u.length > 30) TH.u.shift(); TH.r = [];
  }
  function tSwap(from, to){
    const top = from[from.length - 1]; if(!top || top.n !== TH.n) return false;
    from.pop(); to.push({h:page.innerHTML, n:TH.n});
    page.innerHTML = top.h; changed();
    try{ page.focus(); }catch(e){}
    return true;
  }
  const tUndo = ()=>tSwap(TH.u, TH.r), tRedo = ()=>tSwap(TH.r, TH.u);
  page.addEventListener('keydown', e=>{
    if(!(e.ctrlKey || e.metaKey) || e.altKey) return; const k = e.key.toLowerCase();
    if((k === 'z' && !e.shiftKey && tUndo()) || ((k === 'y' || (k === 'z' && e.shiftKey)) && tRedo())) e.preventDefault();
  }, true);
  function exec(cmd, val){
    if((cmd === 'undo' && tUndo()) || (cmd === 'redo' && tRedo())) return;
    page.focus();
    document.execCommand('styleWithCSS', false, false);
    document.execCommand(cmd, false, val || null);
    refresh(); changed();
  }
  document.querySelectorAll('[data-cmd]').forEach(b=>{
    b.addEventListener('mousedown', e=>e.preventDefault());
    b.addEventListener('click', ()=>exec(b.dataset.cmd));
  });
  document.getElementById('block').addEventListener('change', e=>{
    blockChange(e.target.value);
  });
  document.getElementById('font').addEventListener('change', e=>{ restore(); if(typingSet({ff:e.target.value})) return; exec('fontName', e.target.value); });
  document.getElementById('fore').addEventListener('input', e=>exec('foreColor', e.target.value));
  document.getElementById('back').addEventListener('input', e=>exec('hiliteColor', e.target.value));

  // Guarda a seleção para usar depois de diálogos (prompt, seletor de arquivo)
  let savedRange = null;
  document.addEventListener('selectionchange', ()=>{
    const s = getSelection();
    if(s.rangeCount && page.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange();
    refreshSoon();
  });
  // prompt() tira o foco da folha e pode deixar a seleção no início do documento: guarda o intervalo de antes e devolve ao fechar,
  // para que o que for inserido depois do diálogo (nota de rodapé, link, legenda…) caia onde estava o cursor
  (function(){
    const nativo = window.prompt.bind(window);
    window.prompt = function(){
      const s = getSelection(), vivo = s.rangeCount && page.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null;
      const antes = vivo || (savedRange ? savedRange.cloneRange() : null);
      try{ return nativo.apply(window, arguments); }
      finally{
        if(antes) savedRange = antes;
        if(vivo && document.activeElement === page){ s.removeAllRanges(); s.addRange(vivo); }
      }
    };
  })();
  function restore(){
    // com a folha já em foco, a seleção atual é a verdadeira: savedRange só é atualizado de forma assíncrona (selectionchange)
    // e logo depois de mover o cursor (Ctrl+End, setas) ainda guarda a posição antiga
    const s = getSelection();
    if(document.activeElement === page && s.rangeCount && page.contains(s.anchorNode)) return;
    page.focus();
    if(savedRange){ s.removeAllRanges(); s.addRange(savedRange); }
  }

  // (a leitura do arquivo e a colocação da imagem ficam no módulo "Imagens", mais abaixo)

  // ---------- Tabela: seletor em grade (como no Word) + "Inserir Tabela…" ----------
  // Insere o HTML de uma tabela marcada com data-new, aplica o estilo escolhido (se houver) e tira a marca
  function insertTableHtml(h, style, opts){
    restore(); exec('insertHTML', h);
    const t = page.querySelector('table[data-new]');
    if(!t) return;
    t.removeAttribute('data-new');
    if(style && window.__tsApply) window.__tsApply(t, style, new Set(opts || ['h', 'r']));
    changed();
    return t;
  }
  function insertTable(rows, cols, style){
    if(!(rows > 0 && cols > 0)) return;
    let h = '<table data-new="1"><tbody>';
    for(let r=0;r<rows;r++){ h += '<tr>' + '<td><br></td>'.repeat(cols) + '</tr>'; }
    h += '</tbody></table><p><br></p>';
    return insertTableHtml(h, style);
  }
  (function(){
    const btn = document.getElementById('btnTable'), GC = 10, GR = 8;
    let pop = null;
    const STY = [['', 'Padrão'], ['grade', 'Grade de Tabela'], ['clara', 'Grade Clara'], ['azul', 'Azul'], ['verde', 'Verde'], ['laranja', 'Laranja'], ['cinza', 'Cinza Escuro'], ['linhas', 'Só linhas horizontais'], ['tiras', 'Sem bordas, em tiras'], ['tres', 'Três linhas (ABNT)']];
    ['tblStyle', 't2tStyle'].forEach(id=>{ const sl = document.getElementById(id); if(sl) STY.forEach(([v, n])=>sl.add(new Option(n, v))); });
    const e2 = x=>String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const tdOf = (v, st)=>'<td' + (st ? ' style="' + st + '"' : '') + '>' + (v === '' ? '<br>' : e2(v)) + '</td>';
    const grid = (rows, first)=>'<table data-new="1"><tbody>' + rows.map((r, i)=>'<tr>' + r.map((v, j)=>tdOf(v, i === 0 && first ? first[j] : '')).join('') + '</tr>').join('') + '</tbody></table><p><br></p>';
    const vazio = (n, c)=>Array.from({length:n}, ()=>Array(c).fill(''));
    // Tabelas Rápidas: modelos prontos para formulários e quadros do dia a dia
    const QT = [
      {n:'Identificação (Nome, Nascimento, CPF…)', st:'grade', o:['fc'], h:()=>grid([['Nome', ''], ['Data de nascimento', ''], ['CPF', ''], ['Endereço', ''], ['Telefone', '']], ['width:35%', 'width:65%'])},
      {n:'Lista de presença', st:'grade', o:['h'], h:()=>grid([['Nome', 'Documento', 'Assinatura']].concat(vazio(8, 3)), ['width:40%', 'width:25%', 'width:35%'])},
      {n:'Cronograma de atividades', st:'azul', o:['h', 'r'], h:()=>grid([['Atividade', 'Responsável', 'Prazo', 'Situação']].concat(vazio(5, 4)))},
      {n:'Quadro com título', st:'grade', o:['h'], h:()=>'<table data-new="1"><tbody><tr><td>Título</td></tr><tr><td style="height:120px"><br></td></tr></tbody></table><p><br></p>'},
      {n:'Assinaturas (2 colunas)', st:'', o:[], h:()=>'<table data-new="1" style="border:none"><tbody><tr>' + ['Técnico de Referência', 'Responsável'].map(t=>'<td style="border:none;text-align:center;padding-top:36px;width:50%">__________________________<br>' + t + '</td>').join('') + '</tr></tbody></table><p><br></p>'}
    ];
    function close(){ if(pop){ pop.remove(); pop = null; } btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); }
    function outside(e){ if(pop && !pop.contains(e.target) && !btn.contains(e.target)) close(); }
    function esc(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    function open(){
      pop = document.createElement('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
      const lab = document.createElement('div'); lab.className = 'tl'; lab.textContent = 'Inserir Tabela'; pop.appendChild(lab);
      const g = document.createElement('div'); g.className = 'tg'; pop.appendChild(g);
      const cells = [];
      for(let r=1;r<=GR;r++) for(let c=1;c<=GC;c++){ const i = document.createElement('i'); i.dataset.r = r; i.dataset.c = c; g.appendChild(i); cells.push(i); }
      function mark(r, c){
        cells.forEach(i=>i.classList.toggle('on', +i.dataset.r <= r && +i.dataset.c <= c));
        lab.textContent = r && c ? c + ' × ' + r + ' Tabela' : 'Inserir Tabela';
      }
      g.addEventListener('mouseover', e=>{ const i = e.target.closest('i'); if(i) mark(+i.dataset.r, +i.dataset.c); });
      g.addEventListener('mouseleave', ()=>mark(0, 0));
      g.addEventListener('click', e=>{ const i = e.target.closest('i'); if(!i) return; const r = +i.dataset.r, c = +i.dataset.c; close(); insertTable(r, c); });
      pop.appendChild(document.createElement('hr'));
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = 'Inserir Tabela…';
      b.addEventListener('click', ()=>{ close(); document.getElementById('tblMsg').textContent = ''; document.getElementById('tblDlg').showModal(); document.getElementById('tblCols').select(); });
      pop.appendChild(b);
      const item = (txt, fn)=>{ const x = document.createElement('button'); x.type = 'button'; x.setAttribute('role', 'menuitem'); x.textContent = txt; x.addEventListener('click', ()=>{ close(); fn(); }); pop.appendChild(x); };
      pop.appendChild(document.createElement('hr'));
      item('Converter Texto em Tabela…', ()=>{
        restore(); const t = getSelection().toString();
        if(!t.trim()){ alert('Selecione o texto que você quer transformar em tabela (uma linha de texto por linha da tabela).'); return; }
        const d = document.getElementById('t2tDlg'); d._txt = t; document.getElementById('t2tMsg').textContent = ''; d.showModal();
      });
      item('Converter Tabela em Texto', ()=>window.__tblToText());
      pop.appendChild(document.createElement('hr'));
      const ql = document.createElement('div'); ql.className = 'tl'; ql.textContent = 'Tabelas Rápidas'; pop.appendChild(ql);
      QT.forEach(q=>item(q.n, ()=>insertTableHtml(q.h(), q.st, q.o)));
      pop.style.maxHeight = '70vh'; pop.style.overflowY = 'auto';
      pop.addEventListener('mousedown', e=>e.preventDefault());
      document.body.appendChild(pop);
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.max(4, Math.min(r.left, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = r.bottom + 2 + 'px';
      btn.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
    }
    btn.addEventListener('mousedown', e=>e.preventDefault());
    btn.addEventListener('click', ()=>{ if(pop) close(); else open(); });
    const dlg = document.getElementById('tblDlg');
    function ok(){
      const c = parseInt(document.getElementById('tblCols').value, 10), r = parseInt(document.getElementById('tblRows').value, 10);
      if(!(c >= 1 && c <= 30 && r >= 1 && r <= 200)){ document.getElementById('tblMsg').textContent = 'Use de 1 a 30 colunas e de 1 a 200 linhas.'; return; }
      dlg.close(); insertTable(r, c, document.getElementById('tblStyle').value);
    }
    document.getElementById('tblOk').addEventListener('click', ok);
    document.getElementById('tblCancel').addEventListener('click', ()=>dlg.close());
    dlg.addEventListener('keydown', e=>{ if(e.key === 'Enter' && e.target.tagName === 'INPUT'){ e.preventDefault(); ok(); } });
    // Converter texto em tabela
    const d2 = document.getElementById('t2tDlg');
    document.getElementById('t2tCancel').addEventListener('click', ()=>d2.close());
    document.getElementById('t2tOk').addEventListener('click', ()=>{
      const k = document.getElementById('t2tSep').value;
      const sep = k === 'tab' ? '\t' : k === 'other' ? document.getElementById('t2tOther').value : k;
      if(!sep){ document.getElementById('t2tMsg').textContent = 'Digite o separador.'; return; }
      const lines = (d2._txt || '').split(/\r?\n/).map(l=>l.replace(/\u00a0/g, ' ')).filter(l=>l.trim() !== '');
      if(!lines.length){ document.getElementById('t2tMsg').textContent = 'Não há texto para converter.'; return; }
      const rows = lines.map(l=>l.split(sep).map(x=>x.trim())), n = Math.max(...rows.map(r=>r.length));
      rows.forEach(r=>{ while(r.length < n) r.push(''); });
      d2.close(); insertTableHtml(grid(rows), document.getElementById('t2tStyle').value, ['h', 'r']);
    });
  })();

  // ---------- Caixa de texto (guia Inserir): quadro com borda, sombreado, barra lateral e flutuante ----------
  (function(){
    const btn = document.getElementById('btnTbx'); if(!btn) return;
    const BASE = 'padding:8px 10px;margin:.6em 0;';
    const TIPOS = {
      simples: {n:'Caixa simples', st:BASE + 'border:1px solid #000000'},
      sombreada: {n:'Caixa sombreada', st:BASE + 'border:1px solid #8aa0b8;background-color:#eef3fb'},
      destaque: {n:'Destaque (barra à esquerda)', st:BASE + 'border:0;border-left:4px solid #2b79c9;background-color:#f3f6fa'},
      aviso: {n:'Aviso', st:BASE + 'border:1px solid #c9a227;background-color:#fff8dc'},
      dir: {n:'Barra lateral à direita', st:'padding:8px 10px;margin:.2em 0 .4em .9em;float:right;width:38%;border:1px solid #8aa0b8;background-color:#eef3fb;font-size:.9em'},
      esq: {n:'Barra lateral à esquerda', st:'padding:8px 10px;margin:.2em .9em .4em 0;float:left;width:38%;border:1px solid #8aa0b8;background-color:#eef3fb;font-size:.9em'},
      centro: {n:'Caixa centralizada (60%)', st:'padding:8px 10px;margin:.6em auto;width:60%;border:1px solid #000000'}
    };
    let pop = null;
    function close(){ if(pop){ pop.remove(); pop = null; } btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); }
    function outside(e){ if(pop && !pop.contains(e.target) && !btn.contains(e.target)) close(); }
    function esc(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    function showPop(items, x, y){
      close(); pop = document.createElement('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
      items.forEach(it=>{
        if(it === '-'){ pop.appendChild(document.createElement('hr')); return; }
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = it[0];
        if(it[2]){ b.disabled = true; b.style.opacity = '.5'; }
        else b.addEventListener('click', ()=>{ close(); it[1](); });
        pop.appendChild(b);
      });
      pop.addEventListener('mousedown', e=>e.preventDefault());
      document.body.appendChild(pop);
      pop.style.left = Math.max(4, Math.min(x, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.max(4, Math.min(y, innerHeight - pop.offsetHeight - 4)) + 'px';
      document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
    }
    function boxAtCursor(){
      const s = getSelection(); let n = s.rangeCount ? s.anchorNode : null;
      if(!n || !page.contains(n)){ n = savedRange && savedRange.startContainer; }
      const el = n && (n.nodeType === 1 ? n : n.parentElement), b = el && el.closest && el.closest('.tbx');
      return b && page.contains(b) ? b : null;
    }
    function selHtml(){
      const s = getSelection();
      let r = s.rangeCount && page.contains(s.anchorNode) && !s.isCollapsed ? s.getRangeAt(0) : (savedRange && !savedRange.collapsed ? savedRange : null);
      if(!r) return '';
      const d = document.createElement('div'); d.appendChild(r.cloneContents());
      if(!d.textContent.trim() && !d.querySelector('img,table')) return '';
      if(!d.querySelector('p,h1,h2,h3,li,table,blockquote,div')) d.innerHTML = '<p>' + d.innerHTML + '</p>';
      return d.innerHTML;
    }
    function inserir(k){
      const t = TIPOS[k]; if(!t) return;
      restore();
      if(boxAtCursor()){ alert('O cursor já está dentro de uma caixa. Clique fora dela para inserir outra.'); return; }
      const sel = selHtml();
      const h = '<p><br></p><div class="tbx" data-new="1" data-tbx="' + k + '" style="' + t.st + '">' + (sel || '<p>Digite o texto da caixa aqui.</p>') + '</div><p><br></p>';
      exec('insertHTML', h);
      const b = page.querySelector('.tbx[data-new]');
      if(b){
        b.removeAttribute('data-new');
        if(!sel){ const r = document.createRange(), p = b.querySelector('p') || b; r.selectNodeContents(p); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        changed();
      }
    }
    function alterar(fn){ const b = boxAtCursor(); if(!b) return; fn(b); changed(); }
    function remover(){
      alterar(b=>{
        const pr = b.parentNode, fl = document.createDocumentFragment();
        while(b.firstChild) fl.appendChild(b.firstChild);
        pr.insertBefore(fl, b); b.remove();
      });
    }
    function contorno(){
      alterar(b=>{
        const sem = /^(0|none)/.test(b.style.borderTopWidth ? b.style.borderTopWidth : '') || b.style.borderTopStyle === 'none';
        if(sem) b.style.border = '1px solid #000000'; else { b.style.border = '0'; b.style.borderLeft = ''; }
      });
    }
    function fundo(){
      alterar(b=>{ b.style.backgroundColor = b.style.backgroundColor ? '' : '#eef3fb'; });
    }
    function largura(){
      const b = boxAtCursor(); if(!b) return;
      const v = prompt('Largura da caixa em % da página (10 a 100):', parseInt(b.style.width) || 100);
      const n = v === null ? NaN : parseInt(v);
      if(!(n >= 10 && n <= 100)) return;
      b.style.width = n + '%'; changed();
    }
    btn.addEventListener('mousedown', e=>e.preventDefault());
    btn.addEventListener('click', ()=>{
      if(pop){ close(); return; }
      const r = btn.getBoundingClientRect(), dentro = !!boxAtCursor();
      const items = Object.keys(TIPOS).map(k=>[TIPOS[k].n, ()=>inserir(k)]);
      items.push('-', ['Largura da caixa…', largura, !dentro], ['Ligar/desligar contorno', contorno, !dentro], ['Ligar/desligar fundo', fundo, !dentro], ['Remover caixa (mantém o texto)', remover, !dentro]);
      showPop(items, r.left, r.bottom + 2);
      btn.setAttribute('aria-expanded', 'true');
    });
  })();

  // ---------- Campos de preenchimento: caixa de seleção, texto, data e lista suspensa ----------
  (function(){
    const btn = document.getElementById('btnCampos'); if(!btn) return;
    const PH = {txt:'Clique aqui para digitar', date:'Escolha a data', sel:'Escolha um item'};
    const e3 = s=>String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const HT = {
      chk:()=>'<span class="cf cf-chk" data-cf="chk" contenteditable="false" role="checkbox" aria-checked="false">☐</span>&nbsp;',
      txt:()=>'<span class="cf cf-txt" data-cf="txt" data-empty="1">' + PH.txt + '</span>&nbsp;',
      date:()=>'<span class="cf cf-date" data-cf="date" data-empty="1" contenteditable="false" role="button">' + PH.date + '</span>&nbsp;',
      sel:o=>'<span class="cf cf-sel" data-cf="sel" data-empty="1" data-opts="' + e3(o.join('|')) + '" contenteditable="false" role="button">' + PH.sel + '</span>&nbsp;'
    };
    const dataLonga = d=>dataLongaBR(d);
    let pop = null;
    function close(){ if(pop){ pop.remove(); pop = null; } btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true); }
    function outside(e){ if(pop && !pop.contains(e.target) && !btn.contains(e.target)) close(); }
    function esc(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    function showPop(items, x, y){
      close(); pop = document.createElement('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
      items.forEach(it=>{
        if(it === '-'){ pop.appendChild(document.createElement('hr')); return; }
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = it[0];
        b.addEventListener('click', ()=>{ close(); it[1](); }); pop.appendChild(b);
      });
      pop.style.maxHeight = '60vh'; pop.style.overflowY = 'auto';
      pop.addEventListener('mousedown', e=>e.preventDefault());
      document.body.appendChild(pop);
      pop.style.left = Math.max(4, Math.min(x, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.max(4, Math.min(y, innerHeight - pop.offsetHeight - 4)) + 'px';
      document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
    }
    const put = h=>{ restore(); exec('insertHTML', h); changed(); };
    function setVal(f, v){
      if(v === ''){ f.textContent = PH[f.dataset.cf]; f.setAttribute('data-empty', '1'); }
      else{ f.textContent = v; f.removeAttribute('data-empty'); }
      changed();
    }
    function pickDate(f){
      document.querySelectorAll('input.cfTmp').forEach(x=>x.remove());
      const r = f.getBoundingClientRect(), i = document.createElement('input'); i.type = 'date'; i.className = 'cfTmp';
      i.style.cssText = 'position:fixed;opacity:0;width:1px;height:1px;left:' + r.left + 'px;top:' + r.bottom + 'px';
      document.body.appendChild(i);
      i.addEventListener('change', ()=>{
        if(i.value){ const [y, m, d] = i.value.split('-').map(Number); setVal(f, dataLonga(new Date(y, m - 1, d))); }
        i.remove();
      });
      try{ i.focus(); i.showPicker(); }
      catch(e){
        i.remove(); const v = prompt('Data (dd/mm/aaaa):', ''), m = v && /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v.trim());
        if(m) setVal(f, dataLonga(new Date(+m[3], +m[2] - 1, +m[1])));
      }
    }
    function pickSel(f){
      const r = f.getBoundingClientRect(), o = (f.dataset.opts || '').split('|').filter(Boolean);
      showPop(o.map(t=>[t, ()=>setVal(f, t)]).concat(['-', ['Limpar', ()=>setVal(f, '')]]), r.left, r.bottom + 2);
    }
    function activate(f){
      const k = f.dataset.cf;
      if(k === 'chk'){ const on = f.textContent.trim() !== '☒'; f.textContent = on ? '☒' : '☐'; f.setAttribute('aria-checked', on ? 'true' : 'false'); changed(); }
      else if(k === 'date') pickDate(f);
      else if(k === 'sel') pickSel(f);
    }
    function selectNode(f){
      const r = document.createRange(), s = getSelection();
      if(f.dataset.cf === 'txt') r.selectNodeContents(f); else r.selectNode(f);
      s.removeAllRanges(); s.addRange(r);
    }
    function limpar(){
      page.querySelectorAll('.cf').forEach(f=>{
        if(f.dataset.cf === 'chk'){ f.textContent = '☐'; f.setAttribute('aria-checked', 'false'); }
        else{ f.textContent = PH[f.dataset.cf] || ''; f.setAttribute('data-empty', '1'); }
      });
      changed();
    }
    btn.addEventListener('mousedown', e=>e.preventDefault());
    btn.addEventListener('click', ()=>{
      if(pop){ close(); return; }
      const r = btn.getBoundingClientRect();
      showPop([
        ['☐  Caixa de seleção', ()=>put(HT.chk())],
        ['Campo de texto', ()=>put(HT.txt())],
        ['Data (calendário)', ()=>put(HT.date())],
        ['Lista suspensa…', ()=>{
          const t = prompt('Itens da lista, separados por ponto e vírgula:', 'Sim; Não');
          const o = (t || '').split(';').map(x=>x.trim().replace(/\|/g, '')).filter(Boolean);
          if(o.length) put(HT.sel(o));
        }],
        '-',
        ['Limpar todos os campos', limpar]
      ], r.left, r.bottom + 2);
      btn.setAttribute('aria-expanded', 'true');
    });
    // clicar no campo: caixa marca/desmarca, data abre o calendário, lista abre as opções, texto seleciona o aviso
    page.addEventListener('click', e=>{
      const f = e.target.closest && e.target.closest('.cf'); if(!f || !page.contains(f)) return;
      if(f.dataset.cf === 'txt'){ if(f.hasAttribute('data-empty')) selectNode(f); return; }
      e.preventDefault(); activate(f);
    });
    // campo de texto: o aviso some ao digitar e volta se o campo ficar vazio
    page.addEventListener('input', ()=>{
      const el = selEl(), f = el && el.closest && el.closest('.cf-txt'); if(!f) return;
      if(!f.textContent.length){ f.textContent = PH.txt; f.setAttribute('data-empty', '1'); selectNode(f); }
      else if(f.hasAttribute('data-empty') && f.textContent !== PH.txt) f.removeAttribute('data-empty');
    });
    // Tab / Shift+Tab pulam de campo em campo (a partir de um campo); Espaço ou Enter acionam o campo selecionado
    function selField(){
      const s = getSelection(); if(!s.rangeCount) return null; const r = s.getRangeAt(0);
      if(r.startContainer === r.endContainer && r.endOffset - r.startOffset === 1){
        const n = r.startContainer.childNodes[r.startOffset]; if(n && n.nodeType === 1 && n.classList.contains('cf')) return n;
      }
      const el = selEl(), f = el && el.closest && el.closest('.cf'); return f && page.contains(f) ? f : null;
    }
    page.addEventListener('keydown', e=>{
      if(e.ctrlKey || e.altKey || e.metaKey) return;
      const f = selField(); if(!f) return;
      if(e.key === 'Tab'){
        const all = [...page.querySelectorAll('.cf')], i = all.indexOf(f) + (e.shiftKey ? -1 : 1);
        if(i < 0 || i >= all.length) return;
        e.preventDefault(); e.stopImmediatePropagation(); selectNode(all[i]); all[i].scrollIntoView({block:'center'});
      }else if((e.key === ' ' || e.key === 'Enter') && f.getAttribute('contenteditable') === 'false'){
        e.preventDefault(); e.stopImmediatePropagation(); activate(f);
      }
    });
  })();

  // Realça os botões ativos (negrito, itálico, etc.)
  var rfT = 0;
  function refreshSoon(){ clearTimeout(rfT); rfT = setTimeout(refresh, 80); }   // seleção/tecla/mouse disparam isso várias vezes: queryCommandState é caro
  function refresh(){
    clearTimeout(rfT);
    { const ae = document.activeElement;
      if(ae && ae.closest && ae.closest('dialog')) return; }   // foco dentro de um diálogo: não mexe nos botões da faixa
    document.querySelectorAll('[data-cmd]').forEach(b=>{
      let on = false;
      try{ on = document.queryCommandState(b.dataset.cmd); }catch(e){}
      b.classList.toggle('on', on);
    });
    try{
      const blk = (document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g,'');
      const sel = document.getElementById('block');
      sel.value = ['h1','h2','h3','blockquote'].includes(blk) ? blk : 'p';
    }catch(e){}
  }
