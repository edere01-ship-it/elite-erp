import { type LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData, useLocation } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { getAgencyStats, getAgencyEnhancedStats } from "~/services/agency.server";
import { prisma } from "~/db.server";
import {
    LayoutDashboard,
    Users,
    Building2,
    CheckCircle2,
    TrendingUp,
    FileText,
    AlertCircle,
    DollarSign,
    HardHat,
    Calendar
} from "lucide-react";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_VIEW);

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        include: { agency: true }
    });

    let agencyId = employee?.agencyId;

    // Admin Fallback: If no agency linked, use the first one available
    if (!agencyId && (user.role === "admin" || user.permissions.includes("admin.access"))) {
        const firstAgency = await prisma.agency.findFirst();
        if (firstAgency) agencyId = firstAgency.id;
    }

    if (!agencyId) {
        return { user, agency: null, stats: null, enhancedStats: null };
    }

    const [stats, enhancedStats] = await Promise.all([
        getAgencyStats(agencyId),
        getAgencyEnhancedStats(agencyId)
    ]);

    // Fetch agency details if we only had the ID
    const agency = employee?.agency ?? await prisma.agency.findUnique({ where: { id: agencyId } });

    return { user, agency, stats, enhancedStats };
}

import { PremiumBackground } from "~/components/ui/PremiumBackground";
import { StatCard } from "~/components/dashboard/StatCard";

export default function AgencyDashboard() {
    const { user, agency, stats, enhancedStats } = useLoaderData<typeof loader>();
    const location = useLocation();

    if (!agency || !stats || !enhancedStats) {
        return (
            <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
                <PremiumBackground />
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 max-w-md w-full text-center relative z-10 animate-fade-in-up">
                    <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Compte non configuré</h1>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        Votre compte utilisateur n'est associé à aucune agence ou fiche employé.
                        <br />
                        Veuillez contacter l'Administrateur pour vérification.
                    </p>
                    <Link to="/logout" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all">
                        Se déconnecter
                    </Link>
                </div>
            </div>
        );
    }

    const navigation = [
        { name: 'Tableau de bord', href: '/agency', icon: LayoutDashboard, end: true },
        { name: 'Finance', href: '/agency/finance', icon: DollarSign },
        { name: 'Personnel', href: '/agency/employees', icon: Users },
        { name: 'Projets', href: '/agency/projects', icon: HardHat },
        { name: 'Biens', href: '/agency/properties', icon: Building2 },
        { name: 'Commercial', href: '/agency/commercial', icon: Calendar },
        { name: 'Validations', href: '/agency/validations', icon: CheckCircle2, count: stats.pendingValidations },
    ];

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
    const maxRevenue = Math.max(...enhancedStats.revenueHistory.map(r => Math.max(r.income, r.expense)), 1000);

    return (
        <div className="min-h-screen relative font-sans text-slate-800 pb-10">
            <PremiumBackground />

            <header className="relative z-10 bg-white/70 backdrop-blur-md shadow-sm border-b border-white/50 sticky top-0">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Direction Agence</h1>
                            <p className="text-sm text-slate-500 font-medium">
                                Agence: <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{agency.name}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            En ligne
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard
                        title="Ventes du Mois"
                        value={formatCurrency(stats.monthlySales)}
                        icon={TrendingUp}
                        className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                        iconClassName="bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30"
                    />
                    <StatCard
                        title="Validations"
                        value={stats.pendingValidations.toString()}
                        subtitle="En attente"
                        icon={AlertCircle}
                        className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                        iconClassName="bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-lg shadow-orange-500/30"
                    />
                    <StatCard
                        title="Agents Actifs"
                        value={stats.agentCount.toString()}
                        icon={Users}
                        className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                        iconClassName="bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg shadow-blue-500/30"
                    />
                    <StatCard
                        title="Biens"
                        value={stats.propertyCount.toString()}
                        subtitle="En portefeuille"
                        icon={Building2}
                        className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
                        iconClassName="bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-lg shadow-emerald-500/30"
                    />
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8">
                    <nav className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide" aria-label="Tabs">
                        {navigation.map((item) => {
                            const isActive = item.end
                                ? location.pathname === item.href
                                : location.pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                            : "bg-white/60 text-slate-600 hover:bg-white/80 hover:text-blue-600 border border-white/50",
                                        "group inline-flex items-center px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200"
                                    )}
                                >
                                    <item.icon className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-blue-500", "mr-2 h-4 w-4")} />
                                    <span>{item.name}</span>
                                    {item.count ? (
                                        <span className={cn("ml-2 rounded-full py-0.5 px-2 text-xs font-bold", isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600")}>
                                            {item.count}
                                        </span>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Dashboard Home Content */}
                {location.pathname === '/agency' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN: Revenue Chart */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                <h3 className="text-xl font-bold text-slate-800 mb-8 relative z-10">Performance Financière (6 mois)</h3>
                                <div className="h-64 flex items-end space-x-6 justify-between px-4 relative z-10">
                                    {enhancedStats.revenueHistory.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center flex-1 space-y-3 group cursor-default">
                                            <div className="w-full flex space-x-2 items-end justify-center h-full">
                                                {/* Income Bar */}
                                                <div
                                                    className="w-3 sm:w-6 bg-blue-500 rounded-t-lg transition-all duration-500 group-hover:bg-blue-600 relative group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                                    style={{ height: `${Math.max((data.income / maxRevenue) * 100, 4)}%` }}
                                                    title={`Revenus: ${formatCurrency(data.income)}`}
                                                ></div>
                                                {/* Expense Bar */}
                                                <div
                                                    className="w-3 sm:w-6 bg-red-400 rounded-t-lg transition-all duration-500 group-hover:bg-red-500 relative group-hover:shadow-[0_0_15px_rgba(248,113,113,0.5)]"
                                                    style={{ height: `${Math.max((data.expense / maxRevenue) * 100, 4)}%` }}
                                                    title={`Dépenses: ${formatCurrency(data.expense)}`}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-slate-500 font-bold uppercase">{data.month}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex justify-center gap-8">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100"><span className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></span><span className="text-sm font-medium text-slate-600">Revenus</span></div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg border border-red-100"><span className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></span><span className="text-sm font-medium text-slate-600">Dépenses</span></div>
                                </div>
                            </div>

                            {/* Recent Activities */}
                            <div className="bg-white/70 backdrop-blur-xl shadow-lg rounded-3xl border border-white/50 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100">
                                    <h3 className="text-xl font-bold text-slate-800">Activités Récentes</h3>
                                </div>
                                <ul className="divide-y divide-slate-100/50">
                                    {enhancedStats.activities.map((act) => (
                                        <li key={`${act.type}-${act.id}`} className="px-8 py-5 hover:bg-white/40 transition-colors">
                                            <div className="flex items-center gap-5">
                                                <div className={`p-3 rounded-2xl shadow-sm ${act.type === 'transaction' ? 'bg-emerald-100 text-emerald-600' :
                                                    act.type === 'property' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {act.type === 'transaction' ? <DollarSign className="w-5 h-5" /> :
                                                        act.type === 'property' ? <Building2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate mb-0.5">{act.title}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{new Date(act.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {enhancedStats.activities.length === 0 && (
                                        <li className="px-8 py-12 text-center text-slate-500 italic">Aucune activité récente.</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Quick Actions & Top Agents */}
                        <div className="space-y-8">

                            {/* Control & Validation */}
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-xl shadow-indigo-500/20 p-8 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                                <h3 className="text-xl font-bold mb-6 flex items-center relative z-10">
                                    <div className="bg-white/20 p-2 rounded-lg mr-3 shadow-inner"><CheckCircle2 className="h-5 w-5" /></div>
                                    Contrôle & Validation
                                </h3>

                                <div className="space-y-4 relative z-10">
                                    <Link to="/agency/validations" className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:-translate-y-0.5 flex justify-between items-center backdrop-blur-sm">
                                        <span>Factures & Dépenses</span>
                                        {stats.pendingValidations > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-red-500/40 animate-pulse">{stats.pendingValidations}</span>}
                                    </Link>
                                    <Link to="/agency/validations" className="block w-full bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-100 hover:text-white font-medium py-3 px-4 rounded-xl transition text-center text-sm">
                                        Voir tout le registre
                                    </Link>
                                </div>
                                <div className="mt-6 text-xs text-indigo-200/80 border-t border-white/10 pt-4 font-medium">
                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                    Mode Directeur : Validation uniquement.
                                </div>
                            </div>

                            {/* Top Agents */}
                            <div className="bg-white/70 backdrop-blur-xl shadow-lg rounded-3xl border border-white/50 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800">Meilleurs Agents</h3>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ventes</span>
                                </div>
                                <ul className="divide-y divide-slate-100/50">
                                    {enhancedStats.topAgents.map((agent, idx) => (
                                        <li key={idx} className="px-8 py-5 hover:bg-white/40 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className={`flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold mr-4 shadow-sm
                                                        ${idx === 0 ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50' :
                                                            idx === 1 ? 'bg-slate-100 text-slate-700' : 'bg-orange-50 text-orange-700'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-800">{agent.name}</span>
                                                </div>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-100 shadow-sm">
                                                    {agent.sales} ventes
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                    {enhancedStats.topAgents.length === 0 && (
                                        <li className="px-8 py-10 text-center text-slate-400 italic">Aucune donnée de vente.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-6 min-h-[400px] border border-white/60 animate-fade-in-up">
                        <Outlet />
                    </div>
                )}
            </main>
        </div>
    );
}
