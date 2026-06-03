const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', 'utf8');

// 1. Overview Metrics
const oldOverview = `         {[
            { label: '本季累計收支', value: 'NT$ 458,200', growth: '+12.5%', icon: '💎' },
            { label: '信眾成長數', value: '158 位', growth: '+24.8%', icon: '👥' },
            { label: '轉換效能', value: '18.5%', growth: '+5.2%', icon: '🤖' },
            { label: '平均處理時效', value: '12 分鐘', growth: '-15.4%', icon: '⌛' }
         ].map((stat, i) => (`;

const newOverview = `         {[
            { label: '本季累計收支', value: \`NT$ \${data.overview?.totalRevenue?.toLocaleString() || 0}\`, growth: '即時', icon: '💎' },
            { label: '信眾成長數', value: \`\${data.overview?.totalGuests || 0} 位\`, growth: '即時', icon: '👥' },
            { label: '轉換效能', value: \`\${data.overview?.conversionRate || 0}%\`, growth: '即時', icon: '🤖' },
            { label: '平均處理時效', value: \`\${data.overview?.avgProcessingTime || 0} 分鐘\`, growth: '即時', icon: '⌛' }
         ].map((stat, i) => (`;

content = content.replace(oldOverview, newOverview);

const oldGrowth = `               <div className={\`mt-2 text-[10px] font-black \${stat.growth.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}\`}>
                  {stat.growth} ↗
               </div>`;

const newGrowth = `               <div className="mt-2 text-[10px] font-black text-amber-600">
                  {stat.growth} ◉
               </div>`;

content = content.replace(oldGrowth, newGrowth);

// 2. Gender
const oldGenderBlock = `               {/* Gender */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">性別權重比例</h4>
                  <div className="flex flex-col items-center justify-center gap-8 py-4">
                     <div className="w-32 h-32 rounded-full border-[20px] border-slate-900 relative flex items-center justify-center shadow-lg">
                        <div className="absolute inset-[-20px] rounded-full border-[20px] border-amber-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%)' }}></div>
                        <div className="text-center">
                           <p className="text-2xl font-black text-slate-800 font-serif leading-none">62%</p>
                           <p className="text-[8px] text-slate-400 font-black uppercase mt-1">女性能級</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-1">男性</p>
                           <p className="text-sm font-black text-slate-800">38%</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-1">女性</p>
                           <p className="text-sm font-black text-amber-600">62%</p>
                        </div>
                     </div>
                  </div>
               </div>`;

const newGenderBlock = `               {/* Gender */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">性別推算比例</h4>
                  {!data.genderDemographics?.hasData ? (
                     <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-2xl">
                       <span className="text-2xl mb-2 grayscale opacity-50">🚻</span>
                       <p className="text-xs font-bold text-slate-400">目前尚無足夠信眾資料</p>
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center gap-8 py-4">
                        <div className="w-32 h-32 rounded-full border-[20px] border-slate-900 relative flex items-center justify-center shadow-lg">
                           <div className="absolute inset-[-20px] rounded-full border-[20px] border-amber-500" style={{ clipPath: \`polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% \${(data.genderDemographics.female / 100) * 100}%)\` }}></div>
                           <div className="text-center">
                              <p className="text-2xl font-black text-slate-800 font-serif leading-none">{data.genderDemographics.female}%</p>
                              <p className="text-[8px] text-slate-400 font-black uppercase mt-1">女性能級</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full mt-4">
                           <div className="bg-slate-50 p-3 rounded-xl text-center">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">男性</p>
                              <p className="text-sm font-black text-slate-800">{data.genderDemographics.male}%</p>
                           </div>
                           <div className="bg-slate-50 p-3 rounded-xl text-center">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">女性</p>
                              <p className="text-sm font-black text-amber-600">{data.genderDemographics.female}%</p>
                           </div>
                        </div>
                     </div>
                  )}
               </div>`;

content = content.replace(oldGenderBlock, newGenderBlock);

// 3. Service Heat
const oldServiceBlock = `                     {[
                        { label: '元辰宮觀修', val: 45, color: 'bg-slate-900' },
                        { label: '事業因果解惑', val: 30, color: 'bg-amber-500' },
                        { label: '收驚法事', val: 15, color: 'bg-slate-300' },
                        { label: '安太歲祈福', val: 10, color: 'bg-slate-200' }
                     ].map((item) => (`;

const newServiceBlock = `                     {(data.serviceHeat || []).map((item: any) => (`;

content = content.replace(oldServiceBlock, newServiceBlock);

fs.writeFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', content, 'utf8');
console.log('Updated AnalyticsClient.tsx UI components');
