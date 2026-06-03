const fs = require('fs');

let content = fs.readFileSync('src/app/components/TempleApplicationForm.tsx', 'utf8');

// We want to hide the price inputs if form.freeType === 'Permanent'
// The price inputs are the div with grid-cols-2 and the Payment Cycle Toggle div.
const searchStr1 = `<div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                   <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">一次性開辦費</p>`;
                   
const replacement1 = `{form.freeType !== 'Permanent' && (
             <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                   <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">一次性開辦費</p>`;

content = content.replace(searchStr1, replacement1);

// We need to close the wrap after the Payment Cycle Toggle
const searchStr2 = `</div>
             </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div className="relative group">
                    <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10 group-focus-within:text-emerald-600 transition-colors">登入帳號</p>`;

const replacement2 = `</div>
             </div>
             )}
              
              <div className="grid grid-cols-2 gap-3">
                 <div className="relative group">
                    <p className="absolute left-5 -top-2 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10 group-focus-within:text-emerald-600 transition-colors">登入帳號</p>`;

content = content.replace(searchStr2, replacement2);

fs.writeFileSync('src/app/components/TempleApplicationForm.tsx', content, 'utf8');
console.log('TempleApplicationForm.tsx updated to hide prices on Permanent Free');
