import { 
  fetchFreeApplications,
  fetchSalesTools,
  fetchAllAccountsForAdmin,
  fetchSystemConfig
} from '../actions';
import SuperAdminClient from './SuperAdminClient';

export default async function SuperAdminPage() {
  const stats = {
    temples: 42501,
    distributors: 128,
    superSales: 24,
    users: 852400
  };
  
  const accounts = await fetchAllAccountsForAdmin();

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
