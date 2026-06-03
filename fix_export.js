const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', 'utf8');

const hookTarget = `const [isPending, startTransition] = useTransition();`;
const hookInjection = `const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        // Construct CSV Content
        let csv = '報表類型,項目,數值\\n';
        
        // Overview
        if (data?.overview) {
          csv += \`營運概況,總信眾人數,\${data.overview.totalGuests || 0}\\n\`;
          csv += \`營運概況,本月預約數,\${data.overview.totalAppointments || 0}\\n\`;
          csv += \`營運概況,點燈安座數,\${data.overview.totalLamps || 0}\\n\`;
          csv += \`營運概況,本月總收入,\${data.overview.totalIncome || 0}\\n\`;
        }
        
        // Gender Ratio
        if (data?.genderRatio) {
          data.genderRatio.forEach((g: any) => {
            csv += \`性別分佈,\${g.label},\${g.val}%\\n\`;
          });
        }
        
        // Age Groups
        if (data?.ageGroups) {
          data.ageGroups.forEach((a: any) => {
            csv += \`年齡分佈,\${a.range},\${a.val}%\\n\`;
          });
        }
        
        // Services
        if (data?.serviceHeat) {
          data.serviceHeat.forEach((s: any) => {
            csv += \`熱門服務,\${s.label},\${s.val}%\\n\`;
          });
        }

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
if (!content.includes('const handleExport =')) {
  content = content.replace(hookTarget, hookInjection);
  fs.writeFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', content, 'utf8');
  console.log('Successfully injected handleExport logic.');
} else {
  console.log('handleExport already exists.');
}
