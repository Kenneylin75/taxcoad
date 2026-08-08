const fs = require('fs');
const path = './src/app/actions.ts';
let content = fs.readFileSync(path, 'utf8');

// Normalize to LF for easy replacement
content = content.replace(/\r\n/g, '\n');

const oldAiVip = `export async function grantTempleAiVip(templeId: string, isVip: boolean = true) {

      try {
        await prisma.templeAiUsage.upsert({
          where: { templeId },
          update: { isVip, planId: isVip ? 'VIP-AI' : 'FREE' },
          create: { templeId, isVip, planId: isVip ? 'VIP-AI' : 'FREE', usedCount: 0 }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}`;

const newAiVip = `export async function grantTempleAiVip(templeId: string, isVip: boolean = true) {
  try {
    const existing = await prisma.templeAiUsage.findFirst({ where: { templeId } });
    if (existing) {
      await prisma.templeAiUsage.update({
        where: { id: existing.id },
        data: { planId: isVip ? 'VIP-AI' : 'FREE' }
      });
    } else {
      await prisma.templeAiUsage.create({
        data: { templeId, planId: isVip ? 'VIP-AI' : 'FREE', usedCount: 0 }
      });
    }
    return { success: true };
  } catch(e) {
    console.error('grantTempleAiVip error:', e);
    return { success: false };
  }
}`;

content = content.replace(oldAiVip, newAiVip);

const oldStorageVip = `export async function grantTempleStorageVip(templeId: string, isVip: boolean = true) {

      try {
        await prisma.templeStorage.upsert({
          where: { templeId },
          update: { isVip, planId: isVip ? 'VIP-STORAGE' : 'FREE' },
          create: { templeId, isVip, planId: isVip ? 'VIP-STORAGE' : 'FREE', usedBytes: 0, totalBytes: isVip ? 1099511627776 : 5368709120 }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}`;

const newStorageVip = `export async function grantTempleStorageVip(templeId: string, isVip: boolean = true) {
  try {
    await prisma.templeStorage.upsert({
      where: { templeId },
      update: {
        planId: isVip ? 'VIP-STORAGE' : 'FREE',
        allocatedBytes: isVip ? 1099511627776n : 5368709120n,
        planName: isVip ? '進階免費空間' : '免費 5GB 空間'
      },
      create: {
        templeId,
        planId: isVip ? 'VIP-STORAGE' : 'FREE',
        allocatedBytes: isVip ? 1099511627776n : 5368709120n,
        planName: isVip ? '進階免費空間' : '免費 5GB 空間',
        usedBytes: 0n
      }
    });
    return { success: true };
  } catch(e) {
    console.error('grantTempleStorageVip error:', e);
    return { success: false };
  }
}`;

content = content.replace(oldStorageVip, newStorageVip);

const oldSubmitFree = `      await prisma.templeStorage.create({
        data: {
          id: \`ts-\${Date.now()}\`,
          templeId: newTemple.id,
          usedBytes: 0
        }
      });
    } catch (e) {
      console.error("Failed to insert new temple into postgres", e);
    }

    if (data.freeType === 'Permanent') {
      await grantTempleAiVip(newTemple.id, true);
      await grantTempleStorageVip(newTemple.id, true);
    }`;

const newSubmitFree = `      let allocatedBytes = 5368709120n;
      let storagePlanName = '免費 5GB 空間';

      if (data.cloudStorage === 'Free' || data.freeType === 'Permanent') {
         allocatedBytes = 1099511627776n;
         storagePlanName = '進階免費空間';
      } else if (data.cloudStorage === '100GB') {
         allocatedBytes = 107374182400n;
         storagePlanName = '100GB 進階版';
      } else if (data.cloudStorage === '500GB') {
         allocatedBytes = 536870912000n;
         storagePlanName = '500GB 專業版';
      } else if (data.cloudStorage === '50GB') {
         allocatedBytes = 53687091200n;
         storagePlanName = '50GB 標準版';
      }

      await prisma.templeStorage.create({
        data: {
          id: \`ts-\${Date.now()}\`,
          templeId: newTemple.id,
          usedBytes: 0n,
          allocatedBytes,
          planName: storagePlanName,
          planId: data.cloudStorage === 'Free' ? 'FREE' : undefined
        }
      });

      let isAiVip = data.aiLife === 'Free' || data.freeType === 'Permanent';
      await prisma.templeAiUsage.create({
        data: {
          templeId: newTemple.id,
          planId: isAiVip ? 'VIP-AI' : 'FREE',
          enabled: data.enableAi ?? true,
          usedCount: 0
        }
      });

    } catch (e) {
      console.error("Failed to insert new temple into postgres", e);
    }

    if (data.freeType === 'Permanent') {
      // Already handled in creation above
    }`;

content = content.replace(oldSubmitFree, newSubmitFree);

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(path, content);
console.log('Patch complete.');
console.log('Check if grantTempleStorageVip is patched:', !content.includes('isVip: isVip'));
