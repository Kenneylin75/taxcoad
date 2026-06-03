const fs = require('fs');

// 1. Update DistributorApplicationForm.tsx
let formContent = fs.readFileSync('src/app/components/DistributorApplicationForm.tsx', 'utf8');

formContent = formContent.replace(
  /name: "",\s*account: "",\s*password: "",/,
  `name: "",
    taxId: "",
    address: "",
    account: "",
    password: "",`
);

const newFieldsHtml = `<input type="text" placeholder="公司全銜 / 名稱" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 rounded-[30px] p-8 text-lg font-black outline-none border border-slate-100 focus:border-slate-900 transition-all shadow-inner" required />
            <div className="grid grid-cols-2 gap-4">
               <input type="text" placeholder="公司統一編號" value={form.taxId} onChange={e => setForm({...form, taxId: e.target.value})} className="w-full bg-slate-50 rounded-[25px] p-6 text-sm font-black outline-none border border-slate-100 focus:border-slate-900 transition-all shadow-inner" required />
               <input type="text" placeholder="公司登記地址" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-slate-50 rounded-[25px] p-6 text-sm font-black outline-none border border-slate-100 focus:border-slate-900 transition-all shadow-inner" required />
            </div>`;

formContent = formContent.replace(
  /<input type="text" placeholder="公司全銜 \/ 名稱".*?\/>/,
  newFieldsHtml
);

fs.writeFileSync('src/app/components/DistributorApplicationForm.tsx', formContent, 'utf8');


// 2. Update actions.ts (expirationDate logic)
let actionsContent = fs.readFileSync('src/app/actions.ts', 'utf8');

actionsContent = actionsContent.replace(
  /const newDist = \{\s*id,\s*\.\.\.data,\s*planId: plan\.id,\s*planName: plan\.name,\s*price: finalPrice,\s*status: 'Active',\s*joinedAt: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\s*\};/,
  `const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + (Number(data.years) || 2));
  
  const newDist = {
    id,
    ...data,
    planId: plan.id,
    planName: plan.name,
    price: finalPrice,
    status: 'Active',
    joinedAt: new Date().toISOString().split('T')[0],
    expirationDate: expirationDate.toISOString().split('T')[0]
  };`
);

actionsContent = actionsContent.replace(
  /const newApp = \{\s*id: 'DAPP-' \+ Math\.random\(\)\.toString\(36\)\.substr\(2, 9\),\s*\.\.\.data,\s*status: 'Pending',\s*date: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\s*\};/,
  `const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + (Number(data.years) || 2));

  const newApp = {
    id: 'DAPP-' + Math.random().toString(36).substr(2, 9),
    ...data,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0],
    expirationDate: expirationDate.toISOString().split('T')[0]
  };`
);

// We should also patch the db_distributors initial array to ensure they have an expirationDate
// We'll just add it to initial loading if missing
actionsContent = actionsContent.replace(
  /export async function getDistributors\(\) \{/,
  `export async function getDistributors() {
  db_distributors.forEach(d => {
    if (!d.expirationDate) {
       const exp = new Date(d.joinedAt || Date.now());
       exp.setFullYear(exp.getFullYear() + (d.years || 2));
       d.expirationDate = exp.toISOString().split('T')[0];
    }
  });`
);

fs.writeFileSync('src/app/actions.ts', actionsContent, 'utf8');
console.log('Distributor form and backend logic updated');
