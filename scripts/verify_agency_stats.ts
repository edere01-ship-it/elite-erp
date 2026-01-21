
import { prisma } from "../app/db.server";
import { getAgencyStats, getAgencyEnhancedStats } from "../app/services/agency.server";

async function main() {
    console.log("Finding an agency...");
    const agency = await prisma.agency.findFirst();

    if (!agency) {
        console.log("No agency found in DB.");
        return;
    }

    console.log(`Testing with Agency: ${agency.name} (${agency.id})`);

    try {
        console.log("1. Testing getAgencyStats...");
        const stats = await getAgencyStats(agency.id);
        console.log("Stats result:", JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error("CRASH in getAgencyStats:", error);
    }

    try {
        console.log("2. Testing getAgencyEnhancedStats...");
        const enhanced = await getAgencyEnhancedStats(agency.id);
        console.log("Enhanced Stats result:", JSON.stringify(enhanced, null, 2));
    } catch (error) {
        console.error("CRASH in getAgencyEnhancedStats:", error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
