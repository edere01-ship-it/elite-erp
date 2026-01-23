import { Users, CreditCard, Building, Activity, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "~/lib/utils";
import { StatCard } from "~/components/dashboard/StatCard";

interface HRDashboardProps {
    stats: {
        totalEmployees: number;
        activeEmployees: number;
        totalPayroll: number;
        pendingValidations: number;
        avgSalary: number;
    };
    recentActivity: any[];
}

export function HRDashboard({ stats, recentActivity }: HRDashboardProps) {
    return (
        <div className="space-y-8 animate-fade-in relative z-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Employés"
                    value={stats.totalEmployees.toString()}
                    subtitle={`${stats.activeEmployees} actifs`}
                    icon={Users}
                    className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                    iconClassName="bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg shadow-blue-500/30"
                />

                <StatCard
                    title="Masse Salariale"
                    value={formatCurrency(stats.totalPayroll)}
                    subtitle={`Moyenne: ${formatCurrency(stats.avgSalary)}`}
                    icon={CreditCard}
                    className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                    iconClassName="bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-lg shadow-emerald-500/30"
                />

                {/* Assignments/Agencies - Placeholder for now could be agencies count */}
                <StatCard
                    title="Agences / Chantier"
                    value="--"
                    subtitle="Voir détails"
                    icon={Building}
                    className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                    iconClassName="bg-gradient-to-br from-purple-400 to-indigo-400 text-white shadow-lg shadow-purple-500/30"
                />

                <StatCard
                    title="Validations"
                    value={stats.pendingValidations.toString()}
                    subtitle={stats.pendingValidations > 0 ? "Action requise !" : "Aucune attente"}
                    icon={Activity}
                    className={`backdrop-blur-xl border shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl ${stats.pendingValidations > 0 ? "bg-red-50/80 border-red-200" : "bg-white/70 border-white/50"}`}
                    iconClassName={`shadow-lg text-white ${stats.pendingValidations > 0 ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30 animate-pulse" : "bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/30"}`}
                />
            </div>

            {/* Recent Activity / Quick Actions Section */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">Activité Récente</h3>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="divide-y divide-slate-100/50">
                    <ul role="list" className="divide-y divide-slate-100/50">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, idx) => (
                                <li key={idx} className="px-8 py-5 hover:bg-white/40 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 truncate">{activity.description}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                {activity.date}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-8 py-10 text-center text-slate-500 italic">Aucune activité récente.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
