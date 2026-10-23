# Verbus

> **⚠ Uso pessoal.** Este projeto é feito **somente para o uso particular do autor**. Não é um produto, não é oferecido ao público e não há suporte nem garantia. O código está visível apenas porque o repositório é usado para publicar o app no GitHub Pages; ver o arquivo [LICENSE](LICENSE).

Editor de texto de uso pessoal que roda no navegador (HTML, CSS e JavaScript puros, sem instalar nada).

## Recursos
- **Interface clássica com faixa de opções**: barra de título azul com acesso rápido, guias, faixa de opções com ícones e grupos (Área de Transferência, Fonte, Parágrafo, Estilo, Edição), régua, folha em 110% e barra de status com "Página x de y", palavras, idioma e zoom (botões − / + e controle deslizante). A seta ^ no canto da faixa (ou Ctrl+F1) recolhe a faixa; o painel de documentos fica em Exibir > Painel de Navegação. O padrão ABNT continua em Design > ABNT
- **Imagens**: Inserir > Imagem cabe sozinha na área do texto; depois, na barra Imagem, escolha a disposição (alinhada, quadrado à esquerda/direita, acima e abaixo, atrás ou na frente do texto), alinhe, mude largura/altura, transparência, "Preencher a página" e arraste pelo botão azul. **Imagem no cabeçalho/rodapé** (a margem cresce se precisar) e **Design > Imagem de fundo** repetem em todas as páginas na impressão/PDF e no .docx
- **Página Inicial — itens que faltavam**: Painel da Área de Transferência (iniciador ↘ do grupo; guarda até 24 trechos copiados/recortados, clique para colar, Colar tudo, Limpar tudo); seta ao lado de Localizar com Localização Avançada e **Ir para** (Ctrl+G: página, título, nota de rodapé, tabela ou imagem); tamanho da fonte agora aceita qualquer valor digitado (ex.: 13,5); menu de espaçamento com Opções de espaçamento de linha… e adicionar/remover espaço antes/depois do parágrafo
- **Página Inicial — mais itens**: paleta de cores nos botões Cor da Fonte, Realce e Sombreamento (Automático/Sem cor, cores do tema em tons, cores padrão, recentes e Mais cores…); atalhos: Ctrl+] e Ctrl+[ (fonte ±1 pt), Ctrl+Shift+A (maiúsculas), Shift+F3 (alternar caixa), Ctrl+Espaço (limpar formatação), Ctrl+= e Ctrl+Shift+= (subscrito/sobrescrito), Ctrl+M e Ctrl+Shift+M (recuo), Ctrl+1/2/5 (espaçamento simples/duplo/1,5), Ctrl+Shift+L (marcadores), Ctrl+Shift+N (Normal), Ctrl+Alt+1 e Ctrl+Alt+2 (Título 1 e 2), Ctrl+Shift+C (pincel). Corrigido: mudar o tamanho da fonte não apaga mais a cor do texto
- **Página Inicial — estilos e fonte**: na galeria de Estilos (seta ▾ Mais) agora há **Limpar Formatação** (tira fonte, cor, estilo e formatação do parágrafo) e **Criar um Estilo…** (salva a formatação do parágrafo atual com um nome; aparece na galeria com ★, fica salvo no navegador e o botão direito exclui); na caixa Fonte, **Definir como padrão** usa a fonte escolhida em todo o documento
- **Página Inicial — rodada 4**: **minibarra de ferramentas** que aparece sobre o texto selecionado (negrito, itálico, sublinhado, alinhar, marcadores, numeração, fonte maior/menor, pincel); Localizar com **Palavra inteira**, **Realçar tudo** (todas as ocorrências ficam em amarelo), contador "1 de 4" e total ao substituir tudo; **Definir Novo Marcador…** (escolha qualquer símbolo) no menu de marcadores
- **Impressão revisada**: o número de página no canto superior só sai no padrão ABNT (documentos comuns saem sem número; use Inserir > Cabeçalho/Rodapé para numerar); o fundo cinza da tela, o realce amarelo do Localizar, a minibarra, painéis e o cursor não saem mais no papel/PDF; testado em tema claro e escuro (sempre papel branco com texto escuro)
- **Bordas** (Página Inicial > Parágrafo > Bordas): inferior, superior, esquerda, direita (clicar de novo remove), todas, externas, **internas**, **horizontal interna**, **vertical interna**, **diagonal para baixo/para cima** (em células e parágrafos), **Linha horizontal** e a caixa **Bordas e Sombreamento…** (configuração Nenhuma/Caixa/Todas, estilo, cor, largura de ¼ a 6 pt, lados na visualização, internas, diagonais e cor de preenchimento). Em vários parágrafos ou células as bordas externas contornam o conjunto. As diagonais aparecem na tela, na impressão/PDF e no .html; o .docx/.doc pode ignorá-las
- **Numeração** (Página Inicial > Parágrafo > seta da Numeração): **Definir Novo Formato de Número…** (tipo 1, 01, a, A, i, I, texto antes e depois do número, ex.: "Art. I -", com pré-visualização), **Definir Valor de Numeração…** (iniciar uma nova lista em qualquer número ou continuar a lista anterior; o item e os seguintes viram uma nova lista) e **Alterar Nível da Lista…** (níveis 1 a 9; também com Tab e Shift+Tab). Nos arquivos .doc/.docx exportados o formato personalizado cai no tipo padrão (1, a, A, i, I)
- **Parágrafo e Fonte mais completos**: na caixa Parágrafo, *Controle de linhas órfãs/viúvas*, *Não hifenizar* e *Não adicionar espaço entre parágrafos do mesmo estilo*; na caixa Fonte, *Posição* (elevada/rebaixada em pt), *Kerning* e *Oculto* (o texto oculto só aparece com ¶ ligado e não sai na impressão). **Listas de vários níveis**: seta ao lado do botão de vários níveis com a biblioteca (1 / 1.1 / 1.1.1, Art. 1. / § 1º / I – / a), I. / A. / 1. / a., 1) / a) / i), 1. / a. / i., ● / ○ / ■ e remover). Também: espaçamento 3,0, sublinhado Grosso, *Colar como hiperlink* e *Selecionar objetos* (imagens e tabelas). Estes recursos aparecem na tela e no PDF; os formatos .doc/.docx podem ignorar partes deles
- Galeria de **Estilos** (Normal, Sem Espaçamento, Título 1 e 2, Título, Subtítulo, Ênfase Sutil/Ênfase/Ênfase Intensa, Forte, Citação, Citação Intensa, Referência Sutil/Intensa); os de parágrafo valem para os parágrafos selecionados e os de caractere para o texto selecionado (ou a palavra do cursor). Grupo **Edição** com Localizar, Substituir e Selecionar; caixa **Buscar um comando…** (Alt+Q) que acha e executa qualquer comando da faixa; botão **Compartilhar** ao lado
- Caixa **Parágrafo** (canto do grupo): alinhamento, **nível do tópico** (1 a 9, aparece no Painel de Navegação), recuos com **recuos espelho** (dentro/fora), espaçamento entre linhas Simples, 1,5, Duplo, **Pelo menos**, **Exatamente** (em pt) e Múltiplo, **Quebra de linha** e **Posição da quebra**, além das opções de quebra de página. No .docx/.doc, "Pelo menos", "Exatamente" e o nível de tópico vão como instruções de compatibilidade. Os recuos espelho ficam marcados e valem como página ímpar (o Verbus não separa páginas pares e ímpares)
- Layout > Configurar Página: margens (padrão, estreita, moderada, larga, ABNT ou personalizadas em cm), orientação retrato/paisagem, papel (A4, Carta, Ofício, A5, A3) e 1 a 3 colunas; vale para cada documento, aparece na tela, na régua, na impressão/PDF e nas exportações .doc/.docx (as colunas no .doc dependem do editor interpretar o arquivo)
- Faixa de opções com guias: **Arquivo**, Página Inicial, Inserir, Design, Layout, Referências, Correspondências, Revisão, Exibir e Desenvolvedor (setas ← → trocam de guia; o app lembra a última guia aberta). Barra de acesso rápido no topo: Salvar, Desfazer e Refazer. As guias Correspondências e Desenvolvedor ainda estão vazias, para criar depois
- Menu **Arquivo** (botão azul no topo): Informações (nome, páginas, palavras, margens, última alteração), Novo (em branco ou ABNT), Abrir (computador ou salvos no navegador), Salvar, Salvar como (.docx, .doc, .html, .txt), Imprimir, Compartilhar (e-mail, compartilhar do aparelho, copiar texto), Exportar (PDF), Fechar, Conta (tema e armazenamento) e Opções (revisão, ABNT, régua, painel, zoom). Esc volta ao documento; Ctrl+O abre a lista de documentos; Ctrl+Shift+S abre Salvar como
- Área de Transferência: Colar (mantém imagens e HTML limpo), Colar texto, Recortar, Copiar e Pincel de Formatação (clique duplo = aplica várias vezes; Esc cancela)
- **Página Inicial completa**: iniciadores ↘ nos grupos Fonte e Parágrafo abrem as caixas de diálogo **Fonte** (fonte, tamanho, cor, sublinhado com estilo, tachado e tachado duplo, sobrescrito/subscrito, versalete, maiúsculas, espaçamento entre caracteres, com pré-visualização; Ctrl+D) e **Parágrafo** (alinhamento, recuos, primeira linha/deslocamento, espaço antes/depois, linha, manter com o próximo, quebra de página antes). Seta ao lado do S escolhe o estilo do sublinhado (simples, duplo, pontilhado, tracejado, ondulado). Menu Aa ganhou "Primeira letra da frase em maiúscula" e "aLTERNAR". Grupo **Voz** com Ditar e Editor. Lista de fontes ampliada (aparecem só se instaladas no aparelho)
- **Colar Especial** (seta abaixo de Colar): manter formatação de origem, mesclar formatação (tira cores, fontes e tamanhos, mantém negrito, listas e tabelas) ou manter somente texto. **Alterar Estilos** (ao lado da galeria): conjuntos Padrão, Clássico, Moderno e Elegante, ou escolha a fonte do documento, a cor dos títulos e o espaçamento (padrão, compacto, relaxado); fica salvo em cada documento e vale na impressão/PDF e no .doc/.docx (no padrão ABNT a fonte e o espaçamento continuam fixos). O iniciador ↘ do grupo Estilo abre o **Painel de Estilos** (lista completa)
- Aumentar/Diminuir fonte (botões A▲ A▼ ou Ctrl+Shift+> / <) e Efeitos de texto (sombra, contorno, brilho, relevo)
- Parágrafo: estilos de marcador e de numeração, lista de vários níveis (1, 1.1, 1.1.1, com Tab/Shift+Tab), classificar A→Z, marcas de parágrafo (¶), sombreamento e bordas
- Negrito, itálico, sublinhado, tachado, cores e destaque
- Títulos, fontes, tamanhos, alinhamento (esquerda, centro, direita, justificado: Ctrl+L, Ctrl+E, Ctrl+R, Ctrl+J), listas e recuos
- Layout da tabela: mesclar e dividir células, sombrear célula, alinhar o texto na célula, bordas (todas, grossas, externas, pontilhadas, nenhuma), linha de cabeçalho que se repete ao imprimir, distribuir colunas e espaço interno
- Notas de rodapé: botão Nota (ou Ctrl+Alt+F) insere o número sobrescrito e cria a nota; numeração automática, reordena ao inserir/apagar, clique no número para ir e voltar; as notas ficam reunidas no fim do documento (fonte 10, espaço simples)
- Contagem detalhada (botão Contar ou clique em "palavras" na barra de baixo): páginas, palavras, caracteres com/sem espaços, parágrafos, tempos de leitura e de fala, com coluna da seleção e opção de incluir notas de rodapé
- Revisão: escolha do idioma e liga/desliga da marcação de erros do navegador; verificação própria de palavras repetidas, espaços duplos, espaço antes/depois da pontuação e acentos esquecidos (não, você, também, ...ção/...ções), com Ir/Corrigir/Ignorar/Corrigir todos
- Sinônimos (Shift+F7): lista de sinônimos em português para a palavra selecionada; baixa a base (5 MB, jsDelivr) só na primeira vez
- Links, imagens (clique duplo para redimensionar), tabelas (adicionar/excluir linhas e colunas)
- Localizar e substituir (Ctrl+F / Ctrl+H)
- Espaçamento entre linhas e espaço antes/depois do parágrafo, sobrescrito/subscrito, maiúsculas/minúsculas
- Quebra de página, código, data, símbolos
- Ler em voz alta, zoom, tema claro/escuro, tempo de leitura
- Folha A4 (21 × 29,7 cm) com as margens padrão (2,5 cm em cima/embaixo e 3 cm nas laterais), fundo cinza e borda fina
- Réguas padrão (horizontal e vertical, em cm; faixa fina, margens em cinza, números girados na vertical): marcadores de recuo da primeira linha, deslocamento, recuo à esquerda e recuo à direita, com linha-guia ao arrastar
- Margens ajustáveis arrastando a borda cinza/branca das réguas (valem para impressão, .doc e .docx); Alt desativa o encaixe; duplo clique restaura
- Cabeçalho e rodapé: clique duas vezes na margem superior ou inferior (ou use o botão Cabeçalho/Rodapé); campos de número da página e total de páginas, alinhamento, primeira página diferente; saem na impressão/PDF, no .doc e no .docx
- Atualiza sozinho: ao publicar uma versão nova, o app recarrega sozinho (service worker)
- Ícone do app (letra V sobre um manuscrito, com lápis) em SVG e PNG; o app pode ser instalado no celular/computador
- Salva sozinho no navegador (IndexedDB, um registro por documento e imagens em repositório próprio; sem o limite de ~5 MB do localStorage; documentos antigos são migrados automaticamente)
- Exporta como .doc, .html, .txt ou PDF (Imprimir). Ctrl+S salva em .doc
- Abre arquivos .html, .doc e .txt

- Vários documentos salvos no navegador, painel de estrutura (títulos), lista de tarefas
- Tamanho da fonte em pontos, ditado por voz, colar texto limpo e imagens (Ctrl+V)
- Baixa e abre .docx (usa bibliotecas da internet; o resto funciona offline)

## Padrão ABNT
- Botão **ABNT**: A4, margens 3/2/2/3 cm, Times 12, espaçamento 1,5, recuo de 1,25 cm, texto justificado
- Títulos numerados (1, 1.1, 1.1.1) e título sem número (RESUMO, REFERÊNCIAS)
- Capa, folha de rosto, resumo, sumário e legendas de figura, tabela e quadro
- Citação longa (recuo de 4 cm, fonte 10, espaço simples)
- Referências (NBR 6023) e citações (NBR 10520): cadastre livros, artigos, sites e TCCs
- Numeração de páginas no canto superior direito ao imprimir em PDF

## Como usar
Abra o `index.html` no navegador.

## Publicar no GitHub Pages
Settings > Pages > Branch: main / (root) > Save.

## Uso pessoal e licença
Todos os direitos reservados ao autor. Ninguém está autorizado a copiar, modificar, redistribuir, revender ou usar o Verbus comercialmente sem permissão por escrito. Veja [LICENSE](LICENSE).

## Privacidade
Os documentos ficam só no navegador de quem usa (IndexedDB/localStorage). Não há servidor, cadastro nem rastreamento. Ao abrir ou baixar .docx e ao usar Sinônimos, o navegador baixa bibliotecas/dados do jsDelivr (CDN pública), que enxerga o endereço IP.

## Bibliotecas de terceiros
Carregadas da CDN jsDelivr, cada uma sob sua própria licença: [mammoth](https://github.com/mwilliamson/mammoth.js), [JSZip](https://github.com/Stuk/jszip), [html-docx-js](https://github.com/evidenceprime/html-docx-js) e [sinonimos-local](https://www.npmjs.com/package/sinonimos-local). Verifique as licenças delas antes de qualquer uso além do pessoal.

## Aviso de independência
O Verbus é um projeto independente e **não tem qualquer ligação, patrocínio ou aprovação da Microsoft Corporation**. Ele foi escrito do zero (código, ícones e textos próprios) e não usa código, imagens ou arquivos de nenhum produto da Microsoft.

"Microsoft", "Word", "Office" e "Segoe UI" são marcas ou fontes de seus respectivos titulares e são citadas apenas para indicar compatibilidade com o formato de arquivo .docx. O Verbus não é o Microsoft Word e não se apresenta como tal. As fontes Calibri e Segoe UI só aparecem se já estiverem instaladas no aparelho de quem usa; o Verbus não as distribui.

O mesmo aviso aparece dentro do app, em Arquivo > Sobre.

O app pede ao buscador que não o indexe (noindex) e não deve ser divulgado nem anunciado como "igual ao Word".

Este aviso é informativo e não é aconselhamento jurídico.
