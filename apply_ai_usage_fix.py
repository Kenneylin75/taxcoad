import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
export async function fetchAllTempleAiUsage() {
  // Returns AI usage for all temples, joining with temple profiles and plans
  return db_temple_ai_usage.map(usage => {
    const temple = db_temples.find(t => t.id === usage.templeId) || { templeName: '未知宮廟', name: '未知宮廟', city: '未知' };
    const plan = db_ai_plans.find(p => p.id === usage.planId) || { name: '無方案', chatLimit: 0 };
    return { 
      ...usage, 
      templeName: temple.templeName || temple.name || '未知宮廟', 
      city: temple.city || '未知',
      planName: plan.name, 
      chatLimit: plan.chatLimit || 0 
    };
  });
}
"""

content = re.sub(r'export async function fetchAllTempleAiUsage\(\) \{[\s\S]*?return \{ \.\.\.usage, templeName: temple\.name, planName: plan\.name, chatLimit: plan\.chatLimit \|\| 0 \};\s*\}\);\s*\}', new_func, content)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
