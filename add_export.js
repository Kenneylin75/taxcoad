const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', 'utf8');

const hookTarget = `const [isSaving, setIsSaving] = useState(false);`;
const hookInjection = `const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        // Construct CSV Content
        let csv = '報表類型,項目,數值\\n';
        
        // Overview
        csv += \`營運概況,總信眾人數,\${data.overview.totalGuests}\\n\`;
        csv += \`營運概況,本月預約數,\${data.overview.totalAppointments}\\n\`;
        csv += \`營運概況,點燈安座數,\${data.overview.totalLamps}\\n\`;
        csv += \`營運概況,本月總收入,\${data.overview.totalIncome}\\n\`;
        
        // Gender Ratio
        data.genderRatio.forEach((g: any) => {
          csv += \`性別分佈,\${g.label},\${g.val}%\\n\`;
        });
        
        // Age Groups
        data.ageGroups.forEach((a: any) => {
          csv += \`年齡分佈,\${a.range},\${a.val}%\\n\`;
        });
        
        // Services
        data.serviceHeat.forEach((s: any) => {
          csv += \`熱門服務,\${s.label},\${s.val}%\\n\`;
        });

        // Add BOM for Excel UTF-8 compatibility
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', \`宮廟數據分析報表_\${new Date().toISOString().split('T')[0]}.csv\`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error("Export failed", e);
        alert('報表匯出失敗');
      } finally {
        setIsExporting(false);
      }
    }, 800); // simulate slight delay for UX
  };
`;
if (!content.includes('handleExport')) {
  content = content.replace(hookTarget, hookInjection);
}

const buttonTarget = `<button className="px-4 py-1.5 rounded-lg text-[10px] font-black text-slate-400 hover:text-slate-600">報表匯出</button>`;
const newButton = `<button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-1.5 rounded-lg text-[10px] font-black text-slate-400 hover:text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {isExporting ? '匯出中...' : '📥 報表匯出 (CSV)'}
          </button>`;
if (content.includes(buttonTarget)) {
  content = content.replace(buttonTarget, newButton);
} else {
  // Try finding it with partial match just in case
  const backupRegex = /<button[^>]*>報表匯出<\/button>/g;
  content = content.replace(backupRegex, newButton);
}

fs.writeFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', content, 'utf8');
console.log('Successfully injected export logic.');
