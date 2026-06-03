const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add updateAppointmentPayment to imports
content = content.replace(
  `bookAppointment, \n  fetchAvailableSlots,`,
  `bookAppointment, \n  updateAppointmentPayment,\n  fetchAvailableSlots,`
);

// 2. Add the button in renderHome -> activeAppointment
const oldUI = `                      <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase">
                        {(!activeAppointment.amount && activeAppointment.paymentMethod !== 'Cash') ? '隨喜功德' : 
                         (activeAppointment.amount ? \`\${activeAppointment.amount === 0 ? '隨喜功德' : '結緣金'}: NT$ \${activeAppointment.amount}\` : '現場付現')}
                      </p>
                    </>
                  ) : (`;

const newUI = `                      <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase">
                        {(!activeAppointment.amount && activeAppointment.paymentMethod !== 'Cash') ? '隨喜功德' : 
                         (activeAppointment.amount ? \`\${activeAppointment.amount === 0 ? '隨喜功德' : '結緣金'}: NT$ \${activeAppointment.amount}\` : '現場付現')}
                      </p>
                      {activeAppointment.paymentStatus === 'Pending' && (
                        <button
                          onClick={() => {
                            setPaymentIntent({
                              amount: activeAppointment.amount || 0,
                              onPaid: async (gateway, ref) => {
                                const res = await updateAppointmentPayment(activeAppointment.id, gateway, ref);
                                if (res.success) {
                                  alert('付款狀態已更新，等待宮廟對帳。');
                                  loadData();
                                } else {
                                  alert(res.message);
                                }
                              }
                            });
                            setIsDetailModalOpen(true);
                          }}
                          className="mt-2 w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                        >
                          💳 重新付款 / 更改付款方式
                        </button>
                      )}
                    </>
                  ) : (`;

content = content.split(oldUI).join(newUI);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Added re-payment button to guest UI');
