import { Pool, PoolClient } from 'pg';
import prisma from '../lib/prisma';

export { prisma };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ [PostgreSQL] DATABASE_URL is not defined in environment variables. Database connection is required.");
}

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('⚠️ [PostgreSQL Pool] 閒置連線發生未預期錯誤:', err);
});

async function safeConnect(targetPool: Pool): Promise<PoolClient> {
  try {
    return await targetPool.connect();
  } catch (err: any) {
    console.error("❌ [PostgreSQL 連線失敗]:", err ? err.message : "未知錯誤");
    throw new Error("無法連接至資料庫，請檢查連線設定");
  }
}

export async function withTempleSession<T>(
  templeId: string | null,
  isSuperAdmin: boolean,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await safeConnect(pool);

  try {
    await client.query('BEGIN');

    if (templeId) {
      await client.query(`SELECT set_config('app.current_temple_id', $1, true)`, [templeId]);
    } else {
      await client.query(`SELECT set_config('app.current_temple_id', '', true)`);
    }

    if (isSuperAdmin) {
      await client.query(`SELECT set_config('app.is_super_admin', 'true', true)`);
    } else {
      await client.query(`SELECT set_config('app.is_super_admin', 'false', true)`);
    }

    const result = await callback(client);
    await client.query('COMMIT');
    return result;

  } catch (dbError: any) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error("❌ 回滾事務失敗:", rollbackErr);
    }
    console.error("❌ [PostgreSQL Session 錯誤]:", dbError.message);
    throw new Error(`資料庫操作失敗: ${dbError.message}`);
  } finally {
    client.release();
  }
}

export async function dbQuery<T>(
  sql: string,
  params: any[] = []
): Promise<T> {
  try {
    const res = await pool.query(sql, params);
    return res as unknown as T;
  } catch (err: any) {
    console.error("❌ [PostgreSQL Query 錯誤]:", err.message, "| SQL:", sql);
    throw new Error(`資料庫查詢失敗: ${err.message}`);
  }
}
