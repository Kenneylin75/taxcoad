const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', 'utf8');

// 1. Appt Card
const oldAppt = `<div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group">`;
const newAppt = `<div onClick={() => router.push(\`\${basePath}/calendar\`)} className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group cursor-pointer hover:-translate-y-1">`;
content = content.replace(oldAppt, newAppt);

// 2. Queue Card
const oldQueue = `<div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group">`;
const newQueue = `<div onClick={() => router.push(\`\${basePath}/queue\`)} className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group cursor-pointer hover:-translate-y-1">`;
content = content.replace(oldQueue, newQueue);

// 3. Guests Card
const oldGuests = `<div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group">`;
const newGuests = `<div onClick={() => router.push(\`\${basePath}/customers\`)} className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group cursor-pointer hover:-translate-y-1">`;
content = content.replace(oldGuests, newGuests);

fs.writeFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', content, 'utf8');
console.log('Successfully made stat cards clickable.');
