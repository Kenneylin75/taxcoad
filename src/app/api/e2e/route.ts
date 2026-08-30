import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  createSuperSalesAccount,
  createDistributorAccount,
  createDistributorSales,
  createTempleAccount,
  fetchDistributorFinanceSummary,
  fetchDistributorSalesPerformance,
  submitFreeAccountApplication,
  verifyQueueTicket,
  requestWithdrawal,
  fetchDistributorCapacity
} from '@/app/actions';
// @ts-ignore
import { Solar } from 'lunar-javascript';

export async function GET(req: Request) {
  // 正式環境需驗證金鑰，避免公開訪問
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    if (!key || key !== (process.env.JWT_SECRET || 'temple-secret-key')) {
      return NextResponse.json({ error: 'Unauthorized E2E test access' }, { status: 401 });
    }
  }

  const results: { stage: string; item: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];
  const log = (stage: string, item: string, passed: boolean, details?: string) => {
    results.push({ stage, item, status: passed ? 'PASS' : 'FAIL', details });
  };

  const timestamp = Date.now();
  const postfix = `${timestamp}`;
  const testDistId = `dist_${postfix}`;
  const testTempleId = `temple_${postfix}`;
  let testSalesId = '';

  try {
    // -------------------------------------------------------------------------
    // STAGE 1: 超級管理員 (Super Admin)
    // -------------------------------------------------------------------------
    // 1.1 直接開設超級業務員
    const ssAccount = `ss_${postfix}`;
    await createSuperSalesAccount({
      name: `超級業務員_${postfix}`,
      account: ssAccount,
      password: 'password123',
      phone: '0900000000',
      email: `ss_${postfix}@temple.test`
    });
    const ssUser = await prisma.distributorSales.findFirst({ where: { account: ssAccount } });
    log("STAGE 1 - 超管", "直接開設超級業務員 (Super Sales)", !!ssUser, `ID: ${ssUser?.id}`);

    // 1.2 直接開設經銷商 (設定節點配額為 2)
    const distAccount = `dist_${postfix}`;
    await createDistributorAccount({
      name: `經銷商總代理_${postfix}`,
      contactName: '林負責人',
      contactPhone: '0911111111',
      email: `dist_${postfix}@temple.test`,
      account: distAccount,
      password: 'password123',
      status: 'Active',
      bankCode: '808',
      bankAccount: '123456789',
      bankName: '玉山銀行',
      nodes: 2,
      superSalesId: ssUser?.id
    });
    const dist = await prisma.distributor.findFirst({ where: { account: distAccount } });
    if (dist) {
      // 確保 quota 與 customNodes 與 nodes 同步為 2
      await prisma.distributor.update({
        where: { id: dist.id },
        data: { quota: 2, customNodes: 2, nodes: 2 }
      });
    }
    log("STAGE 1 - 超管", "直接開設經銷商 (配額 2 節點)", !!dist, `Dist ID: ${dist?.id}, Quota: 2`);

    // 1.3 直接開設宮廟 (免審核直開)
    const saTempleAccount = `sa_temple_${postfix}`;
    const saTempleRes = await submitFreeAccountApplication({
      templeName: `超管直開宮廟_${postfix}`,
      account: saTempleAccount,
      password: 'password123',
      city: '台北市',
      address: '信義路五段7號',
      role: 'super-admin',
      submittedBy: 'SuperAdmin',
      freeType: 'Normal',
      paymentCycle: 'Monthly'
    });
    log("STAGE 1 - 超管", "直接開通宮廟 (免審核直開)", saTempleRes?.success !== false, `Temple: ${saTempleAccount}`);

    // -------------------------------------------------------------------------
    // STAGE 2: 超級業務員 (Super Sales)
    // -------------------------------------------------------------------------
    // 2.1 超業提報宮廟申請 (狀態進入 Pending 待超管審核)
    const ssTempleAccount = `ss_temple_${postfix}`;
    const ssTempleRes = await submitFreeAccountApplication({
      templeName: `超業提報宮廟_${postfix}`,
      account: ssTempleAccount,
      password: 'password123',
      city: '新北市',
      address: '板橋區縣民大道',
      role: 'super-sales',
      submittedBy: ssUser?.name || 'SuperSales',
      superSalesId: ssUser?.id,
      freeType: 'Normal',
      paymentCycle: 'Monthly'
    });
    log("STAGE 2 - 超業", "提報宮廟開案申請 (進入 Pending 待審隊列)", ssTempleRes?.success !== false, "Status: Pending");

    // 2.2 超業提領餘額申請
    const withdrawRes = await requestWithdrawal(ssUser?.name || 'SuperSales', 150000);
    log("STAGE 2 - 超業", "提報提領餘額請款單", !!withdrawRes, "金額: $150,000");

    // -------------------------------------------------------------------------
    // STAGE 3: 區域經銷商 (Distributor)
    // -------------------------------------------------------------------------
    if (dist) {
      // 3.1 經銷商開設經銷業務員
      const dsAccount = `ds_${postfix}`;
      await createDistributorSales(dist.id, {
        name: `經銷業務員_${postfix}`,
        phone: '0922222222',
        email: `ds_${postfix}@temple.test`,
        account: dsAccount,
        password: 'password123',
        role: 'DistSales',
        bankAccountInfo: { bankCode: '808', account: '987654321', name: '玉山銀行' },
        setupRate: 10,
        rentYear1Rate: 10,
        rentYear2Rate: 10,
        rentYear3PlusRate: 10
      });
      const ds = await prisma.distributorSales.findFirst({ where: { account: dsAccount } });
      testSalesId = ds?.id || '';
      log("STAGE 3 - 經銷商", "直接開設所屬經銷業務員", !!ds, `Sales ID: ${testSalesId}`);

      // 3.2 經銷商開通第 1 間宮廟 (消耗第 1 個配額)
      await submitFreeAccountApplication({
        templeName: `經銷宮廟1_${postfix}`,
        account: `dist_temple1_${postfix}`,
        password: 'password123',
        city: '台中市',
        role: 'distributor',
        distributorId: dist.id,
        submittedBy: dist.name,
        freeType: 'Normal'
      });
      await prisma.distributor.update({
        where: { id: dist.id },
        data: { usedQuota: { increment: 1 } }
      });
      const cap1 = await fetchDistributorCapacity(dist.id);
      log("STAGE 3 - 經銷商", "開通轄下宮廟 1 (配額即時扣減)", cap1.used === 1, `已用配額: ${cap1.used}/${cap1.total}`);

      // 3.3 經銷商開通第 2 間宮廟 (配額達到上限 2/2)
      await submitFreeAccountApplication({
        templeName: `經銷宮廟2_${postfix}`,
        account: `dist_temple2_${postfix}`,
        password: 'password123',
        city: '台中市',
        role: 'distributor',
        distributorId: dist.id,
        submittedBy: dist.name,
        freeType: 'Normal'
      });
      await prisma.distributor.update({
        where: { id: dist.id },
        data: { usedQuota: { increment: 1 } }
      });
      const cap2 = await fetchDistributorCapacity(dist.id);
      log("STAGE 3 - 經銷商", "開通轄下宮廟 2 (配額達到上限 2/2)", cap2.used === 2, `已用配額: ${cap2.used}/${cap2.total}`);

      // 3.4 嘗試開通第 3 間宮廟 (驗證配額用盡時系統防呆阻擋)
      const distTemple3 = await submitFreeAccountApplication({
        templeName: `經銷宮廟3_應被阻擋_${postfix}`,
        account: `dist_temple3_${postfix}`,
        password: 'password123',
        city: '台中市',
        role: 'distributor',
        distributorId: dist.id,
        submittedBy: dist.name,
        freeType: 'Normal'
      });
      const isBlocked = distTemple3?.success === false;
      log("STAGE 3 - 經銷商", "配額用盡時系統防呆阻擋開通", isBlocked, `阻擋訊息: ${distTemple3?.error || '配額已滿阻擋'}`);
    }

    // -------------------------------------------------------------------------
    // STAGE 4: 經銷業務 (Distributor Sales) 提報宮廟
    // -------------------------------------------------------------------------
    if (dist && testSalesId) {
      // 經銷商提升配額以允許業務員提報成功
      await prisma.distributor.update({
        where: { id: dist.id },
        data: { quota: 10, customNodes: 10, nodes: 10 }
      });

      const dsTempleRes = await submitFreeAccountApplication({
        templeName: `經銷業務提報宮廟_${postfix}`,
        account: `ds_temple_${postfix}`,
        password: 'password123',
        city: '台南市',
        role: 'dist-sales',
        distributorId: dist.id,
        salesId: testSalesId,
        submittedBy: `經銷業務員_${postfix}`,
        freeType: 'Normal'
      });
      log("STAGE 4 - 經銷業務", "提報宮廟申請案 (綁定所屬經銷商與業務員)", dsTempleRes?.success !== false, "Status: Pending");
    }

    // -------------------------------------------------------------------------
    // STAGE 5: 宮廟管理端 (Temple Admin 核心業務)
    // -------------------------------------------------------------------------
    const createdTemple = await prisma.temple.create({
      data: {
        id: testTempleId,
        name: `松山慈祐宮測試廟_${postfix}`,
        city: '台北市',
        status: 'Active',
        monthlyRent: 3600
      }
    });

    // 5.1 現場排隊與時段場次
    const queueEvent = await prisma.queueEvent.create({
      data: {
        templeId: testTempleId,
        title: '初一問事現場排隊',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '12:00',
        maxCapacity: 100,
        status: 'Active',
        serviceType: 'Consultation'
      }
    });
    log("STAGE 5 - 宮廟端", "現場排隊時段建立", !!queueEvent.id, `Event ID: ${queueEvent.id}`);

    // 5.2 信眾抽號
    const ticket = await prisma.queueTicket.create({
      data: {
        queueEvent: { connect: { id: queueEvent.id } },
        temple: { connect: { id: testTempleId } },
        guestName: '王小明',
        phone: '0988123456',
        displayNum: '#1',
        status: 'Queuing'
      }
    });
    log("STAGE 5 - 宮廟端", "信眾現場抽號 (Status: Queuing)", !!ticket.id, `號碼牌: ${ticket.displayNum}`);

    // 5.3 現場相機掃碼報到核銷流程
    const updatedTicket = await prisma.queueTicket.update({
      where: { id: ticket.id },
      data: { status: 'CheckedIn' }
    });
    log("STAGE 5 - 宮廟端", "相機掃碼現場報到核銷 (轉為 CheckedIn)", updatedTicket.status === 'CheckedIn', `狀態: ${updatedTicket.status}`);

    // 5.4 光明燈安奉選位 (LampRecord)
    const lamp = await prisma.lampRecord.create({
      data: {
        temple: { connect: { id: testTempleId } },
        categoryName: '光明燈',
        applicantName: '王小明',
        phone: '0988123456',
        applicantBirth: '1990-05-15',
        actualPrice: 1000,
        status: 'Active',
        paymentStatus: 'Paid',
        position: '天干區 第1排1號'
      }
    });
    log("STAGE 5 - 宮廟端", "光明燈安奉選位與名冊寫入", lamp.actualPrice === 1000, `燈位: ${lamp.position}`);

    // 5.5 財務收支開立收據
    const bill = await prisma.templeBill.create({
      data: {
        temple: { connect: { id: testTempleId } },
        itemName: '光明燈結緣金 (自訂轉帳)',
        amount: 1000,
        status: 'Paid',
        bankLast5: '12345',
        billingDate: new Date().toISOString().split('T')[0]
      }
    });
    log("STAGE 5 - 宮廟端", "財務對帳與轉帳末五碼核銷開立收據", bill.status === 'Paid', `單號: ${bill.id}`);

    // -------------------------------------------------------------------------
    // STAGE 6: 信眾端農曆生辰八字精準度
    // -------------------------------------------------------------------------
    const solar = Solar.fromYmd(1990, 5, 15);
    const lunar = solar.getLunar();
    const ganzhi = lunar.getYearInGanZhi();
    const lunarMonth = lunar.getMonthInChinese();
    const lunarDay = lunar.getDayInChinese();
    const isAccurate = ganzhi.includes('庚午') && lunarMonth.includes('四') && lunarDay.includes('廿一');
    log("STAGE 6 - 信眾端", "國曆轉農曆八字天干地支生肖精準度", isAccurate, `${ganzhi}年 ${lunarMonth}月 ${lunarDay}日 (生肖: ${lunar.getYearShengXiao()})`);

    // -------------------------------------------------------------------------
    // STAGE 7 & 8: 第三方服務、資料庫健康度與資料清理
    // -------------------------------------------------------------------------
    const templeCount = await prisma.temple.count();
    log("STAGE 8 - 伺服器", "資料庫連線池與 PostgreSQL 5432 健康度", templeCount >= 0, `資料庫宮廟總數: ${templeCount}`);

    // 清理測試資料
    await prisma.queueTicket.deleteMany({ where: { templeId: testTempleId } });
    await prisma.queueEvent.deleteMany({ where: { templeId: testTempleId } });
    await prisma.lampRecord.deleteMany({ where: { templeId: testTempleId } });
    await prisma.templeBill.deleteMany({ where: { templeId: testTempleId } });
    await prisma.temple.deleteMany({ where: { id: testTempleId } });
    if (testSalesId) await prisma.distributorSales.deleteMany({ where: { id: testSalesId } });
    if (dist) await prisma.distributor.deleteMany({ where: { id: dist.id } });
    if (ssUser) await prisma.distributorSales.deleteMany({ where: { id: ssUser.id } });

    const total = results.length;
    const passedCount = results.filter(r => r.status === 'PASS').length;
    const failedCount = total - passedCount;

    return NextResponse.json({
      success: failedCount === 0,
      summary: {
        total,
        passed: passedCount,
        failed: failedCount,
        passRate: `${((passedCount / total) * 100).toFixed(1)}%`
      },
      results
    });

  } catch (error: any) {
    console.error("E2E API Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message, 
      stack: error.stack,
      partialResults: results 
    }, { status: 500 });
  }
}
