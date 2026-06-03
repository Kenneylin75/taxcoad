const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// 1. Update createTempleAccount
content = content.replace(
  /const newTemple = \{\s+id,\s+\.\.\.rest,\s+paymentCycle: paymentCycle \|\| 'Monthly',/,
  `const newTemple = {
    id,
    ...rest,
    creatorRole,
    creatorId,
    paymentCycle: paymentCycle || 'Monthly',`
);

// 2. Add impersonateTemple function at the end
if (!content.includes('export async function impersonateTemple')) {
  content += `\n
// ==========================================
// 上帝視角 (Impersonation)
// ==========================================
export async function impersonateTemple(templeId: string) {
  const role = await getCurrentRole();
  if (role !== 'SuperAdmin') {
    return { success: false, message: '權限不足' };
  }
  
  const { cookies } = require('next/headers');
  const cookieStore = await cookies();
  cookieStore.set('templeId', templeId);
  cookieStore.set('admin_role', 'SuperAdmin');
  
  return { success: true, redirectPath: \`/\${templeId}/admin/services\` };
}
`;
}

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('actions.ts updated successfully via script.');
