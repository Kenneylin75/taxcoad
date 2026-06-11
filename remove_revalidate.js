const fs = require('fs');
let code = fs.readFileSync('C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/actions.ts', 'utf8');

// Remove all revalidatePath(...) calls
code = code.replace(/revalidatePath\([^)]+\);?/g, '');

fs.writeFileSync('C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/actions.ts', code);
console.log('Removed revalidatePath from actions.ts successfully!');
