const fs = require('fs');
const filePath = 'C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/[templeId]/GuestAppClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const old1 = '<button onClick={() => handleFeatureClick(\'booking\')} className=\"app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors\">\n              <div className=\"w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-3xl text-red-600\">📅</div>\n              <span className=\"font-bold text-gray-900\">預約</span>\n            </button>';
const new1 = '{serviceSettings?.modules?.calendar && (\n              <button onClick={() => handleFeatureClick(\'booking\')} className=\"app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors\">\n                <div className=\"w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-3xl text-red-600\">📅</div>\n                <span className=\"font-bold text-gray-900\">預約</span>\n              </button>\n            )}';

const old2 = '<button onClick={() => handleFeatureClick(\'lighting\')} className=\"app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors\">\n              <div className=\"w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl text-amber-600\"><IconCandle /></div>\n              <span className=\"font-bold text-gray-900\">點燈</span>\n            </button>';
const new2 = '{serviceSettings?.modules?.lamps && (\n              <button onClick={() => handleFeatureClick(\'lighting\')} className=\"app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors\">\n                <div className=\"w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl text-amber-600\"><IconCandle /></div>\n                <span className=\"font-bold text-gray-900\">點燈</span>\n              </button>\n            )}';

const old3 = '<button onClick={() => handleFeatureClick(\'queue\')} className=\"app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors\">\n              <div className=\"w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl text-emerald-600\">🎟️</div>\n              <span className=\"font-bold text-gray-900\">排隊</span>\n            </button>';
const new3 = '{serviceSettings?.modules?.queue && (\n              <button onClick={() => handleFeatureClick(\'queue\')} className=\"app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors\">\n                <div className=\"w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl text-emerald-600\">🎟️</div>\n                <span className=\"font-bold text-gray-900\">排隊</span>\n              </button>\n            )}';

const old4 = '<button onClick={() => handleFeatureClick(\'events\')} className=\"app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors\">\n              <div className=\"w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl text-indigo-600\"><IconFestive /></div>\n              <span className=\"font-bold text-gray-900\">活動</span>\n            </button>';
const new4 = '{serviceSettings?.modules?.events && (\n              <button onClick={() => handleFeatureClick(\'events\')} className=\"app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors\">\n                <div className=\"w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl text-indigo-600\"><IconFestive /></div>\n                <span className=\"font-bold text-gray-900\">活動</span>\n              </button>\n            )}';

content = content.replace(old1, new1).replace(old1.replace(/\\n/g, '\\r\\n'), new1.replace(/\\n/g, '\\r\\n'));
content = content.replace(old2, new2).replace(old2.replace(/\\n/g, '\\r\\n'), new2.replace(/\\n/g, '\\r\\n'));
content = content.replace(old3, new3).replace(old3.replace(/\\n/g, '\\r\\n'), new3.replace(/\\n/g, '\\r\\n'));
content = content.replace(old4, new4).replace(old4.replace(/\\n/g, '\\r\\n'), new4.replace(/\\n/g, '\\r\\n'));

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
