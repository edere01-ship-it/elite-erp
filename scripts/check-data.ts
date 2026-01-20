import { prisma } from "~/db.server";

async function main() {
    console.log("Checking data...");
    const properties = await prisma.property.count();
    const developments = await prisma.landDevelopment.count();
    console.log(`Properties: ${properties}`);
    console.log(`Developments: ${developments}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
