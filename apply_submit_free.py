import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """    const newTemple = {
      id: 	emple-,
      templeNo,
      ...formData,
      paymentCycle: paymentCycle || 'Monthly',
      monthlyRent: data.freeType === 'Permanent' ? 0 : (db_config.fixedMonthlyRent || 3600),
      trialMonths: data.freeType === 'Trial' ? parseInt(data.trialMonths || '0') : 0,
      freeType: data.freeType || 'Normal',
      role: 'Temple',
      status,
      creatorRole: role,
      creatorId: currentUser.name,
      salesId: sales?.id || null,
      distributorId: role === 'super-admin' ? null : (sales?.distributorId || (role === 'distributor' ? data.distributorId : null)),
      timestamp: new Date().toISOString(),
      billingStartDate: data.freeType === 'Trial' ? 
        new Date(Date.now() + (parseInt(data.trialMonths || '0') * 30 * 24 * 60 * 60 * 1000)).toISOString() : 
        new Date().toISOString()
    };
    db_temples.push(newTemple);
    gStore.db_temples = db_temples;

    if (data.freeType === 'Permanent') {
      await grantTempleAiVip(newTemple.id, true);
      await grantTempleStorageVip(newTemple.id, true);
    }
"""

content = re.sub(r'const newTemple = \{[\s\S]*?db_temples\.push\(newTemple\);\s*gStore\.db_temples = db_temples;', new_func, content, count=1)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
