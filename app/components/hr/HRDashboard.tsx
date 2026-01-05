import { Users, CreditCard, Building, Activity, TrendingUp } from "lucide-react";
import { formatCurrency } from "~/lib/utils";

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
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Employees */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-6 w-6 text-gray-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">Total Employés</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">{stats.totalEmployees}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="font-medium text-green-700">{stats.activeEmployees} actifs</span>
                        </div>
                    </div>
                </div>

                {/* Masse Salariale */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CreditCard className="h-6 w-6 text-gray-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">Masse Salariale (Mensuelle)</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalPayroll)}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <span className="text-gray-500">Moyenne: {formatCurrency(stats.avgSalary)}</span>
                        </div>
                    </div>
                </div>

                {/* Assignments/Agencies - Placeholder for now could be agencies count */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Building className="h-6 w-6 text-gray-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="truncate text-sm font-medium text-gray-500">Agences / Chantier</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">--</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm">
                            <a href="#" className="font-medium text-blue-700 hover:text-blue-600">Voir détails</a>
                        </div>
                    </div>
                </div>

                {/* Validations */}
                <div className={`overflow-hidden rounded-lg shadow ${stats.pendingValidations > 0 ? "bg-red-50 border-2 border-red-500" : "bg-white"}`}>
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Activity className={`h-6 w-6 ${stats.pendingValidations > 0 ? "text-red-600" : "text-gray-400"}`} aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className={`truncate text-sm font-medium ${stats.pendingValidations > 0 ? "text-red-700" : "text-gray-500"}`}>Validations En Attente</dt>
                                    <dd>
                                        <div className={`text-lg font-medium ${stats.pendingValidations > 0 ? "text-red-900" : "text-gray-900"}`}>{stats.pendingValidations}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className={`${stats.pendingValidations > 0 ? "bg-red-100" : "bg-gray-50"} px-5 py-3`}>
                        <div className="text-sm">
                            <span className={`${stats.pendingValidations > 0 ? "text-red-800 font-bold" : "text-gray-500"}`}>
                                {stats.pendingValidations > 0 ? "Action requise ! (Validation DG/Agence)" : "Transmission requise"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Quick Actions Section */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Activité Récente</h3>
                </div>
                <div className="border-t border-gray-200">
                    <ul role="list" className="divide-y divide-gray-200">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, idx) => (
                                <li key={idx} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <p className="truncate text-sm font-medium text-blue-600">{activity.description}</p>
                                        <div className="ml-2 flex flex-shrink-0">
                                            <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">{activity.date}</p>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-4 text-sm text-gray-500">Aucune activité récente.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
