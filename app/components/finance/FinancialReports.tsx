import type { FinancialReportData } from "~/types/finance_advanced";
import { Download, Printer, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "~/lib/utils";

interface FinancialReportsProps {
    report: FinancialReportData;
}

export function FinancialReports({ report }: FinancialReportsProps) {
    const handlePrint = () => {
        alert("Impression du Compte de Résultat...");
    };

    const handleExportExcel = () => {
        alert("Export Excel du rapport...");
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Compte de Résultat - {report.period}</h3>
                </div>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Printer className="h-4 w-4" />
                        Imprimer
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                        <Download className="h-4 w-4" />
                        Export Excel
                    </button>
                </div>
            </div>

            <div className="p-8 max-w-4xl mx-auto space-y-8">
                {/* Header Report */}
                <div className="text-center mb-8 border-b pb-8">
                    <h2 className="text-2xl font-bold text-gray-900">État Financier Synthétique</h2>
                    <p className="text-gray-500">Période : {report.period}</p>
                </div>

                {/* Revenue Section */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Revenus</h4>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-900">Chiffre d'Affaires</span>
                        <span className="font-medium">{formatCurrency(report.revenue)}</span>
                    </div>
                </div>

                {/* COGS Section */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Coûts Directs</h4>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-900">Coût des ventes</span>
                        <span className="font-medium text-red-600">({formatCurrency(report.cogs)})</span>
                    </div>
                </div>

                {/* Gross Profit */}
                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-gray-900">Marge Brute</span>
                    <span className="font-bold text-gray-900">{formatCurrency(report.grossProfit)}</span>
                </div>

                {/* Expenses Section */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Dépenses Opérationnelles</h4>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-900">Charges d'exploitation</span>
                        <span className="font-medium text-red-600">({formatCurrency(report.operatingExpenses)})</span>
                    </div>
                </div>

                {/* Net Income */}
                <div className="bg-blue-50 p-6 rounded-xl flex justify-between items-center border border-blue-100">
                    <div>
                        <span className="block font-bold text-xl text-blue-900">Résultat Net</span>
                        <span className="text-sm text-blue-600">Bénéfice Net Comptable</span>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-2xl text-blue-700">{formatCurrency(report.netIncome)}</span>
                        <div className="flex items-center gap-1 text-xs text-green-600 justify-end mt-1">
                            <TrendingUp className="h-3 w-3" />
                            +15% vs N-1
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
