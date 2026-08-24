import { fetchAiChatLogs, fetchTempleAiUsage } from '@/app/actions';
import AiChatMonitorClient from './AiChatMonitorClient';

export default async function AiChatPage() {
  const initialLogs = await fetchAiChatLogs();
  const usage = await fetchTempleAiUsage();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI 客服對話監控</h1>
          <p className="text-slate-500 mt-1">即時查看信眾與 AI 助理的互動對話，了解信眾常見疑問與意圖。</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-medium mb-1">本年度 AI 使用次數</p>
          <div className="text-3xl font-black text-fuchsia-600">{usage?.userQueryCount?.toLocaleString() || 0}</div>
        </div>
      </div>
      
      <AiChatMonitorClient initialLogs={initialLogs} />
    </div>
  );
}
