const fs = require('fs');

// --- Update page.tsx ---
let pageContent = fs.readFileSync('src/app/[templeId]/admin/page.tsx', 'utf8');

if (!pageContent.includes('fetchStoragePlans')) {
  pageContent = pageContent.replace('fetchGlobalTempleData\n} from \'@/app/actions\';', 'fetchGlobalTempleData,\n  fetchStoragePlans\n} from \'@/app/actions\';');
  
  const fetchInsert = `  } = await fetchGlobalTempleData();\n\n  const storagePlans = await fetchStoragePlans();`;
  pageContent = pageContent.replace('  } = await fetchGlobalTempleData();', fetchInsert);
  
  const propsInsert = `<DashboardContainer \n      storagePlans={storagePlans}`;
  pageContent = pageContent.replace('<DashboardContainer ', propsInsert);
  
  fs.writeFileSync('src/app/[templeId]/admin/page.tsx', pageContent, 'utf8');
  console.log('Updated page.tsx');
}

// --- Update DashboardContainer.tsx ---
let dashContent = fs.readFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', 'utf8');

// 1. Add storagePlans to props interface
const interfaceTarget = `interface DashboardContainerProps {`;
const newInterface = `interface DashboardContainerProps {\n  storagePlans: any[];`;
if (!dashContent.includes('storagePlans: any[];')) {
  dashContent = dashContent.replace(interfaceTarget, newInterface);
}

// 2. Add storagePlans to component params
const paramTarget = `  analyticsData\n}: DashboardContainerProps) {`;
const newParam = `  analyticsData,\n  storagePlans\n}: DashboardContainerProps) {`;
if (!dashContent.includes('  storagePlans\n}')) {
  dashContent = dashContent.replace(paramTarget, newParam);
}

// 3. Update the handleUpgrade function to use upgradeTempleStorage
// We need to import upgradeTempleStorage
if (!dashContent.includes('upgradeTempleStorage')) {
  dashContent = dashContent.replace('import { upgradeStorage', 'import { upgradeTempleStorage, upgradeStorage');
}

const oldHandle = `  const handleUpgrade = async (tier: number) => {
    await upgradeStorage(tier);
    const totals = [5, 20, 100, 500, 2000];
    setStorage(prev => ({ ...prev, tier, total: totals[tier-1] }));
    setShowUpgradeModal(false);
    alert(\`雲端空間已成功升級至 \${totals[tier-1]}GB！\`);
  };`;

const newHandle = `  const handleUpgrade = async (plan: any) => {
    try {
      const res = await upgradeTempleStorage(templeId, plan.id, 'Monthly');
      if (res && res.success === false) {
         alert(res.message);
         return;
      }
      setStorage(prev => ({ ...prev, total: prev.total + plan.sizeGb }));
      setShowUpgradeModal(false);
      alert(\`🎉 升級成功！付款 NT$ \${plan.priceMonthly} 已安全支付給超級管理員。\n系統已自動為您擴充 \${plan.sizeGb}GB 雲端空間！\`);
    } catch (e) {
      console.error(e);
      alert('升級處理失敗，請稍後再試');
    }
  };`;
dashContent = dashContent.replace(oldHandle, newHandle);

// 4. Update the Modal Rendering
const oldModalList = `                 {[ 
                   { tier: 2, size: '20 GB', price: 'NT$ 150/月', desc: '適合中小型宮廟' }, 
                   { tier: 3, size: '100 GB', price: 'NT$ 500/月', desc: '適合信眾穩定成長' }, 
                   { tier: 4, size: '500 GB', price: 'NT$ 1,200/月', desc: '適合大量影音存檔' }
                 ].map(opt => (
                    <button key={opt.tier} onClick={() => handleUpgrade(opt.tier)} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md transition-all group">
                       <div className="text-left">
                         <h4 className="font-bold text-slate-800 group-hover:text-amber-700">{opt.size}</h4>
                         <p className="text-xs font-medium text-slate-500 mt-1">{opt.desc}</p>
                       </div>
                       <span className="font-bold text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">{opt.price}</span>
                    </button>
                 ))}`;

const newModalList = `                 {(storagePlans || []).map((plan: any) => (
                    <button key={plan.id} onClick={() => handleUpgrade(plan)} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md transition-all group">
                       <div className="text-left">
                         <h4 className="font-bold text-slate-800 group-hover:text-amber-700">{plan.name}</h4>
                         <p className="text-xs font-medium text-slate-500 mt-1">統一由超級管理員設定與收款</p>
                       </div>
                       <span className="font-bold text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">NT$ {plan.priceMonthly}/月</span>
                    </button>
                 ))}`;
dashContent = dashContent.replace(oldModalList, newModalList);

fs.writeFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', dashContent, 'utf8');
console.log('Updated DashboardContainer.tsx');
