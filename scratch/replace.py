import re

filepath = 'src/app/actions.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

def process_sql(match):
    text = match.group(0)
    
    # 1. temples -> "Temple"
    text = re.sub(r'\btemples\b', '"Temple"', text)
    text = re.sub(r'\btemple_name\b', 'name', text)
    text = re.sub(r'\bdistributor_id\b', '"distributorId"', text)
    text = re.sub(r'\bsales_id\b', '"salesId"', text)
    text = re.sub(r'\bplan_id\b', '"planId"', text)
    
    # Remove setup_fee, monthly_rent, payment_cycle from INSERT
    text = re.sub(r',\s*setup_fee\s*,\s*monthly_rent\s*,\s*payment_cycle', '', text)
    text = re.sub(r',\s*\$6\s*,\s*\$7\s*,\s*\$8', '', text)
    text = re.sub(r',\s*\$7\s*,\s*\$8\s*,\s*\$9', '', text)
    
    # 2. personnel -> "User"
    text = re.sub(r'\bpersonnel\b', '"User"', text)
    # Be careful, temple_id -> "templeId" should only happen if it's querying "User" or "TempleBill"
    # But since these are raw SQL, we can just replace temple_id if the query involves those tables
    if '"User"' in text or '"TempleBill"' in text or '"Temple"' in text:
        text = re.sub(r'\btemple_id\b', '"templeId"', text)
        text = re.sub(r'\bcreated_at\b', '"createdAt"', text)
        text = re.sub(r'\bupdated_at\b', '"updatedAt"', text)
    
    # 3. temple_bills -> "TempleBill"
    text = re.sub(r'\btemple_bills\b', '"TempleBill"', text)
    if '"TempleBill"' in text:
        text = re.sub(r'\bitem_name\b', '"itemName"', text)
        text = re.sub(r'\bbilling_date\b', '"billingDate"', text)
        text = re.sub(r'\bdue_date\b', '"dueDate"', text)
        text = re.sub(r'\bpayee_role\b', '"payeeRole"', text)
        text = re.sub(r'\bpayee_id\b', '"payeeId"', text)

    # 4. withdrawals -> "Withdrawal"
    text = re.sub(r'\bwithdrawals\b', '"Withdrawal"', text)
    if '"Withdrawal"' in text:
        text = re.sub(r'\bsales_name\b', '"salesName"', text)
        text = re.sub(r'\breceipt_url\b', '"receiptUrl"', text)

    # 5. distributor_sales -> dist_sales
    text = re.sub(r'\bdistributor_sales\b', 'dist_sales', text)
    
    return text

# Find strings that contain SELECT, INSERT, UPDATE, DELETE, FROM, JOIN, INTO
new_content = re.sub(r'(["`\'])(.*?)(SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|INTO)(.*?)\1', 
                     lambda m: m.group(1) + process_sql(m) + m.group(1), 
                     content, flags=re.IGNORECASE | re.DOTALL)

# Fallback: some strings might be concatenated. We can just replace directly using a naive approach
# if the string contains the target tables.
lines = new_content.split('\n')
for i, line in enumerate(lines):
    if any(x in line for x in ['temples', 'personnel', 'distributor_sales', 'temple_bills', 'withdrawals']):
        if re.search(r'SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|INTO', line, re.IGNORECASE):
            lines[i] = process_sql(re.match(r'.*', line))

with open(filepath, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
