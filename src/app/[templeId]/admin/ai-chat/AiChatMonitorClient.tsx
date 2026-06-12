'use client';

import React, { useState, useEffect } from 'react';
import { fetchAiChatLogs } from '@/app/actions';

export default function AiChatMonitorClient({ initialLogs }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 定期輪詢以獲取最新的對話紀錄
    const interval = setInterval(async () => {
      const updatedLogs = await fetchAiChatLogs();
      setLogs(updatedLogs);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {logs.length === 0 ? (
        <div className="p-10 text-center text-slate-500">
          目前沒有任何 AI 對話紀錄。
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">信眾手機號碼</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">發問時間</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">信眾詢問內容</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">AI 回覆內容</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-slate-700">{log.phone}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(log.createdAt).toLocaleString('zh-TW')}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    {log.userQuery}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    {log.aiReply}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
