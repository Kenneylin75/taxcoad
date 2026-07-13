import os

path = 'src/app/actions.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """  const myWithdrawals = db_withdrawals.filter(w => w.salesName === salesName);
  const pendingRequests = myWithdrawals.filter(w => w.status === 'Pending' || w.status === '審核中');
  const calculatedTotalWithdrawn = myWithdrawals.filter(w => w.status === 'Verified' || w.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0);"""

replacement = """  let myWithdrawals = db_withdrawals.filter(w => w.salesName === salesName);
  try {
    const { dbQuery } = await import('@/db/db');
    const { rows } = await dbQuery("SELECT * FROM bonus_requests WHERE sales_id = $1 ORDER BY timestamp DESC", [salesId], () => null) as any;
    const myBonusRequests = (rows || []).map((r: any) => ({
      id: r.id,
      salesName: r.sales_name,
      amount: r.amount,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      status: r.status,
      receiptUrl: r.receipt_url,
      method: r.method
    }));
    myWithdrawals = [...myWithdrawals, ...myBonusRequests];
  } catch (e) { }
  
  const pendingRequests = myWithdrawals.filter(w => w.status === 'Pending' || w.status === '審核中');
  const calculatedTotalWithdrawn = myWithdrawals.filter(w => w.status === 'Verified' || w.status === 'Approved' || w.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);"""

if target in content:
    content = content.replace(target, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("actions.ts updated successfully!")
else:
    print("Target not found in actions.ts!")
