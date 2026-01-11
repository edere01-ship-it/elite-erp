import { prisma } from "~/db.server";
import { redis } from "~/utils/redis.server";

export async function getDashboardStats() {
    const cacheKey = "dashboard:stats";

    // Try to get from cache
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn("Redis error:", e);
    }

    const [
        propertiesCount,
        propertiesAvailable,
        agenciesCount,
        usersCount,
        activeProjectsCount,
        financeIncome,
        financeExpense,
        openTicketsCount,
        clientsCount
    ] = await Promise.all([
        prisma.property.count(),
        prisma.property.count({ where: { status: 'available' } }),
        prisma.agency.count(),
        prisma.user.count(),
        prisma.constructionProject.count({ where: { status: 'in_progress' } }),
        prisma.transaction.aggregate({
            where: { type: 'income', status: 'completed' },
            _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
            where: { type: 'expense', status: 'completed' },
            _sum: { amount: true }
        }),
        prisma.ticket.count({ where: { status: { not: 'closed' } } }),
        prisma.client.count()
    ]);

    const stats = {
        properties: {
            total: propertiesCount,
            available: propertiesAvailable
        },
        agencies: agenciesCount,
        users: usersCount,
        projects: activeProjectsCount,
        finance: {
            income: financeIncome._sum.amount || 0,
            expense: financeExpense._sum.amount || 0,
            balance: (financeIncome._sum.amount || 0) - (financeExpense._sum.amount || 0)
        },
        tickets: openTicketsCount,
        clients: clientsCount
    };

    // Save to cache (60 seconds)
    try {
        await redis.set(cacheKey, JSON.stringify(stats), "EX", 60);
    } catch (e) {
        console.warn("Redis set error:", e);
    }

    return stats;
}
