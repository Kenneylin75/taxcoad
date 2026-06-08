const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

content = content.replace(
  'fetchStoragePlans, fetchAiPlans, saveAiPlan, deleteAiPlan,',
  'fetchStoragePlans, fetchAiPlans, saveAiPlan, deleteAiPlan, fetchAiApiModels, saveAiApiModels, fetchAllTempleAiUsage, grantTempleAiVip,'
);

content = content.replace(
  'const [aiPlans, setAiPlans] = useState<any[]>([]);',
  `const [aiPlans, setAiPlans] = useState<any[]>([]);
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [allTempleAiUsage, setAllTempleAiUsage] = useState<any[]>([]);`
);

content = content.replace(
  'fetchAiPlans().then(setAiPlans);',
  `fetchAiPlans().then(setAiPlans);
    fetchAiApiModels().then(setAiModels);
    fetchAllTempleAiUsage().then(setAllTempleAiUsage);`
);

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content);
console.log('Added AI states to SuperAdminClient.tsx');
