const fs = require('fs');
const files = [
  'src/app/super-sales/[salesId]/page.tsx',
  'src/app/distributor/DistributorClient.tsx',
  'src/app/dist-sales-portal/[distId]/[salesId]/page.tsx'
];

const unifiedRenderTools = `  const renderTools = () => (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
       <div className="px-2 space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">資源與工具中心</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Support & Assets</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool: any, idx: number) => (
             <div key={idx} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all cursor-pointer">
                <div className="aspect-video relative bg-slate-100 overflow-hidden">
                   <img src={tool.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 opacity-80" />
                   <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <span className="text-4xl">
                         {tool.type === 'video' ? '▶️' : tool.type === 'photo' ? '🖼️' : tool.type === 'document' ? '📄' : '📝'}
                      </span>
                   </div>
                   <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                      {tool.type === 'video' ? '影片' : tool.type === 'photo' ? '照片' : tool.type === 'document' ? '文件' : '電子合約'}
                   </div>
                </div>
                <div className="p-8 space-y-3">
                   <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">{tool.category} • {tool.uploadedAt || '2026/05/19'}</p>
                   <h5 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{tool.title}</h5>
                   <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase">HQ SYNCED</span>
                      <button className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all">開啟檢視</button>
                   </div>
                </div>
             </div>
          ))}
          {tools.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                <span className="text-4xl mb-4 block opacity-50">📭</span>
                <p className="text-sm font-black text-slate-400">總部目前尚未發布任何資源</p>
             </div>
          )}
       </div>
    </div>
  );`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    const code = fs.readFileSync(file, 'utf8');
    const startIdx = code.indexOf('const renderTools = ()');
    if (startIdx > -1) {
      let nextSectionIdx = code.indexOf('const renderProfile = ()', startIdx + 20);
      if (nextSectionIdx === -1) nextSectionIdx = code.indexOf('const renderDashboard = ()', startIdx + 20);
      if (nextSectionIdx === -1) nextSectionIdx = code.indexOf('const renderTeam = ()', startIdx + 20);
      if (nextSectionIdx === -1) nextSectionIdx = code.indexOf('return (', startIdx + 20);
      
      if (nextSectionIdx > -1) {
         const newCode = code.substring(0, startIdx) + unifiedRenderTools + '\n\n  ' + code.substring(nextSectionIdx);
         fs.writeFileSync(file, newCode);
         console.log('Updated', file);
      } else {
         console.log('Could not find end of renderTools in', file);
      }
    } else {
      console.log('Could not find renderTools in', file);
    }
  }
});
