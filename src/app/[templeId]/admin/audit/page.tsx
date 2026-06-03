// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllWithdrawals, approveWithdrawal, rejectWithdrawal, getCurrentRole, AppRole } from '@/app/actions';

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  operator: string;
  action: string;
  target: string;
}

export default function AuditCenterPage() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'contracts' | 'logs'>('logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const handleExportLogs = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        let csv = '時間,層級,執行者,操作動作,目標\n';
        filteredLogs.forEach(l => {
          csv += `${l.timestamp},${l.level},${l.operator},${l.action},${l.target}\n`;
        });
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `系統日誌_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error(e);
        alert('匯出失敗');
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };


  // Mock Logs for Temple
  const mockLogs: SystemLog[] = [
    { id: '1', timestamp: '2026-04-29 14:20:12', level: 'INFO', operator: '宮廟主委', action: '修改服務設定項目', target: '元辰宮深度觀修' },
    { id: '2', timestamp: '2026-04-29 15:05:44', level: 'WARN', operator: '行政人員', action: '取消預約行程', target: '信眾 [王大明] - ID_9920' },
    { id: '3', timestamp: '2026-04-29 16:12:00', level: 'SUCCESS', operator: '李師傅', action: '完成數位案卷存檔', target: '張曉明 - 觀修數位紀錄' },
    { id: '4', timestamp: '2026-04-29 17:30:22', level: 'INFO', operator: '系統自動化', action: '發送全域 LINE 推播', target: '12 則數位預約提醒' },
    { id: '5', timestamp: '2026-04-29 18:45:10', level: 'ERROR', operator: '金流治理', action: '偵測到交易核銷異常', target: '交易編號 #TX9902' },
    { id: '6', timestamp: '2026-04-28 09:30:00', level: 'SUCCESS', operator: '宮廟主委', action: '啟動全維度 AGI 管家', target: '前端數位互動介面' },
  ];

  const loadData = async () => {
    setLoading(true);
    const r = await getCurrentRole();
    setRole(r);
    
    if (r === 'SuperAdmin') {
      const data = await fetchAllWithdrawals();
      setWithdrawals(data);
      setActiveTab('withdrawals');
    } else {
      setActiveTab('logs');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: number, type: 'approve' | 'reject') => {
    if(!confirm(`確定要${type === 'approve' ? '核准' : '拒絕'}此提領申請嗎？`)) return;
    if (type === 'approve') await approveWithdrawal(id);
    else await rejectWithdrawal(id);
    loadData();
  };

  const filteredLogs = useMemo(() => {
    return mockLogs.filter(log => {
      const matchesSearch = log.operator.includes(searchQuery) || log.action.includes(searchQuery) || log.target.includes(searchQuery);
      const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
      return matchesSearch && matchesLevel;
    });
  }, [searchQuery, filterLevel]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">初始化稽核系統中...</p>
      </div>
    );
  }

  const isTemple = role === 'TempleAdmin' || role === 'Staff';

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {isTemple ? '系統異動日誌' : '全域稽核中心'}
          </h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Security Audit Infrastructure</p>
        </div>

        {!isTemple && (
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             {[
               { id: 'withdrawals', label: '提領核定' },
               { id: 'contracts', label: '合約庫' },
               { id: 'logs', label: '行為日誌' }
             ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab.label}
                </button>
             ))}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
         <div className="flex-1 w-full relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
            <input 
              type="text" 
              placeholder="搜尋身分、行為或標的關鍵字..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm font-bold focus:border-amber-500 focus:bg-white outline-none transition-all"
            />
         </div>
         <div className="flex gap-1 bg-slate-50 p-1 rounded-xl shrink-0">
            {['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR'].map(level => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all uppercase ${
                  filterLevel === level 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {level}
              </button>
            ))}
         </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'logs' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">時間軸活動紀錄</span>
                <button 
                onClick={handleExportLogs}
                disabled={isExporting}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isExporting ? '匯出中...' : '匯出報表 💾'}
              </button>
             </div>

             <div className="space-y-4 relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 rounded-full pointer-events-none"></div>

                {filteredLogs.map((log) => (
                  <div key={log.id} className="relative pl-12 group">
                     <div className={`absolute left-0 top-3 w-3 h-3 rounded-full border-4 border-white shadow-sm z-10 transition-all group-hover:scale-125 ${
                       log.level === 'SUCCESS' ? 'bg-emerald-500' :
                       log.level === 'WARN' ? 'bg-amber-500' :
                       log.level === 'ERROR' ? 'bg-rose-500' : 
                       'bg-slate-900'
                     }`}></div>

                     <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group-hover:border-amber-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                           <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                 log.level === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                 log.level === 'WARN' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                 log.level === 'ERROR' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                 'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                                 {log.level}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 font-serif">{log.timestamp}</span>
                           </div>
                           <h4 className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-all">{log.action}</h4>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">執行者:</span>
                              <span className="text-[10px] font-bold text-slate-600">@{log.operator}</span>
                              <span className="text-slate-200 mx-1">|</span>
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">標的:</span>
                              <span className="text-[10px] font-bold text-slate-600">{log.target}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => setSelectedLog(log)} title="檢視詳細資料" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-100">👁️</button>
                           <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(log, null, 2)); alert('日誌資料已複製到剪貼簿！'); }} title="複製資料" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-100">📋</button>
                        </div>
                     </div>
                  </div>
                ))}

                {filteredLogs.length === 0 && (
                   <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">查無相符之日誌紀錄</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'withdrawals' && !isTemple && (
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center text-xl shadow-lg border border-slate-800">💰</div>
                    <div>
                       <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">數位提領審核佇列</h3>
                       <p className="text-[10px] text-slate-400 font-bold mt-0.5">Withdrawal Audit HUD</p>
                    </div>
                 </div>
                 <div className="bg-amber-500 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-lg shadow-sm border border-amber-600 uppercase tracking-widest">
                    待處理: {withdrawals.length} 筆
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">申請身分 / ID</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">申請提領金額</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">申請時戳</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">稽核核定</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {withdrawals.map((w) => (
                       <tr key={w.id} className="hover:bg-slate-50 transition-all group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-slate-900 text-amber-500 rounded-lg flex items-center justify-center text-[10px] font-black border border-slate-800">
                                  {w.agentId[0]}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-all">{w.agentId}</span>
                                  <span className="text-[10px] font-bold text-slate-400">#NODE-9920</span>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-baseline gap-1">
                               <span className="text-[10px] font-black text-amber-600 uppercase">NT$</span>
                               <span className="text-xl font-black text-slate-800 font-serif">{w.amount.toLocaleString()}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-xs font-black text-slate-400 font-serif">{w.date}</span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                              <button onClick={() => handleAction(w.id, 'approve')} className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl shadow-sm hover:bg-slate-900 transition-all uppercase tracking-widest border border-emerald-500">
                                 核准 ⚔️
                              </button>
                              <button onClick={() => handleAction(w.id, 'reject')} className="px-4 py-2 bg-white text-rose-600 text-[10px] font-black rounded-xl shadow-sm hover:bg-rose-50 transition-all uppercase tracking-widest border border-rose-200">
                                 拒絕 ❌
                              </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           </div>
        )}
      </div>
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <span className="text-xl">📜</span> 日誌詳細資料
                 </h3>
                 <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
              </div>
              <div className="p-6 overflow-y-auto">
                 <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">操作時間</span>
                      <p className="font-medium text-slate-800">{selectedLog.timestamp}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系統層級</span>
                      <p className="mt-1"><span className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest ${
                            selectedLog.level === 'ERROR' ? 'bg-red-50 text-red-600 border border-red-100' :
                            selectedLog.level === 'WARN' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            selectedLog.level === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>{selectedLog.level}</span></p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">執行者</span>
                      <p className="font-medium text-slate-800">{selectedLog.operator}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">操作動作</span>
                      <p className="font-bold text-slate-900">{selectedLog.action}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目標物件</span>
                      <p className="font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 text-sm mt-1">{selectedLog.target}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raw Data</span>
                      <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto mt-1 shadow-inner font-mono">{JSON.stringify(selectedLog, null, 2)}</pre>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
