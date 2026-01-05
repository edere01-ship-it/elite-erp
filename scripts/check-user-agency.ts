
import { prisma } from "~/db.server";

async function main() {
    console.log("Checking Users...");
    const users = await prisma.user.findMany({
        include: {
            employee: {
                include: { agency: true }
            }
        }
    });

    console.log(`Found ${users.length} users.`);
    for (const u of users) {
        console.log(`User: ${u.username} (${u.role})`);
        if (u.employee) {
            console.log(`  - Employee: ${u.employee.firstName} ${u.employee.lastName}`);
            console.log(`  - Agency: ${u.employee.agency ? u.employee.agency.name : "NONE"} (ID: ${u.employee.agencyId})`);
        } else {
            console.log(`  - No Employee Record`);
        }
    }
}

main();
