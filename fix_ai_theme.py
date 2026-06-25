import re

with open('src/app/super-admin/SuperAdminClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace container
content = content.replace('bg-slate-900 rounded-[2rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group', 'bg-white rounded-[2rem] p-8 lg:p-12 shadow-sm border border-slate-100 relative overflow-hidden group')

# Replace texts in the header
content = content.replace('text-2xl font-black italic tracking-tight text-white mb-1', 'text-2xl font-black italic tracking-tight text-slate-900 mb-1')

# Replace save button to look good on white background
content = content.replace('bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]', 'bg-indigo-600 hover:bg-indigo-700 shadow-md')

# Replace chat engine and OCR engine cards
content = content.replace('bg-white/10 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md space-y-6', 'bg-slate-50 border border-slate-100 p-8 rounded-[2rem] space-y-6')
content = content.replace('text-white font-black italic', 'text-slate-900 font-black italic')

# Replace text-slate-300 to text-slate-800 for inputs
content = content.replace('text-slate-300 outline-none focus:border-indigo-500', 'text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm')
content = content.replace('text-slate-300 outline-none focus:border-emerald-500', 'text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm')

# Replace inputs bg and border
content = content.replace('bg-slate-950/50 border border-white/5', 'bg-white border border-slate-200')

# Replace fallback models container
content = content.replace('bg-slate-950/30 rounded-[2rem] p-8 border border-white/5 space-y-6', 'bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6')

# Replace fallback model rows
content = content.replace('bg-white/5 p-4 rounded-2xl border border-white/5', 'bg-white p-4 rounded-2xl border border-slate-200 shadow-sm')

# Replace fallback inputs
content = content.replace('bg-transparent border-b border-slate-700 px-2 py-2 text-sm font-bold text-slate-300', 'bg-transparent border-b border-slate-200 px-2 py-2 text-sm font-bold text-slate-800')

# Replace fallback checkbox bg
content = content.replace('w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full', 'w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full shadow-inner')

# Write back
with open('src/app/super-admin/SuperAdminClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
