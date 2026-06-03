const fs = require('fs');

// 1. Create DistributorApplicationForm.tsx
const formComponentCode = `"use client";

import React, { useState, useEffect } from 'react';
import { fetchSystemConfig } from '../actions';

interface FormProps {
  role: 'super-admin' | 'super-sales';
  submittedBy: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DistributorApplicationForm({ role, submittedBy, onSuccess, onCancel }: FormProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  const [form, setForm] = useState({
    name: "",
    account: "",
    password: "",
    customPrice: 1600000,
    years: 2,
    nodes: 100,
  });

  useEffect(() => {
    fetchSystemConfig().then(setConfig);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === 'super-admin') {
        const { createDistributorAccount } = await import('../actions');
        await createDistributorAccount({
           ...form,
           submittedBy
        });
      } else {
        const { submitDistributorApplication } = await import('../actions');
        await submitDistributorApplication({
           ...form,
           submittedBy
        });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white w-full p-4 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-6">
         <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">01. 基礎身份與安全 (Identity)</p>
            <input type="text" placeholder="公司全銜 / 名稱" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 rounded-[30px] p-8 text-lg font-black outline-none border border-slate-100 focus:border-slate-900 transition-all shadow-inner" required />
            <div className="bg-slate-50 rounded-[40px] p-10 space-y-4 border border-slate-100 shadow-inner">
               <input type="text" placeholder="經銷管理帳號 ID" value={form.account} onChange={e => setForm({...form, account: e.target.value})} className="w-full bg-white rounded-[25px] p-7 text-sm font-black shadow-sm outline-none border border-slate-50 focus:border-emerald-500 transition-all" required />
               <input type="password" placeholder="登入安全密碼" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-white rounded-[25px] p-7 text-sm font-black shadow-sm outline-none border border-slate-50 focus:border-emerald-500 transition-all" required />
            </div>
         </div>

         <div className="p-10 bg-indigo-950 text-white rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center italic text-indigo-400">02. 授權方案深度設定 (Plan Config)</p>
            
            <div className="space-y-6 relative z-10">
               <div className="bg-white/10 p-6 rounded-3xl border border-white/10 space-y-2">
                  <p className="text-[9px] font-black text-indigo-300 uppercase">授權簽約金額 (Price)</p>
                  <div className="flex items-center gap-2">
                     <span className="text-xl font-black opacity-30">$</span>
                     <input type="number" value={form.customPrice} onChange={e => setForm({...form, customPrice: parseInt(e.target.value) || 0})} className="bg-transparent text-3xl font-black outline-none w-full text-white italic tracking-tighter" required />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-6 rounded-3xl border border-white/10 space-y-2">
                     <p className="text-[9px] font-black text-indigo-300 uppercase">年限 (Years)</p>
                     <input type="number" value={form.years} onChange={e => setForm({...form, years: parseInt(e.target.value) || 0})} className="bg-transparent text-xl font-black outline-none w-full text-white italic" required />
                  </div>
                  <div className="bg-white/10 p-6 rounded-3xl border border-white/10 space-y-2">
                     <p className="text-[9px] font-black text-indigo-300 uppercase">配額 (Nodes)</p>
                     <input type="number" value={form.nodes} onChange={e => setForm({...form, nodes: parseInt(e.target.value) || 0})} className="bg-transparent text-xl font-black outline-none w-full text-white italic" required />
                  </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-3 pt-8">
            <button type="submit" disabled={loading} className="w-full py-5 rounded-[24px] font-black text-white bg-slate-900 shadow-xl active:scale-95 transition-all hover:bg-emerald-600 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
               {loading ? 'PROCESSING...' : (role === 'super-admin' ? '立即開通經銷商 EXECUTE 🚀' : '提報經銷建檔申請 ↗')}
            </button>
            <button type="button" onClick={onCancel} className="w-full py-4 rounded-[24px] font-black text-slate-400 bg-transparent hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest">取消返回 Cancel</button>
         </div>
      </div>
    </form>
  );
}
`;

fs.writeFileSync('src/app/components/DistributorApplicationForm.tsx', formComponentCode, 'utf8');

// 2. Refactor SuperAdminClient.tsx
let saContent = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// Add import
if (!saContent.includes('DistributorApplicationForm')) {
  saContent = saContent.replace(
    /import TempleApplicationForm from '\.\.\/components\/TempleApplicationForm';/,
    "import TempleApplicationForm from '../components/TempleApplicationForm';\nimport DistributorApplicationForm from '../components/DistributorApplicationForm';"
  );
}

// Replace Distributor modal form section inside SuperAdminClient
saContent = saContent.replace(
  /\{accountType === 'Distributor' \? \([\s\S]*?\) : \(/,
  ""
); // wait, it doesn't have ternary yet!

saContent = saContent.replace(
  /\{accountType === 'Temple' \? \(/,
  `{accountType === 'Distributor' ? (
              <div className="p-8">
                 <div className="flex justify-between items-center mb-8">
                    <div className="space-y-4">
                       <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">System Provisioning Protocol</p>
                       <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">開設經銷商</h3>
                    </div>
                 </div>
                 <div className="max-h-[70vh] overflow-y-auto px-4">
                    <DistributorApplicationForm 
                       role="super-admin"
                       submittedBy="超級總裁"
                       onSuccess={() => {
                          setIsAccountModalOpen(false);
                          alert('經銷商帳戶已成功建立並開通！');
                          window.location.reload();
                       }}
                       onCancel={() => setIsAccountModalOpen(false)}
                    />
                 </div>
              </div>
            ) : accountType === 'Temple' ? (`
);

// We must also remove the old \`{accountType === 'Distributor' && ( ... )}\` from inside the form!
const oldDistSectionRegex = /\{accountType === 'Distributor' && \(\s*<section className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">[\s\S]*?<\/section>\s*\)\}/;
saContent = saContent.replace(oldDistSectionRegex, '');


fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', saContent, 'utf8');

// 3. Refactor SuperSalesClient.tsx
let ssContent = fs.readFileSync('src/app/super-sales/SuperSalesClient.tsx', 'utf8');

if (!ssContent.includes('DistributorApplicationForm')) {
  ssContent = ssContent.replace(
    /import \{[\s\S]*?\} from '\.\.\/actions';/,
    match => match + "\nimport DistributorApplicationForm from '../components/DistributorApplicationForm';"
  );
}

// Replace the inline form for Distributor in SuperSales
ssContent = ssContent.replace(
  /<form onSubmit=\{\(e\)=>\{e\.preventDefault\(\); handleAction\('新經銷商開戶', distForm\.name\);\}\}[\s\S]*?<\/form>/,
  `<DistributorApplicationForm 
      role="super-sales"
      submittedBy={currentUser.name}
      onSuccess={() => {
         setIsAddDistModalOpen(false);
         alert('經銷商申請已送出，等待總裁審核！');
         window.location.reload();
      }}
      onCancel={() => setIsAddDistModalOpen(false)}
  />`
);

fs.writeFileSync('src/app/super-sales/SuperSalesClient.tsx', ssContent, 'utf8');

console.log('Distributor refactor complete');
