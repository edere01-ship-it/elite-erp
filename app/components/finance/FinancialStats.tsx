import type { FinancialSummary } from "~/types/finance";
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { StatCard } from "~/components/dashboard/StatCard";

interface FinancialStatsProps {
    summary: FinancialSummary;
}

export function FinancialStats({ summary }: FinancialStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    };

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            <StatCard
                title="Recettes Totales"
                value={formatCurrency(summary.totalIncome)}
                subtitle="Flux entrant"
                icon={TrendingUp}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                trend={{ value: "+12.5%", label: "vs mois dernier", positive: true }}
            />

            <StatCard
                title="Dépenses Totales"
                value={formatCurrency(summary.totalExpenses)}
                subtitle="Flux sortant"
                icon={TrendingDown}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-red-400 to-pink-500 text-white shadow-lg shadow-red-500/30"
                trend={{ value: "+4.1%", label: "vs mois dernier", positive: false }}
            />

            <StatCard
                title="Résultat Net"
                value={formatCurrency(summary.netIncome)}
                subtitle="Marge net: 32%"
                icon={PiggyBank}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
            />

            <StatCard
                title="Trésorerie"
                value={formatCurrency(summary.cashBalance)}
                subtitle={`En attente: ${formatCurrency(summary.pendingIncome)}`}
                icon={Wallet}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-purple-400 to-violet-500 text-white shadow-lg shadow-purple-500/30"
            />
        </div>
    );
}
