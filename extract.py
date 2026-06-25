import re

with open('src/app/super-admin/SuperAdminClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'\{activeTab === \'ai\' && \(\s*<div className="space-y-6">.*?</div>\s*\)\}', content, re.DOTALL)
if match:
    with open('extracted_ai_tab.txt', 'w', encoding='utf-8') as out:
        out.write(match.group(0))
    print("Extracted successfully.")
else:
    print("Match not found.")
