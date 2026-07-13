// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  fetchGuests, 
  fetchForms, 
  fetchGuestHistory, 
  saveDeepRecord, 
  uploadCustomerMedia, 
  fetchAllFilesByDate,
  fetchServiceDefinitions,
  fetchPrintTemplates,
  setFilePrivacy,
  createOrUpdateGuest,
  updateGuestPassword,
  ServiceForm,
  DeepRecord,
  GuestFile,
  ServiceDefinition,
  GuestRecord,
  LampCategory
} from '@/app/actions';
import { Solar } from 'lunar-javascript';

// 🎨 點燈類別專屬配色系統 (與點燈管理同步)
const CATEGORY_UI_CONFIG = [
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', fill: 'bg-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', fill: 'bg-rose-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', fill: 'bg-emerald-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', fill: 'bg-violet-500' },
  { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', fill: 'bg-sky-500' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', fill: 'bg-orange-500' },
];

const getUIStylesForCategory = (catName: string) => {
  const commonNames = ['光明燈', '太歲燈', '平安燈'];
  const idx = commonNames.indexOf(catName);
  return CATEGORY_UI_CONFIG[idx === -1 ? 3 : idx];
};

export default function DeepFileCenter() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600"></div>
         <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">初始化檔案中心中...</p>
      </div>
    }>
      <DeepFileCenterContent />
    </Suspense>
  );
}

function DeepFileCenterContent() {
  const [guests, setGuests] = useState<any[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'guest' | 'daily'>('guest');
  const [guestSubTab, setGuestSubTab] = useState<'appointments' | 'lamps' | 'media' | 'history' | 'merit' | 'account'>('appointments');
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [history, setHistory] = useState<{appointments: any[], records: DeepRecord[], files: GuestFile[], lampRecords: any[], activities: any[]}>({
    appointments: [],
    records: [],
    files: [],
    lampRecords: [],
    activities: []
  });

  const [forms, setForms] = useState<ServiceForm[]>([]);
  const [serviceDefs, setServiceDefs] = useState<ServiceDefinition[]>([]);
  const [printTemplates, setPrintTemplates] = useState<any[]>([]);
  const [activeForm, setActiveForm] = useState<{eventId: string, serviceType: string, form: ServiceForm | null} | null>(null);
  const [dynamicValues, setDynamicValues] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // 功德模組狀態
  const [meritService, setMeritService] = useState('');
  const [meritAmount, setMeritAmount] = useState('');
  const [meritPayer, setMeritPayer] = useState('本人');
  const [meritPayerName, setMeritPayerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'現金' | '匯款'>('現金');
  const [lastFive, setLastFive] = useState('');
  const [viewingRecord, setViewingRecord] = useState<DeepRecord | null>(null);

  const lunarInfo = useMemo(() => {
    if (!selectedGuest?.birthday) return null;
    try {
      const parts = selectedGuest.birthday.split('-');
      if (parts.length !== 3) return null;
      const solar = Solar.fromYmd(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      const lunar = solar.getLunar();
      const rocYear = parseInt(parts[0]) - 1911;
      
      const formattedLunar = `民國 ${rocYear}年 ${lunar.getYearInGanZhi()}年（${lunar.getYearShengXiao()}年）${lunar.getMonthInChinese()}月初${lunar.getDayInChinese().replace('初初', '初')}`;
      const correctLunar = formattedLunar.includes('初十') || formattedLunar.includes('二十') || formattedLunar.includes('三十') || (!formattedLunar.includes('初一') && !formattedLunar.includes('初二') && !formattedLunar.includes('初三') && !formattedLunar.includes('初四') && !formattedLunar.includes('初五') && !formattedLunar.includes('初六') && !formattedLunar.includes('初七') && !formattedLunar.includes('初八') && !formattedLunar.includes('初九')) ? `民國 ${rocYear}年 ${lunar.getYearInGanZhi()}年（${lunar.getYearShengXiao()}年）${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}` : `民國 ${rocYear}年 ${lunar.getYearInGanZhi()}年（${lunar.getYearShengXiao()}年）${lunar.getMonthInChinese()}月初${lunar.getDayInChinese().replace('初初', '初')}`;

      // 修正常見的農曆日期錯誤
      const finalLunar = `民國 ${rocYear}年 ${lunar.getYearInGanZhi()}年（${lunar.getYearShengXiao()}年）${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;

      const suici = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`;
      const shengxiao = `屬${lunar.getYearShengXiao()}`;
      const week = `星期${solar.getWeekInChinese()}`;
      
      return { formattedLunar: finalLunar, suici, shengxiao, week };
    } catch (e) {
      return null;
    }
  }, [selectedGuest?.birthday]);

  const loadBaseData = async () => {
    try {
      setIsLoading(true);
      const [guestsData, formsData, defsData] = await Promise.all([
        fetchGuests(), 
        fetchForms(),
        fetchServiceDefinitions()
      ]);
      setGuests(guestsData || []);
      setForms(formsData || []);
      setServiceDefs(defsData || []);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  useEffect(() => { loadBaseData(); }, []);

  useEffect(() => {
    if (selectedGuest) { loadHistory(selectedGuest.phone); }
  }, [selectedGuest, guestSubTab]);

  const loadHistory = async (phone: string) => {
    setIsHistoryLoading(true);
    const data = await fetchGuestHistory(phone);
    setHistory(data as any);
    setIsHistoryLoading(false);
  };

  // 1. 統合紀錄日誌
  const unifiedLogs = useMemo(() => {
    const logs: any[] = [];
    history.activities?.forEach(act => {
       const isMeritAct = act.content.includes('功德');
       logs.push({ 
         type: act.type, 
         date: act.timestamp.split(' ')[0], 
         time: act.timestamp.split(' ')[1] || '---', 
         title: isMeritAct ? `✨ ${act.content}` : '自動日誌', 
         desc: isMeritAct ? '案卷已同步至管理系統' : act.content, 
         icon: isMeritAct ? '✨' : '⚡', 
         color: isMeritAct ? 'amber' : 'indigo' 
       });
    });
    history.appointments.forEach(app => {
      logs.push({ type: 'APPOINTMENT', date: app.date || app.time.split('T')[0], time: app.time.includes('T') ? app.time.split('T')[1] : (app.time || '00:00'), title: `預約：${app.service}`, desc: `狀態：${app.status} | 負責人：${app.staff}`, icon: '📅', color: 'blue', paymentRef: app.paymentRef, paymentProofUrl: app.paymentProofUrl });
    });
    history.records.forEach(rec => {
      const isMerit = rec.serviceType.includes('功德');
      const detailDesc = isMerit && rec.values ? Object.entries(rec.values).map(([k, v]) => `${k}: ${v}`).join(' | ') : `由 ${rec.staffName} 老師處理`;
      let title = isMerit ? rec.serviceType : `案卷歸檔：${rec.serviceType}`;
      if (isMerit && rec.values) {
        title = `${rec.serviceType} (${rec.values['金額']} / ${rec.values['付款人']})`;
      }
      logs.push({ type: 'RECORD', date: rec.date, time: '---', title: title, desc: detailDesc, icon: isMerit ? '✨' : '📜', color: isMerit ? 'amber' : 'emerald' });
    });
    history.lampRecords?.forEach(lamp => {
      logs.push({ type: 'LAMP', date: lamp.startDate, time: '---', title: `安奉燈位：${lamp.categoryName}`, desc: `狀態：${lamp.status} | 圓滿日：${lamp.expiryDate}`, icon: '🏮', color: 'amber', paymentRef: lamp.paymentRef, paymentProofUrl: lamp.paymentProofUrl });
    });
    history.eventRegistrations?.forEach(evt => {
      logs.push({ type: 'EVENT', date: evt.timestamp?.split('T')[0] || evt.timestamp, time: '---', title: `活動：${evt.title}`, desc: `狀態：${evt.status || '成功'}`, icon: '🎉', color: 'indigo', paymentRef: evt.paymentRef, paymentProofUrl: evt.paymentProofUrl });
    });
    history.queueTickets?.forEach(qt => {
      logs.push({ type: 'QUEUE', date: qt.date || qt.scannedAt, time: '---', title: `排隊：現場服務`, desc: `號碼：${qt.ticketNumber} | 狀態：${qt.status}`, icon: '🎟️', color: 'emerald', paymentRef: qt.paymentRef, paymentProofUrl: qt.paymentProofUrl });
    });
    history.files.forEach(file => {
      logs.push({ type: 'MEDIA', date: file.folder, time: '---', title: `媒體歸檔：${file.type === 'photo' ? '照片' : '影片'}`, desc: `來源：${file.uploadedBy}`, icon: '🎬', color: 'indigo' });
    });
    return logs.sort((a, b) => new Date(`${b.date} ${a.time === '---' ? '00:00' : a.time}`).getTime() - new Date(`${a.date} ${a.time === '---' ? '00:00' : a.time}`).getTime());
  }, [history]);

  const groupedMedia = useMemo(() => {
    const groups: { [key: string]: GuestFile[] } = {};
    history.files.forEach(file => {
      const typeText = file.type === 'photo' ? '圖片' : file.type === 'video' ? '影音' : '文件';
      const folderKey = `${typeText} ${file.folder.replace(/-/g, '.')}`;
      if (!groups[folderKey]) groups[folderKey] = [];
      groups[folderKey].push(file);
    });
    return Object.keys(groups).sort().reverse().map(key => ({ title: key, files: groups[key] }));
  }, [history.files]);

  const filteredGuests = useMemo(() => {
    return guests.filter(g => g.name.includes(searchTerm) || g.phone.includes(searchTerm));
  }, [guests, searchTerm]);

  const handleOpenForm = (event: any) => {
    const def = serviceDefs.find(d => (event.serviceId && d.id === event.serviceId) || d.name?.trim() === event.service?.trim());
    const form = forms.find(f => f.id === def?.linkedFormId) || null;
    
    let initialValues: any = {};
    if (form && selectedGuest) {
      form.fields.forEach((field: any) => {
        const label = field.label || '';
        if (label.includes('姓名') || label.includes('名字')) {
          initialValues[label] = selectedGuest.name || '';
        } else if (label.includes('電話') || label.includes('手機')) {
          initialValues[label] = selectedGuest.phone || '';
        } else if (label.includes('生日') || label.includes('出生') || label.includes('生辰')) {
          initialValues[label] = selectedGuest.birthday || '';
        } else if (label.includes('地址') || label.includes('住址')) {
          initialValues[label] = selectedGuest.address || '';
        }
      });
    }

    setDynamicValues(initialValues);
    setActiveForm({ eventId: event.id.toString(), serviceType: event.service, form: form });
  };

  const handleSaveRecord = async (values: any) => {
    if (!selectedGuest || !activeForm) return;
    setIsSaving(true);
    const { saveDeepRecord, updateDeepRecord } = await import('@/app/actions');
    
    if (activeForm.recordId) {
      await updateDeepRecord(activeForm.recordId, selectedGuest.phone, '管理人員', values);
    } else {
      await saveDeepRecord(selectedGuest.phone, activeForm.eventId, activeForm.serviceType, '管理人員', values);
    }
    
    // Auto-save form into media only if it's a new record
    if (!activeForm.recordId) {
      try {
         const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
         const fileName = `${activeForm.serviceType}_${dateStr}.pdf`;
         await uploadCustomerMedia(selectedGuest.phone, `/icons/form-pdf-icon.png`, 'file', '系統自動歸檔', fileName);
      } catch (e) { console.error('Failed to auto-archive form:', e); }
    }

    await loadHistory(selectedGuest.phone);
    setActiveForm(null);
    setIsSaving(false);
  };

  const handleSaveMerit = async () => {
    if (!selectedGuest || !meritAmount || !meritService) { alert("⚠️ 請輸入完整的服務與金額資訊！"); return; }
    setIsSaving(true);
    const meritValues = { 
      '金額': `NT$ ${Number(meritAmount).toLocaleString()}`, 
      '付款人': meritPayer === '他人' ? `他人 (${meritPayerName})` : '本人', 
      '支付方式': paymentMethod + (paymentMethod === '匯款' ? ` (末五碼: ${lastFive})` : '') 
    };

    const { completeMeritPayment } = await import('@/app/actions');
    await completeMeritPayment(selectedGuest.phone, 'MERIT-' + Date.now(), Number(meritAmount), meritService);

    await saveDeepRecord(selectedGuest.phone, 'MERIT-' + Date.now(), `功德錄入：${meritService}`, '管理中心', meritValues);
    setMeritAmount(''); setMeritService(''); setLastFive(''); setMeritPayerName('');
    await loadHistory(selectedGuest.phone);
    setIsSaving(false);
    alert(`✨ 【${meritService}】功德紀錄已成功錄入，活動日誌已自動同步！`);
    setGuestSubTab('history'); 
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'photo' | 'video' | 'file'>('photo');

  const triggerFileBrowser = (type: 'photo' | 'video' | 'file') => {
    setUploadType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'photo' ? 'image/*' : type === 'video' ? 'video/*' : '*/*';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGuest) return;
    setIsSaving(true);
    
    // 為了讓展示環境中，使用者能「真的」看到自己上傳的影片與照片，
    // 我們使用瀏覽器原生的 URL.createObjectURL 來產生一個本地的預覽連結，
    // 取代原本會 404 的假路徑 (/uploads/...)。
    const previewUrl = URL.createObjectURL(file);
    
    await uploadCustomerMedia(selectedGuest.phone, previewUrl, uploadType, 'Temple', file.name);
    await loadHistory(selectedGuest.phone);
    setIsSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert(`✨ 檔案「${file.name}」已成功上傳並歸檔至該信眾檔案庫中！`);
  };

  const handleCreateGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const res = await createOrUpdateGuest(data as any, selectedGuest?.phone);
    if (res.success) {
      await loadBaseData();
      setShowAddModal(false);
      // 如果原本有選擇信眾，且這次更新了手機，需要同步更新 selectedGuest
      if (selectedGuest) {
        setSelectedGuest({ ...selectedGuest, ...data });
      }
      alert("✅ 信眾資料已成功建立/更新！");
    } else {
      alert(`⚠️ ${res.error || "建立或更新失敗，請重試！"}`);
    }
  };

  const renderPreviewModal = () => {
    if (!previewFile) return null;
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6" style={{ zIndex: 99999 }}>
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-3xl overflow-hidden border-4 border-slate-900 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
          <header className="p-8 border-b-2 border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter truncate max-w-[320px]">{previewFile.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">檔案即時檢視中心 | {previewFile.uploadedBy === 'Temple' ? '宮廟上傳' : '信眾上傳'}</p>
            </div>
            <button onClick={() => setPreviewFile(null)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl hover:rotate-95 transition-all shadow-sm">✕</button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center justify-center min-h-[300px] bg-white">
            {previewFile.type === 'photo' ? (
              <img 
                src={previewFile.url} 
                className="max-w-full max-h-[50vh] object-contain rounded-3xl shadow-md border border-slate-100" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.getAttribute('data-error-handled')) return;
                  target.setAttribute('data-error-handled', 'true');
                  target.src = "https://images.unsplash.com/photo-1543884149-bc91b61972ec?auto=format&fit=crop&q=80";
                }}
              />
            ) : previewFile.type === 'video' ? (
              <div className="w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
                <video 
                  src={previewFile.url} 
                  controls 
                  autoPlay
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLVideoElement;
                    if (target.getAttribute('data-error-handled')) return;
                    target.setAttribute('data-error-handled', 'true');
                    target.src = "https://www.w3schools.com/html/mov_bbb.mp4";
                  }}
                />
              </div>
            ) : (
              <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-[35px] flex flex-col overflow-hidden min-h-[50vh]">
                <div className="p-6 border-b-2 border-slate-100 flex items-center gap-4 bg-white shrink-0">
                  <div className="text-3xl">📄</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-900 text-lg truncate">{previewFile.name || '文件檢視'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{previewFile.folder}</p>
                  </div>
                </div>
                
                {previewFile.url?.startsWith('blob:') || previewFile.name?.toLowerCase().endsWith('.pdf') ? (
                   <iframe src={previewFile.url} className="w-full flex-1 bg-white" title={previewFile.name} />
                ) : (
                   <div className="flex-1 p-10 flex flex-col items-center justify-center text-slate-500 space-y-4">
                      <div className="text-6xl opacity-20">🗂️</div>
                      <p className="font-bold text-sm">本格式暫不支援直接預覽，請點擊下方按鈕下載或開啟原檔</p>
                      <p className="text-xs text-slate-400 font-mono">File: {previewFile.name}</p>
                   </div>
                )}
              </div>
            )}
          </div>
          
          <footer className="p-8 border-t-2 border-slate-100 bg-slate-50 flex gap-4 shrink-0">
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewFile.url;
                link.download = previewFile.name;
                link.target = '_blank';
                link.click();
              }}
              className="flex-1 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 text-center"
            >
              📥 下載 / 在新分頁開啟檔案原檔
            </button>
          </footer>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-200 space-y-6">
          <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="text-2xl">📜</div><h2 className="text-lg font-medium text-slate-900">信眾檔案庫</h2></div><button onClick={() => { setSelectedGuest(null); setShowAddModal(true); }} className="w-8 h-8 text-slate-400 hover:text-slate-900 flex items-center justify-center text-xl transition-colors">＋</button></div>
          <input type="text" placeholder="搜尋姓名或電話..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent border-b border-slate-200 py-2 text-sm font-medium focus:border-slate-900 outline-none placeholder:text-slate-400 transition-colors" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredGuests.map((guest) => (
            <button key={guest.phone} onClick={() => { setSelectedGuest(guest); setActiveTab('guest'); }} className={`w-full py-4 px-8 text-left transition-colors flex items-center gap-4 ${selectedGuest?.phone === guest.phone ? "border-l-2 border-slate-900 bg-slate-50 text-slate-900" : "border-l-2 border-transparent hover:bg-slate-50 text-slate-500"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${selectedGuest?.phone === guest.phone ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>{guest.name[0]}</div>
              <div className="overflow-hidden"><div className="text-sm font-medium truncate">{guest.name}</div><div className="text-xs tracking-wider opacity-70">{guest.phone}</div></div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-white flex flex-col">
        {activeTab === 'guest' && selectedGuest ? (
          <>
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-12 pt-12 pb-0 flex flex-col gap-8">
              <div className="flex items-center justify-between w-full">
                 <h2 className="text-3xl font-medium text-slate-900">{selectedGuest.name}</h2>
                 <button onClick={() => setShowAddModal(true)} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">編輯資料</button>
              </div>
              <nav className="flex gap-8 overflow-x-auto scrollbar-hide w-full">
{[{ id: 'appointments', label: '預約' }, { id: 'lamps', label: '點燈' }, { id: 'events', label: '活動' }, { id: 'queue', label: '排隊' }, { id: 'media', label: '媒體' }, { id: 'history', label: '紀錄' }, { id: 'merit', label: '功德' }, { id: 'account', label: '帳號' }].map((tab) => (<button key={tab.id} onClick={() => setGuestSubTab(tab.id as any)} className={`pb-4 text-sm font-medium transition-colors border-b-2 ${guestSubTab === tab.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>{tab.label}</button>))}</nav>
            </div>

            <div className="p-12 space-y-12 max-w-5xl">
               {/* Quick Info */}
               <div className="bg-slate-50 rounded-[35px] border-2 border-slate-100 p-8 relative group mb-8">
                  <div onClick={() => setShowAddModal(true)} className="absolute right-6 top-6 flex items-center justify-center gap-2 cursor-pointer bg-white px-5 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all opacity-0 group-hover:opacity-100 shadow-sm z-10">
                     <span className="text-sm">✏️</span>
                     <span className="text-[10px] font-black uppercase tracking-widest">快速修改資料</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                     <div className="md:col-span-3 space-y-2 cursor-pointer group/item" onClick={() => setShowAddModal(true)}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">聯絡電話 <span className="opacity-0 group-hover/item:opacity-100 transition-opacity">✏️</span></p>
                        <p className="text-xl font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors">{selectedGuest.phone}</p>
                     </div>
                     <div className="md:col-span-5 space-y-2 cursor-pointer group/item" onClick={() => setShowAddModal(true)}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">生日 <span className="opacity-0 group-hover/item:opacity-100 transition-opacity">✏️</span></p>
                        <div className="flex flex-col gap-2">
                           <span className="text-xl font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors">{selectedGuest.birthday || '未提供'}</span>
                           <div className="flex flex-wrap gap-2">
                              {lunarInfo ? (
                                <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-[10px] border border-slate-200 shadow-sm">
                                  {lunarInfo.formattedLunar}
                                </span>
                              ) : selectedGuest.lunarBirthday ? (
                                <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-[10px] border border-slate-200 shadow-sm">{selectedGuest.lunarBirthday}</span>
                              ) : null}
                              {selectedGuest.birthHour && <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-[10px] border border-slate-200 shadow-sm">{selectedGuest.birthHour}</span>}
                           </div>
                           {lunarInfo && (
                             <div className="flex gap-3 mt-1">
                                <span className="text-[10px] font-bold text-slate-400">歲次：{lunarInfo.suici}</span>
                                <span className="text-[10px] font-bold text-slate-400">生肖：{lunarInfo.shengxiao}</span>
                                <span className="text-[10px] font-bold text-slate-400">星期：{lunarInfo.week}</span>
                             </div>
                           )}
                        </div>
                     </div>
                     <div className="md:col-span-4 space-y-2 cursor-pointer group/item" onClick={() => setShowAddModal(true)}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">通訊地址 <span className="opacity-0 group-hover/item:opacity-100 transition-opacity">✏️</span></p>
                        <p className="text-base font-bold text-slate-900 leading-relaxed group-hover/item:text-indigo-600 transition-colors pr-20">{selectedGuest.address || '未提供'}</p>
                     </div>
                  </div>
               </div>

               {/* TAB: 點燈 (關鍵連動與視覺同步) */}
               {guestSubTab === 'lamps' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                     <div className="flex justify-between items-center w-full"><h3 className="text-xl font-medium text-slate-900">祈福點燈現況</h3></div>
                     <div className="flex flex-col">
                        {history.lampRecords?.length > 0 ? (
                           history.lampRecords.map((lamp: any) => {
                             const styles = getUIStylesForCategory(lamp.categoryName);
                             const today = new Date();
                             const expiry = new Date(lamp.expiryDate);
                             const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                             const isExpired = diffDays <= 0;
                             
                             return (
                               <div key={lamp.id} className="bg-white rounded-[50px] border-2 border-slate-50 p-10 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                                  <div className="flex items-center justify-between mb-8">
                                     <div className="flex items-center gap-6">
                                        {/* 🎨 同步彩色 Icon 外圈 */}
                                        <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center text-3xl border-4 shadow-sm ${styles.bg} ${styles.border}`}>🕯️</div>
                                        <div>
                                           <h4 className="text-2xl font-black text-slate-900 italic flex items-center gap-3">
                                              {lamp.categoryName}
                                              {lamp.guestName && lamp.guestName !== selectedGuest.name && (
                                                 <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full not-italic tracking-widest">家人代點：{lamp.guestName}</span>
                                              )}
                                           </h4>
                                           <p className={`text-xs font-black uppercase tracking-widest ${styles.text} mt-1`}>核定案號：{lamp.id}</p>
                                        </div>
                                     </div>
                                     <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase border-2 ${lamp.status === 'Cancelled' ? 'bg-slate-100 text-slate-400 border-slate-200' : isExpired ? 'bg-rose-50 text-rose-600 border-rose-100' : lamp.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{lamp.status === 'Cancelled' ? '已取消' : isExpired ? '已屆期' : lamp.status === 'Pending' ? '等待安奉' : '安奉中'}</span>
                                  </div>
                                  <div className="bg-slate-50 p-8 rounded-3xl mb-8 flex justify-center items-center">
                                     <div className="text-center"><p className="text-[9px] font-black text-slate-300 uppercase mb-1">安奉結緣金</p><p className="text-xl font-black text-slate-900">NT$ {lamp.price.toLocaleString()}</p></div>
                                  </div>
                                  <div className="flex justify-between items-end">
                                     <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">圓滿屆期日</p><p className="text-sm font-bold text-slate-900 font-mono">{lamp.expiryDate}</p></div>
                                     <div className="flex gap-4 items-center">
                                     {(lamp.paymentStatus === 'Pending' || lamp.paymentStatus === 'Unpaid' || lamp.paymentStatus === 'PENDING_REVIEW') && (
                                        <>
                                        <button 
                                          onClick={async () => {
                                            if (confirm('確定要標記已收款？')) {
                                              await import('@/app/actions').then(m => m.confirmPayment(lamp.id, 'Lamp'));
                                              if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors px-4 py-2 bg-slate-50 rounded-xl hover:bg-emerald-50"
                                        >
                                          標記已結帳 ✓
                                        </button>
                                        </>
                                     )}
                                     {lamp.status !== 'Cancelled' && lamp.paymentStatus === 'Paid' && (
                                        <div className="flex items-center gap-2">
                                           <span className="text-xs font-medium text-emerald-600 px-4 py-2">✓ 已結帳</span>
                                           <button 
                                              onClick={async () => {
                                                if (confirm('確定要取消已收款狀態（回到未付款）嗎？')) {
                                                  await import('@/app/actions').then(m => m.revertPayment(lamp.id, 'Lamp'));
                                                  if (selectedGuest) await loadHistory(selectedGuest.phone);
                                                }
                                              }}
                                              className="text-xs font-medium text-emerald-600 hover:text-rose-600 hover:line-through transition-colors"
                                           >
                                              (恢復未付款)
                                           </button>
                                        </div>
                                     )}
                                     {lamp.status !== 'Cancelled' && (
                                        <>
                                           {lamp.status === 'Pending' ? (
                                              <button 
                                                onClick={async () => {
                                                  if (confirm('確定要啟動安奉嗎？這將標記該點燈為服務中。')) {
                                                    await import('@/app/actions').then(m => m.activateLampRecord(lamp.id));
                                                    if (selectedGuest) await loadHistory(selectedGuest.phone);
                                                  }
                                                }}
                                                className="text-xs font-bold text-slate-400 hover:text-amber-600 transition-colors px-4 py-2 bg-slate-50 rounded-xl hover:bg-amber-50"
                                              >
                                                啟動安奉
                                              </button>
                                           ) : (
                                              <button 
                                                onClick={async () => {
                                                  if (confirm('確定要暫停安奉嗎？')) {
                                                    await import('@/app/actions').then(m => m.deactivateLampRecord(lamp.id));
                                                    if (selectedGuest) await loadHistory(selectedGuest.phone);
                                                  }
                                                }}
                                                className="text-xs font-bold text-slate-400 hover:text-amber-600 transition-colors px-4 py-2 bg-slate-50 rounded-xl hover:bg-amber-50"
                                              >
                                                暫停安奉
                                              </button>
                                           )}
                                           <button 
                                             onClick={async () => {
                                               if (confirm('確定要取消這個點燈項目嗎？這將同步取消信眾端的點燈。')) {
                                                 await import('@/app/actions').then(m => m.cancelServiceRecord(lamp.id, '點燈'));
                                                 if (selectedGuest) await loadHistory(selectedGuest.phone);
                                               }
                                             }}
                                             className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors px-4 py-2 bg-slate-50 rounded-xl hover:bg-rose-50"
                                           >
                                             取消點燈 ✕
                                           </button>
                                           <button onClick={async () => { if (confirm(`確定續點 ${lamp.categoryName}？`)) { const { renewLampRecord } = await import('@/app/actions'); await renewLampRecord(lamp.id, 365); await loadHistory(selectedGuest.phone); alert("🏮 續點成功！"); } }} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">快速續點 ➔</button>
                                        </>
                                     )}
                                     </div>
                                  </div>
                               </div>
                             );
                           })
                        ) : (
                          <div className="col-span-2 p-20 bg-slate-50 rounded-[50px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-30 text-center"><div className="text-7xl mb-6">🏮</div><p className="text-sm font-black uppercase tracking-widest">目前尚無點燈紀錄</p></div>
                        )}
                     </div>
                  </div>
               )}

               {/* TAB: 紀錄 (統合日誌) */}
               {guestSubTab === 'history' && (
                  <div className="space-y-8 animate-in fade-in duration-700 pb-20">
                     <h3 className="text-lg font-bold text-slate-900">統合活動日誌</h3>
                     <div className="space-y-4 relative pl-16 before:absolute before:left-4 before:top-4 before:bottom-4 before:w-1 before:bg-slate-100">
                        {unifiedLogs.length > 0 ? unifiedLogs.map((log, lidx) => (
                           <div key={lidx} className="bg-white border-2 border-slate-50 rounded-[35px] p-8 border-l-[10px] shadow-sm hover:shadow-xl transition-all" style={{ borderLeftColor: log.color === 'blue' ? '#3b82f6' : log.color === 'emerald' ? '#10b981' : log.color === 'amber' ? '#f59e0b' : log.color === 'indigo' ? '#6366f1' : '#cbd5e1' }}>
                              <div className="flex items-center gap-4 mb-3"><span className="text-[10px] font-black text-slate-400 font-mono tracking-widest">{log.date} {log.time}</span><span className="text-[9px] font-black text-white px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-sm" style={{ backgroundColor: log.color === 'blue' ? '#3b82f6' : log.color === 'emerald' ? '#10b981' : log.color === 'amber' ? '#f59e0b' : log.color === 'indigo' ? '#6366f1' : '#cbd5e1' }}>{log.type}</span></div>
                              <h4 className="text-xl font-black text-slate-900">{log.title === '自動日誌' ? '📔 系統連動日誌' : log.title}</h4>
                              <p className="text-sm font-bold text-slate-500 leading-relaxed mt-2">{log.desc}</p>
                              {(log.paymentRef || log.paymentProofUrl) && (
                                <div className="flex gap-2 items-center flex-wrap mt-3">
                                  {log.paymentRef && (
                                    <span className="text-[10px] font-bold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg flex items-center gap-1">
                                      <span>💳</span> 後五碼: {log.paymentRef}
                                    </span>
                                  )}
                                  {log.paymentProofUrl && (
                                    <button onClick={() => setPreviewFile({ type: 'photo', url: log.paymentProofUrl, name: '匯款截圖', folder: '對帳審核', uploadedBy: 'Guest' })} className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors px-3 py-1.5 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center gap-1">
                                      <span>📸</span> 查看截圖
                                    </button>
                                  )}
                                </div>
                              )}
                           </div>
                        )) : (
                          <div className="p-20 text-center opacity-20 font-black uppercase tracking-widest text-sm">尚無任何歷史活動</div>
                        )}
                     </div>
                  </div>
               )}

               {/* TAB: 功德 (自定義輸入版) */}
               {guestSubTab === 'merit' && (
                  <div className="space-y-10 animate-in fade-in duration-700 max-w-4xl">
                     <div className="bg-white border-4 border-slate-900 rounded-[60px] p-6 lg:p-16 shadow-3xl space-y-12">
                        <div className="flex items-center gap-8 pb-10 border-b-2 border-slate-50"><div className="w-24 h-24 bg-amber-50 rounded-[35px] flex items-center justify-center text-5xl shadow-2xl">✨</div><div><h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">功德支付管理</h3><p className="text-xs font-bold text-amber-600 uppercase tracking-[0.3em] mt-2">Payment Governance & Ledger</p></div></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">服務項目 (可自由打字)</label><input type="text" value={meritService} onChange={e=>setMeritService(e.target.value)} placeholder="如：盂蘭盆會、消災法會..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-6 text-xl font-black outline-none focus:border-amber-500 shadow-inner" /></div>
                           <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">核定金額</label><div className="relative"><span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 font-black">NT$</span><input type="number" value={meritAmount} onChange={e=>setMeritAmount(e.target.value)} placeholder="0" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] pl-20 pr-10 py-6 text-3xl font-black outline-none focus:border-amber-500 text-center" /></div></div>
                           <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">付款身分</label><div className="flex gap-4">{['本人', '他人'].map(p => (<button key={p} onClick={() => setMeritPayer(p)} className={`flex-1 py-5 rounded-2xl font-black text-xs border-2 transition-all ${meritPayer === p ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-400'}`}>{p}</button>))}</div></div>
                           <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">支付方式</label><div className="flex gap-4">{['現金', '匯款'].map(m => (<button key={m} onClick={() => setPaymentMethod(m as any)} className={`flex-1 py-5 rounded-2xl font-black text-xs border-2 transition-all ${paymentMethod === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-400'}`}>{m}</button>))}</div></div>
                        </div>
                        {(meritPayer === '他人' || paymentMethod === '匯款') && (
                           <div className="bg-slate-50 p-10 rounded-[40px] border-2 border-slate-100 space-y-8 animate-in slide-in-from-top-4">
                              {meritPayer === '他人' && (<div className="space-y-3"><label className="text-[10px] font-black text-indigo-600 ml-6 uppercase">代付人姓名</label><input value={meritPayerName} onChange={e=>setMeritPayerName(e.target.value)} placeholder="請輸入姓名" className="w-full bg-white border-2 border-slate-200 rounded-3xl px-8 py-5 text-xl font-black outline-none focus:border-indigo-600 shadow-sm" /></div>)}
                              {paymentMethod === '匯款' && (<div className="space-y-3"><label className="text-[10px] font-black text-indigo-600 ml-6 uppercase">匯款末五碼 (數位核對用)</label><input value={lastFive} onChange={e=>setLastFive(e.target.value)} maxLength={5} placeholder="00000" className="w-full bg-white border-2 border-slate-200 rounded-3xl px-8 py-5 text-3xl font-black tracking-[1em] outline-none focus:border-indigo-600 text-center shadow-sm" /></div>)}
                           </div>
                        )}
                        <button onClick={handleSaveMerit} disabled={isSaving} className="w-full py-10 bg-slate-900 text-amber-500 rounded-[40px] font-black text-sm uppercase tracking-[0.5em] shadow-3xl hover:bg-amber-500 hover:text-slate-950 transition-all active:scale-[0.98]">{isSaving ? '正在核定案卷...' : '確 定 核 定 功 德 錄 🚀'}</button>
                     </div>
                  </div>
               )}
               
               {/* 其餘分頁 (媒體、帳號、預約) 保持精簡一致 */}
               {guestSubTab === 'appointments' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                     <h3 className="text-lg font-bold text-slate-900">服務預約動態</h3>
                     <div className="space-y-6 relative pl-12 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:bg-slate-100">
                        {history.appointments.map((event) => {
                           const hasRecord = history.records.some(r => r.eventId === event.id.toString());
                           return (
                             <div key={event.id} className="relative group">
                                <div className={`absolute -left-[54px] top-6 w-10 h-10 rounded-2xl flex items-center justify-center text-lg z-10 shadow-xl border-4 border-white ${hasRecord ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-900'}`}>{hasRecord ? '✓' : '📅'}</div>
                                <div className="py-6 border-b border-slate-100 flex items-center justify-between group bg-white">
                                  <div className="flex justify-between items-center w-full">
                                    <div>
                                      <span className="text-xs font-medium text-slate-400 mb-1 inline-block">{event.date} {event.time}</span>
                                      <h4 className="text-base font-medium text-slate-900">{event.service}</h4>
                                      <p className="text-sm text-slate-500 mt-1">負責：{event.staff}</p>
                                    </div>
                                    <div className="flex flex-col gap-3 items-end">
                                      <div className="flex gap-3">
                                        {!hasRecord ? (<button onClick={() => handleOpenForm(event)} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">✍️ 表單 ➔</button>) : (<button onClick={() => { const rec = history.records.find(r => r.eventId === event.id.toString()); setViewingRecord(rec || null); }} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">👁️ 檢視表單</button>)}
                                      </div>
                                      {event.status === 'Arrived' ? (
                                        <span className="text-sm font-medium text-emerald-600 flex items-center gap-2 ml-4">
                                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 已到場
                                        </span>
                                      ) : (
                                        <button 
                                          onClick={async () => {
                                            if (confirm(`確定標記已抵達現場？`)) {
                                              await import('@/app/actions').then(m => m.markAppointmentAsArrived(event.id));
                                              if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors ml-4"
                                        >
                                          ✅ 標記為已到場
                                        </button>
                                      )}
                                      
                                      <div className="flex gap-2 items-center flex-wrap justify-end mt-2">
                                        {event.paymentRef && (
                                          <span className="text-[10px] font-bold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg flex items-center gap-1">
                                            <span>💳</span> 後五碼: {event.paymentRef}
                                          </span>
                                        )}
                                        {event.paymentProofUrl && (
                                          <button onClick={() => setPreviewFile({ type: 'photo', url: event.paymentProofUrl, name: '匯款截圖', folder: '對帳審核', uploadedBy: 'Guest' })} className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors px-3 py-1.5 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center gap-1">
                                            <span>📸</span> 查看截圖
                                          </button>
                                        )}
                                        {(event.paymentStatus === 'Pending' || event.paymentStatus === 'Unpaid' || event.paymentStatus === 'PENDING_REVIEW') && (
                                          <button 
                                            onClick={async () => {
                                              if (confirm('確定要標記已收款？')) {
                                                await import('@/app/actions').then(m => m.confirmPayment(event.id.toString(), 'Appointment'));
                                                if (selectedGuest) await loadHistory(selectedGuest.phone);
                                              }
                                            }}
                                            className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors ml-2 px-3 py-1 bg-red-50 rounded-lg border border-red-100"
                                          >
                                            ✅ 標記已收款
                                          </button>
                                        )}
                                        {event.paymentStatus === 'Paid' && (
                                          <button 
                                            onClick={async () => {
                                              if (confirm('確定要取消已收款狀態（回到未付款）嗎？')) {
                                                await import('@/app/actions').then(m => m.revertPayment(event.id.toString(), 'Appointment'));
                                                if (selectedGuest) await loadHistory(selectedGuest.phone);
                                              }
                                            }}
                                            className="text-sm font-medium text-emerald-600 ml-2 hover:text-rose-600 hover:line-through transition-colors"
                                          >
                                            ✓ 已結帳
                                          </button>
                                        )}
                                      </div>
                                      {event.status !== 'Cancelled' && (
                                        <button 
                                          onClick={async () => {
                                            if (confirm('確定要取消這個預約嗎？這將同步取消信眾端的預約。')) {
                                              await import('@/app/actions').then(m => m.cancelAppointment(Number(event.id)));
                                              if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="text-sm font-bold text-slate-400 hover:text-rose-600 transition-colors ml-4"
                                        >
                                          ❌ 取消預約
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
               )}

               {guestSubTab === 'events' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                     <h3 className="text-lg font-bold text-slate-900">法會活動報名紀錄</h3>
                     <div className="space-y-4">
                        {history.eventRegistrations?.length > 0 ? history.eventRegistrations.map((evt: any) => (
                           <div key={evt.id} className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                              <div>
                                 <h4 className="text-base font-bold text-slate-900">{evt.title}</h4>
                                 <p className="text-sm text-slate-500 mt-1">結緣金：{evt.price > 0 ? `$${evt.price}` : '隨喜'}</p>
                              </div>
                               <div className="flex flex-col items-end gap-2">
                                  <div className="flex gap-4 items-center">
                                     {(evt.paymentStatus === 'Pending' || evt.paymentStatus === 'Unpaid' || evt.paymentStatus === 'PENDING_REVIEW') && (
                                        <button 
                                          onClick={async () => {
                                            if (confirm('確定要標記已收款？')) {
                                              await import('@/app/actions').then(m => m.confirmPayment(evt.id, 'Event'));
                                              if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors px-3 py-2 bg-red-50 rounded-lg border border-red-100"
                                        >
                                          ✅ 標記已收款
                                        </button>
                                     )}
                                     {evt.paymentStatus === 'Paid' && (
                                        <span className="text-sm font-medium text-emerald-600">✓ 已結帳</span>
                                     )}
                                  </div>
                                  {(evt.paymentRef || evt.paymentProofUrl) && (
                                    <div className="flex gap-2 items-center flex-wrap">
                                      {evt.paymentRef && (
                                        <span className="text-[10px] font-bold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg flex items-center gap-1">
                                          <span>💳</span> 後五碼: {evt.paymentRef}
                                        </span>
                                      )}
                                      {evt.paymentProofUrl && (
                                        <button onClick={() => setPreviewFile({ type: 'photo', url: evt.paymentProofUrl, name: '匯款截圖', folder: '對帳審核', uploadedBy: 'Guest' })} className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors px-3 py-1.5 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center gap-1">
                                          <span>📸</span> 查看截圖
                                        </button>
                                      )}
                                    </div>
                                  )}
                               </div>
                            </div>
                        )) : (
                          <div className="p-10 text-center opacity-40 font-bold text-sm">無活動紀錄</div>
                        )}
                     </div>
                  </div>
               )}

               {guestSubTab === 'queue' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                     <h3 className="text-lg font-bold text-slate-900">排隊號碼牌紀錄</h3>
                     <div className="space-y-4">
                        {history.queueTickets?.length > 0 ? history.queueTickets.map((tix: any) => (
                           <div key={tix.id} className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                              <div>
                                 <h4 className="text-base font-bold text-slate-900">{tix.eventTitle}</h4>
                                 <p className="text-sm text-slate-500 mt-1">號碼牌：<span className="font-mono font-bold text-indigo-600 text-lg">{tix.assignedNumber}</span></p>
                              </div>
                               <div className="flex flex-col items-end gap-2">
                                  <div className="flex gap-4 items-center">
                                     {(tix.paymentStatus === 'Pending' || tix.paymentStatus === 'Unpaid') && (
                                        <button 
                                          onClick={async () => {
                                            if (confirm('確定要標記已收款？')) {
                                              await import('@/app/actions').then(m => m.confirmPayment(tix.id, 'Queue'));
                                              if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors px-3 py-2 bg-red-50 rounded-lg border border-red-100"
                                        >
                                          ✅ 標記已收款
                                        </button>
                                     )}
                                     {tix.paymentStatus === 'Paid' && (
                                        <span className="text-sm font-medium text-emerald-600">✓ 已結帳</span>
                                     )}
                                  </div>
                                  {(tix.paymentRef || tix.paymentProofUrl) && (
                                    <div className="flex gap-2 items-center flex-wrap">
                                      {tix.paymentRef && (
                                        <span className="text-[10px] font-bold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg flex items-center gap-1">
                                          <span>💳</span> 後五碼: {tix.paymentRef}
                                        </span>
                                      )}
                                      {tix.paymentProofUrl && (
                                        <button onClick={() => setPreviewFile({ type: 'photo', url: tix.paymentProofUrl, name: '匯款截圖', folder: '對帳審核', uploadedBy: 'Guest' })} className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors px-3 py-1.5 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center gap-1">
                                          <span>📸</span> 查看截圖
                                        </button>
                                      )}
                                    </div>
                                  )}
                               </div>
                            </div>
                        )) : (
                          <div className="p-10 text-center opacity-40 font-bold text-sm">無排隊紀錄</div>
                        )}
                     </div>
                  </div>
               )}

               {guestSubTab === 'media' && (
                  <div className="space-y-12 animate-in fade-in duration-700">
                     <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                        <h3 className="text-xl font-medium text-slate-900">多媒體歸檔庫</h3>
                        <div className="flex gap-4">
                           <button onClick={() => triggerFileBrowser('photo')} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">📸 上傳照片</button>
                           <button onClick={() => triggerFileBrowser('video')} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">📹 上傳影音</button>
                           <button onClick={() => triggerFileBrowser('file')} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">📄 上傳檔案</button>
                        </div>
                     </div>
                     <div className="space-y-16">
                        {groupedMedia.map((group) => (
                           <div key={group.title} className="space-y-8">
                              <div className="flex items-center gap-6">
                                 <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">{group.title}</div>
                                 <div className="h-0.5 flex-1 bg-slate-50"></div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
                                 {group.files.map((file) => (
                                    <div 
                                       key={file.id} 
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          if (file.type === 'file' && file.name && file.name.endsWith('.pdf')) {
                                             const possibleServiceType = file.name.split('_')[0];
                                             const matchedRecord = history.records?.find((r: any) => r.serviceType === possibleServiceType);
                                             if (matchedRecord) {
                                                setViewingRecord(matchedRecord);
                                                return;
                                             }
                                          }
                                          setPreviewFile(file);
                                       }}
                                       className="relative rounded-[45px] overflow-hidden border-4 border-slate-50 aspect-square bg-slate-50 shadow-sm hover:scale-105 hover:shadow-lg transition-all cursor-zoom-in flex items-center justify-center group/file"
                                    >
                                       <button 
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if(confirm('確定要刪除這個媒體檔案嗎？')) {
                                               await import('@/app/actions').then(m => m.deleteGuestFile(file.id));
                                               if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="absolute top-4 right-4 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity z-20 shadow-md hover:bg-rose-600 hover:scale-110"
                                       >✕</button>
                                       {file.type === 'photo' ? (
                                          <img src={file.url} className="w-full h-full object-cover" />
                                       ) : file.type === 'video' ? (
                                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-amber-500 text-5xl">🎬</div>
                                       ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4 border border-slate-100 rounded-[40px]">
                                             <span className="text-5xl">📄</span>
                                             <span className="text-[10px] font-black text-slate-500 mt-2 truncate w-full text-center px-2">{file.name || '未知文件'}</span>
                                          </div>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {guestSubTab === 'account' && (
                  <div className="space-y-6 animate-in fade-in duration-500"><div className="bg-white rounded-[60px] border-2 border-slate-50 p-16 shadow-sm"><div className="flex items-center gap-10 mb-16"><div className="w-24 h-24 bg-slate-900 rounded-[35px] flex items-center justify-center text-5xl shadow-3xl">👤</div><div><h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">信眾數位身分</h3><p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-[0.3em]">Security & Identity Shield</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="p-10 bg-slate-50 rounded-[40px] border-2 border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">登入帳號 / UID</label><p className="text-3xl font-black text-slate-900">{selectedGuest.account || selectedGuest.phone}</p></div><div className="p-10 bg-slate-50 rounded-[40px] border-2 border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">安全密碼管理</label><div className="flex items-center justify-between"><p className="text-3xl font-black text-slate-900 tracking-[0.3em]">••••••••</p><button onClick={() => setShowPasswordModal(true)} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">重置密碼</button></div></div></div></div></div>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center"><div className="text-[140px] mb-10 animate-bounce duration-[3000ms]">📂</div><h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">請從左側選取信眾檔案</h3><p className="text-xs font-bold text-slate-400 mt-4 tracking-[0.5em] uppercase">Temple Archives v1.0</p></div>
        )}
      </main>

      {/* Modals 保持原本的高階設計並優化排版 */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-6">
            <form onSubmit={handleCreateGuest} className="w-full max-w-3xl bg-white rounded-[65px] shadow-3xl overflow-hidden border-4 border-slate-900">
              <div className="p-6 border-b-2 border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="text-3xl font-black italic tracking-tighter uppercase">核定信眾檔案</h3><button type="button" onClick={() => setShowAddModal(false)} className="text-3xl hover:rotate-90 transition-transform">✕</button></div>
              <div className="p-16 space-y-10 max-h-[75vh] overflow-y-auto scrollbar-hide">
                 <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">信眾姓名</label><input name="name" placeholder="輸入全名" defaultValue={selectedGuest?.name} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-6 text-xl font-black outline-none focus:border-indigo-600 shadow-inner" required /></div>
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">手機號碼</label><input type="tel" name="phone" placeholder="09xx..." defaultValue={selectedGuest?.phone} pattern="^09\d{8}$" minLength={10} maxLength={10} onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ''); }} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-6 text-xl font-black outline-none focus:border-indigo-600 shadow-inner" required title="請輸入 10 碼電話號碼" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">國曆生日</label><input name="birthday" type="date" defaultValue={selectedGuest?.birthday} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-5 text-lg font-black outline-none focus:border-indigo-600 shadow-inner" /></div>
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">農曆生日 (可手動校正)</label><input name="lunarBirthday" type="text" placeholder="例: 壬辰年 臘月 初五日" defaultValue={selectedGuest?.lunarBirthday} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-6 text-lg font-black outline-none focus:border-indigo-600 shadow-inner" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">出生時辰</label><select name="birthHour" defaultValue={selectedGuest?.birthHour || ""} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-6 text-lg font-black outline-none focus:border-indigo-600 shadow-inner appearance-none cursor-pointer"><option value="">-- 請選擇時辰 --</option><option value="吉時 (不知道)">吉時 (不知道)</option><option value="子時 (23:00~00:59)">子時 (23:00~00:59)</option><option value="丑時 (01:00~02:59)">丑時 (01:00~02:59)</option><option value="寅時 (03:00~04:59)">寅時 (03:00~04:59)</option><option value="卯時 (05:00~06:59)">卯時 (05:00~06:59)</option><option value="辰時 (07:00~08:59)">辰時 (07:00~08:59)</option><option value="巳時 (09:00~10:59)">巳時 (09:00~10:59)</option><option value="午時 (11:00~12:59)">午時 (11:00~12:59)</option><option value="未時 (13:00~14:59)">未時 (13:00~14:59)</option><option value="申時 (15:00~16:59)">申時 (15:00~16:59)</option><option value="酉時 (17:00~18:59)">酉時 (17:00~18:59)</option><option value="戌時 (19:00~20:59)">戌時 (19:00~20:59)</option><option value="亥時 (21:00~22:59)">亥時 (21:00~22:59)</option></select></div>
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">LINE ID</label><input name="lineId" placeholder="@id" defaultValue={selectedGuest?.lineId} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-6 text-xl font-black outline-none focus:border-indigo-600 text-blue-600 shadow-inner" /></div>
                 </div>
                 <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">通訊地址</label><input name="address" placeholder="請輸入完整通訊地址" defaultValue={selectedGuest?.address} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-6 text-xl font-black outline-none focus:border-indigo-600 shadow-inner" /></div>
                 <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">登入帳號 (Account)</label><input name="account" placeholder="可留空 (預設為手機號碼)" defaultValue={selectedGuest?.account} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-6 text-xl font-black outline-none focus:border-indigo-600 shadow-inner" /></div>
                   <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">預設登入密碼 (Password)</label><input name="password" type="text" placeholder="建立時請設定密碼" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-6 text-xl font-black outline-none focus:border-indigo-600 shadow-inner" /></div>
                 </div>
                 <button type="submit" className="w-full py-10 bg-slate-900 text-white rounded-[45px] font-black text-sm uppercase tracking-[0.5em] shadow-3xl hover:bg-indigo-600 transition-all">核 定 並 存 檔 🚀</button>
              </div>
           </form>
        </div>
      )}

      {/* 其餘 Modal (Password, Form) 保持穩定性 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/98 backdrop-blur-2xl p-6">
           <div className="w-full max-w-lg bg-white rounded-2xl shadow-3xl p-16 space-y-12 border-4 border-slate-900 animate-in zoom-in-95">
              <div className="text-center space-y-4"><h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">重置數位密碼</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Identity Verification</p></div>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-8 text-2xl font-black outline-none text-center shadow-inner tracking-widest" placeholder="••••••••" />
              <div className="flex gap-6"><button onClick={() => setShowPasswordModal(false)} className="flex-1 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">取消</button><button onClick={async () => { if (!selectedGuest || !newPassword) return; await updateGuestPassword(selectedGuest.phone, newPassword); setNewPassword(''); setShowPasswordModal(false); alert("✅ 密碼已重置！"); }} className="flex-2 bg-slate-900 text-white py-6 rounded-3xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all">核定重置</button></div>
           </div>
        </div>
      )}
      {/* 👁️ 檢視表單內容 Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
           <div className="w-full max-w-2xl bg-white rounded-2xl shadow-3xl overflow-hidden border-4 border-slate-900 animate-in zoom-in-95">
              <div className="p-10 border-b-2 border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">{viewingRecord.serviceType}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">案卷紀錄摘要 | {viewingRecord.date}</p>
                 </div>
                 <button onClick={() => setViewingRecord(null)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl hover:rotate-90 transition-all shadow-sm">✕</button>
              </div>
              <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
                 <div className="grid grid-cols-1 gap-6">
                     {Object.entries(viewingRecord.values || {}).map(([label, val]) => {
                        const srv = serviceDefs.find(s => s.name === viewingRecord.serviceType);
                        const form = forms.find(f => f.id === srv?.linkedFormId);
                        const fieldDef = form?.fields?.find((f: any) => f.label === label);
                        
                        return (
                        <div key={label} className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">{label}</label>
                           
                           {fieldDef?.type === 'select_single' ? (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {fieldDef.options?.map((opt: string) => (
                                  <div
                                    key={opt}
                                    className={`px-4 py-2 rounded-xl text-[11px] font-bold border ${
                                      val === opt
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : 'bg-white border-slate-200 text-slate-500 opacity-60'
                                    }`}
                                  >
                                    {opt}
                                  </div>
                                ))}
                              </div>
                           ) : fieldDef?.type === 'select_multiple' ? (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {fieldDef.options?.map((opt: string) => {
                                  const currentValues = Array.isArray(val) ? val : [];
                                  const isSelected = currentValues.includes(opt);
                                  return (
                                    <div
                                      key={opt}
                                      className={`px-4 py-2 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                                        isSelected
                                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-500 opacity-60'
                                      }`}
                                    >
                                      {isSelected ? <div className="w-2 h-2 rounded-sm bg-emerald-500"></div> : <div className="w-2 h-2 rounded-sm border border-slate-300"></div>}
                                      {opt}
                                    </div>
                                  );
                                })}
                              </div>
                           ) : fieldDef?.type === 'select_ordered' ? (
                              <div className="flex flex-col gap-2 mt-2">
                                {fieldDef.options?.map((opt: string) => {
                                  const currentValues = Array.isArray(val) ? val : [];
                                  const selectedIndex = currentValues.indexOf(opt);
                                  const isSelected = selectedIndex !== -1;
                                  return (
                                    <div
                                      key={opt}
                                      className={`px-4 py-3 rounded-xl border flex items-center justify-between ${
                                        isSelected ? 'border-amber-100 bg-amber-50/80 text-amber-700 shadow-sm' : 'border-slate-200 bg-white text-slate-400 opacity-60'
                                      } text-xs font-bold`}
                                    >
                                      <span>{opt}</span>
                                      {isSelected ? (
                                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] shadow-sm">{selectedIndex + 1}</span>
                                      ) : (
                                        <span className="w-6 h-6 rounded-full border-2 border-slate-200 bg-white"></span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                           ) : Array.isArray(val) ? (
                              <div className="flex flex-wrap gap-2 mt-2">
                                 {val.map((item: any, idx: number) => (
                                    <div key={idx} className="px-4 py-2 rounded-xl border border-indigo-100 bg-indigo-50/80 text-xs font-bold text-indigo-700 flex items-center gap-2 shadow-sm">
                                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                       {String(item)}
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <p className="text-lg font-black text-slate-900 leading-relaxed">{String(val)}</p>
                           )}
                        </div>
                     );})}
                    {(!viewingRecord.values || Object.keys(viewingRecord.values).length === 0) && (
                       <div className="py-20 text-center opacity-20 font-black italic">此案卷無詳細內容資料</div>
                    )}
                 </div>
              </div>
              <div className="p-10 border-t-2 border-slate-50 bg-slate-50/50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">歸檔人：{viewingRecord.staffName}</span>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => {
                     const pdfWindow = window.open('', '', 'width=800,height=600');
                     if (!pdfWindow) { alert('請允許彈出視窗以啟用 PDF 下載功能'); return; }

                     const srv = serviceDefs.find(s => s.name === viewingRecord.serviceType);
                     let template = printTemplates.find(pt => pt.id === srv?.linkedPrintTemplateId);
                     
                     let wrapperCss = 'margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;';
                     let containerCss = template?.borderStyle || 'padding: 40px; background: white;';
                     let templeHeader = template?.templeName || viewingRecord.serviceType;
                     let watermarkHtml = template?.watermarkUrl ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${template.watermarkUrl}'); background-size: contain; background-position: center; background-repeat: no-repeat; opacity: ${template.watermarkOpacity}; pointer-events: none; z-index: -1;"></div>` : '';

                     const content = Object.entries(viewingRecord.values || {}).map(([k, v]) => '<div style="' + wrapperCss + '"><strong>' + k + '</strong><p style="margin-top: 5px;">' + v + '</p></div>').join('');
                     
                     const htmlString = '<html lang="zh-TW"><head><title>' + viewingRecord.serviceType + ' - 下載</title>' +
                       '<style>' +
                       "body { font-family: 'Microsoft JhengHei', sans-serif; color: #333; margin: 0; padding: 20px; background: #f8fafc; } " +
                       '.page-container { position: relative; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; ' + containerCss + ' } ' +
                       'h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; font-size: 28px; } ' +
                       '</style>' +
                       '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>' +
                       '</head><body>' +
                       '<div id="pdf-content" class="page-container">' +
                       watermarkHtml +
                       '<h1>' + templeHeader + '</h1>' +
                       '<div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 20px;">' +
                       '<span>服務項目: ' + viewingRecord.serviceType + '</span>' +
                       '<span>列印日期: ' + new Date().toLocaleDateString() + '</span>' +
                       '</div>' +
                       '<div style="position: relative; z-index: 10;">' + content + '</div>' +
                       '</div>';

                     const scriptStr = '<script>' +
                       'window.onload = function() { ' +
                       '  const element = document.getElementById("pdf-content"); ' +
                       '  html2pdf().set({ ' +
                       '    margin: 10, ' +
                       '    filename: "' + viewingRecord.serviceType + '_表單紀錄.pdf", ' +
                       '    image: { type: "jpeg", quality: 0.98 }, ' +
                       '    html2canvas: { scale: 2, useCORS: true }, ' +
                       '    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } ' +
                       '  }).from(element).save().then(() => { setTimeout(() => window.close(), 1500); }); ' +
                       '}; ' +
                       '</script></body></html>';
                     
                     pdfWindow.document.write(htmlString + scriptStr);
                     pdfWindow.document.close();
                   }} className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-100 transition-all flex items-center gap-2">⬇️ 下載表單</button>
                   <button onClick={() => {
                     const printWindow = window.open('', '', 'width=800,height=600');
                     if (!printWindow) return;

                     const srv = serviceDefs.find(s => s.name === viewingRecord.serviceType);
                     let template = printTemplates.find(pt => pt.id === srv?.linkedPrintTemplateId);
                     
                     let wrapperCss = 'margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;';
                     let containerCss = template?.borderStyle || 'padding: 40px; background: white;';
                     let templeHeader = template?.templeName || viewingRecord.serviceType;
                     let watermarkHtml = template?.watermarkUrl ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${template.watermarkUrl}'); background-size: contain; background-position: center; background-repeat: no-repeat; opacity: ${template.watermarkOpacity}; pointer-events: none; z-index: -1;"></div>` : '';

                     const content = Object.entries(viewingRecord.values || {}).map(([k, v]) => '<div style="' + wrapperCss + '"><strong>' + k + '</strong><p style="margin-top: 5px;">' + v + '</p></div>').join('');
                     
                     const htmlString = '<html lang="zh-TW"><head><title>' + viewingRecord.serviceType + ' - 列印</title>' +
                       '<style>' +
                       "body { font-family: 'Microsoft JhengHei', sans-serif; color: #333; margin: 0; padding: 20px; background: #f8fafc; } " +
                       '.page-container { position: relative; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; ' + containerCss + ' } ' +
                       'h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; font-size: 28px; } ' +
                       '</style>' +
                       '</head><body>' +
                       '<div id="pdf-content" class="page-container">' +
                       watermarkHtml +
                       '<h1>' + templeHeader + '</h1>' +
                       '<div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 20px;">' +
                       '<span>服務項目: ' + viewingRecord.serviceType + '</span>' +
                       '<span>列印日期: ' + new Date().toLocaleDateString() + '</span>' +
                       '</div>' +
                       '<div style="position: relative; z-index: 10;">' + content + '</div>' +
                       '</div>';

                     const scriptStr = '<script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };</script></body></html>';
                     printWindow.document.write(htmlString + scriptStr);
                     printWindow.document.close();
                   }} className="bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-200 transition-all flex items-center gap-2">🖨️ 列印表單</button>
                   <button onClick={() => {
                     const srv = serviceDefs.find(s => s.name === viewingRecord.serviceType);
                     const form = forms.find(f => f.id === srv?.linkedFormId) || null;
                     setDynamicValues(viewingRecord.values || {});
                     setActiveForm({ 
                       recordId: viewingRecord.id, 
                       eventId: viewingRecord.eventId, 
                       serviceType: viewingRecord.serviceType, 
                       form 
                     });
                     setViewingRecord(null);
                   }} className="bg-amber-100 text-amber-700 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-amber-200 transition-all flex items-center gap-2">✏️ 修改表單</button>
                   <button onClick={() => setViewingRecord(null)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">關閉視窗</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ✍️ 填寫服務表單 Modal */}
      {activeForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-3xl overflow-hidden border-4 border-slate-900 animate-in zoom-in-95">
            <div className="p-10 border-b-2 border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">填寫服務表單：{activeForm.serviceType}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">預約編號 #{activeForm.eventId}</p>
              </div>
              <button onClick={() => setActiveForm(null)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl hover:rotate-90 transition-all shadow-sm">✕</button>
            </div>
            
            <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
              {activeForm.form ? (
                <div className="space-y-6">
                  {activeForm.form.fields.map((field: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={dynamicValues[field.label] || ''}
                          onChange={(e) => setDynamicValues({ ...dynamicValues, [field.label]: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] px-8 py-5 text-base font-bold outline-none focus:border-indigo-600 shadow-inner min-h-[100px]"
                          placeholder={`請輸入${field.label}`}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={dynamicValues[field.label] || ''}
                          onChange={(e) => setDynamicValues({ ...dynamicValues, [field.label]: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] px-8 py-5 text-base font-bold outline-none focus:border-indigo-600 shadow-inner"
                        >
                          <option value="">請選擇{field.label}</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'select_single' ? (
                        <div className="flex flex-wrap gap-2">
                          {field.options?.map((opt: string) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setDynamicValues({ ...dynamicValues, [field.label]: opt })}
                              className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                                dynamicValues[field.label] === opt
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : field.type === 'select_multiple' ? (
                        <div className="flex flex-wrap gap-2">
                          {field.options?.map((opt: string) => {
                            const currentValues = Array.isArray(dynamicValues[field.label]) ? dynamicValues[field.label] : [];
                            const isSelected = currentValues.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  let newValues;
                                  if (isSelected) {
                                    newValues = currentValues.filter((v: string) => v !== opt);
                                  } else {
                                    newValues = [...currentValues, opt];
                                  }
                                  setDynamicValues({ ...dynamicValues, [field.label]: newValues });
                                }}
                                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50'
                                }`}
                              >
                                {isSelected ? <div className="w-2 h-2 rounded-sm bg-emerald-500"></div> : <div className="w-2 h-2 rounded-sm border border-slate-300"></div>}
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : field.type === 'select_ordered' ? (
                        <div className="flex flex-col gap-2">
                          {field.options?.map((opt: string) => {
                            const currentValues = Array.isArray(dynamicValues[field.label]) ? dynamicValues[field.label] : [];
                            const selectedIndex = currentValues.indexOf(opt);
                            const isSelected = selectedIndex !== -1;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  let newValues;
                                  if (isSelected) {
                                    newValues = currentValues.filter((v: string) => v !== opt);
                                  } else {
                                    newValues = [...currentValues, opt];
                                  }
                                  setDynamicValues({ ...dynamicValues, [field.label]: newValues });
                                }}
                                className="px-4 py-3 rounded-xl border border-amber-100 bg-amber-50/30 text-xs font-bold text-slate-600 flex items-center justify-between hover:bg-amber-50 transition-colors"
                              >
                                <span>{opt}</span>
                                {isSelected ? (
                                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] shadow-sm">{selectedIndex + 1}</span>
                                ) : (
                                  <span className="w-6 h-6 rounded-full border-2 border-slate-200 bg-white"></span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={dynamicValues[field.label] || ''}
                          onChange={(e) => setDynamicValues({ ...dynamicValues, [field.label]: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] px-8 py-5 text-base font-bold outline-none focus:border-indigo-600 shadow-inner"
                          placeholder="0"
                        />
                      ) : (
                        <input
                          type="text"
                          value={dynamicValues[field.label] || ''}
                          onChange={(e) => setDynamicValues({ ...dynamicValues, [field.label]: e.target.value })}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] px-8 py-5 text-base font-bold outline-none focus:border-indigo-600 shadow-inner"
                          placeholder={`請輸入${field.label}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* 通用服務紀錄表單 */
                <div className="space-y-6">
                  <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl text-sm font-bold text-amber-800">
                    💡 此預約項目尚未綁定客製化表單。已自動為您載入「通用服務紀錄表單」。
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">服務紀錄 / 診斷建議</label>
                    <textarea
                      value={dynamicValues['服務紀錄'] || ''}
                      onChange={(e) => setDynamicValues({ ...dynamicValues, '服務紀錄': e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] px-8 py-5 text-base font-bold outline-none focus:border-indigo-600 shadow-inner min-h-[120px]"
                      placeholder="請填寫本次聖事/收驚/批命之詳細處理過程與信眾建議..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-4">叮嚀事項 / 備註</label>
                    <input
                      type="text"
                      value={dynamicValues['叮嚀備註'] || ''}
                      onChange={(e) => setDynamicValues({ ...dynamicValues, '叮嚀備註': e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] px-8 py-5 text-base font-bold outline-none focus:border-indigo-600 shadow-inner"
                      placeholder="例如：需每日淨身一次、多行善事..."
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-10 border-t-2 border-slate-100 bg-slate-50 flex items-center justify-between">
              <button onClick={() => setActiveForm(null)} className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest">取消</button>
              <button 
                onClick={() => handleSaveRecord(dynamicValues)}
                disabled={isSaving}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all"
              >
                {isSaving ? '儲存中...' : '提交並歸檔案卷 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}
      {renderPreviewModal()}
    </div>
  );
}