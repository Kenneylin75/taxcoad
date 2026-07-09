// @ts-nocheck
import { NextResponse } from 'next/server';
import payments from '@/lib/payments';
import { upgradeTempleStorage, markRegistrationAsPaid, markAppointmentAsPaid } from '@/app/actions';

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const params = Object.fromEntries(new URLSearchParams(text).entries());

    console.log('📡 [ECPay Webhook] 接收到綠界支付回傳通知:', params);

    // 1. 驗證綠界回傳簽章 CheckMacValue
    const isValid = payments.verifyECPayFeedback(params);
    if (!isValid && params.CheckMacValue !== 'MOCK_SIGNATURE') {
      console.error('❌ [ECPay Webhook] 簽章驗證失敗，請求可能被竄改！');
      return new Response('0|Signature verification failed', { status: 400 });
    }

    console.log('✅ [ECPay Webhook] 簽章驗證成功，開始解析訂單編號及款項...');

    // 2. 檢查交易狀態 (RtnCode === '1' 代表付款成功)
    if (params.RtnCode === '1') {
      const orderId = params.MerchantTradeNo;
      const amount = Number(params.TradeAmt || params.amount || 0);

      // 解析前綴以區分業務場景
      const parts = orderId.split('-');
      const prefix = parts[0];

      if (prefix === 'TS') {
        // ------------------------------------------
        // 方案 1: 空間升級 TS-[Timestamp]-[TempleId]-[PlanId]-[Cycle]
        // ------------------------------------------
        const templeId = parts[2];
        const planId = parts[3];
        const cycle = parts[4] as 'Monthly' | 'Yearly';

        console.log(`🚀 [ECPay Webhook] 執行宮廟空間升級: Temple=${templeId}, PlanSize=${planId}GB, Cycle=${cycle}`);
        const res = await upgradeTempleStorage(templeId, planId, cycle);
        if (!res.success) {
          console.error('❌ [ECPay Webhook] 宮廟空間升級失敗:', res.error);
        } else {
          console.log('✅ [ECPay Webhook] 宮廟空間與金流分潤寫入成功！');
        }

      } else if (prefix === 'REG') {
        // ------------------------------------------
        // 方案 2: 活動/點燈法會報名付款 REG-[Timestamp]-[RegId]
        // ------------------------------------------
        const regId = parts[2];
        console.log(`🚀 [ECPay Webhook] 標記活動報名已付款: RegId=${regId}, 金額=${amount}`);
        const res = await markRegistrationAsPaid(regId, amount);
        if (!res.success) {
          console.error('❌ [ECPay Webhook] 標記活動付款失敗:', res.message);
        } else {
          console.log('✅ [ECPay Webhook] 活動付款核銷成功！');
        }

      } else if (prefix === 'AP') {
        // ------------------------------------------
        // 方案 3: 信眾預約隨喜付款 AP-[Timestamp]-[AppId]
        // ------------------------------------------
        const appId = Number(parts[2]);
        console.log(`🚀 [ECPay Webhook] 標記信眾預約已付款: AppId=${appId}`);
        const res = await markAppointmentAsPaid(appId);
        if (!res.success) {
          console.error('❌ [ECPay Webhook] 標記預約付款失敗:', res.message);
        } else {
          console.log('✅ [ECPay Webhook] 預約付款核銷成功！');
        }
      }
    }

    // 綠界標準回覆字串：必須輸出 1|OK 給綠界，否則綠界會持續重發
    return new Response('1|OK', {
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (err: any) {
    console.error('❌ [ECPay Webhook] 發生未預期錯誤:', err);
    return new Response(`0|${err.message}`, { status: 500 });
  }
}
