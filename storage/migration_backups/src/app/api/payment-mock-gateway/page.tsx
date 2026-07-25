'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function GatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId') || `TS-${Date.now()}`;
  const amount = Number(searchParams.get('amount') || 300);
  const gateway = searchParams.get('gateway') || 'ecpay';
  const confirmUrl = searchParams.get('confirmUrl') || '';
  const cancelUrl = searchParams.get('cancelUrl') || '';

  const [cardNumber, setCardNumber] = useState('4311 9522 8888 1234');
  const [expiry, setExpiry] = useState('12/30');
  const [cvc, setCvc] = useState('888');
  const [cardName, setCardName] = useState('信眾金流付款戶');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // 當付款成功時啟動倒數跳轉
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      // 倒數結束，執行路由重定向
      if (gateway === 'linepay' && confirmUrl) {
        // LINE Pay 模式：重定向至我們的 confirm API 路由
        const confirmApiUrl = `/api/payment/linepay?transactionId=MOCK_TX_${Date.now()}&orderId=${orderId}&amount=${amount}`;
        router.push(confirmApiUrl);
      } else {
        // 綠界模式：重定向回宮廟設定或日曆頁面
        if (orderId.startsWith('TS')) {
          router.push('/temple/settings?success=storage_upgraded');
        } else if (orderId.startsWith('REG')) {
          router.push('/temple/events?success=paid');
        } else {
          router.push('/temple/calendar?success=paid');
        }
      }
    }
  }, [success, countdown, gateway, confirmUrl, orderId, amount, router]);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. 發送背景 Webhook 模擬請求至 /api/payment/ecpay
      const response = await fetch('/api/payment/ecpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          MerchantTradeNo: orderId,
          RtnCode: '1',
          TradeAmt: amount.toString(),
          CheckMacValue: 'MOCK_SIGNATURE',
        }).toString(),
      });

      const text = await response.text();
      console.log('📡 [Mock Gateway] Webhook 核銷結果:', text);

      if (text.includes('1|OK')) {
        setSuccess(true);
      } else {
        alert('付款核銷失敗，請檢查 API 伺服器狀態。');
      }
    } catch (err) {
      console.error(err);
      alert('無法連接至付款 API 伺服器。');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (gateway === 'linepay' && cancelUrl) {
      router.push(cancelUrl);
    } else {
      router.push('/temple/calendar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none font-sans text-white">
      {/* 炫彩背景光暈 */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-rose-500/20 rounded-full blur-[120px]"></div>

      {/* 金流卡片主體 */}
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* 頂部標題 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-black text-indigo-400 tracking-wider uppercase mb-3">
            ✨ SaaS 官方安全支付模擬網關
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {gateway === 'linepay' ? '💬 LINE Pay 快捷付款' : '💳 綠界科技 安全刷卡'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            訂單編號: <span className="font-mono text-slate-300 font-bold">{orderId}</span>
          </p>
        </div>

        {/* 訂單明細簡約看板 */}
        <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-6 mb-8 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">應付總金額</p>
            <p className="text-3xl font-black text-rose-500 mt-1">
              ${amount.toLocaleString()} <span className="text-sm font-bold text-slate-400">TWD</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">付款場景</p>
            <p className="text-xs font-black text-slate-200 mt-1.5">
              {orderId.startsWith('TS') ? '雲端儲存空間升級' : orderId.startsWith('REG') ? '點燈活動報名費' : '隨喜功德/日常預約'}
            </p>
          </div>
        </div>

        {/* 刷卡模擬主面板 */}
        {!success ? (
          <div className="space-y-6">
            {gateway !== 'linepay' ? (
              <>
                {/* 高仿實體卡片 */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-black tracking-widest italic text-white/80">PREMIUM SAAS CARD</span>
                    <span className="text-xl">💳</span>
                  </div>
                  <div className="mb-6">
                    <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold">卡片號碼</p>
                    <p className="text-lg font-mono tracking-widest font-black text-white mt-1">{cardNumber}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[8px] text-white/50 uppercase tracking-widest font-bold">持卡人姓名</p>
                      <p className="text-xs font-bold text-white mt-0.5">{cardName}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[8px] text-white/50 uppercase tracking-widest font-bold">有效期限</p>
                        <p className="text-xs font-mono font-bold text-white mt-0.5">{expiry}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-white/50 uppercase tracking-widest font-bold">安全碼</p>
                        <p className="text-xs font-mono font-bold text-white mt-0.5">{cvc}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 卡片輸入欄位 */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">信用卡號碼</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">有效期限 (MM/YY)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:border-indigo-500 focus:outline-none transition-colors text-center"
                        value={expiry}
                        onChange={e => setExpiry(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">安全碼 (CVC)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:border-indigo-500 focus:outline-none transition-colors text-center"
                        value={cvc}
                        onChange={e => setCvc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* LINE Pay 模擬介面 */
              <div className="py-8 flex flex-col items-center justify-center text-center bg-[#06C755]/10 border border-[#06C755]/20 rounded-2xl">
                <span className="text-5xl mb-4">💬</span>
                <h3 className="text-lg font-black text-[#06C755]">一鍵啟動 LINE Pay 行動支付</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                  系統已與 LINE Pay V3 簽章協議對接，點選付款後即可模擬成功撥款與金流自動分攤流程。
                </p>
              </div>
            )}

            {/* 控制按鈕 */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="py-4 bg-slate-950 border border-white/10 text-slate-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                ❌ 取消付款
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className={`py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 ${
                  gateway === 'linepay'
                    ? 'bg-[#06C755] hover:bg-[#05b54c] text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {loading ? '⏳ 正在通訊核銷...' : '🚀 模擬付款成功'}
              </button>
            </div>
          </div>
        ) : (
          /* 付款成功動畫與倒數提示 */
          <div className="py-12 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center text-3xl text-emerald-400 animate-bounce">
              ✓
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-400">模擬交易成功！</h3>
              <p className="text-xs text-slate-400 mt-2">
                資料庫已成功接收 RLS 金流 Webhook，並完成資料表更新與收益拆分。
              </p>
            </div>
            <div className="px-6 py-2.5 rounded-full bg-slate-950/80 border border-white/5 text-xs text-slate-300 font-bold">
              ⏳ 系統將於 <span className="font-mono text-rose-400 font-extrabold text-sm">{countdown}</span> 秒後自動跳轉回系統...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MockGatewayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">載入支付安全元件中...</div>}>
      <GatewayContent />
    </Suspense>
  );
}
