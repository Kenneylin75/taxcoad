const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 讀取環境變數中的資料庫 URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ 錯誤: 未配置 DATABASE_URL 環境變數，請確認是否已載入 .env 檔案。');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=') ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('🚀 開始執行 PostgreSQL 實體資料庫自動遷移與建表作業...');
  const client = await pool.connect();

  try {
    // 1. 載入 schema.sql 檔案
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`找不到 schema.sql 檔案，路徑為: ${schemaPath}`);
    }

    console.log('📖 讀取 schema.sql 結構...');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // 2. 執行 SQL 遷移
    console.log('⚡ 正在向實體資料庫寫入表格與 Row-Level Security 政策...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ 資料表與安全 RLS Policy 建立成功！');

    // 3. 注入初始預設資料 (Seeds)
    console.log('🌱 正在注入系統初始預設容量方案與超級管理員錢包...');
    await client.query('BEGIN');
    
    // 3.1 注入初始儲存方案
    await client.query(`
      INSERT INTO storage_plans (size_gb, price_monthly, price_yearly) 
      VALUES 
        (50, 300, 2880),
        (200, 900, 8640),
        (1024, 3000, 28800)
      ON CONFLICT (size_gb) DO NOTHING
    `);

    // 3.2 注入超管錢包
    await client.query(`
      INSERT INTO wallets (role, name, balance) 
      VALUES ('SuperAdmin', '超級管理員', 0)
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ 初始數據 Seeds 注入成功！');
    console.log('🎉 資料庫自動遷移任務順利完成！系統隨時可以啟動運行。');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ 資料庫遷移失敗！已執行 ROLLBACK。');
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
