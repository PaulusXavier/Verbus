/* Verbus — Menu Arquivo (estilo clássico) e guias da faixa de opções
   (js/menu-arquivo.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   Reconstruído a partir da v66 (index.html monolítico), com as chaves de armazenamento portadas para LS_KEYS. */
  // ================= Menu Arquivo (estilo clássico) =================
  (function(){
    const bs = $('bs'), nav = $('bsNav'), main = $('bsMain');
    const ITEMS = [['info','Informações'],['novo','Novo'],['abrir','Abrir'],['salvar','Salvar'],['salvarcomo','Salvar como'],
      ['imprimir','Imprimir'],['compartilhar','Compartilhar'],['exportar','Exportar'],['fechar','Fechar'],null,['conta','Conta'],['opcoes','Opções'],['sobre','Sobre']];
    const AREAS = ['body > header', '#tabs', '#toolbar', '#findbar', '#hfbar', '#work', 'body > footer'];
    let cur = 'info', msgEl = null;

    const el = (tag, props, ...kids)=>{ const e = document.createElement(tag); if(props) Object.assign(e, props); kids.forEach(k=>e.append(k)); return e; };
    const say = t=>{ if(msgEl) msgEl.textContent = t; };
    const act = (ic, t, d, fn, on)=>{
      const b = el('button', {type:'button', className:'bsAct' + (on ? ' on' : ''), onclick:fn});
      b.append(el('span', {className:'ic', textContent:ic}), el('span', null, el('b', {textContent:t}), ...(d ? [el('small', {textContent:d})] : [])));
      return b;
    };
    const fmtDate = t=>t ? new Date(t).toLocaleString('pt-BR', {dateStyle:'long', timeStyle:'short'}) : '—';
    const cm = v=>(v / CMPX).toFixed(1).replace('.', ',') + ' cm';
    const size = n=>n >= 1073741824 ? (n / 1073741824).toLocaleString('pt-BR', {maximumFractionDigits:1}) + ' GB' : (n / 1048576).toLocaleString('pt-BR', {maximumFractionDigits:1}) + ' MB';
    const emptyDoc = ()=>!page.innerText.replace(/[\u200b\s]/g, '') && !page.querySelector('img,table,hr');

    function close(refocus){
      bs.hidden = true;
      AREAS.forEach(s=>document.querySelectorAll(s).forEach(n=>{ n.inert = false; }));
      if(refocus !== false) page.focus();
    }
    function closeThen(fn){ close(false); fn(); }
    function go(key){
      cur = key; msgEl = el('p', {id:'bsMsg', role:'status'});
      nav.querySelectorAll('.it').forEach(b=>{ const on = b.dataset.k === key; b.classList.toggle('on', on); if(on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      const label = ITEMS.find(i=>i && i[0] === key)[1];
      main.replaceChildren(el('h1', {textContent:label}), ...PANELS[key](), msgEl);
      main.scrollTop = 0;
    }
    function openBs(key){
      save();
      AREAS.forEach(s=>document.querySelectorAll(s).forEach(n=>{ n.inert = true; }));
      bs.hidden = false; go(key || cur);
      const b = nav.querySelector('.it.on'); if(b) b.focus();
    }

    const PANELS = {
      info(){
        const d = store.docs[store.current] || {}, s = docStats(true), m = effMar();
        const name = el('input', {type:'text', className:'bsName', value:title.value});
        name.setAttribute('aria-label', 'Nome do documento');
        name.oninput = ()=>{ title.value = name.value; title.dispatchEvent(new Event('input', {bubbles:true})); };
        const rows = [['Páginas (estimativa A4)', pagesEst()], ['Palavras', s.words.toLocaleString('pt-BR')], ['Caracteres (com espaços)', s.withSp.toLocaleString('pt-BR')],
          ['Parágrafos', s.paras.toLocaleString('pt-BR')], ['Tempo de leitura', s.read], ['Formato', page.classList.contains('abnt') ? 'ABNT' : 'Livre (sem ABNT)'], ['Papel', PG_SIZES[pgOf().size][2] + (pgOf().land ? ' · paisagem' : ' · retrato') + (pgOf().cols > 1 ? ' · ' + pgOf().cols + ' colunas' : '')],
          ['Margens (sup., inf., esq., dir.)', [m.t, m.b, m.l, m.r].map(cm).join(' · ')], ['Última alteração', fmtDate(d.t)],
          ['Documentos neste navegador', Object.values(store.docs).filter(d=>!d.modelo).length]];
        const tb = el('tbody'); rows.forEach(r=>tb.append(el('tr', null, el('td', {textContent:r[0]}), el('td', {textContent:String(r[1])}))));
        return [el('h2', {textContent:'Nome do documento'}), name, el('h2', {textContent:'Propriedades'}), el('table', null, tb),
          el('h2', {textContent:'Mais'}), act('🔢', 'Contagem detalhada', 'Palavras, caracteres, parágrafos e tempos, inclusive da seleção', ()=>closeThen(openCount))];
      },
      novo(){
        const list = [act('🎓', 'Documento ABNT (padrão)', 'A4, margens 3/2/2/3 cm, Arial 12, espaço 1,5, recuo 1,25 cm, justificado', ()=>{ close(false); newDoc(); }),
          act('📄', 'Documento livre', 'Sem as regras da ABNT (margens e estilos livres)', ()=>{ close(false); newDoc(true); })];
      list.push(el('h2', {textContent:'Modelos prontos'}),
        act('📋', 'Relatório Informativo — CRAS Cristiana Vicente Nunes', 'Cabeçalho da Prefeitura/SEMADS, quadros de Identificação, Demanda, Composição Familiar, Condições Habitacionais, Situação e Providências, data de hoje, assinatura e rodapé', ()=>{ close(false); newFromTemplate(tplRelatorio(), 'Relatório Informativo'); }),
        act('📄', 'Encaminhamento — CRAS Cristiana Vicente Nunes', 'Cabeçalho da Prefeitura/SEMADS, quadro com Assunto, dados do adolescente/criança, responsável, endereço, contato e Relato, data de hoje, assinatura, página de Anexo e rodapé', ()=>{ close(false); newFromTemplate(tplEncaminhamento(), 'Encaminhamento'); }),
        act('📤', 'Termo de Desligamento — CRAS Cristiana Vicente Nunes', 'Cabeçalho da Prefeitura/SEMADS, quadros de CRAS/Projeto, dados do integrante e motivo do desligamento, assinatura, procedimentos realizados, parecer do técnico de referência, data de hoje, assinatura e rodapé', ()=>{ close(false); newFromTemplate(tplDesligamento(), 'Termo de Desligamento'); }),
        act('🧺', 'Declaração de Entrega de Cesta — CRAS Cristiana Vicente Nunes', 'Duas vias na mesma folha A4, cada uma com cabeçalho da Prefeitura/SEMADS/CRAS, dados do beneficiário, quantidade de cestas, data e assinaturas de quem recebe e de quem entrega', ()=>{ close(false); newFromTemplate(tplDeclaracaoEntrega(), 'Declaração de Entrega de Cesta'); }),
        act('📝', 'Estudo de Caso — CRAS Cristiana Vicente Nunes', 'Cabeçalho da Prefeitura/SEMADS, quadros de Identificação, Demanda, Situação Problema, Composição Familiar, Parecer Técnico e Providências, informações adicionais, data de hoje, assinatura, página de Anexo e rodapé', ()=>{ close(false); newFromTemplate(tplEstudoCaso(), 'Estudo de Caso'); }),
        act('🧾', 'Ficha de Inscrição Conviver — CRAS Cristiana Vicente Nunes', 'Cabeçalho da Prefeitura/SEMADS, foto, dados do integrante, escolares, saúde, responsável familiar, endereço e dados socioassistenciais em duas páginas, data de hoje, assinaturas e rodapé', ()=>{ close(false); newFromTemplate(tplFichaConviver(), 'Ficha de Inscrição Conviver'); }));
      list.push(el('h2', {textContent:'Meus modelos'}));
      const mine = Object.entries(store.docs).filter(([id, d])=>d.modelo).sort((a, b)=>b[1].t - a[1].t);
      if(!mine.length) list.push(el('p', {className:'bsNote', textContent:'Nenhum ainda. Monte um documento e use “Salvar o documento aberto como modelo”, aqui embaixo.'}));
      mine.forEach(([id, d])=>{
        const b = act('📄', d.title || 'Modelo', 'Salvo em ' + fmtDate(d.t), ()=>{ close(false); newFromTemplate(d, d.title); });
        const x = el('span', {className:'x', textContent:'✕', title:'Excluir modelo', role:'button', tabIndex:0});
        x.setAttribute('aria-label', 'Excluir o modelo ' + (d.title || ''));
        const del = e=>{ e.stopPropagation(); e.preventDefault(); if(!confirm('Excluir o modelo "' + (d.title || '') + '"? Não dá para desfazer.')) return; delete store.docs[id]; persist(); go('novo'); };
        x.onclick = del; x.onkeydown = e=>{ if(e.key === 'Enter' || e.key === ' ') del(e); };
        b.append(x); list.push(b);
      });
      list.push(el('h2', {textContent:'Criar um modelo'}),
        act('⭐', 'Salvar o documento aberto como modelo', 'Guarda texto, tabelas, cabeçalho, rodapé, margens, papel e estilos. Escreva {{DATA}} onde quiser a data de hoje.', ()=>{
          const n = saveAsTemplate(); if(n){ go('novo'); say('Modelo “' + n + '” salvo. Ele aparece em Meus modelos.'); }
        }));
      return list;
      },
      abrir(){
        const list = [act('📂', 'Procurar no computador', 'Abre arquivos .docx, .doc, .html ou .txt', ()=>closeThen(()=>window.__abrirArquivo())), el('h2', {textContent:'Salvos neste navegador'})];
        Object.entries(store.docs).filter(([id, d])=>!d.modelo).sort((a,b)=>b[1].t - a[1].t).forEach(([id, d])=>{
          const name = (id === store.current ? title.value : d.title) || 'Sem título';
          const b = act('📝', name, fmtDate(d.t) + (id === store.current ? ' · aberto agora' : ''), ()=>{ close(false); openDoc(id); page.focus(); }, id === store.current);
          const x = el('span', {className:'x', textContent:'✕', title:'Excluir', role:'button', tabIndex:0});
          x.setAttribute('aria-label', 'Excluir ' + name);
          const del = e=>{ e.stopPropagation(); e.preventDefault(); delDoc(id); if(!bs.hidden) go('abrir'); };
          x.onclick = del; x.onkeydown = e=>{ if(e.key === 'Enter' || e.key === ' ') del(e); };
          b.append(x); list.push(b);
        });
        return list;
      },
      salvar(){
        const ent = FH.get(store.current), can = window.__fileFS();
        const intro = ent ? 'Este documento está ligado ao arquivo “' + ent.name + '”. Salvar grava direto nele, sem baixar outra cópia (como no Word).'
          : can ? 'Este documento ainda não está num arquivo do computador. Ao salvar, o Verbus abre a janela do sistema para você escolher a pasta e o nome.'
          : 'Este navegador não deixa um site gravar direto no arquivo; Salvar baixa uma cópia (.docx). No Chrome ou no Edge do computador, Salvar grava no próprio arquivo.';
        return [el('p', {className:'bsNote', textContent:intro}),
          act('💾', ent ? 'Salvar em ' + ent.name : can ? 'Salvar…' : 'Baixar como .docx', 'Ctrl+S', async ()=>{ say('Salvando…'); const m = await window.__fileDo(false); go('salvar'); say(m); }),
          act('📁', 'Salvar como…', 'Outra pasta, outro nome ou outro tipo (Ctrl+Shift+S)', ()=>go('salvarcomo')),
          el('h2', {textContent:'Neste navegador'}),
          el('p', {className:'bsNote', textContent:'O Verbus também guarda o documento sozinho neste navegador enquanto você escreve; ele aparece em “Abrir”.'}),
          act('🗂', 'Salvar neste navegador agora', 'Grava já o documento aberto', ()=>{ save(); flushNow().then(()=>say('Salvo neste navegador às ' + hhmm() + '.')); })];
      },
      salvarcomo(){
        const ent = FH.get(store.current), can = window.__fileFS();
        const nameIn = el('input', {type:'text', className:'bsName', value:baseName(ent ? ent.name : fileName(''))});
        nameIn.setAttribute('aria-label', 'Nome do arquivo');
        const typeSel = el('select'); typeSel.setAttribute('aria-label', 'Tipo de arquivo');
        [['docx', 'Documento do Word (*.docx)'], ['doc', 'Documento do Word 97-2003 (*.doc)'], ['html', 'Página da Web (*.html)'], ['txt', 'Texto simples (*.txt)'], ['pdf', 'PDF (*.pdf) — pela janela de impressão']].forEach(o=>typeSel.append(el('option', {value:o[0], textContent:o[1]})));
        typeSel.value = ent ? kindOf(ent.name) : 'docx';
        const ok = el('button', {type:'button', className:'bsDo'});
        const sync = ()=>{ ok.textContent = typeSel.value === 'pdf' ? 'Criar PDF…' : can ? 'Salvar…' : 'Baixar'; };
        typeSel.onchange = sync; sync();
        ok.onclick = async ()=>{
          const nm = nameIn.value.trim() || 'documento';
          if(typeSel.value === 'pdf'){ window.__pdfNome = nm; closeThen(()=>setTimeout(()=>window.print(), 150)); return; }
          say('Salvando…'); const m = await window.__fileDo(true, typeSel.value, nm); go('salvarcomo'); say(m);
        };
        nameIn.onkeydown = e=>{ if(e.key === 'Enter'){ e.preventDefault(); ok.click(); } };
        return [el('p', {className:'bsNote', textContent: can ? 'Escolha o nome e o tipo. Ao continuar, abre a janela do seu computador para você escolher a pasta.' : 'Este navegador baixa o arquivo na pasta de downloads (no Chrome ou no Edge do computador dá para escolher a pasta).'}),
          el('h2', {textContent:'Nome do arquivo'}), nameIn, el('h2', {textContent:'Tipo'}), typeSel, el('div', {className:'bsDoRow'}, ok)];
      },
      imprimir(){
        const wrap = el('div', {className:'prWrap'}), set = el('div', {className:'prSet'}), prev = el('div', {className:'prPrev'});
        const doPrint = ()=>closeThen(()=>setTimeout(()=>window.print(), 150));
        const btn = el('button', {type:'button', className:'prBtn'}, el('span', {className:'ic', textContent:'🖨'}), el('span', {textContent:'Imprimir'}));
        const SIDEMSG = {um:'', frente:'Imprime só as folhas 1, 3, 5… Depois recoloque o papel impresso na bandeja, com a face certa para cima, e imprima a 2ª passada.', verso:'Imprime as folhas 2, 4, 6… em ordem inversa, para cair atrás das folhas já impressas na 1ª passada. Confira a posição do papel na sua impressora.'};
        // "1-3, 5, 8-" -> índices de página (base 0); {err} se não der para entender
        function parseRange(txt, N){
          const parts = String(txt || '').split(/[;,]/).map(x=>x.trim()).filter(Boolean), got = new Set();
          if(!parts.length) return {err:'Digite as páginas, por exemplo 1-3, 5, 8-.'};
          for(const p of parts){
            const m = /^(\d*)\s*(-)?\s*(\d*)$/.exec(p);
            if(!m || (!m[1] && !m[3])) return {err:'Não entendi “' + p + '”. Use números e intervalos, como 1-3, 5, 8-.'};
            let a, b;
            if(!m[2]) a = b = parseInt(m[1], 10);
            else{ a = m[1] ? parseInt(m[1], 10) : 1; b = m[3] ? parseInt(m[3], 10) : N; }
            if(a < 1 || b < 1 || a > N || b > N) return {err:'O documento tem ' + N + ' página' + (N > 1 ? 's' : '') + '. Corrija “' + p + '”.'};
            if(a > b){ const t = a; a = b; b = t; }
            for(let i = a; i <= b; i++) got.add(i - 1);
          }
          return {pages:[...got].sort((x, y)=>x - y)};
        }
        // monta a lista de folhas a imprimir (intervalo, lados, cópias e agrupamento, como no Word)
        function makeJob(){
          const N = plan.length; let pages;
          if(range === 'cur') pages = [Math.min(N - 1, nup > 1 ? pageNo * nup : pageNo)];
          else if(range === 'custom'){ const r = parseRange(rangeIn.value, N); if(r.err) return {err:r.err}; pages = r.pages; }
          else pages = Array.from({length:N}, (_, i)=>i);
          let sheets = [];
          for(let i = 0; i < pages.length; i += nup) sheets.push(pages.slice(i, i + nup));
          const total = sheets.length;
          if(side === 'frente') sheets = sheets.filter((_, i)=>i % 2 === 0);
          if(side === 'verso') sheets = sheets.filter((_, i)=>i % 2 === 1).reverse();
          if(!sheets.length) return {err: side === 'verso' ? 'Com só ' + total + ' folha, não há folhas pares para a 2ª passada.' : 'Não há nada para imprimir.'};
          let out = sheets;
          if(copies > 1) out = coll ? Array.from({length:copies}).flatMap(()=>sheets) : sheets.flatMap(x=>Array(copies).fill(x));
          if(out.length > 300) return {err:'São ' + out.length + ' folhas de uma vez: é muita coisa. Deixe as cópias para a janela do navegador ou imprima em partes.'};
          return {sheets:out, trivial: range === 'all' && nup === 1 && side === 'um' && copies === 1};
        }
        async function printCustom(sheets){
          const pgc = pgOf(), host = el('div', {id:'prNup'}), built = sheets.map((idxs, si)=>buildSheet(si, idxs));
          built.forEach((b, k)=>{
            const x = b.el; x.style.cssText += ';position:relative;transform:none;left:auto;top:auto;width:' + Math.floor(geo.W) + 'px;height:' + (Math.floor(geo.H) - 1) + 'px;overflow:hidden;break-after:' + (k < built.length - 1 ? 'page' : 'auto') + ';box-shadow:none';
            host.append(x);
          });
          // durante esta impressão o @page do documento (com número de página/cabeçalho do navegador) é trocado por uma página sem margens; o cabeçalho/rodapé já está desenhado em cada página reduzida
          const pst = $('pgStyle'), oldCss = pst.textContent;
          close(false); pst.textContent = '@page{size:' + pgc.w + 'cm ' + pgc.h + 'cm;margin:0}'; document.body.append(host); document.body.classList.add('nup');
          const clean = ()=>{ host.remove(); pst.textContent = oldCss; document.body.classList.remove('nup'); };
          await Promise.all(built.map(b=>b.ready));
          addEventListener('afterprint', clean, {once:true});
          window.print();
        }
        btn.onclick = ()=>{
          const job = makeJob();
          if(job.err){ prMsg.textContent = job.err === rangeInfo.textContent ? 'Corrija o intervalo de páginas.' : job.err; prMsg.className = 'prInfo prErr'; return; }
          prMsg.textContent = ''; prMsg.className = 'prInfo';
          if(job.trivial) doPrint(); else printCustom(job.sheets);
        };
        const row = (label, sel)=>{ const id = 'pr' + label.replace(/\W/g, ''); sel.id = id; return el('div', {className:'prRow'}, el('label', {htmlFor:id, textContent:label}), sel); };
        const sel = opts=>{ const s = el('select'); opts.forEach(o=>s.append(el('option', {value:o[0], textContent:o[1]}))); return s; };
        const selOri = sel([['p', 'Orientação Vertical (retrato)'], ['l', 'Orientação Horizontal (paisagem)']]);
        const selSize = sel(Object.keys(PG_SIZES).map(k=>[k, PG_SIZES[k][2] + ' — ' + String(PG_SIZES[k][0]).replace('.', ',') + ' x ' + String(PG_SIZES[k][1]).replace('.', ',') + ' cm']));
        const selMar = sel([['padrao', 'Margens Normais (padrão)'], ['estreita', 'Margens Estreitas'], ['moderada', 'Margens Moderadas'], ['larga', 'Margens Largas'], ['abnt', 'Margens ABNT (3 / 2 / 2 / 3 cm)'], ['custom', 'Margens Personalizadas']]);
        const selNup = sel([[1, '1 Página Por Folha'], [2, '2 Páginas Por Folha'], [4, '4 Páginas Por Folha'], [6, '6 Páginas Por Folha'], [8, '8 Páginas Por Folha'], [16, '16 Páginas Por Folha']]);
        const selSide = sel([['um', 'Imprimir Apenas um Lado'], ['frente', 'Dois lados manual — 1ª passada (folhas ímpares)'], ['verso', 'Dois lados manual — 2ª passada (folhas pares)']]);
        const sideInfo = el('p', {className:'prInfo'});
        const link = el('button', {type:'button', className:'prLink', textContent:'Configurar Página…'});
        const info = el('p', {className:'prInfo'});
        let copies = 1, range = 'all', coll = true, zoom = null, fitK = 1;
        const copIn = el('input', {type:'number', min:1, max:99, value:1, id:'prCopias'}); copIn.setAttribute('aria-label', 'Cópias');
        const btnRow = el('div', {className:'prTop'}, btn, el('div', {className:'prCop'}, el('label', {htmlFor:'prCopias', textContent:'Cópias:'}), copIn));
        const prMsg = el('p', {className:'prInfo'}); prMsg.setAttribute('role', 'alert');
        const copInfo = el('p', {className:'prInfo'});
        const selRange = sel([['all', 'Imprimir Todas as Páginas'], ['cur', 'Imprimir Página Atual'], ['custom', 'Intervalo Personalizado']]);
        const rangeIn = el('input', {type:'text', placeholder:'Ex.: 1-3, 5, 8-', autocomplete:'off'});
        const rangeRow = row('Páginas a imprimir', rangeIn); rangeRow.style.display = 'none';
        const rangeInfo = el('p', {className:'prInfo'});
        const selColl = sel([['1', 'Agrupado: 1,2,3  1,2,3  1,2,3'], ['0', 'Não agrupado: 1,1,1  2,2,2  3,3,3']]); selColl.disabled = true;
        set.append(btnRow, prMsg, copInfo,
          el('h2', {textContent:'Impressora'}),
          el('p', {className:'prInfo', textContent:'A impressora, a cor e a impressão frente e verso automática são escolhidas na janela do navegador, que abre ao clicar em Imprimir. Para gerar um arquivo, escolha “Salvar como PDF” nela.'}),
          el('h2', {textContent:'Configurações'}),
          row('Páginas', selRange), rangeRow, rangeInfo, row('Lados', selSide), sideInfo, row('Agrupamento', selColl), row('Orientação', selOri), row('Tamanho do papel', selSize), row('Margens', selMar), row('Páginas por folha', selNup), link, info);
        const syncCop = ()=>{
          selColl.disabled = copies < 2;
          copInfo.textContent = copies > 1 ? 'O Verbus repete as folhas; deixe “Cópias” em 1 na janela do navegador para não multiplicar de novo.' : '';
        };
        const setCopies = ()=>{ copies = Math.max(1, Math.min(99, parseInt(copIn.value, 10) || 1)); syncCop(); prMsg.textContent = ''; };
        copIn.oninput = setCopies; copIn.onchange = ()=>{ setCopies(); copIn.value = String(copies); };
        const chkRange = ()=>{
          rangeInfo.className = 'prInfo'; const N = plan.length;
          if(range === 'cur') rangeInfo.textContent = 'Imprime a página ' + ((nup > 1 ? pageNo * nup : pageNo) + 1) + ', a que aparece na pré-visualização.';
          else if(range === 'custom'){
            const r = parseRange(rangeIn.value, N);
            if(!rangeIn.value.trim()) rangeInfo.textContent = 'O documento tem ' + N + ' página' + (N > 1 ? 's' : '') + '. Separe com vírgula e use hífen para intervalos.';
            else if(r.err){ rangeInfo.textContent = r.err; rangeInfo.className = 'prInfo prErr'; }
            else rangeInfo.textContent = r.pages.length + ' página' + (r.pages.length > 1 ? 's' : '') + ' a imprimir.';
          }else rangeInfo.textContent = '';
        };
        selRange.onchange = ()=>{ range = selRange.value; rangeRow.style.display = range === 'custom' ? '' : 'none'; chkRange(); prMsg.textContent = ''; if(range === 'custom') rangeIn.focus(); };
        rangeIn.oninput = ()=>{ chkRange(); prMsg.textContent = ''; };
        rangeIn.onkeydown = e=>{ if(e.key === 'Enter'){ e.preventDefault(); btn.click(); } };
        selColl.onchange = ()=>{ coll = selColl.value === '1'; };

        // ---- pré-visualização ----
        const nav = el('div', {className:'prNav'});
        const bPrev = el('button', {type:'button', textContent:'◀', title:'Página anterior'}), bNext = el('button', {type:'button', textContent:'▶', title:'Próxima página'});
        const inp = el('input', {type:'text', inputMode:'numeric', value:'1'}); inp.setAttribute('aria-label', 'Página');
        const tot = el('span', {textContent:'de 1'});
        const zOut = el('button', {type:'button', textContent:'−', title:'Diminuir o zoom'}), zIn = el('button', {type:'button', textContent:'+', title:'Aumentar o zoom'}), zFit = el('button', {type:'button', textContent:'⤢', title:'Ajustar à página'});
        const zr = el('input', {type:'range', min:10, max:200, step:5, value:50}), zl = el('span', {className:'prZl', textContent:'50%'});
        zr.setAttribute('aria-label', 'Zoom da pré-visualização');
        const zset = v=>{ zoom = Math.max(0.1, Math.min(2, v)); fit(); };
        zOut.onclick = ()=>zset((zoom == null ? fitK : zoom) - 0.1); zIn.onclick = ()=>zset((zoom == null ? fitK : zoom) + 0.1);
        zr.oninput = ()=>zset(parseInt(zr.value, 10) / 100); zFit.onclick = ()=>{ zoom = null; fit(); };
        nav.append(bPrev, inp, tot, bNext, el('span', {className:'prZ'}, zOut, zr, zIn, zl, zFit));
        const box = el('div', {className:'prBox'}), paper = el('div', {className:'prPaper'}), ifr = el('iframe');
        ifr.setAttribute('sandbox', 'allow-same-origin'); ifr.setAttribute('title', 'Pré-visualização da página'); ifr.tabIndex = -1;
        const lyBack = el('div', {className:'prLy'}), lyFront = el('div', {className:'prLy'}), hdr = el('div', {className:'prHf'}), ftr = el('div', {className:'prHf'});
        paper.append(lyBack, ifr, lyFront, hdr, ftr); box.append(paper);
        const scroll = el('div', {className:'prScroll'}, box); prev.append(scroll, nav);
        scroll.addEventListener('wheel', e=>{ if(!e.ctrlKey) return; e.preventDefault(); zset((zoom == null ? fitK : zoom) + (e.deltaY < 0 ? 0.05 : -0.05)); }, {passive:false});
        wrap.append(set, prev);

        let plan = [0], pageNo = 0, cols = 1, shiftX = 0, geo = null, token = 0, nup = 1, side = 'um', lastHtml = '', curSheet = null, sheetSig = '';
        const NUP = {1:[1,1], 2:[2,1], 4:[2,2], 6:[2,3], 8:[2,4], 16:[4,4]};
        const alive = ()=>wrap.isConnected;
        function fit(){
          if(!geo) return;
          const availW = Math.max(160, prev.clientWidth - 24), availH = Math.max(240, innerHeight - 250);
          fitK = Math.min(1, availW / geo.W, availH / geo.H); const k = zoom == null ? fitK : zoom;
          zr.value = String(Math.round(k * 100)); zl.textContent = Math.round(k * 100) + '%';
          box.style.width = Math.round(geo.W * k) + 'px'; box.style.height = Math.round(geo.H * k) + 'px';
          [paper, curSheet].forEach(x=>{ if(x){ x.style.width = geo.W + 'px'; x.style.height = geo.H + 'px'; x.style.transform = 'scale(' + k + ')'; } });
        }
        // uma "folha" cópia da página (iframe próprio) para folhas com várias páginas e para a impressão
        function buildPaper(idx){
          const pgc = pgOf(), e = effMar(), cw = Math.max(CMPX, pgc.w * CMPX - e.l - e.r);
          const pp = el('div', {className:'prPaper'}), lB = el('div', {className:'prLy'}), lF = el('div', {className:'prLy'}), h = el('div', {className:'prHf'}), f = el('div', {className:'prHf'}), fr = el('iframe');
          fr.setAttribute('sandbox', 'allow-same-origin'); fr.tabIndex = -1;
          fr.style.left = e.l + 'px'; fr.style.top = e.t + 'px'; fr.style.width = cw + 'px'; fr.style.height = geo.use + 'px';
          pp.style.width = geo.W + 'px'; pp.style.height = geo.H + 'px';
          pp.append(lB, fr, lF, h, f); decor(idx, lB, lF, h, f);
          const place = ()=>{
            const d = fr.contentDocument, pg = d && d.getElementById('page'); if(!pg) return;
            if(cols > 1){ pg.style.transform = 'translateX(' + (-idx * shiftX) + 'px)'; fr.style.height = geo.use + 'px'; }
            else{
              const from = plan[idx], to = idx + 1 < plan.length ? plan[idx + 1] : from + geo.use;
              pg.style.transform = 'translateY(' + (-from) + 'px)'; fr.style.height = Math.max(1, Math.min(geo.use, to - from)) + 'px';
            }
          };
          const ready = new Promise(res=>{
            fr.onload = ()=>{
              place();
              let d = null; try{ d = fr.contentDocument; }catch(err){}
              Promise.race([d && d.fonts ? d.fonts.ready : Promise.resolve(), new Promise(r=>setTimeout(r, 1500))]).then(()=>{ place(); setTimeout(res, 150); });
            };
          });
          fr.srcdoc = lastHtml;
          return {el:pp, ready};
        }
        function buildSheet(si, idxs){
          const sh = el('div', {className:'prPaper nupSheet'}), W = geo.W, H = geo.H, g = NUP[nup] || [1,1], readies = [];
          sh.style.width = W + 'px'; sh.style.height = H + 'px';
          const pad = nup > 1 ? 0.6 * CMPX : 0, cellW = (W - 2 * pad) / g[0], cellH = (H - 2 * pad) / g[1], sc = nup > 1 ? Math.min(cellW / W, cellH / H) * 0.97 : 1;
          for(let k = 0; k < nup; k++){
            const idx = idxs ? idxs[k] : si * nup + k; if(idx == null || idx >= plan.length) break;
            const bp = buildPaper(idx), col = k % g[0], row = Math.floor(k / g[0]);
            // caixa já do tamanho reduzido (com corte), para a impressão não estender a página original além da folha
            const cellBox = el('div');
            cellBox.style.cssText = 'position:absolute;overflow:hidden;background:#fff;left:' + (pad + col * cellW + (cellW - W * sc) / 2) + 'px;top:' + (pad + row * cellH + (cellH - H * sc) / 2) + 'px;width:' + (W * sc) + 'px;height:' + (H * sc) + 'px' + (nup > 1 ? ';outline:1px solid #9a9a9a' : '');
            bp.el.style.left = '0px'; bp.el.style.top = 'auto'; bp.el.style.bottom = '0px'; bp.el.style.transformOrigin = '0 100%'; bp.el.style.transform = 'scale(' + sc + ')';   // ancorada embaixo: a caixa original não passa do fim da folha e a impressão não a corta
            cellBox.append(bp.el); sh.append(cellBox); readies.push(bp.ready);
          }
          return {el:sh, ready:Promise.all(readies)};
        }
        const sheetCount = ()=>Math.max(1, Math.ceil(plan.length / nup));
        function decor(idx, lyBack, lyFront, hdr, ftr){
          const pgc = pgOf(), e = effMar(), hh = hfData(), first = idx === 0 && !!hh.dif, abnt = page.classList.contains('abnt');
          const cw = Math.max(CMPX, pgc.w * CMPX - e.l - e.r), N = plan.length;
          lyBack.replaceChildren(); lyFront.replaceChildren();
          if(!first) hfImgList().forEach(it=>{
            const im = el('img', {src:it.src, alt:''});
            im.style.cssText = 'position:absolute;left:' + it.x + 'px;top:' + it.y + 'px;width:' + it.w + 'px;height:' + it.h + 'px;opacity:' + (1 - (it.op || 0) / 100);
            (it.z === 'front' ? lyFront : lyBack).append(im);
          });
          const fill = (box, k)=>{
            box.textContent = ''; box.style.display = 'none';
            if(first || !hfHas(k)) return;
            const a = hh[k + 'a'] === 'center' ? 'center' : hh[k + 'a'] === 'right' ? 'right' : 'left', top = k === 'h';
            const dist = hfDist(top, e);
            hfLineRuns(k).forEach(line=>{
              const d = document.createElement('div'); d.style.cssText = 'white-space:pre-wrap;line-height:1.3;min-height:1.3em';
              line.forEach(r=>{ const sp = document.createElement('span'); sp.style.cssText = hfRunCss(hfResolve(k, r.s)); sp.textContent = r.f ? String(r.f === 'pages' ? N : idx + 1) : r.t.replace(/\s+/g, ' '); d.append(sp); });
              if(!line.length) d.textContent = '\u00a0';
              box.append(d);
            });
            box.style.cssText = 'display:block;left:' + e.l + 'px;width:' + cw + 'px;text-align:' + a + ';' + hfRunCss(hfStyle(k)) + ';' + (top ? 'top:' + dist + 'px' : 'bottom:' + dist + 'px');
          };
          fill(hdr, 'h'); fill(ftr, 'f');
          if(abnt && !hfHas('h') && !hfHas('f') && idx >= 0){   // número automático do padrão ABNT, no canto superior direito
            hdr.textContent = String(idx + 1);
            hdr.style.cssText = 'display:block;left:' + e.l + 'px;width:' + cw + 'px;text-align:right;font:12pt Arial,sans-serif;top:' + Math.max(0, e.t / 2 - 9) + 'px';
          }
        }
        function showPage(n){
          const U = nup > 1 ? sheetCount() : plan.length;
          pageNo = Math.max(0, Math.min(U - 1, n)); chkRange();
          inp.value = String(pageNo + 1); tot.textContent = 'de ' + U; inp.setAttribute('aria-label', nup > 1 ? 'Folha' : 'Página');
          bPrev.disabled = pageNo === 0; bNext.disabled = pageNo >= U - 1;
          if(!geo) return;
          if(nup > 1){
            const sig = [JSON.stringify(plan), pageNo, nup, lastHtml.length].join('|');
            if(curSheet && sig === sheetSig) return;
            sheetSig = sig; paper.style.display = 'none'; if(curSheet) curSheet.remove();
            curSheet = buildSheet(pageNo).el; box.append(curSheet); fit(); return;
          }
          if(curSheet){ curSheet.remove(); curSheet = null; sheetSig = ''; }
          paper.style.display = '';
          decor(pageNo, lyBack, lyFront, hdr, ftr);
          const d = ifr.contentDocument, pg = d && d.getElementById('page'); if(!pg) return;
          if(cols > 1){ pg.style.transform = 'translateX(' + (-pageNo * shiftX) + 'px)'; ifr.style.height = geo.use + 'px'; }
          else{
            const from = plan[pageNo], to = pageNo + 1 < plan.length ? plan[pageNo + 1] : from + geo.use;
            pg.style.transform = 'translateY(' + (-from) + 'px)'; ifr.style.height = Math.max(1, Math.min(geo.use, to - from)) + 'px';
          }
        }
        function render(){
          const my = ++token, pgc = pgOf(), e = effMar();
          const W = pgc.w * CMPX, H = pgc.h * CMPX, cw = Math.max(CMPX, W - e.l - e.r), use = Math.max(CMPX, H - e.t - e.b);
          geo = {W, H, use}; cols = pgc.cols;
          paper.style.width = W + 'px'; paper.style.height = H + 'px';
          ifr.style.left = e.l + 'px'; ifr.style.top = e.t + 'px'; ifr.style.width = cw + 'px'; ifr.style.height = use + 'px';
          fit();
          const gap = 1.25 * CMPX;
          const styles = [...document.querySelectorAll('style')].filter(x=>x.id !== 'pgShift' && x.id !== 'fnPos').map(x=>x.outerHTML).join('');
          const over = '<style>html,body{margin:0;padding:0;background:transparent !important;height:auto !important;overflow:hidden;display:block}' +
            '#page{zoom:1 !important;position:static !important;width:' + cw + 'px !important;max-width:none !important;min-height:0 !important;padding:0 !important;margin:0 !important;box-shadow:none !important;background:transparent !important;color:#111;caret-color:transparent;isolation:auto}' +
            '#page [data-hid]{display:none !important}#page .pb{border:0 !important;margin:0 !important}#page .sbk{border:0 !important;margin:0 !important}#page .sbk::after{display:none !important}' +
            (cols > 1 ? '#page{column-count:' + cols + ' !important;column-gap:' + gap + 'px !important;column-fill:auto !important;height:' + use + 'px !important}' : '') + '</style>';
          const html = '<!DOCTYPE html><html lang="pt-BR" data-theme="light"><head><meta charset="utf-8">' + styles + over + '</head><body><div id="page" class="' + page.className.replace(/"/g, '') + '" style="' + (page.getAttribute('style') || '').replace(/"/g, '&quot;') + '">' + page.innerHTML + '</div></body></html>';
          lastHtml = html;
          const calc = ()=>{
            if(my !== token || !alive()) return;
            try{
              const d = ifr.contentDocument, pg = d.getElementById('page');
              if(cols > 1){
                const colW = (cw - (cols - 1) * gap) / cols, sw = d.documentElement.scrollWidth;
                const C = Math.max(1, Math.round((sw + gap) / (colW + gap)));
                shiftX = cw + gap; plan = Array.from({length:Math.max(1, Math.ceil(C / cols))}, (_, i)=>i);
              }else{
                pg.style.transform = ''; const base = 0;   // medido a partir do topo do documento (a margem do 1º elemento escapa de #page)
                const starts = pgPlan([...pg.children], geo.use, k=>{ const r = k.getBoundingClientRect(); return {top:r.top - base, bot:r.bottom - base}; });
                plan = starts;
              }
            }catch(err){ plan = [0]; }
            showPage(Math.min(pageNo, plan.length - 1));
          };
          ifr.onload = ()=>{
            calc();
            // fontes e imagens podem mudar a altura depois do carregamento: recalcula as quebras quando terminarem
            try{
              const d = ifr.contentDocument;
              if(d.fonts && d.fonts.ready) d.fonts.ready.then(calc);
              [...d.images].forEach(im=>{ if(!im.complete) im.addEventListener('load', calc, {once:true}); });
            }catch(err){}
            setTimeout(calc, 350);
          };
          ifr.srcdoc = html;
        }
        const refresh = ()=>{
          pgSync();
          selOri.value = $('pgOri').value; selSize.value = $('pgSize').value; selMar.value = $('pgMar').value;
          const pgc = pgOf(), e = effMar();
          info.textContent = PG_SIZES[pgc.size][2] + (pgc.land ? ' · paisagem' : ' · retrato') + ' · margens (sup., inf., esq., dir.): ' + [e.t, e.b, e.l, e.r].map(cm).join(' · ') + '. A pré-visualização é aproximada: as quebras de página podem diferir um pouco do PDF.';
          render();
        };
        selOri.onchange = ()=>{ pgSet({land: selOri.value === 'l'}); refresh(); };
        selSize.onchange = ()=>{ pgSet({size: selSize.value}); refresh(); };
        selMar.onchange = ()=>{
          if(selMar.value === 'custom'){ pgSync(); selMar.value = $('pgMar').value; pgDlgOpen(); $('pgDlg').addEventListener('close', ()=>{ if(alive()) refresh(); }, {once:true}); return; }
          marSet(selMar.value); refresh();
        };
        link.onclick = ()=>{ pgDlgOpen(); $('pgDlg').addEventListener('close', ()=>{ if(alive()) refresh(); }, {once:true}); };
        selNup.onchange = ()=>{ nup = parseInt(selNup.value, 10); showPage(0); };
        selSide.onchange = ()=>{ side = selSide.value; sideInfo.textContent = SIDEMSG[side]; };
        bPrev.onclick = ()=>showPage(pageNo - 1); bNext.onclick = ()=>showPage(pageNo + 1);
        inp.onchange = ()=>{ const n = parseInt(inp.value, 10); showPage(isNaN(n) ? pageNo : n - 1); };
        inp.onkeydown = e=>{ if(e.key === 'Enter'){ e.preventDefault(); inp.onchange(); } };
        addEventListener('resize', ()=>{ if(alive()) fit(); });
        pageNo = 0; refresh();
        requestAnimationFrame(fit);
        return [wrap];
      },
      compartilhar(){
        const out = [];
        if(navigator.share) out.push(act('📤', 'Compartilhar…', 'Usa o menu de compartilhamento do aparelho', ()=>{
          navigator.share({title:title.value, text:page.innerText.slice(0, 5000)}).catch(()=>{}); }));
        out.push(act('✉', 'Enviar por e-mail', 'Abre seu e-mail com o começo do texto; anexe o .docx para enviar tudo', ()=>{
          const t = page.innerText.trim(); location.href = 'mailto:?subject=' + encodeURIComponent(title.value) + '&body=' + encodeURIComponent(t.slice(0, 1500) + (t.length > 1500 ? '…' : '')); }));
        out.push(act('📋', 'Copiar o texto', 'Copia o documento sem formatação', ()=>{
          (navigator.clipboard ? navigator.clipboard.writeText(page.innerText) : Promise.reject()).then(()=>say('Texto copiado.'), ()=>say('Não foi possível copiar neste navegador.')); }));
        out.push(act('⬇', 'Baixar .docx para anexar', 'Gera o arquivo para você enviar por onde quiser', ()=>{ $('btnDocx').click(); say('Gerando o arquivo…'); }));
        return out;
      },
      exportar(){
        return [act('📕', 'Criar PDF', 'Abre a impressão; escolha "Salvar como PDF"', ()=>closeThen(()=>setTimeout(()=>window.print(), 150))),
          el('h2', {textContent:'Alterar tipo de arquivo'}),
          act('📃', 'Texto simples (.txt)', 'Só o texto', ()=>{ $('btnTxt').click(); say('Gerando o arquivo…'); }),
          act('🌐', 'Página da Web (.html)', 'Para abrir no navegador', ()=>{ $('btnHtml').click(); say('Gerando o arquivo…'); })];
      },
      fechar(){
        return [el('p', {className:'bsNote', textContent:'Fecha este documento e abre o mais recente. Ele continua salvo em "Abrir". Documento vazio e sem nome é descartado.'}),
          act('✖', 'Fechar documento', '', ()=>{
            const old = store.current, ids = Object.keys(store.docs).filter(i=>i !== old && !store.docs[i].modelo).sort((a,b)=>store.docs[b].t - store.docs[a].t);
            const vazio = emptyDoc() && (!title.value.trim() || title.value.trim() === 'Documento sem título');
            if(vazio && !ids.length){ say('Este documento já está vazio e é o único.'); return; }
            save(); close(false);
            if(ids.length){ openDoc(ids[0]); if(vazio){ delete store.docs[old]; persist(); renderSide(); } }
            else newDoc();
            page.focus();
          })];
      },
      conta(){
        const box = el('p', {className:'bsNote', textContent:'Calculando…'});
        if(navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e=>{ box.textContent = 'Usando ' + size(e.usage || 0) + de(e); }).catch(()=>{ box.textContent = 'Não foi possível calcular.'; });
        else box.textContent = 'Este navegador não informa o uso de armazenamento.';
        function de(e){ return e.quota ? ' de cerca de ' + size(e.quota) + ' disponíveis.' : '.'; }
        const th = document.documentElement.dataset.theme || 'auto';
        const setTheme = v=>{ const r = document.documentElement;
          if(v === 'auto'){ delete r.dataset.theme; try{ localStorage.removeItem(LS_KEYS.theme); }catch(e){} }
          else{ r.dataset.theme = v; try{ localStorage.setItem(LS_KEYS.theme, v); }catch(e){} }
          go('conta'); };
        return [el('p', {className:'bsNote', textContent:'O Verbus não tem login: seus documentos ficam só neste navegador, neste aparelho.'}),
          el('h2', {textContent:'Tema do Verbus'}),
          act('🌓', 'Automático', 'Segue o tema do aparelho', ()=>setTheme('auto'), th === 'auto'),
          act('☀', 'Claro', '', ()=>setTheme('light'), th === 'light'),
          act('🌙', 'Escuro', '', ()=>setTheme('dark'), th === 'dark'),
          el('h2', {textContent:'Armazenamento'}), box,
          el('h2', {textContent:'Limpar dados'}),
          el('p', {className:'bsNote', textContent:'Apaga documentos, modelos, estilos e preferências guardados neste navegador. Baixe antes o que for importante (Arquivo > Salvar como): não dá para desfazer.'}),
          act('🗑', 'Limpar todos os dados agora', 'Apaga tudo e reinicia o Verbus em branco', async ()=>{
            if(!confirm('Apagar TODOS os documentos e dados do Verbus neste navegador?\n\nNão dá para desfazer.')) return;
            await window.__limparVerbus(false); say('Dados apagados.'); setTimeout(()=>location.reload(), 300); }),
          act('🚪', 'Limpar tudo e sair', 'Apaga tudo e fecha o Verbus (nada fica no navegador)', async ()=>{
            if(!confirm('Apagar TODOS os documentos e dados do Verbus e sair?\n\nNão dá para desfazer.')) return;
            await window.__limparVerbus(false);
            try{ window.close(); }catch(e){} setTimeout(()=>location.replace('about:blank'), 200); }),
          (()=>{ let on = false; try{ on = localStorage.getItem(LS_KEYS.limpasessao) === '1'; }catch(e){}
            return act('⏻', 'Apagar ao fechar: ' + (on ? 'ligado' : 'desligado'), 'Ao fechar a aba e abrir de novo, os documentos da sessão anterior são apagados (recarregar a página não apaga)', ()=>{
              if(!on && !confirm('Ligar "Apagar ao fechar"?\n\nDa próxima vez que você abrir o Verbus numa aba nova, os documentos salvos serão apagados. Baixe o que quiser guardar.')) return;
              try{ if(on) localStorage.removeItem(LS_KEYS.limpasessao); else localStorage.setItem(LS_KEYS.limpasessao, '1'); }catch(e){} go('conta'); }, on); })(),
          act('🛡', 'Proteger meus documentos', 'Pede ao navegador para não apagar os dados sozinho', ()=>{
            (navigator.storage && navigator.storage.persist ? navigator.storage.persist() : Promise.resolve(false)).then(ok=>say(ok ? 'Pronto: o navegador não vai apagar seus documentos sozinho.' : 'O navegador não concedeu a proteção. Baixe cópias (.docx) do que for importante.')); })];
      },
      opcoes(){
        const z = el('select'); [...$('zoom').options].forEach(o=>z.append(el('option', {value:o.value, textContent:o.textContent, selected:o.value === $('zoom').value})));
        z.setAttribute('aria-label', 'Zoom'); z.onchange = ()=>{ $('zoom').value = z.value; $('zoom').dispatchEvent(new Event('change')); };
        const toggle = (id, name, desc, on)=>act('⚙', name + ': ' + (on ? 'ligado' : 'desligado'), desc, ()=>{ $(id).click(); go('opcoes'); }, on);
        return [act('✔', 'Revisão e idioma', 'Ortografia, idioma e erros comuns', ()=>closeThen(()=>$('btnRev').click())),
          toggle('btnAbnt', 'Padrão ABNT', 'A4, margens 3/2/2/3 cm, Arial 12', page.classList.contains('abnt')),
          toggle('btnRuler', 'Régua', 'Mostra as réguas em cm', $('btnRuler').classList.contains('on')),
          act('☰', 'Painel lateral', 'Documentos e estrutura', ()=>{ $('btnSide').click(); say($('side').hidden ? 'Painel oculto.' : 'Painel visível.'); }),
          el('h2', {textContent:'Zoom da página'}), z];
      },
      sobre(){
        const p = t=>el('p', {className:'bsNote', textContent:t});
        const strong = el('p', {className:'bsNote'}); strong.style.cssText = 'font-weight:700;border-left:4px solid #1d5fd1;padding:6px 10px;background:rgba(29,95,209,.08)';
        strong.textContent = 'Uso pessoal: o Verbus foi feito apenas para o uso particular do autor. Não é um produto, não é oferecido ao público nem a terceiros, e não há suporte, garantia ou autorização para copiar, redistribuir, revender ou usar comercialmente.';
        return [el('h2', {textContent:'Aviso de uso pessoal'}), strong,
          p('Seus documentos ficam somente neste navegador (IndexedDB/localStorage); o Verbus não tem servidor e não envia o seu texto a ninguém. Só são feitas requisições a uma CDN pública (jsDelivr) quando você abre um .docx, baixa um .docx ou usa Sinônimos, e isso expõe o seu endereço IP a ela.'),
          el('h2', {textContent:'Aviso de independência'}),
          p('O Verbus é um projeto independente e não tem qualquer ligação, patrocínio ou aprovação da Microsoft Corporation. Foi escrito do zero (código, ícones e textos próprios) e não usa código, imagens ou arquivos de nenhum produto da Microsoft.'),
          p('"Microsoft", "Word", "Office" e "Segoe UI" são marcas ou fontes de seus respectivos titulares e são citadas apenas para indicar compatibilidade com o formato de arquivo .docx. O Verbus não é o Microsoft Word e não se apresenta como tal.'),
          p('As fontes Calibri e Segoe UI só aparecem se já estiverem instaladas no aparelho de quem usa; o Verbus não as distribui.'),
          p('Bibliotecas de terceiros carregadas da internet sob as licenças de cada uma: mammoth, JSZip, html-docx-js e sinonimos-local.'),
          p('Este aviso é informativo e não é aconselhamento jurídico.')];
      }
    };

    // monta o menu lateral
    const back = el('button', {type:'button', className:'back', title:'Voltar ao documento (Esc)', onclick:()=>close()});
    back.setAttribute('aria-label', 'Voltar ao documento');
    back.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 10H3M9 4l-6 6 6 6"/></svg>';
    nav.append(back);
    ITEMS.forEach(i=>{
      if(!i){ nav.append(el('div', {className:'sep'})); return; }
      const b = el('button', {type:'button', className:'it', textContent:i[1], onclick:()=>go(i[0])}); b.dataset.k = i[0]; nav.append(b);
    });

    $('btnFile').addEventListener('click', ()=>openBs('info'));
    $('btnPessoal').addEventListener('click', ()=>openBs('sobre'));
    $('btnShare').addEventListener('mousedown', e=>e.preventDefault());
    $('btnShare').addEventListener('click', ()=>openBs('compartilhar'));
    document.addEventListener('keydown', e=>{
      if(!bs.hidden && e.key === 'Escape'){ e.preventDefault(); close(); return; }
      if((e.ctrlKey || e.metaKey) && !e.altKey){
        const k = e.key.toLowerCase();
        if(k === 'o' && !e.shiftKey){ e.preventDefault(); openBs('abrir'); }
        else if(k === 's' && e.shiftKey){ e.preventDefault(); openBs('salvarcomo'); }
        else if(k === 'p' && !e.shiftKey){ e.preventDefault(); openBs('imprimir'); }
      }
    });
  })();

  // ================= Guias da faixa de opções (estilo clássico) =================
  (function(){
    const tabs = [...document.querySelectorAll('#tabs [role=tab]')], panels = [...document.querySelectorAll('.tabpanel')];
    function show(k){
      tabs.forEach(t=>{ const on = t.dataset.tab === k; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
      panels.forEach(p=>{ p.hidden = p.dataset.tab !== k; });
      try{ if(k !== 'tabela') localStorage.setItem(LS_KEYS.tab, k); }catch(e){}
    }
    tabs.forEach((t, i)=>{
      t.addEventListener('mousedown', e=>e.preventDefault());
      t.addEventListener('click', ()=>show(t.dataset.tab));
      t.addEventListener('keydown', e=>{
        const j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
        if(j < 0) return; e.preventDefault();
        let jj = j; const dir = e.key === 'ArrowLeft' || e.key === 'End' ? -1 : 1;
        for(let n = 0; tabs[jj].hidden && n < tabs.length; n++) jj = (jj + dir + tabs.length) % tabs.length;
        show(tabs[jj].dataset.tab); tabs[jj].focus();
      });
    });
    $('btnFile').addEventListener('mousedown', e=>e.preventDefault());
    $('btnQSave').addEventListener('mousedown', e=>e.preventDefault());
    $('btnQSave').addEventListener('click', ()=>fileDo(false));
    let k0 = 'inicio'; try{ k0 = localStorage.getItem(LS_KEYS.tab) || 'inicio'; }catch(e){}
    show(tabs.some(t=>t.dataset.tab === k0 && !t.hidden) ? k0 : 'inicio');
  })();
