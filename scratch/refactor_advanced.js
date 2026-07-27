const fs = require('fs');

function removeIfClient(code) {
    let result = '';
    let i = 0;
    while (i < code.length) {
        // Look for `if (!client)`
        const match = code.substring(i).match(/^if\s*\(\!client\)\s*/);
        if (match) {
            i += match[0].length;
            
            // Is it a block `{` or a single statement?
            if (code[i] === '{') {
                let braceCount = 1;
                i++;
                while (i < code.length && braceCount > 0) {
                    if (code[i] === '{') braceCount++;
                    if (code[i] === '}') braceCount--;
                    i++;
                }
                
                // Now check for `else {`
                let remainder = code.substring(i);
                let elseMatch = remainder.match(/^\s*else\s*\{/);
                if (elseMatch) {
                    i += elseMatch[0].length;
                    // We just skip the `else {` part, but we need to remove the matching closing brace of the else block!
                    // To do this, we can't easily just skip it. We have to KEEP the contents of the else block and REMOVE the `else {` and `}`.
                    let elseContentStart = i;
                    let elseBraceCount = 1;
                    while (i < code.length && elseBraceCount > 0) {
                        if (code[i] === '{') elseBraceCount++;
                        if (code[i] === '}') elseBraceCount--;
                        i++;
                    }
                    let elseContent = code.substring(elseContentStart, i - 1);
                    result += elseContent;
                }
            } else {
                // Single statement like `if (!client) return ...;`
                while (i < code.length && code[i] !== '\n' && code[i] !== ';') {
                    i++;
                }
                if (code[i] === ';') i++;
            }
        } else {
            result += code[i];
            i++;
        }
    }
    return result;
}

let code = fs.readFileSync('src/app/actions.ts', 'utf-8');
code = code.replace(/,\s*\(\)\s*=>\s*null/g, '');
code = code.replace(/SET payment_status = , payment_method = WHERE id = /g, 'SET payment_status = $1, payment_method = $2 WHERE id = $3 ');
code = code.replace(/SET payment_status = WHERE id = /g, 'SET payment_status = $1 WHERE id = $2 ');

// Remove jsonStore imports
code = code.replace(/import\s+\*\s+as\s+jsonStore\s+from\s+['"]@\/lib\/jsonStore['"];?/g, '');

// Process if (!client)
code = removeIfClient(code);

// Remove the global gStore memory variables
code = code.replace(/const\s+gStore\s*=\s*globalThis\s+as\s+any;/g, '');
code = code.replace(/const\s+initGlobal\s*=\s*\([^)]*\)\s*=>\s*\{[^}]+\};/g, '');

fs.writeFileSync('src/app/actions.ts', code);
console.log('actions.ts refactored!');
