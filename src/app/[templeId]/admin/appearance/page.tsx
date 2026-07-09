// @ts-nocheck
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { getTempleBasicInfo, updateTempleBasicInfo } from '@/app/actions';

const THEME_OPTIONS = [
  { id: 'amber', name: '財神金 (預設)', color: 'bg-amber-500' },
  { id: 'rose', name: '喜慶紅', color: 'bg-rose-500' },
  { id: 'emerald', name: '玉石綠', color: 'bg-emerald-500' },
  { id: 'blue', name: '莊嚴藍', color: 'bg-blue-600' },
  { id: 'slate', name: '現代灰', color: 'bg-slate-700' },
];

export default function AppearanceSettingsPage() {
  const [templeId, setTempleId] = useState('');
  const [themeColor, setThemeColor] = useState('amber');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = decodeURIComponent(window.location.pathname.split('/')[1]);
    setTempleId(id);
    getTempleBasicInfo(id).then(data => {
      if (data) {
        if (data.themeColor) setThemeColor(data.themeColor);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.bannerUrl) setBannerUrl(data.bannerUrl);
      }
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('templeId', templeId);
    formData.append('type', type);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'logo') setLogoUrl(data.url);
        if (type === 'banner') setBannerUrl(data.url);
      } else {
        alert("上傳失敗：" + data.message);
      }
    } catch (err) {
      alert("網路錯誤，無法上傳檔案");
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateTempleBasicInfo({ themeColor, logoUrl, bannerUrl }, templeId);
      if (res.success) {
        alert("外觀設定已成功儲存！信眾端介面將即時生效。");
      } else {
        alert("儲存失敗，請稍後再試。");
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-800">品牌與外觀設定</h1>
        <p className="text-slate-500 text-sm mt-1">自訂您的專屬宮廟 Logo、視覺橫幅與品牌色調</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        
        {/* Theme Selection */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">品牌主色調 (Theme Color)</h3>
            <p className="text-xs text-slate-500 mt-1">這將會改變信眾端所有主要按鈕與重點標題的顏色</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            {THEME_OPTIONS.map(theme => (
              <button
                key={theme.id}
                onClick={() => setThemeColor(theme.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themeColor === theme.id ? 'border-slate-800 bg-slate-50' : 'border-transparent hover:bg-slate-50'}`}
              >
                <div className={`w-12 h-12 rounded-full shadow-inner ${theme.color}`}></div>
                <span className="text-xs font-bold text-slate-700">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Logo Upload */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">宮廟標誌 (Logo)</h3>
            <p className="text-xs text-slate-500 mt-1">顯示於信眾端畫面的左上角。建議尺寸 200x200px 且背景透明。</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-slate-400 text-xs font-bold">無圖片</span>
              )}
            </div>
            <div>
              <label className="btn-outline cursor-pointer inline-block">
                上傳新 Logo
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
              </label>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Banner Upload */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">首頁主視覺橫幅 (Hero Banner)</h3>
            <p className="text-xs text-slate-500 mt-1">顯示於信眾端首頁最上方。建議尺寸 800x400px。</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-full max-w-md h-40 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 text-xs font-bold">無橫幅圖片</span>
              )}
            </div>
            <div>
              <label className="btn-outline cursor-pointer inline-block">
                上傳新橫幅
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
              </label>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div className="pt-4">
          <button 
            onClick={handleSave} 
            disabled={isPending}
            className="btn-primary px-8 py-3 w-full md:w-auto text-lg"
          >
            {isPending ? '儲存中...' : '💾 儲存並發布'}
          </button>
        </div>

      </div>
    </div>
  );
}
