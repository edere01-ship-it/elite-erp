import { prisma } from "../app/db.server";

async function main() {
    console.log("--- DIAGNOSTIC START ---");

    // 1. Find User
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: "admin" },
                { email: "admin@elite.com" }
            ]
        }
    });

    if (!user) {
        console.error("❌ CRITICAL: User 'admin' not found!");
        return;
    }
    console.log(`✅ User found: ${user.username} (ID: ${user.id})`);

    // 2. Find Employee Link
    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        include: { agency: true }
    });

    if (!employee) {
        console.error("❌ CRITICAL: No Employee record found for this User ID.");
        // Attempt fix?
        // Let's just report for now, or auto-fix if obvious.
    } else {
        console.log(`✅ Employee record found: ${employee.firstName} ${employee.lastName} (ID: ${employee.id})`);
        console.log(`   Agency ID: ${employee.agencyId}`);

        if (employee.agency) {
            console.log(`✅ Linked Agency: ${employee.agency.name} (ID: ${employee.agency.id})`);
        } else {
            console.error("❌ CRITICAL: Employee has agencyId but relation returned null (orphaned?) or agencyId is null.");
            if (!employee.agencyId) console.log("   -> agencyId is literally null.");
        }
    }

    // 3. List all agencies to see what exists
    const agencies = await prisma.agency.findMany();
    console.log(`ℹ️ Total Agencies in DB: ${agencies.length}`);
    agencies.forEach(a => console.log(`   - ${a.name} (${a.id})`));

    console.log("--- DIAGNOSTIC END ---");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
