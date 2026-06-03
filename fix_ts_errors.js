const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/calendar/page.tsx', 'utf8');

// 1. Remove one of the handleVerifyPayment declarations
const startIdx1 = content.indexOf('const handleVerifyPayment = async (appId: string, method: string) => {');
const startIdx2 = content.indexOf('const handleVerifyPayment = async (appId: string, method: string) => {', startIdx1 + 1);

if (startIdx2 !== -1) {
  // Extract from startIdx2 to the end of the block (before the next declaration)
  const endIdx2 = content.indexOf('  const handleNameSearchChange', startIdx2);
  const partToRemove = content.substring(startIdx2, endIdx2);
  content = content.replace(partToRemove, '');
}

// 2. Fix error TS2339: Property 'error' does not exist
content = content.replace(/alert\('對帳失敗：' \+ res\.error\);/g, "alert('對帳失敗！');");
content = content.replace(/alert\('❌ 標記失敗: ' \+ res\.error\);/g, "alert('❌ 標記失敗');");

// 3. Fix error TS2345: Argument of type 'string' is not assignable to parameter of type 'number' for markAppointmentAsArrived
content = content.replace(/await markAppointmentAsArrived\(appId\);/g, "await markAppointmentAsArrived(Number(appId));");

fs.writeFileSync('src/app/[templeId]/admin/calendar/page.tsx', content, 'utf8');
console.log('Fixed typescript compilation errors!');
