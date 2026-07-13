const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/app/[templeId]/admin/customers/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Set to collect all functions that need to be statically imported
const functionsToImport = new Set();

// 1. Replace `await import('@/app/actions').then(m => m.someFunc(` with `await someFunc(`
content = content.replace(/await import\('@\/app\/actions'\)\.then\(\s*m\s*=>\s*m\.([a-zA-Z0-9_]+)\(/g, (match, funcName) => {
    functionsToImport.add(funcName);
    return `await ${funcName}(`;
});

// 2. Replace `const { func1, func2 } = await import('@/app/actions');` with nothing
content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*await\s+import\('@\/app\/actions'\);/g, (match, inner) => {
    // split by comma and trim
    const funcs = inner.split(',').map(f => f.trim()).filter(f => f);
    funcs.forEach(f => functionsToImport.add(f));
    return '';
});

// Filter out functions that are already imported at the top
const importRegex = /import\s+\{([^}]+)\}\s+from\s+'@\/app\/actions'/;
const importMatch = content.match(importRegex);
if (importMatch) {
    const existingImports = new Set(importMatch[1].split(',').map(s => s.trim()));
    const newImports = Array.from(functionsToImport).filter(f => !existingImports.has(f));
    
    if (newImports.length > 0) {
        // Append new imports to the existing import statement
        const newImportBlock = `import {\n  ${Array.from(existingImports).join(',\n  ')},\n  ${newImports.join(',\n  ')}\n} from '@/app/actions'`;
        content = content.replace(importMatch[0], newImportBlock);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactoring complete. Functions added to top import:', Array.from(functionsToImport));
