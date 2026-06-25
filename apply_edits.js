const fs = require('fs');

const data = require('./super_admin_edits.json');
const targetObj = data.find(d => d.Description === '"Added storage and AI admin upgrade sections to view detail modal"');

if (!targetObj) {
    console.error('Target not found');
    process.exit(1);
}

const chunks = JSON.parse(targetObj.Chunks);
let fileContent = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// Sort chunks from bottom to top so that line numbers don't shift when replacing!
// Wait, the chunks specify target content, we can just replace the string.
let modified = false;

for (const chunk of chunks) {
    if (fileContent.includes(chunk.TargetContent)) {
        fileContent = fileContent.replace(chunk.TargetContent, chunk.ReplacementContent);
        console.log('Replaced chunk ending at line ' + chunk.EndLine);
        modified = true;
    } else {
        console.log('TargetContent not found for chunk ending at line ' + chunk.EndLine);
    }
}

if (modified) {
    fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', fileContent, 'utf8');
    console.log('Modifications saved to SuperAdminClient.tsx');
} else {
    console.log('No modifications made.');
}
