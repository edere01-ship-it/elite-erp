import { TrendingUp, Building, Users, Wallet, HardHat } from "lucide-react";
import { StatCard } from "~/components/dashboard/StatCard";

interface DirectionStatsProps {
    stats: {
        turnover: number;
        propertiesCount: number;
        activeProjectsCount: number;
        salaryMass: number;
    };
}

export function DirectionStats({ stats }: DirectionStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            <StatCard
                title="Chiffre d'Affaires"
                value={formatCurrency(stats.turnover)}
                subtitle="Performance globale"
                icon={TrendingUp}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30"
                trend={{ value: "+8.8%", label: "vs N-1", positive: true }}
            />

            <StatCard
                title="Biens Disponibles"
                value={stats.propertiesCount.toString()}
                subtitle="Locations / Ventes"
                icon={Building}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
            />

            <StatCard
                title="Projets en cours"
                value={stats.activeProjectsCount.toString()}
                subtitle="En construction"
                icon={HardHat}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"
            />

            <StatCard
                title="Masse Salariale"
                value={formatCurrency(stats.salaryMass)}
                subtitle="Mensuel estimé"
                icon={Users}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-lg shadow-purple-500/30"
            />
        </div>
    );
}
