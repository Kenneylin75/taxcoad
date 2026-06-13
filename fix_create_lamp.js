const fs = require('fs');
const filePath = 'C:\\Users\\KenneyLin\\.gemini\\antigravity\\scratch\\temple-app\\src\\app\\actions.ts';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /export async function createLampRecord\([\s\S]*?\)\s*\{[\s\S]*?(?=\nexport async function |\n\/\/ |\n$|\nexport let|\nlet|\nconst )/;

const match = content.match(regex);
if (match) {
  content = content.replace(match[0], `export async function createLampRecord(data: any) { 
  let phone = ''; let categoryId = ''; let guestName = ''; let notice = ''; let paymentMethod = ''; let paymentRef = '';
  if (data instanceof FormData) {
    phone = data.get('phone') as string; categoryId = data.get('categoryId') as string; guestName = data.get('guestName') as string; notice = data.get('notice') as string; paymentMethod = data.get('paymentMethod') as string || 'Cash'; paymentRef = data.get('paymentRef') as string || '';
  } else {
    phone = data.phone; categoryId = data.categoryId; guestName = data.guestName; notice = data.notice; paymentMethod = data.paymentMethod || 'Cash'; paymentRef = data.paymentRef || '';
  }

  const templeId = await getDynamicTempleId();

  return withTempleSession(templeId, false, async (client) => {
    let cat: any = null;
    if (!client) {
      cat = db_lamp_categories.find((c: any) => c.id === categoryId && (!c.templeId || c.templeId === templeId));
      if(!cat) return { success: false, error: '未找到燈種類別' };
      const today = new Date();
      const exp = new Date(today.getTime() + (cat.durationDays * 24 * 60 * 60 * 1000));
      const newRecord = { id: \`LMP-\${Date.now()}\`, templeId, phone, guestName, categoryId: cat.id, categoryName: cat.name, price: cat.price, durationDays: cat.durationDays || 365, notice: notice || '', startDate: today.toISOString().split('T')[0], expiryDate: exp.toISOString().split('T')[0], status: 'Active', paymentMethod, paymentRef, paymentStatus: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending', createdAt: new Date().toISOString() };
      db_lamp_records.push(newRecord);
      if (typeof db_activities !== 'undefined') db_activities.push({ phone, timestamp: new Date().toISOString().replace('T', ' ').split('.')[0], type: '點燈服務', content: \`申請 \${cat.name}\` });
    } else {
      const catRes = await client.query('SELECT name, price FROM lamp_categories WHERE id = $1 AND temple_id = $2', [categoryId, templeId]);
      if (catRes.rowCount === 0) return { success: false, error: '未找到燈種類別' };
      cat = catRes.rows[0];
      const today = new Date();
      const newId = \`LMP-\${Date.now()}\`;
      await client.query('INSERT INTO lamp_records (id, temple_id, guest_name, phone, lamp_type, amount, status, created_at, payment_method, payment_ref, payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [newId, templeId, guestName, phone, cat.name, cat.price, 'Active', today.toISOString(), paymentMethod, paymentRef, paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending']
      );
    }
    await revalidateTemple();
    return { success: true };
  });
}`);
  console.log('Replaced createLampRecord');
  fs.writeFileSync(filePath, content, 'utf8');
} else {
  console.log('Could not find createLampRecord block');
}
