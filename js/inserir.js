/* Verbus — Guia Inserir (ilustrações, mídia, links, comentários, WordArt etc.)
   (js/inserir.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ---------- Inserir no estilo do Word: Ilustrações, Mídia, Links, Comentários, Texto e Símbolos ----------
  (function(){
    const H = s=>String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const mk = (tag, cls, html)=>{ const n = document.createElement(tag); if(cls) n.className = cls; if(html != null) n.innerHTML = html; return n; };
    const store = {
      get(k, d){ try{ const v = localStorage.getItem(LS_KEYS[k]); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
      set(k, v){ try{ localStorage.setItem(LS_KEYS[k], JSON.stringify(v)); }catch(e){} }
    };
    const inPage = n=>!!(n && page.contains(n));
    const ins = html=>{ restore(); exec('insertHTML', html); };
    const rid = p=>p + Math.random().toString(36).slice(2, 8);
    function curRange(){ const s = getSelection(); if(s.rangeCount && inPage(s.anchorNode)) return s.getRangeAt(0); return savedRange; }
    function selText(){ const s = getSelection(); return (s.rangeCount && inPage(s.anchorNode) && !s.isCollapsed) ? s.toString() : (savedRange && !savedRange.collapsed ? savedRange.toString() : ''); }
    const elOf = n=>n && (n.nodeType === 1 ? n : n.parentNode);
    const blockOf = n=>{ const e = elOf(n); return e && e.closest ? e.closest('p,h1,h2,h3,h4,li,td,th,blockquote,div') : null; };
    function flash(el){ const b = el.closest ? (el.closest('p,h1,h2,h3,h4,li,td,th,blockquote') || el) : el; b.classList.add('vflash'); setTimeout(()=>b.classList.remove('vflash'), 1400); }
    function goTo(el){ el.scrollIntoView({block:'center', behavior:'smooth'}); flash(el); }
    const contentW = ()=>{ const m = effMar(); return Math.max(CMPX, pgOf().w * CMPX - m.l - m.r); };
    function pageOfEl(el){
      let t = el; while(t && t.parentNode !== page) t = t.parentNode;
      if(!t) return 1; const m = effMar(), use = Math.max(CMPX, pgOf().h * CMPX - m.t - m.b);
      return Math.max(1, Math.floor((t.offsetTop - m.t) / use) + 1);
    }
    function insImg(canvas, cssW){
      const w = Math.min(Math.round(cssW), Math.round(contentW()));
      const src = canvas.toDataURL('image/png');
      ins('<img src="' + src + '" style="width:' + w + 'px;height:auto">');
      setTimeout(()=>{ const im = [...page.querySelectorAll('img')].find(i=>i.getAttribute('src') === src); if(im) im.click(); }, 60);   // já deixa a imagem selecionada (barra Imagem)
    }

    // ----- menus (popup)
    let pop = null, cur = null;
    function closePop(){ if(pop){ pop.remove(); pop = null; } if(cur){ cur.setAttribute('aria-expanded', 'false'); cur = null; } document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', escK, true); }
    function outside(e){ if(pop && !pop.contains(e.target) && !(cur && cur.contains(e.target))) closePop(); }
    function escK(e){ if(e.key === 'Escape'){ e.preventDefault(); closePop(); } }
    // itens: '-' | {h:'Título'} | {t, f, dis} | {node:(close)=>Element}
    function menu(btn, list){
      if(cur === btn){ closePop(); return; }
      closePop(); pop = mk('div'); pop.id = 'tblPop'; pop.setAttribute('role', 'menu');
      list.forEach(it=>{
        if(it === '-'){ pop.appendChild(document.createElement('hr')); return; }
        if(it.h){ pop.appendChild(mk('div', 'mh', H(it.h))); return; }
        if(it.node){ pop.appendChild(it.node(closePop)); return; }
        const b = mk('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.textContent = it.t; if(it.dis) b.disabled = true;
        b.addEventListener('click', ()=>{ closePop(); it.f(); }); pop.appendChild(b);
      });
      pop.addEventListener('mousedown', e=>e.preventDefault());
      document.body.appendChild(pop);
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.max(4, Math.min(r.left, innerWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.max(4, Math.min(r.bottom + 2, innerHeight - pop.offsetHeight - 4)) + 'px';
      cur = btn; btn.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', escK, true);
    }
    const bind = (id, fn)=>{ const b = $(id); b.addEventListener('mousedown', e=>e.preventDefault()); b.addEventListener('click', ()=>fn(b)); };

    // ----- janelas
    function dlg(title, body, ok, onOk, o){
      o = o || {}; closePop();
      const d = mk('dialog', 'vdlg'); if(o.w) d.style.width = o.w;
      d.innerHTML = '<h3>' + H(title) + '</h3>' + body + '<p class="vmsg" role="alert"></p><div class="dlgrow" style="justify-content:flex-end">' + (o.extra || '') + '<button type="button" data-c>' + (o.cancel || 'Cancelar') + '</button>' + (ok ? '<button type="button" data-ok class="vok">' + H(ok) + '</button>' : '') + '</div>';
      document.body.appendChild(d);
      const msg = d.querySelector('.vmsg'), q = s=>d.querySelector(s);
      d.addEventListener('close', ()=>{ if(d.isConnected && !d.open) d.remove(); });
      q('[data-c]').onclick = ()=>d.close();
      const reopen = ()=>{ try{ d.showModal(); }catch(e){ d.setAttribute('open', ''); } };
      const go = async ()=>{
        if(o.noClose){ const r = await onOk(d, q); if(typeof r === 'string') msg.textContent = r; else if(r !== false) d.close(); return; }
        d.close();                                  // o documento fica "inerte" enquanto a janela modal está aberta: fecha antes de inserir
        let r; try{ r = onOk(d, q); }catch(e){ r = 'Erro: ' + e.message; }
        if(r === false || typeof r === 'string'){ reopen(); if(typeof r === 'string') msg.textContent = r; return; }
        d.remove();
      };
      if(ok){
        q('[data-ok]').onclick = go;
        d.addEventListener('keydown', e=>{ if(e.key === 'Enter' && !e.shiftKey && /^(INPUT)$/.test(e.target.tagName)){ e.preventDefault(); go(); } });
      }
      try{ d.showModal(); }catch(e){ d.setAttribute('open', ''); }
      const f = q('[autofocus]') || q('input[type=text],textarea,select'); if(f) f.focus();
      return d;
    }
    const show = (el, on)=>{ el.style.display = on ? '' : 'none'; };

    // =====================================================================  LINKS
    const REFRE = /^#(bkm|tit|ref)-/;
    function anchorAt(){ const r = curRange(); if(!r) return null; const e = elOf(r.startContainer), a = e && e.closest ? e.closest('a[href]') : null; return a && inPage(a) ? a : null; }
    function targets(){
      const out = [];
      page.querySelectorAll('[data-bkm]').forEach(b=>out.push({k:'Indicador', n:b.dataset.bkm, el:b}));
      page.querySelectorAll('h1,h2,h3').forEach(h=>{ if(h.closest('.fnotes,.endnotes')) return; const t = h.textContent.replace(/​/g, '').trim(); if(t) out.push({k:'Título', n:t, el:h}); });
      return out;
    }
    function idFor(el){ if(el.dataset.bkm) return 'bkm-' + el.dataset.bkm; if(!el.id) el.id = rid(el.tagName[0] === 'H' ? 'tit-' : 'ref-'); return el.id; }
    page.addEventListener('click', e=>{
      const a = e.target.closest && e.target.closest('a[href^="#"]'); if(!a || !REFRE.test(a.getAttribute('href'))) return;
      e.preventDefault();
      if(e.ctrlKey || e.metaKey){ const el = document.getElementById(a.getAttribute('href').slice(1)); if(el && inPage(el)) goTo(el); }
    });
    bind('btnLink', ()=>{
      const ex = anchorAt(), had = selText(), hr = ex ? ex.getAttribute('href') : '';
      const tg = targets();
      const d = dlg('Inserir Hiperlink',
        '<div class="fdGrid"><label class="full">Texto a exibir<input type="text" id="hlTxt"></label>' +
        '<label class="full">Vincular a<select id="hlKind"><option value="web">Página da Web ou arquivo</option><option value="doc">Neste documento</option><option value="mail">Endereço de e-mail</option></select></label>' +
        '<label class="full" data-k="web">Endereço<input type="text" id="hlUrl" placeholder="https://"></label>' +
        '<label class="full" data-k="doc">Local no documento<select id="hlDoc">' + (tg.length ? tg.map((t, i)=>'<option value="' + i + '">' + H(t.k + ': ' + t.n) + '</option>').join('') : '<option value="">(Nenhum indicador ou título. Use Inserir > Indicador.)</option>') + '</select></label>' +
        '<label data-k="mail">Endereço de e-mail<input type="text" id="hlMail"></label><label data-k="mail">Assunto<input type="text" id="hlSub"></label></div>' +
        '<p style="color:var(--muted);font-size:12px;margin:0">Para abrir um link dentro do Verbus, use Ctrl + clique.</p>',
        'OK', (dd, q)=>{
          const kind = q('#hlKind').value, txt = q('#hlTxt').value.trim(); let href, ext = true;
          if(kind === 'web'){ const v = q('#hlUrl').value.trim(); if(!v) return 'Informe o endereço.'; href = /^(https?:|mailto:|tel:|ftp:|file:)/i.test(v) ? v : 'https://' + v; }
          else if(kind === 'doc'){ const t = tg[+q('#hlDoc').value]; if(!t) return 'Escolha um local do documento.'; href = '#' + idFor(t.el); ext = false; }
          else{ const m = q('#hlMail').value.trim(); if(!m) return 'Informe o e-mail.'; const s = q('#hlSub').value.trim(); href = 'mailto:' + m + (s ? '?subject=' + encodeURIComponent(s) : ''); }
          if(ex && inPage(ex)){
            ex.setAttribute('href', href); if(txt && txt !== ex.textContent) ex.textContent = txt;
            if(ext) { ex.target = '_blank'; ex.rel = 'noopener'; } else { ex.removeAttribute('target'); ex.removeAttribute('rel'); }
            changed(); refresh(); return;
          }
          const label = txt || had || href.replace(/^mailto:/, '').replace(/\?.*$/, '');
          restore();
          if(had && txt === had){
            exec('createLink', href);
            [...page.querySelectorAll('a')].filter(a=>a.getAttribute('href') === href).forEach(a=>{ if(ext){ a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); a.removeAttribute('rel'); } });
          }else exec('insertHTML', '<a href="' + H(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + H(label) + '</a>');
        }, {extra: ex ? '<button type="button" data-rm style="margin-right:auto">Remover link</button>' : ''});
      const q = s=>d.querySelector(s);
      const sync = ()=>{ const k = q('#hlKind').value; d.querySelectorAll('[data-k]').forEach(l=>show(l, l.dataset.k === k)); };
      q('#hlKind').addEventListener('change', sync);
      q('#hlTxt').value = ex ? ex.textContent : had;
      if(ex){
        if(hr.startsWith('mailto:')){ q('#hlKind').value = 'mail'; const m = hr.slice(7).split('?'); q('#hlMail').value = m[0]; const s = /subject=([^&]*)/.exec(m[1] || ''); if(s) q('#hlSub').value = decodeURIComponent(s[1]); }
        else if(hr.startsWith('#')){ q('#hlKind').value = 'doc'; const i = tg.findIndex(t=>('#' + idFor(t.el)) === hr); if(i >= 0) q('#hlDoc').value = String(i); }
        else q('#hlUrl').value = hr;
        q('[data-rm]').onclick = ()=>{ d.close(); restore(); const r = document.createRange(); r.selectNodeContents(ex); const s = getSelection(); s.removeAllRanges(); s.addRange(r); exec('unlink'); };
      }
      sync();
    });

    document.addEventListener('keydown', e=>{ if((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k' && inPage(document.activeElement) || (e.ctrlKey && e.key.toLowerCase() === 'k' && document.activeElement === page)){ e.preventDefault(); $('btnLink').click(); } }, true);
    bind('btnBkm', ()=>{
      const d = dlg('Indicador',
        '<label>Nome do indicador<input type="text" id="bkName" placeholder="ex.: Conclusao" autocomplete="off"></label>' +
        '<label>Indicadores do documento<select id="bkList" size="7"></select></label>' +
        '<p style="color:var(--muted);font-size:12px;margin:0 0 8px">O indicador é colocado onde está o cursor. O nome começa com letra e pode ter letras, números e _ (sem espaços).</p>' +
        '<div class="dlgrow"><button type="button" data-add class="vok">Adicionar</button><button type="button" data-go>Ir para</button><button type="button" data-del>Excluir</button></div>',
        null, null, {cancel:'Fechar'});
      const q = s=>d.querySelector(s), sel = q('#bkList'), inp = q('#bkName'), msg = q('.vmsg');
      const fill = ()=>{ const l = [...page.querySelectorAll('[data-bkm]')].map(b=>b.dataset.bkm).sort((a, b)=>a.localeCompare(b, 'pt-BR')); sel.innerHTML = l.map(n=>'<option>' + H(n) + '</option>').join(''); };
      fill();
      sel.addEventListener('change', ()=>{ inp.value = sel.value; });
      sel.addEventListener('dblclick', ()=>q('[data-go]').click());
      const find = n=>[...page.querySelectorAll('[data-bkm]')].find(b=>b.dataset.bkm === n);
      q('[data-add]').onclick = ()=>{
        const n = inp.value.trim();
        if(!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_]*$/.test(n)){ msg.textContent = 'Nome inválido: comece com letra e use só letras, números e _.'; return; }
        const r = curRange(); if(!r){ msg.textContent = 'Clique no texto onde o indicador deve ficar e abra a janela de novo.'; return; }
        const old = find(n); if(old) old.remove();
        const sp = mk('span', 'bkm', '​'); sp.dataset.bkm = n; sp.id = 'bkm-' + n;
        const rr = r.cloneRange(); rr.collapse(true); rr.insertNode(sp);
        changed(); fill(); sel.value = n; msg.textContent = 'Indicador "' + n + '" adicionado.';
      };
      q('[data-go]').onclick = ()=>{ const b = find(sel.value || inp.value.trim()); if(!b){ msg.textContent = 'Escolha um indicador da lista.'; return; } d.close(); goTo(b); };
      q('[data-del]').onclick = ()=>{ const b = find(sel.value || inp.value.trim()); if(!b){ msg.textContent = 'Escolha um indicador da lista.'; return; } b.remove(); changed(); fill(); inp.value = ''; msg.textContent = 'Indicador excluído.'; };
      inp.focus();
    });

    bind('btnXref', ()=>{
      const KIND = {
        bkm: {n:'Indicador', what:[['name', 'Nome do indicador'], ['page', 'Número da página']], list:()=>[...page.querySelectorAll('[data-bkm]')].map(b=>({t:b.dataset.bkm, el:b}))},
        tit: {n:'Título', what:[['text', 'Texto do título'], ['page', 'Número da página']], list:()=>[...page.querySelectorAll('h1,h2,h3')].filter(h=>!h.closest('.fnotes,.endnotes') && h.textContent.replace(/​/g, '').trim()).map(h=>({t:h.textContent.trim(), el:h}))},
        fn: {n:'Nota de rodapé', what:[['num', 'Número da nota'], ['page', 'Número da página']], list:()=>[...page.querySelectorAll('sup.fn')].filter(x=>!x.closest('.fnotes')).map((s, i)=>({t:'Nota ' + (s.textContent.trim() || (i + 1)), el:s, num:s.textContent.trim() || String(i + 1)}))}
      };
      ['Figura', 'Tabela', 'Quadro', 'Gráfico', 'Equação'].forEach(t=>{
        const l = [...page.querySelectorAll('p.leg')].filter(p=>(p.dataset.t || 'Figura') === t);
        if(l.length) KIND['c' + t] = {n:t, what:[['lab', 'Rótulo e número'], ['full', 'Legenda inteira'], ['page', 'Número da página']], list:()=>l.map(p=>{ const x = p.textContent.trim(), m = /^(\S+\s+\d+)/.exec(x); return {t:x, el:p, lab:m ? m[1] : x}; })};
      });
      const d = dlg('Referência Cruzada',
        '<div class="fdGrid"><label>Tipo de referência<select id="xrKind">' + Object.keys(KIND).map(k=>'<option value="' + k + '">' + KIND[k].n + '</option>').join('') + '</select></label>' +
        '<label>Inserir referência para<select id="xrWhat"></select></label></div>' +
        '<label style="margin-top:8px">Para qual item<select id="xrList" size="7"></select></label>' +
        '<label style="flex-direction:row;align-items:center;gap:8px;color:var(--ink)"><input type="checkbox" id="xrLink" checked> Inserir como hiperlink (Ctrl + clique para ir até o local)</label>' +
        '<p style="color:var(--muted);font-size:12px;margin:0">O número da página é gravado no momento da inserção; se o texto mudar, insira de novo.</p>',
        'Inserir', (dd, q)=>{
          const K = KIND[q('#xrKind').value], it = K.list()[+q('#xrList').value]; if(!it) return 'Escolha um item da lista.';
          const w = q('#xrWhat').value; let txt;
          if(w === 'page') txt = String(pageOfEl(it.el)); else if(w === 'num') txt = it.num; else if(w === 'lab') txt = it.lab; else txt = it.t;
          if(q('#xrLink').checked) ins('<a href="#' + idFor(it.el) + '">' + H(txt) + '</a>'); else ins(H(txt));
        });
      const q = s=>d.querySelector(s);
      const fill = ()=>{ const K = KIND[q('#xrKind').value]; q('#xrWhat').innerHTML = K.what.map(([v, t])=>'<option value="' + v + '">' + t + '</option>').join(''); const l = K.list(); q('#xrList').innerHTML = l.map((x, i)=>'<option value="' + i + '">' + H(x.t.length > 70 ? x.t.slice(0, 70) + '…' : x.t) + '</option>').join(''); if(l.length) q('#xrList').value = '0'; };
      q('#xrKind').addEventListener('change', fill); fill();
    });

    // =====================================================================  COMENTÁRIOS
    const pane = mk('aside'); pane.id = 'cmtPane'; pane.hidden = true;
    pane.innerHTML = '<div class="ch"><b>Comentários</b><button type="button" data-x title="Fechar" aria-label="Fechar">✕</button></div><div class="cl"></div>';
    document.body.appendChild(pane);
    const cList = pane.querySelector('.cl');
    const fmtD = iso=>{ try{ return new Date(iso).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}); }catch(e){ return ''; } };
    const syncTitle = c=>{ c.title = (c.dataset.a || 'Autor') + ': ' + (c.dataset.t || ''); };
    function renderCmt(){
      const cs = [...page.querySelectorAll('.cmt')];
      cList.innerHTML = '';
      if(!cs.length){ cList.appendChild(mk('p', 'empty', 'Nenhum comentário. Selecione um trecho e use Inserir > Comentário.')); return; }
      cs.forEach(c=>{
        const card = mk('div', 'cc'); card.dataset.id = c.dataset.cmt;
        const q = c.textContent.replace(/​/g, '').trim();
        card.innerHTML = '<div class="cm"><b>' + H(c.dataset.a || 'Autor') + '</b> <small>' + H(fmtD(c.dataset.d)) + '</small></div><div class="cq">“' + H(q.length > 70 ? q.slice(0, 70) + '…' : q) + '”</div><div class="ct">' + H(c.dataset.t || '') + '</div><div class="ca"><button type="button" data-e>Editar</button><button type="button" data-d>Excluir</button></div>';
        card.addEventListener('click', e=>{ if(e.target.closest('button,textarea')) return; goTo(c); });
        card.querySelector('[data-d]').onclick = ()=>{ while(c.firstChild) c.parentNode.insertBefore(c.firstChild, c); c.remove(); changed(); renderCmt(); };
        card.querySelector('[data-e]').onclick = ()=>{
          const t = card.querySelector('.ct'), ta = mk('textarea'); ta.value = c.dataset.t || ''; t.replaceWith(ta); ta.focus();
          const a = card.querySelector('.ca'); a.innerHTML = '<button type="button" data-s class="vok">Salvar</button><button type="button" data-c>Cancelar</button>';
          a.querySelector('[data-s]').onclick = ()=>{ const v = ta.value.trim(); if(v){ c.dataset.t = v; syncTitle(c); changed(); } renderCmt(); };
          a.querySelector('[data-c]').onclick = renderCmt;
        };
        cList.appendChild(card);
      });
    }
    let cmo = null;
    function openCmt(on){
      pane.hidden = !on;
      if(on){ renderCmt(); if(!cmo){ let t = 0; cmo = new MutationObserver(()=>{ if(pane.hidden || pane.querySelector('textarea')) return; clearTimeout(t); t = setTimeout(renderCmt, 400); }); cmo.observe(page, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['data-t']}); } }
    }
    pane.querySelector('[data-x]').onclick = ()=>openCmt(false);
    page.addEventListener('click', e=>{ const c = e.target.closest && e.target.closest('.cmt'); if(!c || pane.hidden) return; const card = cList.querySelector('[data-id="' + c.dataset.cmt + '"]'); if(card){ cList.querySelectorAll('.cc.on').forEach(x=>x.classList.remove('on')); card.classList.add('on'); card.scrollIntoView({block:'nearest'}); } });
    function newCmt(){
      restore(); const s = getSelection(); let r = s.rangeCount && inPage(s.anchorNode) ? s.getRangeAt(0) : savedRange;
      if(r && r.collapsed && s.modify){ try{ s.removeAllRanges(); s.addRange(r); s.modify('move', 'backward', 'word'); s.modify('extend', 'forward', 'word'); r = s.getRangeAt(0); }catch(e){} }
      if(!r || r.collapsed || !inPage(r.commonAncestorContainer)){ alert('Selecione o texto que você quer comentar.'); return; }
      r = r.cloneRange();
      const b = blockOf(r.startContainer);
      if(b && b !== page && blockOf(r.endContainer) !== b){ r.setEnd(b, b.childNodes.length); }
      const tmp = document.createElement('div'); tmp.appendChild(r.cloneContents()); const inner = tmp.innerHTML;
      const d = dlg('Novo Comentário',
        '<div class="cq" style="margin-bottom:8px">“' + H(r.toString().slice(0, 120)) + '”</div><label>Comentário<textarea id="cmTxt" rows="4" autofocus></textarea></label><label>Autor<input type="text" id="cmAut"></label>',
        'Comentar', (dd, q)=>{
          const t = q('#cmTxt').value.trim(); if(!t) return 'Escreva o comentário.';
          const a = q('#cmAut').value.trim() || 'Autor'; store.set('autor', a);
          page.focus(); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r);
          const id = rid('c');
          exec('insertHTML', '<span class="cmt" data-cmt="' + id + '" data-a="' + H(a) + '" data-d="' + new Date().toISOString() + '" data-t="' + H(t) + '" title="' + H(a + ': ' + t) + '">' + inner + '</span>');
          openCmt(true);
        });
      d.querySelector('#cmAut').value = store.get('autor', '');
    }
    bind('btnCmt', newCmt); bind('btnCmtNew2', newCmt);
    bind('btnCmtShow', ()=>openCmt(pane.hidden));
    // Revisão: Excluir, Anterior e Próxima (comentários) e o botão Idioma
    const cmtAll = ()=>Array.from(page.querySelectorAll('.cmt[data-cmt]'));
    const cmtAtCursor = ()=>{ const s = getSelection(); const n = s.anchorNode; const el = n && (n.nodeType === 1 ? n : n.parentElement); return el && el.closest && inPage(el) ? el.closest('.cmt') : null; };
    function cmtGo(dir){
      const all = cmtAll(); if(!all.length){ alert('Este documento não tem comentários.'); return; }
      restore(); const cur = cmtAtCursor(); let i;
      if(cur){ i = all.indexOf(cur) + dir; }
      else {
        const s = getSelection(); const r = s.rangeCount ? s.getRangeAt(0) : null; i = dir > 0 ? 0 : all.length - 1;
        if(r) for(let k = 0; k < all.length; k++){ const after = all[k].compareDocumentPosition(r.startContainer) & Node.DOCUMENT_POSITION_PRECEDING; if(dir > 0 && after){ i = k; break; } if(dir < 0 && !after) i = k; }
      }
      i = (i + all.length) % all.length; const c = all[i];
      page.focus(); const sl = getSelection(), rg = document.createRange(); rg.selectNodeContents(c); sl.removeAllRanges(); sl.addRange(rg);
      c.scrollIntoView({block:'center', behavior:'smooth'});
      if(!pane.hidden){ const card = cList.querySelector('[data-id="' + c.dataset.cmt + '"]'); if(card){ cList.querySelectorAll('.cc.on').forEach(x=>x.classList.remove('on')); card.classList.add('on'); card.scrollIntoView({block:'nearest'}); } }
    }
    bind('btnCmtPrev', ()=>cmtGo(-1)); bind('btnCmtNext', ()=>cmtGo(1));
    bind('btnCmtDel', ()=>{
      restore(); const c = cmtAtCursor();
      if(!c){ alert(cmtAll().length ? 'Clique dentro do comentário que você quer excluir (ou use Anterior/Próxima para chegar nele).' : 'Este documento não tem comentários.'); return; }
      const par = c.parentNode; while(c.firstChild) par.insertBefore(c.firstChild, c); c.remove(); par.normalize(); changed(); if(!pane.hidden) renderCmt();
    });
    bind('btnLangRev', ()=>$('btnRev').click());


    // =====================================================================  ILUSTRAÇÕES
    // ----- Imagens ▾ e Imagens Online
    bind('btnImg', b=>{
      const sel = $('selImg'); try{ sel.dispatchEvent(new Event('focus')); }catch(e){}
      const its = sel._items || [];
      const list = [{t:'Este Dispositivo… (imagem ou PDF)', f:()=>$('fileImg').click()}, {t:'Imagem no Cabeçalho…', f:()=>$('btnImgHF').click()}, {t:'Imagem no Rodapé…', f:()=>$('btnImgFT').click()}, '-', {h:'Selecionar imagem do documento'}];
      if(its.length) its.forEach(x=>list.push({t:x.t, f:()=>x.run()})); else list.push({t:'(nenhuma imagem no documento)', dis:true, f:()=>{}});
      menu(b, list);
    });
    bind('btnImgOn', ()=>{
      dlg('Imagens Online',
        '<label>Endereço da imagem (URL)<input type="text" id="ioUrl" placeholder="https://…/foto.jpg" autocomplete="off"></label>' +
        '<p style="color:var(--muted);font-size:12px;margin:0">Cole o endereço de uma imagem da internet; ela é copiada para dentro do documento. Alguns sites não deixam copiar; nesse caso, salve a imagem no computador e use <b>Imagens</b>.</p>',
        'Inserir', async (d, q)=>{
          const u = q('#ioUrl').value.trim(); if(!/^https?:\/\//i.test(u)) return 'Informe um endereço que comece com http:// ou https://.';
          q('.vmsg').textContent = 'Baixando…';
          try{
            const res = await fetch(u, {mode:'cors'}); if(!res.ok) throw 0;
            const bl = await res.blob(); if(!/^image\//.test(bl.type)) return 'O endereço não é de uma imagem.';
            d.close(); window.__insImgFile(bl);
          }catch(e){ return 'Não foi possível copiar essa imagem (o site não permite). Salve-a no computador e use Imagens.'; }
          return false;
        }, {noClose:true});
    });

    // ----- Formas
    const star = (n, R, r)=>{ let p = ''; for(let i = 0; i < n * 2; i++){ const a = -Math.PI / 2 + i * Math.PI / n, k = i % 2 ? r : R; p += (i ? 'L' : 'M') + (50 + k * Math.cos(a)).toFixed(1) + ' ' + (50 + k * Math.sin(a)).toFixed(1); } return p + 'Z'; };
    const SHAPES = [
      {n:'Retângulo', d:'M5 20H95V80H5Z', s:[180, 110]}, {n:'Retângulo arredondado', d:'M20 20H80A15 15 0 0 1 95 35V65A15 15 0 0 1 80 80H20A15 15 0 0 1 5 65V35A15 15 0 0 1 20 20Z', s:[180, 110]},
      {n:'Elipse', d:'M5 50A45 35 0 1 0 95 50A45 35 0 1 0 5 50Z', s:[170, 110]}, {n:'Triângulo', d:'M50 8L95 90H5Z'}, {n:'Triângulo retângulo', d:'M10 90V10L90 90Z'},
      {n:'Losango', d:'M50 5L95 50L50 95L5 50Z'}, {n:'Pentágono', d:'M50 5L96 38L78 92H22L4 38Z'}, {n:'Hexágono', d:'M26 8H74L98 50L74 92H26L2 50Z'},
      {n:'Estrela de 4 pontas', d:star(4, 46, 14)}, {n:'Estrela de 5 pontas', d:star(5, 47, 19)}, {n:'Estrela de 6 pontas', d:star(6, 47, 25)},
      {n:'Seta para a direita', d:'M5 35H58V12L95 50L58 88V65H5Z', s:[170, 100]}, {n:'Seta para a esquerda', d:'M95 35H42V12L5 50L42 88V65H95Z', s:[170, 100]},
      {n:'Seta para cima', d:'M35 95V42H12L50 5L88 42H65V95Z'}, {n:'Seta para baixo', d:'M35 5V58H12L50 95L88 58H65V5Z'}, {n:'Seta dupla', d:'M5 50L30 22V38H70V22L95 50L70 78V62H30V78Z', s:[180, 90]},
      {n:'Divisa', d:'M5 15H60L95 50L60 85H5L40 50Z', s:[160, 100]}, {n:'Cruz', d:'M35 5H65V35H95V65H65V95H35V65H5V35H35Z'},
      {n:'Coração', d:'M50 90C10 60 5 35 25 20C38 11 48 18 50 28C52 18 62 11 75 20C95 35 90 60 50 90Z'}, {n:'Balão de fala', d:'M10 10H90V65H45L25 90V65H10Z', s:[170, 120]},
      {n:'Nuvem', d:'M25 78A18 18 0 0 1 22 42A22 22 0 0 1 62 30A20 20 0 0 1 85 54A15 15 0 0 1 78 78Z', s:[170, 120]},
      {n:'Linha', d:'M5 50H95', line:1, s:[180, 30]}, {n:'Seta de linha', d:'M5 50H90M74 33L92 50L74 67', line:1, s:[180, 40]}, {n:'Linha diagonal', d:'M5 95L95 5', line:1, s:[120, 120]}
    ];
    const SCOL = [['#4472c4', '#2f528f'], ['#ed7d31', '#ae5a21'], ['#a5a5a5', '#787878'], ['#ffc000', '#bc8c00'], ['#5b9bd5', '#41719c'], ['#70ad47', '#507e32'], ['#c00000', '#800000'], ['#ffffff', '#000000'], ['#000000', '#000000']];
    let sci = store.get('formaCor', 0); if(!(sci >= 0 && sci < SCOL.length)) sci = 0;
    function drawShape(sh, S, withPad){
      const [w, h] = sh.s || [120, 120], pad = 4, cv = document.createElement('canvas');
      cv.width = Math.round((w + pad * 2) * S); cv.height = Math.round((h + pad * 2) * S);
      const g = cv.getContext('2d'); g.scale(S, S);
      const p = new Path2D(); p.addPath(new Path2D(sh.d), new DOMMatrix([w / 100, 0, 0, h / 100, pad, pad]));
      const [f, st] = SCOL[sci];
      if(!sh.line){ g.fillStyle = f; g.fill(p); }
      g.strokeStyle = sh.line ? (f === '#ffffff' ? '#000' : f) : st; g.lineWidth = sh.line ? 2.5 : 2; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(p);
      return {cv, w: w + pad * 2};
    }
    bind('btnShapes', b=>menu(b, [
      {h:'Cor'},
      {node:()=>{
        const row = mk('div', 'swr');
        SCOL.forEach(([f, s], i)=>{ const x = mk('button'); x.type = 'button'; x.title = 'Cor ' + (i + 1); x.style.background = f; x.style.borderColor = s; if(i === sci) x.classList.add('on'); x.addEventListener('click', ()=>{ sci = i; store.set('formaCor', i); row.querySelectorAll('button').forEach((y, j)=>y.classList.toggle('on', j === i)); }); row.appendChild(x); });
        return row;
      }},
      {h:'Formas básicas, setas e linhas'},
      {node:close=>{
        const g = mk('div', 'gal'); g.style.gridTemplateColumns = 'repeat(6,36px)';
        SHAPES.forEach(sh=>{
          const x = mk('button'); x.type = 'button'; x.title = sh.n; x.setAttribute('aria-label', sh.n);
          const pv = drawShape(sh, 1).cv; pv.style.cssText = 'max-width:26px;max-height:26px'; x.appendChild(pv);
          x.addEventListener('click', ()=>{ close(); const r = drawShape(sh, 3); insImg(r.cv, r.w); });
          g.appendChild(x);
        });
        return g;
      }}
    ]));

    // ----- desenho em canvas (SmartArt e Gráfico)
    const FONT = 'Calibri,"Segoe UI",Arial,sans-serif';
    const mixW = (hex, t)=>{ const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v=>Math.round(v + (255 - v) * t)); return 'rgb(' + c.join(',') + ')'; };
    const dark = hex=>{ const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v=>Math.round(v * .7)); return 'rgb(' + c.join(',') + ')'; };
    function rrect(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function wrap(g, t, maxW){ const ws = String(t).split(/\s+/).filter(Boolean), out = []; let l = ''; for(const w of ws){ const c = l ? l + ' ' + w : w; if(g.measureText(c).width > maxW && l){ out.push(l); l = w; } else l = c; } if(l) out.push(l); return out; }
    function boxText(g, t, x, y, w, h, color, fs0){
      let fs = fs0 || 20, lines;
      for(;;){ g.font = fs + 'px ' + FONT; lines = wrap(g, t, w - 12); if((lines.length * fs * 1.2 <= h - 8 && lines.every(l=>g.measureText(l).width <= w - 8)) || fs <= 8) break; fs -= 1; }
      g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
      const th = lines.length * fs * 1.2; lines.forEach((l, i)=>g.fillText(l, x + w / 2, y + h / 2 - th / 2 + fs * 1.2 * (i + .5)));
    }
    function arrow(g, x1, y1, x2, y2, col, hs){
      hs = hs || 9; const a = Math.atan2(y2 - y1, x2 - x1);
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * hs * .6, y2 - Math.sin(a) * hs * .6); g.stroke();
      g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - hs * Math.cos(a - .45), y2 - hs * Math.sin(a - .45)); g.lineTo(x2 - hs * Math.cos(a + .45), y2 - hs * Math.sin(a + .45)); g.closePath(); g.fill();
    }
    function parseTree(items){
      const nodes = items.map(l=>{ const m = /^[ \t]*/.exec(l)[0]; return {t:l.trim(), lv:m.replace(/\t/g, '  ').length >> 1, k:[]}; });
      const root = nodes[0]; const st = [root]; root.lv = 0;
      for(let i = 1; i < nodes.length; i++){ const n = nodes[i]; n.lv = Math.max(1, n.lv); while(st.length > n.lv) st.pop(); while(st.length < n.lv) st.push(st[st.length - 1].k[st[st.length - 1].k.length - 1] || st[st.length - 1]); st[st.length - 1].k.push(n); st.push(n); }
      return root;
    }
    function drawSmart(kind, lines, col, S){
      const items = lines.map(s=>s.replace(/\s+$/, '')).filter(s=>s.trim());
      const W = 560; let H0 = 260; const n = items.length || 1;
      let plan = null;
      const tx = items.map(s=>s.trim());
      if(kind === 'lista'){ const cols = Math.min(3, n), rows = Math.ceil(n / cols); H0 = Math.max(120, rows * 96 + 24); }
      else if(kind === 'ciclo') H0 = 380;
      else if(kind === 'hier'){ const root = items.length ? parseTree(items) : {t:'', k:[]}; let depth = 1, leaves = 0; (function w(x, d){ depth = Math.max(depth, d); if(!x.k.length) leaves++; x.k.forEach(c=>w(c, d + 1)); })(root, 1); plan = {root, depth, leaves}; H0 = depth * 86 + 24; }
      else if(kind === 'pirm') H0 = Math.max(200, n * 62 + 20);
      else if(kind === 'matriz'){ H0 = Math.max(200, Math.ceil(n / 2) * 110 + 20); }
      else H0 = n > 4 ? 200 : 170;
      const cv = document.createElement('canvas'); cv.width = W * S; cv.height = H0 * S; const g = cv.getContext('2d'); g.scale(S, S);
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H0);
      if(!items.length){ g.fillStyle = '#888'; g.font = '16px ' + FONT; g.textAlign = 'center'; g.fillText('Escreva os itens ao lado', W / 2, H0 / 2); return cv; }
      if(kind === 'lista'){
        const cols = Math.min(3, n), gap = 16, bw = (W - 24 - gap * (cols - 1)) / cols, bh = 80;
        tx.forEach((t, i)=>{ const c = i % cols, r = Math.floor(i / cols), x = 12 + c * (bw + gap), y = 12 + r * (bh + gap); rrect(g, x, y, bw, bh, 8); g.fillStyle = col; g.fill(); g.strokeStyle = dark(col); g.lineWidth = 2; g.stroke(); boxText(g, t, x, y, bw, bh, '#fff', 20); });
      }else if(kind === 'proc'){
        const gap = 28, bw = (W - 24 - gap * (n - 1)) / n, bh = n > 4 ? 120 : 90, y = (H0 - bh) / 2;
        tx.forEach((t, i)=>{ const x = 12 + i * (bw + gap); rrect(g, x, y, bw, bh, 8); g.fillStyle = col; g.fill(); g.strokeStyle = dark(col); g.lineWidth = 2; g.stroke(); boxText(g, t, x, y, bw, bh, '#fff', 20); if(i < n - 1) arrow(g, x + bw + 4, H0 / 2, x + bw + gap - 4, H0 / 2, dark(col), 11); });
      }else if(kind === 'etapas'){
        const ov = 18, bw = (W - 24 + ov * (n - 1)) / n, bh = n > 4 ? 120 : 90, y = (H0 - bh) / 2, pt = 26;
        tx.forEach((t, i)=>{ const x = 12 + i * (bw - ov); g.beginPath(); g.moveTo(x, y); g.lineTo(x + bw - pt, y); g.lineTo(x + bw, y + bh / 2); g.lineTo(x + bw - pt, y + bh); g.lineTo(x, y + bh); if(i) g.lineTo(x + pt, y + bh / 2); g.closePath(); g.fillStyle = i % 2 ? mixW(col, .2) : col; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); boxText(g, t, x + (i ? pt : 4), y, bw - pt * (i ? 2 : 1) - 4, bh, '#fff', 20); });
      }else if(kind === 'ciclo'){
        const cx = W / 2, cy = H0 / 2, R = 135, bw = 128, bh = 54, pts = tx.map((t, i)=>{ const a = -Math.PI / 2 + i * 2 * Math.PI / n; return {x:cx + R * 1.35 * Math.cos(a), y:cy + R * Math.sin(a)}; });
        if(n > 1) pts.forEach((p, i)=>{ const q = pts[(i + 1) % n]; const a = Math.atan2(q.y - p.y, q.x - p.x); const k = Math.min(Math.abs(Math.cos(a)) > .01 ? (bw / 2 + 6) / Math.abs(Math.cos(a)) : 1e9, Math.abs(Math.sin(a)) > .01 ? (bh / 2 + 6) / Math.abs(Math.sin(a)) : 1e9); arrow(g, p.x + Math.cos(a) * k, p.y + Math.sin(a) * k, q.x - Math.cos(a) * k, q.y - Math.sin(a) * k, dark(col), 11); });
        pts.forEach((p, i)=>{ rrect(g, p.x - bw / 2, p.y - bh / 2, bw, bh, 12); g.fillStyle = col; g.fill(); g.strokeStyle = dark(col); g.lineWidth = 2; g.stroke(); boxText(g, tx[i], p.x - bw / 2, p.y - bh / 2, bw, bh, '#fff', 18); });
      }else if(kind === 'hier'){
        const {root, leaves} = plan, bw = Math.min(130, (W - 24) / leaves - 12), bh = 52, gx = (W - 24) / leaves;
        let li = 0; const pos = new Map();
        (function lay(x, d){ if(!x.k.length){ pos.set(x, {x:12 + gx * (li + .5), y:12 + d * 86}); li++; } else { x.k.forEach(c=>lay(c, d + 1)); const a = pos.get(x.k[0]).x, b = pos.get(x.k[x.k.length - 1]).x; pos.set(x, {x:(a + b) / 2, y:12 + d * 86}); } })(root, 0);
        (function ln(x){ const p = pos.get(x); x.k.forEach(c=>{ const q = pos.get(c); g.strokeStyle = dark(col); g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, p.y + bh); g.lineTo(p.x, p.y + bh + 17); g.lineTo(q.x, p.y + bh + 17); g.lineTo(q.x, q.y); g.stroke(); ln(c); }); })(root);
        (function bx(x, d){ const p = pos.get(x); rrect(g, p.x - bw / 2, p.y, bw, bh, 8); g.fillStyle = d === 0 ? dark(col) : d === 1 ? col : mixW(col, .25); g.fill(); g.strokeStyle = dark(col); g.lineWidth = 2; g.stroke(); boxText(g, x.t, p.x - bw / 2, p.y, bw, bh, '#fff', 18); x.k.forEach(c=>bx(c, d + 1)); })(root, 0);
      }else if(kind === 'pirm'){
        const lh = (H0 - 20) / n, top = 10, cx = W / 2, half = 250;
        tx.forEach((t, i)=>{ const y1 = top + i * lh, y2 = y1 + lh - 3, w1 = half * (i / n), w2 = half * ((i + 1) / n); g.beginPath(); g.moveTo(cx - w1, y1); g.lineTo(cx + w1, y1); g.lineTo(cx + w2 - 3, y2); g.lineTo(cx - w2 + 3, y2); g.closePath(); g.fillStyle = mixW(col, (n - 1 - i) * .1); g.fill(); const mw = (w1 + w2) - 24; boxText(g, t, cx - mw / 2, y1, Math.max(mw, 60), lh - 3, (n - 1 - i) * .1 > .4 ? '#222' : '#fff', 20); });
      }else if(kind === 'matriz'){
        const gap = 10, bw = (W - 24 - gap) / 2, bh = 100;
        tx.forEach((t, i)=>{ const c = i % 2, r = Math.floor(i / 2), x = 12 + c * (bw + gap), y = 10 + r * (bh + gap); rrect(g, x, y, bw, bh, 6); g.fillStyle = mixW(col, [0, .25, .4, .55][i % 4] * .8); g.fill(); boxText(g, t, x, y, bw, bh, [0, .25, .4, .55][i % 4] * .8 > .35 ? '#222' : '#fff', 20); });
      }
      return cv;
    }
    bind('btnSmart', ()=>{
      const COLS = [['Azul', '#4472c4'], ['Laranja', '#ed7d31'], ['Verde', '#70ad47'], ['Cinza', '#7f7f7f'], ['Dourado', '#bf9000'], ['Vinho', '#a5233a']];
      const d = dlg('SmartArt',
        '<div class="fdGrid"><label>Layout<select id="saKind"><option value="lista">Lista básica de blocos</option><option value="proc">Processo básico</option><option value="etapas">Processo em etapas</option><option value="ciclo">Ciclo básico</option><option value="hier">Hierarquia</option><option value="pirm">Pirâmide básica</option><option value="matriz">Matriz básica</option></select></label>' +
        '<label>Cor<select id="saCol">' + COLS.map(c=>'<option value="' + c[1] + '">' + c[0] + '</option>').join('') + '</select></label></div>' +
        '<label>Itens (um por linha; na Hierarquia, recue com espaços os níveis abaixo)<textarea id="saTxt" rows="5">Etapa 1\nEtapa 2\nEtapa 3</textarea></label>' +
        '<canvas id="saPrev" style="width:100%"></canvas>',
        'Inserir', (dd, q)=>{ const cv = drawSmart(q('#saKind').value, q('#saTxt').value.split('\n'), q('#saCol').value, 2); insImg(cv, cv.width / 2); }, {w:'min(620px,94vw)'});
      const q = s=>d.querySelector(s), pv = q('#saPrev');
      const draw = ()=>{ const c = drawSmart(q('#saKind').value, q('#saTxt').value.split('\n'), q('#saCol').value, 1); pv.width = c.width; pv.height = c.height; pv.getContext('2d').drawImage(c, 0, 0); };
      ['saKind', 'saCol', 'saTxt'].forEach(i=>q('#' + i).addEventListener('input', draw)); draw();
    });

    // ----- Gráfico
    const GCOL = ['#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47', '#264478', '#9e480e'];
    const numBR = s=>{ s = String(s).trim().replace(/\s/g, ''); if(s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); const v = parseFloat(s); return isFinite(v) ? v : 0; };
    const fmtN = v=>{ const r = Math.round(v * 100) / 100; return String(r).replace('.', ','); };
    function niceScale(max, min){
      min = Math.min(0, min); if(max <= min) max = min + 1;
      const span = max - min, raw = span / 5, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag, step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
      return {min:Math.floor(min / step) * step, max:Math.ceil(max / step) * step, step};
    }
    function parseData(txt){
      const rows = txt.split(/\r?\n/).filter(l=>l.trim()).map(l=>l.split(/\t|;/));
      if(rows.length < 2) return null;
      const head = rows[0], ns = Math.max(1, Math.max(...rows.map(r=>r.length)) - 1);
      const series = []; for(let s = 0; s < ns; s++) series.push({n:(head[s + 1] || 'Série ' + (s + 1)).trim(), v:rows.slice(1).map(r=>numBR(r[s + 1] || '0'))});
      return {cats:rows.slice(1).map(r=>(r[0] || '').trim()), series};
    }
    function drawChart(o, S){
      const W = 560, Hh = 340, cv = document.createElement('canvas'); cv.width = W * S; cv.height = Hh * S; const g = cv.getContext('2d'); g.scale(S, S);
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, Hh);
      const D = parseData(o.data);
      if(!D){ g.fillStyle = '#888'; g.font = '16px ' + FONT; g.textAlign = 'center'; g.fillText('Preencha os dados (cabeçalho + linhas)', W / 2, Hh / 2); return cv; }
      let top = 14; if(o.title){ g.fillStyle = '#404040'; g.font = '700 19px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(o.title, W / 2, 12); top = 44; }
      const legendOn = o.type === 'pizza' || D.series.length > 1;
      const legItems = o.type === 'pizza' ? D.cats.map((c, i)=>({n:c, c:GCOL[i % GCOL.length]})) : D.series.map((s, i)=>({n:s.n, c:GCOL[i % GCOL.length]}));
      let bottom = Hh - 12;
      if(legendOn && o.type !== 'pizza'){
        g.font = '14px ' + FONT; const tw = legItems.reduce((a, l)=>a + g.measureText(l.n).width + 30, 0); let x = (W - tw) / 2; const y = Hh - 22;
        legItems.forEach(l=>{ g.fillStyle = l.c; g.fillRect(x, y - 6, 12, 12); g.fillStyle = '#404040'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(l.n, x + 17, y); x += g.measureText(l.n).width + 30; });
        bottom = Hh - 38;
      }
      if(o.type === 'pizza'){
        const vals = D.series[0].v.map(v=>Math.max(0, v)), tot = vals.reduce((a, b)=>a + b, 0) || 1;
        const cx = 170, cy = (top + bottom) / 2, R = Math.min(135, (bottom - top) / 2 - 4); let a0 = -Math.PI / 2;
        vals.forEach((v, i)=>{ const a1 = a0 + v / tot * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.fillStyle = GCOL[i % GCOL.length]; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
          if(o.labels && v / tot > .04){ const am = (a0 + a1) / 2; g.fillStyle = '#fff'; g.font = '700 14px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(Math.round(v / tot * 100) + '%', cx + Math.cos(am) * R * .65, cy + Math.sin(am) * R * .65); } a0 = a1; });
        g.font = '15px ' + FONT; legItems.slice(0, 12).forEach((l, i)=>{ const y = cy - Math.min(legItems.length, 12) * 12 + i * 24 + 12; g.fillStyle = l.c; g.fillRect(340, y - 7, 14, 14); g.fillStyle = '#404040'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(l.n.length > 24 ? l.n.slice(0, 23) + '…' : l.n, 362, y); });
        return cv;
      }
      const all = D.series.flatMap(s=>s.v), sc = niceScale(Math.max(...all), Math.min(...all)), horiz = o.type === 'barras';
      g.font = '13px ' + FONT;
      const lw = Math.max(...[...Array(Math.round((sc.max - sc.min) / sc.step) + 1)].map((_, i)=>g.measureText(fmtN(sc.min + i * sc.step)).width), 10);
      const catW = horiz ? Math.min(110, Math.max(...D.cats.map(c=>g.measureText(c).width), 20) + 10) : 0;
      const L = horiz ? 14 + catW : 18 + lw, R = W - 16, T = top + 6, B = bottom - (horiz ? 22 : 24);
      const nT = Math.round((sc.max - sc.min) / sc.step);
      const vx = v=>L + (v - sc.min) / (sc.max - sc.min) * (R - L), vy = v=>B - (v - sc.min) / (sc.max - sc.min) * (B - T);
      g.lineWidth = 1;
      for(let i = 0; i <= nT; i++){
        const v = sc.min + i * sc.step; g.strokeStyle = '#d9d9d9'; g.beginPath();
        if(horiz){ g.moveTo(vx(v), T); g.lineTo(vx(v), B); } else { g.moveTo(L, vy(v)); g.lineTo(R, vy(v)); } g.stroke();
        g.fillStyle = '#595959'; g.font = '13px ' + FONT;
        if(horiz){ g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(fmtN(v), vx(v), B + 5); } else { g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(fmtN(v), L - 6, vy(v)); }
      }
      const nc = D.cats.length, ns = D.series.length;
      if(horiz){
        const band = (B - T) / nc, bw = Math.min(40, band * .7 / ns);
        D.cats.forEach((c, i)=>{ const y0 = T + band * i + band / 2 - bw * ns / 2; g.fillStyle = '#595959'; g.font = '13px ' + FONT; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(c.length > 14 ? c.slice(0, 13) + '…' : c, L - 6, T + band * (i + .5));
          D.series.forEach((s, k)=>{ g.fillStyle = GCOL[k % GCOL.length]; const x0 = vx(0), x1 = vx(s.v[i]); g.fillRect(Math.min(x0, x1), y0 + k * bw, Math.abs(x1 - x0), bw - 1); if(o.labels){ g.fillStyle = '#404040'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = '12px ' + FONT; g.fillText(fmtN(s.v[i]), Math.max(x0, x1) + 4, y0 + k * bw + bw / 2); } }); });
        g.strokeStyle = '#8c8c8c'; g.beginPath(); g.moveTo(vx(0), T); g.lineTo(vx(0), B); g.stroke();
      }else{
        const band = (R - L) / nc; g.strokeStyle = '#8c8c8c'; g.beginPath(); g.moveTo(L, vy(0)); g.lineTo(R, vy(0)); g.stroke();
        D.cats.forEach((c, i)=>{ g.fillStyle = '#595959'; g.font = '13px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(c.length > 12 && nc > 6 ? c.slice(0, 11) + '…' : c, L + band * (i + .5), B + 5); });
        if(o.type === 'colunas'){
          const bw = Math.min(46, band * .7 / ns);
          D.cats.forEach((c, i)=>{ const x0 = L + band * (i + .5) - bw * ns / 2; D.series.forEach((s, k)=>{ g.fillStyle = GCOL[k % GCOL.length]; const y0 = vy(0), y1 = vy(s.v[i]); g.fillRect(x0 + k * bw, Math.min(y0, y1), bw - 1, Math.abs(y1 - y0)); if(o.labels){ g.fillStyle = '#404040'; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.font = '12px ' + FONT; g.fillText(fmtN(s.v[i]), x0 + k * bw + bw / 2, Math.min(y0, y1) - 2); } }); });
        }else{
          D.series.forEach((s, k)=>{ g.strokeStyle = GCOL[k % GCOL.length]; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath(); s.v.forEach((v, i)=>{ const x = L + band * (i + .5), y = vy(v); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
            s.v.forEach((v, i)=>{ const x = L + band * (i + .5), y = vy(v); g.fillStyle = GCOL[k % GCOL.length]; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); if(o.labels){ g.fillStyle = '#404040'; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.font = '12px ' + FONT; g.fillText(fmtN(v), x, y - 7); } }); });
        }
      }
      return cv;
    }
    bind('btnChart', ()=>{
      const d = dlg('Inserir Gráfico',
        '<div class="fdGrid"><label>Tipo<select id="gcType"><option value="colunas">Colunas</option><option value="barras">Barras</option><option value="linhas">Linhas</option><option value="pizza">Pizza</option></select></label>' +
        '<label>Título<input type="text" id="gcTit" value="Título do gráfico"></label></div>' +
        '<label>Dados (primeira linha: nomes das séries; primeira coluna: categorias; separe por tabulação ou ponto e vírgula — dá para colar de uma planilha)<textarea id="gcData" rows="6" spellcheck="false"></textarea></label>' +
        '<label style="flex-direction:row;align-items:center;gap:8px;color:var(--ink)"><input type="checkbox" id="gcLab"> Mostrar rótulos de dados</label>' +
        '<canvas id="gcPrev" style="width:100%"></canvas>',
        'Inserir', (dd, q)=>{ const cv = drawChart({type:q('#gcType').value, title:q('#gcTit').value.trim(), data:q('#gcData').value, labels:q('#gcLab').checked}, 2); insImg(cv, 560); }, {w:'min(640px,94vw)'});
      const q = s=>d.querySelector(s), pv = q('#gcPrev');
      q('#gcData').value = ';Série 1;Série 2\nCategoria 1;4,3;2,4\nCategoria 2;2,5;4,4\nCategoria 3;3,5;1,8\nCategoria 4;4,5;2,8';
      const draw = ()=>{ const c = drawChart({type:q('#gcType').value, title:q('#gcTit').value.trim(), data:q('#gcData').value, labels:q('#gcLab').checked}, 1); pv.width = c.width; pv.height = c.height; pv.getContext('2d').drawImage(c, 0, 0); };
      ['gcType', 'gcTit', 'gcData', 'gcLab'].forEach(i=>q('#' + i).addEventListener('input', draw)); draw();
    });

    // ----- Instantâneo (captura de tela com recorte)
    async function snap(){
      if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){ alert('Este navegador não permite capturar a tela. Use o Chrome ou o Edge no computador.'); return; }
      let st; try{ st = await navigator.mediaDevices.getDisplayMedia({video:true, audio:false}); }catch(e){ return; }
      try{
        const v = document.createElement('video'); v.srcObject = st; v.muted = true; await v.play(); await new Promise(r=>setTimeout(r, 400));
        const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
        st.getTracks().forEach(t=>t.stop()); cropDlg(c);
      }catch(e){ st.getTracks().forEach(t=>t.stop()); alert('Não foi possível capturar a tela.'); }
    }
    function cropDlg(c){
      const d = dlg('Instantâneo',
        '<p style="margin:0 0 8px;color:var(--muted);font-size:13px">Arraste sobre a imagem para escolher o trecho (recorte), ou insira a tela inteira.</p><div class="crop"><img alt="Captura" src="' + c.toDataURL('image/png') + '"><i></i></div>',
        'Inserir recorte', (dd, q)=>{ const s = sel; if(!s || s.w < 4 || s.h < 4) return 'Arraste sobre a imagem para escolher o trecho, ou use "Inserir tela inteira".'; const o = document.createElement('canvas'); o.width = s.w; o.height = s.h; o.getContext('2d').drawImage(c, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h); restore(); window.__insImgFile(o.toDataURL('image/png')); },
        {w:'min(900px,96vw)', extra:'<button type="button" data-all style="margin-right:auto">Inserir tela inteira</button>'});
      const box = d.querySelector('.crop'), im = box.querySelector('img'), rc = box.querySelector('i'); let sel = null, a = null;
      d.querySelector('[data-all]').onclick = ()=>{ d.close(); restore(); window.__insImgFile(c.toDataURL('image/png')); };
      const pt = e=>{ const r = im.getBoundingClientRect(); return {x:Math.max(0, Math.min(r.width, e.clientX - r.left)), y:Math.max(0, Math.min(r.height, e.clientY - r.top)), k:c.width / r.width}; };
      box.addEventListener('pointerdown', e=>{ a = pt(e); box.setPointerCapture(e.pointerId); rc.style.display = 'block'; e.preventDefault(); });
      box.addEventListener('pointermove', e=>{ if(!a) return; const p = pt(e), x = Math.min(a.x, p.x), y = Math.min(a.y, p.y), w = Math.abs(p.x - a.x), h = Math.abs(p.y - a.y); rc.style.cssText = 'display:block;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px'; sel = {x:Math.round(x * p.k), y:Math.round(y * p.k), w:Math.round(w * p.k), h:Math.round(h * p.k)}; });
      box.addEventListener('pointerup', ()=>{ a = null; });
    }
    bind('btnSnap', b=>menu(b, [{h:'Recorte de tela'}, {t:'Capturar tela ou janela…', f:snap}]));

    // =====================================================================  MÍDIA
    bind('btnVideo', ()=>{
      dlg('Vídeo Online',
        '<label>Endereço do vídeo (YouTube ou Vimeo)<input type="text" id="vdUrl" placeholder="https://www.youtube.com/watch?v=…" autocomplete="off"></label>' +
        '<p style="color:var(--muted);font-size:12px;margin:0">O vídeo toca dentro do documento (precisa de internet). Na impressão e no PDF, sai o endereço do vídeo no lugar da tela.</p>',
        'Inserir', (d, q)=>{
          const u = q('#vdUrl').value.trim(); let src = '';
          let m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i.exec(u);
          if(m) src = 'https://www.youtube.com/embed/' + m[1];
          else if((m = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(u))) src = 'https://player.vimeo.com/video/' + m[1];
          if(!src) return 'Endereço não reconhecido. Use um link do YouTube ou do Vimeo.';
          ins('<div class="vid" contenteditable="false" data-url="' + H(u) + '"><iframe src="' + src + '" allowfullscreen loading="lazy" title="Vídeo online"></iframe><a class="vcap" href="' + H(u) + '" target="_blank" rel="noopener">▶ Vídeo online: ' + H(u) + '</a></div><p><br></p>');
        });
    });

    // =====================================================================  TEXTO
    // ----- Partes Rápidas
    const QBUILT = [{n:'Atenciosamente', h:'<p style="text-align:left">Atenciosamente,</p>'}, {n:'Sem mais para o momento', h:'<p>Sem mais para o momento, colocamo-nos à disposição para quaisquer esclarecimentos.</p>'}];
    bind('btnQuick', b=>{
      const my = store.get('partes', []);
      const list = [{h:'Geral'}];
      QBUILT.forEach(p=>list.push({t:p.n, f:()=>ins(p.h)}));
      if(my.length) list.push('-', {h:'Minhas partes'});
      my.forEach((p, i)=>list.push({node:close=>{
        const row = mk('div', 'qrow'), a = mk('button'); a.type = 'button'; a.textContent = p.n; a.title = 'Inserir'; a.onclick = ()=>{ close(); ins(p.h); };
        const x = mk('button', 'qx'); x.type = 'button'; x.textContent = '✕'; x.title = 'Excluir esta parte'; x.onclick = e=>{ e.stopPropagation(); const l = store.get('partes', []); l.splice(i, 1); store.set('partes', l); close(); };
        row.append(a, x); return row;
      }}));
      list.push('-', {t:'Salvar Seleção na Galeria de Partes Rápidas…', f:()=>{
        const r = curRange(); if(!r || r.collapsed){ alert('Selecione o texto (ou a tabela) que você quer guardar.'); return; }
        const tmp = document.createElement('div'); tmp.appendChild(r.cloneContents()); const html = tmp.innerHTML, nm0 = r.toString().trim().replace(/\s+/g, ' ').slice(0, 40);
        dlg('Criar Nova Parte Rápida', '<label>Nome<input type="text" id="qpN" autocomplete="off"></label><p style="color:var(--muted);font-size:12px;margin:0">A parte fica guardada neste navegador e pode ser inserida em qualquer documento.</p>', 'OK', (d, q)=>{
          const n = q('#qpN').value.trim(); if(!n) return 'Dê um nome à parte.'; const l = store.get('partes', []).filter(x=>x.n !== n); l.push({n, h:html}); store.set('partes', l);
        }).querySelector('#qpN').value = nm0;
      }});
      menu(b, list);
    });

    // ----- WordArt
    const WA = [
      'color:#000;font-weight:700', 'color:#2f5496;font-weight:700', 'color:#c55a11;font-weight:700', 'color:#fff;-webkit-text-stroke:1.5px #2f5496;font-weight:700',
      'color:#2f5496;font-weight:700;text-shadow:2px 2px 3px rgba(0,0,0,.4)', 'color:#7030a0;font-weight:700;text-shadow:3px 3px 0 #d9c3ec', 'color:#c00000;font-weight:700;font-style:italic;text-shadow:1px 1px 0 #f4b183',
      'color:#548235;font-weight:700;letter-spacing:.12em;font-variant:small-caps', 'color:#bf8f00;font-weight:700;text-shadow:0 0 6px #ffe699', 'color:#fff;font-weight:700;-webkit-text-stroke:1px #000;text-shadow:3px 3px 0 #000', 'color:#1f3864;font-weight:700;font-family:Georgia,serif;font-style:italic;text-shadow:2px 2px 0 #b4c7e7', 'color:#ed7d31;font-weight:700;font-family:Impact,Arial Black,sans-serif;letter-spacing:.05em'
    ];
    bind('btnWordArt', b=>menu(b, [{h:'WordArt'}, {node:close=>{
      const g = mk('div', 'gal'); g.style.gridTemplateColumns = 'repeat(4,56px)';
      WA.forEach((st, i)=>{ const x = mk('button'); x.type = 'button'; x.title = 'Estilo ' + (i + 1); x.innerHTML = '<span style="font-size:22px;' + st + '">A</span>'; x.addEventListener('click', ()=>{ close(); const t = selText() || 'Seu texto aqui'; ins('<span class="wa" style="font-size:32pt;line-height:1.2;' + st + '">' + H(t) + '</span>'); }); g.appendChild(x); });
      return g;
    }}]));

    // ----- Letra Capitular
    function dropcap(lines, margin){
      restore(); const r = curRange(); const b = r && blockOf(r.startContainer);
      if(!b || b === page || !inPage(b)){ alert('Clique dentro do parágrafo que deve receber a letra capitular.'); return; }
      const ex = b.querySelector('.dcap'); if(ex){ ex.replaceWith(document.createTextNode(ex.textContent)); b.normalize(); }
      if(!lines){ b.style.textIndent = ''; if(!b.getAttribute('style')) b.removeAttribute('style'); changed(); refresh(); return; }
      b.style.textIndent = '0';
      const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let t, i = -1;
      while((t = w.nextNode())){ i = t.nodeValue.search(/[^\s​]/); if(i >= 0) break; }
      if(!t || i < 0) return;
      const rr = document.createRange(); rr.setStart(t, i); rr.setEnd(t, i + 1);
      const sp = document.createElement('span'); sp.className = 'dcap';
      const fs = margin ? 2.6 : lines * 1.35;
      sp.style.cssText = 'float:left;font-size:' + fs + 'em;line-height:.8;font-weight:700;padding:.06em .08em 0 0;' + (margin ? 'margin-left:-1.1em;margin-right:.1em' : 'margin-right:.04em');
      rr.surroundContents(sp); changed(); refresh();
    }
    bind('btnDrop', b=>menu(b, [{t:'Nenhuma', f:()=>dropcap(0)}, {t:'Capitular (2 linhas)', f:()=>dropcap(2)}, {t:'Capitular (3 linhas)', f:()=>dropcap(3)}, {t:'Capitular (4 linhas)', f:()=>dropcap(4)}, {t:'Na Margem', f:()=>dropcap(2, true)}]));

    // ----- Linha de Assinatura
    bind('btnSign', ()=>{
      const dd0 = dlg('Configuração de Assinatura',
        '<label>Signatário sugerido (nome)<input type="text" id="sgN" autocomplete="off"></label><label>Cargo do signatário sugerido<input type="text" id="sgC" autocomplete="off"></label><label>E-mail ou registro profissional (opcional)<input type="text" id="sgE" autocomplete="off"></label>' +
        '<label style="flex-direction:row;align-items:center;gap:8px;color:var(--ink)"><input type="checkbox" id="sgD"> Mostrar a data da assinatura</label>',
        'OK', (d, q)=>{
          const n = q('#sgN').value.trim(), c = q('#sgC').value.trim(), e = q('#sgE').value.trim();
          store.set('assin', {n, c, e});
          ins('<p style="text-align:center;margin:2.4em 0 0;page-break-inside:avoid">' + (q('#sgD').checked ? 'Data: ____/____/________<br><br><br>' : '') + '______________________________________<br>' + (n ? '<b>' + H(n) + '</b><br>' : '') + (c ? H(c) + '<br>' : '') + (e ? H(e) : '') + '</p><p><br></p>');
        });
      const a = store.get('assin', null); if(a){ dd0.querySelector('#sgN').value = a.n || ''; dd0.querySelector('#sgC').value = a.c || ''; dd0.querySelector('#sgE').value = a.e || ''; }
    });

    // ----- Data e Hora
    bind('btnDate', ()=>{
      const n = new Date(), L = (o)=>n.toLocaleDateString('pt-BR', o), T = (o)=>n.toLocaleTimeString('pt-BR', o);
      const F = [L({day:'2-digit', month:'2-digit', year:'numeric'}), L({day:'numeric', month:'long', year:'numeric'}).replace(/^1 de /, '1º de '), L({weekday:'long', day:'numeric', month:'long', year:'numeric'}), L({day:'2-digit', month:'2-digit', year:'2-digit'}), n.toISOString().slice(0, 10), L({day:'2-digit', month:'short', year:'2-digit'}).replace(/\./g, ''), L({month:'long', year:'numeric'}), L({day:'numeric', month:'long'}), T({hour:'2-digit', minute:'2-digit'}), T({hour:'2-digit', minute:'2-digit', second:'2-digit'}), L({day:'2-digit', month:'2-digit', year:'numeric'}) + ' ' + T({hour:'2-digit', minute:'2-digit'}), L({day:'numeric', month:'long', year:'numeric'}) + ', ' + T({hour:'2-digit', minute:'2-digit'})];
      const d = dlg('Data e Hora', '<label>Formatos disponíveis<select id="dtL" size="9">' + F.map((f, i)=>'<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + H(f) + '</option>').join('') + '</select></label><p style="color:var(--muted);font-size:12px;margin:0">O texto inserido é fixo (não muda sozinho).</p>', 'OK', (dd, q)=>{ restore(); exec('insertText', F[+q('#dtL').value]); });
      d.querySelector('#dtL').addEventListener('dblclick', ()=>d.querySelector('[data-ok]').click());
    });

    // ----- Objeto ▾
    const fi = document.createElement('input'); fi.type = 'file'; fi.accept = '.txt,.html,.htm,.md,text/plain,text/html'; fi.hidden = true; document.body.appendChild(fi);
    fi.addEventListener('change', async ()=>{
      const f = fi.files[0]; fi.value = ''; if(!f) return;
      const t = await f.text();
      if(/\.html?$/i.test(f.name)){
        const doc = new DOMParser().parseFromString(t, 'text/html');
        doc.querySelectorAll('script,style,iframe,object,embed,link,meta,form').forEach(x=>x.remove());
        doc.body.querySelectorAll('*').forEach(el=>[...el.attributes].forEach(a=>{ if(/^on/i.test(a.name) || /^[\x00-\x20]*j[\t\n\r]*a[\t\n\r]*v[\t\n\r]*a[\t\n\r]*s[\t\n\r]*c[\t\n\r]*r[\t\n\r]*i[\t\n\r]*p[\t\n\r]*t[\t\n\r]*:/i.test(a.value)) el.removeAttribute(a.name); }));
        ins(doc.body.innerHTML);
      }else ins(t.replace(/\r/g, '').split(/\n{2,}/).map(p=>'<p>' + H(p).replace(/\n/g, '<br>') + '</p>').join(''));
    });
    bind('btnObj', b=>menu(b, [
      {t:'Texto de Arquivo…', f:()=>fi.click()}, '-',
      {t:'Linha Horizontal', f:()=>{ restore(); exec('insertHorizontalRule'); }},
      {t:'Texto de Código', f:()=>$('btnCode').click()},
      {t:'Lista de Tarefas', f:()=>$('btnTask').click()}
    ]));

    // =====================================================================  SÍMBOLOS: Equação
    const I = t=>'<i>' + H(t) + '</i>';
    const frac = (n, d)=>'<span class="eqf" style="display:inline-block;vertical-align:middle;text-align:center;margin:0 .1em"><span style="display:block;border-bottom:1px solid currentColor;padding:0 .25em">' + n + '</span><span style="display:block;padding:0 .25em">' + d + '</span></span>';
    const sqrt = x=>'√<span style="border-top:1px solid currentColor;padding:0 .12em">' + x + '</span>';
    const big = (sym, lo, hi)=>'<span style="display:inline-block;vertical-align:middle;text-align:center;line-height:1.05;margin:0 .15em"><span style="display:block;font-size:.7em">' + hi + '</span><span style="display:block;font-size:1.7em">' + sym + '</span><span style="display:block;font-size:.7em">' + lo + '</span></span>';
    const EQ = [
      {n:'Fração', h:frac(I('a'), I('b'))}, {n:'Expoente', h:I('x') + '<sup>' + I('n') + '</sup>'}, {n:'Índice', h:I('x') + '<sub>' + I('i') + '</sub>'}, {n:'Raiz quadrada', h:sqrt(I('x'))},
      {n:'Raiz n-ésima', h:'<sup style="font-size:.6em">' + I('n') + '</sup>' + sqrt(I('x'))}, {n:'Somatório', h:big('∑', I('i') + '=1', I('n')) + I('x') + '<sub>' + I('i') + '</sub>'},
      {n:'Integral', h:'<span style="font-size:1.5em;vertical-align:middle">∫</span><sub>' + I('a') + '</sub><sup>' + I('b') + '</sup> ' + I('f') + '(' + I('x') + ') ' + I('dx')}, {n:'Limite', h:big('lim', I('x') + '→0', '') + ' ' + I('f') + '(' + I('x') + ')'},
      {n:'Porcentagem', h:frac(I('p'), '100') + ' × ' + I('V')}, {n:'Média', h:I('x') + '̄ = ' + frac('∑ ' + I('x') + '<sub>' + I('i') + '</sub>', I('n'))}
    ];
    const EQF = [
      {n:'Teorema de Pitágoras', h:I('a') + '<sup>2</sup> + ' + I('b') + '<sup>2</sup> = ' + I('c') + '<sup>2</sup>'},
      {n:'Fórmula de Bhaskara', h:I('x') + ' = ' + frac('−' + I('b') + ' ± ' + sqrt(I('b') + '<sup>2</sup> − 4' + I('ac')), '2' + I('a'))},
      {n:'Área do círculo', h:I('A') + ' = π' + I('r') + '<sup>2</sup>'}, {n:'Binômio ao quadrado', h:'(' + I('a') + ' + ' + I('b') + ')<sup>2</sup> = ' + I('a') + '<sup>2</sup> + 2' + I('ab') + ' + ' + I('b') + '<sup>2</sup>'},
      {n:'Juros compostos', h:I('M') + ' = ' + I('C') + '(1 + ' + I('i') + ')<sup>' + I('t') + '</sup>'}, {n:'Velocidade média', h:I('v') + ' = ' + frac('Δ' + I('s'), 'Δ' + I('t'))},
      {n:'IMC', h:'IMC = ' + frac('peso', 'altura<sup>2</sup>')}, {n:'Desvio padrão', h:'σ = ' + sqrt(frac('∑(' + I('x') + '<sub>' + I('i') + '</sub> − ' + I('x') + '̄)<sup>2</sup>', I('n')))}
    ];
    const eqHtml = h=>'<span class="eq" style="font-family:\'Cambria Math\',Cambria,\'Times New Roman\',serif;font-size:1.1em">' + h + '</span>&nbsp;';
    bind('btnEq', b=>{
      const grid = (arr)=>({node:close=>{
        const g = mk('div', 'gal eqg');
        arr.forEach(e=>{ const x = mk('button'); x.type = 'button'; x.title = e.n; x.innerHTML = '<span style="font-family:\'Cambria Math\',Cambria,serif;font-size:15px">' + e.h + '</span>'; x.addEventListener('click', ()=>{ close(); ins(eqHtml(e.h)); }); g.appendChild(x); });
        return g;
      }});
      menu(b, [{h:'Equações incorporadas'}, grid(EQF), {h:'Estruturas'}, grid(EQ), '-', {t:'Inserir Nova Equação', f:()=>ins(eqHtml(selText() ? H(selText()) : I('x') + ' = '))}]);
    });

    // Revisão: botão "Comentário" também aparece lá (Novo e Mostrar), ligado acima.
  })();
