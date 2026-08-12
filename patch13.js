const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const regex1 = /if\s*\(\s*ticket\.status\s*===\s*'Pending'\s*\)\s*\{\s*const\s+activeCount\s*=\s*await\s*prisma\.queueTicket\.count\(\{\s*where:\s*\{\s*eventId,\s*templeId,\s*status:\s*\{\s*not:\s*'Pending'\s*\}\s*\}\s*\}\);/;
const replacement1 = `if (ticket.status === 'Pending' || ticket.status === 'Registered') {
      const activeCount = await prisma.queueTicket.count({
        where: {
          eventId,
          templeId,
          status: { notIn: ['Pending', 'Registered'] }
        }
      });`;

const regex2 = /status:\s*'Queuing',\s*queueEvent:\s*\{\s*status:\s*'Active'\s*\}/g;
const replacement2 = `status: { in: ['Queuing', 'Calling'] },
            queueEvent: { status: 'Active' }`;

if (regex1.test(content) && regex2.test(content)) {
    content = content.replace(regex1, replacement1);
    content = content.replace(regex2, replacement2);
    fs.writeFileSync('src/app/actions.ts', content);
    console.log('success patch13');
} else {
    console.log('regex not found');
    if (!regex1.test(content)) console.log('regex1 missing');
    if (!regex2.test(content)) console.log('regex2 missing');
}
