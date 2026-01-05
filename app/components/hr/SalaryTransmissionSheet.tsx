import type { PayrollRun, PayrollItem } from "~/types/employee";
import { FileText, Send, Printer, Plus, Save, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { cn, formatCurrency } from "~/lib/utils";

interface SalaryTransmissionSheetProps {
    payrollRun: PayrollRun | null;
    currentMonth: string; // YYYY-MM
    onMonthChange: (month: string) => void;
}

export function SalaryTransmissionSheet({ payrollRun, currentMonth, onMonthChange }: SalaryTransmissionSheetProps) {
    const generateFetcher = useFetcher();
    const updateItemFetcher = useFetcher();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PayrollItem | null>(null);
    const [editForm, setEditForm] = useState({
        bonus: 0,
        its: 0,
        cnps: 0,
        salaryAdvance: 0,
        latenessDeduction: 0,
        deduction: 0
    });

    const isGenerating = generateFetcher.state === "submitting";

    const handleGenerate = () => {
        generateFetcher.submit(
            { intent: "generate_payroll", month: currentMonth },
            { method: "post" }
        );
    };

    const openEditModal = (item: PayrollItem) => {
        setSelectedItem(item);
        setEditForm({
            bonus: item.bonus,
            its: item.its || 0,
            cnps: item.cnps || 0,
            salaryAdvance: item.salaryAdvance || 0,
            latenessDeduction: item.latenessDeduction || 0,
            deduction: item.deduction
        });
        setIsModalOpen(true);
    };

    const handleSaveModal = () => {
        if (!selectedItem) return;
        updateItemFetcher.submit(
            {
                intent: "update_payroll_item",
                itemId: selectedItem.id,
                bonus: editForm.bonus.toString(),
                its: editForm.its.toString(),
                cnps: editForm.cnps.toString(),
                salaryAdvance: editForm.salaryAdvance.toString(),
                latenessDeduction: editForm.latenessDeduction.toString(),
                deduction: editForm.deduction.toString()
            },
            { method: "post" }
        );
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleValidate = () => {
        if (!payrollRun) return;
        if (confirm("Voulez-vous vraiment valider cette fiche de paie ? Elle ne sera plus modifiable.")) {
            generateFetcher.submit(
                { intent: "validate_payroll", runId: payrollRun.id },
                { method: "post" }
            );
        }
    };

    // Calculate estimated net for modal preview
    const estimatedNet = selectedItem
        ? selectedItem.baseSalary + editForm.bonus - (editForm.its + editForm.cnps + editForm.salaryAdvance + editForm.latenessDeduction + editForm.deduction)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">Fiche de Transmission des Salaires</h2>
                    <p className="text-sm text-gray-500">Générez et transmettez la liste des salaires au service financier.</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="month"
                        value={currentMonth}
                        onChange={(e) => onMonthChange(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            {!payrollRun ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucune fiche de paie</h3>
                    <p className="mt-1 text-sm text-gray-500">Aucune fiche de paie n'a été générée pour cette période.</p>
                    <div className="mt-6">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Générer la fiche de paie
                        </button>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <span className="font-medium text-gray-900">Période: {currentMonth}</span>
                            </div>
                            <span className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                payrollRun.status === 'paid' ? "bg-green-100 text-green-800" :
                                    payrollRun.status === 'direction_approved' ? "bg-purple-100 text-purple-800" :
                                        payrollRun.status === 'finance_validated' ? "bg-blue-100 text-blue-800" :
                                            payrollRun.status === 'pending_agency' ? "bg-yellow-100 text-yellow-800" :
                                                payrollRun.status === 'pending_general' ? "bg-orange-100 text-orange-800" :
                                                    "bg-gray-100 text-gray-800"
                            )}>
                                {payrollRun.status === 'paid' ? "Payé" :
                                    payrollRun.status === 'direction_approved' ? "Approuvé (Dir. Générale)" :
                                        payrollRun.status === 'finance_validated' ? "Validé (Finance)" :
                                            payrollRun.status === 'pending_agency' ? "Attente Agence" :
                                                payrollRun.status === 'pending_general' ? "Attente DG" :
                                                    "Brouillon"}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <Printer className="h-4 w-4" />
                                Imprimer
                            </button>
                            {payrollRun.status === 'draft' ? (
                                <button
                                    onClick={handleValidate}
                                    className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    <Send className="h-4 w-4" />
                                    Transmettre à la Finance
                                </button>
                            ) : (
                                payrollRun.status !== 'paid' && (
                                    <button
                                        onClick={() => {
                                            if (confirm("Voulez-vous vraiment rouvrir cette fiche de paie pour modification ? Cela annulera la validation actuelle.")) {
                                                generateFetcher.submit(
                                                    { intent: "revert_payroll_to_draft", runId: payrollRun.id },
                                                    { method: "post" }
                                                );
                                            }
                                        }}
                                        className="flex items-center gap-2 rounded-md bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-200"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Rouvrir / Modifier
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employé</th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Base</th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Primes</th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">ITS</th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">CNPS</th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Avance</th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 text-red-600">Retard</th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Autre</th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-900">Net</th>
                                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {payrollRun.items.map((item) => {
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{item.employeeName}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">{formatCurrency(item.baseSalary)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-green-600">{formatCurrency(item.bonus)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">{formatCurrency(item.its || 0)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">{formatCurrency(item.cnps || 0)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">{formatCurrency(item.salaryAdvance || 0)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-red-600">{formatCurrency(item.latenessDeduction || 0)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">{formatCurrency(item.deduction)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-bold text-gray-900">{formatCurrency(item.netSalary)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                                            {payrollRun.status === 'draft' && (
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
                                                >
                                                    Modifier
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-right text-sm font-medium text-gray-500">Total Masse Salariale</td>
                                <td className="px-3 py-4 text-right text-sm font-bold text-blue-600">
                                    {formatCurrency(payrollRun.totalAmount)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {isModalOpen && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Éditer Fiche de Paie
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Fermer</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-md mb-4">
                                <p className="text-sm font-medium text-gray-700">Employé: <span className="text-gray-900">{selectedItem.employeeName}</span></p>
                                <p className="text-sm text-gray-500">Salaire de Base: {formatCurrency(selectedItem.baseSalary)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primes / Bonus</label>
                                    <div className="relative rounded-md shadow-sm">
                                        <input
                                            type="number"
                                            value={editForm.bonus}
                                            onChange={e => setEditForm({ ...editForm, bonus: parseFloat(e.target.value) || 0 })}
                                            className="block w-full rounded-md border-gray-300 pl-3 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="text-gray-500 sm:text-sm">FCFA</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ITS (Impôt)</label>
                                    <input
                                        type="number"
                                        value={editForm.its}
                                        onChange={e => setEditForm({ ...editForm, its: parseFloat(e.target.value) || 0 })}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPS</label>
                                    <input
                                        type="number"
                                        value={editForm.cnps}
                                        onChange={e => setEditForm({ ...editForm, cnps: parseFloat(e.target.value) || 0 })}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Avance Salaire</label>
                                    <input
                                        type="number"
                                        value={editForm.salaryAdvance}
                                        onChange={e => setEditForm({ ...editForm, salaryAdvance: parseFloat(e.target.value) || 0 })}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-1">Retards</label>
                                    <input
                                        type="number"
                                        value={editForm.latenessDeduction}
                                        onChange={e => setEditForm({ ...editForm, latenessDeduction: parseFloat(e.target.value) || 0 })}
                                        className="block w-full rounded-md border-red-300 text-red-900 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Autres Déductions</label>
                                    <input
                                        type="number"
                                        value={editForm.deduction}
                                        onChange={e => setEditForm({ ...editForm, deduction: parseFloat(e.target.value) || 0 })}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                                <span className="font-semibold text-gray-900">Net Estimé:</span>
                                <span className="text-xl font-bold text-blue-600">{formatCurrency(estimatedNet)}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSaveModal}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
