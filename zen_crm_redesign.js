const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/customers/page.tsx', 'utf8');

// 1. Layout & Sidebar
content = content.replace(/className="flex h-\[calc\(100vh-80px\)\] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-xl"/g, 'className="flex h-screen bg-white overflow-hidden"');
content = content.replace(/className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0"/g, 'className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0"');

// Search Header
content = content.replace(/<div className="p-5 border-b border-slate-100 space-y-4">/g, '<div className="p-8 border-b border-slate-200 space-y-6">');
content = content.replace(/className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-sm shadow-md"/g, 'className="text-2xl"');
content = content.replace(/<h2 className="text-base font-bold text-slate-800">/g, '<h2 className="text-lg font-medium text-slate-900">');
content = content.replace(/className="w-8 h-8 bg-amber-500 text-slate-900 rounded-lg flex items-center justify-center text-lg font-black shadow hover:scale-105 active:scale-95 transition-all"/g, 'className="w-8 h-8 text-slate-400 hover:text-slate-900 flex items-center justify-center text-xl transition-colors"');
content = content.replace(/className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2\.5 px-4 text-sm font-medium focus:border-amber-500 outline-none"/g, 'className="w-full bg-transparent border-b border-slate-200 py-2 text-sm font-medium focus:border-slate-900 outline-none placeholder:text-slate-400 transition-colors"');

// List Items
const oldItem = 'className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 border ${selectedGuest?.phone === guest.phone ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-transparent border-transparent hover:bg-slate-50 text-slate-600"}`}';
const newItem = 'className={`w-full py-4 px-8 text-left transition-colors flex items-center gap-4 ${selectedGuest?.phone === guest.phone ? "border-l-2 border-slate-900 bg-slate-50 text-slate-900" : "border-l-2 border-transparent hover:bg-slate-50 text-slate-500"}`}';
content = content.replace(new RegExp(oldItem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newItem);

const oldAvatar = 'className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${selectedGuest?.phone === guest.phone ? "bg-amber-500 text-slate-900" : "bg-slate-100 text-slate-400"}`}';
const newAvatar = 'className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${selectedGuest?.phone === guest.phone ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}';
content = content.replace(new RegExp(oldAvatar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newAvatar);

content = content.replace(/<div className="text-sm font-bold truncate">/g, '<div className="text-sm font-medium truncate">');
content = content.replace(/<div className="text-xs font-bold tracking-widest opacity-50">/g, '<div className="text-xs tracking-wider opacity-70">');

// 2. Right Panel Header & Tabs
content = content.replace(/className="sticky top-0 z-30 bg-white\/90 backdrop-blur-xl border-b border-slate-100 p-5 flex items-center justify-between gap-4"/g, 'className="sticky top-0 z-30 bg-white border-b border-slate-200 px-12 pt-12 pb-0 flex flex-col gap-8"');
// We need to fix the header structure which is currently flex row.
// Let's replace the whole header block via regex.
const oldHeader = `<div className="flex items-center gap-6">
                 <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap min-w-fit">{selectedGuest.name}</h2>
                 <nav className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
{[{ id: 'appointments', label: '預約', icon: '📅' }, { id: 'lamps', label: '點燈', icon: '🏮' }, { id: 'media', label: '媒體', icon: '🎬' }, { id: 'history', label: '紀錄', icon: '📜' }, { id: 'merit', label: '功德', icon: '✨' }, { id: 'account', label: '帳號', icon: '👤' }].map((tab) => (<button key={tab.id} onClick={() => setGuestSubTab(tab.id as any)} className={\`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all \${guestSubTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}\`}>{tab.label}</button>))}</nav></div>
              <button onClick={() => setShowAddModal(true)} className="px-5 py-2 bg-white text-slate-900 text-xs font-bold rounded-lg border border-slate-200 shadow-sm transition-all hover:bg-slate-50">修改資料</button>`;
const newHeader = `<div className="flex items-center justify-between w-full">
                 <h2 className="text-3xl font-medium text-slate-900">{selectedGuest.name}</h2>
                 <button onClick={() => setShowAddModal(true)} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">編輯資料</button>
              </div>
              <nav className="flex gap-8 overflow-x-auto scrollbar-hide w-full">
{[{ id: 'appointments', label: '預約' }, { id: 'lamps', label: '點燈' }, { id: 'media', label: '媒體' }, { id: 'history', label: '紀錄' }, { id: 'merit', label: '功德' }, { id: 'account', label: '帳號' }].map((tab) => (<button key={tab.id} onClick={() => setGuestSubTab(tab.id as any)} className={\`pb-4 text-sm font-medium transition-colors border-b-2 \${guestSubTab === tab.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}\`}>{tab.label}</button>))}</nav>`;
content = content.replace(oldHeader, newHeader);

// 3. Quick Info Grid
content = content.replace(/<div className="p-6 space-y-6">/g, '<div className="p-12 space-y-12 max-w-5xl">');
const oldInfo = `<div className="flex flex-wrap items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-4 border-r border-slate-100 pr-6"><div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Birthday / 生辰案卷</p><div className="flex items-center gap-4"><span className="text-sm font-semibold text-blue-600">{selectedGuest.birthday || 'N/A'}</span><span className="text-xs font-medium text-amber-600">{selectedGuest.lunarBirthday || 'N/A'}</span></div></div></div>
                  <div className="flex-1 min-w-[300px] border-r border-slate-100 pr-6"><div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address / 通訊地址</p><p className="text-sm font-medium text-slate-800 truncate">{selectedGuest.address || '尚未填寫'}</p></div></div>
                  <div className="flex items-center gap-4"><div className="space-y-2"><p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Contact / 聯絡電話</p><p className="text-base font-semibold text-slate-900">{selectedGuest.phone}</p></div></div>
               </div>`;
const newInfo = `<div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-8 border-b border-slate-100">
                  <div className="space-y-2"><p className="text-xs font-medium text-slate-400">聯絡電話</p><p className="text-base text-slate-900">{selectedGuest.phone}</p></div>
                  <div className="space-y-2"><p className="text-xs font-medium text-slate-400">生辰案卷</p><div className="flex items-center gap-3"><span className="text-base text-slate-900">{selectedGuest.birthday || '未提供'}</span><span className="text-sm text-slate-500">{selectedGuest.lunarBirthday || ''}</span></div></div>
                  <div className="space-y-2"><p className="text-xs font-medium text-slate-400">通訊地址</p><p className="text-base text-slate-900">{selectedGuest.address || '未提供'}</p></div>
               </div>`;
content = content.replace(oldInfo, newInfo);

// 4. Appointments Timeline
content = content.replace(/<h3 className="text-lg font-bold text-slate-900">祈福點燈現況 \(同步自管理中心\)<\/h3>/g, '<h3 className="text-xl font-medium text-slate-900">祈福點燈現況</h3>');
content = content.replace(/<div className="absolute -left-\[30px\] top-4 w-6 h-6 rounded-full flex items-center justify-center text-\[10px\] z-10 shadow border-2 border-white/g, '<div className="absolute -left-[21px] top-6 w-2.5 h-2.5 rounded-full flex items-center justify-center z-10 border-2 border-white');
content = content.replace(/<div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">/g, '<div className="py-6 border-b border-slate-100 flex items-center justify-between group bg-white">');
content = content.replace(/<span className="text-\[10px\] font-bold text-indigo-600 bg-indigo-50 px-2\.5 py-1 rounded-md mb-2 inline-block">/g, '<span className="text-xs font-medium text-slate-400 mb-1 inline-block">');
content = content.replace(/<h4 className="text-base font-bold text-slate-900">/g, '<h4 className="text-base font-medium text-slate-900">');
content = content.replace(/<p className="text-xs font-bold text-slate-400 mt-2">/g, '<p className="text-sm text-slate-500 mt-1">');

// Fix the flex structure of the appointment row
const oldAppRow = `<div className="flex justify-between items-center">`;
const newAppRow = `<div className="flex justify-between items-center w-full">`;
content = content.replace(new RegExp(oldAppRow.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newAppRow);

// Appointment buttons
content = content.replace(/className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 transition-all shadow"/g, 'className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"');
content = content.replace(/className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-200"/g, 'className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"');
content = content.replace(/className="px-4 py-2 bg-amber-500 text-slate-900 hover:bg-emerald-600 hover:text-white rounded-md text-\[10px\] font-bold transition-all shadow active:scale-95"/g, 'className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors ml-4"');
content = content.replace(/<span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-\[10px\] font-black tracking-widest flex items-center gap-2">/g, '<span className="text-sm font-medium text-emerald-600 flex items-center gap-2 ml-4">');
content = content.replace(/className="border-l-2 border-slate-100 ml-6 pl-6 space-y-6 pb-6 mt-4"/g, 'className="border-l border-slate-200 ml-2 pl-8 space-y-0 pb-12 mt-2"');

// 5. Lamps Table
content = content.replace(/<div className="grid grid-cols-1 lg:grid-cols-2 gap-10">/g, '<div className="flex flex-col">');
content = content.replace(/<div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden/g, '<div className="py-6 border-b border-slate-100 flex items-center justify-between relative');

// Wait, the lamp replacement needs to be careful because of dynamic styling
// For minimalism, we remove the bg-color from getUIStylesForCategory entirely.
// In page.tsx: `const styles = getUIStylesForCategory(lamp.categoryName);`
// We'll replace the lamp card wrapper directly:
const lampCardRegex = /<div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden \${styles\.border}">/g;
content = content.replace(lampCardRegex, '<div className="py-6 border-b border-slate-100 flex items-center justify-between w-full">');
content = content.replace(/<div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10 \${styles\.fill} blur-2xl"><\/div>/g, '');
content = content.replace(/<div className="text-3xl mb-4">\${lamp\.categoryName \=== '太歲燈' \? '🐅' : lamp\.categoryName \=== '光明燈' \? '🏮' : lamp\.categoryName \=== '財神燈' \? '💰' : '✨'}<\/div>/g, '');

content = content.replace(/<span className="px-2\.5 py-1 rounded-md text-\[10px\] font-bold uppercase tracking-widest \${styles\.bg} \${styles\.text}">/g, '<span className="text-sm font-medium text-slate-500 flex items-center gap-2">');

content = content.replace(/<h4 className="text-2xl font-black text-slate-900 mt-4">/g, '<h4 className="text-base font-medium text-slate-900">');
content = content.replace(/<div className="text-xs font-medium text-slate-400 mt-4 space-y-1">/g, '<div className="text-sm text-slate-500 space-y-1 mt-1">');
content = content.replace(/<div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100\/50">/g, '<div className="flex flex-col items-end gap-1">');
content = content.replace(/<div className="text-xs font-bold text-slate-400">/g, '<div className="text-sm text-slate-500">');
content = content.replace(/<span className="text-red-500 font-black">/g, '<span className="text-red-600 font-medium">');
content = content.replace(/<span className="text-emerald-500 font-black">/g, '<span className="text-emerald-600 font-medium">');

// 6. Media & Modals
content = content.replace(/<div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg">/g, '<div className="flex justify-between items-center pb-6 border-b border-slate-200">');
content = content.replace(/<h3 className="text-xl font-bold">/g, '<h3 className="text-xl font-medium text-slate-900">');
content = content.replace(/<button onClick={\(\) => triggerFileBrowser\('photo'\)} className="bg-white\/10 hover:bg-white\/20 border border-white\/10 px-4 py-2 rounded-lg text-xs font-bold">/g, '<button onClick={() => triggerFileBrowser(\'photo\')} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">');
content = content.replace(/<button onClick={\(\) => triggerFileBrowser\('video'\)} className="bg-white\/10 hover:bg-white\/20 border border-white\/10 px-4 py-2 rounded-lg text-xs font-bold">/g, '<button onClick={() => triggerFileBrowser(\'video\')} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">');
content = content.replace(/<button onClick={\(\) => triggerFileBrowser\('file'\)} className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold shadow">/g, '<button onClick={() => triggerFileBrowser(\'file\')} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">');
content = content.replace(/<div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-md text-\[10px\] font-bold uppercase tracking-wider">/g, '<div className="text-xs font-medium text-slate-400 uppercase tracking-widest">');

fs.writeFileSync('src/app/[templeId]/admin/customers/page.tsx', content, 'utf8');
console.log('Zen Minimalist CRM layout applied!');
