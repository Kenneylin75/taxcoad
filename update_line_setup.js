const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/line-setup/page.tsx', 'utf8');

// 1. Update imports
content = content.replace(
  /fetchServiceDefinitions,/,
  `fetchServiceDefinitions,\n  fetchLampCategories,\n  fetchEvents,\n  fetchQueueEvents,`
);

// 2. Update service state type and loading logic
content = content.replace(
  /const \[services, setServices\] = useState<ServiceDefinition\[\]>\(\[\]\);/,
  `const [services, setServices] = useState<any[]>([]);`
);

content = content.replace(
  /Promise\.all\(\[fetchServiceSettings\(\), fetchServiceDefinitions\(\)\]\)\.then\(\(\[setts, servs\]\) => \{/,
  `Promise.all([fetchServiceSettings(), fetchServiceDefinitions(), fetchLampCategories(), fetchEvents(), fetchQueueEvents()]).then(([setts, servs, lamps, evts, queues]) => {
      const allServices = [
        ...servs.map((s: any) => ({ ...s, group: '預約服務' })),
        ...lamps.map((l: any) => ({ ...l, group: '點燈服務' })),
        ...evts.map((e: any) => ({ ...e, group: '法會活動' })),
        ...queues.map((q: any) => ({ ...q, group: '現場排隊' }))
      ];
      setServices(allServices);
`
);

content = content.replace(
  /const newConfigs = \[\.\.\.\(setts\.pushConfigs \|\| \[\]\)\];\n\s*let changed = false;\n\s*servs\.forEach\(s => \{/,
  `const newConfigs = [...(setts.pushConfigs || [])];\n        let changed = false;\n        allServices.forEach(s => {`
);

// 3. Update the UI to show groups
content = content.replace(
  /<h4 className="text-xl font-black text-slate-800 italic">\{service\.name\}<\/h4>/g,
  `<div className="flex items-center gap-3"><span className="px-2 py-1 bg-indigo-50 text-indigo-500 rounded text-[10px] font-black uppercase tracking-widest">{service.group}</span><h4 className="text-xl font-black text-slate-800 italic">{service.name}</h4></div>`
);

fs.writeFileSync('src/app/[templeId]/admin/line-setup/page.tsx', content, 'utf8');
console.log('Updated line-setup page');
