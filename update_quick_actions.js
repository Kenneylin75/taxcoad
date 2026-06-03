const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', 'utf8');

// 1. Add imports
const importTarget = `import { upgradeStorage`;
const newImport = `import { useParams, useRouter } from 'next/navigation';\nimport { upgradeStorage`;
if (!content.includes('next/navigation')) {
  content = content.replace(importTarget, newImport);
}

// 2. Add hooks to component
const componentStart = `export default function DashboardContainer({`;
const hookInjectionPoint = `const [viewMode] = useState<'analytics'>('analytics');`;
const newHooks = `const [viewMode] = useState<'analytics'>('analytics');
  const params = useParams();
  const router = useRouter();
  const templeId = params?.templeId as string;
  const basePath = templeId ? \`/\${templeId}/admin\` : '/admin';`;
if (!content.includes('const router = useRouter();')) {
  content = content.replace(hookInjectionPoint, newHooks);
}

// 3. Update the Quick Action buttons
const oldQuickActions = `{[
                 { icon: '📝', label: '新增預約', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200' },
                 { icon: '📢', label: '現場叫號', color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200' },
                 { icon: '🏮', label: '點燈樞紐', color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 hover:border-amber-200' },
                 { icon: '💬', label: '系統廣播', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200' }
               ].map((btn, i) => (
                 <button key={i} className={\`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 active:scale-95 \${btn.color}\`}>`;

const newQuickActions = `{[
                 { icon: '📝', label: '新增預約', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200', href: \`\${basePath}/calendar\` },
                 { icon: '📢', label: '現場叫號', color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200', href: \`\${basePath}/queue\` },
                 { icon: '🏮', label: '點燈樞紐', color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 hover:border-amber-200', href: \`\${basePath}/lamps\` },
                 { icon: '💬', label: '系統廣播', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200', href: \`\${basePath}/notifications\` }
               ].map((btn, i) => (
                 <button key={i} onClick={() => router.push(btn.href)} className={\`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 active:scale-95 \${btn.color}\`}>`;

content = content.replace(oldQuickActions, newQuickActions);

fs.writeFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', content, 'utf8');
console.log('Successfully updated Quick Action buttons.');
