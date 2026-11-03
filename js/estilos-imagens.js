/* Verbus — Galeria de estilos, Modificar Estilo, Inspetor e Gerenciar Estilos; imagens (disposição, fundo)
   (js/estilos-imagens.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   Reconstruído a partir da v66 (index.html monolítico), com as chaves de armazenamento portadas para LS_KEYS. */
  // ================= Galeria de estilos, Substituir/Selecionar e busca de comandos =================
  (function(){
    const BLK = {
      semesp:'margin:0;line-height:1;',
      abnt:'margin:0;text-indent:1.25cm;text-align:justify;line-height:1.5;',
      lista:'margin-left:1.27cm;',
      titulo:'font-family:"Times New Roman",Times,serif;font-size:28pt;line-height:1;letter-spacing:-.5pt;margin:0 0 .3em;',
      subtitulo:'color:#5a5a5a;letter-spacing:.75pt;font-size:12pt;',
      citacao:'font-style:italic;color:#404040;text-align:center;margin:.8em 2.5em;',
      citint:'font-style:italic;color:#4472c4;text-align:center;border-top:1px solid #4472c4;border-bottom:1px solid #4472c4;padding:.6em 0;margin:1.2em 2.7em;'
    };
    const INL = {
      ensut:'font-style:italic;color:#404040;', enfase:'font-style:italic;', enfint:'font-style:italic;color:#4472c4;',
      forte:'font-weight:bold;', refsut:'font-variant:small-caps;color:#5a5a5a;',
      refint:'font-weight:bold;font-variant:small-caps;color:#4472c4;letter-spacing:.25pt;'
    };
    const gal = $('gallery');
    const sels = ()=>{ const s = getSelection(); return s.rangeCount ? s.getRangeAt(0) : null; };
    const blocksSel = ()=>{ const r = sels(); return r ? [...page.children].filter(n=>/^(P|H[1-6])$/.test(n.tagName) && r.intersectsNode(n)) : []; };

    function applyBlock(key){
      if(!page.contains(getSelection().anchorNode)){ page.focus(); }
      blocksSel().forEach(b=>{ if(b.dataset.st){ b.removeAttribute('data-st'); b.removeAttribute('style'); } });
      if(/^h[1-6]$/.test(key)){ exec('formatBlock', key); return; }
      exec('formatBlock', 'p');
      if(key === 'normal') return;
      blocksSel().filter(b=>b.tagName === 'P').forEach(b=>{ b.dataset.st = key; b.style.cssText = defOf(key); });
      changed(); refreshGal();
    }
    function applyInline(key){
      page.focus();
      const s = getSelection();
      if(!s.rangeCount || !page.contains(s.anchorNode)) return;
      if(s.isCollapsed && s.modify){ s.modify('move', 'backward', 'word'); s.modify('extend', 'forward', 'word'); }
      if(s.isCollapsed) return;
      const r = s.getRangeAt(0), root = r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentNode : r.commonAncestorContainer;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = []; let n;
      while((n = w.nextNode())) if(r.intersectsNode(n) && n.data.trim() !== '') nodes.push(n);
      const spans = [];
      nodes.forEach(t=>{
        const st = t === r.startContainer ? r.startOffset : 0, en = t === r.endContainer ? r.endOffset : t.length;
        if(st >= en) return;
        let mid = t; if(en < t.length) t.splitText(en); if(st > 0) mid = t.splitText(st);
        const sp = document.createElement('span'); sp.dataset.st = key; sp.style.cssText = defOf(key);
        mid.parentNode.insertBefore(sp, mid); sp.appendChild(mid); spans.push(sp);
      });
      if(spans.length){
        const nr = document.createRange(); nr.setStartBefore(spans[0]); nr.setEndAfter(spans[spans.length - 1]);
        s.removeAllRanges(); s.addRange(nr); changed();
      }
    }
    gal.querySelectorAll('button[data-gs]').forEach(b=>{
      b.addEventListener('mousedown', e=>e.preventDefault());
      b.addEventListener('click', ()=>b.dataset.gk === 'c' ? applyInline(b.dataset.gs) : applyBlock(b.dataset.gs));
    });
    // Limpar Formatação e estilos criados pelo usuário
    function clearAll(){
      page.focus();
      const s = getSelection(); if(!s.rangeCount || !page.contains(s.anchorNode)) return;
      document.execCommand('removeFormat');
      blocksSel().forEach(b=>{
        b.querySelectorAll('span[data-st]').forEach(x=>{ x.replaceWith(...x.childNodes); });
        b.querySelectorAll('span[style],font').forEach(x=>{ x.replaceWith(...x.childNodes); });
        b.removeAttribute('data-st'); b.removeAttribute('style'); b.removeAttribute('class');
      });
      if(/^H[1-6]$/.test((blocksSel()[0] || {}).tagName || '')) exec('formatBlock', 'p');
      changed(); refreshGal();
    }
    $('gsClear').addEventListener('mousedown', e=>e.preventDefault());
    $('gsClear').addEventListener('click', clearAll);
    const CUS_KEY = LS_KEYS.estilos;
    let cus = []; try{ cus = JSON.parse(localStorage.getItem(CUS_KEY) || '[]').filter(x=>x && x.name && typeof x.css === 'string'); }catch(e){}
    const saveCus = ()=>{ try{ localStorage.setItem(CUS_KEY, JSON.stringify(cus)); }catch(e){} };
    function cusBtn(c){
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'option'); b.className = 'gcus';
      b.dataset.gs = 'u:' + c.name; b.dataset.gk = 'u'; b.title = c.name + ' (estilo seu; botão direito: modificar, atualizar ou excluir)'; b.setAttribute('aria-label', c.name);
      const pv = document.createElement('span'); pv.className = 'pv'; pv.textContent = 'AaBbCcDc'; pv.style.cssText = c.css.replace(/margin[^;]*;?|text-align[^;]*;?|line-height[^;]*;?/g, '') + ';font-size:12px';
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = c.name;
      b.append(pv, nm);
      b.addEventListener('mousedown', e=>e.preventDefault());
      b.addEventListener('click', ()=>{
        page.focus();
        blocksSel().forEach(x=>{ x.dataset.st = 'u:' + c.name; x.style.cssText = c.css; });
        changed(); refreshGal();
      });
      gal.appendChild(b);
    }
    cus.forEach(cusBtn);
    $('gsCreate').addEventListener('mousedown', e=>e.preventDefault());
    $('gsCreate').addEventListener('click', ()=>{
      const b = blocksSel()[0]; if(!b){ alert('Clique dentro de um parágrafo que já esteja com a formatação desejada e tente de novo.'); return; }
      const name = (prompt('Nome do novo estilo:') || '').trim().slice(0, 30); if(!name) return;
      const cs = getComputedStyle(b), f = b.querySelector('span,b,i,u,font') || b, fs = getComputedStyle(f);
      const css = 'font-family:' + fs.fontFamily + ';font-size:' + fs.fontSize + ';color:' + fs.color + ';font-weight:' + fs.fontWeight + ';font-style:' + fs.fontStyle +
        ';text-align:' + (cs.textAlign === 'start' ? 'left' : cs.textAlign) + ';line-height:' + (parseFloat(cs.lineHeight) / (parseFloat(cs.fontSize) || 16) > 0 ? Math.round(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) * 100) / 100 : 1.15) + ';margin:' + cs.marginTop + ' 0 ' + cs.marginBottom + ';';
      cus = cus.filter(x=>x.name !== name); const novo = {name, css}; cus.push(novo); saveCus();
      gal.querySelectorAll('.gcus').forEach(x=>{ if(x.dataset.gs === 'u:' + name) x.remove(); });
      cusBtn(novo);
    });
    function refreshGal(){
      const s = getSelection(); if(!s.anchorNode || !page.contains(s.anchorNode)) return;
      const b = blocksSel()[0]; let k = 'normal';
      if(b) k = b.dataset.st || (/^H[1-6]$/.test(b.tagName) ? b.tagName.toLowerCase() : 'normal');
      gal.querySelectorAll('button').forEach(x=>{ const on = x.dataset.gs === k; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
    }
    document.addEventListener('selectionchange', refreshGal);


    // ===== Modificar Estilo, Atualizar, Aplicar Estilos, Inspetor e Gerenciar Estilos =====
    const dd = ()=>store.docs[store.current];
    const ovs = ()=>{ const d = dd(); return d ? (d.stov || (d.stov = {})) : {}; };
    const isH = k=>/^h[1-6]$/.test(k);
    const btnOf = k=>[...gal.querySelectorAll('button[data-gs]')].find(b=>b.dataset.gs === k);
    const nameOf = k=>{ if(k.startsWith('u:')) return k.slice(2); const b = btnOf(k); return b ? b.getAttribute('aria-label') : k; };
    const kindOf = k=>{ const b = btnOf(k); return b && b.dataset.gk === 'c' ? 'c' : 'p'; };
    const allKeys = ()=>[...gal.querySelectorAll('button[data-gs]')].map(b=>b.dataset.gs);
    const keyByName = n=>{ n = n.trim().toLowerCase(); return allKeys().find(k=>nameOf(k).toLowerCase() === n) || null; };
    function defOf(k){
      if(k.startsWith('u:')){ const c = cus.find(x=>x.name === k.slice(2)); return c ? c.css : ''; }
      const d = dd(), o = d && d.stov;
      if(o && o[k] != null) return o[k];
      return BLK[k] || INL[k] || '';
    }
    const pt1 = v=>Math.round(parseFloat(v) * .75 * 10) / 10;
    function mergeCss(a, b){
      const t = document.createElement('p'); t.style.cssText = a || '';
      const n = document.createElement('p'); n.style.cssText = b || '';
      for(const nm of [...n.style]) t.style.setProperty(nm, n.style.getPropertyValue(nm));
      return t.style.cssText;
    }
    // formatação de um elemento como texto CSS (parágrafo: tudo; caractere: só cor, negrito, itálico, sublinhado)
    function cssFrom(el, kind, fontEl){
      const cs = getComputedStyle(el), fe = getComputedStyle(fontEl || el), pc = getComputedStyle(page);
      let o = '';
      if(kind === 'p'){
        if(fe.fontFamily !== pc.fontFamily) o += 'font-family:' + fe.fontFamily + ';';
        o += 'font-size:' + pt1(fe.fontSize) + 'pt;';
      }
      if(fe.color !== pc.color || kind === 'c') o += 'color:' + fe.color + ';';
      o += 'font-weight:' + fe.fontWeight + ';font-style:' + fe.fontStyle + ';';
      if(/underline/.test(fe.textDecorationLine)) o += 'text-decoration:underline;';
      if(kind === 'p'){
        const lh = parseFloat(cs.lineHeight), fs = parseFloat(cs.fontSize);
        o += 'text-align:' + (cs.textAlign === 'start' ? 'left' : cs.textAlign === 'end' ? 'right' : cs.textAlign) + ';';
        if(isFinite(lh) && fs) o += 'line-height:' + Math.round(lh / fs * 100) / 100 + ';';
        o += 'margin-top:' + pt1(cs.marginTop) + 'pt;margin-bottom:' + pt1(cs.marginBottom) + 'pt;';
        const ml = parseFloat(cs.marginLeft) || 0, ti = parseFloat(cs.textIndent) || 0;
        if(ml) o += 'margin-left:' + Math.round(ml / 37.795 * 100) / 100 + 'cm;';
        if(ti) o += 'text-indent:' + Math.round(ti / 37.795 * 100) / 100 + 'cm;';
      }
      return o;
    }
    // estilos sem definição própria (títulos e Normal) são lidos de um elemento de teste, invisível e removido na hora
    function probeCss(k){
      const kind = kindOf(k); let el, host = null;
      if(isH(k)) el = document.createElement(k);
      else if(kind === 'c'){ host = document.createElement('p'); el = document.createElement('span'); host.appendChild(el); }
      else el = document.createElement('p');
      if(!isH(k) && k !== 'normal'){ el.dataset.st = k; el.style.cssText = defOf(k); }
      el.textContent = 'Aa'; (host || el).contentEditable = 'false';
      (host || el).style.cssText += ';position:absolute;visibility:hidden;pointer-events:none';
      page.appendChild(host || el);
      let css = ''; try{ css = cssFrom(el, kind); }catch(e){}
      (host || el).remove(); return css;
    }
    const getCss = k=>defOf(k) || probeCss(k);

    // pré-visualização na galeria
    function previewUpdate(k){
      const b = btnOf(k); if(!b) return; const pv = b.querySelector('.pv'); if(!pv) return;
      const t = document.createElement('p'); t.style.cssText = getCss(k);
      const fs = parseFloat(t.style.fontSize) || 9;
      ['margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'text-align', 'line-height', 'text-indent', 'padding', 'border-top', 'border-bottom'].forEach(n=>t.style.removeProperty(n));
      t.style.fontSize = Math.max(11, Math.min(22, Math.round(fs * 1.333))) + 'px';
      pv.style.cssText = t.style.cssText;
    }
    // títulos e Normal: regras de CSS por documento (tela, impressão e exportação)
    function ovrCss(){
      const o = dd() && dd().stov, r = {scr:'', exp:''}; if(!o) return r;
      for(const k in o){
        if(!(isH(k) || k === 'normal')) continue;
        const t = document.createElement('p'); t.style.cssText = o[k]; let imp = '';
        for(const n of [...t.style]) imp += n + ':' + t.style.getPropertyValue(n) + ' !important;';
        r.scr += '#page ' + (k === 'normal' ? 'p:not([data-st])' : k) + '{' + imp + '}';
        r.exp += (k === 'normal' ? 'p' : k) + '{' + o[k] + '}';
      }
      return r;
    }
    window.__stOvr = function(){
      let tag = document.getElementById('stOvr');
      if(!tag){ tag = document.createElement('style'); tag.id = 'stOvr'; document.head.appendChild(tag); }
      tag.textContent = ovrCss().scr;
      allKeys().forEach(previewUpdate);
    };
    window.__stOvrCss = ()=>ovrCss().exp;
    function saveDef(k, css){
      if(k.startsWith('u:')){ const c = cus.find(x=>x.name === k.slice(2)); if(!c) return; c.css = css; saveCus(); }
      else ovs()[k] = css;
      if(!isH(k) && k !== 'normal') page.querySelectorAll('[data-st]').forEach(x=>{ if(x.dataset.st === k) x.style.cssText = css; });
      window.__stOvr(); persist(); changed(); refreshGal();
    }
    function resetDef(k){
      const d = dd(); if(!d || !d.stov || d.stov[k] == null) return;
      delete d.stov[k]; if(!Object.keys(d.stov).length) delete d.stov;
      if(!isH(k) && k !== 'normal') page.querySelectorAll('[data-st]').forEach(x=>{ if(x.dataset.st === k) x.style.cssText = defOf(k); });
      window.__stOvr(); persist(); changed(); refreshGal();
    }
    const curKey = ()=>{ const b = blocksSel()[0]; return b ? (b.dataset.st || (/^H[1-6]$/.test(b.tagName) ? b.tagName.toLowerCase() : 'normal')) : null; };
    function applyKey(k){ const b = btnOf(k); if(b) b.click(); }

    // Atualizar para Corresponder à Seleção
    function updateFromSel(k){
      if(!k){ alert('Clique dentro de um parágrafo que esteja com a formatação desejada e tente de novo.'); return; }
      const kind = kindOf(k); let el, fontEl;
      if(kind === 'c'){
        const se = selEl && selEl(); el = se && se.closest ? se.closest('[data-st]') : null;
        if(!el || !page.contains(el)){ alert('Clique ou selecione um trecho com formatação de caractere para usar como modelo.'); return; }
      }else{
        el = blocksSel()[0]; if(!el){ alert('Clique dentro de um parágrafo que esteja com a formatação desejada e tente de novo.'); return; }
        fontEl = el.querySelector('span,b,i,u,font,strong,em') || el;
      }
      let nc; try{ nc = cssFrom(el, kind, fontEl); }catch(e){ return; }
      saveDef(k, mergeCss(defOf(k), nc));
    }

    // Modificar Estilo
    let mk = null, ini = {};
    const toHex = c=>{ try{ const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; return x.fillStyle; }catch(e){ return '#000000'; } };
    function lenPt(v, fs){
      if(!v) return NaN; const m = /^(-?[\d.]+)(pt|px|cm|mm|em|rem)?$/.exec(String(v).trim()); if(!m) return NaN;
      const n = parseFloat(m[1]);
      switch(m[2]){ case 'pt': return n; case 'px': return n * .75; case 'cm': return n * 28.3465; case 'mm': return n * 2.83465; case 'em': case 'rem': return n * (fs || 11); default: return n ? NaN : 0; }
    }
    const fld = id=>$(id);
    function openModify(k){
      if(!k){ alert('Clique dentro de um parágrafo e tente de novo.'); return; }
      mk = k; const kind = kindOf(k), t = document.createElement('p'); t.style.cssText = getCss(k); const st = t.style;
      fld('stmName').value = nameOf(k); fld('stmType').value = kind === 'c' ? 'Caractere' : 'Parágrafo';
      fld('stmFont').value = (st.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
      const fs = lenPt(st.fontSize); fld('stmSize').value = isFinite(fs) ? Math.round(fs * 10) / 10 : '';
      fld('stmAuto').checked = !st.color; fld('stmColor').value = st.color ? toHex(st.color) : '#000000';
      ini = {B:st.fontWeight === 'bold' || parseInt(st.fontWeight, 10) >= 600, I:/italic|oblique/.test(st.fontStyle), U:/underline/.test(st.textDecoration || st.textDecorationLine || ''), al:st.textAlign || ''};
      fld('stmB').checked = ini.B; fld('stmI').checked = ini.I; fld('stmU').checked = ini.U;
      const f0 = isFinite(fs) ? fs : 11, g = v=>{ const n = lenPt(v, f0); return isFinite(n) ? Math.round(n * 10) / 10 : ''; };
      fld('stmAlign').value = ['left', 'center', 'right', 'justify'].includes(st.textAlign) ? st.textAlign : '';
      const lh = parseFloat(st.lineHeight); fld('stmLh').value = isFinite(lh) && !/[a-z%]/i.test(st.lineHeight) ? lh : '';
      fld('stmBef').value = g(st.marginTop); fld('stmAft').value = g(st.marginBottom);
      const c = v=>{ const n = lenPt(v, f0); return isFinite(n) ? Math.round(n / 28.3465 * 100) / 100 : ''; };
      fld('stmInd').value = c(st.marginLeft); fld('stmFirst').value = c(st.textIndent);
      document.querySelector('#stmDlg .stpara').style.display = kind === 'c' ? 'none' : 'contents';
      $('stmMsg').textContent = 'A mudança vale para todos os parágrafos do documento que usam este estilo.' + (k.startsWith('u:') ? ' Estilos seus valem em todos os documentos.' : '');
      $('stmDlg').showModal();
    }
    $('stmCancel').addEventListener('click', ()=>$('stmDlg').close());
    $('stmOk').addEventListener('click', ()=>{
      const kind = kindOf(mk), t = document.createElement('p'); t.style.cssText = getCss(mk); const st = t.style;
      const n = id=>{ const v = parseFloat(String(fld(id).value).replace(',', '.')); return isFinite(v) ? v : null; };
      const font = fld('stmFont').value.trim().replace(/"/g, ''); if(font) st.fontFamily = '"' + font + '"'; else st.removeProperty('font-family');
      const sz = n('stmSize'); if(sz > 0) st.fontSize = sz + 'pt'; else st.removeProperty('font-size');
      if(fld('stmAuto').checked) st.removeProperty('color'); else st.color = fld('stmColor').value;
      if(fld('stmB').checked !== ini.B) st.fontWeight = fld('stmB').checked ? 'bold' : 'normal';
      if(fld('stmI').checked !== ini.I) st.fontStyle = fld('stmI').checked ? 'italic' : 'normal';
      if(fld('stmU').checked !== ini.U){ if(fld('stmU').checked) st.textDecoration = 'underline'; else st.removeProperty('text-decoration'); }
      if(kind === 'p'){
        const al = fld('stmAlign').value; if(al) st.textAlign = al; else st.removeProperty('text-align');
        const lh = n('stmLh'); if(lh >= .5 && lh <= 5) st.lineHeight = String(lh); else st.removeProperty('line-height');
        [['stmBef', 'marginTop', 'pt'], ['stmAft', 'marginBottom', 'pt'], ['stmInd', 'marginLeft', 'cm'], ['stmFirst', 'textIndent', 'cm']].forEach(([id, pr, u])=>{
          const v = n(id); if(v !== null) st[pr] = v + u; else st[pr] = '';
        });
      }
      $('stmDlg').close(); saveDef(mk, st.cssText);
    });
    $('gsModify').addEventListener('mousedown', e=>e.preventDefault());
    $('gsModify').addEventListener('click', ()=>openModify(curKey()));
    $('gsUpdate').addEventListener('mousedown', e=>e.preventDefault());
    $('gsUpdate').addEventListener('click', ()=>updateFromSel(curKey()));

    // Aplicar Estilos
    function fillStaList(){ const l = $('staList'); l.innerHTML = ''; allKeys().forEach(k=>{ const o = document.createElement('option'); o.value = nameOf(k); l.appendChild(o); }); }
    $('gsApply').addEventListener('mousedown', e=>e.preventDefault());
    $('gsApply').addEventListener('click', ()=>{ fillStaList(); $('staMsg').textContent = ''; const k = curKey(); $('staName').value = k ? nameOf(k) : ''; $('staDlg').showModal(); $('staName').select(); });
    $('staClose').addEventListener('click', ()=>$('staDlg').close());
    $('staName').addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); $('staOk').click(); } });
    $('staOk').addEventListener('click', ()=>{
      const k = keyByName($('staName').value); if(!k){ $('staMsg').textContent = 'Não há estilo com esse nome. Veja Gerenciar Estilos.'; return; }
      $('staDlg').close(); restore(); applyKey(k);
    });
    $('staMod').addEventListener('click', ()=>{
      const k = keyByName($('staName').value); if(!k){ $('staMsg').textContent = 'Não há estilo com esse nome.'; return; }
      $('staDlg').close(); openModify(k);
    });

    // Inspetor de Estilo
    const esc2 = x=>String(x).replace(/[&<>]/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;'}[c]));
    function openInspect(){
      const b = blocksSel()[0]; if(!b){ alert('Clique dentro de um parágrafo e tente de novo.'); return; }
      const k = curKey(), cs = getComputedStyle(b);
      const se = selEl && selEl(), fe = se && b.contains(se) ? se : (b.querySelector('span,b,i,u,font,strong,em') || b), fc = getComputedStyle(fe);
      const ch = fe.closest && fe.closest('[data-st]') && fe.closest('[data-st]') !== b ? fe.closest('[data-st]').dataset.st : null;
      // formatação direta: propriedades do parágrafo que diferem da definição do estilo
      let direta = [];
      if(b.getAttribute('style')){
        const t = document.createElement('p'); t.style.cssText = defOf(k) || '';
        for(const nm of [...b.style]) if(t.style.getPropertyValue(nm) !== b.style.getPropertyValue(nm)) direta.push(nm);
      }
      const al = {left:'Esquerda', start:'Esquerda', center:'Centralizado', right:'Direita', end:'Direita', justify:'Justificado'}[cs.textAlign] || cs.textAlign;
      const cm2 = v=>(Math.round((parseFloat(v) || 0) / 37.795 * 100) / 100).toLocaleString('pt-BR') + ' cm';
      const lh = parseFloat(cs.lineHeight), fs = parseFloat(cs.fontSize);
      const row = (a, v)=>'<tr><td>' + a + '</td><td>' + esc2(v) + '</td></tr>';
      $('stiBody').innerHTML =
        '<h4>Formatação do parágrafo</h4><table>' +
        row('Estilo', nameOf(k)) + row('Formatação direta', direta.length ? 'Sim (' + direta.map(x=>x.replace(/^(margin|text)-/, '')).slice(0, 4).join(', ') + ')' : 'Nenhuma') +
        row('Alinhamento', al) + row('Direção', cs.direction === 'rtl' ? 'Da direita para a esquerda' : 'Da esquerda para a direita') +
        row('Recuo à esquerda', cm2(cs.marginLeft)) + row('Primeira linha', cm2(cs.textIndent)) +
        row('Espaço antes / depois', pt1(cs.marginTop) + ' pt / ' + pt1(cs.marginBottom) + ' pt') +
        row('Entre linhas', isFinite(lh) && fs ? (Math.round(lh / fs * 100) / 100).toLocaleString('pt-BR') + ' (múltiplo)' : 'Normal') + '</table>' +
        '<h4>Formatação do texto</h4><table>' +
        row('Estilo de caractere', ch ? nameOf(ch) : 'Nenhum') + row('Fonte', (fc.fontFamily.split(',')[0] || '').replace(/["']/g, '')) +
        row('Tamanho', pt1(fc.fontSize).toLocaleString('pt-BR') + ' pt') + row('Cor', fc.color) +
        row('Negrito / itálico / sublinhado', [parseInt(fc.fontWeight, 10) >= 600 ? 'Negrito' : '', /italic|oblique/.test(fc.fontStyle) ? 'Itálico' : '', /underline/.test(fc.textDecorationLine) ? 'Sublinhado' : ''].filter(Boolean).join(', ') || 'Nenhum') + '</table>';
      $('stiRe').dataset.k = k; $('stiDlg').showModal();
    }
    $('gsInspect').addEventListener('mousedown', e=>e.preventDefault());
    $('gsInspect').addEventListener('click', openInspect);
    $('stiClose').addEventListener('click', ()=>$('stiDlg').close());
    $('stiRe').addEventListener('click', ()=>{ const k = $('stiRe').dataset.k; $('stiDlg').close(); restore(); if(k) applyKey(k); });

    // Gerenciar Estilos
    function fillMan(sel){
      const l = $('stgList'); l.innerHTML = '';
      allKeys().forEach(k=>{
        const o = document.createElement('option'); o.value = k;
        const mod = !k.startsWith('u:') && ovs()[k] != null;
        o.textContent = nameOf(k) + '   ·  ' + (k.startsWith('u:') ? 'seu' : kindOf(k) === 'c' ? 'caractere' : 'parágrafo') + (mod ? ' · modificado' : '');
        l.appendChild(o);
      });
      if(sel && [...l.options].some(o=>o.value === sel)) l.value = sel; else l.selectedIndex = 0;
      manSync();
    }
    function manSync(){
      const k = $('stgList').value, own = k && k.startsWith('u:'), mod = k && !own && ovs()[k] != null;
      $('stgDel').textContent = own ? 'Excluir' : 'Restaurar padrão'; $('stgDel').disabled = !k || (!own && !mod);
      $('stgMsg').textContent = '';
    }
    $('stgList').addEventListener('change', manSync);
    $('gsManage').addEventListener('mousedown', e=>e.preventDefault());
    $('gsManage').addEventListener('click', ()=>{ fillMan(curKey()); $('stgDlg').showModal(); });
    $('stgClose').addEventListener('click', ()=>$('stgDlg').close());
    $('stgMod').addEventListener('click', ()=>{ const k = $('stgList').value; if(!k) return; $('stgDlg').close(); openModify(k); });
    $('stgApply').addEventListener('click', ()=>{ const k = $('stgList').value; if(!k) return; $('stgDlg').close(); restore(); applyKey(k); });
    $('stgNew').addEventListener('click', ()=>{ $('stgDlg').close(); restore(); $('gsCreate').click(); });
    $('stgDel').addEventListener('click', ()=>{ const k = $('stgList').value; if(!k) return; delStyle(k); fillMan(k.startsWith('u:') ? null : k); });
    function delStyle(k){
      if(k.startsWith('u:')){
        if(!confirm('Excluir o estilo "' + nameOf(k) + '"? Os trechos que o usam ficam como estão, mas sem o nome do estilo.')) return;
        page.querySelectorAll('[data-st]').forEach(x=>{ if(x.dataset.st === k) x.removeAttribute('data-st'); });
        cus = cus.filter(x=>x.name !== k.slice(2)); saveCus(); const b = btnOf(k); if(b) b.remove(); changed();
      }else resetDef(k);
    }

    // Botão direito em qualquer estilo da galeria
    function closeStMenu(){ const m = $('stMenu'); if(m) m.remove(); }
    gal.addEventListener('contextmenu', e=>{
      const b = e.target.closest('button[data-gs]'); if(!b) return;
      e.preventDefault(); closeStMenu();
      const k = b.dataset.gs, nm = nameOf(k), own = k.startsWith('u:'), mod = !own && ovs()[k] != null;
      const m = document.createElement('div'); m.id = 'stMenu'; m.setAttribute('role', 'menu');
      const add = (t, fn)=>{ const x = document.createElement('button'); x.type = 'button'; x.setAttribute('role', 'menuitem'); x.textContent = t; x.addEventListener('mousedown', ev=>ev.preventDefault()); x.addEventListener('click', ()=>{ closeStMenu(); fn(); }); m.appendChild(x); };
      add('Atualizar ' + nm + ' para Corresponder à Seleção', ()=>updateFromSel(k));
      add('Modificar…', ()=>openModify(k));
      if(own) add('Excluir estilo', ()=>delStyle(k)); else if(mod) add('Restaurar o padrão de ' + nm, ()=>delStyle(k));
      document.body.appendChild(m);
      m.style.left = Math.min(e.clientX, innerWidth - 280) + 'px'; m.style.top = Math.min(e.clientY, innerHeight - m.offsetHeight - 8) + 'px';
    });
    document.addEventListener('mousedown', e=>{ if(!e.target.closest('#stMenu')) closeStMenu(); }, true);
    document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeStMenu(); });
    window.addEventListener('blur', closeStMenu);
    setTimeout(()=>{ try{ window.__stOvr(); }catch(e){} }, 0);

    // Edição: Substituir e Selecionar
    $('btnRepl').addEventListener('mousedown', e=>e.preventDefault());
    $('btnRepl').addEventListener('click', ()=>{ $('btnFind').click(); $('replIn').focus(); });
    $('selAll').addEventListener('change', e=>{
      const v = e.target.value; e.target.selectedIndex = 0;
      page.focus();
      if(v === 'all') document.execCommand('selectAll');
      else if(v === 'sim'){ if(window.__selSimilar) window.__selSimilar(); }
      else if(v === 'obj'){
        const objs = [...page.querySelectorAll('img,table')].filter(o=>!o.closest('.hf'));
        if(!objs.length){ alert('Não há imagens nem tabelas no documento.'); return; }
        const s = getSelection(), cur = s.rangeCount ? s.anchorNode : null;
        const next = objs.find(o=>cur && (o.compareDocumentPosition(cur) & Node.DOCUMENT_POSITION_PRECEDING) && !o.contains(cur)) || objs[0];
        const r = document.createRange(); r.selectNode(next); s.removeAllRanges(); s.addRange(r); next.scrollIntoView({block:'center'});
      }
      else if(v === 'par'){ const b = curBlock(); if(b){ const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } }
    });

    // Compartilhar (abre o menu Arquivo > Compartilhar)
    // (ligado dentro do bloco do menu Arquivo: ver btnShare)

    // Busca de comandos (Alt+Q): lista todos os botões da faixa e as guias
    const tell = $('tell'), dl = $('tellList'), map = new Map();
    const clean = t=>(t || '').replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, ' ').trim();
    function add(label, fn){ label = clean(label); if(label.length < 2 || map.has(label.toLowerCase())) return; map.set(label.toLowerCase(), {label, fn}); }
    document.querySelectorAll('#tabs [role=tab]').forEach(t=>add('Ir para a guia ' + t.textContent, ()=>t.click()));
    document.querySelectorAll('#toolbar .tabpanel button').forEach(b=>{
      const al = b.getAttribute('aria-label'), tx = clean(b.textContent), tt = clean((b.title || '').split(/[:(]/)[0]);
      add(al || (/\p{L}{3}/u.test(tx) ? tx : tt), ()=>b.click());
    });
    ['btnFile'].forEach(id=>{ const b = $(id); add('Arquivo', ()=>b.click()); });
    [...map.values()].sort((a, b)=>a.label.localeCompare(b.label, 'pt-BR')).forEach(m=>{ const o = document.createElement('option'); o.value = m.label; dl.appendChild(o); });
    function runTell(){
      const q = tell.value.trim().toLowerCase(); if(!q) return;
      const hit = map.get(q) || [...map.values()].find(m=>m.label.toLowerCase().includes(q));
      if(!hit) return;
      tell.value = ''; tell.blur(); hit.fn();
    }
    tell.addEventListener('change', runTell);
    tell.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); runTell(); } else if(e.key === 'Escape'){ tell.value = ''; tell.blur(); page.focus(); } });
  })();


  // ================= Imagens: inserir certo, disposição (como no Word), fundo, cabeçalho/rodapé =================
  (function(){
    const sheet = $('sheet'), bar = $('imgbar'), ov = $('imgOv'), fileImg = $('fileImg');
    let T = null, mode = 'auto';                       // T = {k:'b', el} (corpo) ou {k:'h', it} (cabeçalho/rodapé/fundo)
    const PGW = ()=>pgOf().w * CMPX, PGH = ()=>pgOf().h * CMPX;
    const cmv = v=>Math.round(v / CMPX * 100) / 100;
    const sc = ()=>{ const r = sheet.getBoundingClientRect(); return sheet.offsetWidth ? r.width / sheet.offsetWidth : 1; };
    const editingHF = ()=>!!(window.__hfEditing && window.__hfEditing());
    const rid = ()=>'i' + Math.random().toString(36).slice(2, 9);
    const contentW = ()=>{ const e = effMar(); return Math.max(CMPX, PGW() - e.l - e.r); };
    const contentH = ()=>{ const e = effMar(); return Math.max(CMPX, PGH() - e.t - e.b); };

    // ---- leitura do arquivo, com redução de fotos muito grandes
    function readFile(f){ return new Promise((ok, no)=>{ const r = new FileReader(); r.onload = ()=>ok(r.result); r.onerror = no; r.readAsDataURL(f); }); }
    async function prepare(src){
      try{
        const im = await loadImg(src), big = Math.max(im.naturalWidth, im.naturalHeight), MAX = 2600;
        if(big <= MAX) return {src, w:im.naturalWidth, h:im.naturalHeight};
        const k = MAX / big, w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k), cv = document.createElement('canvas');
        cv.width = w; cv.height = h; cv.getContext('2d').drawImage(im, 0, 0, w, h);
        const png = /^data:image\/png/i.test(src);
        return {src: cv.toDataURL(png ? 'image/png' : 'image/jpeg', 0.9), w, h};
      }catch(e){ return null; }
    }
    // recorta/ajusta a imagem para cobrir exatamente a proporção da página
    async function coverCrop(src, aspect){
      const im = await loadImg(src), iw = im.naturalWidth, ih = im.naturalHeight; let cw = iw, ch = ih;
      if(iw / ih > aspect) cw = ih * aspect; else ch = iw / aspect;
      const k = Math.min(1, 2480 / cw), cv = document.createElement('canvas'); cv.width = Math.round(cw * k); cv.height = Math.round(ch * k);
      cv.getContext('2d').drawImage(im, (iw - cw) / 2, (ih - ch) / 2, cw, ch, 0, 0, cv.width, cv.height);
      return cv.toDataURL(/^data:image\/png/i.test(src) ? 'image/png' : 'image/jpeg', 0.92);
    }

    // ---- inserir no corpo: cabe na área do texto (largura e altura)
    async function insertBody(src, w, h){
      const W = contentW(), H = contentH();
      let nw = Math.min(w, W), nh = h * nw / w; if(nh > H){ nh = H; nw = w * nh / h; }
      restore();
      exec('insertHTML', '<img data-new="1" src="' + src + '" style="width:' + Math.round(nw) + 'px;height:auto">');
      const el = page.querySelector('img[data-new]');
      if(el){ el.removeAttribute('data-new'); changed(); select({k:'b', el}); }
    }
    // ---- inserir no cabeçalho/rodapé: no lugar certo, com tamanho que cabe; a margem cresce se precisar
    function addHF(src, w, h, where, opts){
      opts = opts || {};
      const pg = pgOf(), PW = pg.w * CMPX, PH = pg.h * CMPX; let e = effMar();
      let nw = Math.min(w, PW - e.l - e.r), nh = h * nw / w; const maxH = 3 * CMPX;
      if(nh > maxH){ nh = maxH; nw = w * nh / h; }
      const it = {id:rid(), src, x:e.l, y:0, w:nw, h:nh, z:'back', op:0};
      if(opts.full){ it.x = 0; it.y = 0; it.w = PW; it.h = PH; it.bg = true; }
      else if(where === 'f'){
        const need = Math.min(PH * 0.4, 1.0 * CMPX + nh + 0.4 * CMPX); if(e.b < need) setMar('b', need);
        e = effMar(); it.y = PH - hfDist(false, e) - nh;
      }else{
        const by = 1.0 * CMPX, need = Math.min(PH * 0.4, by + nh + 0.4 * CMPX); if(e.t < need) setMar('t', need);
        e = effMar(); it.y = hfDist(true, e);
      }
      hfImgs().push(it); persist(); applyMar(); select({k:'h', it});
    }
    async function insFile(f, how){
      const src0 = typeof f === 'string' ? f : await readFile(f), pr = await prepare(src0);
      if(!pr){ alert('Não foi possível ler essa imagem.'); return; }
      how = how || mode; mode = 'auto';
      if(how === 'bg'){
        const pg = pgOf(), cov = await coverCrop(pr.src, pg.w / pg.h);
        hfData().imgs = hfImgs().filter(i=>!i.bg);
        if(!editingHF() && window.__hfOpen) window.__hfOpen('h');
        addHF(cov, 1, 1, 'h', {full:true}); return;
      }
      if(how === 'h' || how === 'f'){ if(!editingHF() && window.__hfOpen) window.__hfOpen(how); addHF(pr.src, pr.w, pr.h, how); return; }
      if(editingHF()){ addHF(pr.src, pr.w, pr.h, window.__hfActive ? window.__hfActive() : 'h'); return; }
      await insertBody(pr.src, pr.w, pr.h);
    }
    window.__insImgFile = f=>{ insFile(f).catch(()=>alert('Não foi possível inserir a imagem.')); };
    fileImg.addEventListener('change', e=>{ const f = e.target.files[0]; e.target.value = ''; if(f) insFile(f).catch(()=>alert('Não foi possível inserir a imagem.')); });
    const pick = m=>{ mode = m; fileImg.click(); };
    $('btnImg').addEventListener('click', ()=>{ mode = 'auto'; });
    $('btnImgHF').addEventListener('click', ()=>pick('h'));
    $('btnImgFT').addEventListener('click', ()=>pick('f'));
    $('hfImg').addEventListener('click', ()=>pick(window.__hfActive ? window.__hfActive() : 'h'));
    $('btnBg').addEventListener('click', ()=>pick('bg'));
    $('btnBgOff').addEventListener('click', ()=>{ hfData().imgs = hfImgs().filter(i=>!i.bg); persist(); applyMar(); update(); });
    ['btnImgHF','btnImgFT','btnBg','btnBgOff','selImg'].forEach(id=>$(id).addEventListener('mousedown', ()=>{}));

    // ---- disposição no corpo
    const BWRAP = [['inline','Alinhada com o texto'],['left','Quadrado — à esquerda'],['right','Quadrado — à direita'],['tb','Acima e abaixo do texto'],['behind','Atrás do texto'],['front','Na frente do texto']];
    const HWRAP = [['back','Atrás do texto'],['front','Na frente do texto']];
    const wrapOf = el=>el.dataset.wrap || 'inline';
    function sheetRect(el){
      const r = el.getBoundingClientRect(), s = sheet.getBoundingClientRect(), k = sc();
      return {x:(r.left - s.left) / k, y:(r.top - s.top) / k, w:r.width / k, h:r.height / k};
    }
    function setWrap(el, m){
      const r = sheetRect(el);
      ['float','display','position','zIndex','left','top','margin','verticalAlign'].forEach(k=>{ el.style[k] = ''; });
      el.style.removeProperty('--x'); el.style.removeProperty('--y');
      if(m === 'inline') el.removeAttribute('data-wrap'); else el.setAttribute('data-wrap', m);
      if(m === 'behind' || m === 'front'){ el.style.setProperty('--x', Math.round(r.x) + 'px'); el.style.setProperty('--y', Math.round(r.y) + 'px'); }
      changed(); update();
    }
    const isFloat = el=>/^(behind|front)$/.test(wrapOf(el));
    function bPos(el, x, y){ if(x != null) el.style.setProperty('--x', Math.round(x) + 'px'); if(y != null) el.style.setProperty('--y', Math.round(y) + 'px'); }

    // ---- seleção, barra e moldura
    function select(t){
      T = t;
      if(t){ const a = document.activeElement; if(a && a !== document.body && !/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) a.blur(); }   // imagem selecionada: Delete/Backspace apaga, como no Word
      update();
    }
    function geom(){
      if(!T) return null;
      if(T.k === 'h') return {x:T.it.x, y:T.it.y, w:T.it.w, h:T.it.h};
      return sheetRect(T.el);
    }
    function update(){
      if(T && T.k === 'b' && !page.contains(T.el)) T = null;
      if(T && T.k === 'h' && (!hfImgList().includes(T.it) || !editingHF())) T = null;
      if(!T){ bar.hidden = true; ov.hidden = true; return; }
      bar.hidden = false; ov.hidden = false;
      const g = geom(), fl = T.k === 'h' || isFloat(T.el);
      ov.classList.toggle('fl', fl);
      ov.style.left = g.x + 'px'; ov.style.top = g.y + 'px'; ov.style.width = g.w + 'px'; ov.style.height = g.h + 'px';
      if(document.activeElement !== $('imAlt')) $('imAlt').value = T.k === 'h' ? (T.it.alt || '') : (T.el.getAttribute('alt') || '');
      const sel = $('imWrap'), list = T.k === 'h' ? HWRAP : BWRAP, cur = T.k === 'h' ? (T.it.z === 'front' ? 'front' : 'back') : wrapOf(T.el);
      const sig = list.map(x=>x[0]).join();
      if(sel.dataset.sig !== sig){ sel.innerHTML = list.map(x=>'<option value="' + x[0] + '">' + x[1] + '</option>').join(''); sel.dataset.sig = sig; }
      sel.value = cur;
      if(document.activeElement !== $('imW')) $('imW').value = cmv(g.w);
      if(document.activeElement !== $('imH')) $('imH').value = cmv(g.h);
      const op = T.k === 'h' ? (T.it.op || 0) : Math.round((1 - (parseFloat(T.el.style.opacity || '1'))) * 100);
      if(document.activeElement !== $('imOp')) $('imOp').value = op;
      $('imOpv').textContent = op + '%';
      $('imVert').style.display = fl ? '' : 'none';
    }
    window.__imgUpd = ()=>{ if(T) update(); };

    // clique numa imagem do texto
    page.addEventListener('click', e=>{ if(e.target.tagName === 'IMG') select({k:'b', el:e.target}); });
    document.addEventListener('mousedown', e=>{
      if(!T) return;
      if(e.target.closest('#imgbar,#imgOv,.himg,#orgGb,#tblPop')) return;   // #orgGb: grupo Organizar da guia Layout; #tblPop: seus menus
      if(e.target.tagName === 'IMG' && page.contains(e.target)) return;
      if(e.target.closest('#hfbar')) return;
      select(null);
    });
    sheet.addEventListener('mousedown', e=>{                       // com o cabeçalho aberto, clicar fora fecha
      if(editingHF() && !e.target.closest('.hf,.himg,#imgOv,#hfbar,#vruler') && window.__hfClose) window.__hfClose();
    });
    document.addEventListener('pointerdown', e=>{                  // clicar na imagem (ou na moldura dela) tira o cursor do texto: Delete apaga a imagem
      if(!T || !(e.target.closest && e.target.closest('#imgOv,.himg'))) return;
      const a = document.activeElement; if(a && a !== document.body && !/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) a.blur();
    }, true);
    document.addEventListener('keydown', e=>{
      if(e.key === 'Escape' && T && !editingHF()){ select(null); return; }
      if(!T || e.key !== 'Delete' && e.key !== 'Backspace') return;
      if(/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
      e.preventDefault(); del();
    });
    function del(){
      if(!T) return;
      if(T.k === 'h'){ hfData().imgs = hfImgs().filter(i=>i !== T.it); persist(); applyMar(); }
      else{ T.el.remove(); changed(); }
      select(null);
    }
    $('imAlt').addEventListener('input', ()=>{
      if(!T) return;
      if(T.k === 'h'){ T.it.alt=$('imAlt').value; persist(); }
      else{ T.el.setAttribute('alt',$('imAlt').value); changed(); }
    });
    $('imDel').addEventListener('click', del);
    $('imClose').addEventListener('click', ()=>select(null));
    bar.querySelectorAll('button').forEach(b=>b.addEventListener('mousedown', e=>e.preventDefault()));

    // ---- aplicar posição/tamanho
    function applyBox(g){
      if(T.k === 'h'){ Object.assign(T.it, g); persist(); hfLayers(); }
      else{
        const el = T.el;
        if('w' in g){ el.style.width = Math.round(g.w) + 'px'; el.style.height = $('imLock').checked ? 'auto' : Math.round(g.h) + 'px'; }
        if(isFloat(el)) bPos(el, g.x, g.y);
        changed();
      }
      update();
    }
    function setSize(w, h){
      const r = T.k === 'h' ? T.it : geom();
      if($('imLock').checked){ const k = r.h / r.w; if(w != null) h = w * k; else w = h / k; }
      applyBox({w:Math.max(8, w), h:Math.max(8, h)});
    }
    $('imW').addEventListener('change', e=>{ const v = parseFloat(e.target.value); if(v > 0 && T) setSize(v * CMPX, null); });
    $('imH').addEventListener('change', e=>{ const v = parseFloat(e.target.value); if(v > 0 && T) setSize(null, v * CMPX); });
    $('imOp').addEventListener('input', e=>{
      if(!T) return; const v = parseInt(e.target.value, 10) || 0;
      if(T.k === 'h'){ T.it.op = v; persist(); hfLayers(); } else{ T.el.style.opacity = v ? String(1 - v / 100) : ''; if(!T.el.getAttribute('style')) T.el.removeAttribute('style'); changed(); }
      $('imOpv').textContent = v + '%';
    });
    $('imWrap').addEventListener('change', e=>{
      if(!T) return; const v = e.target.value;
      if(T.k === 'h'){ T.it.z = v === 'front' ? 'front' : 'back'; persist(); applyMar(); update(); }
      else setWrap(T.el, v);
    });
    bar.querySelectorAll('[data-ia]').forEach(b=>b.addEventListener('click', ()=>{
      if(!T) return; const a = b.dataset.ia, e = effMar(), g = geom();
      const X = a === 'left' ? e.l : a === 'right' ? PGW() - e.r - g.w : (PGW() - g.w) / 2;
      if(T.k === 'h'){ applyBox({x:X}); return; }
      const w = wrapOf(T.el);
      if(w === 'behind' || w === 'front'){ applyBox({x:X}); return; }
      if(w === 'left' || w === 'right'){ setWrap(T.el, a === 'center' ? 'tb' : a); return; }
      if(w === 'tb'){ T.el.style.margin = a === 'left' ? '.5em auto .5em 0' : a === 'right' ? '.5em 0 .5em auto' : '.5em auto'; changed(); update(); return; }
      const blk = T.el.closest('p,div,h1,h2,h3,li,blockquote,td,th'); if(blk && page.contains(blk) && blk !== page){ blk.style.textAlign = a; changed(); update(); }
    }));
    bar.querySelectorAll('[data-iv]').forEach(b=>b.addEventListener('click', ()=>{
      if(!T) return; const g = geom(), a = b.dataset.iv;
      applyBox({y: a === 'top' ? 0 : a === 'bot' ? PGH() - g.h : (PGH() - g.h) / 2});
    }));
    $('imReset').addEventListener('click', async ()=>{
      if(!T) return;
      const src = T.k === 'h' ? T.it.src : T.el.src, im = await loadImg(src);
      let w = im.naturalWidth, h = im.naturalHeight; const W = contentW(), H = contentH();
      if(T.k === 'b'){ w = Math.min(w, W); h = im.naturalHeight * w / im.naturalWidth; if(h > H){ h = H; w = im.naturalWidth * h / im.naturalHeight; } }
      else{ w = Math.min(w, PGW()); h = im.naturalHeight * w / im.naturalWidth; }
      const lk = $('imLock').checked; $('imLock').checked = false; applyBox({w, h}); $('imLock').checked = lk;
      if(T.k === 'b') T.el.style.height = 'auto';
    });
    $('imFull').addEventListener('click', async ()=>{
      if(!T) return; const pg = pgOf(), PW = PGW(), PH = PGH();
      const cov = await coverCrop(T.k === 'h' ? T.it.src : T.el.src, pg.w / pg.h);
      if(T.k === 'h'){ Object.assign(T.it, {src:cov, x:0, y:0, w:PW, h:PH, z:'back', bg:true}); persist(); applyMar(); update(); return; }
      T.el.src = cov; setWrap(T.el, 'behind');
      T.el.style.width = Math.round(PW) + 'px'; T.el.style.height = Math.round(PH) + 'px'; bPos(T.el, 0, 0); changed(); update();
    });

    // ---- arrastar (mover) e puxar cantos (redimensionar)
    let drag = null;
    function startDrag(e, kind, hnd){
      if(!T) return; e.preventDefault(); e.stopPropagation();
      const g = geom(); drag = {kind, hnd, x0:e.clientX, y0:e.clientY, g, k:sc(), r:g.h / g.w, lock:$('imLock').checked};
      try{ e.target.setPointerCapture(e.pointerId); }catch(_){}
    }
    ov.querySelector('.mv').addEventListener('pointerdown', e=>startDrag(e, 'move'));
    ov.querySelectorAll('[data-h]').forEach(h=>h.addEventListener('pointerdown', e=>startDrag(e, 'size', h.dataset.h)));
    document.addEventListener('pointermove', e=>{
      if(!drag || !T) return;
      const dx = (e.clientX - drag.x0) / drag.k, dy = (e.clientY - drag.y0) / drag.k, g = drag.g;
      if(drag.kind === 'move'){ applyBox({x:g.x + dx, y:g.y + dy}); return; }
      const sx = drag.hnd.includes('e') ? 1 : -1, sy = drag.hnd.includes('s') ? 1 : -1, W = contentW();
      let w = Math.max(16, g.w + sx * dx), h = Math.max(16, g.h + sy * dy);
      if(T.k === 'b' && !isFloat(T.el)) w = Math.min(w, W);
      if(drag.lock) h = w * drag.r;
      const box = {w, h};
      if(T.k === 'h' || isFloat(T.el)){ box.x = g.x + (sx < 0 ? g.w - w : 0); box.y = g.y + (sy < 0 ? g.h - h : 0); }
      applyBox(box);
    });
    const endDrag = ()=>{ drag = null; };
    document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', endDrag);
    // arrastar direto uma imagem do cabeçalho/rodapé
    sheet.addEventListener('pointerdown', e=>{
      const im = e.target.closest && e.target.closest('.himg'); if(!im || !editingHF()) return;
      const it = hfImgList().find(i=>i.id === im.dataset.id); if(!it) return;
      select({k:'h', it}); startDrag(e, 'move');
    });

    // ---- lista "Selecionar imagem" (para as que ficam atrás do texto)
    const selImg = $('selImg');
    function fillList(){
      const items = [];
      [...page.querySelectorAll('img')].forEach((el, i)=>items.push({t:'Imagem ' + (i + 1) + ' (' + (BWRAP.find(x=>x[0] === wrapOf(el)) || [0, ''])[1].toLowerCase() + ')', run:()=>{ el.scrollIntoView({block:'center'}); select({k:'b', el}); }}));
      hfImgList().forEach((it, i)=>items.push({t:(it.bg ? 'Fundo da página' : 'Cabeçalho/rodapé — imagem ' + (i + 1)) + ' (' + (it.z === 'front' ? 'na frente' : 'atrás') + ')', run:()=>{ if(!editingHF() && window.__hfOpen) window.__hfOpen('h'); select({k:'h', it}); }}));
      selImg.innerHTML = '<option value="" selected disabled hidden>Selecionar imagem</option>' + items.map((x, i)=>'<option value="' + i + '">' + x.t.replace(/</g, '&lt;') + '</option>').join('') + (items.length ? '' : '<option disabled>(nenhuma imagem)</option>');
      selImg._items = items;
    }
    selImg.addEventListener('focus', fillList); selImg.addEventListener('mousedown', fillList);
    selImg.addEventListener('change', ()=>{ const x = selImg._items && selImg._items[+selImg.value]; selImg.selectedIndex = 0; if(x) x.run(); });
    fillList();
  })();
