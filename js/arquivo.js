/* Verbus — Arquivo (novo/abrir/exportar) e funções extras
   (js/arquivo.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ---------- Arquivo: novo, abrir, exportar ----------
  // Modelos do CRAS: o nome do arquivo sai "<nome preenchido> - Relatório Informativo" / "<nome do adolescente/criança> - Encaminhamento"
  function autoName(){
    const d = store.docs[store.current], kind = d && d.kind; if(!kind) return '';
    const clean = t=>(t || '').replace(/[\u00a0\u200b\s]+/g, ' ').trim();
    let nome = '', tipo = '';
    if(kind === 'relatorio'){
      tipo = 'Relatório Informativo';
      const td = page.querySelector('table[data-sec] td'); nome = td ? clean(td.textContent).replace(/^Nome:\s*/i, '') : '';
    }else if(kind === 'estudo'){
      tipo = 'Estudo de Caso';
      const td = [...page.querySelectorAll('table td')].find(c=>/^\s*NOME:/i.test(c.textContent)); nome = td ? clean(td.textContent).replace(/^NOME:\s*/i, '') : '';
    }else if(kind === 'ficha'){
      tipo = 'Ficha de Inscrição Conviver';
      const td = [...page.querySelectorAll('table td')].find(c=>clean(c.textContent) === 'Nome'); nome = td && td.nextElementSibling ? clean(td.nextElementSibling.textContent) : '';
    }else if(kind === 'desligamento'){
      tipo = 'Termo de Desligamento';
      const td = [...page.querySelectorAll('table td')].find(c=>/^\s*Nome:/i.test(c.textContent)); nome = td ? clean(td.textContent).replace(/^Nome:\s*/i, '') : '';
    }else if(kind === 'encaminhamento'){
      tipo = 'Encaminhamento';
      const td = [...page.querySelectorAll('table td')].find(c=>/^\s*Nome do adolescente\/crian/i.test(c.textContent));
      nome = td ? clean(td.textContent).replace(/^Nome do adolescente\/crian[çc]a:\s*/i, '') : '';
    }
    return nome ? nome + ' - ' + tipo : '';
  }
  function fileName(ext){
    const t = autoName() || title.value.trim() || 'documento';
    return t.replace(/[\\/:*?"<>|]+/g,'-') + ext;
  }
  // PDF pelo diálogo de impressão: o nome sugerido vem do título da aba
  (function(){
    let old = null;
    window.addEventListener('beforeprint', ()=>{ const n = window.__pdfNome || autoName() || title.value.trim(); if(n){ old = document.title; document.title = n; } });
    window.addEventListener('afterprint', ()=>{ window.__pdfNome = null; if(old != null){ document.title = old; old = null; } });
  })();
  // Limpa HTML vindo de fora (arquivo aberto, .docx convertido, texto colado): tira scripts, manipuladores on*, srcdoc e endereços
  // javascript:/vbscript:/data:text/html em qualquer atributo de endereço (href, src, xlink:href, action, formaction…)
  const URL_ATTR = /^(href|src|xlink:href|action|formaction|data|poster|background|srcset)$/i;
  const URL_PERIGO = /^(javascript|vbscript|data:text\/html)/i;
  function sanitizarHtml(root){
    root.querySelectorAll('script,iframe,object,embed,base,meta,link,applet').forEach(n=>n.remove());
    root.querySelectorAll('*').forEach(n=>[...n.attributes].forEach(a=>{
      const k = a.name.toLowerCase();
      if(k.startsWith('on') || k === 'srcdoc' || (URL_ATTR.test(k) && URL_PERIGO.test(a.value.replace(/[\x00-\x20\u00a0\u200b]+/g, '')))) n.removeAttribute(a.name);
    }));
    return root;
  }
  window.sanitizarHtml = sanitizarHtml;
  function hfLines(k, cls){
    const hh = hfData(), lines = [[]];
    hfRuns(hh[k]).forEach(t=>{
      if(t.br){ lines.push([]); return; }
      const css = hfRunCss(hfResolve(k, t.s)).replace(/"/g, '&quot;');
      const inner = t.f ? '<span style=\'mso-field-code:" ' + (t.f === 'pages' ? 'NUMPAGES' : 'PAGE') + ' "\'><span style="mso-no-proof:yes">1</span></span>' : t.t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
      lines[lines.length - 1].push('<span style="' + css + '">' + inner + '</span>');
    });
    const sy = hfStyle(k), css = 'margin:0;text-align:' + (hh[k + 'a'] || 'left') + ';font-family:"' + sy.ff + '";font-size:' + sy.fs + 'pt;line-height:1.2' + (sy.b ? ';font-weight:bold' : '') + (sy.i ? ';font-style:italic' : '') + (sy.u ? ';text-decoration:underline' : '') + (sy.c ? ';color:' + sy.c : '');
    return lines.map(l=>'<p class="' + cls + '" style=\'' + css + '\'>' + (l.join('') || '&nbsp;') + '</p>').join('');
  }
  function wrap(forDoc){
    const ab = page.classList.contains('abnt'), m = effMar();
    const hasHF = !!forDoc && (hfHas('h') || hfHas('f') || hfImgList().length > 0), dif = hasHF && !!hfData().dif;
    const ext = hasHF ? ';mso-header-margin:35.4pt;mso-footer-margin:35.4pt;mso-header:h1;mso-footer:f1' + (dif ? ';mso-title-page:yes;mso-first-header:fh1;mso-first-footer:ff1' : '') : '';
    const mg = [m.t, m.r, m.b, m.l].map(v=>(Math.round(v * 0.75 * 10) / 10) + 'pt').join(' ');
    const pg = pgOf(), sz = pg.w + 'cm ' + pg.h + 'cm';
    const extra = (pg.land ? ';mso-page-orientation:landscape' : '') + (pg.cols > 1 ? ';mso-columns:' + pg.cols + ' even none' : '');
    const base = ab ? ABNT_CSS.replace('size:21cm 29.7cm', 'size:' + sz).replace('margin:3cm 2cm 2cm 3cm', 'margin:' + mg + extra + ext)
      : '@page Section1{size:' + sz + ';margin:' + mg + extra + ext + '}div.Section1{page:Section1}body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.5}' + (window.__styCss ? window.__styCss() : '');
    return '<!DOCTYPE html><html lang="pt-BR" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"><title>' +
      title.value.replace(/</g,'&lt;') + '</title><style>' + base +
      'body{tab-interval:' + (Math.round(((store.docs[store.current] || {}).tabdef || 1.25) * 28.35 * 10) / 10) + 'pt}table{border-collapse:collapse}td{border:1px solid #888;padding:6px 8px}img{max-width:100%}</style></head><body>' +
      '<div class="Section1">' + bodyHtml(forDoc) + '</div>' +
      (hasHF ? '<div style=\'mso-element:header\' id="h1">' + hfImgsDoc() + hfLines('h', 'MsoHeader') + '</div><div style=\'mso-element:footer\' id="f1">' + hfLines('f', 'MsoFooter') + '</div>' +
        (dif ? '<div style=\'mso-element:header\' id="fh1"><p class="MsoHeader"></p></div><div style=\'mso-element:footer\' id="ff1"><p class="MsoFooter"></p></div>' : '') : '') +
      '</body></html>';
  }
  function download(content, name, type){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], {type}));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  }
  document.getElementById('btnDoc').addEventListener('click', ()=>
    download('\ufeff' + wrap(true), fileName('.doc'), 'application/msword'));
  document.getElementById('btnHtml').addEventListener('click', ()=>
    download(wrap(), fileName('.html'), 'text/html'));
  document.getElementById('btnPrint').addEventListener('click', ()=>window.print());

  document.getElementById('btnNew').addEventListener('click', ()=>newDoc());

  // Abrir: no Chrome/Edge usa a janela do sistema e guarda a ligação com o arquivo (Ctrl+S grava nele); nos demais, o seletor comum
  async function pickOpen(){
    if(!(window.showOpenFilePicker && window.isSecureContext && window.top === window)){ document.getElementById('fileOpen').click(); return; }
    try{
      const [h] = await window.showOpenFilePicker({id:'verbus', multiple:false, types:[{description:'Documentos (.docx, .doc, .html, .txt)', accept:{
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx'], 'application/msword':['.doc'], 'text/html':['.html', '.htm'], 'text/plain':['.txt']}}]});
      abrirArquivo(await h.getFile(), h);
    }catch(err){ if(!err || err.name !== 'AbortError') document.getElementById('fileOpen').click(); }
  }
  window.__abrirArquivo = pickOpen;
  document.getElementById('btnOpen').addEventListener('click', pickOpen);
  document.getElementById('fileOpen').addEventListener('change', e=>{ const f = e.target.files[0]; if(f) abrirArquivo(f, null); e.target.value = ''; });
  function abrirArquivo(f, handle){
    if(page.innerText.trim()) newDoc();
    const idDoc = store.current;
    const ligar = ()=>{
      if(handle){ FH.set(idDoc, {handle, name:f.name, t:Date.now(), dirty:false}); fhPut(idDoc); setStatus(true); }
      else if(FH.delete(idDoc)){ fhPut(idDoc); setStatus(true); }
    };
    if(/\.docx$/i.test(f.name)){
      (async()=>{
        try{
          if(!window.mammoth) await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
          const res = await window.mammoth.convertToHtml({arrayBuffer: await f.arrayBuffer()});
          page.innerHTML = sanitizarHtml(new DOMParser().parseFromString(res.value, 'text/html').body).innerHTML; title.value = f.name.replace(/\.[^.]+$/, ''); changed(); ligar();
        }catch(err){ alert('Não foi possível abrir o .docx. Verifique a conexão com a internet.'); }
      })();
      return;
    }
    const r = new FileReader();
    r.onload = ()=>{
      const isHtml = /\.(html?|doc)$/i.test(f.name);
      if(isHtml){
        const doc = new DOMParser().parseFromString(r.result, 'text/html');
        doc.querySelectorAll('style').forEach(n=>n.remove());
        sanitizarHtml(doc.body);
        page.innerHTML = doc.body.innerHTML;
      }else{
        page.textContent = '';
        r.result.split(/\r?\n/).forEach(l=>{ const p = document.createElement('p'); p.textContent = l || '\u200b'; page.appendChild(p); });
      }
      title.value = f.name.replace(/\.[^.]+$/, '');
      changed(); ligar();
    };
    r.readAsText(f);
  }

  // Texto digitado direto na folha vazia vira parágrafo <p> (senão fica sem espaçamento e sem estilo)
  page.addEventListener('input', ()=>{
    const s = getSelection();
    if(s.rangeCount && s.isCollapsed && s.anchorNode && s.anchorNode.nodeType === 3 && s.anchorNode.parentNode === page){
      try{ document.execCommand('formatBlock', false, 'p'); }catch(_){}
    }
  });
  page.addEventListener('input', changed);
  title.addEventListener('input', changed);
  page.addEventListener('keyup', refreshSoon);
  page.addEventListener('mouseup', refreshSoon);

  // ================= Funções extras =================
  const $ = id => document.getElementById(id);
  document.execCommand('defaultParagraphSeparator', false, 'p');
  const esc = t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;');

  // Espaçamento entre linhas
  $('lh').addEventListener('change', e=>{
    const v = e.target.value; restore();
    if(v.startsWith('__')){
      e.target.selectedIndex = 0;
      if(v === '__opt'){ $('parDlgOpen').click(); return; }
      const prop = (v === '__bef' || v === '__rmb') ? 'marginTop' : 'marginBottom', val = v.startsWith('__rm') ? '0pt' : '12pt';
      blocksInSel().filter(b=>!/^(TD|TH)$/.test(b.tagName)).forEach(b=>{ b.style[prop] = val; });
      changed(); return;
    }
    const s = getSelection(); if(!s.rangeCount) return;
    const r = s.getRangeAt(0); let hit = false;
    page.querySelectorAll('p,h1,h2,h3,li,blockquote,div:not(.pb):not(.sbk)').forEach(b=>{
      if(r.intersectsNode(b)){ b.style.lineHeight = v; delete b.dataset.lh; hit = true; }
    });
    if(!hit) page.style.lineHeight = v;
    changed();
  });


  // O seletor de espaçamento mostra o valor do parágrafo onde está o cursor e só oferece "Adicionar" ou "Remover" espaço conforme o caso (como no Word)
  (function(){
    const sel = $('lh'); if(!sel) return;
    const OPT = v=>sel.querySelector('option[value="' + v + '"]');
    let tm = null;
    function sync(){
      if(document.activeElement === sel) return;
      const s = getSelection(); if(!s.rangeCount || !page.contains(s.anchorNode)) return;
      let el = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement;
      const b = el && el.closest ? el.closest('p,h1,h2,h3,h4,h5,h6,li,blockquote,td,th') : null;
      if(!b || !page.contains(b) || b.closest('.fnotes,.endnotes')) return;
      const cs = getComputedStyle(b), fs = parseFloat(cs.fontSize) || 16;
      let v = '';
      if(!b.dataset.lh){
        const lh = cs.lineHeight === 'normal' ? 1.15 : parseFloat(cs.lineHeight) / fs;
        const m = ['1', '1.15', '1.5', '2', '2.5', '3'].find(x=>Math.abs(+x - lh) < 0.03);
        if(m) v = m;
      }
      if(sel.value !== v) sel.value = v;
      const hasB = parseFloat(cs.marginTop) > 0.5, hasA = parseFloat(cs.marginBottom) > 0.5;
      const show = (val, on)=>{ const o = OPT(val); if(o){ o.hidden = !on; o.disabled = !on; } };
      show('__bef', !hasB); show('__rmb', hasB); show('__aft', !hasA); show('__rma', hasA);
    }
    document.addEventListener('selectionchange', ()=>{ clearTimeout(tm); tm = setTimeout(sync, 60); });
    sel.addEventListener('mousedown', sync, true);   // atualiza também logo antes de abrir a lista
  })();


  // Maiúsculas / minúsculas
  $('case').addEventListener('change', e=>{
    const m = e.target.value; e.target.value = '';
    restore(); const s = getSelection(); if(!s.rangeCount || s.isCollapsed) return;
    const r = s.getRangeAt(0), nodes = [];
    const w = document.createTreeWalker(r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentNode : r.commonAncestorContainer, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()) if(r.intersectsNode(n)) nodes.push(n);
    // mexe só no texto dos nós (mantém negrito, links, cores e parágrafos)
    let prev = '', lastBlk = null;
    const conv = t=>{
      if(m === 'up') return t.toUpperCase();
      if(m === 'low') return t.toLowerCase();
      if(m === 'tog') return [...t].map(ch=>ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()).join('');
      if(m === 'sent') return (prev + t.toLowerCase()).replace(/(^\s*|[.!?]\s+)(\p{L})/gu,(a,b,c)=>b + c.toUpperCase()).slice(prev.length);
      return (prev + t.toLowerCase()).replace(/(^|\s)(\S)/g,(a,b,c)=>b + c.toUpperCase()).slice(prev.length);
    };
    nodes.forEach(n=>{
      const a = n === r.startContainer ? r.startOffset : 0, z = n === r.endContainer ? r.endOffset : n.data.length;
      if(z <= a) return;
      const blk = n.parentNode.closest('p,li,h1,h2,h3,h4,td,th,blockquote,div');
      if(blk !== lastBlk){ prev = ''; lastBlk = blk; }
      else if(a > 0) prev = n.data.slice(Math.max(0, a - 2), a);
      const o = conv(n.data.slice(a, z));
      n.data = n.data.slice(0, a) + o + n.data.slice(z);
      prev = o.slice(-2);
    });
    changed(); refresh();
  });

  // Símbolos, data, quebra de página, código
  $('symb').addEventListener('change', e=>{ const v = e.target.value; e.target.value = ''; if(v === '__mais'){ window.__openSym(); return; } restore(); exec('insertText', v); });
  $('btnPb').addEventListener('click', ()=>{ restore(); exec('insertHTML','<div class="pb" contenteditable="false"></div><p><br></p>'); });
