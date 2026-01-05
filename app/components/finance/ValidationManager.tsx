import { useState } from "react";
import { Check, X, Building, Users, Home, Loader2, AlertCircle } from "lucide-react";
import { Form, useNavigation } from "react-router";

interface ValidationManagerProps {
    pendingPayrolls: any[];
    pendingInvoices: any[];
    pendingExpenses: any[];
}

export function ValidationManager({ pendingPayrolls, pendingInvoices, pendingExpenses }: ValidationManagerProps) {
    const [activeTab, setActiveTab] = useState<'payroll' | 'revenue' | 'expense'>('payroll');
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    };

    return (
        <div className="space-y-6">
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
                                                    <Form method="post" className="inline">
                                                        <input type="hidden" name="intent" value="reject-payroll" />
                                                        <input type="hidden" name="id" value={run.id} />
                                                        <button
                                                            type="submit"
                                                            disabled={isSubmitting}
                                                            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                                                            title="Rejeter"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </Form>
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
                                            <Form method="post" className="inline">
                                                <input type="hidden" name="intent" value="reject-invoice" />
                                                <input type="hidden" name="id" value={inv.id} />
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                    title="Rejeter (Retour au brouillon)"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </Form>
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
                                        <Form method="post" className="flex gap-2">
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
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                name="action"
                                                value="reject"
                                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                title="Rejeter"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </Form>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}
