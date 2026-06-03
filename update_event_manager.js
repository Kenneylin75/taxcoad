const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/events/EventManagerClient.tsx', 'utf8');

const oldLocationBlock = `             <div>
               <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">舉辦地點 Location</label>
               <input required name="location" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="例如：本宮大殿 / 戶外廣場" />
             </div>`;

const newLocationBlock = `             <div>
               <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">舉辦地點 Location</label>
               <input required name="location" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="例如：本宮大殿 / 戶外廣場" />
             </div>
             <div>
               <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">宣傳圖片 (圖片網址) Image URL</label>
               <input name="imageUrl" type="url" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="例如：https://example.com/image.jpg" />
               <p className="text-[10px] text-slate-400 mt-1 font-bold">選填，建議比例 16:9</p>
             </div>`;

content = content.replace(oldLocationBlock, newLocationBlock);

fs.writeFileSync('src/app/[templeId]/admin/events/EventManagerClient.tsx', content, 'utf8');
console.log('Updated EventManagerClient.tsx');
