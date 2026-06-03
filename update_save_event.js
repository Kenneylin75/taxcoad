const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const oldSaveEvent = `export async function saveEvent(fd: FormData) { 
  const id = fd.get('id') as string;
  const title = fd.get('title') as string;
  const date = fd.get('date') as string;
  const location = fd.get('location') as string;
  const price = Number(fd.get('price')) || 0;
  const capacity = Number(fd.get('capacity')) || 0;
  const status = (fd.get('status') as any) || 'Draft';
  
  const templeId = await getDynamicTempleId();

  if (id) {
    const idx = db_events.findIndex(e => e.id === id);
    if (idx > -1) {
      db_events[idx] = { ...db_events[idx], title, date, location, price, capacity, status, templeId };
    }
  } else {
    db_events.push({
      id: Date.now().toString(),
      templeId,
      title,
      date,
      location,
      price,
      capacity,
      status,
      enrolled: 0
    });
  }
  return { success: true };
}`;

const newSaveEvent = `export async function saveEvent(fd: FormData) { 
  const id = fd.get('id') as string;
  const title = fd.get('title') as string;
  const date = fd.get('date') as string;
  const location = fd.get('location') as string;
  const imageUrl = fd.get('imageUrl') as string;
  const price = Number(fd.get('price')) || 0;
  const capacity = Number(fd.get('capacity')) || 0;
  const status = (fd.get('status') as any) || 'Draft';
  
  const templeId = await getDynamicTempleId();

  if (id) {
    const idx = db_events.findIndex(e => e.id === id);
    if (idx > -1) {
      db_events[idx] = { ...db_events[idx], title, date, location, imageUrl, price, capacity, status, templeId };
    }
  } else {
    db_events.push({
      id: Date.now().toString(),
      templeId,
      title,
      date,
      location,
      imageUrl,
      price,
      capacity,
      status,
      enrolled: 0
    });
  }
  return { success: true };
}`;

content = content.replace(oldSaveEvent, newSaveEvent);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Updated saveEvent to include imageUrl');
