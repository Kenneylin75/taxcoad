import re
import os

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove all explicit jsonStore reads
# e.g., const pData = await jsonStore.find('personnel');
code = re.sub(r'const\s+\w+\s*=\s*(?:await\s+)?jsonStore\.find\([^)]+\);', '', code)
code = re.sub(r'let\s+\w+\s*=\s*(?:await\s+)?jsonStore\.find\([^)]+\);', '', code)

# 2. Remove try/catch blocks that swallow db errors
# try { const res = await dbQuery(...) } catch(e) {}
def replacer_try_catch(m):
    # m.group(1) is the content inside try
    return m.group(1)

code = re.sub(r'try\s*\{\s*(const\s+res\w*\s*=\s*await\s+dbQuery[^;]+;[^}]+)\}\s*catch\s*\([^)]*\)\s*\{\s*\}', replacer_try_catch, code)

# 3. Remove inline jsonStore fallbacks
# e.g., (await jsonStore.find('admins')).some(...)
code = re.sub(r'\(\s*(?:await\s+)?jsonStore\.find\([^)]+\)\s*\)', '([])', code)
code = re.sub(r'(?:await\s+)?jsonStore\.find\([^)]+\)', '([])', code)

# 4. Remove jsonStore writes
# e.g., await jsonStore.createRecord(...)
code = re.sub(r'(?:await\s+)?jsonStore\.createRecord\([^)]+\);?', '', code)
code = re.sub(r'(?:await\s+)?jsonStore\.updateRecord\([^)]+\);?', '', code)
code = re.sub(r'(?:await\s+)?jsonStore\.deleteRecord\([^)]+\);?', '', code)
code = re.sub(r'(?:await\s+)?jsonStore\.atomicWrite\([^)]+\);?', '', code)

# 5. Remove getSafeJsonArray and getSafeJsonObject usages
code = re.sub(r'(?:await\s+)?getSafeJsonArray\([^)]+\)', '([])', code)
code = re.sub(r'(?:await\s+)?getSafeJsonObject\([^)]+\)', '({})', code)

# 6. Remove jsonStore import
code = re.sub(r'import\s+\*\s+as\s+jsonStore\s+from\s+[\'"]@/lib/jsonStore[\'"];?', '', code)
code = re.sub(r'import\s+\{\s*getSafeJsonArray[^}]+\}\s+from\s+[\'"]@/app/actions[\'"];?', '', code)

# Save
with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("actions.ts cleaned of jsonStore usages")
