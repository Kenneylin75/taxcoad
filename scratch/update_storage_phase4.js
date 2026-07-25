const fs = require('fs');
const path = require('path');

const whitelistPath = path.join(__dirname, '../src/lib/jsonStore.ts');
let whitelistContent = fs.readFileSync(whitelistPath, 'utf8');

const newEntities = [
  "services","print_templates","forms","queue_events","queue_tickets",
  "temple_payment_configs","lamp_categories","lamp_records",
  "service_settings_mock","guest_files","event_registrations",
  "activities","deep_records","events","distributors","dist_sales",
  "sales_visits","audit_logs","tools","commissions","admin_logs",
  "sync_queue","temple_storages","ai_plans","ai_api_models","temple_ai_usage",
  "wallets","notifications","password_resets","price_plans",
  "temple_applications","temple_notifications","super_sales_overrides",
  "config", "distributor_applications"
];

// Add to whitelist in jsonStore.ts
// Wait, ALLOWED_COLLECTIONS is already defined. Let's just do a replace for the whole array.
const newArrayString = 'const ALLOWED_COLLECTIONS = [\n' + 
  "  'slots', 'appointments', 'personnel', 'guests', 'services',\n" +
  "  'temples', 'members', 'users', 'admins', 'distributors', 'donations', 'payments',\n" +
  "  'events', 'announcements', 'notifications', 'settings',\n" +
  "  'accounting', 'audit_logs', 'admin_logs', 'queue_events', 'queue_tickets', 'commissions', 'wallets',\n  " +
  newEntities.map(e => `'${e}'`).join(', ') + '\n];';

whitelistContent = whitelistContent.replace(/const ALLOWED_COLLECTIONS = \[[\s\S]*?\];/, newArrayString);
fs.writeFileSync(whitelistPath, whitelistContent, 'utf8');

const initPath = path.join(__dirname, '../src/lib/storageInit.ts');
let initContent = fs.readFileSync(initPath, 'utf8');

let phase4Lines = '\n  // Phase 4\n';
for (const e of newEntities) {
    if (e === 'config' || e === 'super_sales_overrides') {
        phase4Lines += `  await autoCreateMissingFile('${e}', {});\n`;
    } else {
        phase4Lines += `  await autoCreateMissingFile('${e}', []);\n`;
    }
}

initContent = initContent.replace(/console\.log\('\[StorageInit\] Phase 1, 2 & 3 JSON Storage verified and initialized \(safely\)\.'\);/, 
  `${phase4Lines}  console.log('[StorageInit] All Phases JSON Storage verified and initialized (safely).');`);

fs.writeFileSync(initPath, initContent, 'utf8');
console.log('Updated jsonStore.ts and storageInit.ts');
