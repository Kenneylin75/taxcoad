const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const oldType = `export type EventItem = { id: string; title: string; date: string; location: string; price: number; status: 'Active' | 'Draft' | 'Completed'; capacity: number; enrolled: number };`;
const newType = `export type EventItem = { id: string; title: string; date: string; location: string; price: number; status: 'Active' | 'Draft' | 'Completed'; capacity: number; enrolled: number; imageUrl?: string };`;

content = content.replace(oldType, newType);

// Add a mock image to the first event
const oldMock = `{ id: 'EV001', templeId: 'temple-test', title: '中元普渡祈安大法會', date: '2026-08-25', location: '本宮大殿', price: 1200, status: 'Active', capacity: 500, enrolled: 342 },`;
const newMock = `{ id: 'EV001', templeId: 'temple-test', title: '中元普渡祈安大法會', date: '2026-08-25', location: '本宮大殿', price: 1200, status: 'Active', capacity: 500, enrolled: 342, imageUrl: 'https://images.unsplash.com/photo-1549479361-ad775bb5f9cb?w=800&q=80' },`;

content = content.replace(oldMock, newMock);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Updated EventItem type and mock data in actions.ts');
