const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldBlock = `                  <div className="h-48 w-full relative">
                    <img src={evt.imageUrl || \`https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&q=80&w=800\`} className="w-full h-full object-cover" />
                  </div>`;

const newBlock = `                  <div className="h-48 w-full relative bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center overflow-hidden">
                    <div className="text-amber-500/20 text-6xl absolute">🏮</div>
                    {evt.imageUrl ? (
                      <img src={evt.imageUrl} className="absolute inset-0 w-full h-full object-cover z-10" onError={(e) => { e.currentTarget.style.display='none'; }} />
                    ) : null}
                  </div>`;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Updated page.tsx img fallback rendering');
