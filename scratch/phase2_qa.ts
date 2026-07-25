import fs from 'fs/promises';
import path from 'path';
import assert from 'assert';

// We will test jsonStore functionality which mimics the UI's storage behavior
import { createRecord, readJson, updateRecord, deleteRecord, atomicWrite } from '../src/lib/jsonStore';

async function runQA() {
    console.log("=== Phase 2 QA Verification ===\n");
    
    // 1. Create one of each
    console.log("1. Simulating UI Creation...");
    const temple = await createRecord('temples', { id: `t-${Date.now()}`, name: "QA Temple" });
    const guest = await createRecord('guests', { id: `g-${Date.now()}`, name: "QA Guest" });
    // Note: admins action didn't hash password in actions.ts, we'll store it as is to check
    const admin = await createRecord('admins', { id: `adm-${Date.now()}`, account: "qa_admin", password: "plain_password" });
    console.log("Creation successful.\n");

    // 2. Confirm written to storage
    console.log("2. Confirming records in storage...");
    const templesFile = await readJson('temples');
    const guestsFile = await readJson('guests');
    const adminsFile = await readJson('admins');
    
    assert(templesFile.find((t: any) => t.id === temple.id), "Temple not found");
    assert(guestsFile.find((g: any) => g.id === guest.id), "Guest not found");
    assert(adminsFile.find((a: any) => a.id === admin.id), "Admin not found");
    console.log("- Data successfully verified on disk.\n");

    // 5. Test Full CRUD
    console.log("5. Testing Full CRUD...");
    // Update
    await updateRecord('temples', temple.id, { name: "QA Temple Updated" });
    const updatedTemple = (await readJson('temples')).find((t: any) => t.id === temple.id);
    assert(updatedTemple.name === "QA Temple Updated", "Update failed");
    console.log("- Update successful.");

    // Delete
    await deleteRecord('guests', guest.id);
    const deletedGuest = (await readJson('guests')).find((g: any) => g.id === guest.id);
    assert(!deletedGuest, "Delete failed");
    console.log("- Delete successful.\n");

    // 6. Verify Backup Creation
    console.log("6. Verifying Backup Files...");
    const backups = await fs.readdir(path.join(process.cwd(), 'storage/backups'));
    const templeBackups = backups.filter(b => b.startsWith('temples_'));
    assert(templeBackups.length > 0, "No backups found for update operation");
    console.log(`- Found ${templeBackups.length} backups.\n`);

    // 7. Simultaneous writes
    console.log("7. Simulating Simultaneous Writes...");
    const promises = [];
    for (let i = 0; i < 20; i++) {
        promises.push(createRecord('guests', { id: `concurrent-${i}`, name: `Simultaneous ${i}` }));
    }
    await Promise.all(promises);
    const guestsAfterConcurrent = await readJson('guests');
    const concurrentCount = guestsAfterConcurrent.filter((g: any) => g.id.startsWith('concurrent-')).length;
    assert(concurrentCount === 20, "Simultaneous write lost data");
    console.log(`- 20 concurrent writes completed safely without data loss.\n`);

    // 8. Corrupted JSON test
    console.log("8. Verifying Corrupted JSON Prevention...");
    try {
        await atomicWrite('temples', () => {
            const a: any = {};
            a.a = a; // circular
            return [a];
        });
    } catch (e: any) {
        console.log("- Corruption successfully blocked:", e.message);
    }
    const finalTemples = await readJson('temples');
    assert(Array.isArray(finalTemples), "File was corrupted or replaced with [] inappropriately");

    // 10. Security Findings for Admins
    console.log("\n10. Security Verification (Admins):");
    const testAdmin = adminsFile.find((a: any) => a.account === "qa_admin");
    let securityFailed = false;
    if (testAdmin.password === "plain_password") {
        console.log("[FINDING] Passwords are stored in PLAIN TEXT.");
        securityFailed = true;
    }
    
    console.log("\nQA Script Finished.");
}

runQA().catch(console.error);
