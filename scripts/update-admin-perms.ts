import { prisma } from "../app/db.server";
import { PERMISSIONS } from "../app/utils/permissions";

async function main() {
    console.log("Updating Admin Permissions...");

    const admin = await prisma.user.findFirst({
        where: {
            OR: [
                { username: "admin" },
                { role: "admin" },
                { email: "admin@elite.com" }
            ]
        }
    });

    if (!admin) {
        console.error("Admin user not found.");
        return;
    }

    // Get all permissions from the object values
    const allPermissions = Object.values(PERMISSIONS);

    await prisma.user.update({
        where: { id: admin.id },
        data: {
            permissions: allPermissions
        }
    });

    console.log(`Updated Admin '${admin.username}' with ALL permissions (${allPermissions.length} total).`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
