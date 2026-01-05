import { prisma } from "../app/db.server";

async function main() {
    console.log("--- LISTING USERS ---");
    const users = await prisma.user.findMany();
    users.forEach(u => {
        console.log(`ID: ${u.id} | User: '${u.username}' | Email: '${u.email}' | Role: '${u.role}'`);
    });

    const agencies = await prisma.agency.findMany();
    console.log("\n--- AGENCIES ---");
    agencies.forEach(a => {
        console.log(`ID: ${a.id} | Name: '${a.name}'`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
