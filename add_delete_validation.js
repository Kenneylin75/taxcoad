const fs = require('fs');

let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// 1. deleteLampCategory
content = content.replace(
  /export async function deleteLampCategory\(id: string\) \{/,
  `export async function deleteLampCategory(id: string) { \n  const hasRecords = db_lamp_records.some(r => r.categoryId === id);\n  if (hasRecords) return { success: false, error: '該點燈類別已有信眾登記，請先移除相關信眾紀錄後再進行刪除。' };`
);

// 2. deleteEvent
content = content.replace(
  /export async function deleteEvent\(id: string\) \{/,
  `export async function deleteEvent(id: string) { \n  const hasRegistrations = db_event_registrations.some(r => r.eventId === id);\n  if (hasRegistrations) return { success: false, error: '該活動已有信眾報名，請先移除相關報名紀錄後再進行刪除。' };`
);

// 3. deleteQueueEvent
content = content.replace(
  /export async function deleteQueueEvent\(id: string\) \{/,
  `export async function deleteQueueEvent(id: string) { \n  const hasTickets = db_queue_tickets.some(t => t.eventId === id);\n  if (hasTickets) return { success: false, error: '該排隊活動已有信眾取號，請先移除或處理相關號碼牌後再進行刪除。' };`
);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Added validation to delete functions');
