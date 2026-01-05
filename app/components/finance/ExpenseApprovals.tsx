import type { ExpenseReport } from "~/types/finance_advanced";
import { Check, X, Receipt, Eye } from "lucide-react";
import { cn } from "~/lib/utils";

interface ExpenseApprovalsProps {
    expenses: ExpenseReport[];
}

export function ExpenseApprovals({ expenses }: ExpenseApprovalsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {expenses.map((expense) => (
                <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 flex">
                                <Receipt className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">{expense.submitterName}</h4>
                                <span className="text-xs text-gray-500 capitalize">{expense.category}</span>
                            </div>
                        </div>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                                expense.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        )}>
                            {expense.status === 'approved' ? 'Approuvé' : expense.status === 'rejected' ? 'Rejeté' : 'En attente'}
                        </span>
                    </div>

                    <div className="mb-4">
                        <p className="text-2xl font-bold text-gray-900">
                            {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(expense.amount)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                        <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                            <Eye className="h-4 w-4" />
                            Voir Reçu
                        </button>

                        {expense.status === 'pending' && (
                            <div className="flex gap-2">
                                <button className="p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100" title="Rejeter">
                                    <X className="h-5 w-5" />
                                </button>
                                <button className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100" title="Approuver">
                                    <Check className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
