const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// Find activeTab useState and replace its type
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'settings' | 'space' | 'finance' | 'approvals' | 'bridge' | 'tools' | 'logs' | 'ai_settings'>('dashboard');",
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'settings' | 'space' | 'finance' | 'approvals' | 'bridge' | 'tools' | 'logs' | 'ai_settings' | 'ai'>('dashboard');"
);

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content);
