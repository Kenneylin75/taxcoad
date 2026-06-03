const fs = require('fs');

let content = fs.readFileSync('src/app/actions.ts', 'utf8');

content = content.replace(
  /export async function getCurrentRole\(\): Promise<AppRole> \{\n  return 'TempleAdmin'; \n\}/,
  `export async function getCurrentRole(): Promise<AppRole> {\n  const { cookies } = require('next/headers');\n  const cookieStore = await cookies();\n  const role = cookieStore.get('admin_role')?.value as AppRole;\n  return role || 'TempleAdmin';\n}`
);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Fixed getCurrentRole');
