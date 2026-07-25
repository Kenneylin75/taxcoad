const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src');

const patterns = [
    { regex: /(const|let)\s+\[([^\]]+)\]\s*=\s*(useState)\(/g, name: 'useState([])' },
    { regex: /(const|let)\s+\[([^\]]+)\]\s*=\s*\[/g, name: 'let [] and const []' },
    { regex: /useReducer\([^,]+,\s*\[\]\)/g, name: 'useReducer initial arrays' },
    { regex: /\.push\(/g, name: 'array.push()' },
    { regex: /\.splice\(/g, name: 'array.splice()' },
    { regex: /\.filter\(/g, name: 'array.filter()' },
    { regex: /\.map\(/g, name: 'array.map()' },
    { regex: /mock[A-Z_a-z0-9]*/gi, name: 'mock data' },
    { regex: /sample[A-Z_a-z0-9]*/gi, name: 'sample data' },
    { regex: /hard-coded/gi, name: 'hard-coded records' },
    { regex: /cache[A-Z_a-z0-9]*/gi, name: 'in-memory caches' },
    { regex: /global[A-Z_a-z0-9]*/gi, name: 'global arrays' },
    { regex: /localStorage\./g, name: 'localStorage' },
    { regex: /sessionStorage\./g, name: 'sessionStorage' },
    { regex: /JSON\.parse\(/g, name: 'JSON.parse()' },
    { regex: /JSON\.stringify\(/g, name: 'JSON.stringify()' },
    { regex: /new Map\(/g, name: 'Maps used as storage' },
    { regex: /new Set\(/g, name: 'Sets used as storage' },
];

let results = [];

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            walk(file);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(file, 'utf8');
            let lines = content.split('\n');
            lines.forEach((line, index) => {
                patterns.forEach(p => {
                    let match;
                    if (p.regex.global) p.regex.lastIndex = 0;
                    while ((match = p.regex.exec(line)) !== null) {
                        results.push({
                            file: file.replace(path.join(__dirname, '..'), ''),
                            line: index + 1,
                            patternName: p.name,
                            matchText: line.trim(),
                            variableName: match[2] ? match[2].trim() : 'N/A' // Attempt to grab variable names if captured
                        });
                        if (!p.regex.global) break;
                    }
                });
            });
        }
    });
}

walk(srcPath);

// Generate markdown report
let md = `# Project Analysis Report\n\n`;
md += `## Detailed Findings\n\n`;
md += `| File Path | Line Number | Variable/Pattern | Purpose | Stores Persistent Data or UI State? | Lost After Restart? | Migrate to JSON? | Risk Level |\n`;
md += `|---|---|---|---|---|---|---|---|\n`;

let totalArrays = 0;
let totalTempStores = 0;
let totalPersistent = 0;
let totalMigrations = 0;

results.forEach(r => {
    let purpose = 'Data manipulation / State management';
    let isPersistent = 'UI State';
    let lostAfterRestart = 'Yes';
    let migrateToJson = 'No';
    let riskLevel = 'Low';
    let varName = r.variableName !== 'N/A' ? r.variableName : r.patternName;

    if (r.patternName.includes('localStorage') || r.patternName.includes('sessionStorage')) {
        isPersistent = 'Persistent (Client)';
        lostAfterRestart = r.patternName.includes('sessionStorage') ? 'Yes' : 'No';
        migrateToJson = 'No';
        riskLevel = 'Medium';
        totalPersistent++;
    } else if (r.patternName.includes('mock') || r.patternName.includes('sample') || r.patternName.includes('hard-coded')) {
        purpose = 'Mock / Sample Data';
        migrateToJson = 'Yes';
        riskLevel = 'Medium';
        totalTempStores++;
        totalMigrations++;
    } else if (r.patternName.includes('cache') || r.patternName.includes('Map') || r.patternName.includes('Set') || r.patternName.includes('global')) {
        purpose = 'In-memory Cache / Store';
        isPersistent = 'Temporary Store';
        lostAfterRestart = 'Yes';
        migrateToJson = 'Yes';
        riskLevel = 'High';
        totalTempStores++;
        totalMigrations++;
    } else if (r.patternName.includes('JSON')) {
        purpose = 'Serialization / Deserialization';
    } else {
        totalArrays++;
    }

    md += `| ${r.file} | ${r.line} | ${varName} | ${purpose} | ${isPersistent} | ${lostAfterRestart} | ${migrateToJson} | ${riskLevel} |\n`;
});

md += `\n## Summary\n`;
md += `- **Total number of arrays / array operations:** ${totalArrays}\n`;
md += `- **Total number of temporary data stores:** ${totalTempStores}\n`;
md += `- **Total number of persistent storage mechanisms (localStorage/sessionStorage):** ${totalPersistent}\n`;
md += `- **Total number of locations that must be converted to JSON/DB:** ${totalMigrations}\n`;

const outputDir = path.join(process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config'), '.gemini/antigravity-ide/brain', '3961adf1-5ae6-4fbf-9376-d8b65da76837');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const mdOutput = path.join(outputDir, 'analysis_report.md');
fs.writeFileSync(mdOutput, md);
console.log('Analysis complete. Report written to ' + mdOutput);
