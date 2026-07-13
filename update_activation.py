import os

path = 'src/app/[templeId]/admin/activation/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import_target = "import { updateTempleBasicInfo } from '@/app/actions';"
import_replacement = "import { updateTempleBasicInfo, fetchTemplePaymentTarget } from '@/app/actions';"
content = content.replace(import_target, import_replacement)

state_target = """  const [isSubmitting, setIsSubmitting] = useState(false);"""
state_replacement = """  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankInfo, setBankInfo] = useState({ bankCode: '808', bankName: '玉山銀行', accountNo: '1234-5678-9012', accountName: '星宇科技服務有限公司' });

  React.useEffect(() => {
     fetchTemplePaymentTarget(templeId).then(info => {
        if (info) setBankInfo(info);
     });
  }, [templeId]);"""
content = content.replace(state_target, state_replacement)

render_target = """              <div className="text-slate-500">銀行代碼</div>
              <div className="text-slate-900 text-right">808 玉山銀行</div>
              <div className="text-slate-500">收款帳號</div>
              <div className="text-slate-900 text-right">1234-5678-9012</div>
              <div className="text-slate-500">戶名</div>
              <div className="text-slate-900 text-right">星宇科技服務有限公司</div>"""
render_replacement = """              <div className="text-slate-500">銀行代碼</div>
              <div className="text-slate-900 text-right">{bankInfo.bankCode} {bankInfo.bankName}</div>
              <div className="text-slate-500">收款帳號</div>
              <div className="text-slate-900 text-right">{bankInfo.accountNo}</div>
              <div className="text-slate-500">戶名</div>
              <div className="text-slate-900 text-right">{bankInfo.accountName}</div>"""
content = content.replace(render_target, render_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated activation page")
