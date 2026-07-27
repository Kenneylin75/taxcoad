import os
with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("await jsonStore.readJson('super_sales_overrides')", "({})")
content = content.replace("// migrated ({}) to ({})", "")
with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
