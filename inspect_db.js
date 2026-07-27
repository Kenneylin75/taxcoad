const { Client } = require('pg');

async function inspectDB() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully.");

    // 1. Get all tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log("\n=== Tables in 'public' schema ===");
    tables.forEach(t => console.log(`- ${t}`));

    // 2. Inspect target candidate tables
    const targetTables = [
      'Temple', 'User', 'dist_sales', 'TempleBill', 'Withdrawal',
      'temples', 'personnel', 'distributor_sales', 'temple_bills', 'withdrawals'
    ];

    for (const tName of targetTables) {
      if (tables.includes(tName)) {
        console.log(`\n=== Columns for table: "${tName}" ===`);
        const colsRes = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [tName]);

        colsRes.rows.forEach(c => {
          console.log(`  ${c.column_name} (${c.data_type})`);
        });
      } else {
        console.log(`\n=== Table "${tName}" DOES NOT EXIST ===`);
      }
    }
    
    console.log("\nInspection complete.");
  } catch (error) {
    console.error("Error connecting or querying the database:", error);
  } finally {
    await client.end();
  }
}

inspectDB();
