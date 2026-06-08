const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/audit/page.tsx', 'utf8');

// 1. Add fetchAuditLogs to imports
content = content.replace(
  `import { fetchAllWithdrawals, approveWithdrawal, rejectWithdrawal, getCurrentRole, AppRole } from '@/app/actions';`,
  `import { fetchAllWithdrawals, approveWithdrawal, rejectWithdrawal, getCurrentRole, AppRole, fetchAuditLogs } from '@/app/actions';`
);

// 2. Add logs state
content = content.replace(
  `const [activeTab, setActiveTab] = useState<'withdrawals' | 'contracts' | 'logs'>('logs');`,
  `const [activeTab, setActiveTab] = useState<'withdrawals' | 'contracts' | 'logs'>('logs');\n  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);`
);

// 3. Remove mockLogs and update loadData
content = content.replace(
  `  // Mock Logs for Temple
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
  };`,
  `  const loadData = async () => {
    setLoading(true);
    const r = await getCurrentRole();
    setRole(r);
    
    const logs = await fetchAuditLogs();
    setSystemLogs(logs);

    if (r === 'SuperAdmin') {
      const data = await fetchAllWithdrawals();
      setWithdrawals(data);
      setActiveTab('withdrawals');
    } else {
      setActiveTab('logs');
    }
    setLoading(false);
  };`
);

// 4. Update filteredLogs to use systemLogs
content = content.replace(
  `  const filteredLogs = useMemo(() => {
    return mockLogs.filter(l => {`,
  `  const filteredLogs = useMemo(() => {
    return systemLogs.filter(l => {`
);

fs.writeFileSync('src/app/[templeId]/admin/audit/page.tsx', content);
console.log('Done audit page update');
