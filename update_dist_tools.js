const fs = require('fs');
const path = require('path');

// 1. Update page.tsx to fetch fetchSalesTools
const pagePath = 'src/app/dist-admin-portal/[distId]/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

if (!pageContent.includes('fetchSalesTools')) {
    pageContent = pageContent.replace(/import \{([\s\S]*?)fetchDistributorCommissionSummary/g, `import {\n$1fetchDistributorCommissionSummary, fetchSalesTools`);
    
    pageContent = pageContent.replace(/const \[profile, team, apps, capacity, commission\] = await Promise\.all\(\[/, `const [profile, team, apps, capacity, commission, tools] = await Promise.all([`);
    
    pageContent = pageContent.replace(/fetchDistributorCommissionSummary\(distId, '2026', '05'\)\n  \]\);/, `fetchDistributorCommissionSummary(distId, '2026', '05'),\n    fetchSalesTools()\n  ]);`);
    
    pageContent = pageContent.replace(/initialCommission=\{commission\}\n    \/>/g, `initialCommission={commission}\n      initialTools={tools || []}\n    />`);
    
    fs.writeFileSync(pagePath, pageContent);
    console.log('Updated page.tsx');
} else {
    console.log('page.tsx already updated');
}

// 2. Update DistAdminClient.tsx
const clientPath = 'src/app/dist-admin-portal/[distId]/DistAdminClient.tsx';
let clientContent = fs.readFileSync(clientPath, 'utf8');

// Add initialTools to props
if (!clientContent.includes('initialTools: any[]')) {
    clientContent = clientContent.replace(/initialCapacity: any, initialCommission: any\n\}\)/, `initialCapacity: any, initialCommission: any, initialTools: any[]\n})`);
    clientContent = clientContent.replace(/initialCapacity, initialCommission\n\}/, `initialCapacity, initialCommission, initialTools\n}`);
}

// Add activeToolPreview state
if (!clientContent.includes('const [activeToolPreview, setActiveToolPreview]')) {
    clientContent = clientContent.replace(/const \[activeTab, setActiveTab\] = useState/, `const [activeToolPreview, setActiveToolPreview] = useState<any>(null);\n  const [activeTab, setActiveTab] = useState`);
}

// Replace officialTools logic
clientContent = clientContent.replace(/const officialTools = useMemo\(\(\) => \[[\s\S]*?\], \[\]\);/, `const officialTools = initialTools;`);

// Replace renderTools mapping
// For Videos / Photos:
clientContent = clientContent.replace(/\{officialTools\.filter\(t => t\.type === 'video'\)\.map\(tool => \(/g, `{officialTools.filter(t => ['video', 'photo'].includes(t.type)).map(tool => (`);

clientContent = clientContent.replace(/<img src=\{tool\.thumbnail\}/g, `<img src={tool.thumbnail || tool.url || 'https://images.unsplash.com/photo-1528642463367-12544dd1479d?q=80&w=800&auto=format&fit=crop'}`);

clientContent = clientContent.replace(/<div className="group relative bg-white rounded-\[45px\] shadow-2xl border border-white overflow-hidden aspect-\[16\/10\] hover:shadow-blue-200 transition-all duration-700">/g, `<div className="group relative bg-white rounded-[45px] shadow-2xl border border-white overflow-hidden aspect-[16/10] hover:shadow-blue-200 transition-all duration-700 cursor-pointer" onClick={() => setActiveToolPreview(tool)}>`);

clientContent = clientContent.replace(/<span className="text-\[10px\] font-black text-white\/60 uppercase tracking-widest group-hover:text-white transition-colors">點擊播放官方宣導影片<\/span>/g, `<span className="text-[10px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">點擊檢閱資源</span>`);

// For Docs / Contracts:
clientContent = clientContent.replace(/\{officialTools\.filter\(t => t\.type === 'doc'\)\.map\(doc => \(/g, `{officialTools.filter(t => ['doc', 'contract'].includes(t.type)).map(doc => (`);

clientContent = clientContent.replace(/<div key=\{doc\.id\} className="bg-white\/60 backdrop-blur-xl p-8 rounded-\[40px\] border border-white shadow-xl flex flex-col items-center text-center space-y-4 hover:border-blue-500 transition-all duration-500 group cursor-pointer">/g, `<div key={doc.id} onClick={() => setActiveToolPreview(doc)} className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-xl flex flex-col items-center text-center space-y-4 hover:border-blue-500 transition-all duration-500 group cursor-pointer">`);

clientContent = clientContent.replace(/\{doc\.icon\}/g, `{doc.type === 'contract' ? '📑' : '📄'}`);


// Add modal to the end of renderTools
const modalRegex = /<\/section>\s*<\/div>\s*\);/;
if (!clientContent.includes('activeToolPreview && (')) {
    const modalCode = `</section>

       {/* --- TOOL PREVIEW MODAL --- */}
       {activeToolPreview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveToolPreview(null)}></div>
             <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                   <div>
                      <h3 className="font-black text-slate-900 text-lg">{activeToolPreview.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeToolPreview.category} • {activeToolPreview.type}</p>
                   </div>
                   <button onClick={() => setActiveToolPreview(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
                </div>
                <div className="p-8 overflow-y-auto bg-slate-50 flex-1 flex items-center justify-center flex-col gap-6">
                   {activeToolPreview.type === 'photo' ? (
                      <img src={activeToolPreview.url || activeToolPreview.thumbnail} className="max-w-full max-h-full rounded-2xl shadow-sm" />
                   ) : activeToolPreview.type === 'video' ? (
                      <video src={activeToolPreview.url || activeToolPreview.thumbnail} controls className="w-full aspect-video bg-black rounded-2xl shadow-lg" />
                   ) : (
                      <div className="text-center space-y-4">
                         <span className="text-6xl block">📄</span>
                         <p className="text-sm font-black text-slate-900">{activeToolPreview.title}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">文件已被安全保護，請點擊下方按鈕下載檢閱</p>
                      </div>
                   )}
                   
                   <button 
                      className="px-8 py-4 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-lg hover:bg-blue-700 transition-all mt-4" 
                      onClick={() => {
                        const fileUrl = activeToolPreview.url || activeToolPreview.thumbnail;
                        if (!fileUrl) {
                          alert('檔案連結無效，無法下載。');
                          return;
                        }
                        try {
                          if (fileUrl.startsWith('data:')) {
                            const arr = fileUrl.split(',');
                            const mime = arr[0].match(/:(.*?);/)[1];
                            const bstr = atob(arr[1]);
                            let n = bstr.length;
                            const u8arr = new Uint8Array(n);
                            while (n--) {
                              u8arr[n] = bstr.charCodeAt(n);
                            }
                            const blob = new Blob([u8arr], { type: mime });
                            const blobUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = activeToolPreview.title || 'download';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                          } else {
                            const a = document.createElement('a');
                            a.href = fileUrl;
                            a.download = activeToolPreview.title || 'download';
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }
                        } catch (err) {
                          alert('下載失敗，檔案可能已損壞或過大。');
                          console.error(err);
                        }
                      }}
                   >確認下載檔案 (Download)</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );`;
    clientContent = clientContent.replace(modalRegex, modalCode);
}

fs.writeFileSync(clientPath, clientContent);
console.log('Updated DistAdminClient.tsx');
