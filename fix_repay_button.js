const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldButton = `                      {activeAppointment.paymentStatus === 'Pending' && (
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
                      )}`;

const newButton = `                      {activeAppointment.paymentStatus === 'Pending' && (
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
                            setDetailContent({
                              title: activeAppointment.service,
                              category: '預約對帳',
                              price: activeAppointment.amount ? '應付 NT$ ' + activeAppointment.amount : '隨喜功德',
                              description: '請選擇您偏好的付款方式，以完成預約。'
                            });
                            setIsDetailModalOpen(true);
                          }}
                          className="mt-2 w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                        >
                          💳 重新付款 / 更改付款方式
                        </button>
                      )}`;

content = content.replace(oldButton, newButton);
fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Fixed re-payment button to set detailContent');
