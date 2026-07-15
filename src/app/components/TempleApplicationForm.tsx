"use client";

import React, { useState, useEffect } from 'react';
import { fetchRentPlans, fetchSystemConfig } from '../actions';

interface FormProps {
  role: 'dist-sales' | 'distributor' | 'super-sales' | 'super-admin';
  submittedBy: string;
  distributorId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TAIWAN_CITIES = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'];

export default function TempleApplicationForm({ role, submittedBy, distributorId, onSuccess, onCancel }: FormProps) {
  const [rentPlans, setRentPlans] = useState<any[]>([]);
  const [config, setConfig] = useState({ fixedMonthlyRent: 3600, yearlyDiscountRate: 20 });
  const [loading, setLoading] = useState(false);
  const [paymentCycle, setPaymentCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [form, setForm] = useState({
    templeName: "",
    account: "",
    password: "",
    setupFee: 12000,
    monthlyRent: 3600,
    city: "",
    address: "",
    templePhone: "", 
    contactName: "",
    contactPhone: "",
    freeType: 'Normal' as 'Normal' | 'Trial' | 'Permanent',
    trialMonths: 0,
    enableAi: true,
    cloudStorage: '50GB',
    aiLife: 'Basic'
  });
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    fetchRentPlans().then(setRentPlans);
    fetchSystemConfig().then(cfg => {
        if (cfg) setConfig(cfg as any);
    });
  }, []);

  const validateAccount = async (acc: string) => {
    if (!acc) { setAccountError(''); return; }
    try {
      const { checkAccountExists } = await import('../actions');
      const exists = await checkAccountExists(acc);
      if (exists) {
        setAccountError(`此帳號不可使用，建議使用：${acc}${Math.floor(Math.random()*900)+100}`);
      } else {
        setAccountError('');
      }
    } catch(e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountError) {
      alert("目前帳號不可使用，請依照系統建議更換！");
      return;
    }
    setLoading(true);
    try {
      const { submitFreeAccountApplication } = await import('../actions');
      const res = await submitFreeAccountApplication({
        ...form,
        role,
        submittedBy,
        distributorId,
        paymentCycle
      });
      if (res && res.success === false) {
         alert(res.error || '帳號已被註冊，請更換');
         setLoading(false);
         return;
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatedRent = paymentCycle === 'Monthly' 
    ? config.fixedMonthlyRent 
    : config.fixedMonthlyRent * 12 * (1 - config.yearlyDiscountRate / 100);

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
            <h3 className="text-base font-black text-slate-900 tracking-tighter uppercase italic">1. 核心資料 Provisioning</h3>
          </div>
          
          <div className="space-y-3">
             <div className="relative group">
                <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest z-10">宮廟名稱</p>
                <input type="text" placeholder="例如：松山慈祐宮" value={form.templeName} onChange={e => setForm({...form, templeName: e.target.value})} className="app-input-v7" required />
             </div>
             

             <div className="grid grid-cols-3 gap-3">
                <div className="relative group col-span-1">
                   <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">縣市</p>
                   <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="app-input-v7 appearance-none cursor-pointer" required>
                      <option value="">請選擇</option>
                      {TAIWAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 text-[8px]">▼</span>
                </div>
                <div className="relative group col-span-2">
                   <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">詳細地址</p>
                   <input type="text" placeholder="例：忠孝東路四段..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="app-input-v7" required />
                </div>
             </div>

             <div className="relative group">
                <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10 group-focus-within:text-emerald-600 transition-colors">宮廟公務電話</p>
                <input type="text" placeholder="市話或分機" value={form.templePhone} onChange={e => setForm({...form, templePhone: e.target.value})} className="app-input-v7" required />
             </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-3">
            <h3 className="text-base font-black text-slate-900 tracking-tighter uppercase italic">2. 方案細節 Identity</h3>
          </div>
          
          <div className="space-y-3">
             {form.freeType !== 'Permanent' && (
               <>
             <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                   <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">一次性開辦費</p>
                   <input type="number" value={Number.isNaN(form.setupFee) ? '' : form.setupFee} onChange={e => setForm({...form, setupFee: e.target.value === '' ? 0 : parseInt(e.target.value)})} className="app-input-v7" required />
                </div>
                <div className="relative group">
                   <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">月租方案 (固定)</p>
                   <div className="app-input-v7 bg-slate-50 flex items-center justify-between">
                      <span className="font-black text-indigo-600 tracking-tighter">系統預設方案</span>
                      <span className="bg-indigo-600 text-white text-[9px] px-2 py-1 rounded-lg font-black">${config.fixedMonthlyRent}/月</span>
                   </div>
                </div>
             </div>

             {/* Payment Cycle Toggle */}
             <div className="p-6 bg-slate-50/50 rounded-[30px] border-2 border-white shadow-sm space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">繳費週期支付設定 (Billing Cycle)</p>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setPaymentCycle('Monthly')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentCycle === 'Monthly' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>月繳模式</button>
                    <button type="button" onClick={() => setPaymentCycle('Yearly')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentCycle === 'Yearly' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>年繳優惠 (-{config.yearlyDiscountRate}%)</button>
                </div>
                <div className="flex justify-between items-center px-4 py-2">
                    <p className="text-[9px] font-bold text-slate-400">預估合約金額</p>
                    <p className="text-xl font-black text-slate-900 italic">${calculatedRent.toLocaleString()} <span className="text-[8px] opacity-40 uppercase">{paymentCycle === 'Monthly' ? '/ Mo' : '/ Yr'}</span></p>
                </div>
             </div>
             </>
             )}
              
              <div className="grid grid-cols-2 gap-3">
                 <div className="relative group">
                    <p className={`absolute left-5 -top-2 bg-white px-2 text-[9px] font-black uppercase tracking-widest z-10 transition-colors ${accountError ? 'text-rose-600' : 'text-slate-400 group-focus-within:text-emerald-600'}`}>登入帳號</p>
                    <input type="text" placeholder="建議用英數" value={form.account} onChange={e => {
                       setForm({...form, account: e.target.value});
                       validateAccount(e.target.value);
                    }} className={`app-input-v7 ${accountError ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} required />
                    {accountError && <p className="text-[10px] text-rose-500 font-bold mt-1.5 px-2 bg-rose-50 rounded-lg py-1">{accountError}</p>}
                 </div>
                 <div className="relative group">
                    <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10 group-focus-within:text-emerald-600 transition-colors">預設密碼</p>
                    <input type="password" placeholder="6 位以上" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="app-input-v7" required />
                 </div>
              </div>
             
              <div className="grid grid-cols-2 gap-3">
                 <div className="relative group">
                    <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">負責人</p>
                    <input type="text" placeholder="姓名" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} className="app-input-v7" required />
                 </div>
                 <div className="relative group">
                    <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">聯絡電話</p>
                    <input type="text" placeholder="手機" value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} className="app-input-v7" required />
                 </div>
              </div>

              {/* 特許方案設定 (Privilege Settings) */}
              <div className="pt-6 border-t border-slate-50 space-y-4">
                 <div className="flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                    <h3 className="text-base font-black text-slate-900 tracking-tighter uppercase italic">3. 特許授權 Privilege</h3>
                 </div>
                 
                 <div className="bg-indigo-50/50 p-6 rounded-[32px] border-2 border-white shadow-sm space-y-4">
                    <div className="flex gap-2">
                       <button type="button" onClick={() => setForm({...form, freeType: 'Normal', trialMonths: 0})} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.freeType === 'Normal' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>標準月租</button>
                       <button type="button" onClick={() => setForm({...form, freeType: 'Trial', trialMonths: 1})} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.freeType === 'Trial' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>月租試用</button>
                       {role === 'super-admin' && (
                          <button type="button" onClick={() => setForm({...form, freeType: 'Permanent', trialMonths: 0})} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.freeType === 'Permanent' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>永久免費</button>
                       )}
                    </div>

                    {form.freeType === 'Trial' && (
                       <div className="bg-white p-6 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-300">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">設定試用月數 (試用後開始計費)</p>
                          <div className="flex items-center gap-4">
                             <div className="flex-1 flex gap-2">
                                {[1, 2, 3].map(m => (
                                   <button key={m} type="button" onClick={() => setForm({...form, trialMonths: m})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${form.trialMonths === m ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>{m}個月</button>
                                ))}
                             </div>
                             <div className="w-px h-8 bg-slate-100"></div>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-300">其他:</span>
                                <input type="number" min="1" max="12" value={form.trialMonths} onChange={e => setForm({...form, trialMonths: parseInt(e.target.value) || 1})} className="w-16 bg-slate-50 border-none rounded-xl p-2 text-center font-black text-indigo-600 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                             </div>
                          </div>
                       </div>
                    )}

                    {form.freeType === 'Permanent' && (
                       <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">⚠️ 此帳戶已被設定為永久特許免費帳號</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        
         {/* Cloud Storage and AI Life Settings */}
         <div className="pt-6 border-t border-slate-50 space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
               <h3 className="text-base font-black text-slate-900 tracking-tighter uppercase italic">4. 附加服務 Additional Services</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <div className="relative group">
                  <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">雲端空間</p>
                  <select value={form.cloudStorage || '50GB'} onChange={e => setForm({...form, cloudStorage: e.target.value})} className="app-input-v7 appearance-none cursor-pointer">
                     <option value="50GB">50GB 標準版</option>
                     <option value="100GB">100GB 進階版</option>
                     <option value="500GB">500GB 專業版</option>
                     {role === 'super-admin' && <option value="Free">免費 (Free)</option>}
                  </select>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 text-[8px]">▼</span>
               </div>

               <div className="relative group">
                  <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">AI 生活</p>
                  <select value={form.aiLife || 'Basic'} onChange={e => setForm({...form, aiLife: e.target.value})} className="app-input-v7 appearance-none cursor-pointer">
                     <option value="Basic">基礎版 (Basic)</option>
                     <option value="Pro">專業版 (Pro)</option>
                     {role === 'super-admin' && <option value="Free">免費 (Free)</option>}
                  </select>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 text-[8px]">▼</span>
               </div>
            </div>
         </div>

              {/* AI Assistant Toggle */}
              <div className="pt-6 border-t border-slate-50">
                 <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-100">🤖</div>
                       <div>
                          <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest italic">AI 智能香客管家模組</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">內建自動客服、語意理解與香客自動應答</p>
                       </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setForm({...form, enableAi: !form.enableAi})}
                      className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${form.enableAi ? 'bg-indigo-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${form.enableAi ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                 </div>
              </div>

        <div className="flex flex-col gap-3 pt-8">
           <button type="submit" disabled={loading} className="w-full py-5 rounded-[24px] font-black text-white bg-slate-900 shadow-xl active:scale-95 transition-all hover:bg-emerald-600 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              {loading ? 'PROCESSING...' : (role === 'distributor' || role === 'super-admin' ? '立即開通帳戶 EXECUTE 🚀' : '提交開戶申請 SUBMIT 📤')}
           </button>
           <button type="button" onClick={onCancel} className="w-full py-4 rounded-[24px] font-black text-slate-400 bg-transparent hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest">CANCEL 返回</button>
        </div>

        <style jsx>{`
          .app-input-v7 {
            width: 100%;
            background: #fff;
            border: 2px solid #f1f5f9;
            border-radius: 20px;
            padding: 18px 24px;
            font-weight: 800;
            font-size: 14px;
            color: #0f172a;
            outline: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .app-input-v7:focus {
            border-color: #10b981;
            box-shadow: 0 10px 30px -10px rgba(16,185,129,0.2);
            transform: translateY(-1px);
          }
          .app-input-v7::placeholder {
            color: #cbd5e1;
            font-weight: 700;
          }
        `}</style>
      </form>
    </div>
  );
}
