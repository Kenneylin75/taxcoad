const fs = require('fs');

// 1. Update actions.ts
let actionsContent = fs.readFileSync('src/app/actions.ts', 'utf8');

// We need to inject the personnel creation and bloodline tracking into submitFreeAccountApplication
actionsContent = actionsContent.replace(
  /export async function submitFreeAccountApplication\(data: any\) \{[\s\S]*?db_temples\.push\(newTemple\);/,
  `export async function submitFreeAccountApplication(data: any) { 
  const { role, paymentCycle, ...formData } = data;
  
  const status = (role === 'distributor' || role === 'super-admin') ? 'Active' : 'Pending';

  const sales = db_dist_sales.find(s => s.name === data.submittedBy);
  const reqRole = await getCurrentRole() || 'System';
  const currentUser = await getCurrentUser();
  const templeNo = (gStore.db_temples || db_temples).length + 1;

  const newTemple = {
    id: \`temple-\${Math.random().toString(36).substring(2, 10)}\`,
    templeNo,
    ...formData,
    paymentCycle: paymentCycle || 'Monthly',
    monthlyRent: data.freeType === 'Permanent' ? 0 : (db_config.fixedMonthlyRent || 3600),
    trialMonths: data.freeType === 'Trial' ? parseInt(data.trialMonths || '0') : 0,
    freeType: data.freeType || 'Normal',
    role,
    status,
    creatorRole: reqRole,
    creatorId: currentUser.name,
    salesId: sales?.id,
    distributorId: sales?.distributorId || (role === 'distributor' ? data.distributorId : 'system-hq'),
    timestamp: new Date().toISOString(),
    billingStartDate: data.freeType === 'Trial' ? 
      new Date(Date.now() + (parseInt(data.trialMonths || '0') * 30 * 24 * 60 * 60 * 1000)).toISOString() : 
      new Date().toISOString()
  };
  db_temples.push(newTemple);

  // If status is Active (e.g. created by super-admin or distributor), create personnel login immediately
  if (status === 'Active' && data.account && data.password) {
    const pData = (gStore.db_personnel || db_personnel);
    pData.push({
      id: \`p-\${Date.now()}\`,
      templeId: newTemple.id,
      name: data.templeName || '宮廟管理員',
      account: data.account,
      password: data.password, // In real app, hash this
      role: 'TempleAdmin',
      status: 'Active'
    });
    gStore.db_personnel = pData;
  }`
);

// We should also update approveTempleBySuperAdmin to create the personnel account upon approval!
actionsContent = actionsContent.replace(
  /export async function approveTempleBySuperAdmin\(id: string\) \{[\s\S]*?return \{ success: true \};\n\}/,
  `export async function approveTempleBySuperAdmin(id: string) {
  const t = db_temples.find(x => x.id === id);
  if (t) {
     t.status = 'Active';
     if (t.account && t.password) {
       const pData = (gStore.db_personnel || db_personnel);
       // check if already exists
       if (!pData.some(p => p.account === t.account)) {
         pData.push({
           id: \`p-\${Date.now()}\`,
           templeId: id,
           name: t.templeName || '宮廟管理員',
           account: t.account,
           password: t.password,
           role: 'TempleAdmin',
           status: 'Active'
         });
         gStore.db_personnel = pData;
       }
     }
  }
  revalidatePath('/super-admin');
  return { success: true };
}`
);

fs.writeFileSync('src/app/actions.ts', actionsContent, 'utf8');
console.log('actions.ts updated');


// 2. Update SuperAdminClient.tsx to use TempleApplicationForm
let clientContent = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// Import TempleApplicationForm
if (!clientContent.includes('TempleApplicationForm')) {
  clientContent = clientContent.replace(
    /import React, \{ useState, useTransition, useEffect \} from 'react';/,
    "import React, { useState, useTransition, useEffect } from 'react';\nimport TempleApplicationForm from '../components/TempleApplicationForm';"
  );
}

// Replace the entire modal block handling accountType === 'Temple'
// Since accountType === 'Temple' logic is mixed with the form, we will wrap the existing form in {accountType !== 'Temple' && (...)}
// And add {accountType === 'Temple' && <TempleApplicationForm ... />}

clientContent = clientContent.replace(
  /<form onSubmit=\{handleCreateAccount\} className="flex flex-col h-full">/,
  `{accountType === 'Temple' ? (
              <div className="p-8">
                 <div className="flex justify-between items-center mb-8">
                    <div className="space-y-4">
                       <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] italic">System Provisioning Protocol</p>
                       <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">開設宮廟帳號</h3>
                    </div>
                 </div>
                 <div className="max-h-[70vh] overflow-y-auto px-4">
                    <TempleApplicationForm 
                       role="super-admin"
                       submittedBy="超級總裁"
                       onSuccess={() => {
                          setIsAccountModalOpen(false);
                          alert('宮廟帳戶已成功建立並開通！');
                          window.location.reload();
                       }}
                       onCancel={() => setIsAccountModalOpen(false)}
                    />
                 </div>
              </div>
            ) : (
              <form onSubmit={handleCreateAccount} className="flex flex-col h-full">`
);

// We must also remove the old `{accountType === 'Temple' && (...) }` section from inside the form!
const oldTempleSectionRegex = /\{accountType === 'Temple' && \(\s*<section className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">[\s\S]*?<\/section>\s*\)\}/;
clientContent = clientContent.replace(oldTempleSectionRegex, '');

// Don't forget to close the \`<form>\` logic with \`)} \`
clientContent = clientContent.replace(
  /<\/form>\n\s*<\/div>\n\s*<\/div>\n\s*\)}/,
  `</form>\n            )}\n            </div>\n         </div>\n      )}`
);


fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', clientContent, 'utf8');
console.log('SuperAdminClient.tsx updated to use TempleApplicationForm');
