// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { loginAccount } from '@/app/actions';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-slate-50" />;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);

    const res = await loginAccount(formData);
    if (res.success) {
      window.location.href = res.redirectPath || '/admin';
    } else {
      setErrorMsg(res.error || "登入失敗");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative font-sans overflow-hidden">
      {/* Soft Light Background Orbs */}
      <div className="absolute inset-0">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/50 blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-50/50 blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full bg-white border border-slate-200 p-12 rounded-[50px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative z-10 animate-in fade-in zoom-in duration-700">
         
         <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto bg-slate-900 rounded-[28px] flex items-center justify-center text-4xl shadow-xl mb-6">🛡️</div>
            <h1 className="text-2xl font-black text-slate-900 tracking-[0.3em] uppercase italic leading-none">Pivot</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3">Central Auth Portal</p>
         </div>
               {errorMsg && (
                 <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-black text-center tracking-widest italic uppercase">
                   {errorMsg}
                 </div>
               )}

               <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">系統帳號 Account</label>
                     <input 
                       type="text" 
                       name="account" 
                       autoComplete="username"
                       className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300" 
                       placeholder="Enter username" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">安全密碼 Password</label>
                     <input 
                       type="password" 
                       name="password" 
                       autoComplete="current-password"
                       className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300" 
                       placeholder="••••••••" 
                     />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.6em] py-6 rounded-2xl shadow-xl hover:bg-indigo-600 active:scale-95 transition-all mt-4"
                  >
                     {isSubmitting ? "Verifying..." : "Access System 🚀"}
                  </button>
               </form>

         <div className="mt-12 text-center">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
               © 2026 Pivot Core Technology.
            </p>
         </div>

      </div>
    </div>
  );
}