const fs = require('fs');

let content = fs.readFileSync('src/app/actions.ts', 'utf8');

content = content.replace(
  /export async function saveServiceDefinition\(data: any\) \{/,
  `export async function saveServiceDefinition(data: any) {\n  const templeId = await getDynamicTempleId();`
);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Fixed saveServiceDefinition');
