"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { bindCustomerLine } from '@/app/actions';

export default function LineBindPage({ params }: { params: { templeId: string } }) {
  const searchParams = useSearchParams();
  const lineUserId = searchParams?.get('lineUserId') || '';
  const name = searchParams?.get('name') || '';
  const picture = searchParams?.get('picture') || '';

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !lineUserId) return;
    
    setLoading(true);
    const res = await bindCustomerLine(params.templeId, phone, lineUserId);
    if (res.success) {
       setResult('success');
    } else {
       setResult('error');
    }
    setLoading(false);
  };

  if (!lineUserId) {
     return <div className="p-10 text-center text-red-500 font-black">無效的 LINE 授權。</div>;
  }

  if (result === 'success') {
     return (
       <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-8 text-center space-y-6">
           <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner">
             ✓
           </div>
           <div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">綁定成功！</h2>
             <p className="text-slate-500 text-sm font-bold mt-2">您的 LINE 帳號已成功連結至您的信眾資料。您現在可以關閉此視窗了。</p>
           </div>
           <button onClick={() => window.close()} className="w-full bg-[#06C755] text-white font-black py-4 rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-widest text-sm">
              回到 LINE
           </button>
         </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
       <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">LINE 帳號綁定</h1>
            <p className="text-slate-500 text-sm font-bold">請輸入您在宮廟登記的手機號碼，以接收自動推播通知。</p>
          </div>

          <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             {picture && <img src={picture} alt={name} className="w-16 h-16 rounded-full shadow-md border-2 border-white" />}
             <div className="text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">目前登入為</p>
                <p className="text-lg font-black text-slate-800">{name}</p>
             </div>
          </div>

          <form onSubmit={handleBind} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">手機號碼 (Phone Number)</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="例如: 0912345678"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-[#06C755] focus:ring-4 focus:ring-[#06C755]/10 outline-none transition-all shadow-inner"
                  required
                />
             </div>

             {result === 'error' && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold text-center border border-rose-100">
                   找不到符合此手機的信眾資料，請確認號碼是否正確，或聯絡宮廟進行登記。
                </div>
             )}

             <button 
               type="submit" 
               disabled={loading || !phone}
               className="w-full bg-[#06C755] text-white font-black py-4 rounded-xl shadow-lg shadow-[#06C755]/30 hover:opacity-90 hover:-translate-y-1 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:translate-y-0"
             >
                {loading ? '驗證中...' : '確認綁定'}
             </button>
          </form>
       </div>
    </div>
  );
}
