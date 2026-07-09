// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { upgradeStorage, uploadCustomerMedia, StorageInfo, fetchGuestFiles, GuestFile, AnalyticsSettings } from '@/app/actions';
import AppointmentManager from './AppointmentManager';

interface DashboardContainerProps {
  initialAppointments: any[];
  agiStats: any;
  todayCount: number;
  guests: any[];
  storageInfo: StorageInfo;
  queueSummary: any[];
  analyticsSettings: AnalyticsSettings;
  analyticsData: any;
}

export default function DashboardContainer({ 
  initialAppointments, 
  agiStats, 
  todayCount,
  guests,
  storageInfo: initialStorage,
  queueSummary,
  analyticsSettings,
  analyticsData
}: DashboardContainerProps) {
  const [viewMode, setViewMode] = useState<'analytics' | 'management'>('management');
  
  // Quick Action States
  const [selectedGuestPhone, setSelectedGuestPhone] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [uploadType, setUploadType] = useState<'photo' | 'video' | 'file'>('photo');
  const [isUploading, setIsUploading] = useState(false);
  const [storage, setStorage] = useState(initialStorage);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Real File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  
  // Guest Space View States
  const [viewingGuestFiles, setViewingGuestFiles] = useState<GuestFile[] | null>(null);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);

  // Time Greeting
  const [greeting, setGreeting] = useState("您好");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("早安");
    else if (hour < 18) setGreeting("午安");
    else setGreeting("晚安");
  }, []);

  // Filtered Guests for search
  const filteredGuests = useMemo(() => {
    if (!guestSearch) return [];
    const query = String(guestSearch).trim().toLowerCase();
    if (!query) return [];
    return (guests || []).filter(g => {
      const nameMatch = g && g.name && String(g.name).toLowerCase().includes(query);
      const phoneMatch = g && g.phone && String(g.phone).includes(query);
      return nameMatch || phoneMatch;
    }).slice(0, 10);
  }, [guests, guestSearch]);

  // Auto-select guest if search query exactly/uniquely matches
  useEffect(() => {
    if (!guestSearch) {
      setSelectedGuestPhone("");
      return;
    }
    const query = String(guestSearch).trim().toLowerCase();
    const exactMatch = (guests || []).find(g => 
      g && (String(g.phone) === query || String(g.name).toLowerCase() === query || `${g.name} (${g.phone})` === guestSearch)
    );
    if (exactMatch) {
      setSelectedGuestPhone(exactMatch.phone);
    }
  }, [guestSearch, guests]);

  const stats = useMemo(() => {
    const total = initialAppointments.length;
    const completed = initialAppointments.filter(a => a.status === 'Completed').length;
    const pending = initialAppointments.filter(a => a.status === 'Pending').length;
    return { total, completed, pending };
  }, [initialAppointments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedGuestPhone) return;
    if (!selectedFile) {
      setFileError("請先選擇或拖入要上傳的檔案");
      return;
    }
    setIsUploading(true);
    await new Promise(r => setTimeout(r, 1500));
    
    // Create a beautiful simulated path utilizing the real file name
    const mockUrl = `/uploads/${Date.now()}_${selectedFile.name}`;
    
    await uploadCustomerMedia(selectedGuestPhone, mockUrl, uploadType, 'Temple', selectedFile.name);
    
    // Add file size to storage used (GB representation)
    const fileSizeGb = Number((selectedFile.size / (1024 * 1024 * 1024)).toFixed(4)) || 0.01;
    setStorage(prev => ({ ...prev, used: prev.used + fileSizeGb }));
    setIsUploading(false);
    setSelectedFile(null);
    alert(`✨ 檔案「${selectedFile.name}」已成功上傳並歸檔至該信眾的手機連動空間中！`);
  };

  const handleViewGuestSpace = async () => {
    if (!selectedGuestPhone) return;
    setIsFetchingFiles(true);
    const files = await fetchGuestFiles(selectedGuestPhone);
    setViewingGuestFiles(files);
    setIsFetchingFiles(false);
  };

  const handleUpgrade = async (tier: number) => {
    await upgradeStorage(tier);
    const totals = [5, 20, 100, 500, 2000];
    setStorage(prev => ({ ...prev, tier, total: totals[tier-1] }));
    setShowUpgradeModal(false);
    alert(`雲端空間已成功升級至 ${totals[tier-1]}GB！`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{greeting}，管理員</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
             <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">聖皇宮 營運主控台</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200 self-start">
          <button 
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-1.5 rounded-md text-sm font-black transition-all ${viewMode === 'analytics' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            數據分析
          </button>
          <button 
            onClick={() => setViewMode('management')}
            className={`px-4 py-1.5 rounded-md text-sm font-black transition-all ${viewMode === 'management' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            即時管理
          </button>
        </div>
      </div>

      {viewMode === 'analytics' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">今日預約數</p>
                 <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-black border border-amber-100">LIVE</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">{todayCount}</h3>
              <div className="mt-3 text-xs text-slate-500">
                已完成 {stats.completed} 筆預約
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-l-4 border-l-amber-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">排隊與人流</p>
              {queueSummary.length > 0 ? (
                <div>
                   <h3 className="text-lg font-bold text-slate-800 truncate mb-2">{queueSummary[0].title}</h3>
                   <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-xs text-slate-500">候位中</p>
                        <p className="text-lg font-bold text-slate-800">{queueSummary[0].waiting}</p>
                      </div>
                      <div className="w-[1px] h-6 bg-slate-200"></div>
                      <div>
                        <p className="text-xs text-slate-500">已完成</p>
                        <p className="text-lg font-bold text-slate-400">{queueSummary[0].completed}</p>
                      </div>
                   </div>
                </div>
              ) : (
                <h3 className="text-lg font-medium text-slate-400 mt-1">目前無進行中活動</h3>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">客服轉換率</p>
              <h3 className="text-2xl font-bold text-slate-800">{Math.round((agiStats.conversions / (agiStats.totalQueries || 1)) * 100)}%</h3>
              <div className="mt-3 text-xs text-slate-500">
                總查詢次數：{agiStats.totalQueries} 次
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">雲端空間使用量</p>
                 <button onClick={() => setShowUpgradeModal(true)} className="text-[10px] text-amber-600 hover:text-amber-700 font-black uppercase tracking-widest">升級 ↗</button>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <h3 className="text-2xl font-bold text-slate-800">{storage?.isVip ? `${storage.used.toFixed(1)} GB` : storage.used.toFixed(1)}</h3>
                <span className="text-sm font-medium text-slate-500">{storage?.isVip ? `/ 無限使用` : `/ ${storage.total} GB`}</span>
              </div>
              {!storage?.isVip && (
                <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-1000" 
                    style={{ width: `${(storage.used / storage.total) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Card */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-800">快速作業主控</h3>
                <p className="text-xs text-slate-500 mt-1">處理信眾基本資料與檔案</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">客戶搜尋</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="輸入姓名或電話..."
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                    {guestSearch && filteredGuests.length > 0 && !selectedGuestPhone && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                        {filteredGuests.map((g) => (
                          <button 
                            key={g.phone}
                            onClick={() => {
                              setSelectedGuestPhone(g.phone);
                              setGuestSearch(`${g.name} (${g.phone})`);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium text-sm text-slate-800">{g.name}</p>
                              <p className="text-xs text-slate-500">{g.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedGuestPhone && (
                      <button 
                        onClick={() => { setSelectedGuestPhone(""); setGuestSearch(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-600">上傳類型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'photo', label: '照片' },
                      { id: 'video', label: '影片' },
                      { id: 'file', label: '文件' }
                    ].map((type) => (
                      <button 
                        key={type.id}
                        onClick={() => { setUploadType(type.id as any); setSelectedFile(null); setFileError(""); }}
                        className={`py-2 rounded-lg border text-sm transition-all ${uploadType === type.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-600">選擇要上傳的檔案</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="calendar-file-input"
                      className="hidden" 
                      accept={uploadType === 'photo' ? 'image/*' : uploadType === 'video' ? 'video/*' : '*/*'}
                      onChange={handleFileChange} 
                    />
                    <label 
                      htmlFor="calendar-file-input"
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all hover:bg-slate-50 ${selectedFile ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-300 bg-slate-50/50'}`}
                    >
                      {selectedFile ? (
                        <div className="text-center">
                          <span className="text-2xl">📄</span>
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[180px] mt-1">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-2xl">📤</span>
                          <p className="text-xs font-semibold text-slate-600 mt-1">點擊瀏覽檔案</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {uploadType === 'photo' ? '支援相片/圖片' : uploadType === 'video' ? '支援影音/影片' : '支援所有檔案格式'}
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  {fileError && <p className="text-[11px] text-red-500 font-bold mt-1">⚠️ {fileError}</p>}
                </div>

                <button 
                  onClick={handleUpload}
                  disabled={isUploading || !selectedGuestPhone || !selectedFile}
                  className="w-full bg-indigo-600 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-all text-sm mt-2"
                >
                  {isUploading ? "上傳中..." : "確認上傳檔案"}
                </button>
              </div>
            </div>

            {/* Analytics Content placeholder */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">數據決策看板</h3>
                  <p className="text-xs text-slate-500 mt-1">近期營運趨勢</p>
                </div>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-all">
                  匯出報告
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h4 className="text-sm font-semibold text-slate-700">客戶性別比例</h4>
                   <div className="aspect-square bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-center relative">
                      <div className="w-32 h-32 rounded-full border-[12px] border-indigo-100 border-t-indigo-500 border-r-indigo-500 flex items-center justify-center">
                         <div className="text-center">
                            <p className="text-xl font-bold text-slate-800">1,280</p>
                            <p className="text-xs text-slate-500">總人次</p>
                         </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-3">
                         <div className="flex-1 bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-center">
                            <p className="text-xs text-slate-500 mb-1">男性</p>
                            <p className="text-sm font-bold text-slate-800">38%</p>
                         </div>
                         <div className="flex-1 bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-center">
                            <p className="text-xs text-slate-500 mb-1">女性</p>
                            <p className="text-sm font-bold text-slate-800">62%</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-sm font-semibold text-slate-700">熱門服務項目</h4>
                   <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                      {[
                        { label: '專案諮詢', val: 45, color: 'bg-indigo-500' },
                        { label: '問題排解', val: 30, color: 'bg-blue-400' },
                        { label: '例行服務', val: 15, color: 'bg-sky-300' },
                        { label: '其他', val: 10, color: 'bg-slate-300' }
                      ].map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-600">{item.label}</span>
                            <span className="text-slate-800">{item.val}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                             <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4">
           <AppointmentManager initialAppointments={initialAppointments} />
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 text-center space-y-2 bg-slate-50 border-b border-slate-100 relative">
                 <h3 className="text-xl font-bold text-slate-800">升級雲端空間</h3>
                 <p className="text-sm text-slate-500">選擇適合您的儲存方案</p>
                 <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg">✕</button>
              </div>
              <div className="p-6 space-y-3">
                 {[
                   { tier: 1, gb: 5, price: '免費使用' },
                   { tier: 2, gb: 20, price: 'NT$ 1,200 / 年' },
                   { tier: 3, gb: 100, price: 'NT$ 4,800 / 年' },
                   { tier: 4, gb: 500, price: 'NT$ 12,000 / 年' }
                 ].map((plan) => (
                   <button 
                     key={plan.tier}
                     onClick={() => handleUpgrade(plan.tier)}
                     className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${storage.tier === plan.tier ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                   >
                     <div className="text-left">
                        <p className={`font-bold text-sm ${storage.tier === plan.tier ? 'text-indigo-700' : 'text-slate-800'}`}>{plan.gb} GB 儲存空間</p>
                        <p className={`text-xs mt-0.5 ${storage.tier === plan.tier ? 'text-indigo-500' : 'text-slate-500'}`}>{plan.price}</p>
                     </div>
                     {storage.tier === plan.tier && <span className="text-indigo-600 font-bold">✓</span>}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

