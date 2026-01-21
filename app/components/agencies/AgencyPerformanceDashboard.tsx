import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Building, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { cn, formatCurrency } from "~/lib/utils";
import { useState } from "react";
import { ClientOnly } from "~/components/ClientOnly";

interface AgencyPerformanceProps {
    performance: {
        name: string;
        turnover: number;
        expenses: number;
        netResult: number;
    }[];
}

export function AgencyPerformanceDashboard({ performance }: AgencyPerformanceProps) {
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Calculate totals
    const totalTurnover = performance.reduce((acc, curr) => acc + curr.turnover, 0);
    const totalExpenses = performance.reduce((acc, curr) => acc + curr.expenses, 0);
    const totalNet = totalTurnover - totalExpenses;

    // Sort by turnover for better visualization
    const sortedPerformance = [...performance].sort((a, b) => b.turnover - a.turnover);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100">
                    <p className="font-bold text-gray-800 mb-2">{label}</p>
                    <div className="space-y-1">
                        <p className="text-sm text-blue-600 flex items-center justify-between gap-4">
                            <span>Chiffre d'Affaires:</span>
                            <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
                        </p>
                        <p className="text-sm text-red-500 flex items-center justify-between gap-4">
                            <span>Dépenses:</span>
                            <span className="font-semibold">{formatCurrency(payload[1].value)}</span>
                        </p>
                        <div className="h-px bg-gray-200 my-1" />
                        <p className={`text-sm font-bold flex items-center justify-between gap-4 ${payload[0].value - payload[1].value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <span>Résultat Net:</span>
                            <span>{formatCurrency(payload[0].value - payload[1].value)}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg shadow-blue-500/20">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
                        <TrendingUp size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-blue-100 font-medium mb-1">Total Chiffre d'Affaires</p>
                        <h3 className="text-3xl font-bold">{formatCurrency(totalTurnover)}</h3>
                        <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            <TrendingUp size={14} /> Global
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-700 p-6 text-white shadow-lg shadow-red-500/20">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
                        <Wallet size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-red-100 font-medium mb-1">Total Dépenses</p>
                        <h3 className="text-3xl font-bold">{formatCurrency(totalExpenses)}</h3>
                        <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            <TrendingDown size={14} /> Charges
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "relative overflow-hidden rounded-2xl p-6 text-white shadow-lg",
                    totalNet >= 0
                        ? "bg-gradient-to-br from-green-500 to-emerald-700 shadow-green-500/20"
                        : "bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20"
                )}>
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
                        <DollarSign size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-green-100 font-medium mb-1">Résultat Net Global</p>
                        <h3 className="text-3xl font-bold">{formatCurrency(totalNet)}</h3>
                        <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            {totalNet >= 0 ? "Bénéfice" : "Déficit"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Building className="text-gray-400" />
                            Performance par Agence
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Comparatif des performances financières</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('chart')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                viewMode === 'chart' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Graphique
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                viewMode === 'table' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Tableau Détaillé
                        </button>
                    </div>
                </div>

                {viewMode === 'chart' ? (
                    <div className="h-[400px] w-full">
                        <ClientOnly fallback={<div className="h-full w-full flex items-center justify-center text-sm text-gray-500">Chargement...</div>}>
                            {() => (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <BarChart
                                        data={sortedPerformance}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        onMouseMove={(state: any) => {
                                            if (state.isTooltipActive) {
                                                setHoveredIndex(state.activeTooltipIndex);
                                            } else {
                                                setHoveredIndex(null);
                                            }
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `${value / 1000000}M`} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="turnover" name="Chiffre d'Affaires" radius={[4, 4, 0, 0]} barSize={32}>
                                            {sortedPerformance.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === hoveredIndex ? '#2563eb' : '#3b82f6'} style={{ transition: 'all 0.3s ease' }} />
                                            ))}
                                        </Bar>
                                        <Bar dataKey="expenses" name="Dépenses" radius={[4, 4, 0, 0]} barSize={32}>
                                            {sortedPerformance.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === hoveredIndex ? '#dc2626' : '#ef4444'} style={{ transition: 'all 0.3s ease' }} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ClientOnly>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agence</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Chiffre d'Affaires</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Dépenses</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Marge</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Résultat Net</th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedPerformance.map((agency, index) => {
                                    const margin = agency.turnover > 0 ? ((agency.netResult / agency.turnover) * 100) : 0;
                                    const isProfitable = agency.netResult >= 0;

                                    return (
                                        <tr key={agency.name} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={cn(
                                                        "flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg font-bold text-white",
                                                        index === 0 ? "bg-amber-400" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-400" : "bg-blue-100 text-blue-600"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                                                        <div className="text-xs text-gray-500">Succursale</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                                {formatCurrency(agency.turnover)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                                                {formatCurrency(agency.expenses)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                {margin.toFixed(1)}%
                                            </td>
                                            <td className={cn(
                                                "px-6 py-4 whitespace-nowrap text-right text-sm font-bold",
                                                isProfitable ? "text-green-600" : "text-red-600"
                                            )}>
                                                {formatCurrency(agency.netResult)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    margin > 20 ? "bg-green-100 text-green-800" :
                                                        margin > 0 ? "bg-blue-100 text-blue-800" :
                                                            "bg-red-100 text-red-800"
                                                )}>
                                                    {margin > 20 ? "Excellente" : margin > 0 ? "Correcte" : "Critique"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
