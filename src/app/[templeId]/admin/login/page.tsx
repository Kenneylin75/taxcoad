"use client";

import React, { useState, useEffect } from 'react';
import { loginAccount, getTempleBasicInfo } from '@/app/actions';
import { useParams } from 'next/navigation';

export default function TempleAdminLoginPage() {
  const params = useParams();
  const templeId = params?.templeId as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [templeName, setTempleName] = useState("宮廟專屬後台");

  useEffect(() => {
    if (templeId) {
      getTempleBasicInfo(templeId).then(info => {
        if (info && info.templeName) {
          setTempleName(info.templeName);
        }
      }).catch(err => console.error("Fetch temple info error:", err));
    }
  }, [templeId]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await loginAccount(formData, templeId);
      if (res.success) {
        window.location.href = res.redirectPath || `/${templeId}/admin`;
      } else {
        setErrorMsg(res.error || "登入失敗，請檢查帳號密碼。");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setErrorMsg("系統發生錯誤：" + (err.message || String(err)));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6 font-sans">
      <div className="w-full max-w-md space-y-8">
        
        {/* Top Branding Section */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-sm text-red-700">
            ⛩️
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {templeName}
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">
              Temple Admin Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="p-8 space-y-8 bg-white border-2 border-red-950/20 shadow-xl rounded-[35px] overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500 delay-150 fill-mode-both">
          
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-gray-900">後台登入</h3>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Enter the Admin System</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">系統帳號</label>
                <input 
                  type="text" 
                  name="account" 
                  autoComplete="username"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-100 text-gray-900 text-sm font-bold rounded-2xl px-5 py-4 focus:outline-none focus:border-red-900/30 focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-medium"
                  placeholder="請輸入帳號"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">安全密碼</label>
                <input 
                  type="password" 
                  name="password" 
                  autoComplete="current-password"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-100 text-gray-900 text-sm font-bold rounded-2xl px-5 py-4 focus:outline-none focus:border-red-900/30 focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-medium"
                  placeholder="請輸入密碼"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? "登入驗證中..." : "登入系統"}
                <span className="text-lg">➔</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
