// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
   fetchServiceDefinitions,
   fetchForms,
   fetchStaff,
   saveServiceDefinition,
   saveForm,
   fetchAvailableSlots,
   createSlot,
   removeSingleSlot,
   fetchPrintTemplates,
   savePrintTemplate,
   deletePrintTemplate
} from '@/app/actions';

// --- 📱 手機版組件 (App Style Modern Professional) ---
const AdminMobileView = ({ services, forms, staffList, availableSlots, loadData, activeTab, setActiveTab, handleDeleteService }: any) => {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [editingService, setEditingService] = useState<any>(null);

   return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
         <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-[100] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
               <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex items-center justify-center text-xl bg-slate-50 rounded-xl">☰</button>
               <h1 className="text-base font-bold text-slate-800">
                  {activeTab === 'services' ? '服務項目' : '表單建模'}
               </h1>
            </div>
            <button onClick={loadData} className="text-xs font-bold text-indigo-600">刷新</button>
         </header>

         {isMenuOpen && (
            <div className="fixed inset-0 z-[1000] bg-slate-900/20 backdrop-blur-sm flex">
               <div className="w-[75%] bg-white h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300">
                  <div className="flex justify-between items-center mb-10">
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">系統導航</span>
                     <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs">✕</button>
                  </div>
                  <div className="space-y-2">
                     {[{ id: 'services', l: '服務配置', i: '⛩️' }, { id: 'forms', l: '表單建模', i: '📑' }, { id: 'print-templates', l: '列印版型設計', i: '🖨️' }].map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                           <span>{t.i}</span> {t.l}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="flex-1" onClick={() => setIsMenuOpen(false)}></div>
            </div>
         )}

         <main className="flex-1 p-4">
            {activeTab === 'services' && services.map((s: any) => (
               <div key={s.id} onClick={() => setEditingService(s)} className="bg-white p-5 mb-4 rounded-3xl border border-slate-100 shadow-sm relative">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{s.name}</h3>
                  <p className="text-[11px] text-slate-400">{forms.find((f: any) => f.id === s.linkedFormId)?.name || '未關聯表單'}</p>
                  <button 
                     onClick={(e) => handleDeleteService(s.id, e)}
                     className="absolute top-5 right-5 text-[10px] font-bold text-rose-300 uppercase tracking-widest hover:text-rose-600 transition-colors p-2"
                  >
                     刪除
                  </button>
               </div>
            ))}
            {activeTab === 'forms' && forms.map(f => (
               <div key={f.id} className="bg-white p-5 mb-4 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">{f.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">欄位數: {f.fields?.length || 0}</p>
               </div>
            ))}

            {activeTab === 'print-templates' && (
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                  <span className="text-4xl mb-4 block">🖨️</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">版型設計請使用電腦版</h3>
                  <p className="text-sm text-slate-500">版型設計介面較複雜，為了給您最好的體驗，請使用平板或電腦開啟此功能。</p>
               </div>
            )}
         </main>
      </div>
   );
};

// --- 💻 電腦版組件 (AI Powered Form Builder & Simulator) ---

// --- 🖨️ 列印版型設計視圖 (Print Templates Designer) ---
const PrintTemplatesView = ({ printTemplates, loadData }: any) => {
   const [editingTemplate, setEditingTemplate] = useState<any>(null);
   const [isSaving, setIsSaving] = useState(false);
   const [aiPrompt, setAiPrompt] = useState('');
   const [isAiGenerating, setIsAiGenerating] = useState(false);

   const handleCreate = () => {
      setEditingTemplate({
         id: 'pt-' + Date.now(),
         name: '自訂新版型',
         templeName: '宮廟名稱',
         watermarkUrl: '',
         watermarkOpacity: 0.1,
         borderStyle: 'border: 8px double #fcd34d; padding: 20px;'
      });
   };

   const handleSave = async () => {
      if (!editingTemplate) return;
      setIsSaving(true);
      await savePrintTemplate(editingTemplate);
      await loadData();
      setEditingTemplate(null);
      setIsSaving(false);
   };

   const handleDelete = async (id: string) => {
      if (confirm('確定要刪除此版型嗎？')) {
         await deletePrintTemplate(id);
         await loadData();
      }
   };

   const handleAiGenerate = async () => {
      if (!aiPrompt) return;
      setIsAiGenerating(true);
      // Simulate AI generating a border style
      setTimeout(() => {
         let newBorder = 'border: 8px solid #fcd34d; padding: 20px;';
         if (aiPrompt.includes('蓮花') || aiPrompt.includes('復古')) {
            newBorder = 'border: 12px double #b91c1c; padding: 30px; border-radius: 15px; box-shadow: inset 0 0 10px rgba(185, 28, 28, 0.2);';
         } else if (aiPrompt.includes('現代') || aiPrompt.includes('極簡')) {
            newBorder = 'border: 2px solid #333; padding: 40px; border-radius: 0px;';
         }
         setEditingTemplate({ ...editingTemplate, borderStyle: newBorder });
         setIsAiGenerating(false);
      }, 1500);
   };

   return (
      <div className="p-8 pb-32">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">列印版型設計庫</h2>
               <p className="text-sm font-bold text-slate-500 mt-2">設計信眾表單下載與列印時的精美 A4 專屬背景與花邊。</p>
            </div>
            <button onClick={handleCreate} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg">
               ➕ 建立新版型
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {printTemplates.map((pt: any) => (
               <div key={pt.id} className="bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all group flex flex-col">
                  <div className="flex-1">
                     <h3 className="text-lg font-black text-slate-800 mb-1">{pt.name}</h3>
                     <p className="text-xs font-bold text-slate-400 mb-4 truncate">標題: {pt.templeName}</p>

                     {/* Mini Preview Box */}
                     <div className="w-full aspect-[1/1.4] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 relative mb-4 flex flex-col" style={(pt.borderStyle || '').split(';').reduce((acc: any, rule: string) => { const parts = rule.split(':'); if (parts.length > 1) { acc[parts[0].trim().replace(/-([a-z])/g, (g: any) => g[1].toUpperCase())] = parts.slice(1).join(':').trim(); } return acc; }, {})}>
                        {pt.watermarkUrl && (
                           <div className="absolute inset-0 bg-center bg-contain bg-no-repeat z-0" style={{ backgroundImage: `url(${pt.watermarkUrl})`, opacity: pt.watermarkOpacity }}></div>
                        )}
                        <div className="relative z-10 text-center font-black" style={{ fontSize: '10px' }}>{pt.templeName}</div>
                        <div className="relative z-10 w-full h-[2px] bg-black/20 my-2"></div>
                        <div className="relative z-10 space-y-2">
                           <div className="h-1.5 bg-black/10 rounded w-3/4"></div>
                           <div className="h-1.5 bg-black/10 rounded w-1/2"></div>
                           <div className="h-1.5 bg-black/10 rounded w-5/6"></div>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                     <button onClick={() => setEditingTemplate(pt)} className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">編輯</button>
                     <button onClick={() => handleDelete(pt.id)} className="w-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">🗑️</button>
                  </div>
               </div>
            ))}
         </div>

         {editingTemplate && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex overflow-hidden border-4 border-slate-900 animate-in zoom-in-95">
                  {/* Left: Editor Settings */}
                  <div className="w-1/2 h-full flex flex-col bg-white border-r-2 border-slate-100">
                     <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                           <h2 className="text-2xl font-black text-slate-800">設計版型</h2>
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Template Editor</p>
                        </div>
                        <button onClick={() => setEditingTemplate(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-slate-500 hover:text-slate-800 shadow-sm">✕</button>
                     </div>
                     <div className="p-8 flex-1 overflow-y-auto space-y-6">

                        <div className="space-y-4 bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-100">
                           <label className="text-xs font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">✨ AI 智能邊框設計助理</label>
                           <div className="flex gap-2">
                              <input type="text" placeholder="例如：復古中式蓮花邊框..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500" />
                              <button onClick={handleAiGenerate} disabled={isAiGenerating} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">
                                 {isAiGenerating ? '生成中...' : 'AI 設計'}
                              </button>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">版型系統名稱</label>
                           <input type="text" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">宮廟列印抬頭 (Temple Header)</label>
                           <input type="text" value={editingTemplate.templeName} onChange={e => setEditingTemplate({ ...editingTemplate, templeName: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white" />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">主神浮水印圖片網址 (Watermark URL)</label>
                           <input type="text" placeholder="請貼上圖片網址" value={editingTemplate.watermarkUrl} onChange={e => setEditingTemplate({ ...editingTemplate, watermarkUrl: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white" />
                           <p className="text-[10px] text-slate-400 font-bold">第一階段支援貼上圖片網址，或留空不使用背景。</p>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">浮水印透明度 (0.01 ~ 1.0) : {editingTemplate.watermarkOpacity}</label>
                           <input type="range" min="0.01" max="1" step="0.01" value={editingTemplate.watermarkOpacity} onChange={e => setEditingTemplate({ ...editingTemplate, watermarkOpacity: parseFloat(e.target.value) })} className="w-full accent-indigo-600" />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">邊框樣式 (CSS Style)</label>
                           <textarea rows={3} value={editingTemplate.borderStyle} onChange={e => setEditingTemplate({ ...editingTemplate, borderStyle: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white font-mono" />
                        </div>

                     </div>
                     <div className="p-6 border-t-2 border-slate-100 bg-slate-50">
                        <button onClick={handleSave} disabled={isSaving} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors disabled:opacity-50">
                           {isSaving ? '儲存中...' : '💾 儲存並套用版型'}
                        </button>
                     </div>
                  </div>

                  {/* Right: Live A4 Preview */}
                  <div className="w-1/2 h-full bg-slate-100 p-8 flex items-center justify-center overflow-auto">
                     {/* Simulated A4 Paper */}
                     <div className="w-[400px] h-[565px] bg-white shadow-2xl relative flex flex-col" style={(editingTemplate.borderStyle || '').split(';').reduce((acc: any, rule: string) => { const parts = rule.split(':'); if (parts.length > 1) { acc[parts[0].trim().replace(/-([a-z])/g, (g: any) => g[1].toUpperCase())] = parts.slice(1).join(':').trim(); } return acc; }, {})}>
                        {/* Watermark */}
                        {editingTemplate.watermarkUrl && (
                           <div className="absolute inset-0 bg-center bg-contain bg-no-repeat pointer-events-none z-0" style={{ backgroundImage: `url(${editingTemplate.watermarkUrl})`, opacity: editingTemplate.watermarkOpacity }}></div>
                        )}
                        {/* Content */}
                        <div className="relative z-10 w-full h-full flex flex-col">
                           <h1 className="text-3xl font-black text-center mb-6" style={{ fontFamily: '"Microsoft JhengHei", sans-serif', borderBottom: '2px solid #000', paddingBottom: '15px' }}>{editingTemplate.templeName}</h1>
                           <div className="flex justify-between items-center mb-6 text-sm">
                              <span className="font-bold">服務：光明燈祈福</span>
                              <span>列印日期：2026/06/02</span>
                           </div>
                           <div className="space-y-4 flex-1 text-sm">
                              <div className="border-b border-dashed border-slate-300 pb-2"><strong>信眾姓名：</strong> 林某某</div>
                              <div className="border-b border-dashed border-slate-300 pb-2"><strong>出生日期：</strong> 1980/01/01</div>
                              <div className="border-b border-dashed border-slate-300 pb-2"><strong>聯絡電話：</strong> 0912345678</div>
                              <div className="border-b border-dashed border-slate-300 pb-2"><strong>祈福事項：</strong> 闔家平安，事業順利</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const AdminDesktopView = ({ services, forms, printTemplates, staffList, availableSlots, loadData, activeTab, setActiveTab, handleDeleteService }: any) => {
   const [editingService, setEditingService] = useState<any>(null);
   const [editingForm, setEditingForm] = useState<any>(null);
   const [showTemplateMenu, setShowTemplateMenu] = useState(false);
   const [isAiScanning, setIsAiScanning] = useState(false);
   const templeId = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'default';
   const aiFileInputRef = useRef<HTMLInputElement>(null);
   const [newSlot, setNewSlot] = useState<any>({ date: '', time: '10:00', staff: '', serviceId: '' });

   // 真實檔案上傳觸發 AI 邏輯
   const triggerAiScan = () => {
      if (aiFileInputRef.current) aiFileInputRef.current.click();
   };

   const handleAiFileChange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAiScanning(true);
      // 這裡可以呼叫後端 API，將圖片傳給 OpenAI 進行結構化擷取
      // 目前模擬網路請求等待與擷取結果
      setTimeout(() => {
         const scannedFields = [
            { label: '信眾姓名', type: 'text', required: true },
            { label: '出生生辰', type: 'lunar', required: true },
            { label: '生肖', type: 'text' },
            { label: '運勢路況', type: 'select_single', options: ['柏油路', '水泥路', '石頭路', '爛泥路'] },
            { label: '房子材質', type: 'select_multiple', options: ['茅房', '竹房', '磚房', '城堡', '宮殿'] },
            { label: '廚房灶火', type: 'select_single', options: ['大', '中', '小', '無'] },
            { label: '廚房灶水', type: 'select_single', options: ['沸騰', '半滾', '平靜'] },
            { label: '水缸存量', type: 'select_single', options: ['全滿', '7分', '5分', '3分', '1分', '無'] },
            { label: '米缸存量', type: 'select_single', options: ['全滿', '7分', '5分', '3分', '1分', '無'] },
            { label: '建議事項/備註', type: 'textarea' }
         ];
         setEditingForm(prev => ({
            ...prev,
            name: '元辰宮服務紀錄表 (AI 自動生成)',
            fields: scannedFields
         }));
         setIsAiScanning(false);
         alert('✨ AI 已成功分析附件！已自動為您提取 10 個欄位與選項結構。');
      }, 2500);
   };

   return (
      <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-slate-900">
         {/* 🚀 左側導航 */}
         <nav className="w-[300px] bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-12 border-b border-slate-100">
               <h1 className="text-2xl font-black tracking-tight text-slate-900 italic">服務管理系統</h1>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">AI INTEGRATED V4.5</p>
            </div>
            <div className="p-6 flex-1 space-y-1.5">
               {[
                  { id: 'services', l: '服務項目配置', i: '⛩️' },
                  { id: 'forms', l: '表單建模設計', i: '📝' },
                  { id: 'print-templates', l: '列印版型設計', i: '🖨️' },
               ].map(item => (
                  <button
                     key={item.id}
                     onClick={() => setActiveTab(item.id)}
                     className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-slate-900 text-white shadow-xl translate-x-2' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                     <span className="text-xl">{item.i}</span> {item.l}
                  </button>
               ))}
            </div>
         </nav>

         {/* 🚀 主內容區 */}
         <main className="flex-1 p-6 md:p-16 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
            {activeTab === 'services' && (
               <div className="space-y-12">
                  <div className="flex justify-between items-center">
                     <div>
                        <h2 className="text-3xl font-bold text-slate-900">服務項目配置</h2>
                        <p className="text-sm text-slate-400 mt-1">管理各類祈福、祭改服務及其對應的執勤人員與關聯表單</p>
                     </div>
                     <button onClick={() => setEditingService({ id: 's-' + Date.now(), name: '新服務項目', assignedStaff: [], status: 'Active', linkedFormId: '', price: 0 })} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg hover:bg-indigo-700 hover:translate-y-[-2px] transition-all">＋ 新增服務項目</button>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-1 md:grid-cols-2 3xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                     {services.map(s => (
                        <div key={s.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer" onClick={() => setEditingService(s)}>
                           <div className="flex justify-between items-center mb-8">
                              <div className="w-16 h-16 bg-slate-50 text-slate-600 rounded-[24px] flex items-center justify-center text-3xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">⛩️</div>
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{s.status || 'Active'}</span>
                           </div>
                           <h3 className="text-2xl font-bold text-slate-900 mb-2">{s.name}</h3>
                           <p className="text-xs font-bold text-indigo-600 mb-8">
                              {forms.find(f => f.id === s.linkedFormId)?.name || '未關聯表單'}
                              <span className="ml-2 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                                 {s.price === 0 || s.price === undefined ? '隨喜功德' : `$${s.price}`}
                              </span>
                           </p>
                           <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">編輯設定 ➔</span>
                          <button 
                            onClick={(e) => handleDeleteService(s.id, e)}
                            className="text-[11px] font-bold text-rose-300 uppercase tracking-widest hover:text-rose-600 transition-colors"
                          >
                            刪除
                          </button>
                       </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'forms' && (
               <div className="space-y-12">
                  <div className="flex justify-between items-center">
                     <div>
                        <h2 className="text-3xl font-bold text-slate-900">表單建模設計</h2>
                        <p className="text-sm text-slate-400 mt-1">針對不同的服務自定義信眾登記時需要填寫的案卡欄位</p>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => setEditingForm({ id: 'f-' + Date.now(), name: 'AI 掃描建構中...', fields: [] })} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-2">✨ AI 掃描附件自動建模</button>
                        <button onClick={() => setEditingForm({ id: 'f-' + Date.now(), name: '新表單設計', fields: [] })} className="bg-white border border-slate-200 text-slate-900 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">＋ 手動創建表單</button>
                        <div className="relative">
                           <button onClick={() => setShowTemplateMenu(!showTemplateMenu)} className="bg-amber-50 border border-amber-200 text-amber-700 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-amber-100 transition-all flex items-center gap-2">📂 套用預設模組</button>
                           {showTemplateMenu && (
                              <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50">
                                 {(() => {
                                    const tpls = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`temple_form_templates_${templeId}`) || '[]') : [];
                                    if (tpls.length === 0) return <div className="p-4 text-xs text-slate-400 text-center font-bold">尚未儲存任何模組</div>;
                                    return tpls.map((t: any, i: number) => (
                                       <div key={i} onClick={() => {
                                          setEditingForm({ id: 'f-' + Date.now(), name: t.name + ' (套用預設)', fields: t.fields });
                                          setShowTemplateMenu(false);
                                       }} className="px-4 py-3 hover:bg-indigo-50 rounded-lg cursor-pointer flex justify-between items-center group">
                                          <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 truncate mr-2">{t.name}</span>
                                          <span className="text-[10px] text-slate-400 shrink-0">{t.fields?.length || 0} 欄位</span>
                                       </div>
                                    ));
                                 })()}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-1 md:grid-cols-2 3xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                     {forms.map(f => (
                        <div key={f.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer" onClick={() => setEditingForm(f)}>
                           <div className="flex justify-between items-center mb-8">
                              <div className="w-16 h-16 bg-slate-50 text-slate-600 rounded-[24px] flex items-center justify-center text-3xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">📑</div>
                              <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-slate-50 text-slate-400 border-slate-200">{f.fields?.length || 0} 欄位</span>
                           </div>
                           <h3 className="text-2xl font-bold text-slate-900 mb-2">{f.name}</h3>
                           <p className="text-xs font-bold text-indigo-600 mb-8">連結服務: {services.filter(s => s.linkedFormId === f.id).length} 個</p>
                           <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">建模設定 ➔</div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'print-templates' && <PrintTemplatesView printTemplates={printTemplates} loadData={loadData} />}
         </main>

         {/* 🚀 AI 表單建模與實時模擬面板 (Builder & Simulator) */}
         {editingForm && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-end bg-slate-900/10 backdrop-blur-[2px] animate-in fade-in duration-300">
               <div className="w-full max-w-full md:max-w-[1200px] bg-white h-screen shadow-[-40px_0_100px_rgba(0,0,0,0.1)] overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col md:flex-row">

                  {/* 左半部：建模工作區 */}
                  <div className="flex-1 p-6 md:p-16 overflow-y-auto border-r border-slate-50 flex flex-col">
                     <div className="flex justify-between items-center mb-16">
                        <div>
                           <h3 className="text-3xl font-bold text-slate-900">表單建模設計</h3>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">AI Structural Orchestrator</p>
                        </div>
                        <div className="flex gap-4">
                           <input type="file" ref={aiFileInputRef} accept="image/*" capture="environment" onChange={handleAiFileChange} className="hidden" />
                           <button
                              onClick={triggerAiScan}
                              disabled={isAiScanning}
                              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isAiScanning ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                           >
                              {isAiScanning ? '連接總部 AI 引擎萃取中...' : '📸 拍攝/上傳 實體案卡 AI 分析'}
                           </button>
                           <button onClick={() => setEditingForm(null)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-xl hover:bg-slate-100 transition-all">✕</button>
                        </div>
                     </div>

                     <div className="flex-1 space-y-12">
                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">表單標題</label>
                           <input value={editingForm.name} onChange={e => setEditingForm({ ...editingForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 font-bold text-lg outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" />
                        </div>

                        <div className="space-y-6">
                           <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">欄位與選項邏輯</label>
                              <button onClick={() => setEditingForm({ ...editingForm, fields: [...(editingForm.fields || []), { label: '新欄位', type: 'text' }] })} className="text-xs font-bold text-indigo-600 hover:underline">＋ 手動新增欄位</button>
                           </div>
                           <div className="space-y-4">
                              {(editingForm.fields || []).map((field: any, idx: number) => (
                                 <div key={idx} className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 flex flex-col gap-4 group hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all relative">
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                       <button
                                          onClick={() => {
                                             if (idx === 0) return;
                                             const next = [...editingForm.fields];
                                             const temp = next[idx];
                                             next[idx] = next[idx - 1];
                                             next[idx - 1] = temp;
                                             setEditingForm({ ...editingForm, fields: next });
                                          }}
                                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${idx === 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'}`}
                                          disabled={idx === 0}
                                       >
                                          ↑
                                       </button>
                                       <button
                                          onClick={() => {
                                             if (idx === editingForm.fields.length - 1) return;
                                             const next = [...editingForm.fields];
                                             const temp = next[idx];
                                             next[idx] = next[idx + 1];
                                             next[idx + 1] = temp;
                                             setEditingForm({ ...editingForm, fields: next });
                                          }}
                                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${idx === editingForm.fields.length - 1 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'}`}
                                          disabled={idx === editingForm.fields.length - 1}
                                       >
                                          ↓
                                       </button>
                                    </div>
                                    <div className="flex gap-6 items-end w-full">
                                       <div className="flex-1 space-y-2 ml-4">
                                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">欄位標籤</label>
                                          <input value={field.label} onChange={e => {
                                             const next = [...editingForm.fields]; next[idx].label = e.target.value; setEditingForm({ ...editingForm, fields: next });
                                          }} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-600 transition-all" />
                                       </div>
                                       <div className="w-48 space-y-2">
                                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">類型</label>
                                          <select value={field.type} onChange={e => {
                                             const next = [...editingForm.fields]; next[idx].type = e.target.value; setEditingForm({ ...editingForm, fields: next });
                                          }} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer">
                                             <option value="text">標準文字</option>
                                             <option value="select_single">單選選單</option>
                                             <option value="select_multiple">複選標籤 (可多選)</option>
                                             <option value="select_ordered">順序標籤 (依序點選)</option>
                                             <option value="lunar">農曆日期</option>
                                             <option value="textarea">多行備註</option>
                                          </select>
                                       </div>
                                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                          <button onClick={() => {
                                             const next = [...editingForm.fields];
                                             const copyField = JSON.parse(JSON.stringify(field));
                                             copyField.label = copyField.label + ' (複製)';
                                             next.splice(idx + 1, 0, copyField);
                                             setEditingForm({ ...editingForm, fields: next });
                                          }} className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all" title="向下複製此欄位">⧉</button>
                                          <button onClick={() => {
                                             const next = editingForm.fields.filter((_: any, i: number) => i !== idx); setEditingForm({ ...editingForm, fields: next });
                                          }} className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all" title="刪除此欄位">✕</button>
                                       </div>
                                    </div>
                                    {(field.type === 'select_single' || field.type === 'select_multiple' || field.type === 'select_ordered' || field.type === 'select') && (
                                       <div className="ml-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">選項設計 (請用 / 分隔)</label>
                                          <input value={field.optionsStr !== undefined ? field.optionsStr : (field.options || []).join('/')} onChange={e => {
                                             const next = [...editingForm.fields];
                                             next[idx].optionsStr = e.target.value;
                                             next[idx].options = e.target.value.split('/').map((s: string) => s.trim()).filter(Boolean);
                                             setEditingForm({ ...editingForm, fields: next });
                                          }} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-600 transition-all text-indigo-600 placeholder:text-slate-300" placeholder="例如：柏油路/水泥路/石頭路/爛泥路" />
                                       </div>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="pt-12 flex gap-6 mt-12">
                        <button onClick={async () => { await saveForm(editingForm); await loadData(); setEditingForm(null); }} className="flex-1 bg-slate-900 text-white py-6 rounded-2xl font-bold text-sm shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest">發布建模並儲存</button>
                        <button onClick={() => {
                           const tName = prompt('請輸入此預設模組的名稱：', editingForm.name);
                           if (!tName) return;
                           const tpls = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`temple_form_templates_${templeId}`) || '[]') : [];
                           tpls.push({ name: tName, fields: editingForm.fields });
                           if (typeof window !== 'undefined') localStorage.setItem(`temple_form_templates_${templeId}`, JSON.stringify(tpls));
                           alert('✅ 已將目前設計儲存為預設模組！');
                        }} className="px-8 py-6 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-amber-100 transition-all">存為預設模組</button>
                        <button onClick={() => setEditingForm(null)} className="px-8 py-6 text-slate-400 font-bold text-sm">取消更改</button>
                     </div>
                  </div>

                  {/* 右半部：實時模擬預覽 (Simulator) */}
                  <div className="w-[480px] bg-slate-50/50 border-l border-slate-100 flex flex-col">
                     <div className="p-10 text-center border-b border-slate-100 bg-white">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Live Simulation</span>
                        <h4 className="text-sm font-bold text-slate-900 mt-2 italic underline underline-offset-4 decoration-indigo-200">信眾端手機預覽模式</h4>
                     </div>
                     <div className="flex-1 p-10 overflow-y-auto flex justify-center">
                        {/* 模擬手機外殼 */}
                        <div className="w-full md:max-w-[320px] bg-white rounded-[48px] shadow-2xl border-[10px] border-slate-900 h-[650px] overflow-hidden flex flex-col relative">
                           <div className="h-6 bg-slate-900 flex justify-center items-end pb-1"><div className="w-16 h-4 bg-slate-900 rounded-b-xl"></div></div>
                           <div className="flex-1 overflow-y-auto">
                              <header className="bg-indigo-600 p-6 text-white">
                                 <h5 className="text-sm font-bold truncate">{editingForm.name || '登記表單'}</h5>
                                 <p className="text-[9px] opacity-70 mt-1">順安聖皇宮 - 全方位數位登記</p>
                              </header>
                              <div className="p-6 space-y-6">
                                 {(editingForm.fields || []).map((f, i) => (
                                    <div key={i} className="space-y-2">
                                       <label className="text-[10px] font-bold text-slate-700 uppercase">{f.label}</label>
                                       {f.type === 'select_single' || f.type === 'select' ? (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                             {(f.options || ['單選A', '單選B']).map((opt: string) => (
                                                <div key={opt} className="px-3 py-2.5 rounded-lg border border-slate-100 text-[9px] font-bold text-slate-400 flex items-center gap-2 bg-white">
                                                   <div className="w-2.5 h-2.5 rounded-full border border-slate-200"></div> {opt}
                                                </div>
                                             ))}
                                          </div>
                                       ) : f.type === 'select_multiple' ? (
                                          <div className="flex flex-wrap gap-2">
                                             {(f.options || ['複選A', '複選B', '複選C']).map((opt: string) => (
                                                <div key={opt} className="px-3 py-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 text-[9px] font-bold text-indigo-500 flex items-center gap-1.5">
                                                   <div className="w-2 h-2 rounded-sm border border-indigo-300"></div> {opt}
                                                </div>
                                             ))}
                                          </div>
                                       ) : f.type === 'select_ordered' ? (
                                          <div className="flex flex-col gap-2">
                                             {(f.options || ['順序選項A', '順序選項B', '順序選項C']).map((opt: string, optIdx: number) => (
                                                <div key={opt} className="px-4 py-2.5 rounded-lg border border-amber-100 bg-amber-50/30 text-[10px] font-bold text-slate-600 flex items-center justify-between">
                                                   <span>{opt}</span>
                                                   {optIdx < 2 ? (
                                                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-sm">{optIdx + 1}</span>
                                                   ) : (
                                                      <span className="w-5 h-5 rounded-full border border-slate-200"></span>
                                                   )}
                                                </div>
                                             ))}
                                          </div>
                                       ) : f.type === 'textarea' ? (
                                          <div className="w-full h-20 bg-slate-50 border border-slate-100 rounded-xl"></div>
                                       ) : (
                                          <div className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl"></div>
                                       )}
                                    </div>
                                 ))}
                                 {(editingForm.fields || []).length === 0 && (
                                    <div className="py-20 text-center text-slate-200 italic text-[10px] leading-relaxed">
                                       建模工作區尚無欄位<br />請點擊「✨ AI 分析」自動提取
                                    </div>
                                 )}
                                 <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest mt-4 opacity-40">確認提交登記</button>
                              </div>
                           </div>
                           <div className="h-10 bg-slate-50 border-t flex items-center justify-center">
                              <div className="w-24 h-1 bg-slate-200 rounded-full"></div>
                           </div>
                        </div>
                     </div>
                     <div className="p-8 bg-indigo-50/50 border-t border-indigo-100">
                        <p className="text-[10px] text-indigo-600 font-bold leading-relaxed italic">
                           💡 模擬器說明：此區域顯示真實信眾在手機端的操作體驗。您可以即時在左側編輯，觀察這裡的版面變化。
                        </p>
                     </div>
                  </div>

               </div>
            </div>
         )}

         {/* 🚀 服務項目編輯面板 */}
         {editingService && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-end bg-slate-900/10 backdrop-blur-[2px] animate-in fade-in duration-300">
               <div className="w-full md:max-w-[600px] bg-white h-screen shadow-[-40px_0_100px_rgba(0,0,0,0.1)] p-6 md:p-16 overflow-y-auto animate-in slide-in-from-right duration-500 flex flex-col">
                  <div className="flex justify-between items-center mb-16">
                     <div>
                        <h3 className="text-3xl font-bold text-slate-900">服務配置</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Logic & Form Linking</p>
                     </div>
                     <button onClick={() => setEditingService(null)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-xl hover:bg-slate-100 transition-all">✕</button>
                  </div>
                  <div className="space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">服務項目名稱</label>
                           <input value={editingService.name} onChange={e => setEditingService({ ...editingService, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 font-bold text-lg outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">服務預設費用 (填 0 即隨喜功德)</label>
                           <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                              <input type="number" min="0" value={editingService.price ?? 0} onChange={e => setEditingService({ ...editingService, price: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-8 py-5 font-bold text-lg outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" />
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">連結登記表單</label>
                           <select value={editingService.linkedFormId || ''} onChange={e => setEditingService({ ...editingService, linkedFormId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none cursor-pointer">
                              <option value="">-- 無連結表單 --</option>
                              {forms.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest ml-1">🖨️ 列印/下載版型</label>
                           <select value={editingService.linkedPrintTemplateId || ''} onChange={e => setEditingService({ ...editingService, linkedPrintTemplateId: e.target.value })} className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none cursor-pointer focus:border-indigo-500">
                              <option value="">-- 預設空白版型 --</option>
                              {printTemplates?.map((pt: any) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">服務狀態</label>
                           <select value={editingService.status} onChange={e => setEditingService({ ...editingService, status: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none cursor-pointer">
                              <option value="Active">啟用中 (Active)</option>
                              <option value="Disabled">已停用 (Disabled)</option>
                           </select>
                        </div>
                     </div>
                  </div>
                  <div className="mt-auto pt-12 flex gap-6">
                     <button onClick={async () => { await saveServiceDefinition(editingService); await loadData(); setEditingService(null); }} className="flex-1 bg-slate-900 text-white py-6 rounded-2xl font-bold text-sm shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest">儲存服務配置</button>
                     <button onClick={() => setEditingService(null)} className="px-8 py-6 text-slate-400 font-bold text-sm">取消</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

// --- 主控制器 ---
export default function ServicesManagement() {
   const [activeTab, setActiveTab] = useState('services');
   const [services, setServices] = useState<any[]>([]);
   const [forms, setForms] = useState<any[]>([]);
   const [printTemplates, setPrintTemplates] = useState<any[]>([]);
   const [staffList, setStaffList] = useState<any[]>([]);
   const [availableSlots, setAvailableSlots] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isMobile, setIsMobile] = useState(false);

   const handleDeleteService = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm('確定要刪除此服務項目嗎？此操作無法還原。')) return;
      
      const { deleteServiceDefinition } = await import('@/app/actions');
      await deleteServiceDefinition(id);
      loadData();
   };

   const loadData = async () => {
      setIsLoading(true);
      try {
         const [s, f, st, sl, pt] = await Promise.all([
            fetchServiceDefinitions(), fetchForms(), fetchStaff(), fetchAvailableSlots(), fetchPrintTemplates()
         ]);
         setServices(Array.isArray(s) ? s : []);
         setForms(Array.isArray(f) ? f : []);
         setStaffList(Array.isArray(st) ? st : []);
         setAvailableSlots(Array.isArray(sl) ? sl : []);
         setPrintTemplates(Array.isArray(pt) ? pt : []);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
   };

   useEffect(() => {
      loadData();
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
   }, []);

   if (isLoading) return <div className="h-screen flex items-center justify-center font-bold text-slate-300 animate-pulse tracking-[0.5em] italic text-xl">系統資料加載中...</div>;

   const commonProps = { services, forms, printTemplates, staffList, availableSlots, loadData, activeTab, setActiveTab, handleDeleteService };

   return isMobile ? <AdminMobileView {...commonProps} /> : <AdminDesktopView {...commonProps} />;
}
