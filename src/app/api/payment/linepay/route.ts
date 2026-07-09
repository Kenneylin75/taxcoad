// @ts-nocheck
import { NextResponse } from 'next/server';
import payments from '@/lib/payments';
import { upgradeTempleStorage, markRegistrationAsPaid, markAppointmentAsPaid } from '@/app/actions';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount') || 0);

    if (!transactionId || !orderId) {
      return NextResponse.json({ success: false, error: '缺少交易資訊' }, { status: 400 });
    }

    console.log(`📡 [LINE Pay Confirm] 接收到確認跳轉: TransactionId=${transactionId}, OrderId=${orderId}`);

    // 1. 執行 LINE Pay 確認付款 API
    const confirmRes = await payments.confirmLinePayPayment(transactionId, amount);
    if (!confirmRes.success) {
      console.error('❌ [LINE Pay Confirm] 交易扣款確認失敗:', confirmRes.error || confirmRes.message);
      return NextResponse.redirect(new URL('/?error=linepay_failed', req.url));
    }

    console.log('✅ [LINE Pay Confirm] 付款完成！開始解析業務並寫入資料庫...');

    // 2. 解析前綴以區分業務場景
    const parts = orderId.split('-');
    const prefix = parts[0];
    let redirectPath = '/';

    if (prefix === 'TS') {
      const templeId = parts[2];
      const planSizeGb = Number(parts[3]);
      const cycle = parts[4] as 'Monthly' | 'Yearly';

      console.log(`🚀 [LINE Pay Confirm] 升級容量: Temple=${templeId}, Size=${planSizeGb}GB, Cycle=${cycle}`);
      await upgradeTempleStorage(templeId, planSizeGb, cycle);
      redirectPath = `/temple/settings?success=storage_upgraded`;

    } else if (prefix === 'REG') {
      const regId = parts[2];
      console.log(`🚀 [LINE Pay Confirm] 標記活動報名已付款: RegId=${regId}`);
      await markRegistrationAsPaid(regId, amount);
      redirectPath = `/temple/events?success=paid`;

    } else if (prefix === 'AP') {
      const appId = Number(parts[2]);
      console.log(`🚀 [LINE Pay Confirm] 標記預約已付款: AppId=${appId}`);
      await markAppointmentAsPaid(appId);
      redirectPath = `/temple/calendar?success=paid`;
    }

    // 重新導向至成功頁面
    return NextResponse.redirect(new URL(redirectPath, req.url));

  } catch (err: any) {
    console.error('❌ [LINE Pay Confirm] 發生未預期錯誤:', err);
    return NextResponse.redirect(new URL('/?error=linepay_exception', req.url));
  }
}
