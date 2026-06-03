const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

const printTemplatesViewCode = `
// --- 🖨️ 列印版型設計視圖 (Print Templates Designer) ---
const PrintTemplatesView = ({ printTemplates, loadData }: any) => {
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleCreate = () => {
    setEditingTemplate({
      id: 'pt-' + Date.now(),
      name: '自訂新版型',
      templeName: '宮廟名稱',
      watermarkUrl: '',
      watermarkOpacity: 0.1,
      borderStyle: 'border: 8px double #fcd34d; padding: 20px;'
    });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    setIsSaving(true);
    await savePrintTemplate(editingTemplate);
    await loadData();
    setEditingTemplate(null);
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此版型嗎？')) {
      await deletePrintTemplate(id);
      await loadData();
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsAiGenerating(true);
    // Simulate AI generating a border style
    setTimeout(() => {
      let newBorder = 'border: 8px solid #fcd34d; padding: 20px;';
      if (aiPrompt.includes('蓮花') || aiPrompt.includes('復古')) {
        newBorder = 'border: 12px double #b91c1c; padding: 30px; border-radius: 15px; box-shadow: inset 0 0 10px rgba(185, 28, 28, 0.2);';
      } else if (aiPrompt.includes('現代') || aiPrompt.includes('極簡')) {
        newBorder = 'border: 2px solid #333; padding: 40px; border-radius: 0px;';
      }
      setEditingTemplate({ ...editingTemplate, borderStyle: newBorder });
      setIsAiGenerating(false);
    }, 1500);
  };

  return (
    <div className="p-8 pb-32">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">列印版型設計庫</h2>
          <p className="text-sm font-bold text-slate-500 mt-2">設計信眾表單下載與列印時的精美 A4 專屬背景與花邊。</p>
        </div>
        <button onClick={handleCreate} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg">
          ➕ 建立新版型
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {printTemplates.map((pt: any) => (
          <div key={pt.id} className="bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all group flex flex-col">
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-800 mb-1">{pt.name}</h3>
              <p className="text-xs font-bold text-slate-400 mb-4 truncate">標題: {pt.templeName}</p>
              
              {/* Mini Preview Box */}
              <div className="w-full aspect-[1/1.4] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 relative mb-4 flex flex-col" style={{ cssText: pt.borderStyle }}>
                {pt.watermarkUrl && (
                  <div className="absolute inset-0 bg-center bg-contain bg-no-repeat z-0" style={{ backgroundImage: \`url(\${pt.watermarkUrl})\`, opacity: pt.watermarkOpacity }}></div>
                )}
                <div className="relative z-10 text-center font-black" style={{ fontSize: '10px' }}>{pt.templeName}</div>
                <div className="relative z-10 w-full h-[2px] bg-black/20 my-2"></div>
                <div className="relative z-10 space-y-2">
                  <div className="h-1.5 bg-black/10 rounded w-3/4"></div>
                  <div className="h-1.5 bg-black/10 rounded w-1/2"></div>
                  <div className="h-1.5 bg-black/10 rounded w-5/6"></div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <button onClick={() => setEditingTemplate(pt)} className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">編輯</button>
              <button onClick={() => handleDelete(pt.id)} className="w-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {editingTemplate && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex overflow-hidden border-4 border-slate-900 animate-in zoom-in-95">
             {/* Left: Editor Settings */}
             <div className="w-1/2 h-full flex flex-col bg-white border-r-2 border-slate-100">
                <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50">
                   <div>
                     <h2 className="text-2xl font-black text-slate-800">設計版型</h2>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Template Editor</p>
                   </div>
                   <button onClick={() => setEditingTemplate(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-slate-500 hover:text-slate-800 shadow-sm">✕</button>
                </div>
                <div className="p-8 flex-1 overflow-y-auto space-y-6">
                   
                   <div className="space-y-4 bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-100">
                      <label className="text-xs font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">✨ AI 智能邊框設計助理</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="例如：復古中式蓮花邊框..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500" />
                        <button onClick={handleAiGenerate} disabled={isAiGenerating} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">
                          {isAiGenerating ? '生成中...' : 'AI 設計'}
                        </button>
                      </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">版型系統名稱</label>
                     <input type="text" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">宮廟列印抬頭 (Temple Header)</label>
                     <input type="text" value={editingTemplate.templeName} onChange={e => setEditingTemplate({...editingTemplate, templeName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white" />
                   </div>
                   
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">主神浮水印圖片網址 (Watermark URL)</label>
                     <input type="text" placeholder="請貼上圖片網址" value={editingTemplate.watermarkUrl} onChange={e => setEditingTemplate({...editingTemplate, watermarkUrl: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white" />
                     <p className="text-[10px] text-slate-400 font-bold">第一階段支援貼上圖片網址，或留空不使用背景。</p>
                   </div>
                   
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">浮水印透明度 (0.01 ~ 1.0) : {editingTemplate.watermarkOpacity}</label>
                     <input type="range" min="0.01" max="1" step="0.01" value={editingTemplate.watermarkOpacity} onChange={e => setEditingTemplate({...editingTemplate, watermarkOpacity: parseFloat(e.target.value)})} className="w-full accent-indigo-600" />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">邊框樣式 (CSS Style)</label>
                     <textarea rows={3} value={editingTemplate.borderStyle} onChange={e => setEditingTemplate({...editingTemplate, borderStyle: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white font-mono" />
                   </div>

                </div>
                <div className="p-6 border-t-2 border-slate-100 bg-slate-50">
                  <button onClick={handleSave} disabled={isSaving} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors disabled:opacity-50">
                     {isSaving ? '儲存中...' : '💾 儲存並套用版型'}
                  </button>
                </div>
             </div>

             {/* Right: Live A4 Preview */}
             <div className="w-1/2 h-full bg-slate-100 p-8 flex items-center justify-center overflow-auto">
               {/* Simulated A4 Paper */}
               <div className="w-[400px] h-[565px] bg-white shadow-2xl relative flex flex-col" style={{ cssText: editingTemplate.borderStyle }}>
                 {/* Watermark */}
                 {editingTemplate.watermarkUrl && (
                   <div className="absolute inset-0 bg-center bg-contain bg-no-repeat pointer-events-none z-0" style={{ backgroundImage: \`url(\${editingTemplate.watermarkUrl})\`, opacity: editingTemplate.watermarkOpacity }}></div>
                 )}
                 {/* Content */}
                 <div className="relative z-10 w-full h-full flex flex-col">
                    <h1 className="text-3xl font-black text-center mb-6" style={{ fontFamily: '"Microsoft JhengHei", sans-serif', borderBottom: '2px solid #000', paddingBottom: '15px' }}>{editingTemplate.templeName}</h1>
                    <div className="flex justify-between items-center mb-6 text-sm">
                      <span className="font-bold">服務：光明燈祈福</span>
                      <span>列印日期：2026/06/02</span>
                    </div>
                    <div className="space-y-4 flex-1 text-sm">
                      <div className="border-b border-dashed border-slate-300 pb-2"><strong>信眾姓名：</strong> 林某某</div>
                      <div className="border-b border-dashed border-slate-300 pb-2"><strong>出生日期：</strong> 1980/01/01</div>
                      <div className="border-b border-dashed border-slate-300 pb-2"><strong>聯絡電話：</strong> 0912345678</div>
                      <div className="border-b border-dashed border-slate-300 pb-2"><strong>祈福事項：</strong> 闔家平安，事業順利</div>
                    </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

const targetIdx = content.indexOf('const AdminDesktopView');
if (targetIdx !== -1) {
  content = content.substring(0, targetIdx) + printTemplatesViewCode + '\n' + content.substring(targetIdx);
  
  // Inject into AdminDesktopView
  const deskActiveTabIdx = content.indexOf(`{activeTab === 'services' && <div className="p-6 md:p-8 space-y-6 pb-32">`);
  if (deskActiveTabIdx !== -1) {
    const injectionStr = `       {activeTab === 'print-templates' && <PrintTemplatesView printTemplates={printTemplates} loadData={loadData} />}\n`;
    content = content.substring(0, deskActiveTabIdx) + injectionStr + content.substring(deskActiveTabIdx);
  }
}

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('PrintTemplatesView injected');
