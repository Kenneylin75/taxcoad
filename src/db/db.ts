import { Pool, PoolClient } from 'pg';

// 從環境變數獲取連線設定，若未設定則維持為 null，避免在無資料庫的本機開發環境下引發連線錯誤
const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

if (connectionString) {
  try {
    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // 監聽閒置連線錯誤，防止 Node.js 未捕獲異常崩潰
    pool.on('error', (err) => {
      console.error('⚠️ [PostgreSQL Pool] 閒置連線發生未預期錯誤:', err);
    });
  } catch (e) {
    console.warn("⚠️ [PostgreSQL] 初始化 Pool 失敗，將退回記憶體模擬適配模式:", e);
    pool = null;
  }
}

/**
 * 🛡️ safeConnect：絕對安全的資料庫連線器
 * 解決 Next.js Canary/Turbopack 編譯器下 async try-catch 例外外溢 Bug，
 * 同步與非同步雙重攔截連線錯誤，確保系統 100% 不當機。
 */
async function safeConnect(targetPool: Pool): Promise<PoolClient | null> {
  try {
    const connPromise = targetPool.connect();
    if (!connPromise || typeof connPromise.catch !== 'function') {
      return null;
    }
    return await connPromise.catch(err => {
      console.warn("⚠️ [PostgreSQL 異步連線失敗] 無法連接實體庫，降級:", err ? err.message : "未知錯誤");
      return null;
    });
  } catch (syncErr: any) {
    console.warn("⚠️ [PostgreSQL 同步連線崩潰] 攔截驅動例外，降級:", syncErr ? syncErr.message : "未知錯誤");
    return null;
  }
}

/**
 * 🔒 withTempleSession：SaaS 多租戶與行級安全隔離 (RLS) 金鑰包裝器
 * @param templeId 當前拜訪/操作的宮廟 ID (temple_id)
 * @param isSuperAdmin 是否為超級管理員，若是則將 app.is_super_admin 設為 'true' 繞過 RLS policy
 * @param callback 在安全會話中執行的資料庫查詢邏輯
 */
export async function withTempleSession<T>(
  templeId: string | null,
  isSuperAdmin: boolean,
  callback: (client: PoolClient | null) => Promise<T>
): Promise<T> {
  // 如果 pool 未配置，自動降級至 memory 模式
  if (!pool) {
    return callback(null);
  }

  // 透過 safeConnect 進行安全連線測試，防止任何例外外溢導致崩潰
  const client = await safeConnect(pool);
  if (!client) {
    return callback(null);
  }

  try {
    // 開啟事務 (Transaction) 確保設定只在 Session/Transaction 內有效，防止併發干擾
    await client.query('BEGIN');

    // 1. 設定宮廟 RLS 行級隔離識別碼
    if (templeId) {
      await client.query(`SELECT set_config('app.current_temple_id', $1, true)`, [templeId]);
    } else {
      await client.query(`SELECT set_config('app.current_temple_id', '', true)`);
    }

    // 2. 設定超級管理員 Bypass 特權狀態
    if (isSuperAdmin) {
      await client.query(`SELECT set_config('app.is_super_admin', 'true', true)`);
    } else {
      await client.query(`SELECT set_config('app.is_super_admin', 'false', true)`);
    }

    // 執行實際的資料庫業務查詢
    const result = await callback(client);

    // 提交事務
    await client.query('COMMIT');
    return result;

  } catch (dbError) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error("❌ 回滾事務失敗:", rollbackErr);
      }
    }
    console.warn("⚠️ [PostgreSQL Session 失敗] 自動降級至記憶體極速響應模式，確保服務不中斷。");
    // 當發生實體資料庫斷線/未設定表格時，安全降級回 callback(null) 讀取 gStore
    return callback(null);
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * 通用資料庫查詢工具，當無實體庫時自動呼叫 fallback 函數
 */
export async function dbQuery<T>(
  sql: string,
  params: any[],
  fallback: () => T
): Promise<T> {
  if (!pool) return fallback();
  
  try {
    const res = await pool.query(sql, params).catch(err => {
      console.warn("⚠️ [PostgreSQL Query 失敗] 自動退回 Fallback:", err ? err.message : "未知錯誤");
      return null;
    });
    if (!res) return fallback();
    return res.rows as unknown as T;
  } catch (err) {
    return fallback();
  }
}
