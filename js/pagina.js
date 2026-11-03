/* Verbus — Margens, tamanho do papel, colunas, números de linha, cabeçalho/rodapé e folhas
   (js/pagina.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ---------- Margens da página (régua) ----------
  const CMPX = 96 / 2.54;
  function effMar(){
    const d = store.docs[store.current], m = (d && d.mar) || {};
    const ab = page.classList.contains('abnt');
    const base = ab ? {t:3*CMPX, r:2*CMPX, b:2*CMPX, l:3*CMPX} : {t:2.5*CMPX, r:3*CMPX, b:2.5*CMPX, l:3*CMPX};   // padrão do Word (A4)
    const o = {}; for(const k in base) o[k] = m[k] != null ? m[k] : base[k];
    return o;
  }
  // ---------- Configurar página: tamanho, orientação, colunas e margens ----------
  const PG_SIZES = {a4:[21, 29.7, 'A4'], carta:[21.59, 27.94, 'Carta'], oficio:[21.59, 35.56, 'Ofício'], a5:[14.8, 21, 'A5'], a3:[29.7, 42, 'A3']};
  const PG_MAR = {estreita:[1.27, 1.27, 1.27, 1.27], moderada:[2.54, 1.91, 2.54, 1.91], larga:[2.54, 5.08, 2.54, 5.08], abnt:[3, 2, 2, 3]};   // cm: sup., dir., inf., esq.
  function pgOf(){
    const d = store.docs[store.current], p = (d && d.pg) || {};
    const size = PG_SIZES[p.size] ? p.size : 'a4', s = PG_SIZES[size], land = !!p.land;
    return {size, land, w: land ? s[1] : s[0], h: land ? s[0] : s[1], cols: [1,2,3].includes(p.cols) ? p.cols : 1};
  }
  // ---------- Números de linha (só na tela): cada linha visual de cada parágrafo, na margem esquerda ----------
  let lnRaf = 0;
  function lnRender(){
    cancelAnimationFrame(lnRaf);
    lnRaf = requestAnimationFrame(()=>{
      const sh = document.getElementById('sheet'); if(!sh) return;
      let ov = document.getElementById('lnOv');
      const d = store.docs[store.current], mode = d && d.ln;
      if(mode !== 'c' && mode !== 'p'){ if(ov) ov.remove(); return; }
      if(!ov){ ov = document.createElement('div'); ov.id = 'lnOv'; ov.setAttribute('aria-hidden', 'true'); sh.appendChild(ov); }
      const sr = sh.getBoundingClientRect(), sc = sh.offsetWidth ? sr.width / sh.offsetWidth : 1;
      const e = effMar(), pg = pgOf(), use = Math.max(CMPX, pg.h * CMPX - e.t - e.b);
      let n = 0, pgi = -1, out = '';
      const leaf = [...page.querySelectorAll(BLK)].filter(b=>!b.querySelector(BLK) && !b.closest('table,.hf,[data-hid],#fnotes,.fnotes,.endnotes') && b.dataset.sln !== '1');
      for(const b of leaf){
        const r = document.createRange(); r.selectNodeContents(b);
        let rs = [...r.getClientRects()].filter(x=>x.width > 0 && x.height > 0).sort((a, c)=>a.top - c.top);
        if(!rs.length){ const x = b.getBoundingClientRect(); if(x.height > 0) rs = [x]; }
        const lines = [];
        rs.forEach(x=>{ const l = lines[lines.length - 1]; if(l && Math.abs(x.top - l.top) < Math.min(x.height, l.height) * .5){ l.h = Math.max(l.h, x.height); } else lines.push({top:x.top, h:x.height}); });
        lines.forEach(l=>{
          const y = (l.top - sr.top) / sc;
          if(mode === 'p'){ const pi = Math.max(0, Math.floor((y - e.t) / use)); if(pi !== pgi){ pgi = pi; n = 0; } }
          n++; out += '<span style="top:' + Math.round(y) + 'px;height:' + Math.round(l.h / sc) + 'px">' + n + '</span>';
        });
      }
      ov.style.left = Math.max(0, e.l - 44) + 'px'; ov.innerHTML = out;
    });
  }
  function pgSet(ch){
    const d = store.docs[store.current]; if(!d) return;
    const p = Object.assign({size:'a4', land:false, cols:1}, d.pg || {}, ch);
    if(p.size === 'a4' && !p.land && p.cols === 1) delete d.pg; else d.pg = p;
    const pg = pgOf(), e = effMar();
    if(pg.w * CMPX - e.l - e.r < 2 * CMPX || pg.h * CMPX - e.t - e.b < 2 * CMPX) delete d.mar;   // margens que não cabem no papel novo voltam ao padrão
    applyMar(); persist(); updateCount(); lnRender();
  }
  function marSet(k){
    const d = store.docs[store.current]; if(!d) return;
    if(k === 'padrao') delete d.mar;
    else{ const v = PG_MAR[k]; if(!v) return; d.mar = {t:v[0] * CMPX, r:v[1] * CMPX, b:v[2] * CMPX, l:v[3] * CMPX}; }
    applyMar(); persist(); updateCount();
  }
  function applyMar(){
    try{ window.__applySty && window.__applySty(); }catch(e){}
    try{ window.__stOvr && window.__stOvr(); }catch(e){}
    const d = store.docs[store.current], m = d && d.mar;
    ['t','r','b','l'].forEach(k=>{
      if(m && m[k] != null) page.style.setProperty('--m' + k, m[k] + 'px');
      else page.style.removeProperty('--m' + k);
    });
    if(d && d.hyph){ page.style.hyphens = 'auto'; page.lang = 'pt-BR'; } else { page.style.hyphens = ''; page.removeAttribute('lang'); }
    if(d && d.tabdef) page.style.setProperty('--tabdef', d.tabdef + 'cm'); else page.style.removeProperty('--tabdef');   // tabulação padrão do documento
    if(window.__tabsSoon) window.__tabsSoon();
    const e = effMar(), st = document.getElementById('pgStyle'), sh = document.getElementById('sheet'), pg = pgOf();
    if(sh){
      sh.style.setProperty('--pw', pg.w + 'cm'); sh.style.setProperty('--ph', pg.h + 'cm');
      sh.style.setProperty('--hl', e.l + 'px'); sh.style.setProperty('--hr', e.r + 'px');
      sh.style.setProperty('--ht', e.t + 'px'); sh.style.setProperty('--hb', e.b + 'px');
      sh.style.setProperty('--hty', hfDist(true, e) + 'px'); sh.style.setProperty('--hby', hfDist(false, e) + 'px');
    }
    if(st){
      const px = v=>(Math.round(v*100)/100) + 'px', hh = hfData(), any = hfHas('h') || hfHas('f');
      let css = '@page{size:' + pg.w + 'cm ' + pg.h + 'cm;margin:' + [e.t, e.r, e.b, e.l].map(px).join(' ') + ';';
      if(any || !page.classList.contains('abnt')) css += '@top-right{content:none}';   // o número automático no canto é só do padrão ABNT; com cabeçalho/rodapé próprio ele também sai
      css += hfBoxCss('h', e) + hfBoxCss('f', e) + hfPrintCss(pg, !!hh.dif) + '}';
      const anyImg = hfImgList().length > 0 || hfSvgTextOn();
      if((any || anyImg) && hh.dif) css += '@page:first{' + ['top-left','top-center','top-right','bottom-left','bottom-center','bottom-right'].concat(anyImg ? ['top-left-corner'] : []).map(p=>'@' + p + '{content:none}').join('') + '}';
      st.textContent = css;
    }
    page.style.columnCount = pg.cols > 1 ? pg.cols : ''; page.style.columnGap = pg.cols > 1 ? '1.25cm' : '';
    hfRender();
    try{ pgSync(); }catch(err){}
    try{ lnRender(); }catch(err){}
  }

  // ---------- Cabeçalho e rodapé ----------
  function hfData(){
    const d = store.docs[store.current];
    if(!d) return {h:'', f:'', ha:'left', fa:'left', dif:false};
    return d.hf || (d.hf = {h:'', f:'', ha:'left', fa:'left', dif:false});
  }
  // distância do cabeçalho (h) / rodapé (f) à borda do papel: a que o usuário definiu (cm) ou a automática
  function hfDist(top, e){
    const v = hfData()[top ? 'dt' : 'db'];
    return v >= 0 ? v * CMPX : Math.min(1.25 * CMPX, (top ? e.t : e.b) * 0.4);
  }
  // estilo da fonte de cada caixa (h = cabeçalho, f = rodapé): vale na tela, na impressão/PDF, no .doc e no .docx
  function hfStyle(k){
    const hh = hfData(), st = (hh.st && hh.st[k]) || {};
    return {ff: st.ff || 'Arial', fs: st.fs > 0 ? st.fs : 10, b: !!st.b, i: !!st.i, u: !!st.u, c: /^#[0-9a-f]{6}$/i.test(st.c || '') ? st.c : ''};
  }
  function hfStyleSet(k, ch){
    const hh = hfData(); hh.st = hh.st || {}; hh.st[k] = Object.assign({}, hh.st[k], ch);
  }

  // ---- formatação por trecho: lê o HTML do cabeçalho/rodapé como trechos {t|f, s:estilo} ----
  const hfCx = document.createElement('canvas').getContext('2d');
  function hfHex(c){ try{ hfCx.fillStyle = '#000000'; hfCx.fillStyle = c; return /^#[0-9a-f]{6}$/i.test(hfCx.fillStyle) ? hfCx.fillStyle : ''; }catch(e){ return ''; } }
  function hfRuns(html){
    const root = document.createElement('div'); root.innerHTML = html || ''; const out = [];
    const pt = v=>{ const m = /^([\d.]+)(pt|px)$/.exec((v || '').trim()); return m ? (m[2] === 'px' ? +m[1] * 0.75 : +m[1]) : 0; };
    const own = (c, s0)=>{
      const n = Object.assign({}, s0), t = c.tagName, st = c.style;
      if(t === 'B' || t === 'STRONG') n.b = true; if(t === 'I' || t === 'EM') n.i = true; if(t === 'U') n.u = true;
      if(t === 'FONT'){ if(c.getAttribute('face')) n.ff = c.getAttribute('face'); const cc = c.getAttribute('color'); if(cc && hfHex(cc)) n.c = hfHex(cc); }
      if(st){
        if(st.fontFamily) n.ff = st.fontFamily.split(',')[0].replace(/["']/g, '').trim();
        const f = pt(st.fontSize); if(f > 0) n.fs = Math.round(f * 2) / 2;
        if(st.color && hfHex(st.color)) n.c = hfHex(st.color);
        if(st.fontWeight) n.b = st.fontWeight === 'bold' || parseInt(st.fontWeight, 10) >= 600;
        if(st.fontStyle) n.i = st.fontStyle === 'italic';
        const td = st.textDecorationLine || st.textDecoration || ''; if(td) n.u = td.indexOf('underline') >= 0;
      }
      return n;
    };
    (function walk(n, s0){
      n.childNodes.forEach(c=>{
        if(c.nodeType === 3) c.data.replace(/ /g, ' ').replace(/​/g, '').split('\n').forEach((ln, i)=>{ if(i) out.push({br:1}); if(ln) out.push({t:ln, s:s0}); });
        else if(c.nodeType === 1){
          if(c.classList.contains('fld')) out.push({f:c.dataset.f, s:s0});
          else if(c.tagName === 'BR') out.push({br:1});
          else{ if(/^(DIV|P|H[1-6])$/.test(c.tagName) && out.length) out.push({br:1}); walk(c, own(c, s0)); }
        }
      });
    })(root, {});
    return out;
  }
  function hfLineRuns(k, html){
    const lines = [[]];
    hfRuns(html == null ? hfData()[k] : html).forEach(r=>{ if(r.br) lines.push([]); else lines[lines.length - 1].push(r); });
    return lines;
  }
  function hfResolve(k, s0){ return Object.assign({}, hfStyle(k), s0 || {}); }
  function hfRich(k, html){
    const b = hfStyle(k);
    return hfRuns(html == null ? hfData()[k] : html).some(r=>!r.br && (r.f || (r.t && r.t.trim())) && Object.keys(r.s).some(x=>r.s[x] !== b[x]));
  }
  function hfHasFld(k, html){ return hfRuns(html == null ? hfData()[k] : html).some(r=>r.f); }
  // CSS de um trecho (tela, pré-visualização e .doc)
  function hfRunCss(q){
    return 'font-family:"' + q.ff + '",Carlito,"Liberation Serif",sans-serif;font-size:' + q.fs + 'pt;font-weight:' + (q.b ? '700' : '400') + ';font-style:' + (q.i ? 'italic' : 'normal') + ';text-decoration:' + (q.u ? 'underline' : 'none') + ';color:' + (q.c || '#000000');
  }
  // impressão direta (Ctrl+P): trechos formatados viram texto numa imagem da margem (repete em todas as páginas)
  const hfSvgTextOn = ()=>['h','f'].some(k=>hfHas(k) && hfRich(k) && !hfHasFld(k));
  function hfSvgText(k, pg, e){
    if(!(hfHas(k) && hfRich(k) && !hfHasFld(k))) return '';
    const hh = hfData(), a = hh[k + 'a'] === 'center' ? 'center' : hh[k + 'a'] === 'right' ? 'right' : 'left', top = k === 'h';
    const PH = pg.h * CMPX, cw = pg.w * CMPX - e.l - e.r, dist = hfDist(top, e), n = v=>Math.round(v * 100) / 100;
    const x = a === 'center' ? e.l + cw / 2 : a === 'right' ? e.l + cw : e.l, anchor = a === 'center' ? 'middle' : a === 'right' ? 'end' : 'start';
    const xe = t=>t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = hfLineRuns(k).map(l=>{ const rr = l.map(r=>({t:r.t || '', q:hfResolve(k, r.s)})); const m = Math.max(hfStyle(k).fs, ...rr.map(r=>r.q.fs)); return {rr, m, lh:m * 96 / 72 * 1.3}; });
    const total = lines.reduce((s0, l)=>s0 + l.lh, 0); let y = top ? dist : PH - dist - total, out = '';
    lines.forEach(l=>{
      const base = y + l.lh / 2 + l.m * 96 / 72 * 0.33; y += l.lh;
      if(!l.rr.length) return;
      out += '<text x="' + n(x) + '" y="' + n(base) + '" text-anchor="' + anchor + '" xml:space="preserve">' + l.rr.map(r=>'<tspan font-family="\'' + r.q.ff + '\',Carlito,\'Liberation Serif\',sans-serif" font-size="' + n(r.q.fs * 96 / 72) + '" font-weight="' + (r.q.b ? 700 : 400) + '" font-style="' + (r.q.i ? 'italic' : 'normal') + '"' + (r.q.u ? ' text-decoration="underline"' : '') + ' fill="' + (r.q.c || '#000000') + '">' + xe(r.t) + '</tspan>').join('') + '</text>';
    });
    return out;
  }
  function hfTokens(html){
    const root = document.createElement('div'); root.innerHTML = html || ''; const out = [];
    (function walk(n){
      n.childNodes.forEach(c=>{
        if(c.nodeType === 3) c.data.replace(/\u00a0/g, ' ').replace(/\u200b/g, '').split('\n').forEach((ln, i)=>{ if(i) out.push({br:1}); out.push(ln); });
        else if(c.nodeType === 1){
          if(c.classList.contains('fld')) out.push({f:c.dataset.f});
          else if(c.tagName === 'BR') out.push({br:1});
          else{ if(/^(DIV|P|H[1-6])$/.test(c.tagName) && out.length) out.push({br:1}); walk(c); }
        }
      });
    })(root);
    return out;
  }
  function hfHas(k){ return hfTokens(hfData()[k]).some(t=>typeof t === 'string' ? t.trim() : !t.br); }
  function hfBoxCss(k, e){
    if(!hfHas(k)) return '';
    if(hfRich(k) && !hfHasFld(k)) return '';
    const hh = hfData(), a = hh[k + 'a'] === 'center' ? 'center' : hh[k + 'a'] === 'right' ? 'right' : 'left';
    const q = t=>'"' + t.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ') + '"';
    const content = hfTokens(hh[k]).map(t=>typeof t === 'string' ? (t ? q(t) : '') : t.br ? '"\\A "' : (t.f === 'pages' ? 'counter(pages)' : 'counter(page)')).filter(Boolean).join(' ');
    const top = k === 'h', dist = hfDist(top, e);
    const sy = hfStyle(k), fam = '"' + sy.ff + '",Carlito,"Liberation Serif",serif';
    return '@' + (top ? 'top' : 'bottom') + '-' + a + '{content:' + content + ';white-space:pre;font:' + (sy.i ? 'italic ' : '') + (sy.b ? 'bold ' : '') + sy.fs + 'pt ' + fam + ';color:' + (sy.c || '#000') + ';text-decoration:' + (sy.u ? 'underline' : 'none') + ';text-align:' + a +
      ';vertical-align:' + (top ? 'top' : 'bottom') + ';padding-' + (top ? 'top' : 'bottom') + ':' + Math.round(dist * 100) / 100 + 'px}';
  }
  // Quebras de página: mesma conta da pré-visualização de impressão (um bloco que não cabe vai inteiro para a página seguinte;
  // título com "manter com o próximo" não fica sozinho no fim da página)
  const sbkBlank = new WeakMap();   // quebra de seção par/ímpar → precisa de uma página em branco (o Chrome não insere sozinho ao imprimir)
  addEventListener('beforeprint', ()=>{
    page.querySelectorAll('.sbk[data-t="odd"],.sbk[data-t="even"]').forEach(k=>{
      if(!sbkBlank.get(k)) return;
      const b = document.createElement('div'); b.className = 'sbkb'; b.setAttribute('contenteditable', 'false'); b.style.cssText = 'height:1px;break-after:page'; k.after(b);
    });
  });
  addEventListener('afterprint', ()=>{ page.querySelectorAll('.sbkb').forEach(b=>b.remove()); });
  function pgPlan(kids, use0, rectOf, splitOf){
    const starts = [0], tops = []; let ps = 0, brk = false, brkT = '', brkEl = null;
    const U = ()=>typeof use0 === 'function' ? use0(starts.length - 1) : use0;   // capacidade da página atual (menor quando há notas de rodapé)
    const next = y=>{ starts.push(y); ps = y; };
    const keep = k=>((k.style && (k.style.breakAfter || k.style.pageBreakAfter)) === 'avoid');
    kids.forEach((k, i)=>{
      if(k.classList.contains('pb')){ brk = true; brkT = ''; tops[i] = null; return; }
      if(k.classList.contains('sbk')){ tops[i] = null; if(k.dataset.t !== 'cont'){ brk = true; brkT = k.dataset.t || 'next'; brkEl = k; sbkBlank.set(k, 0); } return; }   // quebra de seção: contínua não muda de página; par/ímpar podem abrir uma página em branco
      const r = rectOf(k); if(!r){ tops[i] = null; return; }
      const top = r.top, bot = r.bot; tops[i] = top;
      const chain = ()=>{ let j = i, t = top; while(j > 0 && keep(kids[j - 1]) && tops[j - 1] != null && tops[j - 1] > ps + 1){ j--; t = tops[j]; } return t; };
      if(brk){
        brk = false; if(top > ps + 1) next(top);
        if((brkT === 'odd' && starts.length % 2 === 0) || (brkT === 'even' && starts.length % 2 === 1)){ next(top); if(brkEl) sbkBlank.set(brkEl, 1); }   // página em branco para cair em página ímpar/par
        brkT = '';
      }
      if(bot - ps > U() + 1){
        // quadro "data-flow" (modelos): começa onde houver pelo menos ~3 linhas de espaço e continua na página seguinte
        const hasFlow = !!(k.hasAttribute && k.hasAttribute('data-flow'));
        let flow = hasFlow && ps + U() - top >= 90;
        // sem espaço para ~3 linhas: o quadro (com o título da seção) começa na página seguinte e só então é dividido; antes ele caía no
        // corte "cego" por altura, que cortava a linha ao meio e fazia o rodapé/cabeçalho invadirem o texto na tela
        if(hasFlow && !flow && top > ps + 1){ next(chain()); flow = true; }
      if(bot - ps > U() + 1){
        let done = false;
        if(flow && splitOf){      // quebra por linha: a 1ª linha que não cabe começa a próxima página (o espaço é aberto só por CSS, em pgRun)
          const ps0 = ps, n0 = starts.length, ys = [];
          while(bot - ps > U() + 1){
            const y = splitOf(k, ps + U());
            if(y == null || y <= ps + 1 || y > ps + U() + .5) break;
            ys.push([y, ps + U()]); next(y);
          }
          if(bot - ps > U() + 1){ starts.length = n0; ps = ps0; }
          else{ done = true; starts.splits = starts.splits || new Map(); ys.forEach(([y, end])=>starts.splits.set(y, {k, end})); }
        }
        if(done){ /* já dividido por linhas */ }
        else if(!flow && top > ps + 1 && bot - top <= U()) next(chain());
        else while(bot - ps > U() + 1) next(ps + U());
      }
      }
    });
    return starts;
  }
  let pgState = null, pgRaf = 0;
  function pageCount(){
    if(pgState) return pgState.starts.length;
    const m = effMar(), use = Math.max(CMPX, pgOf().h * CMPX - m.t - m.b);
    return Math.max(1, Math.ceil((page.offsetHeight - m.t - m.b) / use - 0.02));
  }
  // ---------- Folhas separadas na tela: espaço cinza entre as páginas, margens, cabeçalho e rodapé em cada uma ----------
  const PG_GAP = 30;                      // espaço (px) entre uma folha e a seguinte
  let pgShiftEl = null;
  function pgShiftSet(css){
    if(!pgShiftEl){ pgShiftEl = document.createElement('style'); pgShiftEl.id = 'pgShift'; document.head.appendChild(pgShiftEl); }
    if(pgShiftEl.textContent !== css) pgShiftEl.textContent = css;
  }
  let fnPosEl = null;
  function fnPosSet(css){
    if(!fnPosEl){ fnPosEl = document.createElement('style'); fnPosEl.id = 'fnPos'; document.head.appendChild(fnPosEl); }
    if(fnPosEl.textContent !== css) fnPosEl.textContent = css;
  }
  function pgClones(){
    document.querySelectorAll('.himgc,.hfc').forEach(n=>n.remove());
    const st = pgState, sh = document.getElementById('sheet');
    if(!st || !st.shifted || !sh) return;
    const n = st.starts.length, step = st.H + st.GAP;
    ['hfBack', 'hfFront'].forEach(id=>{
      const host = document.getElementById(id); if(!host) return;
      host.querySelectorAll('.himg').forEach(el=>{
        for(let k = 1; k < n; k++){
          const c = el.cloneNode(false); c.classList.remove('himg'); c.classList.add('himgc'); c.removeAttribute('data-id');
          c.style.top = ((parseFloat(el.style.top) || 0) + k * step) + 'px'; host.appendChild(c);
        }
      });
    });
    const mk = (src, dy, no)=>{
      const b = src && src.querySelector('.hfb'); if(!b || !(b.textContent.trim() || b.querySelector('.fld,img'))) return;
      const c = src.cloneNode(true); c.removeAttribute('id'); c.classList.add('hfc'); c.querySelectorAll('.hfl').forEach(x=>x.remove());
      c.querySelectorAll('.fld').forEach(sp=>{ sp.textContent = sp.dataset.f === 'pages' ? n : no; });
      c.style.transform = 'translateY(' + dy + 'px)'; sh.insertBefore(c, page);
    };
    const hdr = document.getElementById('hdr'), ftr = document.getElementById('ftr');
    for(let k = 1; k < n; k++) mk(hdr, k * step, k + 1);
    for(let k = 0; k < n - 1; k++) mk(ftr, -(n - 1 - k) * step, k + 1);
  }
  // Tabelas com várias linhas podem quebrar entre as linhas (como no Word): cada linha vira uma unidade da paginação
  function pgFlat(ks){
    const out = [];
    ks.forEach(k=>{
      if(k.tagName === 'TABLE' && k.rows.length > 1 && ![...k.rows].some(r=>[...r.cells].some(c=>c.rowSpan > 1))) out.push(...k.rows);
      else out.push(k);
    });
    return out;
  }
  function pgRowCss(tr, extra, room){             // empurra a linha para a próxima página: espaço no topo das células; as bordas laterais só aparecem onde há conteúdo
    const sec = tr.parentNode, tb = sec.parentNode, T = [...page.children].indexOf(tb) + 1;
    const S = [...tb.children].indexOf(sec) + 1, M = [...sec.children].indexOf(tr) + 1;
    let css = '';
    [...tr.cells].forEach((c, ci)=>{
      const cs = getComputedStyle(c), pt = parseFloat(cs.paddingTop) || 0;
      const side = (w, st, col)=>(parseFloat(w) > 0 && st !== 'none' && st !== 'hidden') ? {w:Math.max(1, parseFloat(w)), col} : null;   // mínimo 1px: com o zoom da tela (ex.: 110%) a borda de 0,9px sumia no fundo do quadro
      const L = side(cs.borderLeftWidth, cs.borderLeftStyle, cs.borderLeftColor), Rr = side(cs.borderRightWidth, cs.borderRightStyle, cs.borderRightColor);
      const g = o=>'linear-gradient(to bottom,' + o.col + ' 0,' + o.col + ' ' + Math.max(0, room).toFixed(1) + 'px,transparent ' + Math.max(0, room).toFixed(1) + 'px,transparent ' + extra.toFixed(1) + 'px,' + o.col + ' ' + extra.toFixed(1) + 'px,' + o.col + ' 100%)';
      const imgs = [], sz = [], ps = [];
      if(L){ imgs.push(g(L)); sz.push(L.w + 'px 100%'); ps.push('left top'); }
      if(Rr){ imgs.push(g(Rr)); sz.push(Rr.w + 'px 100%'); ps.push('right top'); }
      css += '#page>:nth-child(' + T + ')>:nth-child(' + S + ')>tr:nth-child(' + M + ')>:nth-child(' + (ci + 1) + '){padding-top:' + (pt + extra).toFixed(2) + 'px !important;' +
        (imgs.length ? 'border-left-color:transparent !important;border-right-color:transparent !important;background-image:' + imgs.join(',') + ' !important;background-size:' + sz.join(',') + ' !important;background-position:' + ps.join(',') + ' !important;background-repeat:no-repeat !important;' : '') + '}';
    });
    return css;
  }
  function cellSel(c){
    const tr = c.parentNode, sec = tr.parentNode, tb = sec.parentNode;
    return '#page>:nth-child(' + ([...page.children].indexOf(tb) + 1) + ')>:nth-child(' + ([...tb.children].indexOf(sec) + 1) + ')>tr:nth-child(' + ([...sec.children].indexOf(tr) + 1) + ')>:nth-child(' + ([...tr.children].indexOf(c) + 1) + ')';
  }
  // Caixa de uma célula só que atravessa a quebra: um espaço do tamanho do rodapé + intervalo + cabeçalho é aberto antes da 1ª linha que
  // não cabe (float invisível com shape-outside no ::before da célula) e as bordas laterais somem nesse trecho. Só CSS gerado, nada é gravado.
  let splitLines = [];
  // Impressão: o texto de uma célula que atravessa páginas também deixa livre o pé da página (onde ficam as notas de rodapé), como na tela.
  function splitPrint(k, list){
    const cell = k.tagName === 'TR' ? k.cells[0] : k.rows[0].cells[0];
    const sh = document.getElementById('sheet'), sr = sh.getBoundingClientRect(), sc = sh.offsetWidth ? sr.width / sh.offsetWidth : 1;
    const pr = page.getBoundingClientRect(), O = pr.top + (parseFloat(getComputedStyle(page).paddingTop) || 0) * sc;
    const cr = cell.getBoundingClientRect(), cs = getComputedStyle(cell);
    const cbTop = (cr.top - O) / sc, ctTop = cbTop + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0);
    let S = 0, hf = 0; const poly = ['0 0', '0.1px 0'];
    list.forEach(b=>{
      if(b.extra < 2) return;
      const a = b.y + 1 + S - ctTop, bb = a + b.extra - 1;
      poly.push('0.1px ' + a.toFixed(2) + 'px', '100% ' + a.toFixed(2) + 'px', '100% ' + bb.toFixed(2) + 'px', '0.1px ' + bb.toFixed(2) + 'px');
      S += b.extra; hf = bb;
    });
    if(!hf) return '';
    poly.push('0.1px ' + hf.toFixed(2) + 'px', '0 ' + hf.toFixed(2) + 'px');
    const sel = cellSel(cell);
    let css = sel + '::before{content:"";float:left;width:100%;height:' + hf.toFixed(2) + 'px;shape-outside:polygon(' + poly.join(',') + ')}';
    return css;
  }
  function splitCss(k, list){
    const cell = k.tagName === 'TR' ? k.cells[0] : k.rows[0].cells[0];
    const sh = document.getElementById('sheet'), sr = sh.getBoundingClientRect(), sc = sh.offsetWidth ? sr.width / sh.offsetWidth : 1;
    const pr = page.getBoundingClientRect(), O = pr.top + (parseFloat(getComputedStyle(page).paddingTop) || 0) * sc;
    const cr = cell.getBoundingClientRect(), cs = getComputedStyle(cell);
    const cbTop = (cr.top - O) / sc, ctTop = cbTop + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0);
    let S = 0, hf = 0; const poly = ['0 0', '0.1px 0'], gaps = [];
    list.forEach(b=>{
      const a = b.y + 1 + S - ctTop, bb = a + b.extra - 1;
      poly.push('0.1px ' + a.toFixed(2) + 'px', '100% ' + a.toFixed(2) + 'px', '100% ' + bb.toFixed(2) + 'px', '0.1px ' + bb.toFixed(2) + 'px');
      gaps.push([b.end + S - cbTop, b.y + S + b.extra - cbTop]); S += b.extra; hf = bb;
    });
    poly.push('0.1px ' + hf.toFixed(2) + 'px', '0 ' + hf.toFixed(2) + 'px');
    const sel = cellSel(cell);
    let css = sel + '::before{content:"";float:left;width:100%;height:' + hf.toFixed(2) + 'px;shape-outside:polygon(' + poly.join(',') + ')}';
    const side = (w, st, col)=>(parseFloat(w) > 0 && st !== 'none' && st !== 'hidden') ? {w:Math.max(1, parseFloat(w)), col} : null;   // mínimo 1px: com o zoom da tela (ex.: 110%) a borda de 0,9px sumia no fundo do quadro
    const Lb = side(cs.borderLeftWidth, cs.borderLeftStyle, cs.borderLeftColor), Rb = side(cs.borderRightWidth, cs.borderRightStyle, cs.borderRightColor);
    const g = o=>{ const q = []; let cur = 0; gaps.forEach(([a, b])=>{ q.push(o.col + ' ' + cur.toFixed(1) + 'px', o.col + ' ' + Math.max(cur, a).toFixed(1) + 'px', 'transparent ' + Math.max(cur, a).toFixed(1) + 'px', 'transparent ' + b.toFixed(1) + 'px'); cur = b; }); q.push(o.col + ' ' + cur.toFixed(1) + 'px', o.col + ' 100%'); return 'linear-gradient(to bottom,' + q.join(',') + ')'; };
    const imgs = [], sz = [], ps = [];
    const sx = k.tagName === 'TR' ? '-1px' : '0';   // linha dentro de uma tabela maior (bordas recolhidas): alinha o traço com a borda real das outras linhas
    if(Lb){ imgs.push(g(Lb)); sz.push(Lb.w + 'px 100%'); ps.push('left ' + sx + ' top'); }
    if(Rb){ imgs.push(g(Rb)); sz.push(Rb.w + 'px 100%'); ps.push('right ' + sx + ' top'); }
    // Fecha o quadro onde a página termina (borda de baixo) e reabre no começo da página seguinte (borda de cima), como no Word
    let Tb = side(cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor), Bb = side(cs.borderBottomWidth, cs.borderBottomStyle, cs.borderBottomColor);
    // linha de um quadro maior (ex.: campo "Relato" do Encaminhamento) só tem as bordas laterais: usa a cor e a espessura delas para fechar/reabrir o quadro na quebra
    if(k.tagName === 'TR' && Lb && Rb){ if(!Tb) Tb = {w:Lb.w, col:Lb.col}; if(!Bb) Bb = {w:Lb.w, col:Lb.col}; }
    // As linhas de fechamento são elementos reais na camada #pgOv (em vez de degradês de fundo, que em alguns navegadores/zooms sumiam)
    const cx = (cr.left - sr.left) / sc, cw = cr.width / sc, cy = (cr.top - sr.top) / sc;
    gaps.forEach(([a, b])=>{
      if(Bb) splitLines.push({x:cx, w:cw, y:cy + a - Bb.w, h:Bb.w, col:Bb.col});
      if(Tb) splitLines.push({x:cx, w:cw, y:cy + b, h:Tb.w, col:Tb.col});
    });
    if(imgs.length) css += sel + '{border-left-color:transparent !important;border-right-color:transparent !important;background-image:' + imgs.join(',') + ' !important;background-size:' + sz.join(',') + ' !important;background-position:' + ps.join(',') + ' !important;background-repeat:no-repeat !important;background-origin:border-box !important}';
    return css;
  }
  // A paginação tira e recoloca os espaços entre as páginas só para medir. Sem este cuidado o navegador rola a tela sozinho
  // enquanto se digita (ex.: no quadro "05 – Situação Apresentada"). Aqui o cursor volta ao mesmo ponto da tela depois de medir.
  function pgKeepView(){
    const m = document.querySelector('main'); if(!m) return ()=>{};
    const cy = ()=>{
      const s = getSelection(); if(!s.rangeCount || !s.anchorNode || !page.contains(s.anchorNode)) return null;
      const r = s.getRangeAt(0).cloneRange(); r.collapse(true);
      let rc = r.getClientRects()[0];
      if(!rc || !rc.height){ const n = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement; if(!n) return null; rc = n.getBoundingClientRect(); }
      return rc.top;
    };
    const y0 = cy(), st0 = m.scrollTop;
    return ()=>{
      const y1 = cy();
      if(y0 != null && y1 != null){ const d = y1 - y0; if(Math.abs(d) > 1) m.scrollTop += d; }
      else if(Math.abs(m.scrollTop - st0) > 1) m.scrollTop = st0;
    };
  }
  function pgMarks(){
    cancelAnimationFrame(pgRaf);
    pgRaf = requestAnimationFrame(()=>{ const keep = pgKeepView(); try{ pgRun(); }finally{ keep(); } });
  }
  function pgRun(){
      const sh = document.getElementById('sheet'); if(!sh || !page.isConnected) return;
      let ov = document.getElementById('pgOv');
      const pg = pgOf();
      if(pg.cols > 1){ if(ov) ov.remove(); pgState = null; pgShiftSet(''); fnPosSet(''); pgClones(); page.style.minHeight = ''; return; }
      pgShiftSet(''); fnPosSet('');         // mede o texto sem o espaço entre as páginas e com as notas no fluxo
      if(!ov){ ov = document.createElement('div'); ov.id = 'pgOv'; ov.setAttribute('aria-hidden', 'true'); sh.appendChild(ov); }
      const sr = sh.getBoundingClientRect(), sc = sh.offsetWidth ? sr.width / sh.offsetWidth : 1;
      const e = effMar(), use = Math.max(CMPX, pg.h * CMPX - e.t - e.b);
      const pr = page.getBoundingClientRect(), padT = parseFloat(getComputedStyle(page).paddingTop) || 0, O = pr.top + padT * sc;
      const kids0 = [...page.children].filter(k=>{ if(k.hasAttribute('data-hid')) return false; const p = getComputedStyle(k).position; return p !== 'absolute' && p !== 'fixed'; });
      let R = new Map(), kids = kids0, starts, fn = null;
      const rectOf = k=>{ const r = k.getBoundingClientRect(), o = {top:(r.top - O) / sc, bot:(r.bottom - O) / sc}; R.set(k, o); return o; };
      const isHard = (kl, st)=>st.slice(1).every(x=>(st.splits && st.splits.has(x)) || kl.findIndex(k=>{ const r = R.get(k); return r && Math.abs(r.top - x) <= 1; }) >= 0);
      // topo (px, sem espaço entre páginas) da 1ª linha da caixa que passa de "limit": é onde começa a próxima página
      const splitOf = (k, limit)=>{
        const cell = k.tagName === 'TR' ? (k.cells.length === 1 ? k.cells[0] : null) : (k.tagName === 'TABLE' && k.rows.length === 1 && k.rows[0].cells.length === 1 ? k.rows[0].cells[0] : null);
        if(!cell) return null;
        let best = null;
        const take = (r, el)=>{ if(r.height < 1) return; const cs = getComputedStyle(el), lh = parseFloat(cs.lineHeight), hl = isFinite(lh) ? Math.max(0, (lh * 1 - r.height / sc) / 2) : 0, top = (r.top - O) / sc - hl, bot = top + (isFinite(lh) ? lh : r.height / sc); if(bot > limit + .5 && (best == null || top < best)) best = top; };
        const tw = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, {acceptNode:n=>n.nodeValue.replace(/[\s\u200b]/g, '') ? 1 : 2}), rg = document.createRange();
        for(let n; (n = tw.nextNode());){ rg.selectNodeContents(n); [...rg.getClientRects()].forEach(r=>take(r, n.parentElement)); }
        cell.querySelectorAll('p,div,li,h1,h2,h3,h4').forEach(b=>{ if(!b.textContent.replace(/[\s\u200b]/g, '') && !b.querySelector('img,table')) take(b.getBoundingClientRect(), b); });
        cell.querySelectorAll('img').forEach(im=>take(im.getBoundingClientRect(), im));
        return best;
      };
      // Notas de rodapé como no Word: cada nota fica no pé da página onde está o número, e o texto da página ganha menos espaço
      const fnBx = fnBox(false), fnMk = [...page.querySelectorAll('sup.fn')].filter(m=>!m.closest('.fnotes'));
      if(fnBx && fnMk.length){
        kids = kids0.filter(k=>k !== fnBx);
        const hOf = new Map(); fnBx.querySelectorAll('p.fnote').forEach(nn=>{ if(!hOf.has(nn.dataset.id)) hOf.set(nn.dataset.id, nn.getBoundingClientRect().height / sc); });
        const mk = fnMk.map(m=>{ let k = m; while(k && k.parentNode !== page) k = k.parentNode; const mr = m.getBoundingClientRect(); return {id:m.dataset.id, k, own:k && k.tagName === 'TABLE', top:((mr.top + mr.bottom) / 2 - O) / sc}; });
        const res = []; let pn = null, st = null, good = false;
        for(let it = 0; it < 8 && !good; it++){
          R = new Map(); st = pgPlan(pgFlat(kids), p=>Math.max(CMPX, use - (res[p] || 0)), rectOf, splitOf); kids.forEach(k=>{ if(k.tagName === 'TABLE' && !R.has(k)) rectOf(k); });
          pn = []; mk.forEach(x=>{ const r = R.get(x.k); if(!r) return; const yy = x.own ? Math.max(r.top, x.top) : r.top; let p = 0; while(p + 1 < st.length && st[p + 1] <= yy + 1) p++;   // número dentro de tabela que passa de página: vale a posição do número, não a do topo da tabela
 (pn[p] = pn[p] || []).push(x.id); });
          good = true;
          pn.forEach((ids, p)=>{ if(!ids) return; const h = FN_PAD + ids.reduce((a, id)=>a + (hOf.get(id) || 0), 0); if(h > (res[p] || 0) + .5){ res[p] = h; good = false; } });
        }
        if(good && res.every(h=>!h || h <= use * .6) && isHard(pgFlat(kids), st)){ fn = {pn, hOf}; starts = st; }
        else{ kids = kids0; }
      }
      if(!fn){ R = new Map(); starts = pgPlan(pgFlat(kids), use, rectOf, splitOf); kids.forEach(k=>{ if(k.tagName === 'TABLE' && !R.has(k)) rectOf(k); }); }
      const base = (O - sr.top) / sc, was = pgState ? pgState.starts.length : 0, n = starts.length;
      // cada início de página precisa coincidir com o topo de um bloco; senão (bloco maior que a página) usa só a linha tracejada
      const ku = pgFlat(kids), firstAt = s=>ku.findIndex(k=>{ const r = R.get(k); return r && Math.abs(r.top - s) <= 1; });
      const sp = starts.splits || new Map(), hard = starts.slice(1).every(s=>sp.has(s) || firstAt(s) >= 0);
      let out = '', total = 0, printSplit = '';
      if(hard && n > 1){
        const H = e.t + use + e.b, P = H + PG_GAP, off = base - padT;
        let css = '';
        const bands = new Map();
        for(let p = 1; p < n; p++){
          let blank = 0; while(p + 1 < n && starts[p + 1] === starts[p] && !sp.has(starts[p])){ p++; blank++; }   // páginas em branco (seção par/ímpar) entram no mesmo espaço
          if(sp.has(starts[p])){ const o = sp.get(starts[p]); if(!bands.has(o.k)) bands.set(o.k, []); bands.get(o.k).push({y:starts[p], end:o.end, extra:P - (starts[p] - starts[p - 1]), prevY:starts[p - 1]}); continue; }
          const i = firstAt(starts[p]), k = ku[i], prev = ku[i - 1], r = R.get(k), pv = prev && R.get(prev);
          const nat = pv ? Math.max(0, r.top - pv.bot) : 0, extra = P - (starts[p] - starts[p - 1]) + blank * P;
          if(k.tagName === 'TR' && k.rowIndex > 0) css += pgRowCss(k, extra, starts[p - 1] + use - r.top);
          else{ const el = k.tagName === 'TR' ? k.closest('table') : k; css += '#page>:nth-child(' + ([...page.children].indexOf(el) + 1) + '){margin-top:' + (nat + extra).toFixed(2) + 'px !important}'; }
        }
        splitLines = [];
        bands.forEach((list, k)=>{ css += splitCss(k, list); printSplit += splitPrint(k, list.map(b=>({y:b.y, end:b.end, extra:use - (b.y - b.prevY)}))); });
        pgShiftSet('@media screen{' + css + '}');
        pgState = {starts, base, use, shifted:true, P, H, GAP:PG_GAP, et:e.t, off};
        for(let k = 0; k < n - 1; k++)
          out += '<div class="pgg" style="top:' + Math.round(off + (k + 1) * H + k * PG_GAP) + 'px;height:' + PG_GAP + 'px"><span>Fim da página ' + (k + 1) + ' · Início da página ' + (k + 2) + '</span></div>';
        splitLines.forEach(l=>{ out += '<div class="pgl" style="left:' + l.x.toFixed(2) + 'px;width:' + l.w.toFixed(2) + 'px;top:' + l.y.toFixed(2) + 'px;height:' + l.h + 'px;background:' + l.col + '"></div>'; });
        total = n * H + (n - 1) * PG_GAP;
        out += '<div class="pgb end" style="top:' + Math.round(off + total - e.b) + 'px"><span>Fim da página ' + n + '</span></div>';
        ov.innerHTML = out;
        page.style.minHeight = Math.ceil(total - (page.offsetTop || 0)) + 'px';
      }else{
        pgState = {starts, base, use};
        for(let k = 1; k < n; k++)
          out += '<div class="pgb" style="top:' + Math.round(base + starts[k] - 3) + 'px"><span>Fim da página ' + k + ' · Início da página ' + (k + 1) + '</span></div>';
        const last = n - 1, endY = base + starts[last] + use;
        out += '<div class="pgb end" style="top:' + Math.round(endY) + 'px"><span>Fim da página ' + (last + 1) + '</span></div>';
        ov.innerHTML = out;
        const need = Math.ceil(endY + e.b - (page.offsetTop || 0));
        page.style.minHeight = need > pg.h * CMPX ? need + 'px' : '';
      }
      if(fn){
        // posiciona cada nota no pé da sua página (só por CSS gerado: nada disso é gravado no documento)
        const cw = Math.max(CMPX, pg.w * CMPX - e.l - e.r), P2 = e.t + use + e.b + PG_GAP;
        const rules = (left, bottomOf)=>{
          let r = '#page>.fnotes{height:0;margin:0;padding:0;border:0}#page>.fnotes .fnsep{display:none}' +
            '#page>.fnotes p.fnote{position:absolute;left:' + left + 'px;width:' + cw + 'px;margin:0;box-sizing:border-box}';
          fn.pn.forEach((ids, p)=>{
            const bh = FN_PAD + ids.reduce((a, id)=>a + (fn.hOf.get(id) || 0), 0), y0 = bottomOf(p) - bh; let cum = FN_PAD;
            ids.forEach((id, i)=>{
              const q = '#page>.fnotes p.fnote[data-id="' + id + '"]';
              r += q + '{top:' + (i ? y0 + cum : y0).toFixed(2) + 'px' + (i ? '' : ';padding-top:' + FN_PAD + 'px') + '}';
              if(!i) r += q + '::before{content:"";position:absolute;left:0;top:' + FN_LINE + 'px;width:5cm;border-top:1px solid currentColor}';
              cum += fn.hOf.get(id) || 0;
            });
          });
          return r;
        };
        let brk = '';
        const selOf = el=>{ let sel = ''; for(let x = el; x && x !== page; x = x.parentNode){ if(!x.parentNode) return null; sel = '>:nth-child(' + ([...x.parentNode.children].indexOf(x) + 1) + ')' + sel; } return '#page' + sel; };   // caminho até o elemento (linha de tabela incluída)
        for(let p = 1; p < n; p++){
          const flat = pgFlat(kids), k = flat[flat.findIndex(x=>{ const r = R.get(x); return r && Math.abs(r.top - starts[p]) <= 1; })]; if(!k) continue;
          const pv = k.previousElementSibling; if(pv && pv.matches('.pb,.sbk[data-t="next"],.sbk[data-t="odd"],.sbk[data-t="even"]')) continue;   // já há quebra de página antes dele: outra geraria página em branco
          const sel = selOf(k); if(sel) brk += sel + '{break-before:page}';   // k pode ser uma linha dentro de tabela: antes a regra não pegava e a tabela seguia reta por cima das notas
        }
        fnPosSet('@media screen{' + rules(e.l, p=>p * P2 + e.t + use) + '}@media print{' + brk + printSplit + rules(0, p=>(p + 1) * use) + 'html #page{min-height:' + Math.floor(n * use - 1) + 'px !important}}');
      }
      pgClones();
      if(was !== n){ try{ hfRender(); }catch(err){} }
      try{ window.__pgUpdate && window.__pgUpdate(); }catch(err){}   // atualiza "Página x de y" (pgUpdate fica dentro de outra função)
  }
  function hfRender(){
    const hh = hfData(), n = pageCount();
    ['h','f'].forEach(k=>{
      const el = document.getElementById(k === 'h' ? 'hdr' : 'ftr'); if(!el) return;
      const b = el.querySelector('.hfb');
      if(!document.body.classList.contains('hfedit') && b.dataset.v !== hh[k]){ b.innerHTML = hh[k]; b.dataset.v = hh[k]; }
      b.style.textAlign = hh[k + 'a'] || 'left';
      const sty = hfStyle(k);
      b.style.fontFamily = '"' + sty.ff + '",Carlito,"Liberation Serif",sans-serif'; b.style.fontSize = sty.fs + 'pt';
      b.style.fontWeight = sty.b ? '700' : ''; b.style.fontStyle = sty.i ? 'italic' : ''; b.style.textDecoration = sty.u ? 'underline' : '';
      b.style.color = sty.c || '';
      b.querySelectorAll('.fld').forEach(sp=>{ sp.contentEditable = 'false'; sp.textContent = sp.dataset.f === 'pages' ? n : (k === 'h' ? 1 : n); });
    });
    const dif = document.getElementById('hfDif'); if(dif) dif.checked = !!hh.dif;
    hfLayers();
  }
