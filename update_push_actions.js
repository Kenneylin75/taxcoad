const fs = require('fs');

let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// 1. Add triggerLinePush function
const triggerLinePushCode = `
// ==========================================
// 🚀 LINE 推播觸發引擎 (Simulation)
// ==========================================
export async function triggerLinePush(templeId: string, serviceId: string, targetName: string, targetPhone: string, serviceTitle: string) {
  const currentSettings = gStore.db_service_settings || db_service_settings;
  const tSettings = currentSettings.find((s: any) => s.templeId === templeId);
  if (!tSettings || !tSettings.pushConfigs) return;

  const config = tSettings.pushConfigs.find((c: any) => c.serviceId === serviceId);
  if (!config) return;

  // Find 'Immediate' stages that are enabled
  const immediateStages = config.stages.filter((s: any) => s.enabled && s.timeType === 'Immediate');
  
  immediateStages.forEach((stage: any) => {
    const logMsg = \`[LINE 推播成功] 已發送【\${serviceTitle}】通知至信眾 \${targetName} (\${targetPhone}) | 內容: \${stage.content}\`;
    const newLog = {
      id: "log-" + Date.now() + Math.random(),
      action: "LINE_PUSH",
      details: logMsg,
      timestamp: new Date().toISOString(),
      performedBy: 'System (Auto)'
    };
    db_audit_logs.push(newLog);
    gStore.db_audit_logs = db_audit_logs;
  });
}
`;

content = content.replace(
  /export async function bookAppointment/,
  triggerLinePushCode + '\nexport async function bookAppointment'
);

// 2. Inject into bookAppointment
content = content.replace(
  /let activityContent = \`信眾 \$\{guestName\} 預約了 \$\{slot\.date\} \$\{slot\.time\} 的 \$\{slot\.description\}\`;/,
  `let activityContent = \`信眾 \${guestName} 預約了 \${slot.date} \${slot.time} 的 \${slot.description}\`;\n      // 觸發 LINE 推播\n      await triggerLinePush(templeId, slot.bound_service_id || slot.serviceId || '', guestName, phone, slot.description);`
);

// 3. Inject into createLampRecord
// Wait, createLampRecord gets the templeId inside.
content = content.replace(
  /db_audit_logs\.push\(logEntry\);\n  gStore\.db_audit_logs = db_audit_logs;\n\n  revalidatePath/,
  `db_audit_logs.push(logEntry);\n  gStore.db_audit_logs = db_audit_logs;\n\n  // 觸發 LINE 推播 (若立即付款成功才推播，或先推播報名成功)\n  await triggerLinePush(templeId, cat.id, guestName, phone, cat.name);\n\n  revalidatePath`
);

// 4. Inject into registerForEvent
content = content.replace(
  /gStore\.db_audit_logs = db_audit_logs;\n\n  revalidatePath\('\/'\);/,
  `gStore.db_audit_logs = db_audit_logs;\n\n  // 觸發 LINE 推播\n  await triggerLinePush(templeId, id, n, phone, evt.name);\n\n  revalidatePath('/');`
);

// 5. Inject into joinQueue
content = content.replace(
  /gStore\.db_audit_logs = db_audit_logs;\n\n  revalidatePath\('\/live-queue'\);/,
  `gStore.db_audit_logs = db_audit_logs;\n\n  // 觸發 LINE 推播\n  await triggerLinePush(templeId, eventId, guestName, phone, evt.name);\n\n  revalidatePath('/live-queue');`
);

// 6. Inject into confirmPayment (so temple admin approving it also triggers if needed, but let's just do creation for now).

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Updated actions.ts for LINE push simulation');
