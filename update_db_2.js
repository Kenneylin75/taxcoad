const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

// 1. Remove invalid FOREIGN KEY references to guests(phone) because guests now has composite PK
code = code.replace(/REFERENCES guests\(phone\) ON DELETE CASCADE/g, '');

// 2. Add Quota check to uploadCustomerMedia
const uploadMediaStart = `export async function uploadCustomerMedia(phone: string, url: string, type: 'photo' | 'video' | 'file', uploadedBy: string = 'Temple', customName?: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (client) {
       const sRes = await client.query("SELECT * FROM temple_storages WHERE temple_id = $1", [templeId]);
       if ((sRes.rowCount ?? 0) > 0) {
         const storage = sRes.rows[0];
         if (Number(storage.used_bytes) >= Number(storage.allocated_bytes)) {
           return { success: false, error: '宮廟雲端空間已滿，無法上傳檔案。' };
         }
         await client.query("UPDATE temple_storages SET used_bytes = used_bytes + $1 WHERE temple_id = $2", [5 * 1024 * 1024, templeId]);
       }
    }`;

code = code.replace(/export async function uploadCustomerMedia\(phone: string, url: string, type: 'photo' \| 'video' \| 'file', uploadedBy: string = 'Temple', customName\?: string\) \{\n  const templeId = await getDynamicTempleId\(\);\n  return withTempleSession\(templeId, false, async \(client\) => \{/, uploadMediaStart);

fs.writeFileSync('src/app/actions.ts', code);
console.log('Fixed FK and Storage Logic');
