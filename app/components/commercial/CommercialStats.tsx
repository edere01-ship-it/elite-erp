import { TrendingUp, TrendingDown, Users, CheckCircle, Clock } from "lucide-react";
import { cn } from "~/lib/utils";

interface StatItemProps {
    label: string;
    value: string;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    icon: React.ElementType;
    color: string;
}

function StatItem({ label, value, trend, trendDirection, icon: Icon, color }: StatItemProps) {
    return (
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="truncate text-sm font-medium text-gray-500">{label}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-3xl font-semibold text-gray-900">{value}</p>
                        {trend && (
                            <span
                                className={cn(
                                    "inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0",
                                    trendDirection === "up"
                                        ? "bg-green-100 text-green-800"
                                        : trendDirection === "down"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                )}
                            >
                                {trendDirection === "up" ? (
                                    <TrendingUp className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0" />
                                ) : trendDirection === "down" ? (
                                    <TrendingDown className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0" />
                                ) : null}
                                {trend}
                            </span>
                        )}
                    </div>
                </div>
                <div className={cn("rounded-lg p-3", color)}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );
}

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatItem
                label="Total Biens"
                value={stats.totalProperties.toString()}
                trend="Inventaire"
                trendDirection="neutral"
                icon={TrendingUp}
                color="bg-blue-500"
            />
            <StatItem
                label="Biens Disponibles"
                value={stats.availableProperties.toString()}
                trend={`${Math.round((stats.availableProperties / (stats.totalProperties || 1)) * 100)}%`}
                trendDirection="neutral"
                icon={CheckCircle}
                color="bg-green-500"
            />
            <StatItem
                label="Total Clients"
                value={stats.totalClients.toString()}
                trend="Base de données"
                trendDirection="up"
                icon={Users}
                color="bg-purple-500"
            />
            <StatItem
                label="Prospects Récents"
                value={stats.recentProspectsCount.toString()}
                trend="Ce mois"
                trendDirection="neutral"
                icon={Clock}
                color="bg-orange-500"
            />
        </div>
    );
}
