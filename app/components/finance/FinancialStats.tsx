import type { FinancialSummary } from "~/types/finance";
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "~/lib/utils";

interface FinancialStatsProps {
    summary: FinancialSummary;
}

export function FinancialStats({ summary }: FinancialStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    };

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Recettes Totales</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.totalIncome)}</p>
                    </div>
                    <div className="rounded-full bg-green-100 p-3 text-green-600">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                    <ArrowUpRight className="mr-1 h-4 w-4" />
                    <span className="font-medium">+12.5%</span>
                    <span className="ml-2 text-gray-500">vs mois dernier</span>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Dépenses Totales</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.totalExpenses)}</p>
                    </div>
                    <div className="rounded-full bg-red-100 p-3 text-red-600">
                        <TrendingDown className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-red-600">
                    <ArrowDownRight className="mr-1 h-4 w-4" />
                    <span className="font-medium">+4.1%</span>
                    <span className="ml-2 text-gray-500">vs mois dernier</span>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Résultat Net</p>
                        <p className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(summary.netIncome)}</p>
                    </div>
                    <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                        <PiggyBank className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 w-full rounded-full bg-gray-100 h-1.5 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '75%' }}></div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Marge bénéficiaire nette: 32%</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Trésorerie</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.cashBalance)}</p>
                    </div>
                    <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                        <Wallet className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-500">En attente:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(summary.pendingIncome)}</span>
                </div>
            </div>
        </div>
    );
}
