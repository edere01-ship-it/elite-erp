import { prisma } from "~/db.server";
import type { Prisma } from "@prisma/client";

// --- Projects (LandDevelopment) ---

export async function createLandDevelopment(data: Prisma.LandDevelopmentCreateInput) {
    return prisma.landDevelopment.create({
        data,
    });
}

export async function updateLandDevelopment(id: string, data: Prisma.LandDevelopmentUpdateInput) {
    return prisma.landDevelopment.update({
        where: { id },
        data,
    });
}

export async function getLandDevelopments(status?: string) {
    return prisma.landDevelopment.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" } as any,
        include: {
            _count: {
                select: { lots: true, properties: true }
            }
        } as any
    });
}

export async function getLandDevelopmentById(id: string) {
    return prisma.landDevelopment.findUnique({
        where: { id },
        include: {
            lots: {
                orderBy: { lotNumber: "asc" },
                include: { client: true, subscription: true }
            },
            phases: {
                orderBy: { startDate: "asc" }
            },
            subscriptions: {
                include: { client: true, lot: true }
            },
            properties: true // Built properties linked to this development
        } as any
    });
}

export async function getProjectStats(id: string) {
    const project = await prisma.landDevelopment.findUnique({
        where: { id },
        include: {
            lots: true,
            subscriptions: true
        } as any
    });

    if (!project) return null;

    // Cast project to any to access new fields
    const p = project as any;

    const totalLots = p.lots.length;
    const soldLots = p.lots.filter((l: any) => l.status === "sold").length;
    const reservedLots = p.lots.filter((l: any) => l.status === "reserved").length;
    const availableLots = p.lots.filter((l: any) => l.status === "available").length;
    const preFinancedLots = p.lots.filter((l: any) => l.status === "pre_financed").length;

    const salesProgress = totalLots > 0 ? ((soldLots + preFinancedLots) / totalLots) * 100 : 0;

    const collectedAmount = p.subscriptions.reduce((sum: number, sub: any) => sum + sub.depositAmount, 0); // Simplified. Should check payments.

    // Calculate potential revenue
    const potentialRevenue = p.lots.reduce((sum: number, lot: any) => sum + lot.price, 0);
    const realizedRevenue = p.lots
        .filter((l: any) => ["sold", "pre_financed"].includes(l.status))
        .reduce((sum: number, lot: any) => sum + lot.price, 0);

    return {
        totalLots,
        soldLots,
        reservedLots,
        availableLots,
        preFinancedLots,
        salesProgress,
        collectedAmount,
        potentialRevenue,
        realizedRevenue,
        expectedMargin: p.expectedMargin
    };
}

// --- Lots ---

export async function generateProjectLots(developmentId: string, count: number, prefix: string = "Lot", startNumber: number = 1, basePrice: number = 0, baseArea: number = 0) {
    // Bulk create lots
    const lotsData = Array.from({ length: count }).map((_, i) => ({
        lotNumber: `${prefix} ${startNumber + i}`,
        area: baseArea,
        price: basePrice,
        type: "habitation",
        status: "available",
        developmentId
    }));

    // type assertion for createMany as DevelopmentLot might not be in generic client type
    return (prisma as any).developmentLot.createMany({
        data: lotsData
    });
}

export async function updateLot(id: string, data: any) {
    return (prisma as any).developmentLot.update({
        where: { id },
        data,
    });
}

// --- Phases ---

export async function createProjectPhase(data: any) {
    return (prisma as any).projectPhase.create({
        data
    });
}

export async function updateProjectPhase(id: string, status: string, progress: number) {
    return (prisma as any).projectPhase.update({
        where: { id },
        data: { status, progress }
    });
}

// --- Subscriptions (Pre-financing) ---

export async function createSubscription(
    developmentId: string,
    clientId: string,
    lotId: string | undefined,
    depositAmount: number,
    totalAmount: number,
    paymentSchedule: any
) {
    // Transactional: Create subscription and update Lot status
    return prisma.$transaction(async (tx) => {
        const sub = await (tx as any).subscription.create({
            data: {
                developmentId,
                clientId,
                lotId,
                depositAmount,
                totalAmount,
                paymentSchedule,
                status: "active",
                contractDate: new Date()
            }
        });

        if (lotId) {
            await (tx as any).developmentLot.update({
                where: { id: lotId },
                data: { status: "pre_financed", clientId }
            });
        }

        return sub;
    });
}
// --- Construction Projects ---

export async function createConstructionProject(data: Prisma.ConstructionProjectCreateInput) {
    return prisma.constructionProject.create({
        data,
    });
}
