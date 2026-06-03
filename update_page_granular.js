const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Update paymentIntent type
const oldIntentType = `const [paymentIntent, setPaymentIntent] = useState<{ amount: number, onPaid: (method: string, ref: string) => void } | null>(null);`;
const newIntentType = `const [paymentIntent, setPaymentIntent] = useState<{ amount: number, module: 'Booking' | 'Lamp' | 'Event' | 'Queue', onPaid: (method: string, ref: string) => void } | null>(null);`;
content = content.replace(oldIntentType, newIntentType);

// 2. Update paymentIntent usage in renderPaymentModal
const oldCashBtn = `{paymentConfig?.cash?.enabled !== false && (
               <button onClick={async () => { if (paymentIntent.onPaid) { await paymentIntent.onPaid('Cash'); } setPaymentIntent(null); setIsDetailModalOpen(false); }} className="col-span-2 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2">
                 💵 現場現金付款
               </button>
             )}`;

const newCashBtn = `{paymentConfig?.cash?.enabled !== false && 
               ((paymentIntent.module === 'Booking' && paymentConfig?.cash?.allowBooking !== false) ||
                (paymentIntent.module === 'Lamp' && paymentConfig?.cash?.allowLamp !== false) ||
                (paymentIntent.module === 'Event' && paymentConfig?.cash?.allowEvent !== false) ||
                (paymentIntent.module === 'Queue' && paymentConfig?.cash?.allowQueue !== false)) && (
               <button onClick={async () => { if (paymentIntent.onPaid) { await paymentIntent.onPaid('Cash'); } setPaymentIntent(null); setIsDetailModalOpen(false); }} className="col-span-2 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2">
                 💵 現場現金付款
               </button>
             )}`;

content = content.replace(oldCashBtn, newCashBtn);

// 3. Update all setPaymentIntent calls to include module
// A) In renderHome / activeAppointment
content = content.replace(
  `setPaymentIntent({
                              amount: activeAppointment.amount || 0,
                              onPaid: async (gateway, ref) => {`,
  `setPaymentIntent({
                              module: 'Booking',
                              amount: activeAppointment.amount || 0,
                              onPaid: async (gateway, ref) => {`
);

// B) In renderBooking / handleAppointmentPayment
content = content.replace(
  `setPaymentIntent({
                                  amount: finalPrice,
                                  onPaid: async (gateway, ref) => {`,
  `setPaymentIntent({
                                  module: 'Booking',
                                  amount: finalPrice,
                                  onPaid: async (gateway, ref) => {`
);

// C) In renderLighting / create order
content = content.replace(
  `setPaymentIntent({
                                amount: selectedCategory.price,
                                onPaid: async (gateway, ref) => {`,
  `setPaymentIntent({
                                module: 'Lamp',
                                amount: selectedCategory.price,
                                onPaid: async (gateway, ref) => {`
);

// D) In renderEvents / booking event
content = content.replace(
  `setPaymentIntent({
                                amount: ev.price,
                                onPaid: async (gateway, ref) => {`,
  `setPaymentIntent({
                                module: 'Event',
                                amount: ev.price,
                                onPaid: async (gateway, ref) => {`
);

// E) In renderQueue / line up
content = content.replace(
  `setPaymentIntent({
                                amount: selectedQueueItem.price,
                                onPaid: async (gateway, ref) => {`,
  `setPaymentIntent({
                                module: 'Queue',
                                amount: selectedQueueItem.price,
                                onPaid: async (gateway, ref) => {`
);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Updated page.tsx with granular payment intent module types');
