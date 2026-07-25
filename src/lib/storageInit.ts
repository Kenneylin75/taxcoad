import 'server-only';
import { autoCreateMissingFile } from './jsonStore';

/**
 * Initializes the Phase 1 & 2 JSON storage fallback files.
 * This should be called lazily or at server startup to ensure 
 * files exist without overwriting existing data.
 */
export async function initializeStorage() {
  // Phase 1
  const initialPersonnel = [
    { id: '4', name: "測試宮廟管理員", role: "TempleAdmin", account: "admin02", password: "admin02", status: "Active", phone: "0900-000-002", templeId: "temple-2" },
    { id: '100', name: "宮廟管理員100", role: "TempleAdmin", account: "admin100", password: "admin100", status: "Active", phone: "0900-100-100", templeId: "temple-1" },
    { id: '999', name: "系統預設帳號", role: "TempleAdmin", account: "login", password: "login", status: "Active", phone: "0900-999-999", templeId: "temple-1" }
  ];

  await autoCreateMissingFile('personnel', initialPersonnel);
  await autoCreateMissingFile('slots', []);
  await autoCreateMissingFile('appointments', []);

  // Phase 2
  await autoCreateMissingFile('temples', []);
  await autoCreateMissingFile('guests', []);
  await autoCreateMissingFile('admins', []);
  
  // Phase 3
  await autoCreateMissingFile('finance_records', []);
  await autoCreateMissingFile('temple_bills', []);
  await autoCreateMissingFile('commissions', []);
  await autoCreateMissingFile('withdrawals', []);
  await autoCreateMissingFile('wallets', []);
  await autoCreateMissingFile('bonuses', []);
  
  
  // Phase 4
  await autoCreateMissingFile('services', []);
  await autoCreateMissingFile('print_templates', []);
  await autoCreateMissingFile('forms', []);
  await autoCreateMissingFile('queue_events', []);
  await autoCreateMissingFile('queue_tickets', []);
  await autoCreateMissingFile('temple_payment_configs', []);
  await autoCreateMissingFile('lamp_categories', []);
  await autoCreateMissingFile('lamp_records', []);
  await autoCreateMissingFile('service_settings_mock', []);
  await autoCreateMissingFile('guest_files', []);
  await autoCreateMissingFile('event_registrations', []);
  await autoCreateMissingFile('activities', []);
  await autoCreateMissingFile('deep_records', []);
  await autoCreateMissingFile('events', []);
  await autoCreateMissingFile('distributors', []);
  await autoCreateMissingFile('dist_sales', []);
  await autoCreateMissingFile('sales_visits', []);
  await autoCreateMissingFile('audit_logs', []);
  await autoCreateMissingFile('tools', []);
  await autoCreateMissingFile('commissions', []);
  await autoCreateMissingFile('admin_logs', []);
  await autoCreateMissingFile('sync_queue', []);
  await autoCreateMissingFile('temple_storages', []);
  await autoCreateMissingFile('ai_plans', []);
  await autoCreateMissingFile('ai_api_models', []);
  await autoCreateMissingFile('temple_ai_usage', []);
  await autoCreateMissingFile('wallets', []);
  await autoCreateMissingFile('notifications', []);
  await autoCreateMissingFile('password_resets', []);
  await autoCreateMissingFile('price_plans', []);
  await autoCreateMissingFile('temple_applications', []);
  await autoCreateMissingFile('temple_notifications', []);
  await autoCreateMissingFile('super_sales_overrides', {});
  await autoCreateMissingFile('config', {});
  await autoCreateMissingFile('distributor_applications', []);
  console.log('[StorageInit] All Phases JSON Storage verified and initialized (safely).');
}

// Automatically invoke on module load in Node environment
if (typeof process !== 'undefined' && process.release.name === 'node') {
  initializeStorage().catch(console.error);
}
