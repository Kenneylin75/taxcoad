import os
import json

path = 'src/app/actions.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add ALTER TABLE
alter_target = "await dbQuery(`ALTER TABLE distributors ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);`);"
alter_replacement = """await dbQuery(`ALTER TABLE distributors ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);`);
    await dbQuery(`ALTER TABLE distributors ADD COLUMN IF NOT EXISTS b2b_payment_config JSONB;`);"""
content = content.replace(alter_target, alter_replacement)

# 2. Update fetchDistributorProfile
fetch_target = """      return { ...r, planId: r.plan_id, planName: r.plan_name, joinedAt: r.joined_at, creatorSalesId: r.creator_sales_id, contactName: r.contact_name, taxId: r.tax_id, bankInfo: { bankName: r.bank_name || '', accountName: r.name || '', accountNumber: r.bank_account || '', bankCode: r.bank_code || '' } };"""
fetch_replacement = """      let b2bPayment = undefined;
      try { if (r.b2b_payment_config) b2bPayment = typeof r.b2b_payment_config === 'string' ? JSON.parse(r.b2b_payment_config) : r.b2b_payment_config; } catch(e){}
      return { ...r, planId: r.plan_id, planName: r.plan_name, joinedAt: r.joined_at, creatorSalesId: r.creator_sales_id, contactName: r.contact_name, taxId: r.tax_id, bankInfo: { bankName: r.bank_name || '', accountName: r.name || '', accountNumber: r.bank_account || '', bankCode: r.bank_code || '' }, b2bPayment };"""
content = content.replace(fetch_target, fetch_replacement)

# 3. Update updateDistributorPaymentConfig
update_target = """export async function updateDistributorPaymentConfig(distId: string, paymentConfig: any) {
  const dist = db_distributors.find(d => d.id === distId);
  if (dist) {
    dist.b2bPayment = paymentConfig;"""
update_replacement = """export async function updateDistributorPaymentConfig(distId: string, paymentConfig: any) {
  try {
    const { dbQuery } = await import('@/db/db');
    await dbQuery('UPDATE distributors SET b2b_payment_config = $1 WHERE id = $2', [JSON.stringify(paymentConfig), distId]);
  } catch (e) {
    console.error('Failed to update b2b_payment_config in DB', e);
  }
  const dist = db_distributors.find(d => d.id === distId);
  if (dist) {
    dist.b2bPayment = paymentConfig;"""
content = content.replace(update_target, update_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("actions.ts updated successfully for b2b payment persistence!")
