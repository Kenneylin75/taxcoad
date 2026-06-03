const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/audit/page.tsx', 'utf8');

// 1. Add States
const stateTarget = `const [filterLevel, setFilterLevel] = useState<string>('ALL');`;
const newStates = `const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const handleExportLogs = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        let csv = '時間,層級,執行者,操作動作,目標\\n';
        filteredLogs.forEach(l => {
          csv += \`\${l.timestamp},\${l.level},\${l.operator},\${l.action},\${l.target}\\n\`;
        });
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', \`系統日誌_\${new Date().toISOString().split('T')[0]}.csv\`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error(e);
        alert('匯出失敗');
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };
`;
if (!content.includes('handleExportLogs')) {
  content = content.replace(stateTarget, newStates);
}

// 2. Update Export Button
const btnTarget = `<button className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2">
                匯出報表 💾
              </button>`;
const newBtn = `<button 
                onClick={handleExportLogs}
                disabled={isExporting}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isExporting ? '匯出中...' : '匯出報表 💾'}
              </button>`;
if (content.includes(btnTarget)) {
  content = content.replace(btnTarget, newBtn);
} else {
    // try fallback regex
    const fallbackRegex = /<button[^>]*>\s*匯出報表 💾\s*<\/button>/g;
    content = content.replace(fallbackRegex, newBtn);
}

// 3. Update Log Action Buttons
// Original: <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-100">👁️</button>
// Original: <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-100">📋</button>
const eyeTarget = `<button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-100">👁️</button>`;
const newEye = `<button onClick={() => setSelectedLog(log)} title="檢視詳細資料" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-100">👁️</button>`;

const clipTarget = `<button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-100">📋</button>`;
const newClip = `<button onClick={() => { navigator.clipboard.writeText(JSON.stringify(log, null, 2)); alert('日誌資料已複製到剪貼簿！'); }} title="複製資料" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-100">📋</button>`;

content = content.replace(new RegExp(eyeTarget.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newEye);
content = content.replace(new RegExp(clipTarget.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newClip);

// 4. Inject Modal
const modalTarget = `    </div>
  );
}`;
const newModal = `      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <span className="text-xl">📜</span> 日誌詳細資料
                 </h3>
                 <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
              </div>
              <div className="p-6 overflow-y-auto">
                 <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">操作時間</span>
                      <p className="font-medium text-slate-800">{selectedLog.timestamp}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系統層級</span>
                      <p className="mt-1"><span className={\`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest \${
                            selectedLog.level === 'ERROR' ? 'bg-red-50 text-red-600 border border-red-100' :
                            selectedLog.level === 'WARN' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            selectedLog.level === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            'bg-slate-100 text-slate-500 border border-slate-200'
                          }\`}>{selectedLog.level}</span></p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">執行者</span>
                      <p className="font-medium text-slate-800">{selectedLog.operator}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">操作動作</span>
                      <p className="font-bold text-slate-900">{selectedLog.action}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目標物件</span>
                      <p className="font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 text-sm mt-1">{selectedLog.target}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raw Data</span>
                      <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto mt-1 shadow-inner font-mono">{JSON.stringify(selectedLog, null, 2)}</pre>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}`;
if (!content.includes('selectedLog &&')) {
  content = content.replace(modalTarget, newModal);
}

fs.writeFileSync('src/app/[templeId]/admin/audit/page.tsx', content, 'utf8');
console.log('Successfully injected audit log functionality.');
