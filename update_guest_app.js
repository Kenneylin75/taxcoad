const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/GuestAppClient.tsx', 'utf8');

// 1. Phone number filter
content = content.replace(
  `onChange={(e) => setLoginPhone(e.target.value)}`,
  `onChange={(e) => setLoginPhone(e.target.value.replace(/\\D/g, ''))}`
);

// 2. Add max and min to gregorianDate input
const today = new Date().toISOString().split('T')[0];
const minYear = new Date().getFullYear() - 100;
const minDate = \`\${minYear}-01-01\`;

content = content.replace(
  `              <input 
                type="date" 
                value={gregorianDate} 
                onChange={(e) => setGregorianDate(e.target.value)}
                className="app-input" 
              />`,
  `              <input 
                type="date" 
                value={gregorianDate} 
                max="${today}"
                min="${minDate}"
                onChange={(e) => setGregorianDate(e.target.value)}
                className="app-input" 
              />`
);

// 3. Add validation on save profile
content = content.replace(
  `          <button 
            type="button" 
            onClick={async () => { 
              const updatedData = {`,
  `          <button 
            type="button" 
            onClick={async () => { 
              if (gregorianDate) {
                const selectedYear = new Date(gregorianDate).getFullYear();
                const currentYear = new Date().getFullYear();
                if (new Date(gregorianDate) > new Date()) return alert('出生日期不可設定為未來時間！');
                if (currentYear - selectedYear > 100) return alert('出生日期設定異常，超過一百歲請洽宮廟人員協助！');
              }
              const updatedData = {`
);

fs.writeFileSync('src/app/[templeId]/GuestAppClient.tsx', content);
console.log('Done GuestAppClient update');
