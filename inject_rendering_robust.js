const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

const deskViewStart = content.indexOf('const AdminDesktopView');
if (deskViewStart !== -1) {
  const mainEndIdx = content.indexOf('</main>', deskViewStart);
  if (mainEndIdx !== -1) {
    const injection = `
         {activeTab === 'print-templates' && <PrintTemplatesView printTemplates={printTemplates} loadData={loadData} />}
      `;
    content = content.substring(0, mainEndIdx) + injection + content.substring(mainEndIdx);
  }
}

const mobileViewStart = content.indexOf('const AdminMobileView');
if (mobileViewStart !== -1) {
  const mobileMainEndIdx = content.indexOf('</main>', mobileViewStart);
  if (mobileMainEndIdx !== -1) {
    const mobileInjection = `
          {activeTab === 'print-templates' && (
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <span className="text-4xl mb-4 block">🖨️</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">版型設計請使用電腦版</h3>
                <p className="text-sm text-slate-500">版型設計介面較複雜，為了給您最好的體驗，請使用平板或電腦開啟此功能。</p>
             </div>
          )}
       `;
    content = content.substring(0, mobileMainEndIdx) + mobileInjection + content.substring(mobileMainEndIdx);
  }
}

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('Rendering injected robustly');
