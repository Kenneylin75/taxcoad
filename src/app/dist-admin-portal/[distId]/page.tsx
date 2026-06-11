// @ts-nocheck
import {
 
  fetchDistributorProfile, fetchDistributorTeam, fetchFreeApplications, 
  fetchDistributorCapacity, fetchDistributorCommissionSummary, fetchSalesTools 
} from "@/app/actions";
import DistAdminClient from "./DistAdminClient";

export default async function DistributorAdminPage({ params }: { params: Promise<{ distId: string }> | { distId: string } }) {
  const resolvedParams = await params;
  const distId = resolvedParams.distId;

  // Fetch initial data on the server for better performance and SEO
  const [profile, team, apps, capacity, commission, tools] = await Promise.all([
    fetchDistributorProfile(distId),
    fetchDistributorTeam(distId),
    fetchFreeApplications(distId),
    fetchDistributorCapacity(distId),
    fetchDistributorCommissionSummary(distId, '2026', '05'),
    fetchSalesTools()
  ]);

  return (
    <DistAdminClient 
      distId={distId}
      initialProfile={profile}
      initialTeam={team || []}
      initialApps={apps || []}
      initialCapacity={capacity}
      initialCommission={commission}
      initialTools={tools || []}
    />
  );
}
