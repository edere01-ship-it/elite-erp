import { prisma } from "~/db.server";

export type AgencyPendingItems = {
    invoices: Awaited<ReturnType<typeof getAgencyPendingInvoices>>;
    expenses: Awaited<ReturnType<typeof getAgencyPendingExpenses>>;
    transactions: Awaited<ReturnType<typeof getAgencyPendingTransactions>>;
    payrolls: Awaited<ReturnType<typeof getAgencyPendingPayrolls>>;
    employees: Awaited<ReturnType<typeof getAgencyPendingEmployees>>;
};

export async function getAgencyPendingInvoices(agencyId: string) {
    return prisma.invoice.findMany({
        where: {
            agencyId,
            status: "pending", // Waiting for Agency validation
        },
        include: {
            client: true,
            items: true,
        },
        orderBy: { issueDate: "desc" },
    });
}

export async function getAgencyPendingExpenses(agencyId: string) {
    return prisma.expenseReport.findMany({
        where: {
            agencyId,
            status: "pending",
        },
        include: {
            submitter: true,
            project: true,
        },
        orderBy: { date: "desc" },
    });
}

export async function getAgencyPendingTransactions(agencyId: string) {
    return prisma.transaction.findMany({
        where: {
            agencyId,
            status: "pending",
        },
        include: {
            recorder: true,
        },
        orderBy: { date: "desc" },
    });
}

export async function getAgencyPendingPayrolls(agencyId: string) {
    return prisma.payrollRun.findMany({
        where: {
            agencyId,
            status: "pending_agency", // Validates HR-issued payrolls
        },
        orderBy: { year: "desc" }, // Sort by year then month
    });
}

export async function getAgencyPendingEmployees(agencyId: string) {
    return prisma.employee.findMany({
        where: {
            agencyId,
            status: "pending_agency", // Specific status for RH-created employees waiting agency approval
        },
        include: {
            user: true
        },
        orderBy: { startDate: "desc" },
    });
}

export async function getAgencyStats(agencyId: string) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
        totalSales,
        pendingInvoices,
        activeAgents,
        properties
    ] = await Promise.all([
        prisma.transaction.aggregate({
            where: {
                agencyId,
                category: "sale",
                status: "completed",
                date: { gte: firstDayOfMonth }
            },
            _sum: { amount: true }
        }),
        prisma.invoice.count({
            where: { agencyId, status: "pending" }
        }),
        prisma.employee.count({
            where: { agencyId, position: "COMMERCIAL", status: "active" }
        }),
        prisma.property.count({
            where: {
                agencyId
            }
        })
    ]);

    return {
        monthlySales: totalSales._sum.amount || 0,
        pendingValidations: pendingInvoices,
        agentCount: activeAgents,
        propertyCount: properties
    };
}

export async function getAgencyProperties(agencyId: string) {
    return prisma.property.findMany({
        where: { agencyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function validateByAgency(itemId: string, type: 'invoice' | 'expense' | 'transaction' | 'payroll' | 'employee', validatorId: string) {
    const targetStatus = "agency_validated";

    switch (type) {
        case 'invoice':
            return prisma.invoice.update({
                where: { id: itemId },
                data: { status: targetStatus }
            });
        case 'expense':
            return prisma.expenseReport.update({
                where: { id: itemId },
                data: { status: targetStatus }
            });
        case 'transaction':
            return prisma.transaction.update({
                where: { id: itemId },
                data: {
                    status: 'completed',
                    validatedBy: validatorId
                }
            });
        case 'payroll':
            // Level 1 Validation: Agency -> General Direction
            return prisma.payrollRun.update({
                where: { id: itemId },
                data: { status: "pending_general" }
            });
        case 'employee':
            // Level 1 Validation: Agency -> General Direction
            return prisma.employee.update({
                where: { id: itemId },
                data: { status: "pending_general" }
            });
        default:
            throw new Error(`Unknown validation type: ${type}`);
    }
}

export async function rejectByAgency(itemId: string, type: 'invoice' | 'expense' | 'transaction' | 'payroll' | 'employee') {
    switch (type) {
        case 'invoice':
            return prisma.invoice.update({
                where: { id: itemId },
                data: { status: 'draft' }
            });
        case 'expense':
            return prisma.expenseReport.update({
                where: { id: itemId },
                data: { status: 'rejected' }
            });
        case 'transaction':
            return prisma.transaction.update({
                where: { id: itemId },
                data: { status: 'cancelled' }
            });
        case 'payroll':
            return prisma.payrollRun.update({
                where: { id: itemId },
                data: { status: 'agency_rejected' }
            });
        case 'employee':
            return prisma.employee.update({
                where: { id: itemId },
                data: { status: 'rejected' }
            });
        default:
            throw new Error(`Unknown validation type: ${type}`);
    }
}
export async function getAgencyEnhancedStats(agencyId: string) {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    // 1. Revenue History (Monthly)
    const transactions = await prisma.transaction.findMany({
        where: {
            agencyId,
            status: 'completed',
            date: { gte: sixMonthsAgo }
        },
        orderBy: { date: 'asc' }
    });

    const revenueHistory = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(sixMonthsAgo);
        d.setMonth(sixMonthsAgo.getMonth() + i);
        const monthKey = d.toLocaleString('fr-FR', { month: 'short' });

        const monthlyTransactions = transactions.filter(t =>
            t.date.getMonth() === d.getMonth() && t.date.getFullYear() === d.getFullYear()
        );

        return {
            month: monthKey,
            income: monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            expense: monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        };
    });

    // 2. Recent Activities (Merge Properties, Employees, Transactions)
    const [recentProps, recentEmps, recentTrans] = await Promise.all([
        prisma.property.findMany({ where: { agencyId }, take: 3, orderBy: { createdAt: 'desc' } }),
        prisma.employee.findMany({ where: { agencyId }, take: 3, orderBy: { startDate: 'desc' } }),
        prisma.transaction.findMany({ where: { agencyId, status: 'completed' }, take: 3, orderBy: { date: 'desc' } })
    ]);

    const activities = [
        ...recentProps.map(p => ({ type: 'property', date: p.createdAt, title: `Nouveau bien : ${p.title}`, id: p.id })),
        ...recentEmps.map(e => ({ type: 'employee', date: e.startDate, title: `Nouvelle recrue : ${e.firstName} ${e.lastName}`, id: e.id })),
        ...recentTrans.map(t => ({ type: 'transaction', date: t.date, title: `${t.type === 'income' ? 'Encaissement' : 'Décaissement'} : ${t.amount} FCFA`, id: t.id }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    // 3. Top Agents (Mock logic or complex group by - simplified here by fetching agents and summing their sales)
    // Prisma GroupBy is better but requires clean relation. Let's do simple aggregation manually for MVP.
    const agents = await prisma.employee.findMany({
        where: { agencyId, position: 'COMMERCIAL' },
        include: { user: true }
    });

    // For real data we'd link Query transactions where recordedBy == agent.user.id
    // But schema links transaction.recorder. Let's try that.
    const topAgents = await Promise.all(agents.map(async (agent) => {
        const sales = await prisma.transaction.count({
            where: { agencyId, recordedBy: agent.userId, type: 'income', status: 'completed' }
        });
        return { name: `${agent.firstName} ${agent.lastName}`, sales };
    }));

    return {
        revenueHistory,
        activities,
        topAgents: topAgents.sort((a, b) => b.sales - a.sales).slice(0, 3)
    };
}

export async function getAgencyValidationHistory(agencyId: string) {
    const [historyInvoices, historyExpenses, historyTransactions, historyPayrolls, historyEmployees] = await Promise.all([
        prisma.invoice.findMany({
            where: {
                agencyId,
                status: { in: ["agency_validated", "paid", "draft", "sent"] }
            },
            include: { client: true },
            take: 20,
            orderBy: { issueDate: "desc" }
        }),
        prisma.expenseReport.findMany({
            where: {
                agencyId,
                status: { in: ["agency_validated", "approved", "rejected"] }
            },
            include: { submitter: true },
            take: 20,
            orderBy: { date: "desc" }
        }),
        prisma.transaction.findMany({
            where: {
                agencyId,
                status: { in: ["completed", "cancelled"] }
            },
            include: { recorder: true },
            take: 20,
            orderBy: { date: "desc" }
        }),
        prisma.payrollRun.findMany({
            where: {
                agencyId,
                status: { in: ["pending_general", "direction_approved", "finance_validated", "paid", "agency_rejected"] }
            },
            take: 20,
            orderBy: { updatedAt: "desc" }
        }),
        prisma.employee.findMany({
            where: {
                agencyId,
                status: { in: ["pending_general", "active", "rejected"] }
            },
            include: { user: true },
            take: 20,
            orderBy: { updatedAt: "desc" }
        })
    ]);

    const history = [
        ...historyInvoices.map(i => ({
            id: i.id,
            type: "Facture",
            description: `Facture #${i.number}`,
            amount: i.total,
            status: i.status === "draft" ? "Rejeté (Brouillon)" : "Validé",
            date: i.issueDate,
            details: i.client ? `${i.client.firstName} ${i.client.lastName}` : ""
        })),
        ...historyExpenses.map(e => ({
            id: e.id,
            type: "Dépense",
            description: e.description,
            amount: e.amount,
            status: e.status === "rejected" ? "Rejeté" : "Validé",
            date: e.date,
            details: e.submitter.username
        })),
        ...historyTransactions.map(t => ({
            id: t.id,
            type: "Transaction",
            description: t.description,
            amount: t.amount,
            status: t.status === "cancelled" ? "Rejeté" : "Validé",
            date: t.date,
            details: t.recorder?.username || "Système"
        })),
        ...historyPayrolls.map(p => ({
            id: p.id,
            type: "Paie",
            description: `Paie ${p.month}/${p.year}`,
            amount: p.totalAmount,
            status: p.status === "agency_rejected" ? "Rejeté" : "Validé",
            date: p.updatedAt,
            details: "Masse Salariale"
        })),
        ...historyEmployees.map(e => ({
            id: e.id,
            type: "Employé",
            description: `Recrutement ${e.firstName} ${e.lastName}`,
            amount: e.salary,
            status: e.status === "rejected" ? "Rejeté" : "Validé",
            date: e.updatedAt,
            details: e.position
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return history;
}
