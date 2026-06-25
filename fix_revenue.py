import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'const monthlyRevenue = activeTemples \* db_config\.fixedMonthlyRent;')
replacement = r'const monthlyRevenue = db_temples.filter(t => t.status === \'Active\').reduce((sum, t) => sum + (t.monthlyRent || 0), 0);'

content = pattern.sub(replacement, content)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
