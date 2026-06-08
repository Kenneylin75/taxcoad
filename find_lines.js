const fs = require('fs');
const lines = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8').split('\n');
const aiSettingsStart = lines.findIndex(l => l.includes("activeTab === 'ai_settings' && ("));
const aiSettingsEnd = lines.findIndex((l, i) => i > aiSettingsStart && l.includes("💾 儲存 AI 安全配置"));
const aiStart = lines.findIndex(l => l.includes("activeTab === 'ai' && ("));
console.log('aiSettingsStart:', aiSettingsStart);
console.log('aiSettingsEnd:', aiSettingsEnd);
console.log('aiStart:', aiStart);
