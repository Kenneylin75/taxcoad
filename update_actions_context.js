const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const newFunc = `export async function setGuestTempleContext(templeId: string) {
  try {
    const store = await cookies();
    store.set('templeId', templeId, { secure: true, httpOnly: true, path: '/' });
  } catch (e: any) {
    // Silent fail if cookies can't be set
  }
}
`;

if (!content.includes('export async function setGuestTempleContext')) {
  content = content.replace('export async function getDynamicTempleId() {', newFunc + '\nexport async function getDynamicTempleId() {');
}

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('actions.ts updated with setGuestTempleContext');
