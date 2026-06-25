import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix upgradeTempleStorage to reset isVip
pattern = re.compile(r'(storage\.quotaGb = plan\.sizeGb;\s*storage\.planName = \$\{plan\.name\} \(\$\{plan\.sizeGb\}GB\)\;)')
replacement = r'\1\n      storage.capacityGb = plan.sizeGb;\n      storage.isVip = false;'
content = pattern.sub(replacement, content)

# Fix the db query path as well
pattern2 = re.compile(r'(await client\.query\(\s*UPDATE temple_storages SET quota_gb = \, plan_name = \ WHERE temple_id = \,.*?\);\s*\})', re.DOTALL)
replacement2 = r'\1\n      const gStore = globalThis as any;\n      if (gStore.db_temple_storages) {\n        const s = gStore.db_temple_storages.find((x: any) => x.templeId === templeId);\n        if (s) { s.isVip = false; s.capacityGb = plan.size_gb; s.quotaGb = plan.size_gb; }\n      }'
content = pattern2.sub(replacement2, content)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
