const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Pass finalPrice to bookAppointment
content = content.replace(
  /const res = await bookAppointment\(slot\.id, guestUser\.name, guestUser\.phone, gateway, ref\);/,
  `const res = await bookAppointment(slot.id, guestUser.name, guestUser.phone, gateway, ref, finalPrice);`
);

// 2. Update renderHome activeAppointment UI
const oldUI = `                    {activeAppointment && (
                      <span className="bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-700">預約確認</span>
                    )}
                  </div>
                  {activeAppointment ? (
                    <>
                      <h4 className="font-bold text-gray-900 text-sm mt-1 truncate">{activeAppointment.service}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{activeAppointment.date} {activeAppointment.time} • {activeAppointment.staff}</p>
                    </>
                  ) : (`;

const newUI = `                    {activeAppointment && (
                      <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${
                        activeAppointment.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }\`}>
                        {activeAppointment.paymentStatus === 'Paid' ? '已付款' : '未完成預約: 待付款/對帳'}
                      </span>
                    )}
                  </div>
                  {activeAppointment ? (
                    <>
                      <h4 className="font-bold text-gray-900 text-sm mt-1 truncate">{activeAppointment.service}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{activeAppointment.date} {activeAppointment.time} • {activeAppointment.staff}</p>
                      <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase">
                        {(!activeAppointment.amount && activeAppointment.paymentMethod !== 'Cash') ? '隨喜功德' : 
                         (activeAppointment.amount ? \`\${activeAppointment.amount === 0 ? '隨喜功德' : '結緣金'}: NT$ \${activeAppointment.amount}\` : '現場付現')}
                      </p>
                    </>
                  ) : (`;

content = content.replace(oldUI, newUI);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Updated page.tsx for guest appointment tracking');
