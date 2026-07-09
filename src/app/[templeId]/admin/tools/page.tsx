"use client";
import React, { useState } from 'react';
import ContractTemplate from '@/components/ContractTemplate';

export default function SalesToolsPage() {
  const [templeName, setTempleName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pivot 銷售工具箱</h1>
          <p className="text-gray-500 mt-2 font-medium">協助您快速展店、簽約與串接 LINE 服務。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 影音介紹模組 */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            系統介紹與展示
          </h2>
          <div className="aspect-video bg-gray-900 rounded-3xl flex items-center justify-center text-white relative overflow-hidden shadow-2xl group cursor-pointer">
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
             <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition">▶️</div>
             <div className="absolute bottom-8 left-8 text-left">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Introduction Video</div>
                <div className="text-xl font-black">Pivot 系統核心介紹 (影音)</div>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
               <div className="text-2xl mb-2">📄</div>
               <div className="font-bold text-gray-900">Pivot 雲端宮廟：未來管理方案簡報</div>
               <button className="mt-4 text-xs font-black text-blue-600 uppercase tracking-widest">下載 PDF</button>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
               <div className="text-2xl mb-2">📱</div>
               <div className="font-bold text-gray-900">信眾前台使用者體驗 (Video)</div>
               <button className="mt-4 text-xs font-black text-blue-600 uppercase tracking-widest">立即播放</button>
            </div>
          </div>
        </div>

        {/* 電子合約產生器 */}
        <div className="space-y-6">
           <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            即時電子合約產生器
          </h2>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
             <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">宮廟全舞（合約乙方）</label>
                <input 
                  value={templeName}
                  onChange={e => setTempleName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition" 
                  placeholder="例：台北聖皇宮" 
                />
             </div>
             <div className="flex gap-4">
                <button 
                  onClick={() => setShowPreview(true)}
                  className="flex-1 py-4 bg-gray-900 text-white font-black rounded-xl hover:bg-gray-800 transition shadow-xl shadow-gray-200"
                >
                  產生合約預覽
                </button>
                <button 
                  onClick={handlePrint}
                  disabled={!showPreview}
                  className="px-6 py-4 bg-emerald-50 text-emerald-600 font-black rounded-xl hover:bg-emerald-100 transition disabled:opacity-50"
                >
                  🖨️ 列印
                </button>
             </div>
             <p className="text-[10px] text-gray-400 font-medium italic">
                * 注意：此合約為 Pivot 標準法務範本，請勿擅改內文。
             </p>
          </div>
        </div>
      </div>

      {/* 預覽模組 */}
      {showPreview && (
        <div className="mt-12 border-t border-gray-100 pt-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest font-sans">合約預覽 - Contract Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-red-500 transition">✕ 關閉預覽</button>
           </div>
           <ContractTemplate templeName={templeName || '未命名宮廟'} agentName="陳超業" />
        </div>
      )}
    </div>
  );
}
