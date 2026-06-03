const fs = require('fs');

// --- 1. Fix AnalyticsClient.tsx ---
let content = fs.readFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', 'utf8');

// Remove ' 世代'
content = content.replace(/<span className="text-slate-800">{item\.range} 世代<\/span>/g, '<span className="text-slate-800 font-bold">{item.range}</span>');

// Find '看板視角設定' block
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('看板視角設定'));
if (start !== -1) {
  // We want to delete the block containing '看板視角設定'.
  // It's probably wrapped in a div. Let's see the context first, but I can also just replace it directly if I know the structure.
  console.log("Lines to remove:", lines.slice(start - 2, start + 10).join('\\n'));
}

fs.writeFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', content, 'utf8');


// --- 2. Fix actions.ts keys ---
let actContent = fs.readFileSync('src/app/actions.ts', 'utf8');

actContent = actContent.replace(/'20-30': 0,/g, "'20-30歲': 0,");
actContent = actContent.replace(/'31-40': 0,/g, "'31-40歲': 0,");
actContent = actContent.replace(/'41-50': 0,/g, "'41-50歲': 0,");
actContent = actContent.replace(/'51-60': 0,/g, "'51-60歲': 0,");
actContent = actContent.replace(/'60\+': 0,/g, "'60歲以上': 0,");

actContent = actContent.replace(/ageGroups\['20-30'\]\+\+;/g, "ageGroups['20-30歲']++;");
actContent = actContent.replace(/ageGroups\['31-40'\]\+\+;/g, "ageGroups['31-40歲']++;");
actContent = actContent.replace(/ageGroups\['41-50'\]\+\+;/g, "ageGroups['41-50歲']++;");
actContent = actContent.replace(/ageGroups\['51-60'\]\+\+;/g, "ageGroups['51-60歲']++;");
actContent = actContent.replace(/ageGroups\['60\+'\]\+\+;/g, "ageGroups['60歲以上']++;");

fs.writeFileSync('src/app/actions.ts', actContent, 'utf8');
console.log('Fixed actions keys.');
