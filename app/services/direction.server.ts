import { prisma } from "~/db.server";

export async function getDirectionStats() {
    const [
        totalTurnover,
        propertiesCount,
        activeProjectsCount,
        salaryMass
    ] = await Promise.all([
        prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: "income", status: "completed" }
        }),
        prisma.property.count({ where: { status: "available" } }),
        prisma.constructionProject.count({ where: { status: "in_progress" } }),
        prisma.payrollRun.aggregate({
            _sum: { totalAmount: true },
            where: { status: "paid" } // Or current month? Taking paid global for now as "Total Salary Mass"
        })
    ]);

    // For "Masse salariale", usually it's monthly.
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Use aggregate to sum up all agencies' payrolls for the current month
    const currentMonthPayroll = await prisma.payrollRun.aggregate({
        _sum: { totalAmount: true },
        where: {
            month: currentMonth,
            year: currentYear
        }
    });

    return {
        turnover: totalTurnover._sum.amount || 0,
        propertiesCount, // Available properties
        activeProjectsCount,
        salaryMass: currentMonthPayroll._sum.totalAmount || 0
    };
}

export async function getPendingValidations() {
    const [
        pendingExpenses,
        pendingPayrolls,
        pendingEmployees,
        pendingAssignments,
        pendingTransactions,
        pendingInvoices
    ] = await Promise.all([
        prisma.expenseReport.findMany({
            where: { status: "agency_validated" }, // Only show agency-validated expenses
            include: { submitter: true, agency: true },
            take: 10,
            orderBy: { date: "asc" }
        }),
        prisma.payrollRun.findMany({
            where: { status: "pending_general" }, // Level 2: Waiting for Direction General
            include: { agency: true },
            take: 10,
            orderBy: { createdAt: "desc" }
        }),
        prisma.employee.findMany({
            where: { status: "pending_general" }, // Level 2: Waiting for Direction General
            take: 5,
            orderBy: { createdAt: "desc" }
        }),
        prisma.employee.findMany({
            where: { NOT: { pendingAgencyId: null } },
            include: { agency: true },
            take: 5,
            orderBy: { updatedAt: "desc" }
        }),
        prisma.transaction.findMany({
            where: { status: "agency_validated", type: "expense" }, // Only show agency-validated expenses
            include: { recorder: true, agency: true },
            take: 10,
            orderBy: { date: "asc" }
        }),
        prisma.invoice.findMany({
            where: { status: "agency_validated" }, // Agency validated invoices
            include: { client: true, agency: true },
            take: 10,
            orderBy: { issueDate: "asc" }
        })
    ]);

    // Normalize structure for the UI widget
    const validations = [
        ...pendingEmployees.map(e => ({
            id: e.id,
            type: "Recrutement",
            emitter: "RH",
            amount: e.salary,
            status: "En attente",
            date: e.createdAt,
            details: `${e.firstName} ${e.lastName} - ${e.position}`
        })),
        ...pendingExpenses.map(e => ({
            id: e.id,
            type: "Dépense",
            emitter: e.submitter.username,
            amount: e.amount,
            status: "Validé (Agence)",
            date: e.date,
            details: `${e.description} (${e.agency?.name || 'Agence?'})`
        })),
        ...pendingPayrolls.map(p => ({
            id: p.id,
            type: "Paie",
            emitter: "RH",
            amount: p.totalAmount,
            status: "Validé (Agence)",
            date: p.createdAt,
            details: `Paie ${p.month}/${p.year} - ${p.agency?.name || 'Agence?'}`
        })),
        ...pendingAssignments.map(e => ({
            id: e.id,
            type: "Affectation",
            emitter: "RH",
            amount: 0,
            status: "En attente",
            date: e.updatedAt,
            details: `${e.firstName} ${e.lastName} -> Agence ID: ${e.pendingAgencyId}`
        })),
        ...pendingTransactions.map(t => ({
            id: t.id,
            type: "Transaction",
            emitter: t.recorder?.username || "Système",
            amount: t.amount,
            status: "Validé (Agence)",
            date: t.date,
            details: `${t.description} (${t.agency?.name || 'Agence?'})`
        })),
        ...pendingInvoices.map(i => ({
            id: i.id,
            type: "Facture",
            emitter: i.client?.firstName || "Client", // Or created by?
            amount: i.total,
            status: "Validé (Agence)",
            date: i.issueDate,
            details: `Facture #${i.number} (${i.agency?.name || 'Agence?'})`
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

    return validations;
}

export async function getValidationHistory() {
    const [historyExpenses, historyPayrolls, historyTransactions, historyAssignments] = await Promise.all([
        prisma.expenseReport.findMany({
            where: { status: { in: ["approved", "rejected"] } },
            include: { submitter: true },
            take: 50,
            orderBy: { date: "desc" }
        }),
        prisma.payrollRun.findMany({
            where: { status: { in: ["direction_approved", "paid", "pending_agency"] } }, // pending_agency = Rejected by Direction (sent back)
            take: 50,
            orderBy: { updatedAt: "desc" }
        }),
        prisma.transaction.findMany({
            where: { status: { in: ["completed", "cancelled"] }, type: "expense" },
            include: { recorder: true },
            take: 50,
            orderBy: { date: "desc" }
        }),
        prisma.employee.findMany({
            // Simple proxy for "Assigned": Employees with an agency, sorted by update
            where: { NOT: { agencyId: null } },
            include: { agency: true },
            take: 50,
            orderBy: { updatedAt: "desc" }
        })
    ]);

    const history = [
        ...historyExpenses.map(e => ({
            id: e.id,
            type: "Dépense",
            emitter: e.submitter.username,
            amount: e.amount,
            status: e.status === "approved" ? "Validé" : "Rejeté",
            date: e.date // Changed from updatedAt
        })),
        ...historyPayrolls.map(p => ({
            id: p.id,
            type: "Paie",
            emitter: "RH",
            amount: p.totalAmount,
            status: p.status === "direction_approved" || p.status === "paid" ? "Validé" : "Rejeté (Renvoyé Agence)",
            date: p.updatedAt
        })),
        ...historyTransactions.map(t => ({
            id: t.id,
            type: "Transaction",
            emitter: t.recorder?.username || "Système",
            amount: t.amount,
            status: t.status === "completed" ? "Validé" : "Rejeté",
            date: t.date // Changed from updatedAt
        })),
        ...historyAssignments.map(e => ({
            id: e.id,
            type: "Affectation",
            emitter: "RH",
            amount: 0,
            status: "Validé",
            date: e.updatedAt,
            details: `${e.firstName} ${e.lastName} -> ${e.agency?.name}`
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // No slice, show all fetched (up to 200)

    return history;
}

export async function getAgencyPerformance() {
    // 1. Get all agencies
    const agencies = await prisma.agency.findMany({
        include: {
            employees: {
                include: {
                    user: true
                }
            }
        }
    });

    // 2. For each agency, calculate turnover based on employees' transactions
    // This assumes Transaction.recordedBy matches Employee.userId
    const performance = await Promise.all(agencies.map(async (agency) => {
        const userIds = agency.employees.map(e => e.userId).filter(Boolean) as string[];

        let agencyTurnover = 0;
        let expenses = 0;

        if (userIds.length > 0) {
            const turnoverAgg = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    recordedBy: { in: userIds },
                    type: "income",
                    status: "completed"
                }
            });
            agencyTurnover = turnoverAgg._sum.amount || 0;

            const expenseAgg = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    recordedBy: { in: userIds },
                    type: "expense",
                    status: "completed"
                }
            });
            expenses = expenseAgg._sum.amount || 0;
        }

        return {
            name: agency.name,
            turnover: agencyTurnover,
            expenses: expenses,
            netResult: agencyTurnover - expenses
        };
    }));

    return performance;
}

export async function getFinanceStats() {
    const currentYear = new Date().getFullYear();

    // Treasury: Total Income - Total Expenses
    const totalIncome = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "income", status: "completed" }
    });
    const totalExpenses = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "expense", status: "completed" }
    });
    const treasuryBalance = (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0);

    // Expenses This Year
    const yearlyExpenses = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
            type: "expense",
            status: "completed",
            date: {
                gte: new Date(`${currentYear}-01-01`),
                lt: new Date(`${currentYear + 1}-01-01`)
            }
        }
    });

    // Debts (Pending Expenses) & Receivables (Pending Income)
    const pendingIncome = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "income", status: "pending" }
    });
    const pendingExpenses = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "expense", status: "pending" }
    });

    const debtsAndReceivables = (pendingIncome._sum.amount || 0) + (pendingExpenses._sum.amount || 0);

    return {
        treasuryBalance,
        yearlyExpenses: yearlyExpenses._sum.amount || 0,
        debtsAndReceivables,
        growth: {
            treasury: 8.7, // Mocked for now as we don't have historical snapshots easily
            expenses: 8.9,
            debts: 4.8
        }
    };
}

export async function getFinancialDocuments() {
    const documents = await prisma.transaction.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
            recorder: {
                select: { username: true }
            }
        }
    });

    return documents.map(doc => ({
        id: doc.id,
        date: doc.date,
        user: doc.recorder?.username || 'Système',
        action: doc.description || (doc.type === 'income' ? 'Recette' : 'Dépense'),
        amount: doc.amount,
        status: doc.status === 'completed' ? 'Succès' : doc.status === 'cancelled' ? 'Refusé' : 'En cours'
    }));
}

export async function getFinancialOverview() {
    // Last 6 months revenue vs expenses
    // Simplified for now: just get all transactions and group by month in JS (or just raw list)
    // For a real chart, we'd need grouped queries.
    const transactions = await prisma.transaction.findMany({
        orderBy: { date: "asc" },
        where: { status: "completed" }
    });

    return transactions;
}
