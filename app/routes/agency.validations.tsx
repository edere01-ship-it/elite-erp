import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData, useNavigation } from "react-router";
import { getAgencyPendingInvoices, getAgencyPendingExpenses, getAgencyPendingTransactions, getAgencyPendingPayrolls, getAgencyPendingEmployees, validateByAgency, rejectByAgency } from "~/services/agency.server";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { Check, X, FileText, UserCircle, DollarSign, Calendar, Users, Briefcase } from "lucide-react";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_MANAGE);

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
    });

    if (!employee || !employee.agencyId) {
        throw new Response("User not assigned to an agency", { status: 403 });
    }

    const { invoices, expenses, transactions, payrolls, employees } = await getAgencyData(employee.agencyId);

    return { invoices, expenses, transactions, payrolls, employees, agencyId: employee.agencyId };
}

async function getAgencyData(agencyId: string) {
    const [invoices, expenses, transactions, payrolls, employees] = await Promise.all([
        getAgencyPendingInvoices(agencyId),
        getAgencyPendingExpenses(agencyId),
        getAgencyPendingTransactions(agencyId),
        getAgencyPendingPayrolls(agencyId),
        getAgencyPendingEmployees(agencyId)
    ]);
    return { invoices, expenses, transactions, payrolls, employees };
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_MANAGE);
    const formData = await request.formData();
    const intent = formData.get("intent") as string;
    const itemId = formData.get("itemId") as string;
    const type = formData.get("type") as 'invoice' | 'expense' | 'transaction' | 'payroll' | 'employee';

    if (!itemId || !type) return { error: "Missing Parameters" };

    if (intent === "validate") {
        await validateByAgency(itemId, type, user.id);
        return { success: true, message: "Validé avec succès" };
    } else if (intent === "reject") {
        await rejectByAgency(itemId, type);
        return { success: true, message: "Rejeté avec succès" };
    }

    return { error: "Unknown intent" };
}

export default function AgencyValidations() {
    const { invoices, expenses, transactions, payrolls, employees } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    const formatDate = (date: string | Date) => new Date(date).toLocaleDateString();

    const renderValidationButton = (id: string, type: string) => (
        <div className="flex gap-2">
            <Form method="post" className="inline">
                <input type="hidden" name="itemId" value={id} />
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="intent" value="reject" />
                <button
                    disabled={isSubmitting}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                    title="Rejeter"
                >
                    <X className="w-5 h-5" />
                </button>
            </Form>
            <Form method="post" className="inline">
                <input type="hidden" name="itemId" value={id} />
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="intent" value="validate" />
                <button
                    disabled={isSubmitting}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                    title="Valider"
                >
                    <Check className="w-5 h-5" />
                </button>
            </Form>
        </div>
    );

    return (
        <div className="space-y-8">

            {/* EMPLOYEES VALIDATION */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5" /> Nouveaux Employés (RH)
                </h2>
                {employees.length === 0 ? (
                    <p className="text-gray-500 italic">Aucun recrutement à valider.</p>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                        <ul className="divide-y divide-gray-100">
                            {employees.map((emp) => (
                                <li key={emp.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {emp.firstName[0]}{emp.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <Briefcase className="w-3 h-3" /> {emp.position} • {emp.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-sm font-medium text-gray-600">Salaire: {formatCurrency(emp.salary)}</span>
                                        {renderValidationButton(emp.id, 'employee')}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Factures en attente
                </h2>
                {invoices.length === 0 ? (
                    <p className="text-gray-500 italic">Aucune facture à valider.</p>
                ) : (
                    <div className="bg-white rounded-lg shadowoverflow-hidden border border-gray-100">
                        <ul className="divide-y divide-gray-100">
                            {invoices.map((inv) => (
                                <li key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">Facture #{inv.number}</p>
                                        <p className="text-sm text-gray-500">{inv.client?.firstName} {inv.client?.lastName} • {formatDate(inv.issueDate)}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-bold text-gray-900">{formatCurrency(inv.total)}</span>
                                        {renderValidationButton(inv.id, 'invoice')}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Other sections ... */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" /> Dépenses & Notes de frais
                </h2>
                {expenses.length === 0 ? (
                    <p className="text-gray-500 italic">Aucune dépense à valider.</p>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                        <ul className="divide-y divide-gray-100">
                            {expenses.map((exp) => (
                                <li key={exp.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">{exp.description}</p>
                                        <p className="text-sm text-gray-500">{exp.submitter.username} • {exp.category} • {formatDate(exp.date)}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-bold text-gray-900">{formatCurrency(exp.amount)}</span>
                                        {renderValidationButton(exp.id, 'expense')}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Paies (Salaires)
                </h2>
                {payrolls.length === 0 ? (
                    <p className="text-gray-500 italic">Aucune paie à valider.</p>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                        <ul className="divide-y divide-gray-100">
                            {payrolls.map((pay) => (
                                <li key={pay.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">Paie {pay.month}/{pay.year}</p>
                                        <p className="text-sm text-gray-500">Masse salariale mensuelle</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-bold text-gray-900">{formatCurrency(pay.totalAmount)}</span>
                                        {renderValidationButton(pay.id, 'payroll')}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <UserCircle className="w-5 h-5" /> Transactions Diverses
                </h2>
                {transactions.length === 0 ? (
                    <p className="text-gray-500 italic">Aucune transaction diverse à valider.</p>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                        <ul className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <li key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">{tx.description}</p>
                                        <p className="text-sm text-gray-500">{tx.type === 'income' ? 'Recette' : 'Dépense'} • {tx.recorder?.username || 'Système'} • {formatDate(tx.date)}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={cn("font-bold", tx.type === 'income' ? "text-green-600" : "text-black")}>
                                            {tx.type === 'income' ? "+" : "-"} {formatCurrency(tx.amount)}
                                        </span>
                                        {renderValidationButton(tx.id, 'transaction')}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
