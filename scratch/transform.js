const fs = require('fs');
const ts = require('typescript');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Insert the import for jsonStore at the top
if (!fileContent.includes("import * as jsonStore from '@/lib/jsonStore'")) {
    fileContent = fileContent.replace(
        `"use server";\n`,
        `"use server";\nimport * as jsonStore from '@/lib/jsonStore';\n`
    );
}
if (!fileContent.includes("import { initializePhase1Storage }")) {
    fileContent = fileContent.replace(
        `"use server";\n`,
        `"use server";\nimport { initializePhase1Storage } from '@/lib/storageInit';\ninitializePhase1Storage().catch(console.error);\n`
    );
}

// Remove the global initializations
fileContent = fileContent.replace(/let db_slots:\s*any\[\]\s*=\s*initGlobal\("db_slots",\s*\[\]\);\n*gStore\.db_slots\s*=\s*db_slots;?/g, '');
fileContent = fileContent.replace(/let db_appointments:\s*any\[\]\s*=\s*initGlobal\("db_appointments",\s*\[\]\);\n*gStore\.db_appointments\s*=\s*db_appointments;?/g, '');
fileContent = fileContent.replace(/let db_personnel:\s*any\[\]\s*=\s*initGlobal\('db_personnel',[^;]+;\n*/g, '');

// Apply regex-based safe replacements for Phase 1 collections
const replacements = [
    {
        from: /gStore\.db_slots = \[\.\.\.currentSlots\];/g,
        to: `await jsonStore.atomicWrite('slots', () => [...currentSlots]);`
    },
    {
        from: /db_slots = gStore\.db_slots;/g,
        to: `// db_slots synced via jsonStore`
    },
    {
        from: /const currentSlots = gStore\.db_slots \|\| db_slots \|\| \[\];/g,
        to: `const currentSlots = await jsonStore.find('slots');`
    },
    {
        from: /const currentSlots = gStore\.db_slots \|\| db_slots;/g,
        to: `const currentSlots = await jsonStore.find('slots');`
    },
    {
        from: /db_slots\.findIndex/g,
        to: `(await jsonStore.find('slots')).findIndex`
    },
    {
        from: /db_slots\.find/g,
        to: `(await jsonStore.find('slots')).find`
    },
    {
        from: /gStore\.db_slots/g,
        to: `(await jsonStore.find('slots'))`
    },
    {
        from: /db_slots/g,
        to: `(await jsonStore.find('slots'))`
    },
    // Appointments
    {
        from: /db_appointments\.findIndex/g,
        to: `(await jsonStore.find('appointments')).findIndex`
    },
    {
        from: /db_appointments\.find/g,
        to: `(await jsonStore.find('appointments')).find`
    },
    {
        from: /db_appointments\[slotIdx\]/g, // Specific fixes might be needed if there's direct assignment, but appointments usually push or find
        to: `db_appointments[slotIdx]` // Just placeholder, handled by atomicWrite below
    },
    {
        from: /db_appointments\.push\(([^)]+)\);/g,
        to: `await jsonStore.createRecord('appointments', $1);`
    },
    {
        from: /gStore\.db_appointments = db_appointments;/g,
        to: `// db_appointments synced`
    },
    {
        from: /const currentAppts = gStore\.db_appointments \|\| db_appointments \|\| \[\];/g,
        to: `const currentAppts = await jsonStore.find('appointments');`
    },
    {
        from: /db_appointments = currentAppts;/g,
        to: `await jsonStore.atomicWrite('appointments', () => currentAppts);`
    },
    {
        from: /gStore\.db_appointments = currentAppts;/g,
        to: `await jsonStore.atomicWrite('appointments', () => currentAppts);`
    },
    {
        from: /db_appointments/g,
        to: `(await jsonStore.find('appointments'))`
    },
    // Personnel
    {
        from: /const currentPersonnel = gStore\.db_personnel \|\| db_personnel \|\| \[\];/g,
        to: `const currentPersonnel = await jsonStore.find('personnel');`
    },
    {
        from: /let currentPersonnel = gStore\.db_personnel \|\| db_personnel \|\| \[\];/g,
        to: `let currentPersonnel = await jsonStore.find('personnel');`
    },
    {
        from: /const current = gStore\.db_personnel \|\| db_personnel \|\| \[\];/g,
        to: `const current = await jsonStore.find('personnel');`
    },
    {
        from: /const current = gStore\.db_personnel \|\| db_personnel;/g,
        to: `const current = await jsonStore.find('personnel');`
    },
    {
        from: /let pData = \(gStore\.db_personnel \|\| db_personnel \|\| \[\]\);/g,
        to: `let pData = await jsonStore.find('personnel');`
    },
    {
        from: /let pData = \(gStore\.db_personnel \|\| db_personnel\);/g,
        to: `let pData = await jsonStore.find('personnel');`
    },
    {
        from: /const pData = \(gStore\.db_personnel \|\| db_personnel\);/g,
        to: `const pData = await jsonStore.find('personnel');`
    },
    {
        from: /const pData = \(gStore\.db_personnel \|\| db_personnel \|\| \[\]\);/g,
        to: `const pData = await jsonStore.find('personnel');`
    },
    {
        from: /let pData = gStore\.db_personnel \|\| db_personnel \|\| \[\];/g,
        to: `let pData = await jsonStore.find('personnel');`
    },
    {
        from: /gStore\.db_personnel = pData;/g,
        to: `await jsonStore.atomicWrite('personnel', () => pData);`
    },
    {
        from: /gStore\.db_personnel = currentPersonnel;/g,
        to: `await jsonStore.atomicWrite('personnel', () => currentPersonnel);`
    },
    {
        from: /gStore\.db_personnel = \[\.\.\.current, newPersonnel\];/g,
        to: `await jsonStore.createRecord('personnel', newPersonnel);`
    },
    {
        from: /db_personnel = pData;/g,
        to: `// synced via jsonStore`
    },
    {
        from: /db_personnel = currentPersonnel;/g,
        to: `// synced via jsonStore`
    },
    {
        from: /db_personnel = gStore\.db_personnel;/g,
        to: `// synced via jsonStore`
    },
    {
        from: /db_personnel\.find/g,
        to: `(await jsonStore.find('personnel')).find`
    },
    {
        from: /db_personnel\.findIndex/g,
        to: `(await jsonStore.find('personnel')).findIndex`
    },
    {
        from: /db_personnel\.forEach/g,
        to: `(await jsonStore.find('personnel')).forEach`
    },
    {
        from: /db_personnel/g,
        to: `(await jsonStore.find('personnel'))`
    }
];

// In this script we'll avoid double replacements by checking if it already has jsonStore.find
function applyReplacements(content) {
    let result = content;
    // We can't simply replace all db_slots with (await jsonStore.find('slots')) because we'd replace the ones we just added if we're not careful.
    // Instead we do it sequentially. The regexes above handle specific cases first, then fallback.
    // Actually, `(await jsonStore.find('slots'))` contains `db_slots`? No, it doesn't! 
    
    // First, let's pre-process the exact mutations that were tricky
    // e.g. db_slots[slotIdx].status = "Booked";
    // This is hard to regex globally. Let's fix specific lines that mutate array items.
    result = result.replace(/db_slots\[slotIdx\]\.status = "Booked";\n\s*db_slots\[slotIdx\]\.guestName = guestName;/g, 
        `await jsonStore.updateRecord('slots', (await jsonStore.find('slots'))[slotIdx].id, { status: "Booked", guestName });\n        const slot = (await jsonStore.find('slots'))[slotIdx]; // keep local var working`);
        
    result = result.replace(/db_appointments\[appIdx\]\.status = 'Cancelled';/g, 
        `await jsonStore.updateRecord('appointments', (await jsonStore.find('appointments'))[appIdx].id, { status: 'Cancelled' });`);

    for (const rep of replacements) {
        result = result.replace(rep.from, rep.to);
    }

    // Fix remaining syntax issues like await without async in array maps
    // Actually server actions are mostly async. Let's verify.
    return result;
}

const finalContent = applyReplacements(fileContent);

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('actions.ts rewritten with Phase 1 jsonStore logic.');
