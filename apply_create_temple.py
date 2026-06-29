import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
    // Deduct quota if Distributor/Sales
    const { cookies } = require("next/headers");
    const cookieStore = await cookies();
    const currentRole = cookieStore.get("admin_role")?.value || "SuperAdmin";
    const accountStr = cookieStore.get("admin_account")?.value || "system";
  
    if (currentRole === 'Distributor' || currentRole === 'DistSales') {
      if (currentRole === 'Distributor') {
        const dist = db_distributors.find((d: any) => d.account === accountStr);
        if (dist) {
           if (dist.quota <= 0) return { success: false, message: '配額已耗盡，無法開設新宮廟' };
           dist.quota -= 1;
        }
      }
    }

    if (data.freeType === 'Permanent') {
      await grantTempleAiVip(id, true);
      await grantTempleStorageVip(id, true);
    }
"""

content = re.sub(r'// Deduct quota if Distributor/Sales[\s\S]*?\}\s*\}\s*\}', new_func, content)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
