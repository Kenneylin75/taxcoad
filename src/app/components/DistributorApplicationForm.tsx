"use client";

import React, { useState } from 'react';

interface FormProps {
  role: 'super-admin' | 'super-sales';
  submittedBy: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DistributorApplicationForm({ role, submittedBy, onSuccess, onCancel }: FormProps) {
  const [loading, setLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  
  const validateAccount = async (acc: string) => {
    if (!acc) { setAccountError(''); return; }
    try {
      const { checkAccountExists } = await import('../actions');
      const exists = await checkAccountExists(acc);
      if (exists) {
        setAccountError(`此帳號不可使用，建議使用：${acc}${Math.floor(Math.random()*900)+100}`);
      } else {
        setAccountError('');
      }
    } catch(e) {}
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountError) {
      alert("目前帳號不可使用，請依照系統建議更換！");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData(e.target as HTMLFormElement);
      const data = {
         name: fd.get('name') as string,
         taxId: fd.get('taxId') as string,
         address: fd.get('address') as string,
         owner: fd.get('owner') as string,
         phone: fd.get('phone') as string,
         email: fd.get('email') as string,
         account: fd.get('account') as string,
         password: fd.get('password') as string,
         customPrice: fd.get('customPrice') as string,
         customDuration: fd.get('customDuration') as string,
         customNodes: fd.get('customNodes') as string,
         years: fd.get('customDuration') as string, // map customDuration to years for backend
         bankCode: fd.get('bankCode') as string,
         bankName: fd.get('bankName') as string,
         accountName: fd.get('accountName') as string,
         accountNumber: fd.get('accountNumber') as string,
         submittedBy
      };

      if (role === 'super-admin') {
        const { createDistributorAccount } = await import('../actions');
        const res = await createDistributorAccount(data);
        if (res && res.success === false) {
           alert(res.error || '此帳號已被註冊，不可使用，請更換！');
           return;
        }
      } else {
        const { submitDistributorApplication } = await import('../actions');
        await submitDistributorApplication(data);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in duration-500 pb-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 01. 基礎身份 */}
          <div className="col-span-2 border-b border-slate-100 pb-2">
             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">01. 公司/經銷商基本資料</p>
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">經銷商全銜</label>
             <input name="name" type="text" placeholder="例如：誠信經銷台北分公司" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" required />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">統一編號</label>
             <input name="taxId" type="text" placeholder="8 位數統編" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" required />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">負責人姓名</label>
             <input name="owner" type="text" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" required />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">聯繫電話</label>
             <input name="phone" type="tel" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" required />
          </div>
          <div className="col-span-2 space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">電子信箱</label>
             <input name="email" type="email" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" required />
          </div>
          <div className="col-span-2 space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">營業/通訊地址</label>
             <input name="address" type="text" placeholder="請輸入完整地址" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" required />
          </div>

          {/* 02. 帳戶設定 */}
          <div className="col-span-2 border-b border-slate-100 pb-2 mt-4">
             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">02. 系統登入帳密設定</p>
          </div>
          <div className="space-y-2">
             <label className={`text-[10px] font-black uppercase ml-4 tracking-widest transition-colors ${accountError ? 'text-rose-600' : 'text-slate-400'}`}>登入帳號 (Account ID)</label>
             <input name="account" type="text" placeholder="英文/數字組合" onChange={e => validateAccount(e.target.value)} className={`w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border outline-none transition-all ${accountError ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500' : 'border-slate-100 focus:bg-white focus:border-indigo-400'}`} required />
             {accountError && <p className="text-[10px] text-rose-500 font-bold px-4">{accountError}</p>}
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">初始密碼 (Password)</label>
             <input name="password" type="password" placeholder="請設定 6 位以上" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" required />
          </div>

          {/* 03. 方案設定 */}
          <div className="col-span-2 border-b border-slate-100 pb-2 mt-4">
             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">03. 授權方案深度設定 (Plan Config)</p>
          </div>
          <div className="col-span-2 bg-slate-50 p-10 rounded-[40px] border-2 border-indigo-50 shadow-inner space-y-8 relative overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">簽約總金額 ($)</label>
                   <input name="customPrice" type="number" defaultValue={1600000} className="w-full bg-white rounded-2xl p-6 text-lg font-black text-slate-900 border border-slate-100 outline-none focus:border-indigo-400 shadow-sm" required />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">授權年限 (Years)</label>
                   <input name="customDuration" type="number" defaultValue={2} className="w-full bg-white rounded-2xl p-6 text-lg font-black text-slate-900 border border-slate-100 outline-none focus:border-indigo-400 shadow-sm" required />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">帳戶配額 (Nodes)</label>
                   <input name="customNodes" type="number" defaultValue={100} className="w-full bg-white rounded-2xl p-6 text-lg font-black text-slate-900 border border-slate-100 outline-none focus:border-indigo-400 shadow-sm" required />
                </div>
             </div>
          </div>

          {/* 04. 銀行基本資料 */}
          <div className="col-span-2 border-b border-slate-100 pb-2 mt-4">
             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">04. 銀行基本資料 (Bank Info)</p>
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">支付銀行名稱</label>
             <input name="bankName" type="text" placeholder="例如：中國信託" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">銀行代碼 (Bank Code)</label>
             <input name="bankCode" type="text" placeholder="例如：822" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">戶名</label>
             <input name="accountName" type="text" placeholder="例如：林精英" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" />
          </div>
          <div className="col-span-2 space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">銀行帳號</label>
             <input name="accountNumber" type="text" placeholder="例如：1234567890" className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-bold border border-slate-100 focus:bg-white focus:border-indigo-400 outline-none transition-all" />
          </div>
       </div>
       <div className="flex flex-col sm:flex-row gap-4">
          <button type="button" onClick={onCancel} className="flex-1 py-7 bg-slate-100 text-slate-400 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">取消返回 Cancel</button>
          <button type="submit" disabled={loading} className="flex-[2] py-7 bg-indigo-600 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all shadow-xl active:scale-95 disabled:opacity-50">
             {loading ? '處理中...' : (role === 'super-admin' ? '立即開通經銷商 🚀' : '提交正式授權申請 🏗️')}
          </button>
       </div>
    </form>
  );
}
