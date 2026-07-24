
import sys
import codecs

path = 'src/app/super-admin/SuperAdminClient.tsx'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

target = 'const newQuotaStr = prompt(請確認或修改經銷商配額（目前申請： 組）, String(currentQuota)); if (newQuotaStr) { const newQuota = parseInt(newQuotaStr, 10); if (!isNaN(newQuota) && newQuota >= 0) { approveDistributorBySuperAdmin(app.id, newQuota).then(()=>window.location.reload()); } else { alert(配額必須是有效的正整數); } }'

replacement = 'const newQuotaStr = prompt(\請確認或修改經銷商配額（目前申請：\ 組）\, String(currentQuota)); if (newQuotaStr) { const newQuota = parseInt(newQuotaStr, 10); if (!isNaN(newQuota) && newQuota >= 0) { approveDistributorBySuperAdmin(app.id, newQuota).then(()=>window.location.reload()); } else { alert(\'配額必須是有效的正整數\'); } }'

if target in content:
    content = content.replace(target, replacement)
    with codecs.open(path, 'w', 'utf-8') as f:
        f.write(content)
    print('Fixed')
else:
    print('Not found')

