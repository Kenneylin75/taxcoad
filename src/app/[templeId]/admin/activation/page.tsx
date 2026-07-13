"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateTempleBasicInfo, fetchTemplePaymentTarget } from '@/app/actions';

export default function ActivationPage() {
  const params = useParams();
  const router = useRouter();
  const templeId = params.templeId as string;
  const [remittanceData, setRemittanceData] = useState({
    bankName: '',
    accountLast5: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankInfo, setBankInfo] = useState({ bankCode: '808', bankName: '玉山銀行', accountNo: '1234-5678-9012', accountName: '星宇科技服務有限公司' });

  React.useEffect(() => {
     fetchTemplePaymentTarget(templeId).then(info => {
        if (info) setBankInfo(info);
     });
  }, [templeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remittanceData.accountLast5) return alert("請輸入匯款帳號末五碼");
    setIsSubmitting(true);
    try {
      // Set status to UnderReview after submission
      await updateTempleBasicInfo({ status: 'UnderReview', remittanceData }, templeId);
      alert("✅ 已送出匯款資料，等待經銷商/系統核款後即可正式啟用！");
      window.location.reload();
    } catch (e) {
      alert("送出失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative z-10 text-center space-y-4 mb-10">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center text-4xl mx-auto shadow-inner">
            🛡️
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">系統啟動與繳費</h1>
          <p className="text-sm font-bold text-slate-500">
            您的宮廟帳戶已成功建立！為了保障您的權益，請完成開辦費用的繳納，或上傳匯款憑證以啟用系統功能。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-900 mb-2">匯款資訊</h3>
            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
              <div className="text-slate-500">銀行代碼</div>
              <div className="text-slate-900 text-right">{bankInfo.bankCode} {bankInfo.bankName}</div>
              <div className="text-slate-500">收款帳號</div>
              <div className="text-slate-900 text-right">{bankInfo.accountNo}</div>
              <div className="text-slate-500">戶名</div>
              <div className="text-slate-900 text-right">{bankInfo.accountName}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900">填寫您的匯款資料</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-1 block">匯款銀行名稱</label>
                <input required value={remittanceData.bankName} onChange={e => setRemittanceData({...remittanceData, bankName: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" placeholder="例如：中國信託、台北富邦" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-1 block">帳號末五碼</label>
                  <input required value={remittanceData.accountLast5} onChange={e => setRemittanceData({...remittanceData, accountLast5: e.target.value})} type="text" maxLength={5} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" placeholder="12345" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-1 block">匯款日期</label>
                  <input required value={remittanceData.date} onChange={e => setRemittanceData({...remittanceData, date: e.target.value})} type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                </div>
              </div>
            </div>
          </div>

          <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-5 font-black shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50">
            {isSubmitting ? '處理中...' : '送出匯款資料並申請啟用'}
          </button>
        </form>
      </div>
    </div>
  );
}
