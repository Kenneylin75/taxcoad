const fs = require('fs');

let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const targetStr = `export async function impersonateTemple(templeId: string) {
  const { cookies } = require('next/headers');
  const cookieStore = await cookies();
  // Bypass strict role check for prototype since SuperAdmin UI is the only entry point
  
  const { cookies } = require('next/headers');
  const cookieStore = await cookies();`;

const replacement = `export async function impersonateTemple(templeId: string) {
  const { cookies } = require('next/headers');
  const cookieStore = await cookies();
  // Bypass strict role check for prototype since SuperAdmin UI is the only entry point`;

// The actual file content might have formatting differences. Let's do it via regex.
content = content.replace(
  /const \{ cookies \} = require\('next\/headers'\);\s*const cookieStore = await cookies\(\);\s*\/\/ Bypass strict role check.*?\s*const \{ cookies \} = require\('next\/headers'\);\s*const cookieStore = await cookies\(\);/s,
  `const { cookies } = require('next/headers');\n  const cookieStore = await cookies();\n  // Bypass strict role check for prototype since SuperAdmin UI is the only entry point`
);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Fixed cookieStore duplication');
