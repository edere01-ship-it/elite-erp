import { prisma } from "../app/db.server";

async function main() {
    console.log("Starting Auto-Fix for Admin Agency Link...");

    // 1. Find the designated admin user
    const adminUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username: "admin" },
                { role: "admin" }
            ]
        }
    });

    if (!adminUser) {
        console.error("CRITICAL: No Admin user found!");
        return;
    }
    console.log(`Found Admin User: ${adminUser.username}`);

    // 2. Find or Create default Agency
    let agency = await prisma.agency.findFirst({
        where: { name: "Siège Elite Immobilier" }
    });

    if (!agency) {
        console.log("Creating default 'Siège' Agency...");
        agency = await prisma.agency.create({
            data: {
                name: "Siège Elite Immobilier",
                address: "Abidjan, Cocody",
                city: "Abidjan",
                phone: "+225 0102030405",
                email: "contact@elite-immobilier.com",
                manager: "Directeur Général"
            }
        });
    }
    console.log(`Using Agency: ${agency.name} (${agency.id})`);

    // 3. Link Admin to Agency (via Employee)
    const employee = await prisma.employee.upsert({
        where: { userId: adminUser.id },
        update: {
            agencyId: agency.id
        },
        create: {
            firstName: "Admin",
            lastName: "System",
            email: adminUser.email || "admin@system.local",
            phone: "00000000",
            position: "DIRECTEUR",
            department: "DIRECTION",
            startDate: new Date(),
            salary: 0,
            userId: adminUser.id,
            agencyId: agency.id
        }
    });

    console.log(`SUCCESS: Linked Admin '${adminUser.username}' to Agency '${agency.name}'`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
