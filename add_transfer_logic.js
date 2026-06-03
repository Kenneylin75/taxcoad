const fs = require('fs');

let actionsContent = fs.readFileSync('src/app/actions.ts', 'utf8');

const transferFunctions = `
// -------------------------------------------------------------------------
// 🚀 權限轉移 (Hierarchical Transfer)
// -------------------------------------------------------------------------

export async function transferTempleOwnership(templeId: string, newDistributorId: string | null, newSalesId: string | null) {
  const temple = db_temples.find(t => t.id === templeId);
  if (!temple) return { success: false, error: 'Temple not found' };

  if (newDistributorId !== undefined) {
     temple.distributorId = newDistributorId;
  }
  if (newSalesId !== undefined) {
     temple.salesId = newSalesId;
  }
  
  // Create an audit log
  db_admin_logs.push({
    id: \`log-\${Date.now()}\`,
    timestamp: new Date().toISOString(),
    adminId: 'SuperAdmin',
    action: 'TRANSFER_TEMPLE',
    target: templeId,
    details: \`Transferred temple to Dist:\${newDistributorId || 'HQ'} Sales:\${newSalesId || 'None'}\`,
    ip: '127.0.0.1'
  });

  const { revalidatePath } = require('next/cache');
  revalidatePath('/super-admin');
  return { success: true };
}

export async function transferDistributorOwnership(distributorId: string, newSalesId: string | null) {
  const dist = db_distributors.find(d => d.id === distributorId);
  if (!dist) return { success: false, error: 'Distributor not found' };

  dist.salesId = newSalesId;

  // Transfer all underlying temples if they belong to this distributor
  // And update their salesId to the new salesId if applicable
  db_temples.forEach(t => {
     if (t.distributorId === distributorId) {
        if (newSalesId !== undefined) {
           t.salesId = newSalesId;
        }
     }
  });

  db_admin_logs.push({
    id: \`log-\${Date.now()}\`,
    timestamp: new Date().toISOString(),
    adminId: 'SuperAdmin',
    action: 'TRANSFER_DISTRIBUTOR',
    target: distributorId,
    details: \`Transferred distributor and its temples to Sales:\${newSalesId || 'HQ'}\`,
    ip: '127.0.0.1'
  });

  const { revalidatePath } = require('next/cache');
  revalidatePath('/super-admin');
  return { success: true };
}
`;

if (!actionsContent.includes('export async function transferTempleOwnership')) {
  actionsContent += '\n' + transferFunctions;
  fs.writeFileSync('src/app/actions.ts', actionsContent, 'utf8');
  console.log('actions.ts updated with transfer functions');
} else {
  console.log('Transfer functions already exist in actions.ts');
}
