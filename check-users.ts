import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count();
    console.log(`User count: ${count}`);
    const users = await prisma.user.findMany({ select: { email: true, username: true } });
    console.log("Users:", users);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
