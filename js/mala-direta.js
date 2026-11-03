/* Verbus — Guia Correspondências (mala direta, envelopes, etiquetas)
   (js/mala-direta.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ================= Correspondências =================
  (function(){
    const E = t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const RK = LS_KEYS.remetente;
    const RDEF = {nome:'Paulo Luã Oliveira Xavier', cargo:'Psicólogo – CRP-20/09816', orgao:'CRAS Cristiana Vicente Nunes – SEMADS', cidade:'Boa Vista – RR'};
    const rem = ()=>{ try{ return Object.assign({}, RDEF, JSON.parse(localStorage.getItem(RK) || '{}')); }catch(e){ return Object.assign({}, RDEF); } };
    const P = (t, st)=>'<p style="margin:0;text-indent:0;text-align:left;' + (st || '') + '">' + (t || '<br>') + '</p>';
    const C = 'text-align:center;', B = P('');
    const ano = ()=>new Date().getFullYear();
    const put = h=>{ restore(); exec('insertHTML', h); };
    const bl = {
      data: ()=>P(E(rem().cidade) + ', ' + dataLongaBR() + '.', 'text-align:right;'),
      dest: ()=>P('Ao(À) Senhor(a) <b>[Nome do destinatário]</b>') + P('[Cargo]') + P('[Órgão / Instituição]') + P('[Cidade – UF]'),
      assunto: ()=>P('<b>Assunto:</b> [assunto]'),
      voc: ()=>P('Senhor(a) [cargo],'),
      corpo: ()=>'<p>Digite aqui o texto.</p>',
      fecho: t=>P(t || 'Atenciosamente,', C),
      assin: ()=>{ const r = rem(); return B + P('_______________________________', C) + P('<b>' + E(r.nome) + '</b>', C) + P(E(r.cargo), C) + P(E(r.orgao), C); }
    };
    const docs = {
      cmOficio: ()=>P('<b>OFÍCIO Nº ___/' + ano() + ' – ' + E(rem().orgao) + '</b>') + B + bl.data() + B + bl.dest() + B + bl.assunto() + B + bl.voc() + B + bl.corpo() + B + bl.fecho('Respeitosamente,') + bl.assin(),
      cmMemo: ()=>P('<b>MEMORANDO Nº ___/' + ano() + '</b>') + B + bl.data() + B + P('<b>De:</b> ' + E(rem().cargo.split('–')[0].trim() + ' – ' + rem().orgao)) + P('<b>Para:</b> [destinatário]') + P('<b>Assunto:</b> [assunto]') + B + bl.corpo() + B + bl.fecho() + bl.assin(),
      cmDecl: ()=>P('<b>DECLARAÇÃO</b>', C) + B + '<p>Declaro, para os devidos fins, que [nome completo], portador(a) do CPF nº [000.000.000-00], [complemento da declaração].</p>' + B + bl.data() + bl.assin(),
      cmCarta: ()=>bl.data() + B + bl.dest() + B + P('Prezado(a) Senhor(a),') + B + bl.corpo() + B + bl.fecho() + bl.assin(),
      cmReq: ()=>P('Ao(À) Senhor(a) [cargo do destinatário]') + P('[Órgão / Instituição]') + B + P('<b>REQUERIMENTO</b>', C) + B + '<p>[Nome completo], [qualificação], vem, respeitosamente, requerer [objeto do pedido], pelos motivos a seguir expostos: [justificativa].</p>' + '<p>Nestes termos, pede deferimento.</p>' + B + bl.data() + bl.assin()
    };
    Object.keys(docs).forEach(id=>{ const b = $(id); if(b) b.addEventListener('click', ()=>put(docs[id]())); });
    [['cmData', bl.data], ['cmDest', bl.dest], ['cmAssunto', bl.assunto], ['cmVoc', bl.voc], ['cmFecho', ()=>bl.fecho()], ['cmAssin', bl.assin]].forEach(([id, f])=>{ const b = $(id); if(b) b.addEventListener('click', ()=>put(f())); });

    // remetente
    const rd = $('cmRemDlg');
    $('cmRem').addEventListener('click', ()=>{ const r = rem(); $('cmRNome').value = r.nome; $('cmRCargo').value = r.cargo; $('cmROrgao').value = r.orgao; $('cmRCidade').value = r.cidade; rd.showModal(); });
    $('cmRCancel').addEventListener('click', ()=>rd.close());
    $('cmRSave').addEventListener('click', ()=>{
      try{ localStorage.setItem(RK, JSON.stringify({nome:$('cmRNome').value.trim(), cargo:$('cmRCargo').value.trim(), orgao:$('cmROrgao').value.trim(), cidade:$('cmRCidade').value.trim()})); }catch(e){}
      rd.close();
    });

    // ===== Mala direta (como no Word) =====
    const LK = LS_KEYS.mala2, AK = LS_KEYS.mapa, DK = LS_KEYS.maladef, MODEK = LS_KEYS.malamodo;
    const EA = t=>E(t).replace(/"/g, '&quot;');
    const norm = t=>String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
    const jget = (k, d)=>{ try{ const v = JSON.parse(localStorage.getItem(k) || ''); return v == null ? d : v; }catch(e){ return d; } };
    const jset = (k, v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
    const jp = s=>{ try{ return JSON.parse(s || '{}') || {}; }catch(e){ return {}; } };
    const DEFHEAD = ['Tratamento', 'Nome', 'Sobrenome', 'Cargo', 'Órgão', 'Endereço', 'Bairro', 'Cidade', 'UF', 'CEP', 'E-mail'];
    const MODOS = {cartas:'Cartas', email:'Mensagens de E-mail', envelopes:'Envelopes', etiquetas:'Etiquetas', diretorio:'Diretório', normal:'Documento Normal'};

    // ---- lista de destinatários ----
    function csv(txt){
      txt = String(txt || '').replace(/^﻿/, '');
      const first = txt.split(/\r?\n/).find(l=>l.trim()) || '';
      const n = s=>first.split(s).length - 1;
      const sep = n('\t') ? '\t' : (n(';') && n(';') >= n(',')) ? ';' : ',';
      const out = []; let row = [], cur = '', q = false;
      const endRow = ()=>{ row.push(cur); cur = ''; if(row.some(x=>x.trim() !== '')) out.push(row); row = []; };
      for(let i = 0; i < txt.length; i++){
        const c = txt[i];
        if(q){ if(c === '"'){ if(txt[i + 1] === '"'){ cur += '"'; i++; } else q = false; } else cur += c; }
        else if(c === '"' && cur === '') q = true;
        else if(c === sep){ row.push(cur); cur = ''; }
        else if(c === '\n' || c === '\r'){ if(c === '\r' && txt[i + 1] === '\n') i++; endRow(); }
        else cur += c;
      }
      endRow();
      return out.map(r=>r.map(x=>x.trim()));
    }
    function fromRows(a){
      const head = (a[0] || []).map((h, i)=>String(h).trim() || ('Campo ' + (i + 1)));
      return {head, rows: a.slice(1).map(r=>({v: head.map((_, i)=>r[i] == null ? '' : String(r[i])), off:false}))};
    }
    let L = (function(){
      const j = jget(LK, null);
      if(j && Array.isArray(j.head)) return {head:j.head, rows:(j.rows || []).map(r=>({v:r.v || [], off:!!r.off}))};
      let raw = ''; try{ raw = localStorage.getItem(LS_KEYS.mala) || ''; }catch(e){}
      return fromRows(csv(raw));
    })();
    const saveList = ()=>jset(LK, L);
    const actv = ()=>L.rows.filter(r=>!r.off);
    const hidx = n=>{ let i = L.head.indexOf(n); if(i < 0){ const k = norm(n); i = L.head.findIndex(h=>norm(h) === k); } return i; };
    const getv = (r, n)=>{ const i = hidx(n); return i >= 0 ? String(r.v[i] == null ? '' : r.v[i]).trim() : ''; };
    const S = {mode: MODOS[jget(MODEK, 'cartas')] ? jget(MODEK, 'cartas') : 'cartas', prev:false, i:0, q:''};

    // ---- campos conhecidos (Corresponder campos) ----
    const GUESS = {
      trat:['tratamento', 'titulo', 'pronome'], nome:['nome', 'nome completo', 'destinatario'], sobrenome:['sobrenome'],
      cargo:['cargo', 'funcao'], orgao:['orgao', 'empresa', 'instituicao', 'organizacao', 'unidade'],
      end:['endereco', 'logradouro', 'rua'], comp:['complemento'], bairro:['bairro'], cidade:['cidade', 'municipio'],
      uf:['uf', 'estado'], cep:['cep'], pais:['pais'], sexo:['sexo', 'genero']
    };
    const KLAB = {trat:'Tratamento', nome:'Nome', sobrenome:'Sobrenome', cargo:'Cargo', orgao:'Órgão / empresa', end:'Endereço', comp:'Complemento', bairro:'Bairro', cidade:'Cidade', uf:'UF', cep:'CEP', pais:'País', sexo:'Sexo / gênero'};
    let MPO = null;
    const colOf = k=>{
      const m = (MPO || jget(AK, {}))[k];
      if(m === '') return '';
      if(m && L.head.includes(m)) return m;
      for(const a of GUESS[k]){ const h = L.head.find(h=>norm(h) === a); if(h) return h; }
      return '';
    };
    const gv = (r, k)=>{ const c = colOf(k); return c ? getv(r, c) : ''; };
    const DEF = Object.assign({a:{trat:true, cargo:true, orgao:true, pais:false}, g:{pre:'Prezado(a)', fmt:'trat_sobr', punct:',', fb:'Prezado(a) Senhor(a),', gen:true}}, jget(DK, {}));

    function addrLines(r, o){
      const nome = [o.trat ? gv(r, 'trat') : '', gv(r, 'nome'), gv(r, 'sobrenome')].filter(Boolean).join(' ');
      const cu = [gv(r, 'cidade'), gv(r, 'uf')].filter(Boolean).join(' – ');
      const cep = gv(r, 'cep');
      return [nome, o.cargo ? gv(r, 'cargo') : '', o.orgao ? gv(r, 'orgao') : '', [gv(r, 'end'), gv(r, 'comp')].filter(Boolean).join(', '), gv(r, 'bairro'),
        [cep ? 'CEP ' + cep : '', cu].filter(Boolean).join(' – '), o.pais ? gv(r, 'pais') : ''].filter(x=>x && x.trim());
    }
    function greet(r, o){
      const nome = gv(r, 'nome'), sob = gv(r, 'sobrenome'), trat = gv(r, 'trat'), sexo = norm(gv(r, 'sexo'));
      if(!nome && !sob) return o.fb;
      const parts = nome.split(/\s+/).filter(Boolean), first = parts[0] || '';
      const last = sob || (parts.length > 1 ? parts[parts.length - 1] : '');
      const full = [nome, sob].filter(Boolean).join(' ');
      let who;
      if(o.fmt === 'primeiro') who = first;
      else if(o.fmt === 'nome') who = full;
      else if(o.fmt === 'trat_nome') who = [trat, full].filter(Boolean).join(' ');
      else who = trat && last ? trat + ' ' + last : full;
      let pre = o.pre || '';
      if(o.gen && sexo){
        const f = /^(f|fem)/.test(sexo), m = /^(m|masc)/.test(sexo);
        if(f) pre = pre.replace(/o\(a\)/g, 'a').replace(/\(a\)/g, 'a'); else if(m) pre = pre.replace(/\(a\)/g, '');
      }
      return (pre ? pre + ' ' : '') + who + (o.punct || '');
    }
    function test(r, o){
      const a = getv(r, o.f), A = norm(a), B = norm(o.v);
      switch(o.op){
        case 'eq': return A === B; case 'ne': return A !== B; case 'has': return A.includes(B);
        case 'empty': return A === ''; case 'notempty': return A !== '';
        case 'gt': case 'lt': {
          const x = parseFloat(a.replace(',', '.')), y = parseFloat(String(o.v).replace(',', '.'));
          const c = (isNaN(x) || isNaN(y)) ? (A > B ? 1 : A < B ? -1 : 0) : (x > y ? 1 : x < y ? -1 : 0);
          return o.op === 'gt' ? c > 0 : c < 0;
        }
      }
      return false;
    }
    function lab(k, f, o){
      if(k === 'field') return '«' + f + '»';
      if(k === 'addr') return '«Bloco de Endereços»';
      if(k === 'greet') return '«Linha de Saudação»';
      if(k === 'seq') return '«Registro nº»';
      if(k === 'date') return '«Data»';
      if(k === 'if') return '«Se ' + ((o && o.f) || '…') + ' …»';
      return '«?»';
    }
    function valueHTML(sp, r, idx){
      const k = sp.dataset.mf, o = jp(sp.dataset.o);
      if(k === 'field') return E(getv(r, sp.dataset.f));
      if(k === 'addr') return addrLines(r, Object.assign({}, DEF.a, o)).map(E).join('<br>');
      if(k === 'greet') return E(greet(r, Object.assign({}, DEF.g, o)));
      if(k === 'seq') return String(idx + 1);
      if(k === 'date') return E(dataLongaBR());
      if(k === 'if') return E(test(r, o) ? (o.then || '') : (o.else || ''));
      return '';
    }
    const spanH = (kind, f, o)=>'<span class="mf" contenteditable="false" data-mf="' + kind + '"' + (f != null ? ' data-f="' + EA(f) + '"' : '') + (o ? ' data-o="' + EA(JSON.stringify(o)) + '"' : '') + '>' + E(lab(kind, f, o)) + '</span>';
    const spans = ()=>[...page.querySelectorAll('span.mf')];

    // {{Campo}} digitado vira campo de mesclagem
    function upgradeText(){
      const w = document.createTreeWalker(page, NodeFilter.SHOW_TEXT, {acceptNode:n=>(/\{\{[^{}]+\}\}/.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest('.mf'))) ? 1 : 3});
      const nodes = []; let n; while((n = w.nextNode())) nodes.push(n);
      nodes.forEach(t=>{
        const frag = document.createDocumentFragment(); let last = 0; const s = t.nodeValue;
        s.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (m, k, off)=>{
          if(off > last) frag.appendChild(document.createTextNode(s.slice(last, off)));
          const tp = document.createElement('template'); tp.innerHTML = norm(k) === 'data' ? spanH('date') : spanH('field', k.trim());
          frag.appendChild(tp.content.firstChild); last = off + m.length; return m;
        });
        if(last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
        t.replaceWith(frag);
      });
    }

    // ---- visualizar resultados ----
    const NAV = ['cmFirst', 'cmBack', 'cmNum', 'cmNext', 'cmLast'];
    function paint(){
      const act = actv(), on = S.prev && act.length > 0;
      if(S.i >= act.length) S.i = Math.max(0, act.length - 1);
      spans().forEach(sp=>{
        if(on){ sp.innerHTML = valueHTML(sp, act[S.i], S.i) || '​'; sp.classList.add('pv'); }
        else { sp.textContent = lab(sp.dataset.mf, sp.dataset.f, jp(sp.dataset.o)); sp.classList.remove('pv'); }
      });
      NAV.forEach(id=>{ $(id).disabled = !on; });
      $('cmNum').value = on ? S.i + 1 : 1; $('cmNum').max = act.length || 1;
      $('cmTot').textContent = on ? 'de ' + act.length : '';
      $('cmPrev').classList.toggle('on', on); $('cmPrev').setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    function needList(){ if(!L.head.length || !L.rows.length){ alert('Primeiro selecione os destinatários: Selecionar Destinatários > Digitar Nova Lista, Usar Lista Existente (arquivo CSV) ou Colar da Planilha.'); return true; } if(!actv().length){ alert('Nenhum destinatário está marcado na lista.'); return true; } return false; }
    $('cmPrev').addEventListener('click', ()=>{
      if(S.prev){ S.prev = false; paint(); return; }
      if(needList()) return;
      upgradeText(); S.prev = true; S.i = 0; paint();
    });
    const go = i=>{ const n = actv().length; S.i = Math.max(0, Math.min(n - 1, i)); paint(); };
    $('cmFirst').addEventListener('click', ()=>go(0)); $('cmBack').addEventListener('click', ()=>go(S.i - 1));
    $('cmNext').addEventListener('click', ()=>go(S.i + 1)); $('cmLast').addEventListener('click', ()=>go(actv().length - 1));
    $('cmNum').addEventListener('change', e=>go((parseInt(e.target.value, 10) || 1) - 1));
    // com a visualização ligada o texto não é editado (como no Word)
    page.addEventListener('beforeinput', e=>{
      if(!S.prev) return;
      if(page.querySelector('span.mf.pv')) e.preventDefault(); else { S.prev = false; paint(); }
    }, true);
    $('cmHi').addEventListener('click', ()=>{ const on = !document.body.classList.contains('mfhi'); document.body.classList.toggle('mfhi', on); $('cmHi').classList.toggle('on', on); $('cmHi').setAttribute('aria-pressed', on ? 'true' : 'false'); });
    $('cmFind').addEventListener('click', ()=>{
      if(needList()) return;
      const q = prompt('Localizar destinatário (nome ou qualquer dado da lista):', S.q || ''); if(q === null || !q.trim()) return;
      const k = norm(q), act = actv(); const start = (S.q === q.trim() && S.prev) ? S.i + 1 : 0; S.q = q.trim();
      for(let j = 0; j < act.length; j++){
        const i = (start + j) % act.length;
        if(act[i].v.some(c=>norm(c).includes(k))){ if(!S.prev){ upgradeText(); S.prev = true; } S.i = i; paint(); return; }
      }
      alert('Nenhum destinatário encontrado com “' + q.trim() + '”.');
    });

    // ---- menus e diálogos ----
    function pop(btn, build){
      let el = null;
      const close = ()=>{ if(el){ el.remove(); el = null; } btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', out, true); document.removeEventListener('keydown', esc, true); };
      const out = e=>{ if(el && !el.contains(e.target) && !btn.contains(e.target)) close(); };
      const esc = e=>{ if(e.key === 'Escape'){ e.preventDefault(); close(); } };
      btn.addEventListener('mousedown', e=>e.preventDefault());
      btn.addEventListener('click', ()=>{
        if(el){ close(); return; }
        el = document.createElement('div'); el.id = 'tblPop'; el.setAttribute('role', 'menu');
        build().forEach(it=>{
          if(it === '-'){ el.appendChild(document.createElement('hr')); return; }
          if(it.hd){ const h = document.createElement('div'); h.className = 'tl'; h.textContent = it.hd; el.appendChild(h); return; }
          const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', it.chk !== undefined ? 'menuitemcheckbox' : 'menuitem');
          b.textContent = (it.chk !== undefined ? (it.chk ? '✓ ' : ' ') : '') + it.t; if(it.h) b.title = it.h;
          b.addEventListener('click', ()=>{ close(); it.f(); }); el.appendChild(b);
        });
        el.style.maxHeight = '70vh'; el.style.overflowY = 'auto';
        el.addEventListener('mousedown', e=>e.preventDefault());
        document.body.appendChild(el);
        const r = btn.getBoundingClientRect();
        el.style.left = Math.max(4, Math.min(r.left, innerWidth - el.offsetWidth - 4)) + 'px'; el.style.top = Math.min(r.bottom + 2, innerHeight - el.offsetHeight - 4) + 'px';
        btn.setAttribute('aria-expanded', 'true');
        document.addEventListener('mousedown', out, true); document.addEventListener('keydown', esc, true);
      });
    }
    function mk(id, html, cls){
      const o = $(id); if(o) o.remove();
      const d = document.createElement('dialog'); d.id = id; d.className = 'mcd ' + (cls || ''); d.innerHTML = html;
      d.addEventListener('close', ()=>setTimeout(()=>d.remove(), 0));
      document.body.appendChild(d); return d;
    }
    const q = (d, s)=>d.querySelector(s);
    const ZW = '\u200b';
    const putM = h=>{
      if(S.prev && page.querySelector('span.mf.pv')){ alert('Desligue “Visualizar Resultados” para editar o documento.'); return; }
      restore(); exec('insertHTML', h); upgradeText(); paint();
    };
    function sample(){ const a = actv(); return a[Math.min(S.i, a.length - 1)] || null; }
    function afterList(){ saveList(); paint(); }

    // editor da lista
    function decode(buf){ try{ return new TextDecoder('utf-8', {fatal:true}).decode(buf); }catch(e){ return new TextDecoder('windows-1252').decode(buf); } }
    function pickFile(cb){
      const f = document.createElement('input'); f.type = 'file'; f.accept = '.csv,.tsv,.txt,text/csv,text/plain';
      f.addEventListener('change', ()=>{ const file = f.files[0]; if(!file) return; const rd = new FileReader(); rd.onload = ()=>cb(decode(rd.result)); rd.readAsArrayBuffer(file); });
      f.click();
    }
    function openEditor(opt){
      opt = opt || {};
      const W = {head:L.head.slice(), rows:L.rows.map(r=>({v:r.v.slice(), off:r.off}))};
      if(opt.fresh){ W.head = DEFHEAD.slice(); W.rows = [{v:DEFHEAD.map(()=>''), off:false}]; }
      const d = mk('mcListDlg', '<h3>Destinatários da mala direta</h3>' +
        '<div class="row"><button type="button" data-a="file">Importar arquivo…</button><button type="button" data-a="paste">Colar da planilha…</button><button type="button" data-a="row">+ Linha</button><button type="button" data-a="col">+ Coluna</button><button type="button" data-a="all">Marcar todos</button><button type="button" data-a="none">Desmarcar todos</button><input type="search" class="leq" placeholder="Filtrar…" style="flex:1;min-width:120px"></div>' +
        '<div class="lepanel" hidden><textarea rows="6" class="letxt" placeholder="Cole aqui as células copiadas da planilha (Excel, Calc, Google Planilhas). A primeira linha traz os nomes dos campos."></textarea><div class="row"><button type="button" data-a="imp">Usar o texto colado</button><span class="mut">Também aceita CSV com vírgula ou ponto e vírgula.</span></div></div>' +
        '<div class="mcscroll"><table class="mct"></table></div><div class="mut lestat" style="margin:6px 0"></div>' +
        '<div class="dlgrow"><button type="button" data-a="ok">OK</button><button type="button" data-a="cancel">Cancelar</button></div>', 'wide');
      const tbl = q(d, 'table'), sortDir = {};
      const stat = ()=>{ q(d, '.lestat').textContent = W.head.length + ' campo(s) · ' + W.rows.length + ' registro(s) · ' + W.rows.filter(r=>!r.off).length + ' selecionado(s) para a mala direta. Desmarque quem não deve receber.'; };
      const filt = ()=>{ const k = norm(q(d, '.leq').value); [...tbl.tBodies[0].rows].forEach(tr=>{ const r = W.rows[+tr.dataset.r]; tr.hidden = !!k && !r.v.some(c=>norm(c).includes(k)); }); };
      function render(){
        let h = '<thead><tr><th></th><th>#</th>' + W.head.map((x, i)=>'<th><div class="hh"><input type="text" data-h="' + i + '" value="' + EA(x) + '" title="Nome do campo"><button type="button" data-s="' + i + '" title="Classificar por este campo">⇅</button><button type="button" data-d="' + i + '" title="Excluir este campo">×</button></div></th>').join('') + '<th></th></tr></thead><tbody>';
        W.rows.forEach((r, ri)=>{ h += '<tr data-r="' + ri + '"><td><input type="checkbox" data-o="' + ri + '"' + (r.off ? '' : ' checked') + ' title="Incluir na mala direta"></td><td class="n">' + (ri + 1) + '</td>' + W.head.map((_, ci)=>'<td><input type="text" data-c="' + ri + ',' + ci + '" value="' + EA(r.v[ci] || '') + '"></td>').join('') + '<td><button type="button" data-x="' + ri + '" title="Excluir registro">×</button></td></tr>'; });
        tbl.innerHTML = h + '</tbody>'; stat(); filt();
      }
      tbl.addEventListener('input', e=>{
        const t = e.target;
        if(t.dataset.h != null) W.head[+t.dataset.h] = t.value;
        else if(t.dataset.c != null){ const [r, c] = t.dataset.c.split(',').map(Number); W.rows[r].v[c] = t.value; }
      });
      tbl.addEventListener('change', e=>{ const t = e.target; if(t.dataset.o != null){ W.rows[+t.dataset.o].off = !t.checked; stat(); } });
      tbl.addEventListener('click', e=>{
        const b = e.target.closest('button'); if(!b) return;
        if(b.dataset.x != null){ W.rows.splice(+b.dataset.x, 1); render(); }
        else if(b.dataset.d != null){ const i = +b.dataset.d; if(!confirm('Excluir o campo “' + W.head[i] + '”?')) return; W.head.splice(i, 1); W.rows.forEach(r=>r.v.splice(i, 1)); render(); }
        else if(b.dataset.s != null){ const i = +b.dataset.s; sortDir[i] = -(sortDir[i] || -1); W.rows.sort((a, c)=>String(a.v[i] || '').localeCompare(String(c.v[i] || ''), 'pt', {numeric:true, sensitivity:'base'}) * sortDir[i]); render(); }
      });
      const take = txt=>{ const a = csv(txt); if(!a.length){ alert('Não encontrei dados nesse texto.'); return; } const n = fromRows(a); W.head = n.head; W.rows = n.rows; q(d, '.lepanel').hidden = true; render(); };
      d.addEventListener('click', e=>{
        const b = e.target.closest('button[data-a]'); if(!b) return; const a = b.dataset.a;
        if(a === 'file') pickFile(take);
        else if(a === 'paste'){ const p = q(d, '.lepanel'); p.hidden = !p.hidden; if(!p.hidden) q(d, '.letxt').focus(); }
        else if(a === 'imp') take(q(d, '.letxt').value);
        else if(a === 'row'){ W.rows.push({v:W.head.map(()=>''), off:false}); render(); const ins = tbl.querySelectorAll('tbody tr:last-child input[type=text]'); if(ins[0]) ins[0].focus(); q(d, '.mcscroll').scrollTop = 1e6; }
        else if(a === 'col'){ const n = prompt('Nome do novo campo:', ''); if(!n || !n.trim()) return; W.head.push(n.trim()); W.rows.forEach(r=>r.v.push('')); render(); }
        else if(a === 'all' || a === 'none'){ W.rows.forEach(r=>{ r.off = a === 'none'; }); render(); }
        else if(a === 'cancel') d.close();
        else if(a === 'ok'){ L = {head:W.head.map((h, i)=>String(h).trim() || ('Campo ' + (i + 1))), rows:W.rows.filter(r=>r.v.some(c=>String(c).trim() !== ''))}; afterList(); d.close(); }
      });
      q(d, '.leq').addEventListener('input', filt);
      render(); d.showModal();
      if(opt.paste){ q(d, '.lepanel').hidden = false; q(d, '.letxt').focus(); }
    }
    $('cmEdit').addEventListener('click', ()=>{ if(!L.head.length) openEditor({fresh:true}); else openEditor(); });
    pop($('cmSel'), ()=>[
      {t:'Digitar Nova Lista…', h:'Cria uma lista nova (nome, cargo, endereço, e-mail…)', f:()=>{ if(L.rows.length && !confirm('Começar uma lista nova? A lista atual será substituída ao confirmar no próximo passo.')) return; openEditor({fresh:true}); }},
      {t:'Usar Lista Existente… (CSV / TXT)', h:'Importa um arquivo salvo da planilha (Salvar como CSV)', f:()=>pickFile(txt=>{ const a = csv(txt); if(!a.length){ alert('Não encontrei dados nesse arquivo.'); return; } L = fromRows(a); afterList(); openEditor(); })},
      {t:'Colar da Planilha…', h:'Cole as células copiadas do Excel, Calc ou Google Planilhas', f:()=>openEditor({paste:true})},
      '-', {t:'Editar Lista de Destinatários…', f:()=>$('cmEdit').click()}
    ]);

    // iniciar mala direta
    pop($('cmStart'), ()=>Object.keys(MODOS).flatMap(k=>k === 'normal' ? ['-', {t:MODOS[k], chk:S.mode === k, f:()=>setModo(k)}] : [{t:MODOS[k], chk:S.mode === k, f:()=>setModo(k)}]));
    function setModo(k){
      S.mode = k; jset(MODEK, k);
      if(k === 'normal' && S.prev){ S.prev = false; paint(); }
      if(k === 'envelopes') openEnv(false); else if(k === 'etiquetas') openEtq(false);
      else if(k !== 'normal' && !L.head.length) openEditor({fresh:true});
    }

    // campos
    pop($('cmField'), ()=>L.head.length ? [{hd:'Campos da lista'}, ...L.head.map(h=>({t:h, f:()=>putM(spanH('field', h) + ZW)})), '-', {t:'Data de hoje', f:()=>putM(spanH('date') + ZW)}] :
      [{t:'Selecione os destinatários primeiro…', f:()=>openEditor({fresh:true})}, '-', {t:'Data de hoje', f:()=>putM(spanH('date') + ZW)}]);
    pop($('cmRules'), ()=>[
      {t:'Se… Então… Senão…', h:'Mostra um texto ou outro conforme o dado do destinatário', f:openRule},
      {t:'Número do registro mesclado', h:'Insere o número de ordem do destinatário (1, 2, 3…)', f:()=>putM(spanH('seq') + ZW)}
    ]);

    function dlgPrev(d, fn){ const r = sample(); const el = q(d, '.pre'); el.textContent = r ? fn(r) : 'Selecione os destinatários para ver a visualização.'; }
    function openAddr(){
      if(!L.head.length){ alert('Primeiro selecione os destinatários (Selecionar Destinatários).'); return; }
      MPO = {}; Object.keys(GUESS).forEach(k=>{ MPO[k] = colOf(k); });
      const o = Object.assign({}, DEF.a);
      const opts = [['trat', 'Tratamento (Sr., Sra., Dr.…) antes do nome'], ['cargo', 'Cargo'], ['orgao', 'Órgão / empresa'], ['pais', 'País']];
      const d = mk('mcAddrDlg', '<h3>Inserir Bloco de Endereços</h3><div class="grid2"><div><b>Incluir no bloco</b>' +
        opts.map(([k, t])=>'<label class="chk"><input type="checkbox" data-k="' + k + '"' + (o[k] ? ' checked' : '') + '> ' + t + '</label>').join('') +
        '<b style="display:block;margin-top:8px">Corresponder campos</b><div class="mut" style="margin-bottom:4px">Diga qual coluna da lista corresponde a cada parte do endereço.</div><div class="mapg">' +
        Object.keys(GUESS).map(k=>'<label>' + KLAB[k] + '<select data-m="' + k + '"><option value="">(não usar)</option>' + L.head.map(h=>'<option' + (h === MPO[k] ? ' selected' : '') + '>' + E(h) + '</option>').join('') + '</select></label>').join('') +
        '</div></div><div><b>Visualização</b><div class="pre"></div></div></div>' +
        '<div class="dlgrow"><button type="button" data-a="ok">Inserir</button><button type="button" data-a="cancel">Cancelar</button></div>', 'wide');
      const upd = ()=>dlgPrev(d, r=>addrLines(r, o).join('\n') || '(nada para mostrar — confira “Corresponder campos”)');
      d.addEventListener('change', e=>{ const t = e.target; if(t.dataset.k) o[t.dataset.k] = t.checked; if(t.dataset.m) MPO[t.dataset.m] = t.value; upd(); });
      d.addEventListener('click', e=>{
        const b = e.target.closest('button[data-a]'); if(!b) return;
        if(b.dataset.a === 'ok'){ jset(AK, MPO); DEF.a = o; jset(DK, DEF); MPO = null; d.close(); putM(P(spanH('addr', null, o)) + P('')); }
        else { MPO = null; d.close(); }
      });
      d.addEventListener('cancel', ()=>{ MPO = null; });
      upd(); d.showModal();
    }
    $('cmAddr').addEventListener('click', openAddr);
    function openGreet(){
      if(!L.head.length){ alert('Primeiro selecione os destinatários (Selecionar Destinatários).'); return; }
      const o = Object.assign({}, DEF.g);
      const sel = (id, arr, v)=>'<select data-k="' + id + '">' + arr.map(([a, b])=>'<option value="' + EA(a) + '"' + (a === v ? ' selected' : '') + '>' + E(b) + '</option>').join('') + '</select>';
      const d = mk('mcGreetDlg', '<h3>Inserir Linha de Saudação</h3><div class="grid2"><div>' +
        '<label class="blk">Saudação ' + sel('pre', [['Prezado(a)', 'Prezado(a)'], ['Caro(a)', 'Caro(a)'], ['Senhor(a)', 'Senhor(a)'], ['Prezado(a) Senhor(a)', 'Prezado(a) Senhor(a)'], ['Ilustríssimo(a) Senhor(a)', 'Ilustríssimo(a) Senhor(a)'], ['Excelentíssimo(a) Senhor(a)', 'Excelentíssimo(a) Senhor(a)'], ['', '(sem saudação, só o nome)']], o.pre) + '</label>' +
        '<label class="blk">Nome do destinatário ' + sel('fmt', [['trat_sobr', 'Tratamento + sobrenome (Sr. Silva)'], ['trat_nome', 'Tratamento + nome completo'], ['nome', 'Nome completo'], ['primeiro', 'Só o primeiro nome']], o.fmt) + '</label>' +
        '<label class="blk">Pontuação final ' + sel('punct', [[',', 'Vírgula ( , )'], [':', 'Dois pontos ( : )'], ['', 'Nenhuma']], o.punct) + '</label>' +
        '<label class="blk">Se o destinatário não tiver nome <input type="text" data-k="fb" value="' + EA(o.fb) + '" style="width:100%"></label>' +
        '<label class="chk"><input type="checkbox" data-k="gen"' + (o.gen ? ' checked' : '') + '> Concordar com o gênero se houver coluna Sexo/Gênero (M/F)</label>' +
        '</div><div><b>Visualização</b><div class="pre"></div></div></div>' +
        '<div class="dlgrow"><button type="button" data-a="ok">Inserir</button><button type="button" data-a="cancel">Cancelar</button></div>', 'wide');
      const upd = ()=>dlgPrev(d, r=>greet(r, o));
      const rd = e=>{ const t = e.target; if(!t.dataset.k) return; o[t.dataset.k] = t.type === 'checkbox' ? t.checked : t.value; upd(); };
      d.addEventListener('change', rd); d.addEventListener('input', rd);
      d.addEventListener('click', e=>{ const b = e.target.closest('button[data-a]'); if(!b) return; if(b.dataset.a === 'ok'){ DEF.g = o; jset(DK, DEF); d.close(); putM(P(spanH('greet', null, o)) + P('')); } else d.close(); });
      upd(); d.showModal();
    }
    $('cmGreet').addEventListener('click', openGreet);
    function openRule(){
      if(!L.head.length){ alert('Primeiro selecione os destinatários (Selecionar Destinatários).'); return; }
      const d = mk('mcRuleDlg', '<h3>Se… Então… Senão…</h3><div class="row"><label>Se o campo <select data-k="f">' + L.head.map(h=>'<option>' + E(h) + '</option>').join('') + '</select></label>' +
        '<select data-k="op"><option value="eq">for igual a</option><option value="ne">for diferente de</option><option value="has">contiver</option><option value="gt">for maior que</option><option value="lt">for menor que</option><option value="empty">estiver em branco</option><option value="notempty">não estiver em branco</option></select>' +
        '<input type="text" data-k="v" placeholder="valor" style="width:160px"></div>' +
        '<label class="blk">Então inserir este texto <input type="text" data-k="then" style="width:100%"></label>' +
        '<label class="blk">Senão inserir este texto <input type="text" data-k="else" style="width:100%"></label>' +
        '<div class="dlgrow"><button type="button" data-a="ok">Inserir</button><button type="button" data-a="cancel">Cancelar</button></div>');
      d.addEventListener('change', e=>{ if(e.target.dataset.k === 'op') q(d, '[data-k=v]').disabled = /empty/.test(e.target.value); });
      d.addEventListener('click', e=>{
        const b = e.target.closest('button[data-a]'); if(!b) return;
        if(b.dataset.a !== 'ok'){ d.close(); return; }
        const o = {}; d.querySelectorAll('[data-k]').forEach(x=>{ o[x.dataset.k] = x.value; });
        d.close(); putM(spanH('if', null, o) + ZW);
      });
      d.showModal();
    }

    // verificar erros
    $('cmCheck').addEventListener('click', ()=>{
      const probs = [], ok = [];
      if(!L.head.length || !L.rows.length){ probs.push('Ainda não há lista de destinatários.'); }
      const act = actv();
      if(L.rows.length && !act.length) probs.push('Nenhum destinatário está marcado na lista.');
      const used = new Set(); let hasAddr = false, hasGreet = false;
      spans().forEach(sp=>{ const k = sp.dataset.mf; if(k === 'field') used.add(sp.dataset.f); else if(k === 'if') used.add(jp(sp.dataset.o).f); else if(k === 'addr') hasAddr = true; else if(k === 'greet') hasGreet = true; });
      (page.textContent.match(/\{\{[^{}]+\}\}/g) || []).forEach(m=>{ const k = m.slice(2, -2).trim(); if(norm(k) !== 'data') used.add(k); });
      if(!used.size && !hasAddr && !hasGreet && !page.querySelector('span.mf[data-mf=seq],span.mf[data-mf=date]')) probs.push('O documento não tem campos de mesclagem. Use Inserir Campo de Mesclagem, Bloco de Endereços ou Linha de Saudação.');
      used.forEach(f=>{
        if(!f) return;
        if(hidx(f) < 0){ probs.push('O campo «' + f + '» não existe na lista (confira a grafia dos nomes das colunas).'); return; }
        const vz = act.filter(r=>!getv(r, f));
        if(vz.length) probs.push('O campo «' + f + '» está em branco em ' + vz.length + ' destinatário(s): ' + vz.slice(0, 6).map(r=>'nº ' + (L.rows.indexOf(r) + 1)).join(', ') + (vz.length > 6 ? '…' : '') + '.');
        else ok.push('«' + f + '» preenchido em todos.');
      });
      if(hasAddr || hasGreet){
        if(!colOf('nome')) probs.push('Nenhuma coluna foi associada a Nome (use Corresponder campos no Bloco de Endereços).');
        else { const vz = act.filter(r=>!gv(r, 'nome')); if(vz.length) probs.push('Há ' + vz.length + ' destinatário(s) sem nome: ' + vz.slice(0, 6).map(r=>'nº ' + (L.rows.indexOf(r) + 1)).join(', ') + '.'); }
        if(hasAddr && !colOf('end') && !colOf('cidade')) probs.push('O Bloco de Endereços não tem endereço nem cidade associados.');
      }
      const d = mk('mcChkDlg', '<h3>Verificar erros da mala direta</h3>' + (probs.length ? '<p>Encontrei ' + probs.length + ' ponto(s) para conferir:</p><ul class="chklist">' + probs.map(p=>'<li>⚠ ' + E(p) + '</li>').join('') + '</ul>' : '<p>✔ Nenhum problema encontrado. ' + act.length + ' destinatário(s) serão mesclados.</p>') + (ok.length ? '<ul class="chklist okl">' + ok.map(p=>'<li>✔ ' + E(p) + '</li>').join('') + '</ul>' : '') + '<div class="dlgrow"><button type="button">Fechar</button></div>');
      d.addEventListener('click', e=>{ if(e.target.closest('.dlgrow button')) d.close(); }); d.showModal();
    });

    // ---- concluir e mesclar ----
    function mergeOne(base, r, idx, keys){
      const box = document.createElement('div'); box.innerHTML = base;
      box.querySelectorAll('span.mf').forEach(sp=>{ const t = document.createElement('span'); t.innerHTML = valueHTML(sp, r, idx); sp.replaceWith(...t.childNodes); });
      return box.innerHTML.replace(/\u200b/g, '').replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (m, k)=>{
        if(norm(k) === 'data') return E(dataLongaBR());
        const i = keys.indexOf(norm(k)); return i >= 0 ? E(r.v[i] || '') : m;
      });
    }
    function gerar(idxs, modo){
      const act = actv(), keys = L.head.map(norm), base = page.innerHTML;
      const parts = idxs.map(i=>mergeOne(base, act[i], i, keys));
      const sep = modo === 'dir' ? '<p><br></p>' : '<div class="pb" contenteditable="false"></div>';
      const nm = title.value || 'Carta', free = !page.classList.contains('abnt');
      S.prev = false; newDoc(free);
      page.innerHTML = parts.join(sep); title.value = (modo === 'dir' ? 'Diretório – ' : 'Mala direta – ') + nm; changed(); save(); renderSide(); paint();
    }
    function askRange(ttl, okLabel, cb){
      if(needList()) return;
      const n = actv().length;
      const d = mk('mcFinDlg', '<h3>' + E(ttl) + '</h3><label class="chk"><input type="radio" name="fr" value="all" checked> Todos (' + n + ')</label><label class="chk"><input type="radio" name="fr" value="cur"> Registro atual (' + (S.i + 1) + ')</label>' +
        '<label class="chk"><input type="radio" name="fr" value="rng"> De <input type="number" class="frA" min="1" max="' + n + '" value="1" style="width:70px"> até <input type="number" class="frB" min="1" max="' + n + '" value="' + n + '" style="width:70px"></label>' +
        '<div class="dlgrow"><button type="button" data-a="ok">' + E(okLabel) + '</button><button type="button" data-a="cancel">Cancelar</button></div>');
      d.addEventListener('click', e=>{
        const b = e.target.closest('button[data-a]'); if(!b) return;
        if(b.dataset.a !== 'ok'){ d.close(); return; }
        const v = q(d, 'input[name=fr]:checked').value; let a = 0, z = n - 1;
        if(v === 'cur'){ a = z = Math.min(S.i, n - 1); }
        else if(v === 'rng'){ a = Math.max(1, parseInt(q(d, '.frA').value, 10) || 1) - 1; z = Math.min(n, parseInt(q(d, '.frB').value, 10) || n) - 1; if(z < a){ alert('O intervalo está invertido.'); return; } }
        d.close(); const ix = []; for(let i = a; i <= z; i++) ix.push(i); cb(ix);
      });
      d.showModal();
    }
    function openMail(){
      if(needList()) return;
      const ec = L.head.find(h=>/^e-?mail|correio/.test(norm(h))) || '', act = actv(), keys = L.head.map(norm), base = page.innerHTML;
      const d = mk('mcMailDlg', '<h3>Enviar mensagens de e-mail</h3><p class="mut" style="margin:0 0 8px">O texto do documento vira o corpo de cada mensagem. O Verbus abre o seu programa de e-mail com a mensagem pronta para cada destinatário; você confere e envia.</p>' +
        '<div class="row"><label>Campo do e-mail <select class="mlc">' + L.head.map(h=>'<option' + (h === ec ? ' selected' : '') + '>' + E(h) + '</option>').join('') + '</select></label><label style="flex:1">Assunto <input type="text" class="mls" style="width:100%" value="' + EA(title.value || '') + '"></label></div>' +
        '<div class="mcscroll" style="max-height:40vh"><table class="mct"></table></div><div class="dlgrow"><button type="button" data-a="copy">Copiar endereços</button><button type="button" data-a="close">Fechar</button></div>', 'wide');
      const nc = colOf('nome') || L.head[0], tbl = q(d, 'table');
      const addr = r=>getv(r, q(d, '.mlc').value);
      const render = ()=>{ tbl.innerHTML = '<tbody>' + act.map((r, i)=>'<tr><td class="n">' + (i + 1) + '</td><td>' + E(getv(r, nc)) + '</td><td>' + (addr(r) ? E(addr(r)) : '<i style="color:#c0392b">sem e-mail</i>') + '</td><td><button type="button" data-m="' + i + '"' + (addr(r) ? '' : ' disabled') + '>Abrir e-mail</button></td></tr>').join('') + '</tbody>'; };
      q(d, '.mlc').addEventListener('change', render);
      tbl.addEventListener('click', e=>{
        const b = e.target.closest('button[data-m]'); if(!b) return; const i = +b.dataset.m, r = act[i];
        const tmp = document.createElement('div'); tmp.style.cssText = 'position:fixed;left:-9999px;top:0;width:620px;white-space:pre-wrap'; tmp.innerHTML = mergeOne(base, r, i, keys); document.body.appendChild(tmp);
        const txt = tmp.innerText.replace(/\n{3,}/g, '\n\n').trim(); tmp.remove();
        const href = 'mailto:' + encodeURIComponent(addr(r)) + '?subject=' + encodeURIComponent(q(d, '.mls').value) + '&body=' + encodeURIComponent(txt);
        if(href.length > 1900 && !confirm('O texto é longo e alguns programas de e-mail cortam mensagens grandes. Abrir mesmo assim?')) return;
        const a = document.createElement('a'); a.href = href; document.body.appendChild(a); a.click(); a.remove(); b.textContent = 'Aberto ✓';
      });
      d.addEventListener('click', e=>{
        const b = e.target.closest('button[data-a]'); if(!b) return;
        if(b.dataset.a === 'copy'){ const t = act.map(addr).filter(Boolean).join('; '); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>{ b.textContent = 'Copiado ✓'; }, ()=>prompt('Copie os endereços:', t)); }
        else d.close();
      });
      render(); d.showModal();
    }
    pop($('cmFinish'), ()=>{
      const m = S.mode, it = [];
      const doc = md=>()=>askRange('Mesclar para um novo documento', 'Mesclar', ix=>gerar(ix, md));
      if(m === 'envelopes') it.push({t:'Imprimir Envelopes…', f:()=>openEnv(true)});
      else if(m === 'etiquetas') it.push({t:'Imprimir Etiquetas…', f:()=>openEtq(true)});
      else if(m === 'email') it.push({t:'Enviar Mensagens de E-mail…', f:openMail}, {t:'Editar Documentos Individuais…', f:doc('cartas')});
      else it.push({t:'Editar Documentos Individuais…', h:'Cria um documento novo com uma carta para cada destinatário', f:doc(m === 'diretorio' ? 'dir' : 'cartas')},
        {t:'Imprimir Documentos…', f:()=>askRange('Imprimir documentos', 'Imprimir', ix=>{ gerar(ix, m === 'diretorio' ? 'dir' : 'cartas'); setTimeout(()=>window.print(), 500); })},
        {t:'Enviar Mensagens de E-mail…', f:openMail});
      return [{hd:'Modo: ' + MODOS[m]}, ...it];
    });

    // ---- impressão (iframe invisível, com o tamanho exato do papel) ----
    function printHTML(pages, css){
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
      const dd = f.contentWindow.document; dd.open();
      dd.write('<!doctype html><html><head><meta charset="utf-8"><title>' + E(title.value || 'Verbus') + '</title><style>' + css + 'html,body{margin:0;padding:0}</style></head><body>' + pages.map((p, i)=>'<div' + (i ? ' style="break-before:page;page-break-before:always"' : '') + '>' + p + '</div>').join('') + '</body></html>');
      dd.close();
      setTimeout(()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){} setTimeout(()=>f.remove(), 90000); }, 300);
    }
    const scaled = (html, wmm, hmm, px)=>{ const k = px / (wmm * 96 / 25.4); return '<div style="width:' + px + 'px;height:' + Math.ceil(hmm * 96 / 25.4 * k) + 'px;overflow:hidden;border:1px solid #999;background:#fff"><div style="transform-origin:0 0;transform:scale(' + k + ');width:' + wmm + 'mm">' + html + '</div></div>'; };
    const selText = ()=>{ const s = getSelection(); return s && s.rangeCount && page.contains(s.anchorNode) ? s.toString().trim() : ''; };
    const remTxt = ()=>{ const r = rem(); return [r.nome, r.cargo, r.orgao, r.cidade].filter(Boolean).join('\n'); };
    const listAddrs = ()=>actv().map(r=>addrLines(r, DEF.a).join('\n'));

    // envelopes
    const ENVS = {DL:[220, 110, 'DL · 110 × 220 mm'], C6:[162, 114, 'C6 · 114 × 162 mm'], C5:[229, 162, 'C5 · 162 × 229 mm'], C4:[324, 229, 'C4 · 229 × 324 mm'], B5:[250, 176, 'B5 · 176 × 250 mm'], N10:[241, 105, 'Nº 10 · 105 × 241 mm']};
    const envHTML = (w, h, fs, snd, dst, frame)=>'<div style="position:relative;box-sizing:border-box;width:' + w + 'mm;height:calc(' + h + 'mm - .6mm);overflow:hidden;font:' + fs + 'pt/1.35 Arial,Helvetica,sans-serif;color:#000;background:#fff;text-indent:0;text-align:left;' + (frame ? 'border:1px dashed #999;' : '') + '">' +
      (snd ? '<div style="position:absolute;left:8mm;top:7mm;max-width:' + Math.round(w * .5) + 'mm;white-space:pre-line;font-size:' + Math.max(8, fs - 2) + 'pt">' + E(snd) + '</div>' : '') +
      '<div style="position:absolute;left:' + Math.round(w * .38) + 'mm;top:' + Math.round(h * .45) + 'mm;max-width:' + Math.round(w * .58) + 'mm;white-space:pre-line">' + E(dst) + '</div></div>';
    function openEnv(printNow){
      const n = actv().length, sel = selText();
      const d = mk('cmEnvDlg', '<h3>Envelopes</h3><div class="grid2"><div>' +
        '<label class="blk">Tamanho <select class="esz">' + Object.keys(ENVS).map(k=>'<option value="' + k + '">' + ENVS[k][2] + '</option>').join('') + '</select></label>' +
        '<label class="blk">Tamanho da letra <select class="efs"><option>10</option><option selected>12</option><option>14</option><option>16</option></select> pt</label>' +
        '<label class="blk">Endereço do destinatário<textarea class="edst" rows="5" placeholder="Nome&#10;Cargo / órgão&#10;Rua, número&#10;Cidade – UF · CEP">' + E(sel) + '</textarea></label>' +
        (n ? '<label class="chk"><input type="checkbox" class="elst"' + ((S.mode === 'envelopes' || printNow) ? ' checked' : '') + '> Um envelope para cada destinatário da lista (' + n + ')</label>' : '') +
        '<label class="blk">Remetente<textarea class="esnd" rows="4">' + E(remTxt()) + '</textarea></label><label class="chk"><input type="checkbox" class="eomit"> Não imprimir o remetente</label>' +
        '</div><div><b>Visualização</b><div class="envprev" style="margin-top:6px"></div><p class="mut">Folha de envelope: imprima com a bandeja de envelopes e “Tamanho real” (sem ajustar à página).</p></div></div>' +
        '<div class="dlgrow"><button type="button" data-a="print">Imprimir</button><button type="button" data-a="ins">Inserir no documento</button><button type="button" data-a="close">Fechar</button></div>', 'wide');
      const cfg = ()=>{ const [w, h] = ENVS[q(d, '.esz').value]; return {w, h, fs:+q(d, '.efs').value, snd:q(d, '.eomit').checked ? '' : q(d, '.esnd').value.trim(), lst:q(d, '.elst') && q(d, '.elst').checked, dst:q(d, '.edst').value.trim()}; };
      const upd = ()=>{ const c = cfg(); q(d, '.edst').disabled = !!c.lst; const dst = c.lst ? (listAddrs()[0] || '') : c.dst; q(d, '.envprev').innerHTML = scaled(envHTML(c.w, c.h, c.fs, c.snd, dst || 'Nome do destinatário\nEndereço\nCidade – UF', false), c.w, c.h, 330); };
      d.addEventListener('input', upd); d.addEventListener('change', upd);
      d.addEventListener('click', e=>{
        const b = e.target.closest('button[data-a]'); if(!b) return; const a = b.dataset.a, c = cfg();
        if(a === 'close'){ d.close(); return; }
        const dsts = c.lst ? listAddrs() : [c.dst];
        if(!dsts.length || !dsts[0]){ alert('Digite o endereço do destinatário (ou use a lista de destinatários).'); return; }
        if(a === 'print'){ printHTML(dsts.map(t=>envHTML(c.w, c.h, c.fs, c.snd, t, false)), '@page{size:' + c.w + 'mm ' + c.h + 'mm;margin:0}'); d.close(); }
        else { d.close(); putM(envHTML(c.w, c.h, c.fs, c.snd, dsts[0], true) + '<p><br></p>'); }
      });
      upd(); d.showModal();
      if(printNow && n){ q(d, '.elst').checked = true; upd(); }
    }
    $('cmEnv').addEventListener('click', ()=>openEnv(false));

    // etiquetas
    const PAPEL = {A4:[210, 297], Letter:[215.9, 279.4]};
    const ETQ = [
      ['A4 · 3 × 7 (21 etiquetas) · 63,5 × 38,1 mm', 3, 7, 63.5, 38.1, 15.1, 9.8, 'A4'], ['A4 · 2 × 7 (14) · 99,1 × 38,1 mm', 2, 7, 99.1, 38.1, 15.1, 5.9, 'A4'],
      ['A4 · 2 × 5 (10) · 99,1 × 57 mm', 2, 5, 99.1, 57, 6, 5.9, 'A4'], ['A4 · 2 × 4 (8) · 99,1 × 67,7 mm', 2, 4, 99.1, 67.7, 13.1, 5.9, 'A4'],
      ['A4 · 3 × 8 (24) · 70 × 35 mm', 3, 8, 70, 35, 8.5, 0, 'A4'], ['A4 · 5 × 13 (65) · 38,1 × 21,2 mm', 5, 13, 38.1, 21.2, 10.7, 9.8, 'A4'],
      ['Carta · 3 × 10 (30) · 66,7 × 25,4 mm', 3, 10, 66.7, 25.4, 12.7, 7.9, 'Letter'], ['Carta · 2 × 5 (10) · 101,6 × 50,8 mm', 2, 5, 101.6, 50.8, 12.7, 6.4, 'Letter'],
      ['Personalizada', 2, 7, 99.1, 38.1, 15.1, 5.9, 'A4']
    ];
    function etqTables(c, items){
      const per = c.cols * c.rows, all = Array(Math.max(0, c.start - 1)).fill('').concat(items), sheets = [];
      for(let i = 0; i < all.length; i += per) sheets.push(all.slice(i, i + per));
      if(!sheets.length) sheets.push([]);
      return sheets.map(sh=>{
        let rows = '';
        for(let r = 0; r < c.rows; r++){
          rows += '<tr style="height:' + c.h + 'mm">';
          for(let k = 0; k < c.cols; k++){ const t = sh[r * c.cols + k]; rows += '<td style="width:' + c.w + 'mm;height:' + c.h + 'mm;padding:0;border:0;vertical-align:top"><div style="box-sizing:border-box;height:' + c.h + 'mm;overflow:hidden;padding:2mm 4mm;display:flex;align-items:center;font:' + c.fs + 'pt/1.25 Arial,Helvetica,sans-serif;white-space:pre-line;color:#000;text-indent:0;text-align:left"><span>' + (t ? E(t) : '') + '</span></div></td>'; }
          rows += '</tr>';
        }
        return '<table style="border-collapse:collapse;table-layout:fixed;width:' + (c.w * c.cols) + 'mm;margin:0">' + rows + '</table>';
      });
    }
    const etqSheet = (c, tb)=>{ const [pw, ph] = PAPEL[c.paper]; return '<div style="box-sizing:border-box;width:' + pw + 'mm;height:calc(' + ph + 'mm - 1mm);padding:' + c.mt + 'mm 0 0 ' + c.ml + 'mm;overflow:hidden;background:#fff">' + tb + '</div>'; };
    function openEtq(printNow){
      const n = actv().length, sel = selText();
      const num = (cls, v, st)=>'<input type="number" class="' + cls + '" value="' + v + '" step="' + (st || 0.1) + '" min="0" style="width:72px">';
      const d = mk('cmEtqDlg', '<h3>Etiquetas</h3><div class="grid2"><div>' +
        '<label class="blk">Modelo da folha <select class="epre">' + ETQ.map((x, i)=>'<option value="' + i + '">' + x[0] + '</option>').join('') + '</select></label>' +
        '<div class="row"><label>Colunas ' + num('ec', 2, 1) + '</label><label>Linhas ' + num('er', 7, 1) + '</label><label>Largura (mm) ' + num('ew', 99.1) + '</label><label>Altura (mm) ' + num('eh', 38.1) + '</label></div>' +
        '<div class="row"><label>Margem superior (mm) ' + num('emt', 15.1) + '</label><label>Margem esquerda (mm) ' + num('eml', 5.9) + '</label><label>Papel <select class="epp"><option value="A4">A4</option><option value="Letter">Carta</option></select></label></div>' +
        '<label class="blk">Endereço<textarea class="edst" rows="4" placeholder="Nome&#10;Rua, número&#10;Cidade – UF · CEP">' + E(sel) + '</textarea></label>' +
        (n ? '<label class="chk"><input type="checkbox" class="elst"' + ((S.mode === 'etiquetas' || printNow) ? ' checked' : '') + '> Uma etiqueta para cada destinatário da lista (' + n + ')</label>' : '') +
        '<label class="chk"><input type="checkbox" class="erep" checked> Repetir o mesmo endereço em toda a folha</label>' +
        '<div class="row"><label>Começar na etiqueta nº ' + num('est', 1, 1) + '</label><label>Letra <select class="efs"><option>9</option><option>10</option><option selected>11</option><option>12</option></select> pt</label></div>' +
        '</div><div><b>Visualização da folha</b><div class="etqprev" style="margin-top:6px"></div></div></div>' +
        '<div class="dlgrow"><button type="button" data-a="print">Imprimir</button><button type="button" data-a="doc">Novo documento</button><button type="button" data-a="close">Fechar</button></div>', 'wide');
      const set = (cls, v)=>{ q(d, '.' + cls).value = v; };
      const preset = i=>{ const x = ETQ[i]; set('ec', x[1]); set('er', x[2]); set('ew', x[3]); set('eh', x[4]); set('emt', x[5]); set('eml', x[6]); set('epp', x[7]); };
      const cfg = ()=>({cols:Math.max(1, +q(d, '.ec').value | 0), rows:Math.max(1, +q(d, '.er').value | 0), w:+q(d, '.ew').value || 50, h:+q(d, '.eh').value || 30, mt:+q(d, '.emt').value || 0, ml:+q(d, '.eml').value || 0, paper:q(d, '.epp').value, fs:+q(d, '.efs').value, start:Math.max(1, +q(d, '.est').value | 0), lst:q(d, '.elst') && q(d, '.elst').checked, rep:q(d, '.erep').checked, dst:q(d, '.edst').value.trim()});
      const items = c=>{ if(c.lst) return listAddrs(); if(c.rep) return Array(Math.max(0, c.cols * c.rows - (c.start - 1))).fill(c.dst); return [c.dst]; };
      const upd = ()=>{ const c = cfg(); q(d, '.edst').disabled = !!c.lst; q(d, '.erep').disabled = !!c.lst; const tb = etqTables(c, c.lst ? listAddrs().slice(0, 40) : (c.dst ? items(c) : Array(c.cols * c.rows).fill('Nome do destinatário\nEndereço\nCidade – UF')))[0]; q(d, '.etqprev').innerHTML = scaled(etqSheet(c, tb), PAPEL[c.paper][0], PAPEL[c.paper][1], 300); };
      q(d, '.epre').addEventListener('change', e=>{ preset(+e.target.value); upd(); });
      d.addEventListener('input', upd); d.addEventListener('change', upd);
      d.addEventListener('click', e=>{
        const b = e.target.closest('button[data-a]'); if(!b) return; const a = b.dataset.a, c = cfg();
        if(a === 'close'){ d.close(); return; }
        const its = items(c).filter(Boolean);
        if(!its.length){ alert('Digite o endereço (ou use a lista de destinatários).'); return; }
        const tbs = etqTables(c, its);
        if(a === 'print'){ printHTML(tbs.map(t=>etqSheet(c, t)), '@page{size:' + c.paper.replace('Letter', 'letter') + ';margin:0}'); d.close(); }
        else { d.close(); S.prev = false; const free = !page.classList.contains('abnt'); newDoc(free); page.innerHTML = tbs.join('<div class="pb" contenteditable="false"></div>'); title.value = 'Etiquetas'; changed(); save(); renderSide(); paint(); }
      });
      q(d, '.epre').value = '1'; preset(1); upd(); d.showModal();
    }
    $('cmEtq').addEventListener('click', ()=>openEtq(false));
    paint();
  })();
