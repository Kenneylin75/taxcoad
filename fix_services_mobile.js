const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

// Fix padding p-16 -> p-6 md:p-16
content = content.replace(/ p-16 /g, ' p-6 md:p-16 ');
content = content.replace(/"p-16 /g, '"p-6 md:p-16 ');

// Fix grid grid-cols-2 -> grid-cols-1 md:grid-cols-2
content = content.replace(/grid-cols-2/g, 'grid-cols-1 md:grid-cols-2');

// Fix grid grid-cols-3 -> grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
content = content.replace(/grid-cols-3/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3');

// Fix flex split in Form Editor (which is <div className="... flex"> then two child flex-1 divs)
const formEditorTarget = `<div className="w-full max-w-[1200px] bg-white h-screen shadow-[-40px_0_100px_rgba(0,0,0,0.1)] overflow-hidden animate-in slide-in-from-right duration-500 flex">`;
const newFormEditorTarget = `<div className="w-full max-w-[1200px] bg-white h-screen shadow-[-40px_0_100px_rgba(0,0,0,0.1)] overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col md:flex-row">`;
content = content.replace(formEditorTarget, newFormEditorTarget);

// Fix the right preview panel in Form Editor to not be hidden on mobile, but just scrollable
// Let's ensure the left panel doesn't overflow-y-auto over the right panel, flex flex-col will stack them.
// "w-full max-w-[400px] bg-slate-50 flex flex-col items-center p-8 overflow-y-auto relative"
// -> "w-full md:max-w-[400px] bg-slate-50 flex flex-col items-center p-8 overflow-y-auto relative"
content = content.replace(/w-full max-w-\[400px\]/g, 'w-full md:max-w-[400px]');
content = content.replace(/w-full max-w-\[600px\]/g, 'w-full md:max-w-[600px]');
content = content.replace(/w-full max-w-\[320px\]/g, 'w-full md:max-w-[320px]'); // iPhone preview container

// Check if there are other max-w-[...px] that could be restrictive
content = content.replace(/max-w-\[1200px\]/g, 'max-w-full md:max-w-[1200px]');

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('Applied mobile responsive fixes to services page.');
