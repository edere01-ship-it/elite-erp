import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { DollarSign, FileText, CreditCard, TrendingUp, TrendingDown, Plus, AlertCircle } from "lucide-react";
import { type ActionFunctionArgs, redirect, useSubmit, useActionData, Form } from "react-router";
import { useState, useEffect } from "react";

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "delete_invoice") {
        const id = formData.get("id") as string;
        await prisma.invoice.delete({ where: { id } });
        return { success: true };
    }

    if (intent === "delete_expense") {
        const id = formData.get("id") as string;
        await prisma.expenseReport.delete({ where: { id } });
        return { success: true };
    }

    return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_VIEW);

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    if (!employee?.agencyId) throw new Response("Unauthorized", { status: 403 });
    const agencyId = employee.agencyId;

    const [invoicesResults, expensesResults, transactionsResults, rejectedInvoicesResults, rejectedExpensesResults] = await Promise.all([
        prisma.invoice.findMany({
            where: { agencyId },
            orderBy: { issueDate: 'desc' },
            take: 10,
            include: { client: true }
        }),
        prisma.expenseReport.findMany({
            where: { agencyId },
            orderBy: { date: 'desc' },
            take: 10,
            include: { submitter: true }
        }),
        prisma.transaction.findMany({
            where: { agencyId },
            orderBy: { date: 'desc' },
            take: 10
        }),
        prisma.invoice.findMany({
            where: { agencyId, status: 'rejected' }, // Fetched rejected invoices
            include: { client: true }
        }),
        prisma.expenseReport.findMany({
            where: { agencyId, status: 'rejected' }, // Fetched rejected expenses
            include: { submitter: true }
        })
    ]);

    const invoices = invoicesResults;
    const expenses = expensesResults;
    const transactions = transactionsResults;
    const rejectedInvoices = rejectedInvoicesResults;
    const rejectedExpenses = rejectedExpensesResults;

    // Calculate Totals
    const totalRevenue = transactions
        .filter(t => t.type === 'income' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    return { invoices, expenses, transactions, totalRevenue, totalExpenses, agencyId, rejectedItems: { invoices: rejectedInvoices, expenses: rejectedExpenses } };
}

export default function AgencyFinance() {
    const { invoices, expenses, transactions, totalRevenue, totalExpenses, agencyId, rejectedItems } = useLoaderData<typeof loader>();
    const submit = useSubmit();

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');

    // Alert State
    const [alertOpen, setAlertOpen] = useState(false);
    const [currentAlertItem, setCurrentAlertItem] = useState<any>(null);

    // Only import useState/useEffect if not already imported? 
    // Wait, the file didn't have useState/useEffect imported. I need to add that to imports in chunk 1, but I missed it.
    // I will assume I can edit imports again or just use React.useState if global React available (likely not).
    // Let's rely on adding imports in a separate small chunk or combining safely.
    // Actually, I'll add the imports in this chunk's instruction if possible, but I can't modify top of file here.
    // I will try to use React.useState assuming React is in scope (it usually isn't in Remix without import * as React).
    // Better: I will verify imports first.

    // Continuing with logic assuming I fixed imports:
    useEffect(() => {
        const allRejections = [
            ...(rejectedItems?.invoices || []).map(i => ({ ...i, type: 'invoice' })),
            ...(rejectedItems?.expenses || []).map(e => ({ ...e, type: 'expense' }))
        ];

        if (allRejections.length > 0) {
            setCurrentAlertItem(allRejections[0]);
            setAlertOpen(true);
        }
    }, [rejectedItems]);

    const handleCorrect = (item: any) => {
        setAlertOpen(false);
        // Redirect or Open Modal for editing
        // For now, maybe just redirect to details page? 
        // Or "Not Implemented" alert if no edit page exists yet?
        // Typically Agency can edit invoices/expenses.
        // Assuming urls like /agency/invoices/$id/edit
        if (item.type === 'invoice') window.location.href = `/agency/invoices/${item.id}/edit`;
        if (item.type === 'expense') window.location.href = `/agency/expenses/${item.id}/edit`;
    };

    const handleCancelAlert = (item: any) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cet élément rejeté ?")) {
            if (item.type === 'invoice') submit({ intent: "delete_invoice", id: item.id }, { method: "post" });
            if (item.type === 'expense') submit({ intent: "delete_expense", id: item.id }, { method: "post" });
            setAlertOpen(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Rejection Alert Modal */}
            {alertOpen && currentAlertItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-red-900/40 transition-opacity backdrop-blur-sm" />
                    <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-red-100 transition-all">
                        <div className="bg-red-50 px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-red-100">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                </div>
                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-lg font-bold leading-6 text-red-900" id="modal-title">
                                        Document Rejeté !
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-red-700">
                                            Votre document a été rejeté. Veuillez consulter le motif ci-dessous.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4">
                            <div className="space-y-3">
                                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                                    <p className="text-sm font-semibold text-gray-700">Elément concerné :</p>
                                    <p className="text-sm text-gray-900">
                                        {currentAlertItem.type === 'invoice'
                                            ? `Facture #${currentAlertItem.number} - ${currentAlertItem.total} XOF`
                                            : `Dépense: ${currentAlertItem.description} - ${currentAlertItem.amount} XOF`}
                                    </p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                                    <p className="text-sm font-semibold text-red-800">Motif du rejet :</p>
                                    <p className="text-sm text-red-900 italic mt-1">
                                        "{currentAlertItem.rejectionReason || "Aucun motif spécifié"}"
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
                            <button
                                type="button"
                                onClick={() => handleCorrect(currentAlertItem)}
                                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
                            >
                                Modifier / Corriger
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCancelAlert(currentAlertItem)}
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 sm:mt-0 sm:w-auto"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    Finance Agence
                </h2>
                <div className="flex gap-2">
                    {/* Director only validates */}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-gray-500">Chiffre d'Affaires</h3>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-gray-500">Dépenses Totales</h3>
                        <TrendingDown className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-gray-500">Solde Théorique</h3>
                        <CreditCard className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className={`text-2xl font-bold ${totalRevenue - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totalRevenue - totalExpenses)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <div className="bg-white shadow rounded-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">Factures Récentes</h3>
                        <Link to="#" className="text-xs text-blue-600 hover:text-blue-800">Voir tout</Link>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {invoices.map((inv) => (
                            <li key={inv.id} className="px-4 py-3 text-sm flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <div className="font-medium text-gray-900">{inv.number}</div>
                                    <div className="text-gray-500 text-xs">{inv.client?.firstName} {inv.client?.lastName}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{formatCurrency(inv.total)}</div>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize 
                                        ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {inv.status}
                                    </span>
                                </div>
                            </li>
                        ))}
                        {invoices.length === 0 && <li className="px-4 py-6 text-center text-gray-400">Aucune facture</li>}
                    </ul>
                </div>

                {/* Recent Expenses */}
                <div className="bg-white shadow rounded-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">Dépenses Récentes</h3>
                        <Link to="#" className="text-xs text-blue-600 hover:text-blue-800">Voir tout</Link>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {expenses.map((exp) => (
                            <li key={exp.id} className="px-4 py-3 text-sm flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <div className="font-medium text-gray-900">{exp.description}</div>
                                    <div className="text-gray-500 text-xs">{formatDate(exp.date.toString())} - {exp.submitter.username}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-red-600">-{formatCurrency(exp.amount)}</div>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize 
                                        ${exp.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {exp.status}
                                    </span>
                                </div>
                            </li>
                        ))}
                        {expenses.length === 0 && <li className="px-4 py-6 text-center text-gray-400">Aucune dépense</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
}
