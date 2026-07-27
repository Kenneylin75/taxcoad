const fs = require('fs');

function processFile(filePath) {
    let code = fs.readFileSync(filePath, 'utf-8');

    // 1. Fix malformed SQL in specific patterns
    code = code.replace(/UPDATE appointments SET payment_status = , payment_method = WHERE id = RETURNING id/g,
        'UPDATE appointments SET payment_status = $1, payment_method = $2 WHERE id = $3 RETURNING id');
    
    code = code.replace(/UPDATE queue_tickets SET payment_status = WHERE id = RETURNING id/g,
        'UPDATE queue_tickets SET payment_status = $1 WHERE id = $2 RETURNING id');

    // Remove `() => null` fallback from dbQuery
    // dbQuery(..., ..., () => null) -> dbQuery(..., ...)
    code = code.replace(/dbQuery\(([^,]+),\s*([^,]+),\s*\(\)\s*=>\s*null\)/g, 'dbQuery($1, $2)');
    // Sometimes dbQuery is dbQuery("...", [], () => null)
    code = code.replace(/dbQuery\(([^)]+),\s*\(\)\s*=>\s*null\)/g, 'dbQuery($1)');
    
    // Convert `if (!client) return ...` single line cases
    code = code.replace(/if\s*\(\!client\)\s*return[^;]+;/g, '');

    // Now handle `if (!client) { ... } else {` using brace matching
    while (true) {
        const match = code.match(/if\s*\(\!client\)\s*\{/);
        if (!match) break;
        
        let startIndex = match.index;
        let braceCount = 0;
        let foundFirstBrace = false;
        let endIndex = -1;
        
        for (let i = startIndex; i < code.length; i++) {
            if (code[i] === '{') {
                braceCount++;
                foundFirstBrace = true;
            } else if (code[i] === '}') {
                braceCount--;
            }
            
            if (foundFirstBrace && braceCount === 0) {
                endIndex = i;
                break;
            }
        }
        
        if (endIndex !== -1) {
            // Check if there is an `else {` following it
            let nextText = code.substring(endIndex + 1).trimStart();
            if (nextText.startsWith('else {') || nextText.startsWith('else{')) {
                let elseIndex = code.indexOf('else', endIndex);
                let elseBraceIndex = code.indexOf('{', elseIndex);
                
                // Remove from `if (!client)` to `else {`
                code = code.substring(0, startIndex) + code.substring(elseBraceIndex + 1);
                
                // We also need to remove the closing brace of the `else` block!
                // To do this, we need to find the matching closing brace of the else block.
                // It's easier to just comment out the `if (!client)` block.
                
                // Let's revert and do a simpler approach:
            }
        }
    }
}

// Better approach for if (!client): replace it with `if (false)`
let code = fs.readFileSync('src/app/actions.ts', 'utf-8');

// Fix dbQuery
code = code.replace(/,\s*\(\)\s*=>\s*null/g, '');

// Replace if (!client) with if (false) so JS ignores it but we don't break braces
code = code.replace(/if\s*\(\!client\)/g, 'if (false)');

// Fix SQL syntax manually based on what we saw
code = code.replace(/SET payment_status = , payment_method = WHERE id = /g, 'SET payment_status = $1, payment_method = $2 WHERE id = $3 ');
code = code.replace(/SET payment_status = WHERE id = /g, 'SET payment_status = $1 WHERE id = $2 ');

fs.writeFileSync('src/app/actions.ts', code);
console.log('actions.ts processed!');
