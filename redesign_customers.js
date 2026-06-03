const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/customers/page.tsx', 'utf8');

// 1. 版面框架重構 (Layout Structure)
content = content.replace(/className="flex h-\[calc\(100vh-100px\)\] bg-slate-50 -m-6 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-2xl"/g, 'className="flex h-[calc(100vh-80px)] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-xl"');
content = content.replace(/className="w-96 bg-white border-r-2 border-slate-200 flex flex-col shrink-0"/g, 'className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0"');

// 2. 左側列表元素壓縮 (Sidebar Items)
// search bar area
content = content.replace(/<div className="p-8 border-b-2 border-slate-100 space-y-6">/g, '<div className="p-5 border-b border-slate-100 space-y-4">');
content = content.replace(/className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl shadow-xl"/g, 'className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-sm shadow-md"');
content = content.replace(/<h2 className="text-xl font-black text-slate-800 tracking-tighter">/g, '<h2 className="text-base font-bold text-slate-800">');
content = content.replace(/className="w-12 h-12 bg-amber-500 text-slate-900 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all"/g, 'className="w-8 h-8 bg-amber-500 text-slate-900 rounded-lg flex items-center justify-center text-lg font-black shadow hover:scale-105 active:scale-95 transition-all"');
content = content.replace(/className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-base font-bold focus:border-amber-500 outline-none"/g, 'className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-medium focus:border-amber-500 outline-none"');

// Guest list items
content = content.replace(/className={\`w-full p-6 rounded-\[25px\] text-left transition-all flex items-center gap-5 border-2 \${selectedGuest\?.phone === guest\.phone \? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-\[1\.02\]' : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600'}\`}/g, 'className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 border ${selectedGuest?.phone === guest.phone ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-transparent border-transparent hover:bg-slate-50 text-slate-600"}`}');
content = content.replace(/className={\`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 \${selectedGuest\?.phone === guest\.phone \? 'bg-amber-500 text-slate-900' : 'bg-slate-100 text-slate-400'}\`}/g, 'className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${selectedGuest?.phone === guest.phone ? "bg-amber-500 text-slate-900" : "bg-slate-100 text-slate-400"}`}');
content = content.replace(/<div className="text-lg font-black truncate">/g, '<div className="text-sm font-bold truncate">');

// 3. 右側面板與頭部 (Main Panel & Header)
content = content.replace(/className="sticky top-0 z-30 bg-white\/90 backdrop-blur-xl border-b-2 border-slate-100 p-8 flex items-center justify-between gap-6"/g, 'className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100 p-5 flex items-center justify-between gap-4"');
content = content.replace(/<h2 className="text-2xl font-black text-slate-900 italic tracking-tighter whitespace-nowrap min-w-fit">/g, '<h2 className="text-lg font-bold text-slate-900 whitespace-nowrap min-w-fit">');
content = content.replace(/className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-hide"/g, 'className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto scrollbar-hide"');
content = content.replace(/className={\`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all \${guestSubTab === tab\.id \? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}\`}/g, 'className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${guestSubTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}');
content = content.replace(/className="px-10 py-3 bg-white text-slate-900 text-xs font-black uppercase tracking-widest rounded-2xl border-2 border-slate-100 shadow-sm transition-all"/g, 'className="px-5 py-2 bg-white text-slate-900 text-xs font-bold rounded-lg border border-slate-200 shadow-sm transition-all hover:bg-slate-50"');

// 4. 信眾資料網格 (Quick Info Grid)
content = content.replace(/<div className="p-10 space-y-10">/g, '<div className="p-6 space-y-6">');
content = content.replace(/<div className="flex flex-wrap items-center gap-10 bg-white p-10 rounded-\[50px\] shadow-sm border-2 border-slate-100">/g, '<div className="flex flex-wrap items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">');
content = content.replace(/className="flex items-center gap-6 border-r-2 border-slate-50 pr-10"/g, 'className="flex items-center gap-4 border-r border-slate-100 pr-6"');
content = content.replace(/className="flex-1 min-w-\[300px\] border-r-2 border-slate-50 pr-10"/g, 'className="flex-1 min-w-[300px] border-r border-slate-100 pr-6"');
content = content.replace(/className="flex items-center gap-8"/g, 'className="flex items-center gap-4"');

content = content.replace(/<p className="text-\[10px\] font-black text-slate-400 uppercase tracking-\[0.3em\]">/g, '<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">');
content = content.replace(/<span className="text-xl font-black text-blue-600">/g, '<span className="text-sm font-semibold text-blue-600">');
content = content.replace(/<span className="text-sm font-bold text-amber-600">/g, '<span className="text-xs font-medium text-amber-600">');
content = content.replace(/<p className="text-xl font-black text-slate-800 truncate">/g, '<p className="text-sm font-medium text-slate-800 truncate">');
content = content.replace(/<p className="text-\[10px\] font-black text-amber-600 uppercase tracking-\[0.3em\]">/g, '<p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">');
content = content.replace(/<p className="text-3xl font-black text-slate-900 tracking-tighter">/g, '<p className="text-base font-semibold text-slate-900">');

// 5. 子模組與細節 (Appointments & Lamps)
// Appointments Timeline
content = content.replace(/<div className="space-y-8 animate-in fade-in duration-700">/g, '<div className="space-y-6 animate-in fade-in duration-500">');
content = content.replace(/<h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">/g, '<h3 className="text-lg font-bold text-slate-900">');
content = content.replace(/<div className="absolute -left-\[54px\] top-6 w-10 h-10 rounded-2xl flex items-center justify-center text-lg z-10 shadow-xl border-4 border-white/g, '<div className="absolute -left-[30px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-[10px] z-10 shadow border-2 border-white');
content = content.replace(/<div className="bg-white border-2 border-slate-50 rounded-\[40px\] p-8 shadow-sm hover:shadow-2xl transition-all">/g, '<div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">');
content = content.replace(/<span className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-1\.5 rounded-full mb-3 inline-block">/g, '<span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 inline-block">');
content = content.replace(/<h4 className="text-2xl font-black text-slate-900">/g, '<h4 className="text-base font-bold text-slate-900">');
content = content.replace(/className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"/g, 'className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 transition-all shadow"');
content = content.replace(/className="bg-emerald-50 text-emerald-600 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border-2 border-emerald-100 shadow-sm"/g, 'className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-200"');
content = content.replace(/className="px-6 py-2 bg-amber-500 text-slate-900 hover:bg-emerald-600 hover:text-white rounded-xl text-\[10px\] font-black tracking-widest transition-all shadow-md active:scale-95"/g, 'className="px-4 py-2 bg-amber-500 text-slate-900 hover:bg-emerald-600 hover:text-white rounded-md text-[10px] font-bold transition-all shadow active:scale-95"');
content = content.replace(/className="border-l-4 border-slate-100 ml-12 pl-12 space-y-12 pb-12 mt-8"/g, 'className="border-l-2 border-slate-100 ml-6 pl-6 space-y-6 pb-6 mt-4"');

// Lamps
content = content.replace(/<div className="bg-white p-8 rounded-\[40px\] border-4 shadow-sm hover:shadow-xl transition-all relative overflow-hidden/g, '<div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden');
content = content.replace(/<div className="text-6xl mb-6">/g, '<div className="text-3xl mb-4">');
content = content.replace(/<span className="px-4 py-1\.5 rounded-2xl text-\[10px\] font-black uppercase tracking-widest/g, '<span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase');
content = content.replace(/<div className="text-xs font-black text-slate-400 mt-6 space-y-2">/g, '<div className="text-xs font-medium text-slate-400 mt-4 space-y-1">');

// Media
content = content.replace(/<div className="flex justify-between items-center bg-slate-900 text-white p-10 rounded-\[50px\] shadow-2xl">/g, '<div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg">');
content = content.replace(/<h3 className="text-3xl font-black italic">/g, '<h3 className="text-xl font-bold">');
content = content.replace(/<button onClick={\(\) => triggerFileBrowser\('photo'\)} className="bg-white\/10 hover:bg-white\/20 border-2 border-white\/10 px-6 py-4 rounded-2xl text-\[10px\] font-black uppercase tracking-widest">/g, '<button onClick={() => triggerFileBrowser(\'photo\')} className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold">');
content = content.replace(/<button onClick={\(\) => triggerFileBrowser\('video'\)} className="bg-white\/10 hover:bg-white\/20 border-2 border-white\/10 px-6 py-4 rounded-2xl text-\[10px\] font-black uppercase tracking-widest">/g, '<button onClick={() => triggerFileBrowser(\'video\')} className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold">');
content = content.replace(/<button onClick={\(\) => triggerFileBrowser\('file'\)} className="bg-amber-500 text-slate-950 px-6 py-4 rounded-2xl text-\[10px\] font-black uppercase tracking-widest shadow-xl">/g, '<button onClick={() => triggerFileBrowser(\'file\')} className="bg-amber-500 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold shadow">');
content = content.replace(/<div className="px-6 py-2 bg-slate-100 text-slate-400 rounded-full text-\[10px\] font-black uppercase tracking-widest">/g, '<div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-wider">');

// Add & Password Modals
content = content.replace(/rounded-\[55px\]/g, 'rounded-2xl');
content = content.replace(/p-12/g, 'p-6');
content = content.replace(/text-4xl/g, 'text-2xl');

fs.writeFileSync('src/app/[templeId]/admin/customers/page.tsx', content, 'utf8');
console.log('Successfully redesigned Customers UI layout.');
