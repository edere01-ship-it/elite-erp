import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash("admin123", 10);
    const user = await prisma.user.upsert({
        where: { email: "admin@elite-immobilier.ci" },
        update: {},
        create: {
            email: "admin@elite-immobilier.ci",
            username: "Admin",
            password: password,
            role: "admin",
            permissions: ["all"]
        }
    });
    console.log("Created/Found user:", user);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
