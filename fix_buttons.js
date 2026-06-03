const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// 1. Remove the old header buttons block
content = content.replace(
  /\{\s*activeTab === 'accounts' && \(\s*<div className="flex bg-slate-50 p-2 rounded-\[25px\] border border-slate-100 shadow-sm">[\s\S]*?<\/div>\s*\)\s*\}/,
  ''
);

// 2. Add the specific create buttons to each section header
content = content.replace(
  /<h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">超級業務體系<\/h3><\/div>/,
  `<h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">超級業務體系</h3></div>
  <button onClick={() => {setAccountType('SuperSales'); setIsAccountModalOpen(true)}} className="px-6 py-2 bg-indigo-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm mx-4">+ 開通超級業務</button>`
);

content = content.replace(
  /<h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">經銷商代理體系<\/h3><\/div>/,
  `<h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">經銷商代理體系</h3></div>
  <button onClick={() => {setAccountType('Distributor'); setIsAccountModalOpen(true)}} className="px-6 py-2 bg-emerald-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm mx-4">+ 開通經銷商</button>`
);

content = content.replace(
  /<h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">宮廟營運列表<\/h3><\/div>/,
  `<h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">宮廟營運列表</h3></div>
  <button onClick={() => {setAccountType('Temple'); setIsAccountModalOpen(true)}} className="px-6 py-2 bg-amber-500 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-sm mx-4">+ 開通宮廟</button>`
);

// 3. Fix the table rendering in Temple list. Because we accidentally removed \`name\` in newTemple, existing temples might have undefined \`name\`. We should display a fallback.
content = content.replace(
  /<td className="px-12 py-8 text-lg font-black text-slate-800 tracking-tight italic">\{acc\.name\}<\/td>/g,
  `<td className="px-12 py-8 text-lg font-black text-slate-800 tracking-tight italic">{acc.name || acc.templeName || '宮廟管理員'}</td>`
);

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content, 'utf8');
console.log('SuperAdminClient.tsx header buttons and create buttons fixed.');
