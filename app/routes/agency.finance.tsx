import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { DollarSign, FileText, CreditCard, TrendingUp, TrendingDown, Plus } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_VIEW);

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    if (!employee?.agencyId) throw new Response("Unauthorized", { status: 403 });
    const agencyId = employee.agencyId;

    const [invoices, expenses, transactions] = await Promise.all([
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
        })
    ]);

    // Calculate Totals
    const totalRevenue = transactions
        .filter(t => t.type === 'income' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    return { invoices, expenses, transactions, totalRevenue, totalExpenses, agencyId };
}

export default function AgencyFinance() {
    const { invoices, expenses, transactions, totalRevenue, totalExpenses, agencyId } = useLoaderData<typeof loader>();

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');

    return (
        <div className="space-y-6">
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
