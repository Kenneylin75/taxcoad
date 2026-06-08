const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const appendText = `
export async function fetchAiPlans() {
  return [...db_ai_plans];
}

export async function saveAiPlan(plan: any) {
  const existing = db_ai_plans.find(p => p.id === plan.id);
  if (existing) {
    Object.assign(existing, plan);
  } else {
    db_ai_plans.push({ id: \`AI-\${Date.now()}\`, ...plan });
  }
  return { success: true };
}

export async function deleteAiPlan(id: string) {
  const index = db_ai_plans.findIndex(p => p.id === id);
  if (index > -1) {
    db_ai_plans.splice(index, 1);
  }
  return { success: true };
}
`;

content = content + appendText;
fs.writeFileSync('src/app/actions.ts', content);
