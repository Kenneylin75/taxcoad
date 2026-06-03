const fs = require('fs');

// 1. Update actions.ts
let actionsContent = fs.readFileSync('src/app/actions.ts', 'utf8');

actionsContent = actionsContent.replace(
  /let bound_service_id = '';/,
  `let bound_service_id = '';\n  let price = 0;`
);

actionsContent = actionsContent.replace(
  /bound_service_id = data\.get\("bound_service_id"\) as string \|\| data\.get\("serviceId"\) as string;/,
  `bound_service_id = data.get("bound_service_id") as string || data.get("serviceId") as string;\n    price = Number(data.get("price")) || 0;`
);

actionsContent = actionsContent.replace(
  /bound_service_id = data\.bound_service_id \|\| data\.serviceId;/,
  `bound_service_id = data.bound_service_id || data.serviceId;\n    price = Number(data.price) || 0;`
);

actionsContent = actionsContent.replace(
  /bound_service_id,\n\s*status: "Available"\n\s*, templeId\}\);/,
  `bound_service_id,\n          price,\n          status: "Available"\n        , templeId});`
);

// We also need to add paymentMethod, paymentRef, paymentStatus to bookAppointment?
actionsContent = actionsContent.replace(
  /export async function bookAppointment\(slotId: number, guestName: string, phone: string\) \{/,
  `export async function bookAppointment(slotId: number, guestName: string, phone: string, paymentMethod?: string, paymentRef?: string) {`
);

actionsContent = actionsContent.replace(
  /status: "Confirmed"\n\s*\};\n\s*db_appointments\.push\(newAppointment\);/,
  `status: paymentMethod === 'Cash' || paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Confirmed' : 'Pending',\n        paymentMethod,\n        paymentRef,\n        paymentStatus: paymentMethod === 'Cash' || paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending'\n      };\n      db_appointments.push(newAppointment);`
);

// And confirmPayment should also handle 'Appointment'
actionsContent = actionsContent.replace(
  /if \(recordType === 'Lamp'\) \{/,
  `if (recordType === 'Lamp') {`
);
// I'll manually edit confirmPayment to add Appointment using regex
actionsContent = actionsContent.replace(
  /export async function confirmPayment\(recordId: string, recordType: 'Lamp' \| 'Event' \| 'Queue'\) \{/,
  `export async function confirmPayment(recordId: string, recordType: 'Lamp' | 'Event' | 'Queue' | 'Appointment') {`
);
actionsContent = actionsContent.replace(
  /db_lamp_records\[idx\]\.paymentStatus = 'Paid';\n\s*\}\n\s*\}/,
  `db_lamp_records[idx].paymentStatus = 'Paid';\n    }\n  }\n  if (recordType === 'Appointment') {\n    const idx = db_appointments.findIndex(r => r.id.toString() === recordId.toString());\n    if (idx > -1) {\n      db_appointments[idx].status = 'Confirmed';\n      db_appointments[idx].paymentStatus = 'Paid';\n    }\n  }`
);

fs.writeFileSync('src/app/actions.ts', actionsContent, 'utf8');

// 2. Update page.tsx
let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// Update UI where it sets price for appointments
pageContent = pageContent.replace(
  /price: !selectedService\?\.price \? '隨喜功德' : \`結緣金 \$\$\{selectedService\?\.price\}\`,/,
  `price: !slot.price && !selectedService?.price ? '隨喜功德' : \`結緣金 $\${slot.price || selectedService?.price}\`,`
);

// Add custom price input state
pageContent = pageContent.replace(
  /const \[paymentMethod, setPaymentMethod\] = useState<string>\(''\);/,
  `const [paymentMethod, setPaymentMethod] = useState<string>('');\n  const [customAmount, setCustomAmount] = useState<number>(100);`
);

pageContent = pageContent.replace(
  /const finalizeBooking = async \(\) => \{/,
  `const handleAppointmentPayment = async () => {\n                                const slotPrice = slot.price || selectedService?.price || 0;\n                                const finalPrice = slotPrice === 0 ? Number(prompt('請輸入隨喜功德金額：', '100')) || 100 : slotPrice;\n                                \n                                setPaymentIntent({\n                                  amount: finalPrice,\n                                  onPaid: async (gateway, ref) => {\n                                    const res = await bookAppointment(slot.id, guestUser.name, guestUser.phone, gateway, ref);\n                                    if (res.success) {\n                                      setSuccessInfo({ title: '預約成功', message: gateway === 'Transfer' || gateway === 'QR' ? '您的預約已提交，等待宮廟確認對帳。' : '預約已完成，請準時到場辦理聖事。' });\n                                      setIsDetailModalOpen(false);\n                                      loadData();\n                                    } else { alert(res.message); }\n                                  }\n                                });\n                              };\n\n                              const finalizeBooking = async () => {`
);

pageContent = pageContent.replace(
  /onConfirm: async \(\) => \{\n\s*const finalizeBooking = async \(\) => \{[\s\S]*?\}\n\s*\}\n\s*\},/,
  `onConfirm: handleAppointmentPayment,`
);

fs.writeFileSync('src/app/page.tsx', pageContent, 'utf8');

// 3. Update slots/page.tsx
let slotsContent = fs.readFileSync('src/app/[templeId]/admin/slots/page.tsx', 'utf8');

slotsContent = slotsContent.replace(
  /description: ''\n\s*\}\)/,
  `description: '',\n      price: 0\n    })`
);

// Form fields
slotsContent = slotsContent.replace(
  /<div className="md:col-span-2">\n\s*<label className="block text-\[10px\] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">時段備註 \/ 說明<\/label>/,
  `<div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">結緣金 (0=隨喜)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="輸入金額"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">時段備註 / 說明</label>`
);

// UI List
slotsContent = slotsContent.replace(
  /\{slot\.description\}\n\s*<\/p>\n\s*<\/div>/,
  `{slot.description}\n                        </p>\n                        {slot.price !== undefined && (\n                           <p className="text-xs font-bold text-slate-500 mt-1 uppercase">結緣金: {slot.price === 0 ? '隨喜功德' : \`NT$ \${slot.price}\`}</p>\n                        )}\n                      </div>`
);

fs.writeFileSync('src/app/[templeId]/admin/slots/page.tsx', slotsContent, 'utf8');

console.log('Updated slot pricing and payment');
