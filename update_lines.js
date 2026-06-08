const fs = require('fs');
const file = 'src/app/super-admin/SuperAdminClient.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const extractStart = 1180;
const extractEnd = 1228;

const extractedLines = lines.slice(extractStart, extractEnd + 1);

// Remove extracted lines
lines.splice(extractStart - 1, extractEnd - extractStart + 3); // removes lines 1179 to 1230

// Insert extracted lines at line 702 (after the <div className="space-y-6"> under activeTab === 'ai')
lines.splice(701, 0, ...extractedLines);

// Update activeTab definitions
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const [activeTab, setActiveTab] = useState")) {
    lines[i] = lines[i].replace(" | 'ai_settings'", "");
  }
  if (lines[i].includes("id: 'ai', label: 'AI 方案管理'")) {
    lines[i] = lines[i].replace("AI 方案管理", "AI 引擎與方案管理");
  }
  if (lines[i].includes("id: 'ai_settings', label: 'AI 引擎設定'")) {
    lines[i] = ""; // remove this line
    // remove the trailing comma from the previous line if necessary
    if (lines[i-1] && lines[i-1].endsWith(",")) {
        lines[i-1] = lines[i-1].slice(0, -1);
    }
  }
  if (lines[i].includes("{activeTab === 'ai' && 'AI 方案管理'}")) {
    lines[i] = "                 {activeTab === 'ai' && 'AI Central Hub'}";
  }
  if (lines[i].includes("{activeTab === 'ai_settings' && 'AI Core Engines'}")) {
    lines[i] = "";
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Update successful');
