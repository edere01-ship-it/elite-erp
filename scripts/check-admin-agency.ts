import { prisma } from "../app/db.server";

async function main() {
    console.log("Checking Admin User...");
    const admin = await prisma.user.findFirst({
        where: { OR: [{ username: "admin" }, { email: "admin@elite.com" }] },
        include: { employee: { include: { agency: true } } }
    });

    if (!admin) {
        console.log("Admin user not found.");
        return;
    }

    console.log(`Admin User found: ${admin.username} (${admin.id})`);

    if (!admin.employee) {
        console.log("No Employee record linked to Admin.");
    } else {
        console.log(`Employee record found: ${admin.employee.firstName} ${admin.employee.lastName}`);
        if (admin.employee.agency) {
            console.log(`Linked to Agency: ${admin.employee.agency.name}`);
        } else {
            console.log("Employee record exists but NOT linked to any Agency.");
        }
    }

    console.log("\nChecking Agencies...");
    const agencies = await prisma.agency.findMany();
    if (agencies.length === 0) {
        console.log("No agencies found in database.");
    } else {
        console.log(`${agencies.length} agencies found:`);
        agencies.forEach(a => console.log(`- ${a.name} (${a.id})`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
