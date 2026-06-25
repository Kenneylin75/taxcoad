import { 
  fetchFreeApplications,
  fetchSalesTools,
  fetchAllAccountsForAdmin,
  fetchSystemConfig
} from '../actions';
import SuperAdminClient from './SuperAdminClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
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

  return (
    <SuperAdminClient 
      initialStats={stats}
      initialAccounts={accounts}
      initialPlans={plans}
      initialMedia={initialTools}
      initialTemples={initialTemples}
    />
  );
}
