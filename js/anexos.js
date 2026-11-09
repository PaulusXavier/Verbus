/* Verbus — Anexar PDF e imagens (JPG, PNG…) ao documento
   (js/anexos.js). Os arquivos de js/ formam um só programa e compartilham o escopo global; a ordem de <script> em index.html importa.
   PDF: cada página vira uma imagem (JPEG) que cabe na área do texto, uma por folha. O pdf.js (vendor/) só é carregado na primeira vez. */
(function(){
  const MAXPAG = 40, isPdf = f=>f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '');
  const isImg = f=>/^image\//.test(f.type) || /\.(jpe?g|png|gif|webp|bmp)$/i.test(f.name || '');
  let libP = null;
  function loadPdfjs(){
    if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return libP || (libP = new Promise((ok, no)=>{
      const s = document.createElement('script'); s.src = 'vendor/pdf.min.js';
      s.onload = ()=>{ try{ window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js'; ok(window.pdfjsLib); }catch(e){ libP = null; no(e); } };
      s.onerror = ()=>{ libP = null; no(new Error('pdfjs')); };
      document.head.appendChild(s);
    }));
  }
  const esc = s=>String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  async function pdfHtml(file){
    const lib = await loadPdfjs(), buf = await file.arrayBuffer();
    const doc = await lib.getDocument({data:buf}).promise;
    let n = doc.numPages;
    if(n > MAXPAG){
      if(!confirm('O PDF "' + file.name + '" tem ' + n + ' páginas. Anexar só as ' + MAXPAG + ' primeiras? (cada página vira uma imagem dentro do documento)')) { doc.destroy(); return ''; }
      n = MAXPAG;
    }
    const e = effMar(), pg = pgOf(), W = Math.max(CMPX, pg.w * CMPX - e.l - e.r), H = Math.max(CMPX, pg.h * CMPX - e.t - e.b) - 70;   // sobra espaço para um título (ex.: ANEXO) acima da 1ª página
    const out = [];
    for(let i = 1; i <= n; i++){
      const p = await doc.getPage(i), v1 = p.getViewport({scale:1}), k = Math.min(2.5, 1600 / v1.width, 4000 / v1.height), v = p.getViewport({scale:k});   // limita largura e altura do canvas (páginas muito grandes ou compridas)
      const cv = document.createElement('canvas'); cv.width = Math.round(v.width); cv.height = Math.round(v.height);
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      await p.render({canvasContext:cx, viewport:v}).promise;
      const r = v1.height / v1.width; let nw = Math.min(W, v1.width * 96 / 72), nh = nw * r; if(nh > H){ nh = H; nw = nh / r; }
      out.push('<div class="pdfx"><img alt="' + esc(file.name) + ' — página ' + i + '" src="' + cv.toDataURL('image/jpeg', 0.85) + '" style="width:' + Math.round(nw) + 'px;height:auto"></div>');
      cv.width = cv.height = 0; p.cleanup();
    }
    doc.destroy();
    return out.join('<div class="pb" contenteditable="false"></div>');
  }
  // PDF (divs e quebras de página) não pode ficar dentro de célula de tabela, lista ou caixa: o ponto de inserção vai para um parágrafo novo depois do bloco
  function saiDeBloco(){
    const s = getSelection(); if(!s.rangeCount || !page.contains(s.anchorNode)) return;
    const n = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode, host = n.closest('td,th,li,.tbx,#fnotes,.fnotes,.endnotes');
    if(!host || !page.contains(host)) return;
    let top = host; while(top.parentNode && top.parentNode !== page) top = top.parentNode;
    if(top.parentNode !== page) return;
    const p = document.createElement('p'); p.appendChild(document.createElement('br')); top.after(p);
    const r = document.createRange(); r.setStart(p, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
  }
  let ocupado = false;
  window.__anexar = async function(files){
    if(ocupado){ alert('Ainda estou anexando o arquivo anterior. Aguarde terminar.'); return; }
    if(!page.isContentEditable) return;   // modo de leitura / documento travado
    files = [...files]; const bad = files.filter(f=>!isPdf(f) && !isImg(f));
    if(bad.length) alert('Só é possível anexar PDF e imagens (JPG, PNG…). Ignorado: ' + bad.map(f=>f.name).join(', '));
    document.body.style.cursor = 'progress'; ocupado = true;
    try{
      for(const f of files){
        if(isPdf(f)){
          let h = ''; try{ h = await pdfHtml(f); }catch(err){ alert('Não foi possível ler o PDF "' + f.name + '". Ele pode estar protegido por senha ou danificado.'); continue; }
          if(!h) continue;
          restore(); saiDeBloco(); exec('insertHTML', h + '<p><br></p>'); changed();
        }else if(isImg(f)) await window.__insImgAsync(f);
      }
    }finally{ document.body.style.cursor = ''; ocupado = false; }
  };
  // arrastar arquivos do computador para a folha (sem isto o navegador abre o arquivo e sai do documento)
  const has = e=>e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  page.addEventListener('dragover', e=>{ if(has(e)){ e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  page.addEventListener('drop', e=>{
    if(!has(e)) return; e.preventDefault();
    if(!page.isContentEditable) return;
    const fs = [...e.dataTransfer.files].filter(f=>isPdf(f) || isImg(f)); if(!fs.length) return;
    try{
      const r = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
      if(r && page.contains(r.startContainer)){ const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    }catch(err){}
    window.__anexar(fs);
  });
})();
