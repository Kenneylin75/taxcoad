const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Fix 1: Line 4270 (dist_sales in filter)
fileContent = fileContent.replace(
  /temples = \(await jsonStore\.find\('temples'\)\)\.filter\(t => \{\s*if \(t\.distributorId !== distributorId\) return false;\s*const sales = \(await jsonStore\.find\('dist_sales'\)\)\.find\(s => s\.id === t\.salesId\);\s*if \(sales && sales\.role === 'SuperSales'\) return false;\s*return true;\s*\}\);/,
  `const allDistSales = await jsonStore.find('dist_sales');
      temples = (await jsonStore.find('temples')).filter(t => {
         if (t.distributorId !== distributorId) return false;
         const sales = allDistSales.find(s => s.id === t.salesId);
         if (sales && sales.role === 'SuperSales') return false;
         return true;
      });`
);

// Fix 2: Line 4453 (lamp_categories in forEach or map)
fileContent = fileContent.replace(
  /\(await jsonStore\.find\('lamp_records'\)\)\.forEach\(\(r: any\) => \{\s*if \(r\.paymentStatus !== 'Pending' && r\.paymentStatus !== 'Unpaid'\) \{\s*let price = r\.actualPrice \|\| r\.price \|\| 0;\s*if \(\!price && r\.categoryId\) \{\s*const cat = \(await jsonStore\.find\('lamp_categories'\)\)\.find\(\(c: any\) => c\.id === r\.categoryId\);\s*if \(cat\) price = cat\.price;\s*\}\s*addRevenue\(r\.createdAt \|\| r\.date \|\| r\.timestamp, Number\(price\) \|\| 0, r\.templeId\);\s*\}\s*\}\);/,
  `const allLampCats = await jsonStore.find('lamp_categories');
  (await jsonStore.find('lamp_records')).forEach((r: any) => {
    if (r.paymentStatus !== 'Pending' && r.paymentStatus !== 'Unpaid') {
      let price = r.actualPrice || r.price || 0;
      if (!price && r.categoryId) {
         const cat = allLampCats.find((c: any) => c.id === r.categoryId);
         if (cat) price = cat.price;
      }
      addRevenue(r.createdAt || r.date || r.timestamp, Number(price) || 0, r.templeId);
    }
  });`
);

// Fix 3: Line 5621 (queue_tickets in map)
fileContent = fileContent.replace(
  /const validEventIds = \(await jsonStore\.find\('queue_events'\)\)\.filter\(\(e: any\) => e\.status === 'Active' && \(\!e\.templeId \|\| e\.templeId === templeId\)\);\s*const qActive = validEventIds\.map\(\(evt: any\) => \{\s*const tix = \(await jsonStore\.find\('queue_tickets'\)\)\.filter\(\(t: any\) => t\.eventId === evt\.id\);\s*const waiting = tix\.filter\(\(t: any\) => t\.status === 'Queuing'\)\.length;\s*const completed = tix\.filter\(\(t: any\) => t\.status === 'Completed'\)\.length;\s*return \{ title: evt\.title, waiting, completed \};\s*\}\);/,
  `const validEventIds = (await jsonStore.find('queue_events')).filter((e: any) => e.status === 'Active' && (!e.templeId || e.templeId === templeId));
      const allQix = await jsonStore.find('queue_tickets');
      const qActive = validEventIds.map((evt: any) => {
        const tix = allQix.filter((t: any) => t.eventId === evt.id);
        const waiting = tix.filter((t: any) => t.status === 'Queuing').length;
        const completed = tix.filter((t: any) => t.status === 'Completed').length;
        return { title: evt.title, waiting, completed };
      });`
);

// Fix 4: Line 6289 (queue_tickets in map)
fileContent = fileContent.replace(
  /return \(await jsonStore\.find\('queue_events'\)\)\.filter\(e => \!e\.templeId \|\| e\.templeId === templeId\)\.map\(evt => \{\s*const participantCount = \(await jsonStore\.find\('queue_tickets'\)\)\.filter\(t => t\.eventId === evt\.id && t\.status === 'Queuing'\)\.length;\s*return \{ \.\.\.evt, participantCount \};\s*\}\);/,
  `const allQueueTix = await jsonStore.find('queue_tickets');
      return (await jsonStore.find('queue_events')).filter(e => !e.templeId || e.templeId === templeId).map(evt => {
        const participantCount = allQueueTix.filter(t => t.eventId === evt.id && t.status === 'Queuing').length;
        return { ...evt, participantCount };
      });`
);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed await in non-async function issues.');
