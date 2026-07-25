// @ts-nocheck
import React from 'react';
import { fetchFinancialOverview, fetchFreeApplications, getTempleBasicInfo } from '@/app/actions';
import FinancialManagerClient from './FinancialManagerClient';
import { AlertCircle } from 'lucide-react';

export default async function BillingPage({ params }: { params: Promise<{ templeId: string }> | { templeId: string } }) {
  const resolvedParams = await params;
  const templeId = resolvedParams.templeId;
  const [financialData, freeApps, templeInfo] = await Promise.all([
    fetchFinancialOverview(),
    fetchFreeApplications(),
    getTempleBasicInfo(templeId)
  ]);

  let isExpired = false;
  if (templeInfo && templeInfo.billingStartDate) {
    const expirationDate = new Date(templeInfo.billingStartDate);
    expirationDate.setDate(expirationDate.getDate() + 3); // 3 天寬限期
    
    if (new Date() >= expirationDate) {
      isExpired = true;
    }
  }

  return (
    <div className="space-y-6">
      {isExpired && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold text-sm">您的免費體驗及寬限期已結束</h3>
            <p className="text-red-600 text-xs mt-1">
              為確保系統正常運作，請盡速完成開辦費或租金的繳納。上傳匯款憑證後，系統將會即刻自動為您解鎖所有功能！
            </p>
          </div>
        </div>
      )}
      <FinancialManagerClient initialData={financialData} freeApps={freeApps} />
    </div>
  );
}
