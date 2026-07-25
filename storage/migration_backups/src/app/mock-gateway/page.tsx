"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MockGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const method = searchParams.get('method');
  const returnUrl = searchParams.get('returnUrl') || '/';

  useEffect(() => {
    if (!orderId) {
      alert("缺少訂單資訊");
      router.push('/');
    }
  }, [orderId, router]);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      // 打 Webhook
      const res = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'Paid', method })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 2000);
      } else {
        alert("付款驗證失敗：" + data.message);
        setIsProcessing(false);
      }
    } catch (err) {
      alert("網路錯誤，無法完成付款模擬");
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (confirm("確定要取消付款嗎？訂單將不會生效。")) {
      window.location.href = returnUrl;
    }
  };

  if (!orderId) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 text-center relative">
        <div className="bg-slate-900 p-6 text-white">
          <h1 className="text-xl font-black tracking-widest uppercase">
            {method === 'linePay' ? 'LINE Pay 測試環境' : method === 'ecpay' ? '綠界金流 測試閘道' : '金流模擬器'}
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">Order: {orderId}</p>
        </div>
        
        <div className="p-8 space-y-8">
          {isSuccess ? (
            <div className="animate-in zoom-in duration-500 py-10">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
                ✓
              </div>
              <h2 className="text-2xl font-black text-slate-800">付款成功</h2>
              <p className="text-sm text-slate-500 mt-2">系統正在為您導回前台，完成預約...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">應付總額</p>
                <p className="text-5xl font-black text-slate-900 font-mono tracking-tighter">
                  ${amount || '0'}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <button 
                  onClick={handlePay}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl font-black text-lg tracking-widest shadow-lg transition-all ${isProcessing ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'}`}
                >
                  {isProcessing ? '處理中...' : '💳 模擬刷卡成功'}
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="w-full py-3 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors"
                >
                  放棄付款並返回
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MockGatewayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400">載入金流模擬器中...</div>}>
      <MockGatewayContent />
    </Suspense>
  );
}
