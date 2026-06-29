import re

with open('src/app/super-admin/SuperAdminClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix model inputs
content = re.sub(r'value=\{model\.name\}', "value={model.name || ''}", content)
content = re.sub(r'value=\{model\.apiKey\}', "value={model.apiKey || ''}", content)
content = re.sub(r'checked=\{model\.isEnabled\}', "checked={!!model.isEnabled}", content)

# Fix b2bPayment checkbox inputs
content = re.sub(r'checked=\{b2bPayment\.thirdParty\?\.enabled\}', "checked={!!b2bPayment.thirdParty?.enabled}", content)
content = re.sub(r'checked=\{b2bPayment\.linePay\?\.enabled\}', "checked={!!b2bPayment.linePay?.enabled}", content)
content = re.sub(r'checked=\{b2bPayment\.customTransfer\?\.enabled\}', "checked={!!b2bPayment.customTransfer?.enabled}", content)

# Fix isChecked for serviceMapping
content = re.sub(r'const isChecked = b2bPayment\.serviceMapping\[service\.id\]\?\.includes\(provider\);', "const isChecked = !!b2bPayment.serviceMapping[service.id]?.includes(provider);", content)

with open('src/app/super-admin/SuperAdminClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
