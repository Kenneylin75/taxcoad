'use client';

import React, { useState, useEffect } from 'react';
import { fetchAiChatLogs } from '@/app/actions';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function AiChatMonitorClient({ initialLogs }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // 定期輪詢以獲取最新的對話紀錄 (每 10 分鐘，為了方便 demo 可以縮短，但依照需求描述是每 10 分鐘記錄一次/拉取一次)
    const interval = setInterval(async () => {
      const updatedLogs = await fetchAiChatLogs();
      setLogs(updatedLogs);
    }, 600000); // 10分鐘
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {logs.length === 0 ? (
        <div className="p-10 text-center text-slate-500">
          目前沒有任何 AI 對話紀錄。
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {logs.map((log: any) => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="transition-colors hover:bg-slate-50">
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between focus:outline-none"
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">信眾手機</div>
                      <div className="font-mono text-slate-800 font-medium">{log.phone}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">對話時間</div>
                      <div className="text-slate-600">{new Date(log.createdAt).toLocaleString('zh-TW')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">消耗 Token (概算)</div>
                      <div className="text-amber-600 font-bold">{log.userQuery.length + log.aiReply.length}</div>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/50">
                    <div className="space-y-4 max-w-4xl">
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">Q</span>
                          信眾詢問
                        </h4>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-600 leading-relaxed shadow-sm">
                          {log.userQuery}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">A</span>
                          AI 回覆
                        </h4>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-800 leading-relaxed shadow-sm">
                          {log.aiReply}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
