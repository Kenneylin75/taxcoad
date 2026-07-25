import 'server-only';
import fs from 'fs/promises';
import path from 'path';

// Whitelisted collections to prevent path traversal
const ALLOWED_COLLECTIONS = [
  'slots', 'appointments', 'personnel', 'guests', 'services',
  'temples', 'members', 'users', 'admins', 'distributors', 'donations', 'payments',
  'events', 'announcements', 'notifications', 'settings',
  'accounting', 'audit_logs', 'admin_logs', 'queue_events', 'queue_tickets', 'commissions', 'wallets',
  'services', 'print_templates', 'forms', 'queue_events', 'queue_tickets', 'temple_payment_configs', 'lamp_categories', 'lamp_records', 'service_settings_mock', 'guest_files', 'event_registrations', 'activities', 'deep_records', 'events', 'distributors', 'dist_sales', 'sales_visits', 'audit_logs', 'tools', 'commissions', 'admin_logs', 'sync_queue', 'temple_storages', 'ai_plans', 'ai_api_models', 'temple_ai_usage', 'wallets', 'notifications', 'password_resets', 'price_plans', 'temple_applications', 'temple_notifications', 'super_sales_overrides', 'config', 'distributor_applications', 'finance_records', 'temple_bills', 'withdrawals', 'bonuses', 'storage_plans', 'saas_orders'
];

const STORAGE_ROOT = path.join(process.cwd(), 'storage');
const DATA_DIR = path.join(STORAGE_ROOT, 'data');
const BACKUP_DIR = path.join(STORAGE_ROOT, 'backups');
const LOCK_DIR = path.join(STORAGE_ROOT, 'locks');

// Ensure base directories exist
const initDirs = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  await fs.mkdir(LOCK_DIR, { recursive: true });
};
initDirs().catch(console.error);

/**
 * 1. File Lock (Atomic using mkdir)
 * Returns a function to unlock.
 */
export async function acquireLock(collection: string, timeoutMs: number = 5000): Promise<() => Promise<void>> {
  const lockPath = path.join(LOCK_DIR, `${collection}.lock`);
  const start = Date.now();

  while (true) {
    try {
      await fs.mkdir(lockPath);
      break; // Lock acquired
    } catch (err: any) {
      if (err.code === 'EEXIST' || err.code === 'EPERM') {
        // Check for stale lock (timeout)
        try {
          const stat = await fs.stat(lockPath);
          if (Date.now() - stat.mtimeMs > timeoutMs) {
            // Force remove stale lock
            await fs.rmdir(lockPath).catch(() => {});
            continue;
          }
        } catch (e) {
          // Ignore error, retry
        }

        if (Date.now() - start > timeoutMs) {
          throw new Error(`Timeout acquiring lock for ${collection}`);
        }
        
        // Wait before retrying
        await new Promise(r => setTimeout(r, 50));
      } else {
        throw err;
      }
    }
  }

  return async () => {
    try {
      await fs.rmdir(lockPath);
    } catch (e) {} // ignore errors on unlock
  };
}

function getFilePath(collection: string) {
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    throw new Error(`Invalid collection: ${collection}`);
  }
  return path.join(DATA_DIR, `${collection}.json`);
}

/**
 * Basic read JSON safely
 */
export async function readJson<T = any[]>(collection: string): Promise<T> {
  const filePath = getFilePath(collection);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return [] as any as T; // Return empty array if file doesn't exist yet
    }
    throw err;
  }
}

/**
 * Atomic write: Lock -> Backup -> Temp Write -> Validate -> Rename -> Unlock
 */
export async function atomicWrite(collection: string, modifierFn: (data: any[]) => any[] | Promise<any[]>): Promise<void> {
  const unlock = await acquireLock(collection);
  try {
    const filePath = getFilePath(collection);
    
    // 1. Read current data
    let currentData: any[] = [];
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      currentData = JSON.parse(raw);
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
    }

    // 2. Modify data
    const newData = await modifierFn(currentData);
    const jsonString = JSON.stringify(newData, null, 2);

    // 3. Backup (if existing file)
    try {
      await fs.copyFile(filePath, path.join(BACKUP_DIR, `${collection}_${Date.now()}.json.bak`));
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
    }

    // 4. Write Temp file
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, jsonString, 'utf8');

    // 5. Validate Temp file
    try {
      const verify = await fs.readFile(tempPath, 'utf8');
      JSON.parse(verify);
    } catch (e) {
      await fs.unlink(tempPath).catch(() => {});
      throw new Error(`JSON Validation failed on write for ${collection}`);
    }

    // 6. Rename Temp to Target (with retries for Windows EPERM)
    for (let i = 0; i < 5; i++) {
      try {
        await fs.rename(tempPath, filePath);
        break;
      } catch (err: any) {
        if (err.code === 'EPERM' && i < 4) {
          await new Promise(r => setTimeout(r, 100)); // wait 100ms
        } else {
          throw err;
        }
      }
    }
  } finally {
    // 7. Guaranteed Unlock
    await unlock();
  }
}

export async function createRecord(collection: string, record: any): Promise<any> {
  await atomicWrite(collection, (data) => {
    // Basic array validation
    if (!Array.isArray(data)) data = [];
    data.push(record);
    return data;
  });
  return record;
}

export async function updateRecord(collection: string, id: string | number, updatedFields: any): Promise<void> {
  await atomicWrite(collection, (data) => {
    if (!Array.isArray(data)) return data;
    const idx = data.findIndex(item => String(item.id) === String(id));
    if (idx !== -1) {
      data[idx] = { ...data[idx], ...updatedFields };
    }
    return data;
  });
}

export async function deleteRecord(collection: string, id: string | number): Promise<void> {
  await atomicWrite(collection, (data) => {
    if (!Array.isArray(data)) return data;
    return data.filter(item => String(item.id) !== String(id));
  });
}

export async function findById(collection: string, id: string | number): Promise<any> {
  const data = await readJson(collection);
  if (!Array.isArray(data)) return null;
  return data.find(item => String(item.id) === String(id)) || null;
}

export async function find(collection: string): Promise<any[]> {
  const data = await readJson(collection);
  return Array.isArray(data) ? data : [];
}

export async function findWithFilter(collection: string, predicate: (item: any) => boolean): Promise<any[]> {
  const data = await find(collection);
  return data.filter(predicate);
}

export async function autoCreateMissingFile(collection: string, initialData: any): Promise<void> {
  const filePath = getFilePath(collection);
  try {
    await fs.access(filePath);
    // File exists, do not overwrite
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      // Create with lock
      const unlock = await acquireLock(collection);
      try {
        // Double check after acquiring lock
        try {
           await fs.access(filePath);
        } catch (innerE: any) {
           if (innerE.code === 'ENOENT') {
              const tempPath = `${filePath}.tmp`;
              await fs.writeFile(tempPath, JSON.stringify(initialData, null, 2), 'utf8');
              await fs.rename(tempPath, filePath);
           }
        }
      } finally {
        await unlock();
      }
    }
  }
}
