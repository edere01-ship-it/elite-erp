import { prisma } from "~/db.server";
import { notifyFinance, notifyDirection, broadcastNotificationByPermission, sendNotification } from "~/services/notification.server";

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
    switch (type) {
        case 'invoice':
            // Agence Manager approves -> Sent to Finance
            const inv = await prisma.invoice.update({
                where: { id: itemId },
                data: { status: 'sent' },
                select: { number: true, agency: { select: { name: true } } }
            });
            await notifyFinance(
                "Nouvelle Facture Agence",
                `La facture #${inv.number} de l'agence ${inv.agency?.name} a été envoyée pour traitement.`,
                "info",
                "/finance"
            );
            return inv;
        case 'expense':
            // Logic: If small amount -> approved, else -> pending_finance?
            // For now, assuming auto-approval rule or user has rights.
            const exp = await prisma.expenseReport.update({
                where: { id: itemId },
                data: { status: 'approved' },
                select: { description: true, amount: true, agency: { select: { name: true } } }
            });
            await notifyFinance(
                "Dépense Agence Approuvée",
                `Dépense validée par l'agence ${exp.agency?.name}: ${exp.description} (${exp.amount.toLocaleString()} CFA). Prête pour règlement.`,
                "success",
                "/finance"
            );
            return exp;
        case 'transaction':
            return prisma.transaction.update({
                where: { id: itemId },
                data: {
                    status: 'completed',
                    validatedBy: validatorId
                }
            });
        case 'payroll':
            // Agency Val -> Finance
            const pay = await prisma.payrollRun.update({
                where: { id: itemId },
                data: { status: "pending_general" },
                select: { month: true, year: true, agency: { select: { name: true } } }
            });
            await notifyFinance(
                "Validation Paie Agence",
                `La paie ${pay.month}/${pay.year} de l'agence ${pay.agency?.name} a été validée par le manager et attend votre validation.`,
                "info",
                "/finance"
            );
            return pay;
        case 'employee':
            // Level 1 Validation: Agency -> General Direction
            const emp = await prisma.employee.update({
                where: { id: itemId },
                data: { status: "pending_general" },
                select: { firstName: true, lastName: true, agency: { select: { name: true } } }
            });
            await notifyDirection(
                "Nouveau Recrutement à Valider",
                `Recrutement de ${emp.firstName} ${emp.lastName} (Agence ${emp.agency?.name}) en attente de validation finale.`,
                "info",
                "/direction"
            );
            return emp;
        default:
            throw new Error(`Unknown validation type: ${type}`);
    }
}

export async function rejectByAgency(itemId: string, type: 'invoice' | 'expense' | 'transaction' | 'payroll' | 'employee', reason: string) {
    switch (type) {
        case 'invoice':
            // Notify Client or Creator? For now just setting status.
            // Ideally notify the agent who created it? Invoice doesn't have a "creatorId", just agencyId.
            return prisma.invoice.update({
                where: { id: itemId },
                data: {
                    status: 'draft',
                    rejectionReason: reason
                }
            });
        case 'expense':
            const exp = await prisma.expenseReport.update({
                where: { id: itemId },
                data: {
                    status: 'rejected',
                    rejectionReason: reason
                },
                include: { submitter: true }
            });

            // Notify Submitter
            await sendNotification(
                exp.submitterId,
                "Dépense Rejetée",
                `Votre dépense "${exp.description}" a été rejetée. Motif: ${reason}`,
                "error",
                "/expenses" // or wherever they view their expenses
            );
            return exp;

        case 'transaction':
            // Transaction doesn't have rejectionReason in schema yet.
            // Just cancelling.
            return prisma.transaction.update({
                where: { id: itemId },
                data: { status: 'cancelled', rejectionReason: reason }
            });

        case 'payroll':
            const pay = await prisma.payrollRun.update({
                where: { id: itemId },
                data: {
                    status: 'agency_rejected',
                    rejectionReason: reason
                },
                include: { agency: true }
            });

            // Notify HR (who created it).
            // We need to find who is "HR" for this or just broadcast to HR permission holders.
            await broadcastNotificationByPermission(
                "hr.manage", // Assuming this permission exists for HR Manager
                "Paie Rejetée",
                `La paie ${pay.month}/${pay.year} a été rejetée par le manager. Motif: ${reason}`,
                "error",
                "/hr"
            );
            return pay;

        case 'employee':
            // Employee schema doesn't have rejectionReason.
            // Should we add it? For now, we proceed without saving it to DB field if it's missing,
            // BUT we definitely send the notification.
            const emp = await prisma.employee.update({
                where: { id: itemId },
                data: { status: 'rejected', rejectionReason: reason }, // or agency_rejected?
                select: { firstName: true, lastName: true }
            });

            await broadcastNotificationByPermission(
                "hr.manage",
                "Recrutement Rejeté",
                `Le recrutement de ${emp.firstName} ${emp.lastName} a été rejeté. Motif: ${reason}`,
                "error",
                "/hr"
            );
            return emp;

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
            details: i.client ? `${i.client.firstName} ${i.client.lastName}` : "",
            reason: i.rejectionReason
        })),
        ...historyExpenses.map(e => ({
            id: e.id,
            type: "Dépense",
            description: e.description,
            amount: e.amount,
            status: e.status === "rejected" ? "Rejeté" : "Validé",
            date: e.date,
            details: e.submitter.username,
            reason: e.rejectionReason
        })),
        ...historyTransactions.map(t => ({
            id: t.id,
            type: "Transaction",
            description: t.description,
            amount: t.amount,
            status: t.status === "cancelled" ? "Rejeté" : "Validé",
            date: t.date,
            details: t.recorder?.username || "Système",
            reason: t.rejectionReason
        })),
        ...historyPayrolls.map(p => ({
            id: p.id,
            type: "Paie",
            description: `Paie ${p.month}/${p.year}`,
            amount: p.totalAmount,
            status: p.status === "agency_rejected" ? "Rejeté" : "Validé",
            date: p.updatedAt,
            details: "Masse Salariale",
            reason: p.rejectionReason
        })),
        ...historyEmployees.map(e => ({
            id: e.id,
            type: "Employé",
            description: `Recrutement ${e.firstName} ${e.lastName}`,
            amount: e.salary,
            status: e.status === "rejected" ? "Rejeté" : "Validé",
            date: e.updatedAt,
            details: e.position,
            reason: e.rejectionReason
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return history;
}
