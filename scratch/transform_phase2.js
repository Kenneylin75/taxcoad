const fs = require('fs');
const ts = require('typescript');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

if (!fileContent.includes("import * as jsonStore from '@/lib/jsonStore'")) {
    fileContent = fileContent.replace(
        `"use server";\n`,
        `"use server";\nimport * as jsonStore from '@/lib/jsonStore';\n`
    );
}

// Rename initializePhase1Storage to initializeStorage if needed
fileContent = fileContent.replace(/initializePhase1Storage/g, 'initializeStorage');

// Remove global initializations
fileContent = fileContent.replace(/let db_temples:\s*any\[\]\s*=\s*initGlobal\('db_temples',\s*\[\]\);\n*/g, '');
fileContent = fileContent.replace(/let db_guests:\s*any\[\]\s*=\s*initGlobal\("db_guests",\s*\[\]\);\n*/g, '');
fileContent = fileContent.replace(/let db_admins:\s*any\[\]\s*=\s*initGlobal\('db_admins',\s*\[\]\);\n*/g, '');

const replacements = [
    // db_temples
    { from: /let tData = \(gStore\.db_temples \|\| db_temples\);/g, to: `let tData = await jsonStore.find('temples');` },
    { from: /const tData = \(gStore\.db_temples \|\| db_temples\);/g, to: `const tData = await jsonStore.find('temples');` },
    { from: /let tData = \(gStore\.db_temples \|\| db_temples \|\| \[\]\);/g, to: `let tData = await jsonStore.find('temples');` },
    { from: /const tData = \(gStore\.db_temples \|\| db_temples \|\| \[\]\);/g, to: `const tData = await jsonStore.find('temples');` },
    { from: /const currentTemples = gStore\.db_temples \|\| db_temples \|\| \[\];/g, to: `const currentTemples = await jsonStore.find('temples');` },
    { from: /let currentTemples = gStore\.db_temples \|\| db_temples \|\| \[\];/g, to: `let currentTemples = await jsonStore.find('temples');` },
    { from: /const temples = gStore\.db_temples \|\| db_temples \|\| \[\];/g, to: `const temples = await jsonStore.find('temples');` },
    { from: /const temples = gStore\.db_temples \|\| db_temples;/g, to: `const temples = await jsonStore.find('temples');` },
    { from: /gStore\.db_temples = tData;/g, to: `await jsonStore.atomicWrite('temples', () => tData);` },
    { from: /gStore\.db_temples = currentTemples;/g, to: `await jsonStore.atomicWrite('temples', () => currentTemples);` },
    { from: /db_temples\.push\(([^)]+)\);/g, to: `await jsonStore.createRecord('temples', $1);` },
    { from: /gStore\.db_temples = \[\.\.\.currentTemples, newTemple\];/g, to: `await jsonStore.createRecord('temples', newTemple);` },
    { from: /gStore\.db_temples = db_temples;/g, to: `// synced` },
    { from: /db_temples = tData;/g, to: `// synced` },
    { from: /db_temples = currentTemples;/g, to: `// synced` },
    { from: /db_temples = gStore\.db_temples;/g, to: `// synced` },
    { from: /db_temples\.find/g, to: `(await jsonStore.find('temples')).find` },
    { from: /db_temples\.findIndex/g, to: `(await jsonStore.find('temples')).findIndex` },
    { from: /db_temples\.filter/g, to: `(await jsonStore.find('temples')).filter` },
    { from: /gStore\.db_temples/g, to: `(await jsonStore.find('temples'))` },
    { from: /db_temples/g, to: `(await jsonStore.find('temples'))` },

    // db_guests
    { from: /let currentGuests = gStore\.db_guests \|\| db_guests \|\| \[\];/g, to: `let currentGuests = await jsonStore.find('guests');` },
    { from: /const currentGuests = gStore\.db_guests \|\| db_guests \|\| \[\];/g, to: `const currentGuests = await jsonStore.find('guests');` },
    { from: /const guests = gStore\.db_guests \|\| db_guests \|\| \[\];/g, to: `const guests = await jsonStore.find('guests');` },
    { from: /const guests = gStore\.db_guests \|\| db_guests;/g, to: `const guests = await jsonStore.find('guests');` },
    { from: /gStore\.db_guests = guests;/g, to: `await jsonStore.atomicWrite('guests', () => guests);` },
    { from: /gStore\.db_guests = currentGuests;/g, to: `await jsonStore.atomicWrite('guests', () => currentGuests);` },
    { from: /gStore\.db_guests = \[\.\.\.currentGuests, newGuest\];/g, to: `await jsonStore.createRecord('guests', newGuest);` },
    { from: /db_guests = gStore\.db_guests;/g, to: `// synced` },
    { from: /db_guests = currentGuests;/g, to: `// synced` },
    { from: /db_guests\.push\(([^)]+)\);/g, to: `await jsonStore.createRecord('guests', $1);` },
    { from: /db_guests\.find/g, to: `(await jsonStore.find('guests')).find` },
    { from: /db_guests\.findIndex/g, to: `(await jsonStore.find('guests')).findIndex` },
    { from: /db_guests\.filter/g, to: `(await jsonStore.find('guests')).filter` },
    { from: /gStore\.db_guests/g, to: `(await jsonStore.find('guests'))` },
    { from: /db_guests/g, to: `(await jsonStore.find('guests'))` },

    // db_admins
    { from: /const currentAdmins = gStore\.db_admins \|\| db_admins \|\| \[\];/g, to: `const currentAdmins = await jsonStore.find('admins');` },
    { from: /let currentAdmins = gStore\.db_admins \|\| db_admins \|\| \[\];/g, to: `let currentAdmins = await jsonStore.find('admins');` },
    { from: /const admins = gStore\.db_admins \|\| db_admins \|\| \[\];/g, to: `const admins = await jsonStore.find('admins');` },
    { from: /const admins = gStore\.db_admins \|\| db_admins;/g, to: `const admins = await jsonStore.find('admins');` },
    { from: /gStore\.db_admins = admins;/g, to: `await jsonStore.atomicWrite('admins', () => admins);` },
    { from: /gStore\.db_admins = currentAdmins;/g, to: `await jsonStore.atomicWrite('admins', () => currentAdmins);` },
    { from: /gStore\.db_admins = \[\.\.\.currentAdmins, newAdmin\];/g, to: `await jsonStore.createRecord('admins', newAdmin);` },
    { from: /db_admins = gStore\.db_admins;/g, to: `// synced` },
    { from: /db_admins = currentAdmins;/g, to: `// synced` },
    { from: /db_admins\.push\(([^)]+)\);/g, to: `await jsonStore.createRecord('admins', $1);` },
    { from: /db_admins\.find/g, to: `(await jsonStore.find('admins')).find` },
    { from: /db_admins\.findIndex/g, to: `(await jsonStore.find('admins')).findIndex` },
    { from: /db_admins\.filter/g, to: `(await jsonStore.find('admins')).filter` },
    { from: /gStore\.db_admins/g, to: `(await jsonStore.find('admins'))` },
    { from: /db_admins/g, to: `(await jsonStore.find('admins'))` }
];

function applyReplacements(content) {
    let result = content;

    // Mutating lines that need careful replacements
    result = result.replace(/db_temples\[idx\]\.status = status;/g, `await jsonStore.updateRecord('temples', (await jsonStore.find('temples'))[idx].id, { status });`);
    result = result.replace(/db_temples\[idx\]\.name = name;/g, `await jsonStore.updateRecord('temples', (await jsonStore.find('temples'))[idx].id, { name });`);
    result = result.replace(/db_guests\[idx\]\.status = status;/g, `await jsonStore.updateRecord('guests', (await jsonStore.find('guests'))[idx].id, { status });`);

    for (const rep of replacements) {
        result = result.replace(rep.from, rep.to);
    }
    return result;
}

const finalContent = applyReplacements(fileContent);
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('actions.ts rewritten with Phase 2 jsonStore logic.');
