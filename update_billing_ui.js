const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/billing/FinancialManagerClient.tsx', 'utf8');

const str1 = `                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="text-rose-500">💳</span> 系統服務資費 Registry
                   </h3>
                </div>`;
const rep1 = `                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
                   <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="text-rose-500">💳</span> 系統服務資費 Registry
                   </h3>
                   <div className="flex items-center gap-3">
                     <input 
                       type="month" 
                       value={selectedMonth}
                       onChange={(e) => setSelectedMonth(e.target.value)}
                       className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white focus:border-slate-900 outline-none"
                     />
                   </div>
                </div>`;
content = content.replace(str1, rep1);

content = content.replace('{(initialData?.expenses || []).map((exp) => (', '{filteredExpenses.map((exp) => (');

const str3 = `<th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">清償狀態</th>`;
const rep3 = `<th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">收款單位</th>\n                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">清償狀態</th>`;
content = content.replace(str3, rep3);

const str4 = `<td className="px-6 py-4">
                               <span className={\`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border \${exp.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}\`}>
                                  {exp.status === 'Paid' ? '✓ Paid' : '! Unpaid'}
                               </span>
                            </td>`;
const rep4 = `<td className="px-6 py-4">
                               <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                 {exp.payeeRole === 'SuperAdmin' ? '系統中央總部' : '區域經銷商'}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <span className={\`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border \${exp.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}\`}>
                                  {exp.status === 'Paid' ? '✓ Paid' : '! Unpaid'}
                               </span>
                            </td>`;
content = content.replace(str4, rep4);

// also define filteredExpenses if not defined
// Wait, I defined filteredExpenses in a previous call:
// const filteredExpenses = (initialData?.expenses || []).filter(exp => exp.dueDate.startsWith(selectedMonth) || exp.status === 'Unpaid');
// Let's ensure it exists.
if (!content.includes('const filteredExpenses')) {
  content = content.replace(
    'const nearestDueDate',
    'const filteredExpenses = (initialData?.expenses || []).filter(exp => (exp.billingDate && exp.billingDate.startsWith(selectedMonth)) || exp.status === \'Unpaid\');\n  const nearestDueDate'
  );
}

fs.writeFileSync('src/app/[templeId]/admin/billing/FinancialManagerClient.tsx', content);
