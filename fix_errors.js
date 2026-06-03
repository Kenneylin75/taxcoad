const fs = require('fs');

// 1. Fix actions.ts
let actionsFile = 'src/app/actions.ts';
let actionsCode = fs.readFileSync(actionsFile, 'utf8');

// Fix rowCount issues
actionsCode = actionsCode.replace(/res\.rowCount\s*>\s*0/g, '(res.rowCount ?? 0) > 0');
actionsCode = actionsCode.replace(/res\.rowCount\s*===\s*0/g, '(res.rowCount ?? 0) === 0');
actionsCode = actionsCode.replace(/tRes\.rowCount\s*>\s*0/g, '(tRes.rowCount ?? 0) > 0');
actionsCode = actionsCode.replace(/wRes\.rowCount\s*>\s*0/g, '(wRes.rowCount ?? 0) > 0');
actionsCode = actionsCode.replace(/wRes\.rowCount\s*===\s*0/g, '(wRes.rowCount ?? 0) === 0');
actionsCode = actionsCode.replace(/slotRes\.rowCount\s*===\s*0/g, '(slotRes.rowCount ?? 0) === 0');
actionsCode = actionsCode.replace(/guestCheck\.rowCount\s*===\s*0/g, '(guestCheck.rowCount ?? 0) === 0');
actionsCode = actionsCode.replace(/check\.rowCount\s*===\s*0/g, '(check.rowCount ?? 0) === 0');
actionsCode = actionsCode.replace(/planRes\.rowCount\s*===\s*0/g, '(planRes.rowCount ?? 0) === 0');
actionsCode = actionsCode.replace(/planRes\.rowCount\s*>\s*0/g, '(planRes.rowCount ?? 0) > 0');
actionsCode = actionsCode.replace(/conflictRes\.rowCount\s*>\s*0/g, '(conflictRes.rowCount ?? 0) > 0');
actionsCode = actionsCode.replace(/checkRes\.rowCount\s*>\s*0/g, '(checkRes.rowCount ?? 0) > 0');
actionsCode = actionsCode.replace(/appRes\.rowCount\s*===\s*0/g, '(appRes.rowCount ?? 0) === 0');

// Fix implicit 'any' parameter p (which we know exists in some .find or .filter or .map)
actionsCode = actionsCode.replace(/\.find\(\(p\)\s*=>/g, '.find((p: any) =>');
actionsCode = actionsCode.replace(/\.filter\(\(p\)\s*=>/g, '.filter((p: any) =>');
actionsCode = actionsCode.replace(/\.map\(\(p\)\s*=>/g, '.map((p: any) =>');
actionsCode = actionsCode.replace(/forEach\(app =>/g, 'forEach((app: any) =>');
actionsCode = actionsCode.replace(/filter\(app =>/g, 'filter((app: any) =>');

fs.writeFileSync(actionsFile, actionsCode);

// 2. Fix layout.tsx
let layoutFile = 'src/app/admin/layout.tsx';
let layoutCode = fs.readFileSync(layoutFile, 'utf8');
layoutCode = layoutCode.replace(/currentRole !== 'SuperAdmin'/g, '(currentRole as string) !== \\'SuperAdmin\\'');
fs.writeFileSync(layoutFile, layoutCode);

// 3. Fix route.ts
let routeFile = 'src/app/api/payment/ecpay/route.ts';
let routeCode = fs.readFileSync(routeFile, 'utf8');
routeCode = routeCode.replace(/const planSizeGb = Number\(parts\[3\]\);/g, 'const planId = parts[3];');
routeCode = routeCode.replace(/const res = await upgradeTempleStorage\(templeId, planSizeGb, cycle\);/g, 'const res = await upgradeTempleStorage(templeId, planId, cycle);');
routeCode = routeCode.replace(/const appId = Number\(parts\[2\]\);/g, 'const appId = parts[2];');
fs.writeFileSync(routeFile, routeCode);

console.log('Fixes applied successfully!');

