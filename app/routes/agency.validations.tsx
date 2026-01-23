import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { useState, useEffect } from "react";
import { Form, useLoaderData, useNavigation } from "react-router";
import { getAgencyPendingInvoices, getAgencyPendingExpenses, getAgencyPendingTransactions, getAgencyPendingPayrolls, getAgencyPendingEmployees, validateByAgency, rejectByAgency, getAgencyValidationHistory } from "~/services/agency.server";
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
        throw new Response("Utilisateur non assigné à une agence", { status: 403 });
    }

    const { invoices, expenses, transactions, payrolls, employees, validationHistory } = await getAgencyData(employee.agencyId);

    return { invoices, expenses, transactions, payrolls, employees, validationHistory, agencyId: employee.agencyId };
}

async function getAgencyData(agencyId: string) {
    const [invoices, expenses, transactions, payrolls, employees, validationHistory] = await Promise.all([
        getAgencyPendingInvoices(agencyId),
        getAgencyPendingExpenses(agencyId),
        getAgencyPendingTransactions(agencyId),
        getAgencyPendingPayrolls(agencyId),
        getAgencyPendingEmployees(agencyId),
        getAgencyValidationHistory(agencyId)
    ]);
    return { invoices, expenses, transactions, payrolls, employees, validationHistory };
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_MANAGE);
    const formData = await request.formData();
    const intent = formData.get("intent") as string;
    const itemId = formData.get("itemId") as string;
    const type = formData.get("type") as 'invoice' | 'expense' | 'transaction' | 'payroll' | 'employee';
    const reason = formData.get("reason") as string;

    if (!itemId || !type) return { error: "Paramètres manquants" };

    if (intent === "validate") {
        await validateByAgency(itemId, type, user.id);
        return { success: true, message: "Validé avec succès" };
    } else if (intent === "reject") {
        if (!reason) return { error: "Motif de refus requis" }; // Enforce reason
        await rejectByAgency(itemId, type, reason);
        return { success: true, message: "Rejeté avec succès" };
    }

    return { error: "Action inconnue" };
}

export default function AgencyValidations() {
    const { invoices, expenses, transactions, payrolls, employees, validationHistory } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRejection, setSelectedRejection] = useState<{ id: string, type: string } | null>(null);

    const openRejectModal = (id: string, type: string) => {
        setSelectedRejection({ id, type });
        setRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setSelectedRejection(null);
        setRejectModalOpen(false);
    };

    // Close modal when navigation completes (success action)
    useEffect(() => {
        if (navigation.state === "idle" && !isSubmitting) {
            closeRejectModal();
        }
    }, [navigation.state, isSubmitting]);


    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    const formatDate = (date: string | Date) => new Date(date).toLocaleDateString();

    const renderValidationButton = (id: string, type: string) => (
        <div className="flex gap-2">

            <button
                disabled={isSubmitting}
                onClick={() => openRejectModal(id, type)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                title="Rejeter"
            >
                <X className="w-5 h-5" />
            </button>

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
        <div className="space-y-8 relative">
            {/* Modal for Rejection */}
            {rejectModalOpen && selectedRejection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Motif du refus</h3>
                        <p className="text-sm text-gray-500 mb-4">Veuillez indiquer la raison pour laquelle vous rejetez cet élément. Cette information sera transmise au créateur.</p>

                        <Form method="post" onSubmit={() => setTimeout(closeRejectModal, 100)}>
                            <input type="hidden" name="itemId" value={selectedRejection.id} />
                            <input type="hidden" name="type" value={selectedRejection.type} />
                            <input type="hidden" name="intent" value="reject" />

                            <textarea
                                name="reason"
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Ex: Montant incorrect, pièce justificative manquante..."
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeRejectModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Traitement...' : 'Confirmer le rejet'}
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}

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
            {/* Validation History Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Check className="w-5 h-5" /> Historique des Validations
                </h2>
                {validationHistory.length === 0 ? (
                    <p className="text-gray-500 italic">Aucun historique récent.</p>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {validationHistory.map((item: any, idx: number) => (
                                    <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(item.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.type === 'Paie' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                                item.type === 'Dépense' ? 'bg-orange-50 text-orange-700 ring-orange-600/20' :
                                                    item.type === 'Facture' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.description} <span className="text-gray-500 text-xs">({item.details})</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {formatCurrency(item.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.status.includes('Validé') ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                item.status.includes('Rejeté') ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                    'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate">
                                            {item.reason || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
