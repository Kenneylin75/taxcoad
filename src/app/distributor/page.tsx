import { 
  fetchDistributorTeam, 
  fetchDistributorTemples, 
  fetchDistributorVisits, 
  fetchDistributorFinanceSummary,
  fetchSalesTools
} from '../actions';
import DistributorClient from './DistributorClient';

export default async function DistributorPage() {
  const distributorId = 'dist-1';
  const team = await fetchDistributorTeam(distributorId);
  const temples = await fetchDistributorTemples(distributorId);
  const visits = await fetchDistributorVisits(distributorId);
  const finance = await fetchDistributorFinanceSummary(distributorId);
  const tools = await fetchSalesTools();

  return (
    <DistributorClient 
      distributorId={distributorId}
      initialTeam={team}
      initialTemples={temples}
      initialVisits={visits}
      initialFinance={finance}
      initialTools={tools}
    />
  );
}