require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixBills() {
  console.log("Starting to fix bills for admin201 and admin202...");
  const temples = ['admin201', 'admin202'];
  
  for (const templeId of temples) {
    try {
      const res = await pool.query('SELECT * FROM temple_bills WHERE temple_id = $1', [templeId]);
      if (res.rows.length === 0) {
        console.log(`No bills found for ${templeId}. Generating...`);
        
        // 取得宮廟的創立者 (判斷收款方)
        const distRes = await pool.query('SELECT plan_id, creator_sales_id FROM distributors WHERE id = $1', [templeId]);
        if (distRes.rows.length > 0) {
           let payeeRole = 'Super Admin';
           let payeeId = 'admin1';
           const creatorSalesId = distRes.rows[0].creator_sales_id;
           
           if (creatorSalesId) {
               // 檢查 creator_sales_id 是否為 Distributor
               const distCheck = await pool.query("SELECT id FROM distributors WHERE id = $1 AND role = 'Distributor'", [creatorSalesId]);
               if (distCheck.rows.length > 0) {
                   payeeRole = 'Distributor';
                   payeeId = creatorSalesId;
               }
           }
           
           const dueDate = new Date().toISOString().split('T')[0];
           const timestamp = Date.now();
           
           const billId1 = `BILL-SETUP-${timestamp}-${Math.floor(Math.random()*1000)}`;
           await pool.query(
               "INSERT INTO temple_bills (id, temple_id, item_name, amount, due_date, status, payee_role, payee_id) VALUES ($1, $2, $3, $4, $5, 'Unpaid', $6, $7)",
               [billId1, templeId, 'SetupFee', 12000, dueDate, payeeRole, payeeId] // 假設開辦費12000
           );
           
           const billId2 = `BILL-RENT-${timestamp}-${Math.floor(Math.random()*1000)}`;
           await pool.query(
               "INSERT INTO temple_bills (id, temple_id, item_name, amount, due_date, status, payee_role, payee_id) VALUES ($1, $2, $3, $4, $5, 'Unpaid', $6, $7)",
               [billId2, templeId, 'YearlyFee', 36000, dueDate, payeeRole, payeeId] // 假設年費 3600*10? 還是以專案為主，這裡先帶固定數字，可再手動調
           );
           console.log(`✅ Success generating bills for ${templeId} (Payee: ${payeeRole} / ${payeeId}).`);
        } else {
           console.log(`⚠️ Temple ${templeId} not found in distributors table.`);
        }
      } else {
        console.log(`ℹ️ Temple ${templeId} already has ${res.rows.length} bills.`);
      }
    } catch (e) {
      console.error(`❌ Error processing ${templeId}:`, e.message);
    }
  }
  
  await pool.end();
  console.log("Finished.");
}

fixBills().catch(console.error);
