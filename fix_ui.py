import re

with open('src/app/super-admin/SuperAdminClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace storage VIP hide condition
pattern1 = re.compile(r'\{\(\!templeStorages\.find\(s => s\.templeId === viewingAccountDetail\.id\)\?\.isVip\) && \(\s*(<div className="mt-3 flex gap-2 items-center">)', re.DOTALL)
content = pattern1.sub(r'\1', content)

pattern1_close = re.compile(r'(<button \s*onClick=\{async \(\) => \{\s*await grantTempleStorageVip.*?設為無限免費</button>\s*</div>)\s*\)', re.DOTALL)
content = pattern1_close.sub(r'\1', content)

# Replace AI VIP hide condition
pattern2 = re.compile(r'\{\(\!allTempleAiUsage\.find\(a => a\.templeId === viewingAccountDetail\.id\)\?\.isVip\) && \(\s*(<div className="mt-3 flex gap-2 items-center">)', re.DOTALL)
content = pattern2.sub(r'\1', content)

pattern2_close = re.compile(r'(<button \s*onClick=\{async \(\) => \{\s*await grantTempleAiVip.*?設為無限免費</button>\s*</div>)\s*\)', re.DOTALL)
content = pattern2_close.sub(r'\1', content)

with open('src/app/super-admin/SuperAdminClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
