import os

files = [
    'src/app/components/DistributorApplicationForm.tsx',
    'src/app/distributor/DistributorClient.tsx'
]

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "解付銀行" in content:
        content = content.replace("解付銀行", "支付銀行")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path}")
