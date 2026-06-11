const fs = require('fs');

const actionsFile = 'src/app/actions.ts';
let code = fs.readFileSync(actionsFile, 'utf8');

// 1. Update loginAccount
const loginStart = code.indexOf('export async function loginAccount(formData: FormData) {');
const loginEnd = code.indexOf('return { success: false, error: "帳號或密碼錯誤" };', loginStart) + 53;
const loginBody = code.substring(loginStart, loginEnd + 1);

let newLoginBody = loginBody.replace('let assignedRole = "TempleAdmin";', 'let assignedRole = "TempleAdmin";\n  let loginStatus = "Active";');

newLoginBody = newLoginBody.replace(
  'if (distributor) {\n      success = true;\n      redirectPath = `/${distributor.id}`;\n      assignedRole = "Distributor";\n    }',
  `if (distributor) {
      if (distributor.status === "Inactive") { loginStatus = "Inactive"; }
      else {
        success = true;
        redirectPath = \`/\${distributor.id}\`;
        assignedRole = "Distributor";
      }
    }`
);

newLoginBody = newLoginBody.replace(
  'if (salesPerson) {\n        success = true;\n        redirectPath = salesPerson.role === "SuperSales" ? `/super-sales/${salesPerson.id}` : `/${salesPerson.distributorId || \'dist-hq\'}/${salesPerson.id}`;\n        assignedRole = salesPerson.role === "SuperSales" ? "SuperSales" : "DistSales";\n      }',
  `if (salesPerson) {
        if (salesPerson.status === "Inactive") { loginStatus = "Inactive"; }
        else {
          success = true;
          redirectPath = salesPerson.role === "SuperSales" ? \`/super-sales/\${salesPerson.id}\` : \`/\${salesPerson.distributorId || 'dist-hq'}/\${salesPerson.id}\`;
          assignedRole = salesPerson.role === "SuperSales" ? "SuperSales" : "DistSales";
        }
      }`
);

newLoginBody = newLoginBody.replace(
  'if (person) { \n          success = true; \n          redirectPath = `/${person.templeId}/admin/services`; \n          assignedRole = "TempleAdmin"; \n        }',
  `if (person) { 
          const temple = db_temples.find(t => t.id === person.templeId);
          if (temple && temple.status === "Inactive") {
             loginStatus = "Inactive";
          } else {
             success = true; 
             redirectPath = \`/\${person.templeId}/admin/services\`; 
             assignedRole = "TempleAdmin"; 
          }
        }`
);

newLoginBody = newLoginBody.replace(
  'if (success) {',
  `if (loginStatus === "Inactive") {
     return { success: false, error: "該帳戶已被停權或關閉，無法登入" };
  }

  if (success) {`
);

code = code.replace(loginBody, newLoginBody);


// 2. Add new actions at the bottom
const newActions = `
export async function updateAccountStatus(id: string, role: string, status: 'Active' | 'Inactive') {
  if (role === 'TempleAdmin') {
    const temple = db_temples.find(t => t.id === id);
    if (temple) temple.status = status;
    gStore.db_temples = db_temples;
  } else if (role === 'Distributor') {
    const dist = db_distributors.find(d => d.id === id);
    if (dist) dist.status = status;
    gStore.db_distributors = db_distributors;
  } else if (role === 'SuperSales' || role === 'DistSales') {
    const sales = db_dist_sales.find(s => s.id === id);
    if (sales) sales.status = status;
    gStore.db_dist_sales = db_dist_sales;
  }
  return { success: true };
}

export async function transferTemples(templeIds: string[], targetId: string | null, targetRole: 'Distributor' | 'SuperSales' | 'HQ') {
  templeIds.forEach(tId => {
    const temple = db_temples.find(t => t.id === tId);
    if (temple) {
      if (targetRole === 'HQ') {
        temple.distributorId = null;
        temple.salesId = null;
      } else if (targetRole === 'Distributor') {
        temple.distributorId = targetId;
        temple.salesId = null;
      } else if (targetRole === 'SuperSales') {
        temple.distributorId = null;
        temple.salesId = targetId;
      }
    }
  });
  gStore.db_temples = db_temples;
  
  const targetName = targetRole === 'HQ' ? '系統總部 HQ' : targetId;
  db_admin_logs.unshift({ id: \`L-\${Date.now()}\`, user: 'System Admin', action: 'BATCH_TRANSFER', target: \`\${templeIds.length} temples to \${targetName}\`, timestamp: new Date().toLocaleString() });

  return { success: true };
}
`;

code += newActions;

fs.writeFileSync(actionsFile, code);
console.log('actions.ts updated successfully');
