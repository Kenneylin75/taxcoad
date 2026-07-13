import os

path = 'src/app/dist-sales-portal/[distId]/[salesId]/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("w.status === 'Verified' || w.status === 'Approved'", "w.status === 'Verified' || w.status === 'Approved' || w.status === 'Paid'")
content = content.replace("🖼️ 查看匯款憑證", "👁️ 查看匯款憑證")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated dist-sales-portal successfully!")
