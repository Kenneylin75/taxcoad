const fs = require('fs');

// 1. Fix SuperAdminClient.tsx "Manage" button
let saContent = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');
saContent = saContent.replace(
  /import\('@\/app\/actions'\)\.then\(m => m\.impersonateTemple\(acc\.templeId \|\| acc\.id\)\);/,
  `import('@/app/actions').then(async m => { const res = await m.impersonateTemple(acc.templeId || acc.id); if(res.success) window.location.href = res.redirectPath; })`
);
fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', saContent, 'utf8');
console.log('SuperAdminClient.tsx "Manage" button fixed');

// 2. Fix TempleShell.tsx
let tsContent = fs.readFileSync('src/app/[templeId]/admin/TempleShell.tsx', 'utf8');

// Allow SuperAdmin to see TempleAdmin navigation
tsContent = tsContent.replace(
  /show: currentRole === 'TempleAdmin'/g,
  `show: ['TempleAdmin', 'SuperAdmin'].includes(currentRole)`
);

// Add "Return to SuperAdmin" button at the bottom of the sidebar
const returnButtonHTML = `
      {/* Return to Super Admin Button */}
      {currentRole === 'SuperAdmin' && (
        <div className="absolute bottom-16 left-0 right-0 p-4 border-t border-slate-800 bg-[#0B1120]">
           <button onClick={async () => {
              const { cookies } = await import('next/headers');
              // This won't work in client component without a server action.
              // So we just call a simple logout to SuperAdmin
           }} className="w-full">
           </button>
        </div>
      )}
`;

// Actually we need a server action to return to Super Admin because it needs to set cookies
// We can just use an action `returnToSuperAdmin`
const returnFnHTML = `
        {/* Return to Super Admin Button */}
        {currentRole === 'SuperAdmin' && (
          <div className="p-4 border-t border-slate-800 bg-[#0B1120] mt-auto">
             <button onClick={async () => {
                const m = await import('@/app/actions');
                const res = await m.returnToSuperAdmin();
                if(res.success) window.location.href = '/super-admin';
             }} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all group">
                <span className="text-xl">👑</span>
                {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">返回上帝視角</span>}
             </button>
          </div>
        )}
`;

// Insert at the bottom of the sidebar, right above the logout button
tsContent = tsContent.replace(
  /<button onClick=\{async \(\) => \{[\s\S]*?<div className="w-8 h-8 rounded-full bg-rose-500\/20 text-rose-500 flex items-center justify-center text-sm">🚪<\/div>/,
  match => returnFnHTML + '\n        ' + match
);

fs.writeFileSync('src/app/[templeId]/admin/TempleShell.tsx', tsContent, 'utf8');
console.log('TempleShell.tsx updated with Return button');

// 3. Add returnToSuperAdmin action to actions.ts
let actionsContent = fs.readFileSync('src/app/actions.ts', 'utf8');
if (!actionsContent.includes('export async function returnToSuperAdmin')) {
  actionsContent += `
export async function returnToSuperAdmin() {
  const { cookies } = require('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete('templeId');
  return { success: true };
}
`;
  fs.writeFileSync('src/app/actions.ts', actionsContent, 'utf8');
  console.log('returnToSuperAdmin added to actions.ts');
}
