import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { createTempleAccount, submitFreeAccountApplication } from './src/app/actions.ts';

async function test() {
  console.log('Testing createTempleAccount...');
  try {
    await createTempleAccount({
      name: 'Test Temple A',
      account: 'testadminA',
      password: 'password',
      plan: 'Free',
      cloudStorage: 'Free',
      freeType: 'Permanent'
    });
    const ta = await prisma.temple.findFirst({ where: { account: 'testadminA' }});
    if (ta) {
      const sa = await prisma.templeStorage.findFirst({ where: { templeId: ta.id } });
      console.log('Temple A Storage:', sa);
    }
  } catch (e) { console.error(e); }

  console.log('Testing submitFreeAccountApplication...');
  try {
    await submitFreeAccountApplication({
      templeName: 'Test Temple B',
      account: 'testadminB',
      password: 'password',
      cloudStorage: 'Free',
      freeType: 'Permanent',
      role: 'super-admin'
    });
    const tb = await prisma.temple.findFirst({ where: { account: 'testadminB' }});
    if (tb) {
      const sb = await prisma.templeStorage.findFirst({ where: { templeId: tb.id } });
      console.log('Temple B Storage:', sb);
    }
  } catch (e) { console.error(e); }

  // Cleanup
  await prisma.user.deleteMany({ where: { account: { in: ['testadminA', 'testadminB'] } } });
  const tA = await prisma.temple.findFirst({ where: { account: 'testadminA' }});
  const tB = await prisma.temple.findFirst({ where: { account: 'testadminB' }});
  if (tA) { await prisma.templeStorage.deleteMany({ where: { templeId: tA.id }}); await prisma.templeAiUsage.deleteMany({ where: { templeId: tA.id }}); await prisma.temple.delete({ where: { id: tA.id } }); }
  if (tB) { await prisma.templeStorage.deleteMany({ where: { templeId: tB.id }}); await prisma.templeAiUsage.deleteMany({ where: { templeId: tB.id }}); await prisma.temple.delete({ where: { id: tB.id } }); }
}
test();
