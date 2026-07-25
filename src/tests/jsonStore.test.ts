import fs from 'fs/promises';
import path from 'path';
import assert from 'assert';
import { test, describe, before, after } from 'node:test';
import { createRecord, readJson, updateRecord, deleteRecord, findById, findWithFilter, autoCreateMissingFile, atomicWrite, acquireLock } from '../lib/jsonStore';

// We use an isolated test collection name not in the main ALLOWED_COLLECTIONS whitelist?
// Wait, jsonStore explicitly checks ALLOWED_COLLECTIONS. 
// For tests, we must use a whitelisted one that doesn't impact production. 
// "personnel" is Phase 1. Let's use a mock or create a backup.
// Actually, it's better to just test `atomicWrite` on 'slots' and clean up.

const TEST_COLLECTION = 'slots';
const TEST_FILE = path.join(process.cwd(), 'storage', 'data', `${TEST_COLLECTION}.json`);
let backupContent = '';

describe('JSON Storage Engine Tests', () => {
  before(async () => {
    try {
      backupContent = await fs.readFile(TEST_FILE, 'utf8');
    } catch (e) {}
    // Ensure clean state
    await fs.writeFile(TEST_FILE, '[]', 'utf8');
  });

  after(async () => {
    // Restore
    if (backupContent) {
      await fs.writeFile(TEST_FILE, backupContent, 'utf8');
    } else {
      await fs.unlink(TEST_FILE).catch(() => {});
    }
  });

  test('createRecord and readJson', async () => {
    const record = { id: 1, name: 'Test' };
    await createRecord(TEST_COLLECTION, record);
    const data = await readJson(TEST_COLLECTION);
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].name, 'Test');
  });

  test('updateRecord', async () => {
    await updateRecord(TEST_COLLECTION, 1, { name: 'Updated Test' });
    const item = await findById(TEST_COLLECTION, 1);
    assert.strictEqual(item.name, 'Updated Test');
  });

  test('deleteRecord', async () => {
    await deleteRecord(TEST_COLLECTION, 1);
    const data = await readJson(TEST_COLLECTION);
    assert.strictEqual(data.length, 0);
  });

  test('autoCreateMissingFile preserves non-empty data', async () => {
    await createRecord(TEST_COLLECTION, { id: 99, name: 'Persistent' });
    await autoCreateMissingFile(TEST_COLLECTION, [{ id: 100, name: 'Should Not Overwrite' }]);
    const item = await findById(TEST_COLLECTION, 99);
    assert.ok(item !== null);
    const item2 = await findById(TEST_COLLECTION, 100);
    assert.ok(item2 === null);
  });

  test('concurrent writes (Locking)', async () => {
    // Attempt 100 concurrent writes
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(createRecord(TEST_COLLECTION, { id: 1000 + i, name: `Concurrent ${i}` }));
    }
    await Promise.all(promises);
    const data = await readJson(TEST_COLLECTION);
    const concurrentItems = data.filter(d => d.id >= 1000 && d.id < 1050);
    assert.strictEqual(concurrentItems.length, 50, 'All 50 concurrent writes must succeed sequentially without data loss');
  });

  test('corrupted JSON recovery prevention', async () => {
    try {
      await atomicWrite(TEST_COLLECTION, () => {
         // Return something that circular references to break JSON.stringify
         const a: any = {};
         const b: any = {a};
         a.b = b;
         return [a];
      });
      assert.fail('Should have thrown on JSON.stringify');
    } catch (e: any) {
      assert.ok(e.message.includes('Converting circular structure to JSON') || e.message.includes('circular'));
    }
    
    // File should remain unchanged and accessible
    const data = await readJson(TEST_COLLECTION);
    assert.ok(Array.isArray(data));
  });

  test('Unicode and Traditional Chinese text', async () => {
    const text = '測試中文字串 🌟';
    await createRecord(TEST_COLLECTION, { id: 'zh-1', text });
    const item = await findById(TEST_COLLECTION, 'zh-1');
    assert.strictEqual(item.text, text);
  });
  
  test('Path traversal prevention', async () => {
    try {
      await readJson('../../../etc/passwd');
      assert.fail('Should have thrown invalid collection error');
    } catch (e: any) {
      assert.ok(e.message.includes('Invalid collection'));
    }
  });

});
