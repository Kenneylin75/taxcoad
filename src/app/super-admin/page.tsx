import { 
  fetchFreeApplications,
  fetchSalesTools,
  fetchAllAccountsForAdmin,
  fetchSystemConfig,
  fetchAllWithdrawals
} from '../actions';
import SuperAdminClient from './SuperAdminClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  try {
    const accounts = await fetchAllAccountsForAdmin();
    
    // 動態取得總宮廟數
    let totalTemples = 0;
    try {
      const memTemples = (globalThis as any).db_temples || [];
      totalTemples = memTemples.length;
    } catch (e) {}
    // 再加上記憶體尚未寫入的宮廟數
    const memTemples = (globalThis as any).db_temples || [];
    const memOnlyTemples = memTemples.filter((t: any) => t.id && String(t.id).includes('temple-'));
    if (totalTemples === 0) totalTemples = memTemples.length;

    const stats = {
      temples: totalTemples,
      distributors: accounts.filter((a: any) => a.role === 'Distributor').length,
      superSales: accounts.filter((a: any) => a.role === 'SuperSales').length,
      users: totalTemples * 15 // 假設每間宮廟有 15 位信眾
    };

    const config = await fetchSystemConfig();
    const plans = config.distributorPlans;
    
    const initialTools = await fetchSalesTools();
    const initialTemples = await fetchFreeApplications();
    const allWithdrawals = await fetchAllWithdrawals();
    const superSalesWithdrawals = allWithdrawals.filter((w: any) => 
      accounts.some((a: any) => a.role === 'SuperSales' && a.name === w.salesName)
    );

    return (
      <SuperAdminClient 
        initialStats={stats}
        initialAccounts={accounts}
        initialPlans={plans}
        initialMedia={initialTools}
        initialTemples={initialTemples}
        initialWithdrawals={superSalesWithdrawals}
      />
    );
  } catch (error: any) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: 'red' }}>
        <h2>伺服器錯誤 (Server Error)</h2>
        <p>在加載超級管理員頁面時發生錯誤，這通常是資料庫連線或環境變數問題：</p>
        <pre style={{ background: '#f4f4f4', padding: '1rem', overflowX: 'auto', color: '#333' }}>
          {error?.message || String(error)}
        </pre>
        {error?.stack && (
          <pre style={{ background: '#f4f4f4', padding: '1rem', overflowX: 'auto', color: '#666', fontSize: '12px' }}>
            {error.stack}
          </pre>
        )}
      </div>
    );
  }
}
