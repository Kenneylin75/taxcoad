"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { fetchPaymentConfig, savePaymentConfig, TemplePaymentConfig } from '@/app/actions';

export default function PaymentSetupPage() {
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<TemplePaymentConfig>({
    templeId: '',
    linePay: { enabled: false, channelId: '', channelSecret: '' },
    thirdParty: { enabled: false, provider: 'ECPay', merchantId: '', hashKey: '', hashIV: '' },
    customTransfer: { enabled: false, bankCode: '', bankName: '', accountName: '', accountNo: '' },
    customQR: { enabled: false, qrImageUrl: '', description: '' },
    cash: { enabled: true, description: '請於辦理當日至廟宇櫃檯繳納現金' }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchPaymentConfig();
      if (data) setConfig(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      const res = await savePaymentConfig(config);
      if (res.success) {
         alert("✅ 金流收款設定已成功儲存！");
      }
    });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setConfig({ ...config, customQR: { ...config.customQR, qrImageUrl: base64String } });
      };
      reader.readAsDataURL(file);
    }
  };

    const renderModuleSelector = (paymentKey: keyof TemplePaymentConfig, colorClass: string, ringClass: string) => {
    const section = config[paymentKey] as any;
    if (!section) return null;
    return (
      <div className="mt-6 border-t border-slate-100 pt-6 animate-in fade-in">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">適用的服務模組</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'allowBooking', label: '預約服務' },
            { id: 'allowLamp', label: '點燈服務' },
            { id: 'allowEvent', label: '法會活動' },
            { id: 'allowQueue', label: '現場排隊' }
          ].map(opt => (
            <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:border-${colorClass}-200 cursor-pointer bg-white transition-colors`}>
              <input
                type="checkbox"
                className={`w-4 h-4 text-${colorClass}-500 rounded border-gray-300 focus:ring-${ringClass}-500`}
                checked={section[opt.id] !== false}
                onChange={e => setConfig({...config, [paymentKey]: { ...section, [opt.id]: e.target.checked } as any})}
              />
              <span className="text-sm font-bold text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="h-screen bg-slate-50 flex items-center justify-center animate-pulse text-slate-300 font-bold uppercase tracking-widest italic text-2xl">Loading Payment Config...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">金流收款設定</h1>
          <p className="text-slate-400 text-xs font-bold tracking-[0.4em] uppercase mt-2">Payment Gateway & Collection Settings</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isPending}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isPending ? '儲存中...' : '💾 儲存所有設定'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LINE Pay Config */}
        <div className={`bg-white rounded-[40px] border-2 transition-all p-8 shadow-sm \${config.linePay.enabled ? 'border-emerald-500' : 'border-slate-100 hover:border-slate-300'}`}>
           <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-3xl">📱</div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800">LINE Pay 整合</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Official API Integration</p>
                 </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.linePay.enabled} onChange={e => setConfig({...config, linePay: {...config.linePay, enabled: e.target.checked}})} />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
           </div>
           
           <div className={`space-y-4 transition-opacity duration-300 \${config.linePay.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Channel ID</label>
                 <input type="text" value={config.linePay.channelId || ''} onChange={e => setConfig({...config, linePay: {...config.linePay, channelId: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors" placeholder="輸入 LINE Pay Channel ID" />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Channel Secret</label>
                 <input type="password" value={config.linePay.channelSecret || ''} onChange={e => setConfig({...config, linePay: {...config.linePay, channelSecret: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors" placeholder="••••••••••••••••" />
              </div>
              {renderModuleSelector('linePay', 'emerald', 'emerald')}
           </div>
        </div>

        {/* Third-Party Payment Config */}
        <div className={`bg-white rounded-[40px] border-2 transition-all p-8 shadow-sm \${config.thirdParty.enabled ? 'border-indigo-500' : 'border-slate-100 hover:border-slate-300'}`}>
           <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-3xl">💳</div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800">第三方支付 (綠界/藍新)</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Credit Card / Convenience Store</p>
                 </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.thirdParty.enabled} onChange={e => setConfig({...config, thirdParty: {...config.thirdParty, enabled: e.target.checked}})} />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
           </div>
           
           <div className={`space-y-4 transition-opacity duration-300 \${config.thirdParty.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">供應商 Provider</label>
                    <select value={config.thirdParty.provider || 'ECPay'} onChange={e => setConfig({...config, thirdParty: {...config.thirdParty, provider: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors">
                       <option value="ECPay">綠界科技 (ECPay)</option>
                       <option value="NewebPay">藍新科技 (NewebPay)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">商店代號 Merchant ID</label>
                    <input type="text" value={config.thirdParty.merchantId || ''} onChange={e => setConfig({...config, thirdParty: {...config.thirdParty, merchantId: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Merchant ID" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">HashKey</label>
                    <input type="password" value={config.thirdParty.hashKey || ''} onChange={e => setConfig({...config, thirdParty: {...config.thirdParty, hashKey: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors" placeholder="••••••••••••" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">HashIV</label>
                    <input type="password" value={config.thirdParty.hashIV || ''} onChange={e => setConfig({...config, thirdParty: {...config.thirdParty, hashIV: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors" placeholder="••••••••••••" />
                 </div>
              </div>
              {renderModuleSelector('thirdParty', 'indigo', 'indigo')}
           </div>
        </div>

        {/* Bank Transfer Config */}
        <div className={`bg-white rounded-[40px] border-2 transition-all p-8 shadow-sm \${config.customTransfer.enabled ? 'border-amber-500' : 'border-slate-100 hover:border-slate-300'}`}>
           <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-3xl">🏦</div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800">銀行匯款 / ATM 轉帳</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Manual Bank Transfer</p>
                 </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.customTransfer.enabled} onChange={e => setConfig({...config, customTransfer: {...config.customTransfer, enabled: e.target.checked}})} />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
           </div>
           
           <div className={`space-y-4 transition-opacity duration-300 \${config.customTransfer.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">銀行代碼 Bank Code</label>
                    <input type="text" value={config.customTransfer.bankCode || ''} onChange={e => setConfig({...config, customTransfer: {...config.customTransfer, bankCode: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-colors" placeholder="如: 008" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">銀行名稱 Bank Name</label>
                    <input type="text" value={config.customTransfer.bankName || ''} onChange={e => setConfig({...config, customTransfer: {...config.customTransfer, bankName: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-colors" placeholder="華南商業銀行" />
                 </div>
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">收款戶名 Account Name</label>
                 <input type="text" value={config.customTransfer.accountName || ''} onChange={e => setConfig({...config, customTransfer: {...config.customTransfer, accountName: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-colors" placeholder="財團法人○○宮" />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">收款帳號 Account Number</label>
                 <input type="text" value={config.customTransfer.accountNo || ''} onChange={e => setConfig({...config, customTransfer: {...config.customTransfer, accountNo: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xl font-black font-serif tracking-[0.2em] focus:outline-none focus:border-amber-500 transition-colors" placeholder="1234-5678-9012" />
              </div>
              {renderModuleSelector('customTransfer', 'amber', 'amber')}
           </div>
        </div>

        {/* Cash Payment Config */}
        <div className={`bg-white rounded-[40px] border-2 transition-all p-8 shadow-sm ${config.cash?.enabled ? 'border-amber-500' : 'border-slate-100 hover:border-slate-300'}`}>
           <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-3xl">💵</div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800">現場現金付款</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Cash Payment</p>
                 </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.cash?.enabled || false} onChange={e => setConfig({...config, cash: { ...config.cash, enabled: e.target.checked } as any})} />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
           </div>
           
           {config.cash?.enabled && (
             <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">付款備註 INSTRUCTIONS</label>
                   <input 
                     type="text"
                     value={config.cash?.description || ''}
                     onChange={e => setConfig({...config, cash: { ...config.cash, description: e.target.value } as any})}
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all mb-6"
                     placeholder="例如：請於辦理當日至廟宇櫃檯繳納現金"
                   />
                   
                   {renderModuleSelector('cash', 'amber', 'amber')}
                </div>
             </div>
           )}
        </div>

        {/* Custom QR Code Config */}
        <div className={`bg-white rounded-[40px] border-2 transition-all p-8 shadow-sm \${config.customQR.enabled ? 'border-pink-500' : 'border-slate-100 hover:border-slate-300'}`}>
           <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center text-3xl">🔗</div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800">自訂條碼 / 收款連結</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Personal QR & Links</p>
                 </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.customQR.enabled} onChange={e => setConfig({...config, customQR: {...config.customQR, enabled: e.target.checked}})} />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
           </div>
           
           <div className={`space-y-4 transition-opacity duration-300 \${config.customQR.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer group">
                 {config.customQR.qrImageUrl ? (
                    <img src={config.customQR.qrImageUrl} alt="Payment QR" className="max-h-48 rounded-xl shadow-sm" />
                 ) : (
                    <div className="text-center py-8">
                       <span className="text-4xl">📸</span>
                       <p className="text-xs font-bold text-slate-400 mt-4">上傳 LINE Pay 個人碼 / 街口支付碼</p>
                    </div>
                 )}
                 <input type="file" onChange={handleMediaUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
              </div>
              
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">備註說明 Instructions</label>
                 <input type="text" value={config.customQR.description || ''} onChange={e => setConfig({...config, customQR: {...config.customQR, description: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-pink-500 transition-colors" placeholder="請掃描 QR Code 後，輸入正確金額並備註報名者姓名" />
              </div>
              {renderModuleSelector('customQR', 'pink', 'pink')}
           </div>
        </div>

      </div>
    </div>
  );
}
