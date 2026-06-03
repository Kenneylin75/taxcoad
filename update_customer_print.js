const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/customers/page.tsx', 'utf8');

// 1. Add fetchPrintTemplates to imports
const oldImports = `  fetchServiceDefinitions,
  setFilePrivacy,`;
const newImports = `  fetchServiceDefinitions,
  fetchPrintTemplates,
  setFilePrivacy,`;
content = content.replace(oldImports, newImports);

// 2. Add printTemplates state and update init load
const oldInit = `  const [serviceDefs, setServiceDefs] = useState<ServiceDefinition[]>([]);`;
const newInit = `  const [serviceDefs, setServiceDefs] = useState<ServiceDefinition[]>([]);
  const [printTemplates, setPrintTemplates] = useState<any[]>([]);`;
content = content.replace(oldInit, newInit);

const oldLoad = `  const initLoad = async () => {
    setIsLoading(true);
    try {
      const [g, f, sd] = await Promise.all([fetchGuests(), fetchForms(), fetchServiceDefinitions()]);
      setGuests(Array.isArray(g) ? g : []);
      setAllForms(Array.isArray(f) ? f : []);
      setServiceDefs(Array.isArray(sd) ? sd : []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };`;
const newLoad = `  const initLoad = async () => {
    setIsLoading(true);
    try {
      const [g, f, sd, pt] = await Promise.all([fetchGuests(), fetchForms(), fetchServiceDefinitions(), fetchPrintTemplates()]);
      setGuests(Array.isArray(g) ? g : []);
      setAllForms(Array.isArray(f) ? f : []);
      setServiceDefs(Array.isArray(sd) ? sd : []);
      setPrintTemplates(Array.isArray(pt) ? pt : []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };`;
content = content.replace(oldLoad, newLoad);

// 3. Create helper function before viewingRecord render, or directly in the buttons. Let's just inline it in the buttons, or replace the PDF string.
const oldBtnContainer = `                   <button onClick={() => {
                     const pdfWindow = window.open('', '', 'width=800,height=600');`;
                     
const getHtmlLogic = `
                     // 尋找綁定的版型
                     const srv = serviceDefs.find(s => s.name === viewingRecord.serviceType);
                     let template = printTemplates.find(pt => pt.id === srv?.linkedPrintTemplateId);
                     
                     // 預設版型樣式
                     let wrapperCss = 'margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;';
                     let containerCss = template?.borderStyle || 'padding: 40px; background: white;';
                     let templeHeader = template?.templeName || viewingRecord.serviceType;
                     let watermarkHtml = template?.watermarkUrl ? \\\`<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('\${template.watermarkUrl}'); background-size: contain; background-position: center; background-repeat: no-repeat; opacity: \${template.watermarkOpacity}; pointer-events: none; z-index: -1;"></div>\\\` : '';

                     const content = Object.entries(viewingRecord.values || {}).map(([k, v]) => \\\`<div style="\${wrapperCss}"><strong>\${k}</strong><p style="margin-top: 5px;">\${v}</p></div>\\\`).join('');
                     
                     const htmlString = \\\`
                       <html>
                         <head>
                           <title>\${viewingRecord.serviceType} - 列印</title>
                           <style>
                             body { font-family: 'Microsoft JhengHei', sans-serif; color: #333; margin: 0; padding: 20px; background: #f8fafc; } 
                             .page-container { position: relative; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; \${containerCss} }
                             h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; font-size: 28px; }
                           </style>
                           <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                         </head>
                         <body>
                           <div id="pdf-content" class="page-container">
                             \${watermarkHtml}
                             <h1>\${templeHeader}</h1>
                             <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 20px;">
                               <span>服務項目: \${viewingRecord.serviceType}</span>
                               <span>列印日期: \${new Date().toLocaleDateString()}</span>
                             </div>
                             <div style="position: relative; z-index: 10;">\${content}</div>
                           </div>
                           \${SCRIPT_PLACEHOLDER}
                         </body>
                       </html>
                     \\\`;`;

// For the PDF button:
const oldPdfBtn = `                   <button onClick={() => {
                     const pdfWindow = window.open('', '', 'width=800,height=600');
                     if (!pdfWindow) {
                       alert('請允許彈出視窗以啟用 PDF 下載功能');
                       return;
                     }
                     const content = Object.entries(viewingRecord.values || {}).map(([k, v]) => \`<div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;"><strong>\${k}</strong><p style="margin-top: 5px;">\${v}</p></div>\`).join('');
                     pdfWindow.document.write(\`
                       <html>
                         <head>
                           <title>\${viewingRecord.serviceType} - 下載 PDF</title>
                           <style>body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; color: #333; } h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }</style>
                           <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                         </head>
                         <body>
                           <div id="pdf-content">
                             <h1>\${viewingRecord.serviceType}</h1>
                             <p>列印日期: \${new Date().toLocaleDateString()}</p>
                             <div style="margin-top: 30px;">\${content}</div>
                           </div>
                           <script>
                             window.onload = function() {
                               const element = document.getElementById('pdf-content');
                               html2pdf().set({
                                 margin: 15,
                                 filename: '\${viewingRecord.serviceType}_表單紀錄.pdf',
                                 image: { type: 'jpeg', quality: 0.98 },
                                 html2canvas: { scale: 2 },
                                 jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                               }).from(element).save().then(() => {
                                 setTimeout(() => window.close(), 1500);
                               });
                             };
                           </script>
                         </body>
                       </html>
                     \`);
                     pdfWindow.document.close();
                   }} className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-100 transition-all flex items-center gap-2">⬇️ 下載表單</button>`;

const newPdfBtn = `                   <button onClick={() => {
                     const pdfWindow = window.open('', '', 'width=800,height=600');
                     if (!pdfWindow) { alert('請允許彈出視窗以啟用 PDF 下載功能'); return; }
                     ${getHtmlLogic.replace('${SCRIPT_PLACEHOLDER}', `
                           <script>
                             window.onload = function() {
                               const element = document.getElementById('pdf-content');
                               html2pdf().set({
                                 margin: 10,
                                 filename: \\\`\${viewingRecord.serviceType}_表單紀錄.pdf\\\`,
                                 image: { type: 'jpeg', quality: 0.98 },
                                 html2canvas: { scale: 2, useCORS: true },
                                 jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                               }).from(element).save().then(() => {
                                 setTimeout(() => window.close(), 1500);
                               });
                             };
                           </script>
                     `)}
                     pdfWindow.document.write(htmlString);
                     pdfWindow.document.close();
                   }} className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-100 transition-all flex items-center gap-2">⬇️ 下載表單</button>`;
content = content.replace(oldPdfBtn, newPdfBtn);

// For the Print button
const oldPrintBtn = `                   <button onClick={() => {
                     const printWindow = window.open('', '', 'width=800,height=600');
                     if (!printWindow) return;
                     const content = Object.entries(viewingRecord.values || {}).map(([k, v]) => \`<div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;"><strong>\${k}</strong><p style="margin-top: 5px;">\${v}</p></div>\`).join('');
                     printWindow.document.write(\`
                       <html>
                         <head>
                           <title>\${viewingRecord.serviceType} - 列印</title>
                           <style>body { font-family: sans-serif; padding: 40px; color: #333; } h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }</style>
                         </head>
                         <body>
                           <h1>\${viewingRecord.serviceType}</h1>
                           <p>列印日期: \${new Date().toLocaleDateString()}</p>
                           <div style="margin-top: 30px;">\${content}</div>
                           <script>window.print(); setTimeout(() => window.close(), 500);</script>
                         </body>
                       </html>
                     \`);
                     printWindow.document.close();
                   }} className="bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-200 transition-all flex items-center gap-2">🖨️ 列印表單</button>`;

const newPrintBtn = `                   <button onClick={() => {
                     const printWindow = window.open('', '', 'width=800,height=600');
                     if (!printWindow) return;
                     ${getHtmlLogic.replace('${SCRIPT_PLACEHOLDER}', `
                           <script>window.print(); setTimeout(() => window.close(), 500);</script>
                     `)}
                     printWindow.document.write(htmlString);
                     printWindow.document.close();
                   }} className="bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-200 transition-all flex items-center gap-2">🖨️ 列印表單</button>`;

content = content.replace(oldPrintBtn, newPrintBtn);

fs.writeFileSync('src/app/[templeId]/admin/customers/page.tsx', content, 'utf8');
console.log('Customer print logic updated');
