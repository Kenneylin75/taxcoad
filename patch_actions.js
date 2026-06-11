const fs = require('fs');
let code = fs.readFileSync('C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/actions.ts', 'utf8');

// Add noStore import if not present
if (!code.includes('unstable_noStore')) {
    code = code.replace(/import\s*\{\s*revalidatePath\s*\}\s*from\s*["']next\/cache["'];/, 'import { revalidatePath, unstable_noStore as noStore } from "next/cache";');
}

// Add noStore() call inside all fetch functions
code = code.replace(/export\s+async\s+function\s+fetch([a-zA-Z0-9_]*)\((.*?)\)\s*\{/g, (match, p1, p2) => {
    return `export async function fetch${p1}(${p2}) { noStore();`;
});

fs.writeFileSync('C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/actions.ts', code);
console.log('actions.ts patched successfully!');
