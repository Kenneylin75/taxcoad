const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldBlock = `<span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">未完成預約</span>
                    {activeAppointment && (
                      <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${
                        activeAppointment.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }\`}>
                        {activeAppointment.paymentStatus === 'Paid' ? '已付款' : '未完成預約: 待付款/對帳'}
                      </span>
                    )}`;

const newBlock = `<span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">已預約</span>
                    {activeAppointment && (
                      <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${
                        activeAppointment.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }\`}>
                        {activeAppointment.paymentMethod === 'Cash' 
                          ? (activeAppointment.paymentStatus === 'Paid' ? '現金支付: 已付款' : '現金支付: 未付款')
                          : (activeAppointment.paymentStatus === 'Paid' ? '已付款' : '未完成預約: 待付款/對帳')
                        }
                      </span>
                    )}`;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Fixed text strings in page.tsx');
