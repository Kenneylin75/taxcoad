import { fetchQueueEvents, fetchQueueDashboard } from "@/app/actions";
import PublicQueueDisplay from "./PublicQueueDisplay";

export default async function LiveQueuePage() {
  const events = (await fetchQueueEvents()) || [];
  const activeEvent = events.find(e => e.status === 'Active');
  const dashboard = await fetchQueueDashboard(activeEvent?.id);
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-10 lg:p-20">
        <div className="w-full max-w-7xl">
           <PublicQueueDisplay 
             events={events} 
             tickets={dashboard?.tickets || []}
           />
        </div>
    </div>
  );
}
