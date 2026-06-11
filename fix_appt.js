const fs = require('fs');
let code = fs.readFileSync('src/app/[templeId]/admin/customers/page.tsx', 'utf8');

const apptMatch = `{event.status === 'Arrived' ? (
                                        <span className="text-sm font-medium text-emerald-600 flex items-center gap-2 ml-4">
                                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 已到場
                                        </span>
                                      ) : (
                                        <button 
                                          onClick={async () => {
                                            if (confirm(\`確定標記已抵達現場？\`)) {
                                              await import('@/app/actions').then(m => m.markAppointmentAsArrived(event.id));
                                              if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors ml-4"
                                        >
                                          ✅ 標記為已到場
                                        </button>
                                      )}`;

const newApptMatch = `{event.status === 'Arrived' ? (
                                        <span className="text-sm font-medium text-emerald-600 flex items-center gap-2 ml-4">
                                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 已到場
                                        </span>
                                      ) : (
                                        <button 
                                          onClick={async () => {
                                            if (confirm(\`確定標記已抵達現場？\`)) {
                                              await import('@/app/actions').then(m => m.markAppointmentAsArrived(event.id));
                                              if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors ml-4"
                                        >
                                          ✅ 標記為已到場
                                        </button>
                                      )}
                                      
                                      {event.paymentStatus === 'Pending' && event.paymentMethod === 'Cash' && (
                                        <button 
                                          onClick={async () => {
                                            if (confirm('確定已收取現金並標記為已付款？')) {
                                              await import('@/app/actions').then(m => m.confirmPayment(event.id.toString(), 'Appointment'));
                                              if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors ml-4 px-3 py-1 bg-red-50 rounded-lg border border-red-100"
                                        >
                                          💵 標記為已付款
                                        </button>
                                      )}
                                      {event.paymentStatus === 'Paid' && (
                                        <span className="text-sm font-medium text-emerald-600 ml-4">✓ 已結帳</span>
                                      )}`;

if (code.includes('確定標記已抵達現場')) {
  code = code.replace(apptMatch, newApptMatch);
  fs.writeFileSync('src/app/[templeId]/admin/customers/page.tsx', code);
  console.log('Appt replaced');
} else {
  console.log('Could not find match');
}
