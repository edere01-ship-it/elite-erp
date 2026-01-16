import { useState } from "react";
import { Check, X, Building, Users, Home, Loader2, AlertCircle } from "lucide-react";
import { Form, useNavigation } from "react-router";

interface ValidationManagerProps {
    pendingPayrolls: any[];
    pendingInvoices: any[];
    pendingExpenses: any[];
    validationHistory: any[];
}

export function ValidationManager({ pendingPayrolls, pendingInvoices, pendingExpenses, validationHistory }: ValidationManagerProps) {
    const [activeTab, setActiveTab] = useState<'payroll' | 'revenue' | 'expense' | 'history'>('payroll');
    const [rejectionState, setRejectionState] = useState<{
        isOpen: boolean;
        itemId: string | null;
        intent: string;
        sourceType?: string; // Special case for expenses (project vs expense_report)
    }>({ isOpen: false, itemId: null, intent: "" });

    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    };

    const openRejectionModal = (itemId: string, intent: string, sourceType?: string) => {
        setRejectionState({ isOpen: true, itemId, intent, sourceType });
    };

    const closeRejectionModal = () => {
        setRejectionState({ isOpen: false, itemId: null, intent: "" });
    };

    return (
        <div className="space-y-6 relative">
            {/* Rejection Modal */}
            {rejectionState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={closeRejectionModal} />
                    <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <Form method="post" onSubmit={closeRejectionModal}>
                            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                                            Motif du rejet
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 mb-4">
                                                Veuillez indiquer la raison du rejet. Cet élément retournera à l'étape précédente pour correction.
                                            </p>
                                            <input type="hidden" name="intent" value={rejectionState.intent} />
                                            <input type="hidden" name="id" value={rejectionState.itemId || ""} />
                                            {rejectionState.sourceType && <input type="hidden" name="sourceType" value={rejectionState.sourceType} />}
                                            {/* For expenses, we need action=reject */}
                                            {rejectionState.intent === "validate-expense" && <input type="hidden" name="action" value="reject" />}

                                            <textarea
                                                name="reason"
                                                required
                                                rows={3}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                                                placeholder="Ex: Erreur de montant, justificatif manquant..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                    type="submit"
                                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                                >
                                    Rejeter
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                    onClick={closeRejectionModal}
                                >
                                    Annuler
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('payroll')}
                        className={`${activeTab === 'payroll' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'} border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Salaires à Valider
                        {pendingPayrolls.length > 0 && (
                            <span className="ml-2 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                                {pendingPayrolls.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`${activeTab === 'revenue' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'} border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Revenus à Encaisser
                        {pendingInvoices.length > 0 && (
                            <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                {pendingInvoices.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('expense')}
                        className={`${activeTab === 'expense' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'} border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                    >
                        <Building className="mr-2 h-4 w-4" />
                        Dépenses Chantiers
                        {pendingExpenses.length > 0 && (
                            <span className="ml-2 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                                {pendingExpenses.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`${activeTab === 'history' ? 'border-gray-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'} border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Historique Validations
                    </button>
                </nav>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Payrolls Tab */}
                {activeTab === 'payroll' && (
                    <ul className="divide-y divide-gray-200">
                        {pendingPayrolls.length === 0 ? (
                            <li className="p-6 text-center text-gray-500">Aucun salaire en attente de validation.</li>
                        ) : (
                            pendingPayrolls.map((run) => (
                                <li key={run.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">Paie {run.month}/{run.year}</p>
                                        <p className="text-sm text-gray-500">{run.itemCount} employés - Statut: {run.status}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-gray-900">{formatMoney(run.totalAmount)}</span>
                                        <div className="flex gap-2">
                                            {run.status === 'direction_approved' && (
                                                <>
                                                    <Form method="post" className="inline">
                                                        <input type="hidden" name="intent" value="validate-payroll-finance" />
                                                        <input type="hidden" name="id" value={run.id} />
                                                        <button
                                                            type="submit"
                                                            disabled={isSubmitting}
                                                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                            title="Validation Financière"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                            Valider (Fin.)
                                                        </button>
                                                    </Form>
                                                    <button
                                                        type="button"
                                                        onClick={() => openRejectionModal(run.id, "reject-payroll")}
                                                        disabled={isSubmitting}
                                                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                                                        title="Rejeter"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}

                                            {run.status === 'finance_validated' && (
                                                <Form method="post" className="inline">
                                                    <input type="hidden" name="intent" value="pay-payroll" />
                                                    <input type="hidden" name="id" value={run.id} />
                                                    <input type="hidden" name="amount" value={run.totalAmount} />
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                                                        title="Payer"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                        Payer
                                                    </button>
                                                </Form>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                )}

                {/* Revenue Tab */}
                {activeTab === 'revenue' && (
                    <ul className="divide-y divide-gray-200">
                        {pendingInvoices.length === 0 ? (
                            <li className="p-6 text-center text-gray-500">Aucun revenu en attente de validation.</li>
                        ) : (
                            pendingInvoices.map((inv) => (
                                <li key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">{inv.number} - {inv.clientName}</p>
                                        <p className="text-sm text-gray-500">Émis le {inv.issueDate}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-green-600">{formatMoney(inv.total)}</span>
                                        <div className="flex gap-2">
                                            <Form method="post" className="inline">
                                                <input type="hidden" name="intent" value="validate-invoice" />
                                                <input type="hidden" name="id" value={inv.id} />
                                                <input type="hidden" name="amount" value={inv.total} />
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                    title="Confirmer l'encaissement"
                                                >
                                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </button>
                                            </Form>
                                            <button
                                                type="button"
                                                onClick={() => openRejectionModal(inv.id, "reject-invoice")}
                                                disabled={isSubmitting}
                                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                title="Rejeter (Retour au brouillon)"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                )}

                {/* Expenses Tab */}
                {activeTab === 'expense' && (
                    <ul className="divide-y divide-gray-200">
                        {pendingExpenses.length === 0 ? (
                            <li className="p-6 text-center text-gray-500">Aucune dépense en attente de validation.</li>
                        ) : (
                            pendingExpenses.map((exp) => (
                                <li key={exp.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">{exp.description}</p>
                                        <p className="text-sm text-gray-500">
                                            {exp.submitterName} {exp.projectName ? `- Projet: ${exp.projectName}` : ''} ({exp.date})
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-red-600">{formatMoney(exp.amount)}</span>
                                        <div className="flex gap-2">
                                            <Form method="post" className="inline">
                                                <input type="hidden" name="intent" value="validate-expense" />
                                                <input type="hidden" name="id" value={exp.id} />
                                                <input type="hidden" name="amount" value={exp.amount} />
                                                <input type="hidden" name="description" value={exp.description} />
                                                <input type="hidden" name="sourceType" value={exp.sourceType || 'expense_report'} />
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                    title="Approuver"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            </Form>
                                            <button
                                                type="button"
                                                onClick={() => openRejectionModal(exp.id, "validate-expense", exp.sourceType || 'expense_report')}
                                                // Note: intent is validate-expense, but modal adds action=reject
                                                disabled={isSubmitting}
                                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                title="Rejeter"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Émetteur</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {validationHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Aucun historique de validation.</td>
                                    </tr>
                                ) : (
                                    validationHistory.map((item: any, idx: number) => (
                                        <tr key={item.id + idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.type === 'Paie' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                                        item.type === 'Dépense' ? 'bg-orange-50 text-orange-700 ring-orange-600/20' :
                                                            'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.emitter}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatMoney(item.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.status.includes('Validé') ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                    item.status.includes('Rejeté') ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                        'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
