// @ts-nocheck
import { 
  fetchDistributorTeam, 
  fetchDistributorTemples, 
  fetchDistributorVisits, 
  fetchDistributorFinanceSummary,
  fetchSalesTools
} from '@/app/actions';
import DistAdminClient from "./DistAdminClient";

export default async function DistributorAdminPage({ params }: { params: Promise<{ distId: string }> | { distId: string } }) {
  const resolvedParams = await params;
  const distId = resolvedParams.distId;

  const [team, temples, visits, finance, tools] = await Promise.all([
    fetchDistributorTeam(distId),
    fetchDistributorTemples(distId),
    fetchDistributorVisits(distId),
    fetchDistributorFinanceSummary(distId),
    fetchSalesTools()
  ]);

  return (
    <DistAdminClient 
      initialProfile={{ id: distId, name: "經銷總部", code: distId, joinedAt: "2024-01-10", bankInfo: { bankName: "國泰世華銀行 (013)", accountName: "授權經銷代理商", accountNumber: "1234567890" } }}
      initialTeam={team || []}
      initialApps={temples || []}
      initialCapacity={{ total: 100, used: temples?.length || 0, plan: "企業旗艦方案", nextRenewal: "2027-01-10", planDetails: ["獨立高可用資料庫節點", "24/7 專屬技術顧問支援", "優先金流撥款通道", "進階行銷模組無限次使用"] }}
      initialCommission={finance || { netProfit: 0 }}
    />
  );
}
