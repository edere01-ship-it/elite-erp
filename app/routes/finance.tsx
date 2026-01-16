import type { Route } from "./+types/finance";
import { useLoaderData, type LoaderFunctionArgs, type ActionFunctionArgs, useNavigation, useSubmit } from "react-router";
import { getSession } from "~/sessions.server";
import { useState, useEffect } from "react";
import { Banknote, PieChart, Plus, FileText, Receipt, BarChart4, CheckCircle } from "lucide-react";
import { prisma } from "~/db.server";
import { FinancialStats } from "~/components/finance/FinancialStats";
import { TransactionList } from "~/components/finance/TransactionList";
import { TransactionForm } from "~/components/finance/TransactionForm";
import { InvoiceForm } from "~/components/finance/InvoiceForm";
import { InvoiceManager } from "~/components/finance/InvoiceManager";
import { ValidationManager } from "~/components/finance/ValidationManager";
import { cn } from "~/lib/utils";
import { PERMISSIONS } from "~/utils/permissions";
import { notifyAgencyManagers, notifyDirection } from "~/services/notification.server";
import { requirePermission, hasPermission } from "~/utils/permissions.server";
import { logModuleAccess } from "~/services/it.server";
import { getValidationHistory } from "~/services/direction.server";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Comptabilité & Finances - Elite Immobilier & Divers" },
        { name: "description", content: "Gestion financière complète" },
    ];
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    const intent = formData.get("intent");

    if (intent === "create-transaction") {
        const description = formData.get("description") as string;
        const amountRaw = formData.get("amount") as string;
        const amount = parseFloat(amountRaw.replace(/\s/g, '').replace(/,/g, '.')) || 0;
        const dateStr = formData.get("date") as string;
        const type = formData.get("type") as string;
        const category = formData.get("category") as string;
        const paymentMethod = formData.get("paymentMethod") as string;

        // Fetch user's agency
        const userEmployee = await prisma.employee.findUnique({
            where: { userId: userId! },
            select: { agencyId: true }
        });
        const agencyId = userEmployee?.agencyId;

        // If user belongs to an Agency, status is 'pending' for validation.
        // If user is Admin/Direction (no agency or validation ignored?), maybe 'completed'?
        // For strict workflow, let's default to 'pending' if in an agency, 'completed' otherwise (or pending for centralized validation).
        // User request: "regroupant toutes... pour validation avant". So agency users -> pending.
        const initialStatus = agencyId ? 'pending' : 'completed';

        await prisma.transaction.create({
            data: {
                description,
                amount,
                date: new Date(dateStr),
                type,
                category,
                paymentMethod,
                status: initialStatus,
                recordedBy: userId,
                validatedBy: initialStatus === 'completed' ? userId : null, // Only self-validate if completed
                agencyId: agencyId // Link to agency
            }
        });
        return { success: true };
    }

    if (intent === "create-invoice") {
        const clientId = formData.get("clientId") as string;
        const type = formData.get("type") as string;
        const issueDateStr = formData.get("issueDate") as string;
        const dueDateStr = formData.get("dueDate") as string;
        const itemsJson = formData.get("items") as string;

        const items = JSON.parse(itemsJson);
        const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
        const taxAmount = 0; // Simple for now
        const total = subtotal + taxAmount;

        const count = await prisma.invoice.count();
        const number = `${type === 'invoice' ? 'FAC' : 'DEV'}-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

        // Fetch user's agency
        const userEmployee = await prisma.employee.findUnique({
            where: { userId: userId! },
            select: { agencyId: true }
        });
        const agencyId = userEmployee?.agencyId;

        await prisma.invoice.create({
            data: {
                number,
                type,
                status: agencyId ? 'pending' : 'sent', // Pending if agency, 'sent' if central
                issueDate: new Date(issueDateStr),
                dueDate: new Date(dueDateStr),
                subtotal,
                taxAmount,
                total,
                clientId,
                agencyId: agencyId, // Link to agency
                items: {
                    create: items.map((item: any) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice
                    }))
                }
            }
        });
        return { success: true };
    }

    if (intent === "validate-invoice") {
        const id = formData.get("id") as string;
        const amount = parseFloat(formData.get("amount") as string);

        await prisma.$transaction([
            prisma.invoice.update({
                where: { id },
                data: { status: 'paid' } // Marks invoice as fully paid
            }),
            prisma.transaction.create({
                data: {
                    date: new Date(),
                    description: `Encaissement Facture (Ref: ${id.substring(0, 8)})`,
                    amount: amount,
                    type: 'income',
                    category: 'sale', // or rent, could be dynamic
                    status: 'completed',
                    paymentMethod: 'transfer', // default
                    sourceId: id,
                    sourceType: 'invoice',
                    validatedBy: userId
                }
            })
        ]);
        return { success: true };
    }

    if (intent === "reject-payroll") {
        const id = formData.get("id") as string;
        const reason = formData.get("reason") as string;
        const payroll = await prisma.payrollRun.update({
            where: { id },
            data: { status: 'pending_general', rejectionReason: reason }, // Sent to Direction for review before going back to agency
            include: { agency: true }
        });

        await notifyDirection(
            "Paie Rejetée par Finance",
            `La paie de ${payroll.month}/${payroll.year} pour l'agence ${payroll.agency?.name} a été rejetée par la Finance. Motif: ${reason}`,
            "warning",
            "/direction"
        );
        return { success: true };
    }

    if (intent === "reject-invoice") {
        const id = formData.get("id") as string;
        const reason = formData.get("reason") as string;
        const invoice = await prisma.invoice.update({
            where: { id },
            data: { status: 'draft', rejectionReason: reason },
            include: { agency: true }
        });

        if (invoice.agencyId) {
            await notifyAgencyManagers(
                invoice.agencyId,
                "Facture Rejetée",
                `La facture #${invoice.number} a été rejetée. Motif: ${reason}`,
                "error",
                "/agency/validations"
            );
        }
        return { success: true };
    }

    if (intent === "validate-payroll-finance") {
        const id = formData.get("id") as string;
        await prisma.payrollRun.update({
            where: { id },
            data: { status: 'finance_validated' }
        });
        return { success: true };
    }

    if (intent === "send-invoice") {
        const id = formData.get("id") as string;
        await prisma.invoice.update({
            where: { id },
            data: { status: 'sent' }
        });
        return { success: true };
    }

    if (intent === "approve-payroll-direction") {
        // This should theoretically be done by Direction, but if Finance has permission override?
        // Actually, based on new flow, this intent is likely from old code or unused here.
        // But let's keep it or remove it? The plan says Finance validates 'direction_approved' -> 'finance_validated'.
        // So this intent might be legacy. I'll focus on adding pay-payroll.
        return null;
    }

    if (intent === "pay-payroll") {
        const id = formData.get("id") as string;
        const amount = parseFloat(formData.get("amount") as string);

        await prisma.$transaction([
            prisma.payrollRun.update({
                where: { id },
                data: { status: 'paid' }
            }),
            prisma.transaction.create({
                data: {
                    description: "Paiement Salaires",
                    amount: amount,
                    type: 'expense',
                    category: 'payroll',
                    date: new Date(),
                    status: 'completed',
                    paymentMethod: 'transfer',
                    sourceId: id,
                    sourceType: 'payroll',
                    recordedBy: userId,
                    validatedBy: userId
                }
            })
        ]);
        return { success: true };
    }

    if (intent === "validate-expense") {
        const id = formData.get("id") as string;
        const amount = parseFloat(formData.get("amount") as string);
        const description = formData.get("description") as string;
        const action = formData.get("action") as string;
        const sourceType = formData.get("sourceType") as string;

        if (sourceType === 'project') {
            if (action === "reject") {
                const reason = formData.get("reason") as string;
                // Revert project to planned/in_progress to allow editing
                await prisma.constructionProject.update({
                    where: { id },
                    data: { status: 'planned', rejectionReason: reason }
                });
            } else {
                const project = await prisma.constructionProject.findUnique({ where: { id }, select: { managerId: true } });
                await prisma.transaction.create({
                    data: {
                        date: new Date(),
                        description: `Règlement Budget Projet: ${description}`,
                        amount: amount,
                        type: 'expense',
                        category: 'construction',
                        status: 'completed',
                        paymentMethod: 'transfer',
                        sourceId: id,
                        sourceType: 'project',
                        recordedBy: project?.managerId,
                        validatedBy: userId
                    }
                });
            }
        } else {
            // Standard Expense Report
            if (action === "reject") {
                const reason = formData.get("reason") as string;
                await prisma.expenseReport.update({
                    where: { id },
                    data: { status: 'rejected', rejectionReason: reason }
                });
            } else {
                const report = await prisma.expenseReport.findUnique({ where: { id }, select: { submitterId: true } });
                await prisma.$transaction([
                    prisma.expenseReport.update({
                        where: { id },
                        data: { status: 'approved' }
                    }),
                    prisma.transaction.create({
                        data: {
                            date: new Date(),
                            description: `Dépense Chantier: ${description}`,
                            amount: amount,
                            type: 'expense',
                            category: 'maintenance',
                            status: 'completed',
                            paymentMethod: 'check',
                            sourceId: id,
                            sourceType: 'expense',
                            recordedBy: report?.submitterId,
                            validatedBy: userId
                        }
                    })
                ]);
            }
        }
        return { success: true };
    }

    return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    // 1. Permission Check
    await requirePermission(userId!, PERMISSIONS.FINANCE_VIEW);

    if (userId) {
        await logModuleAccess(userId, "Finance");
    }

    // 1. Fetch Transactions
    const transactionsRaw = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
        take: 50,
        include: { recorder: true, validator: true }
    });

    const transactions = transactionsRaw.map(t => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        description: t.description,
        amount: t.amount,
        type: t.type as any,
        category: t.category as any,
        status: t.status as any,
        paymentMethod: t.paymentMethod as any,
        issuerName: t.recorder?.username || 'Système',
        validatorName: t.validator?.username || '-'
    }));

    // 2. Fetch Invoices
    const invoicesRaw = await prisma.invoice.findMany({
        include: { client: true },
        orderBy: { issueDate: 'desc' },
        take: 50
    });

    const invoices = invoicesRaw.map(i => ({
        id: i.id,
        number: i.number,
        clientName: i.client ? `${i.client.firstName} ${i.client.lastName}` : 'Client Inconnu',
        type: i.type as any,
        status: i.status as any,
        issueDate: i.issueDate.toISOString().split('T')[0],
        dueDate: i.dueDate.toISOString().split('T')[0],
        items: [],
        subtotal: i.subtotal,
        taxAmount: i.taxAmount,
        total: i.total
    }));

    // 3. Fetch Clients
    const clients = await prisma.client.findMany({ orderBy: { lastName: 'asc' } });

    // 4. Fetch Pending Validations
    const pendingPayrolls = await prisma.payrollRun.findMany({
        where: { status: { in: ['direction_approved', 'finance_validated'] } },
        orderBy: { createdAt: 'desc' }
    });

    // Transform Payrolls for UI
    const pendingPayrollList = await Promise.all(pendingPayrolls.map(async p => {
        const count = await prisma.payrollItem.count({ where: { payrollRunId: p.id } });
        return {
            id: p.id,
            month: p.month,
            year: p.year,
            status: p.status,
            totalAmount: p.totalAmount,
            itemCount: count
        };
    }));

    const pendingInvoicesList = invoices.filter(i => i.status === 'sent'); // Using 'sent' as pending payment validation

    // Fetch Expenses requiring approval
    const pendingExpensesReq = await prisma.expenseReport.findMany({
        where: { status: 'pending' },
        include: { submitter: true, project: true },
        orderBy: { date: 'desc' }
    });

    // Fetch Completed Projects (to pay budget) that haven't been paid yet
    const completedProjects = await prisma.constructionProject.findMany({
        where: { status: 'completed' },
        include: { manager: true }
    });

    const pendingProjectExpenses = [];
    for (const proj of completedProjects) {
        // Check if transaction exists
        const existingTx = await prisma.transaction.findFirst({
            where: { sourceId: proj.id, sourceType: 'project' }
        });
        if (!existingTx) {
            pendingProjectExpenses.push({
                id: proj.id,
                amount: proj.budget,
                category: 'construction',
                description: `Budget Projet: ${proj.name}`,
                date: proj.endDate ? proj.endDate.toISOString().split('T')[0] : proj.startDate.toISOString().split('T')[0],
                submitterName: proj.manager.username,
                projectName: proj.name,
                sourceType: 'project' // marker for action
            });
        }
    }

    const pendingExpenseList = [
        ...pendingExpensesReq.map(e => ({
            id: e.id,
            amount: e.amount,
            category: e.category,
            description: e.description,
            date: e.date.toISOString().split('T')[0],
            submitterName: e.submitter.username,
            projectName: e.project?.name,
            sourceType: 'expense_report'
        })),
        ...pendingProjectExpenses
    ];

    // 5. Calculate Stats
    const allTransactions = await prisma.transaction.findMany();

    let totalIncome = 0;
    let totalExpenses = 0;

    allTransactions.forEach(t => {
        if (t.type === 'income') totalIncome += t.amount;
        if (t.type === 'expense') totalExpenses += t.amount;
    });

    const summary = {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        pendingIncome: pendingInvoicesList.reduce((acc, i) => acc + i.total, 0),
        cashBalance: totalIncome - totalExpenses
    };

    // Check specific validation permissions
    // Default to false if no user, but requirePermission at top of loader should handle access
    const canValidate = userId ? await hasPermission(userId, PERMISSIONS.FINANCE_VALIDATE) : false;
    const canCreate = userId ? await hasPermission(userId, PERMISSIONS.FINANCE_CREATE) : false;

    const validationHistory = await getValidationHistory();

    return {
        transactions,
        invoices,
        clients,
        summary,
        pendingPayrolls: pendingPayrollList,
        pendingInvoices: pendingInvoicesList,
        pendingExpenses: pendingExpenseList,
        validationHistory,
        canValidate,
        canCreate
    };
}

export default function Finance() {
    const {
        transactions,
        invoices,
        clients,
        summary,
        pendingPayrolls,
        pendingInvoices,
        pendingExpenses,
        validationHistory,
        canValidate,
        canCreate
    } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'validation'>('dashboard');
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    const isSubmitting = navigation.state === "submitting";
    const intent = navigation.formData?.get("intent");

    useEffect(() => {
        if (navigation.state === "loading" && !isSubmitting) {
            setIsTransactionModalOpen(false);
            setIsInvoiceModalOpen(false);
        }
    }, [navigation.state, isSubmitting]);

    const pendingCount = (pendingPayrolls?.length || 0) + (pendingInvoices?.length || 0) + (pendingExpenses?.length || 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Comptabilité & Finances</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestion financière complète : Trésorerie, Facturation, Validation.
                    </p>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={cn(
                            activeTab === 'dashboard'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <Banknote className={cn(
                            activeTab === 'dashboard' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                            "-ml-0.5 mr-2 h-5 w-5"
                        )} />
                        Journal & Trésorerie
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={cn(
                            activeTab === 'invoices'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <FileText className={cn(
                            activeTab === 'invoices' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                            "-ml-0.5 mr-2 h-5 w-5"
                        )} />
                        Facturation
                    </button>
                    {canValidate && (
                        <button
                            onClick={() => setActiveTab('validation')}
                            className={cn(
                                activeTab === 'validation'
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                            )}
                        >
                            <CheckCircle className={cn(
                                activeTab === 'validation' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                                "-ml-0.5 mr-2 h-5 w-5"
                            )} />
                            Validations ({(pendingPayrolls?.length || 0)})
                            {pendingCount > 0 && (
                                <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    )}
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        <div className="mt-4 sm:mt-0">
                            {canCreate && (
                                <button
                                    onClick={() => setIsTransactionModalOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouvelle Opération
                                </button>
                            )}
                        </div>

                        <FinancialStats summary={summary} />

                        <div className="bg-white rounded-lg shadow">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Historique des Transactions</h3>
                                <TransactionList transactions={transactions} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'invoices' && (
                    <div className="space-y-8">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsInvoiceModalOpen(true)}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Plus className="h-4 w-4" />
                                Nouvelle Facture / Devis
                            </button>
                        </div>
                        <InvoiceManager invoices={invoices} />
                    </div>
                )}

                {activeTab === 'validation' && canValidate && (
                    <ValidationManager
                        pendingPayrolls={pendingPayrolls}
                        pendingInvoices={pendingInvoices}
                        pendingExpenses={pendingExpenses}
                        validationHistory={validationHistory}
                    />
                )}


            </div>

            {/* Transaction Modal */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        aria-hidden="true"
                        onClick={() => setIsTransactionModalOpen(false)}
                    />

                    <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                Enregistrer une opération
                            </h3>
                            <TransactionForm
                                isSubmitting={isSubmitting && intent === "create-transaction"}
                                onCancel={() => setIsTransactionModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {isInvoiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        aria-hidden="true"
                        onClick={() => setIsInvoiceModalOpen(false)}
                    />

                    <div className="relative z-10 w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                Créer un document financier
                            </h3>
                            <InvoiceForm
                                clients={clients}
                                isSubmitting={isSubmitting && intent === "create-invoice"}
                                onCancel={() => setIsInvoiceModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
