import { fetchAnalyticsSettings, fetchComplexAnalyticsData } from "@/app/actions";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const settings = await fetchAnalyticsSettings();
  const data = await fetchComplexAnalyticsData();

  return (
    <AnalyticsClient initialSettings={settings} data={data} />
  );
}
