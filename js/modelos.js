/* Verbus — Modelos de documento prontos (CRAS/SMAS)
   (js/modelos.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */
// ---------- Modelos de documento ----------
  // Modelo = cópia de um documento (texto, tabelas, cabeçalho/rodapé, margens, papel e estilos), guardada com modelo:true.
  // Ela fica escondida das listas de documentos e só aparece em Arquivo > Novo > Meus modelos.
  
  
  
  
  // Deixa em negrito só as palavras do rótulo; espaços (&nbsp;) e os "( )" de marcar ficam fora do negrito, então o que a pessoa escrever ou marcar depois sai em texto normal (como no Relatório Informativo)
  function tplBold(t){
    return String(t).split(/(\((?:&nbsp;)+\)|&nbsp;)/).map(x=>(/^(\((?:&nbsp;)+\)|&nbsp;)$/.test(x) || !x.trim()) ? x : '<b>' + x + '</b>').join('');
  }
  function tplRelatorio(){
    // Baseado no Modelo_Pronto.docx do CRAS, com texto em Times New Roman 12, espaçamento 1,5: cabeçalho e rodapé em imagem, 5 campos e assinatura. Medidas em px (96 por polegada).
    const F = 'font-family:\'Times New Roman\',Times,serif;font-size:12pt;color:#000;';
    const hd = (t, ml)=>'<p style="' + F + 'font-weight:bold;line-height:1.5;margin:31px 0 15px ' + ml + 'px;text-align:left;break-after:avoid">' + t + '</p>';
    const box = (w, h, ml)=>'<table data-flow="1" style="border-collapse:collapse;table-layout:fixed;width:' + w + 'px;margin:0 0 0 ' + ml + 'px"><tbody><tr><td style="' + F + 'width:' + w + 'px;height:' + h + 'px;border:1px solid #000;padding:3px 7px;vertical-align:top;line-height:1.5;text-align:left"><p style="margin:0;text-indent:1.25cm;line-height:1.5"><br></p></td></tr></tbody></table>';
    // Quadro longo (Situação): uma célula só, sem linha dupla no meio; a borda acompanha a quebra de página.
    const big = (w, h, ml)=>'<table data-flow="1" style="border-collapse:collapse;table-layout:fixed;width:' + w + 'px;margin:0 0 0 ' + ml + 'px"><tbody><tr><td style="' + F + 'width:' + w + 'px;height:' + h + 'px;border:1px solid #000;padding:3px 7px;vertical-align:top;line-height:1.5;text-align:left"><p style="margin:0;text-indent:1.25cm;line-height:1.5"><br></p></td></tr></tbody></table>';
    const c = (w, h, inner, span)=>'<td' + (span ? ' colspan="' + span + '"' : '') + ' style="' + F + 'width:' + w + 'px;height:' + h + 'px;border:1px solid #000;padding:0 7px;vertical-align:middle;line-height:1.5;text-align:left"><b>' + inner + '</b>&nbsp;</td>';
    // Composição Familiar em grade (Nome / Parentesco / Idade / Ocupação ou renda): Tab passa de célula em célula e a última Tab cria nova linha
    const famW = [250, 120, 64, 182];
    const famC = (w, t, head)=>'<td style="' + F + 'width:' + w + 'px;height:' + (head ? 30 : 28) + 'px;border:1px solid #000;padding:0 7px;vertical-align:middle;line-height:1.5;text-align:' + (head ? 'center' : 'left') + (head ? ';background-color:#f2f2f2' : '') + '">' + (head ? '<b>' + t + '</b>' : '<br>') + '</td>';
    const fam = '<table data-sec="1" style="border-collapse:collapse;table-layout:fixed;width:616px;margin:0 0 0 5px"><colgroup>' + famW.map(w=>'<col style="width:' + w + 'px">').join('') + '</colgroup><tbody>' +
      '<tr>' + ['Nome', 'Parentesco', 'Idade', 'Ocupação / Renda'].map((t, i)=>famC(famW[i], t, true)).join('') + '</tr>' +
      ('<tr>' + famW.map(w=>famC(w, '', false)).join('') + '</tr>').repeat(4) + '</tbody></table>';
    const html =
      '<p style="' + F + 'font-weight:bold;text-decoration:underline;text-align:center;line-height:1.5;margin:20px 0 0">Relatório Informativo</p>' +
      '<p style="' + F + 'font-weight:bold;line-height:1.5;margin:8px 0 15px 28px;text-align:left;break-after:avoid">01 – Identificação:</p>' +
      '<table data-sec="1" style="border-collapse:collapse;table-layout:fixed;width:616px;margin:0 0 0 5px"><colgroup><col style="width:333px"><col style="width:71px"><col style="width:212px"></colgroup><tbody>' +
        '<tr>' + c(616, 36, 'Nome:', 3) + '</tr>' +
        '<tr>' + c(404, 36, 'Data de Nascimento:', 2) + c(212, 36, 'Idade:') + '</tr>' +
        '<tr>' + c(333, 36, 'Endereço:') + c(283, 36, 'Telefone:', 2) + '</tr></tbody></table>' +
      hd('02 – Demanda:', 28) + box(616, 37, 5) +
      hd('03 – Composição Familiar:', 28) + fam +
      hd('04 – Condições Habitacionais:', 28) + box(616, 90, 5) +
      hd('05 – Situação Apresentada:', 28) + big(616, 370, 5) +
      hd('06 – Providências Socioassistenciais:', 28) + box(616, 139, 5) +
      '<p style="' + F + 'line-height:1.5;margin:31px 0 0 319px;text-align:left;break-after:avoid">Boa Vista – RR, {{DATA}}</p>' +
      ('<p style="' + F + 'line-height:1.5;margin:0;break-after:avoid"><br></p>').repeat(3) +
      '<p style="' + F + 'font-weight:bold;font-style:italic;line-height:1.5;width:326px;margin:0 0 0 295px;padding-top:3px;border-top:1px solid #000;text-align:right;break-after:avoid">(Assinado eletronicamente)</p>' +
      '<p style="' + F + 'font-weight:bold;line-height:1.5;width:326px;margin:0 0 0 295px;text-align:right">Técnico de Referência</p>';
    return {
      title:'Relatório Informativo', kind:'relatorio', html, abnt:false,
      sty:{f:'Times New Roman', hc:'', sp:'padrao'},
      mar:{t:176, r:56.7, b:101.3, l:113.4},
      hf:{h:'', f:'', ha:'left', fa:'left', dif:false, imgs:[
        {id:'tplh', src:TPL_HDR, x:0, y:0, w:794, h:156, z:'back', op:0},
        {id:'tplf', src:TPL_FTR, x:0, y:870, w:794, h:253, z:'back', op:0}]}
    };
  }
  function tplEncaminhamento(){
    // Baseado no Encaminhamento.docx do CRAS: Times New Roman 12, quadro único com os campos, data, assinatura e página de ANEXO. Cabeçalho e rodapé em imagem. Medidas em px (96 por polegada).
    const F = 'font-family:\'Times New Roman\',Times,serif;font-size:12pt;color:#000;';
    const B = '1px solid #000';
    const L = t=>'<b><u>' + t + '</u></b>';
    const SP = '&nbsp;';   // espaço fora do negrito/sublinhado: o que for digitado depois do rótulo sai em texto normal
    // grade de 2 colunas: 285 + 321 = 606 px (a 2ª precisa de ≥ 321 px para "CRAS/CRISTIANA VICENTE NUNES" não quebrar; a largura vem da 1ª linha, por causa do table-layout fixo) (Encaminhamento/Idade/NIS/Contato começam na 2ª coluna)
    const td = (span, w, inner, h, o)=>{
      o = o || {};
      return '<td colspan="' + span + '" style="' + F + 'width:' + w + 'px;height:' + h + 'px;padding:' + (o.pad || '5px 11px 0') + ';vertical-align:top;line-height:1.5;text-align:left;border-style:none;' +
        (o.l ? 'border-left:' + B + ';' : '') + (o.r ? 'border-right:' + B + ';' : '') + (o.t ? 'border-top:' + B + ';' : '') + (o.b ? 'border-bottom:' + B + ';' : '') + '">' + inner + '</td>';
    };
    // linha com um campo que ocupa a largura toda
    const full = (inner, h, o, flow)=>'<tr' + (flow ? ' data-flow="1"' : '') + '>' + td(2, 606, inner, h, Object.assign({l:1, r:1}, o)) + '</tr>';
    // linha com dois campos, um em cada coluna
    const two = (a, b, h, o)=>'<tr>' + td(1, 285, a, h, Object.assign({l:1}, o)) + td(1, 321, b, h, Object.assign({r:1}, o)) + '</tr>';
    const html =
      '<table style="border-collapse:collapse;table-layout:fixed;width:606px;margin:41px 0 0 4px"><tbody>' +
        two('<b>Encaminhamento:</b>' + SP, '<b>CRAS/CRISTIANA VICENTE NUNES</b>', 40, {t:1}) +
        full(L('Assunto:') + SP, 56) +
        full(L('Nome do adolescente/criança:') + SP, 36) +
        two(L('Data de nascimento:') + SP, L('Idade:') + SP, 32) +
        two(L('CPF:') + SP, L('NIS:') + SP, 32) +
        full(L('Responsável Familiar:') + SP, 32) +
        two(L('CPF:') + SP, L('Contato:') + SP, 32) +
        full(L('Endereço:') + SP, 32) +
        full(L('Bairro:') + SP, 32) +
        full('<p style="margin:0"><b>Relato:</b></p><p style="margin:0;text-indent:1.25cm;line-height:1.5;text-align:justify"><br></p>', 270, null, 1) +
        full('<p style="margin:0 0 0 270px;font-weight:normal">Boa Vista – RR, {{DATA}}</p>', 36) +
        full('&nbsp;', 40) +
        full('<p style="margin:14px 0 0 300px;width:282px;padding-top:3px;border-top:1px solid #000;text-align:center;font-weight:bold;line-height:1.5">Técnico de Referência</p>', 70, {b:1}) +
      '</tbody></table>' +
      '<div class="pb" contenteditable="false"></div>' +
      '<p style="' + F + 'font-weight:bold;text-align:center;line-height:1.5;margin:0">ANEXO</p>' +
      '<p style="' + F + 'line-height:1.5;margin:8px 0 0;text-align:justify;text-indent:1.25cm"><br></p>';
    return {
      title:'Encaminhamento', kind:'encaminhamento', html, abnt:false,
      sty:{f:'Times New Roman', hc:'', sp:'padrao'},
      mar:{t:176, r:104, b:101.3, l:75.5},
      hf:{h:'', f:'', ha:'left', fa:'left', dif:false, imgs:[
        {id:'tplh', src:TPL_HDR, x:0, y:0, w:794, h:156, z:'back', op:0},
        {id:'tplf', src:TPL_ENC_FTR, x:0, y:870, w:794, h:253, z:'back', op:0}]}
    };
  }
  
  function tplDesligamento(){
    // Baseado no Desligamento_Conviver.docx do CRAS (SCFV): Times New Roman 12, espaçamento 1,5, quadros de CRAS/Projeto, dados do integrante e motivo, assinatura, procedimentos, página 2 com o parecer do técnico. Cabeçalho e rodapé em imagem. Medidas em px (96 por polegada).
    const F = 'font-family:\'Times New Roman\',Times,serif;font-size:12pt;color:#000;';
    const hd = t=>'<p style="' + F + 'font-weight:bold;line-height:1.5;margin:21px 0 8px 9px;text-align:left;break-after:avoid">' + t + '</p>';
    const c = (w, t, o)=>{ o = o || {}; return '<td' + (o.span ? ' colspan="' + o.span + '"' : '') + ' style="' + F + 'width:' + w + 'px;height:' + (o.h || 30) + 'px;border:1px solid #000;padding:0 7px;vertical-align:' + (o.va || 'top') + ';line-height:1.5;text-align:left">' + (/<b>/.test(t) ? t : tplBold(t)) + '</td>'; };
    const L = t=>'<b>' + t + '</b>&nbsp;';
    const tab = (cols, rows)=>'<table data-sec="1" style="border-collapse:collapse;table-layout:fixed;width:595px;margin:0 0 0 9px"><colgroup>' + cols.map(w=>'<col style="width:' + w + 'px">').join('') + '</colgroup><tbody>' + rows.map(r=>'<tr>' + r.join('') + '</tr>').join('') + '</tbody></table>';
    const CK = '(&nbsp;&nbsp;)&nbsp;';
    const p = (t, extra)=>'<p style="' + F + 'line-height:1.5;margin:0;text-align:left;' + (extra || '') + '">' + t + '</p>';
    const html =
      p('<b><u>TERMO DE DESLIGAMENTO</u></b>', 'text-align:center;margin-top:20px') +
      '<p style="' + F + 'font-weight:bold;line-height:1.5;margin:31px 0 8px 9px;text-align:left;break-after:avoid">SERVIÇO DE CONVIVÊNCIA E FORTALECIMENTO DE VÍNCULOS – SCFV</p>' +
      tab([332, 263], [[c(332, L('CRAS:')), c(263, L('Local:'))], [c(332, L('Projeto:'), {h:38}), c(263, CK + 'Bolsista&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + CK + 'Não bolsista', {h:38})]]) +
      hd('DADOS DO INTEGRANTE:') +
      tab([187, 187, 221], [
        [c(374, L('Nome:'), {span:2}), c(221, L('CPF:'))],
        [c(187, L('DN:')), c(187, L('Faixa etária:')), c(221, L('Turno:'))],
        [c(374, L('Nacionalidade:'), {span:2}), c(221, L('Tel.:'))],
        [c(595, L('Endereço:'), {span:3, h:36})]]) +
      hd('MOTIVO DO DESLIGAMENTO:') +
      tab([281, 314], [
        [c(281, CK + 'Faltas injustificadas'), c(314, CK + 'Mudança de município/estado/país')],
        [c(281, CK + 'Não possui interesse em participar'), c(314, CK + 'A pedido do integrante ou responsável')],
        [c(281, CK + 'Inclusão em outro projeto'), c(314, CK + 'Fora das faixas etárias atendidas pelo município')],
        [c(281, CK + 'Óbito'), c(314, CK + 'Outros')]]) +
      p('<br>') + p('<br>') +
      p(tplBold('Assinatura do(a) responsável ou integrante'), 'width:340px;margin:0 0 0 132px;padding-top:3px;border-top:1px solid #000;text-align:center;break-after:avoid') +
      p('<br>') +
      p('<b>Procedimentos realizados:</b>&nbsp;', 'margin-left:9px;break-after:avoid') +
      p(CK + tplBold('Visita domiciliar'), 'margin-left:9px;break-after:avoid') +
      p(CK + tplBold('Contato telefônico'), 'margin-left:9px') +
      '<div class="pb" contenteditable="false"></div>' +
      '<p style="' + F + 'font-weight:bold;line-height:1.5;margin:0 0 8px 9px;text-align:left;break-after:avoid">PARECER DO TÉCNICO DE REFERÊNCIA:</p>' +
      '<table data-flow="1" style="border-collapse:collapse;table-layout:fixed;width:595px;margin:0 0 0 9px"><tbody><tr><td style="' + F + 'width:595px;height:178px;border:1px solid #000;padding:3px 7px;vertical-align:top;line-height:1.5;text-align:justify"><p style="margin:0;text-indent:1.25cm;line-height:1.5"><br></p></td></tr></tbody></table>' +
      p('Boa Vista – RR, {{DATA}}', 'margin-top:60px;text-align:right;break-after:avoid') +
      p('<br>') + p('<br>') +
      '<p style="' + F + 'font-weight:bold;line-height:1.5;width:326px;margin:0 0 0 278px;padding-top:3px;border-top:1px solid #000;text-align:right;break-after:avoid">Técnico de Referência</p>' +
      '<p style="' + F + 'font-weight:bold;line-height:1.5;width:326px;margin:0 0 0 278px;text-align:right">Psicólogo</p>';
    return {
      title:'Termo de Desligamento', kind:'desligamento', html, abnt:false,
      sty:{f:'Times New Roman', hc:'', sp:'padrao'},
      mar:{t:176, r:66, b:101.3, l:122.7},
      hf:{h:'', f:'', ha:'left', fa:'left', dif:false, imgs:[
        {id:'tplh', src:TPL_HDR, x:0, y:0, w:794, h:156, z:'back', op:0},
        {id:'tplf', src:TPL_DES_FTR, x:0, y:870, w:794, h:253, z:'back', op:0}]}
    };
  }
  
  function tplDeclaracaoEntrega(){
    // Baseado na Declaração Cesta - CRAS Eventual (PDF): duas vias iguais na mesma folha A4, separadas por linha tracejada de corte. Cabeçalho (logo + Prefeitura/SEMADS/CRAS) dentro de cada via; campos em linhas para preencher. Times New Roman 12. Medidas em px (96 por polegada).
    const F = 'font-family:\'Times New Roman\',Times,serif;font-size:12pt;color:#000;';
    const W = 683;
    const td = (w, inner, o)=>{ o = o || {}; return '<td style="' + F + 'width:' + w + 'px;height:' + (o.h || 24) + 'px;padding:0 ' + (o.pad == null ? 3 : o.pad) + 'px;vertical-align:bottom;line-height:1.5;text-align:' + (o.a || 'left') + ';border:0' + (o.bb ? ';border-bottom:1px solid #000' : '') + (o.bt ? ';border-top:1px solid #000' : '') + '">' + inner + '</td>'; };
    const lb = (w, t)=>td(w, t);            // rótulo
    const bl = w=>td(w, '<br>', {bb:1});    // campo para preencher (linha embaixo)
    const row = cells=>{ const cols = cells.map(c=>c.w); return '<table style="border-collapse:collapse;table-layout:fixed;width:' + W + 'px;margin:0"><colgroup>' + cols.map(w=>'<col style="width:' + w + 'px">').join('') + '</colgroup><tbody><tr>' + cells.map(c=>c.h).join('') + '</tr></tbody></table>'; };
    const L = (w, t)=>({w, h:lb(w, t)}), B = w=>({w, h:bl(w)}), LB = (w, t)=>({w, h:lb(w, tplBold(t))});   // L = texto comum; LB = rótulo em negrito
    const HA = 'font-family:Arial,Helvetica,sans-serif;color:#000;';
    const cab = '<table style="border-collapse:collapse;table-layout:fixed;width:' + W + 'px;margin:0;border-bottom:1px solid #000"><colgroup><col style="width:603px"><col style="width:80px"></colgroup><tbody><tr>' +
      '<td style="' + HA + 'padding:2px 0 6px 3px;border:0;vertical-align:middle;text-align:left;line-height:1.55;font-size:9.5pt;font-weight:bold">Prefeitura Municipal de Boa Vista<br>Secretaria Municipal de Assistência e Desenvolvimento Social (SEMADS)<br>Centro de Referência de Assistência Social (CRAS - Cristiana Vicente Nunes)</td>' +
      '<td style="height:76px;padding:0 0 4px 0;border:0;vertical-align:middle;text-align:right"><img src="' + TPL_DEC_LOGO + '" width="66" height="63" alt="Prefeitura de Boa Vista"></td></tr></tbody></table>';
    const via = cab +
      '<p style="' + F + 'font-weight:bold;font-size:12pt;text-align:center;line-height:1.5;margin:8px 0 6px">Declaração de Entrega</p>' +
      row([LB(30, 'Eu,'), B(653)]) +
      row([LB(95, 'Estado civil:'), B(165), LB(105, 'Natural de:'), B(318)]) +
      row([LB(150, 'Data de nascimento:'), B(55), L(14, '/'), B(45), L(14, '/'), B(60), LB(60, 'Idade:'), B(55), LB(230, 'Sexo: Masc. (&nbsp;&nbsp;&nbsp;)&nbsp;&nbsp;&nbsp;Fem. (&nbsp;&nbsp;&nbsp;)')]) +
      row([LB(62, 'CPF nº:'), B(160), LB(70, 'RG nº:'), B(165), LB(70, 'SSP/UF:'), B(156)]) +
      row([LB(110, 'Nacionalidade:'), B(272), LB(85, 'Telefone:'), B(216)]) +
      row([LB(78, 'Endereço:'), B(427), LB(40, 'Nº:'), B(138)]) +
      row([LB(60, 'Bairro:'), B(623)]) +
      '<p style="' + F + 'line-height:1.5;margin:8px 0 0"></p>' +
      row([L(335, 'Declaro que RECEBI COMO BENEFICIÁRIO(A)'), B(50), L(298, 'Cesta(s) de Complementação Alimentar,')]) +
      '<p style="' + F + 'font-size:12pt;line-height:1.5;margin:6px 0 0 3px;text-align:left">repassada(s) pela Equipe do CRAS – Cristiana Vicente Nunes.</p>' +
      '<p style="' + F + 'line-height:1.5;margin:10px 0 0"></p>' +
      row([L(122, 'Boa&nbsp;Vista&nbsp;–&nbsp;RR,'), B(40), L(30, 'de'), B(175), L(30, 'de'), B(85), L(201, '.')]) +
      '<p style="' + F + 'line-height:1.5;margin:18px 0 0"><br></p>' +
      '<table style="border-collapse:collapse;table-layout:fixed;width:' + W + 'px;margin:0"><colgroup><col style="width:22px"><col style="width:280px"><col style="width:80px"><col style="width:280px"><col style="width:21px"></colgroup><tbody><tr>' +
        td(22, '', {}) + td(280, tplBold('Responsável pelo Recebimento'), {a:'center', bt:1, h:26}).replace('vertical-align:bottom', 'vertical-align:top') + td(80, '', {}) + td(280, tplBold('Responsável pela Entrega'), {a:'center', bt:1, h:26}).replace('vertical-align:bottom', 'vertical-align:top') + td(21, '', {}) +
      '</tr></tbody></table>';
    const corte = '<p style="' + F + 'line-height:1.5;margin:34px 0 14px;border-top:1px dashed #000;font-size:12pt;height:0;overflow:visible"><span style="position:relative;top:-12px;left:0;background:#fff;padding-right:4px">✂</span></p>';
    const html = via + corte + via;
    return {
      title:'Declaração de Entrega de Cesta', kind:'declaracao', html, abnt:false,
      sty:{f:'Times New Roman', hc:'', sp:'padrao'},
      mar:{t:20, r:56, b:20, l:55},
      hf:{h:'', f:'', ha:'left', fa:'left', dif:false, imgs:[]}
    };
  }
  function tplEstudoCaso(){
    // Baseado no Estudo_de_Caso.docx do CRAS (SMAS): Times New Roman 12, espaçamento 1,5, seis quadros, assinatura e página de ANEXO. Cabeçalho em imagem (igual ao do Relatório Informativo); rodapé igual ao do Relatório Informativo. Medidas em px (96 por polegada).
    const F = 'font-family:\'Times New Roman\',Times,serif;font-size:12pt;color:#000;';
    const W = 649;   // largura útil: 794 − 79 − 66
    const hd = t=>'<p style="' + F + 'font-weight:bold;line-height:1.5;margin:24px 0 6px;text-align:left;break-after:avoid">' + t + '</p>';
    const par = '<p style="margin:0;text-indent:1.25cm;line-height:1.5;text-align:justify"><br></p>';
    const box = (h, inner)=>'<table data-flow="1" style="border-collapse:collapse;table-layout:fixed;width:' + W + 'px;margin:0"><tbody><tr><td style="' + F + 'width:' + W + 'px;height:' + h + 'px;border:1px solid #000;padding:3px 7px;vertical-align:top;line-height:1.5;text-align:justify">' + (inner || par) + '</td></tr></tbody></table>';
    const c = (w, inner, span)=>'<td' + (span ? ' colspan="' + span + '"' : '') + ' style="' + F + 'width:' + w + 'px;height:32px;border:1px solid #000;padding:0 7px;vertical-align:middle;line-height:1.5;text-align:left"><b>' + inner + '</b>&nbsp;</td>';
    // Composição Familiar em grade (Nome / Parentesco / Idade / Ocupação ou renda): Tab passa de célula em célula e a última Tab cria nova linha
    const famW = [265, 130, 64, 190];
    const famC = (w, t, head)=>'<td style="' + F + 'width:' + w + 'px;height:' + (head ? 28 : 26) + 'px;border:1px solid #000;padding:0 7px;vertical-align:middle;line-height:1.5;text-align:' + (head ? 'center;font-weight:bold;background-color:#f2f2f2' : 'left') + '">' + (t || '<br>') + '</td>';
    const fam = '<table data-sec="1" style="border-collapse:collapse;table-layout:fixed;width:' + W + 'px;margin:0"><colgroup>' + famW.map(w=>'<col style="width:' + w + 'px">').join('') + '</colgroup><tbody>' +
      '<tr>' + ['Nome', 'Parentesco', 'Idade', 'Ocupação / Renda'].map((t, i)=>famC(famW[i], t, true)).join('') + '</tr>' +
      ('<tr>' + famW.map(w=>famC(w, '', false)).join('') + '</tr>').repeat(2) + '</tbody></table>';
    const html =
      '<p style="' + F + 'font-weight:bold;text-decoration:underline;text-align:center;line-height:1.5;margin:20px 0 0">ESTUDO DE CASO</p>' +
      hd('01. IDENTIFICAÇÃO:') +
      '<table data-sec="1" style="border-collapse:collapse;table-layout:fixed;width:' + W + 'px;margin:0"><colgroup><col style="width:428px"><col style="width:221px"></colgroup><tbody>' +
        '<tr>' + c(W, 'NOME:', 2) + '</tr>' +
        '<tr>' + c(428, 'DATA DE NASCIMENTO:') + c(221, 'IDADE:') + '</tr>' +
        '<tr>' + c(W, 'ENDEREÇO:', 2) + '</tr>' +
        '<tr>' + c(W, 'CONTATO:', 2) + '</tr></tbody></table>' +
      hd('02. DEMANDA:') + box(50) +
      hd('03. SITUAÇÃO PROBLEMA:') + box(64) +
      hd('04. COMPOSIÇÃO FAMILIAR:') + fam +
      hd('05. PARECER TÉCNICO:') + box(62, '<p style="margin:0;line-height:1.5;text-align:left"><b>Concluo que:</b>&nbsp;</p>' + par) +
      hd('06. PROVIDÊNCIAS:') + box(49, '<ul style="margin:0;padding-left:40px;line-height:1.5;text-align:left"><li>Visita domiciliar;</li><li>Elaboração de estudo de caso.</li></ul>') +
      '<p style="' + F + 'font-weight:bold;line-height:1.5;margin:31px 0 0;text-align:left;break-after:avoid">Informações adicionais:&nbsp;</p>' +
      ('<p style="' + F + 'line-height:1.5;margin:0;text-align:justify;text-indent:1.25cm"><br></p>').repeat(3) +
      '<p style="' + F + 'line-height:1.5;margin:31px 0 0;text-align:right;break-after:avoid">Boa Vista – RR, {{DATA}}</p>' +
      ('<p style="' + F + 'line-height:1.5;margin:0;break-after:avoid"><br></p>').repeat(3) +
      '<p style="' + F + 'font-weight:bold;line-height:1.5;width:326px;margin:0 0 0 323px;padding-top:3px;border-top:1px solid #000;text-align:right;break-after:avoid">Técnico de Referência</p>' +
      '<p style="' + F + 'font-weight:bold;line-height:1.5;width:326px;margin:0 0 0 323px;text-align:right">Psicólogo</p>' +
      '<div class="pb" contenteditable="false"></div>' +
      '<p style="' + F + 'font-weight:bold;text-align:center;line-height:1.5;margin:0">ANEXO</p>' +
      '<p style="' + F + 'line-height:1.5;margin:8px 0 0;text-align:justify;text-indent:1.25cm"><br></p>';
    return {
      title:'Estudo de Caso', kind:'estudo', html, abnt:false,
      sty:{f:'Times New Roman', hc:'', sp:'padrao'},
      mar:{t:176, r:66, b:101.3, l:79},
      hf:{h:'', f:'', ha:'left', fa:'left', dif:false, imgs:[
        {id:'tplh', src:TPL_HDR, x:0, y:0, w:794, h:156, z:'back', op:0},
        {id:'tplf', src:TPL_FTR, x:0, y:870, w:794, h:253, z:'back', op:0}]}
    };
  }
  
  function tplFichaConviver(){
    // Baseado na Ficha_de_Inscrição_Conviver.pdf do CRAS Cristiana Vicente Nunes: Times New Roman 12, três páginas (integrante / escolares / saúde / responsável familiar; depois dados do RF, endereço e dados socioassistenciais), data, assinaturas. Cabeçalho e rodapé em imagem. Medidas em px (96 por polegada).
    const F = 'font-family:\'Times New Roman\',Times,serif;font-size:12pt;color:#000;';
    const CK = '(&nbsp;&nbsp;&nbsp;)';
    const BR = '<br>';
    const cell = (cw, o)=>{
      o = o || {};
      const span = o.span > 1 ? ' colspan="' + o.span + '"' : '', rs = o.rs > 1 ? ' rowspan="' + o.rs + '"' : '';
      return '<td' + span + rs + ' style="' + F + 'height:' + (o.h || 23) + 'px;border:1px solid #000;padding:0 6px;vertical-align:middle;line-height:1.5;text-align:' + (o.c ? 'center' : 'left') + (o.bg ? ';background-color:' + o.bg + ';font-weight:bold' : '') + '">' + (o.bg || o.t === BR || /<b>/.test(o.t) ? o.t : tplBold(o.t)) + '</td>';
    };
    // tabela em grade: cols = larguras (soma 672 px); rows = linhas de [span, html, opções]
    const tab = (cols, rows)=>'<table style="border-collapse:collapse;table-layout:fixed;width:672px;margin:0"><colgroup>' + cols.map(w=>'<col style="width:' + w + 'px">').join('') + '</colgroup><tbody>' +
      rows.map(r=>'<tr>' + r.map(c=>cell(0, Object.assign({span:c[0], t:c[1]}, c[2] || {}))).join('') + '</tr>').join('') + '</tbody></table>';
    const H = (n, t)=>[n, t, {bg:'#a6a6a6'}];
    const gap = '<p style="' + F + 'margin:0;line-height:24px;height:24px"><br></p>';
    const L = (n, t)=>[n, t + '&nbsp;'];       // rótulo com espaço depois: o que for digitado sai logo após
    const E = n=>[n, BR];                      // campo em branco

    // título + quadro da foto (sem bordas, exceto a foto)
    const topo = '<table style="border-collapse:collapse;table-layout:fixed;width:672px;margin:0"><colgroup><col style="width:554px"><col style="width:118px"></colgroup><tbody><tr>' +
      '<td style="' + F + 'height:98px;border:0;padding:0;vertical-align:middle;text-align:center;line-height:1.5;font-size:12pt"><b>FICHA DE INSCRIÇÃO</b><br><b>CONVIVER</b></td>' +
      '<td style="' + F + 'height:98px;border:1px solid #000;padding:0;vertical-align:middle;text-align:center">FOTO</td>' +
      '</tr></tbody></table>';

    const integrante = tab([128, 93, 114, 89, 248], [
      [H(5, 'IDENTIFICAÇÃO DO INTEGRANTE')],
      [[1, 'Nome'], E(4)],
      [L(3, 'Data de Nascimento:'), L(2, 'Idade:')],
      [[1, 'Filiação', {rs:2, c:1}], E(4)],
      [E(4)],
      [[1, 'RG integrante'], E(3), L(1, 'Órgão Expedidor:')],
      [[1, 'CPF integrante'], E(4)],
      [L(2, 'Sexo: M ' + CK + ' F ' + CK), L(3, 'Gênero:')],
      [[2, 'Tem alguma deficiência'], [3, CK + ' não ' + CK + ' sim; se sim, qual?&nbsp;']],
      [[2, 'Você se considera'], [3, CK + ' preta ' + CK + ' branca ' + CK + ' parda ' + CK + ' indígena']]
    ]);
    const escolares = tab([108, 258, 181, 125], [
      [H(4, 'DADOS ESCOLARES')],
      [[1, 'Escola'], E(3)],
      [L(2, 'Série:'), L(2, 'Turno:')],
      [L(3, 'Logradouro:'), L(1, 'Nº:')],
      [L(4, 'Bairro:')],
      [L(4, 'E-mail:')],
      [L(4, 'Contato telefônico:')]
    ]);
    const saude = tab([210, 60, 100, 302], [
      [H(4, 'DADOS DE SAÚDE')],
      [[2, 'Cartão de Vacina atualizado'], [2, CK + ' Sim &nbsp;' + CK + ' Não']],
      [[3, 'Restrição Alimentar: ' + CK + ' Não ' + CK + ' Sim'], L(1, 'Se sim, qual?')],
      [[3, 'Alergia a algum medicamento: ' + CK + ' Não ' + CK + ' Sim'], L(1, 'Se sim, qual?')],
      [[3, 'Faz acompanhamento médico? ' + CK + ' Não ' + CK + ' Sim'], L(1, 'Se sim, motivo?')],
      [[4, 'Faz uso de medicação contínua ou controlada ' + CK + ' Não ' + CK + ' Sim']],
      [[4, 'Faz acompanhamento psiquiátrico ou psicológico ' + CK + ' Não ' + CK + ' Sim']],
      [[1, 'Tipo Sanguíneo'], E(3)]
    ]);
    const rf1 = tab([242, 137, 131, 162], [
      [H(4, 'IDENTIFICAÇÃO DO RESPONSÁVEL FAMILIAR:')],
      [L(4, 'Nome do RF:')],
      [L(1, 'Sexo: M ' + CK + ' F ' + CK), L(2, 'Data de Nascimento:'), L(1, 'Idade:')],
      [L(1, 'Estado Civil:'), L(1, 'RG:'), L(2, 'Órgão Expedidor:')],
      [L(4, 'CPF:')]
    ]);
    // página 2: continuação dos dados do responsável familiar
    const rf2 = tab([241, 152, 37, 242], [
      [L(1, 'Título de Eleitor:'), L(1, 'Zona:'), L(2, 'Telefone: (&nbsp;&nbsp;&nbsp;)')],
      [L(4, 'Seção:')],
      [L(1, 'Nacionalidade:'), L(3, 'Naturalidade:')],
      [L(4, 'Local onde trabalha:')],
      [L(3, 'Ocupação:'), L(1, 'Renda Mensal:')],
      [L(1, 'Estuda: ' + CK + ' Sim ' + CK + ' Não'), L(3, 'Escolaridade:')]
    ]);
    const endereco = tab([363, 161, 148], [
      [H(3, 'ENDEREÇO:')],
      [L(2, 'Logradouro:'), L(1, 'Nº:')],
      [L(1, 'Bairro:'), L(2, 'Complemento:')],
      [L(3, 'Ponto de Referência:')],
      [L(1, 'Contato:'), L(2, 'CEP:')]
    ]);
    const socioRows = ([
      [H(5, 'DADOS SOCIOASSISTENCIAIS:')],
      [[2, 'Cadastro Único atualizado'], [3, CK + ' sim ' + CK + ' não']],
      [[2, 'Benefícios sociais'], [3, CK + ' Bolsa Família ' + CK + ' BPC ' + CK + ' outros:&nbsp;']],
      [[2, 'Participa de Projetos Sociais'], [3, CK + ' sim ' + CK + ' não']],
      [[5, 'É acompanhado(a) pelo ' + CK + ' PAIF ' + CK + ' PAEFI ' + CK + ' CREAS ' + CK + ' Conselho Tutelar']],
      [[1, 'Composição Familiar', {rs:6, c:1}], E(4)], [E(4)], [E(4)], [E(4)], [E(4)], [E(4)],
      [[1, 'Provedores', {rs:2, c:1}], E(4)], [E(4)],
      [[1, 'Renda Total', {c:1}], E(2), [1, 'Renda Per Capita', {c:1}], L(1, 'R$')],
      [[1, 'Situação de Moradia', {c:1}], [4, CK + ' própria ' + CK + ' alugada ' + CK + ' cedida']],
      [[1, 'Cômodos', {c:1}], L(1, 'Nº:'), [3, CK + ' alvenaria ' + CK + ' madeira ' + CK + ' barro ' + CK + ' outros:&nbsp;']],
      [[1, 'Acesso', {c:1}], [4, CK + ' água canalizada ' + CK + ' energia elétrica ' + CK + ' rede de esgoto ' + CK + ' rua pavimentada']]
    ]);
    // Dados socioassistenciais em duas partes: até Composição Familiar e Provedores aproveita o espaço que sobra na página 2 (depois do Endereço); o resto vai para a página 3
    const socioCols = [144, 86, 59, 139, 244];
    const socioA = tab(socioCols, socioRows.slice(0, 13)), socioB = tab(socioCols, socioRows.slice(13));

    const html =
      topo + gap + integrante + gap + escolares + gap + saude +
      '<div class="pb" contenteditable="false"></div>' +
      rf1 + gap + rf2 + gap + endereco + gap + socioA +
      '<div class="pb" contenteditable="false"></div>' +
      socioB +
      ('<p style="' + F + 'margin:0;line-height:24px;height:24px"><br></p>').repeat(3) +
      '<p style="' + F + 'line-height:1.5;margin:0;text-align:right">Boa Vista – RR, {{DATA}}</p>' +
      ('<p style="' + F + 'margin:0;line-height:24px;height:24px"><br></p>').repeat(3) +
      '<table style="border-collapse:collapse;table-layout:fixed;width:672px;margin:0"><colgroup><col style="width:290px"><col style="width:92px"><col style="width:290px"></colgroup><tbody><tr>' +
        '<td style="' + F + 'height:30px;border:0;border-top:1px solid #000;padding:6px 0 0;vertical-align:top;text-align:center">' + tplBold('Assinatura do Responsável') + '</td>' +
        '<td style="' + F + 'border:0;padding:0">&nbsp;</td>' +
        '<td style="' + F + 'height:30px;border:0;border-top:1px solid #000;padding:6px 0 0;vertical-align:top;text-align:center">' + tplBold('Assinatura do Servidor Público') + '</td>' +
      '</tr></tbody></table>';
    return {
      title:'Ficha de Inscrição Conviver', kind:'ficha', html, abnt:false,
      sty:{f:'Times New Roman', hc:'', sp:'padrao'},
      mar:{t:138, r:38, b:100, l:58},
      hf:{h:'', f:'', ha:'left', fa:'left', dif:false, imgs:[
        {id:'tplh', src:TPL_HDR_FIC, x:0, y:0, w:794, h:134, z:'back', op:0},
        {id:'tplf', src:TPL_FIC_FTR, x:0, y:1021, w:794, h:86, z:'back', op:0}]}
    };
  }
  function newFromTemplate(t, name){
    save();
    const id = uid(), c = JSON.parse(JSON.stringify(t));
    ['modelo', 'cm', 'out', 'refs'].forEach(k=>{ delete c[k]; });
    c.free = !c.abnt; delete c.abnt;
    c.title = name || c.title || 'Documento sem título'; c.t = Date.now();
    c.html = (c.html || '').replace(/\{\{DATA\}\}/g, dataLongaBR());
    if(c.hf && c.hf.imgs) c.hf.imgs.forEach(i=>{ i.id = 'h' + Math.random().toString(36).slice(2, 8); });
    store.docs[id] = c; openDoc(id);
    persist(); page.focus();
  }
  function saveAsTemplate(){
    save(); const d = store.docs[store.current]; if(!d) return null;
    const nome = prompt('Nome do modelo:', (title.value || '').trim() || 'Meu modelo');
    if(!nome || !nome.trim()) return null;
    const c = JSON.parse(JSON.stringify(d));
    ['cm', 'out', 'refs'].forEach(k=>{ delete c[k]; });
    c.title = nome.trim(); c.modelo = true; c.abnt = page.classList.contains('abnt'); c.t = Date.now();
    // a linha "Boa Vista – RR, <data>" dos modelos do CRAS volta a ser {{DATA}}: o documento novo sai com a data de hoje, não com a de quando o modelo foi salvo
    if(c.html) c.html = c.html.replace(/(Boa Vista – RR,(?:\s|&nbsp;)*)\d{1,2}º? de [A-Za-zÀ-ÿ]+ de \d{4}/g, '$1{{DATA}}');
    store.docs[uid()] = c; persist(); return c.title;
  }
  function delDoc(id){
    const d = store.docs[id];
    if(!confirm('Excluir "' + (d.title || 'Sem título') + '"? Não dá para desfazer.')) return;
    delete store.docs[id];
    if(id === store.current){ const rest = Object.keys(store.docs).filter(i=>!store.docs[i].modelo); rest.length ? openDoc(rest[0]) : newDoc(); }
    else{ persist(); renderSide(); }
  }
  function renderSide(){
    const dl = $('docList'); dl.innerHTML = '';
    Object.entries(store.docs).filter(([id,d])=>!d.modelo).sort((a,b)=>b[1].t - a[1].t).forEach(([id,d])=>{
      const li = document.createElement('li'), b = document.createElement('button'), x = document.createElement('button');
      b.className = 'item' + (id === store.current ? ' on' : '');
      b.textContent = (id === store.current ? title.value : d.title) || 'Sem título';
      b.onclick = ()=>openDoc(id);
      x.textContent = '✕'; x.title = 'Excluir'; x.setAttribute('aria-label','Excluir documento'); x.onclick = ()=>delDoc(id);
      li.append(b, x); dl.appendChild(li);
    });
    const ol = $('outList'); ol.innerHTML = '';
    const lvl = h=>h.dataset.nivel !== undefined ? (parseInt(h.dataset.nivel, 10) || 0) : (/^H[1-3]$/.test(h.tagName) ? +h.tagName[1] : 0);
    const hs = [...page.querySelectorAll('h1,h2,h3,[data-nivel]')].filter(h=>lvl(h) > 0); $('outEmpty').hidden = hs.length > 0;
    hs.forEach(h=>{
      const li = document.createElement('li'), b = document.createElement('button');
      b.className = 'item'; b.style.paddingLeft = (8 + (lvl(h) - 1) * 14) + 'px';
      b.textContent = h.textContent.trim() || '(sem texto)';
      b.onclick = ()=>h.scrollIntoView({behavior:'smooth', block:'start'});
      li.appendChild(b); ol.appendChild(li);
    });
  }
  $('btnNew2').addEventListener('click', newDoc);
  function tab(docs){
    $('docsPanel').hidden = !docs; $('outPanel').hidden = docs;
    $('tabDocs').classList.toggle('on', docs); $('tabOut').classList.toggle('on', !docs);
  }
  $('tabDocs').addEventListener('click', ()=>tab(true));
  $('tabOut').addEventListener('click', ()=>{ tab(false); renderSide(); });
  $('btnSide').addEventListener('click', ()=>{ $('side').hidden = !$('side').hidden; if(!$('side').hidden) renderSide(); });
  $('side').hidden = true;

  // Lista de tarefas
  $('btnTask').addEventListener('click', ()=>{
    restore(); exec('insertHTML', '<ul class="tasks"><li><input type="checkbox" contenteditable="false">&nbsp;</li></ul>');
  });
  page.addEventListener('change', e=>{
    if(e.target.type === 'checkbox'){ e.target.toggleAttribute('checked', e.target.checked); changed(); }
  });
  page.addEventListener('keyup', e=>{
    if(e.key !== 'Enter') return;
    let n = getSelection().anchorNode;
    while(n && n !== page && n.nodeName !== 'LI') n = n.parentNode;
    if(n && n.nodeName === 'LI' && n.parentNode.classList.contains('tasks') && !n.querySelector('input')){
      const c = document.createElement('input'); c.type = 'checkbox'; c.contentEditable = 'false';
      n.insertBefore(c, n.firstChild); changed();
    }
  });

  // Colar limpo e imagens da área de transferência
  page.addEventListener('paste', e=>{
    const cd = e.clipboardData; if(!cd) return;
    const img = [...cd.files].find(f=>f.type.startsWith('image/'));
    if(img){
      e.preventDefault(); window.__insImgFile(img); return;
    }
    const h = cd.getData('text/html'); if(!h) return;
    e.preventDefault();      // colar sempre como texto sem formatação (para manter a formatação: botão Opções de Colagem ou Colar > Manter formatação de origem)
    exec('insertText', htmlToPlain(h, cd.getData('text/plain')));
  });
  function htmlToPlain(h, t){
    if(t) return t.replace(/\r/g, '');
    const d = new DOMParser().parseFromString(h, 'text/html');
    return (d.body.innerText || d.body.textContent || '').trim();
  }
  function cleanPasted(h){
    const doc = new DOMParser().parseFromString(h, 'text/html');
    doc.querySelectorAll('style,title').forEach(n=>n.remove());
    sanitizarHtml(doc.body);
    doc.body.querySelectorAll('*').forEach(n=>['class', 'id', 'style'].forEach(k=>n.removeAttribute(k)));
    return doc.body.innerHTML;
  }
