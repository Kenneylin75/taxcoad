const fs = require('fs');
const file = 'src/app/super-admin/SuperAdminClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update activeTab typing
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'approvals' | 'tools' | 'finance' | 'bridge' | 'logs' | 'settings' | 'space' | 'ai_settings' | 'ai' | 'b2b_payment'>('dashboard');",
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'approvals' | 'tools' | 'finance' | 'bridge' | 'logs' | 'settings' | 'space' | 'ai' | 'b2b_payment'>('dashboard');"
);

// 2. Update NavItems
content = content.replace(
  "{ id: 'ai', label: 'AI 方案管理', icon: '🤖' },",
  "{ id: 'ai', label: 'AI 引擎與方案管理', icon: '🤖' },"
);
content = content.replace(
  "             { id: 'b2b_payment', label: 'B2B收款設定', icon: '💳' },\n             { id: 'ai_settings', label: 'AI 引擎設定', icon: '🤖' }",
  "             { id: 'b2b_payment', label: 'B2B收款設定', icon: '💳' }"
);

// 3. Update Header
content = content.replace(
  "                 {activeTab === 'settings' && 'Global Configurations'}\n                  {activeTab === 'b2b_payment' && 'B2B Payment Gateway'}\n                 {activeTab === 'ai_settings' && 'AI Core Engines'}",
  "                 {activeTab === 'settings' && 'Global Configurations'}\n                  {activeTab === 'b2b_payment' && 'B2B Payment Gateway'}\n                 {activeTab === 'ai' && 'AI Central Hub'}"
);

// 4. Extract AI Settings Block
const aiSettingsStart = content.indexOf("{activeTab === 'ai_settings' && (");
if (aiSettingsStart === -1) throw new Error("Could not find ai_settings block start");

const aiSettingsEndString = "                      💾 儲存 AI 安全配置\n                     </button>\n                  </div>\n               </div>\n            </div>\n        )}";
const aiSettingsEnd = content.indexOf(aiSettingsEndString, aiSettingsStart) + aiSettingsEndString.length;

let aiSettingsBlock = content.substring(aiSettingsStart, aiSettingsEnd);

// Remove it from the end
content = content.substring(0, aiSettingsStart) + content.substring(aiSettingsEnd);

// Strip the activeTab condition wrapper from the extracted block
aiSettingsBlock = aiSettingsBlock.replace("{activeTab === 'ai_settings' && (", "");
aiSettingsBlock = aiSettingsBlock.replace(/}\)$/, "");
aiSettingsBlock = aiSettingsBlock.trim();

// 5. Insert into activeTab === 'ai'
const aiStartStr = "{activeTab === 'ai' && (\n             <div className=\"space-y-6\">";
const aiStart = content.indexOf(aiStartStr);
if (aiStart === -1) throw new Error("Could not find ai block start");

const aiInsertPointFinal = aiStart + aiStartStr.length;

content = content.substring(0, aiInsertPointFinal) + "\n\n               {/* --- AI 引擎設定 --- */}\n               " + aiSettingsBlock + "\n\n" + content.substring(aiInsertPointFinal);

fs.writeFileSync(file, content);
console.log('Update complete');
