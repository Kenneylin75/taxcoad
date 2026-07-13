import os

path = 'src/app/super-sales/[salesId]/SuperSalesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("w.status === 'Approved' || w.status === 'Paid' || w.status === 'Verified'", "w.status === 'Approved'")
content = content.replace(">已付款</span>", ">已匯款</span>")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reverted SuperSalesClient.tsx successfully!")
