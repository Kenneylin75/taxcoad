import sys

with open('src/app/super-admin/SuperAdminClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('</div>}', '</div>')

with open('src/app/super-admin/SuperAdminClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
