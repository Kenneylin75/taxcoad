const fs = require('fs');

let tsContent = fs.readFileSync('src/app/[templeId]/admin/TempleShell.tsx', 'utf8');

const returnFnHTML = `
            {/* Return to Super Admin Button */}
            {currentRole === 'SuperAdmin' && !isCollapsed && (
              <button onClick={async () => {
                 const m = await import('@/app/actions');
                 const res = await m.returnToSuperAdmin();
                 if(res.success) window.location.href = '/super-admin';
              }} className="w-full mt-2 py-2 px-4 rounded-lg border border-indigo-500/30 text-[10px] font-bold bg-indigo-500/10 hover:bg-indigo-600 hover:text-white transition-all text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2">
                 👑 返回上帝視角
              </button>
            )}
`;

tsContent = tsContent.replace(
  /\{!isCollapsed && <button onClick=\{.*?logoutAccount/,
  match => returnFnHTML + '\n            ' + match
);

fs.writeFileSync('src/app/[templeId]/admin/TempleShell.tsx', tsContent, 'utf8');
console.log('Return button added successfully');
