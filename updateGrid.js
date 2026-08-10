const fs = require('fs');
const filePath = 'C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/[templeId]/GuestAppClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldGrid =           <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleFeatureClick('booking')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-3xl text-red-600">📅</div>
              <span className="font-bold text-gray-900">預約</span>
            </button>
            
            <button onClick={() => handleFeatureClick('lighting')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl text-amber-600"><IconCandle /></div>
              <span className="font-bold text-gray-900">點燈</span>
            </button>
            
            <button onClick={() => handleFeatureClick('queue')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl text-emerald-600">🎟️</div>
              <span className="font-bold text-gray-900">排隊</span>
            </button>
            
            <button onClick={() => handleFeatureClick('events')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl text-indigo-600"><IconFestive /></div>
              <span className="font-bold text-gray-900">活動</span>
            </button>
          </div>;

const newGrid =           <div className="grid grid-cols-2 gap-4">
            {serviceSettings?.modules?.calendar && (
              <button onClick={() => handleFeatureClick('booking')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-3xl text-red-600">📅</div>
                <span className="font-bold text-gray-900">預約</span>
              </button>
            )}
            
            {serviceSettings?.modules?.lamps && (
              <button onClick={() => handleFeatureClick('lighting')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl text-amber-600"><IconCandle /></div>
                <span className="font-bold text-gray-900">點燈</span>
              </button>
            )}
            
            {serviceSettings?.modules?.queue && (
              <button onClick={() => handleFeatureClick('queue')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl text-emerald-600">🎟️</div>
                <span className="font-bold text-gray-900">排隊</span>
              </button>
            )}
            
            {serviceSettings?.modules?.events && (
              <button onClick={() => handleFeatureClick('events')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl text-indigo-600"><IconFestive /></div>
                <span className="font-bold text-gray-900">活動</span>
              </button>
            )}
          </div>;

content = content.replace(oldGrid, newGrid);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced');
