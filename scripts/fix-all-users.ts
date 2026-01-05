import { prisma } from "../app/db.server";

async function main() {
    console.log("--- FIXING ALL USERS ---");

    // 1. Get Agency
    const agency = await prisma.agency.findFirst({
        where: { name: "Siège Elite Immobilier" }
    });

    if (!agency) {
        console.error("❌ Agency 'Siège Elite Immobilier' not found.");
        return;
    }
    console.log(`✅ Using Agency: ${agency.name} (${agency.id})`);

    // 2. Get All Users
    const users = await prisma.user.findMany();
    console.log(`ℹ️ Found ${users.length} users.`);

    for (const user of users) {
        console.log(`Processing User: ${user.username} (${user.id})`);

        // Check/Create Employee
        const emp = await prisma.employee.upsert({
            where: { userId: user.id },
            update: {
                agencyId: agency.id,
                status: 'active'
            },
            create: {
                firstName: user.username,
                lastName: "User",
                email: user.email,
                position: user.role === 'admin' ? "DIRECTEUR" : "AGENT",
                department: user.role === 'admin' ? "DIRECTION" : "COMMERCIAL",
                startDate: new Date(),
                salary: 500000,
                phone: "00000000",
                userId: user.id,
                agencyId: agency.id,
                status: 'active'
            }
        });
        console.log(`   -> Linked to Agency: ${emp.agencyId}`);
    }

    console.log("--- FIX COMPLETE ---");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
