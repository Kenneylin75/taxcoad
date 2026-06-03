const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

content = content.replace(/選項設計 \(請用逗號分隔\)/g, '選項設計 (請用 / 分隔)');
content = content.replace(/例如：柏油路, 水泥路, 石頭路, 爛泥路/g, '例如：柏油路/水泥路/石頭路/爛泥路');
content = content.replace(/\.split\(','\)/g, ".split('/')");
content = content.replace(/\.join\(', '\)/g, ".join('/')");

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('Delimiter changed to slash');
