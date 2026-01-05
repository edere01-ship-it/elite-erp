import { prisma } from "../app/db.server";

async function main() {
    const users = await prisma.user.findMany();
    console.log("Users found:", users.length);
    console.log(JSON.stringify(users, null, 2));

    const agencies = await prisma.agency.findMany();
    console.log("Agencies found:", agencies.length);
    console.log(JSON.stringify(agencies, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
