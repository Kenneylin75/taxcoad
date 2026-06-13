const fs = require('fs');

const filePath = 'C:\\Users\\KenneyLin\\.gemini\\antigravity\\scratch\\temple-app\\src\\app\\actions.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add helper at the top
if (!content.includes('export async function revalidateTemple')) {
  const insertIndex = content.indexOf('export async function setGuestTempleContext');
  const helper = `
export async function revalidateTemple(templeId?: string) {
  try {
    const tId = templeId || await getDynamicTempleId();
    revalidatePath(\`/\${tId}\`, 'layout');
    revalidatePath('/super-admin', 'layout');
    revalidatePath('/', 'layout');
  } catch(e) {}
}

`;
  content = content.slice(0, insertIndex) + helper + content.slice(insertIndex);
}

// 2. Replace all hardcoded revalidatePath calls related to temple
content = content.replace(/revalidatePath\(['"]\/temple\/[^'"]+['"]\);?/g, 'await revalidateTemple();');
content = content.replace(/revalidatePath\(['"]\/live-queue['"]\);?/g, 'await revalidateTemple();');
content = content.replace(/revalidatePath\(['"]\/['"]\);?/g, 'await revalidateTemple();');
content = content.replace(/revalidatePath\(['"]\/\[templeId\]\/admin\/calendar['"]\);?/g, 'await revalidateTemple();');

// 3. deduplicate consecutive await revalidateTemple();
content = content.replace(/(await revalidateTemple\(\);\s*)+/g, 'await revalidateTemple();\n    ');

// 4. Fix fetchGuestAppointments
content = content.replace(
  /export async function fetchGuestAppointments\(p: any\) \{[\s\S]*?return db_appointments\.filter\(\(a: any\) => normCompare\(a\.phone, p\)\);[\s\S]*?\}/,
  `export async function fetchGuestAppointments(p: any) {
  const templeId = await getDynamicTempleId();
  return db_appointments.filter((a: any) => normCompare(a.phone, p) && (!a.templeId || a.templeId === templeId));
}`
);

// 5. Fix fetchGuestRegistrations
content = content.replace(
  /export async function fetchGuestRegistrations\(p: any\) \{[\s\S]*?return db_event_registrations\.filter\(r => normCompare\(r\.phone, p\)\);[\s\S]*?\}/,
  `export async function fetchGuestRegistrations(p: any) {
  const templeId = await getDynamicTempleId();
  return db_event_registrations.filter(r => normCompare(r.phone, p) && (!r.templeId || r.templeId === templeId));
}`
);

// 6. Fix fetchGuestQueueTickets
content = content.replace(
  /export async function fetchGuestQueueTickets\(p: any\) \{[\s\S]*?return db_queue_tickets\.filter\(\(t: any\) => normCompare\(t\.phone, p\)\);[\s\S]*?\}/,
  `export async function fetchGuestQueueTickets(p: any) {
  const templeId = await getDynamicTempleId();
  return db_queue_tickets.filter((t: any) => normCompare(t.phone, p) && (!t.templeId || t.templeId === templeId));
}`
);

// 7. Fix fetchGuestLampRecords
content = content.replace(
  /export async function fetchGuestLampRecords\(p: any\) \{[\s\S]*?return db_lamp_records\.filter\(l => normCompare\(l\.phone, p\)\);[\s\S]*?\}/,
  `export async function fetchGuestLampRecords(p: any) {
  const templeId = await getDynamicTempleId();
  return db_lamp_records.filter(l => normCompare(l.phone, p) && (!l.templeId || l.templeId === templeId));
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated actions.ts');
