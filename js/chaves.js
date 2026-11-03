/* Verbus — chaves de armazenamento do navegador (js/chaves.js).
   Este é o único lugar onde os nomes das chaves do localStorage são escritos: o resto do código usa LS_KEYS.<nome>.
   Para criar uma preferência nova, acrescente a chave aqui (e em LS_KEYS_DOCS se for conteúdo do usuário).
   Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa. */

// Todas as chaves usam o prefixo "verbus:".
const LS_KEYS = Object.freeze({
  // documentos e conteúdo do usuário
  docs: 'verbus:docs',               // reserva em localStorage (o normal é o IndexedDB)
  doc: 'verbus:doc',                 // formato antigo, de um só documento (só leitura)
  estilos: 'verbus:estilos',
  remetente: 'verbus:remetente',     // mala direta: remetente
  mala: 'verbus:mala',               // mala direta: lista no formato antigo (só leitura)
  mala2: 'verbus:mala2',             // mala direta: lista de destinatários
  mapa: 'verbus:mapa',
  maladef: 'verbus:maladef',
  malamodo: 'verbus:malamodo',
  dicUser: 'verbus:dicUser',         // palavras adicionadas ao dicionário
  fontesRecentes: 'verbus:fontes_recentes',
  assin: 'verbus:assin',             // Inserir: assinatura, autor e partes rápidas
  autor: 'verbus:autor',
  partes: 'verbus:partes',
  // preferências
  theme: 'verbus:theme',
  lang: 'verbus:lang',
  spell: 'verbus:spell',
  gram: 'verbus:gram',
  auto: 'verbus:auto',
  voicecmd: 'verbus:voicecmd',
  ruler: 'verbus:ruler',
  tab: 'verbus:tab',
  zoom: 'verbus:zoom',
  zoomMob: 'verbus:zoomMob',
  tblgrid: 'verbus:tblgrid',
  pgnumFmt: 'verbus:pgnum_fmt',
  symRec: 'verbus:sym-rec',
  formaCor: 'verbus:formaCor',
  // controle de "apagar ao fechar"
  limpasessao: 'verbus:limpasessao', // localStorage
  sessao: 'verbus:sessao'            // sessionStorage
});

// O que "Apagar ao fechar" remove (conteúdo e dados pessoais). Preferências de tela (tema, zoom…) ficam.
const LS_KEYS_DOCS = Object.freeze(['docs', 'doc', 'estilos', 'remetente', 'mala', 'mala2', 'mapa', 'maladef', 'malamodo', 'dicUser', 'fontesRecentes', 'assin', 'autor', 'partes'].map(k=>LS_KEYS[k]));

// Nomes antigos (versões anteriores usavam "verba:", "verbus_", "verbus-", "verbus." e "meu-word:").
const LS_LEGADO = /^(verba:|verbus[_.-]|meu-word:)/;

// Nomes dos bancos IndexedDB. Mantidos como eram para não perder os documentos já salvos.
const IDB_DOCS = 'verba';
const IDB_ARQUIVOS = 'verbus-arquivos';

// Migração única: copia o valor da chave antiga para "verbus:<nome>" (se a nova ainda não existir) e apaga a antiga.
(function migrarChaves(){
  try{
    const antigas = [];
    for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k && LS_LEGADO.test(k)) antigas.push(k); }
    antigas.sort((x, y)=>(x.indexOf('meu-word:') === 0) - (y.indexOf('meu-word:') === 0));   // "meu-word:" por último: não sobrepõe o que já está nos nomes mais novos
    antigas.forEach(k=>{
      const nova = k.replace(/^(verba:|verbus[_.-]|meu-word:)/, 'verbus:');
      if(nova === 'verbus:abnt'){ localStorage.removeItem(k); return; }   // chave que nunca foi lida
      if(localStorage.getItem(nova) === null) localStorage.setItem(nova, localStorage.getItem(k));
      localStorage.removeItem(k);
    });
  }catch(e){}
})();
