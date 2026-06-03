const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

// 1. guests table structure (String replace avoids regex pipe issues)
code = code.split('phone VARCHAR(50) PRIMARY KEY,').join('temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,\n          phone VARCHAR(50) NOT NULL,\n          PRIMARY KEY (temple_id, phone),');

// 2. Fix WHERE clauses
code = code.split('WHERE phone = $1').join('WHERE temple_id = $1 AND phone = $2');

// 3. Fix INSERT INTO
code = code.split('INSERT INTO guests (phone,').join('INSERT INTO guests (temple_id, phone,');

// 4. Fix VALUES bindings
code = code.split('VALUES ($1, $2, $3)').join('VALUES ($1, $2, $3, $4)');
code = code.split('VALUES ($1, $2)`').join('VALUES ($1, $2, $3)`');

// 5. Fix argument arrays safely
code = code.split('[phone, data.name, data.status || \\\'Active\\\']').join('[templeId, phone, data.name, data.status || \\\'Active\\\']');
code = code.split('[phone, data.name, data.phone]').join('[templeId, phone, data.name, data.phone]');
code = code.split('[phone, data.name]').join('[templeId, phone, data.name]');
code = code.split(', [phone]').join(', [templeId, phone]');

// 6. Fix checkGuestProfile function specifically
code = code.split('const res = await client.query("SELECT * FROM guests WHERE temple_id = $1 AND phone = $2", [phone]);').join('const res = await client.query("SELECT * FROM guests WHERE temple_id = $1 AND phone = $2", [templeId, phone]);');

// 7. Fix loginAccount
const loginCode = `export async function loginAccount(formData: FormData) {
  const account = formData.get("account") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!account || !password) return { success: false, error: "請輸入帳號密碼" };

  let redirectPath = "/admin";
  let success = false;
  let loggedInName = account;
  let assignedRole = role;

  if (account === "PIVOTADMIN01" && password === "PIVOTADMIN01") {
    success = true;
    redirectPath = "/super-admin";
    loggedInName = "超級總裁";
    assignedRole = "SuperAdmin";
  } else {
     const pData = (gStore.db_personnel || db_personnel);
     if (role === "superadmin") {
       if (db_admins.some(a => a.account === account)) { success = true; redirectPath = "/super-admin"; assignedRole = "SuperAdmin"; }
     } else if (role === "distributor") {
       if (db_distributors.some(d => d.account === account)) { success = true; redirectPath = "/dist-admin"; assignedRole = "Distributor"; }
     } else if (role === "supersales") {
       if (db_dist_sales.some(s => s.account === account && s.role === "SuperSales")) { success = true; redirectPath = "/super-sales"; assignedRole = "SuperSales"; }
     } else if (role === "agent") {
       if (db_dist_sales.some(s => s.account === account && s.role === "DistSales")) { success = true; redirectPath = "/dist-sales"; assignedRole = "DistSales"; }
     } else if (role === "temple") {
       if (pData.some((p: any) => (p.account || p.name) === account)) { success = true; redirectPath = "/temple/services"; assignedRole = "TempleAdmin"; }
     }
  }

  if (success) {
    const { cookies } = require("next/headers");
    cookies().set("admin_role", assignedRole);
    cookies().set("admin_account", account);
    
    const logMsg = "使用者 " + loggedInName + " (" + assignedRole + ") 登入成功";
    const newLog = {
      id: "log-" + Date.now(),
      action: "LOGIN",
      details: logMsg,
      timestamp: new Date().toISOString(),
      performedBy: loggedInName
    };
    db_admin_logs.push(newLog);

    withTempleSession("hq", true, async (client) => {
      if (client) {
         try {
           await client.query("CREATE TABLE IF NOT EXISTS admin_logs (id SERIAL PRIMARY KEY, action VARCHAR(100), details TEXT, timestamp VARCHAR(100), performed_by VARCHAR(100))");
           await client.query("INSERT INTO admin_logs (action, details, timestamp, performed_by) VALUES ($1, $2, $3, $4)", ["LOGIN", logMsg, newLog.timestamp, loggedInName]);
         } catch(e) { console.error("Log error", e); }
      }
    });

    return { success: true, redirectPath, role: assignedRole };
  }

  return { success: false, error: "帳號或密碼錯誤" };
}`;

code = code.replace(/export async function loginAccount\(\.\.\.args: any\[\]\) \{[\s\S]*?\n\}/, loginCode);

// 8. Update createTemple quota check
const quotaLogic = `
  const currentUser = await getCurrentUser();
  const currentRole = await getCurrentRole();
  
  if (currentRole === 'Distributor' || currentRole === 'DistSales') {
    const accountStr = currentUser || 'system';
    if (currentRole === 'Distributor') {
      const dist = db_distributors.find((d: any) => d.account === accountStr);
      if (dist) {
         if (dist.quota <= 0) return { success: false, message: '您的授權配額已耗盡，無法開設新宮廟' };
         dist.quota -= 1;
      }
    } else {
      const sales = db_dist_sales.find((s: any) => s.account === accountStr);
      if (sales) {
         // Deduct logic if needed
      }
    }
  }

  const newId = \`t-\${Date.now()}\`;`;

code = code.replace(/const newId = `t-\$\{Date\.now\(\)\}`;/, quotaLogic);

fs.writeFileSync('src/app/actions.ts', code);
console.log('Update complete.');
