import { prisma } from "../app/db.server";

async function main() {
    console.log("Seeding Agency Data...");

    // 1. Get Agency
    const agency = await prisma.agency.findFirst({
        where: { name: "Siège Elite Immobilier" }
    });

    if (!agency) {
        console.error("Agency 'Siège Elite Immobilier' not found. Run fix-agency-link.ts first.");
        return;
    }

    console.log(`Seeding data for agency: ${agency.name}`);

    // 2. Ensure Admin is Employee
    const adminUser = await prisma.user.findFirst({ where: { username: "admin" } });
    if (adminUser) {
        const emp = await prisma.employee.upsert({
            where: { userId: adminUser.id },
            update: { agencyId: agency.id },
            create: {
                firstName: "Admin", lastName: "System", email: "admin@elite.com", position: "DIRECTEUR",
                department: "DIRECTION", startDate: new Date(), salary: 1000000, phone: "01020304",
                userId: adminUser.id, agencyId: agency.id, status: "active"
            }
        });
        console.log("Admin employee verified.");
    }

    // 3. Create a Demo Agent
    const agentEmail = "agent.demo@elite.com";
    const existingAgent = await prisma.employee.findUnique({ where: { email: agentEmail } });
    if (!existingAgent) {
        await prisma.employee.create({
            data: {
                firstName: "Jean", lastName: "Kouassi", email: agentEmail,
                phone: "07080910", position: "COMMERCIAL", department: "COMMERCIAL",
                startDate: new Date(), salary: 200000, status: "active",
                agencyId: agency.id
            }
        });
        console.log("Demo Agent 'Jean Kouassi' created.");
    } else {
        console.log("Demo Agent already exists.");
    }

    // 4. Create a Demo Property
    const propCount = await prisma.property.count({ where: { agencyId: agency.id } });
    if (propCount === 0) {
        await prisma.property.create({
            data: {
                title: "Villa Duplex Cocody",
                description: "Magnifique villa avec piscine",
                price: 150000000,
                type: "villa",
                status: "available",
                address: "Rue des Jardins",
                city: "Abidjan",
                area: 450,
                rooms: 6,
                images: ["https://images.unsplash.com/photo-1600596542815-e328d4de6bf7?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmVhdXRpZnVsJTIwaG91c2V8ZW58MHx8MHx8fDA%3D"],
                features: ["Piscine", "Garage", "Jardin"],
                agencyId: agency.id
            }
        });
        console.log("Demo Property created.");
    } else {
        console.log(`Agency already has ${propCount} properties.`);
    }

    console.log("Seeding complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
