import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, Home } from "lucide-react";
import { cn } from "~/lib/utils";
import { StatCard } from "~/components/dashboard/StatCard";

interface CommercialStatsProps {
    stats: {
        totalProperties: number;
        availableProperties: number;
        totalClients: number;
        recentProspectsCount: number;
    };
}

export function CommercialStats({ stats }: CommercialStatsProps) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            <StatCard
                title="Total Biens"
                value={stats.totalProperties.toString()}
                subtitle="Inventaire global"
                icon={Home}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg shadow-blue-500/30"
            />

            <StatCard
                title="Biens Disponibles"
                value={stats.availableProperties.toString()}
                subtitle={`${Math.round((stats.availableProperties / (stats.totalProperties || 1)) * 100)}% du parc`}
                icon={CheckCircle}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-lg shadow-emerald-500/30"
            />

            <StatCard
                title="Total Clients"
                value={stats.totalClients.toString()}
                subtitle="Base de données active"
                icon={Users}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-purple-400 to-indigo-400 text-white shadow-lg shadow-purple-500/30"
            />

            <StatCard
                title="Prospects Récents"
                value={stats.recentProspectsCount.toString()}
                subtitle="Nouveaux ce mois-ci"
                icon={Clock}
                className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                iconClassName="bg-gradient-to-br from-orange-400 to-rose-400 text-white shadow-lg shadow-orange-500/30"
            />
        </div>
    );
}
