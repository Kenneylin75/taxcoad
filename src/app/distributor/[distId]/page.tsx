import { 
  fetchDistributorProfile, 
  fetchDistributorTeam, 
  fetchFreeApplications, 
  fetchDistributorCapacity, 
  fetchDistributorCommissionSummary,
  fetchDistributorTemples,
  fetchDistributorVisits,
  fetchSalesTools,
  fetchDistributorFinancials,
  fetchDistributorLogs
} from '../../actions';
import DistributorClient from '../DistributorClient';

export default async function DistributorPage({ params }: { params: Promise<{ distId: string }> | { distId: string } }) {
  const resolvedParams = await params;
  const distributorId = resolvedParams.distId;
  
  const [profile, team, apps, capacity, commission, temples, visits, tools, financials, logs] = await Promise.all([
    fetchDistributorProfile(distributorId),
    fetchDistributorTeam(distributorId),
    fetchFreeApplications(),
    fetchDistributorCapacity(distributorId),
    fetchDistributorCommissionSummary(distributorId, '2026', '05'),
    fetchDistributorTemples(distributorId),
    fetchDistributorVisits(distributorId),
    fetchSalesTools(),
    fetchDistributorFinancials(distributorId),
    fetchDistributorLogs(distributorId)
  ]);

  return (
    <DistributorClient 
      initialProfile={profile}
      initialTeam={team || []}
      initialApps={apps || []}
      initialCapacity={capacity}
      initialCommission={commission}
      initialTemples={temples || []}
      initialVisits={visits || []}
      initialTools={tools || []}
      initialFinancials={financials || { paymentRecords: [], bonusRequests: [] }}
      initialLogs={logs || []}
    />
  );
}