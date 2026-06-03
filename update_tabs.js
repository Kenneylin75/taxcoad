const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// 1. Add state for accountSubTab
if (!content.includes('const [accountSubTab')) {
  content = content.replace(
    /const \[isAccountModalOpen, setIsAccountModalOpen\] = useState\(false\);/,
    "const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);\n   const [accountSubTab, setAccountSubTab] = useState<'Temple' | 'Distributor' | 'SuperSales'>('Temple');"
  );
}

// 2. Add subtab navigation
const subTabsHtml = `
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                 
                 {/* 內部分頁導覽 */}
                 <div className="flex items-center gap-4 mb-8 bg-slate-50 p-2 rounded-[25px] border border-slate-100 shadow-sm w-fit">
                    <button 
                       onClick={() => setAccountSubTab('Temple')}
                       className={\`px-8 py-3 rounded-[20px] text-[12px] font-black uppercase tracking-widest transition-all \${accountSubTab === 'Temple' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}\`}
                    >
                       🏰 宮廟營運
                    </button>
                    <button 
                       onClick={() => setAccountSubTab('Distributor')}
                       className={\`px-8 py-3 rounded-[20px] text-[12px] font-black uppercase tracking-widest transition-all \${accountSubTab === 'Distributor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}\`}
                    >
                       🏢 經銷代理
                    </button>
                    <button 
                       onClick={() => setAccountSubTab('SuperSales')}
                       className={\`px-8 py-3 rounded-[20px] text-[12px] font-black uppercase tracking-widest transition-all \${accountSubTab === 'SuperSales' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}\`}
                    >
                       🚀 超級業務
                    </button>
                 </div>
`;

content = content.replace(/<div className="animate-in fade-in slide-in-from-bottom-4 duration-700">/, subTabsHtml);

// 3. Wrap sections with condition
content = content.replace(
  /{[\s]*\/\* 超級業務列表 \*\/}/,
  "{accountSubTab === 'SuperSales' && (\n{/* 超級業務列表 */}"
);
content = content.replace(
  /<\/section>\s*{[\s]*\/\* 經銷商體系 \*\/}/,
  "</section>\n)}\n\n{accountSubTab === 'Distributor' && (\n{/* 經銷商體系 */}"
);
content = content.replace(
  /<\/section>\s*{[\s]*\/\* 宮廟營運列表 \*\/}/,
  "</section>\n)}\n\n{accountSubTab === 'Temple' && (\n{/* 宮廟營運列表 */}"
);

// Close the last section
content = content.replace(
  /<\/section>\s*<\/div>\s*\)}/,
  "</section>\n)}\n              </div>\n           )}"
);

// Remove the mt-16 margin top from sections since they are now isolated tabs
content = content.replace(/className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-16"/g, 'className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700"');


fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content, 'utf8');
console.log('Successfully refactored ACCOUNTS tab to use inner subTabs.');
