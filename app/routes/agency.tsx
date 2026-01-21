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

export default function AgencyDashboard() {
    const { user, agency, stats, enhancedStats } = useLoaderData<typeof loader>();
    const location = useLocation();

    if (!agency || !stats || !enhancedStats) {
        // ... existing error view ...
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Compte non configuré</h1>
                    <p className="text-gray-500 mb-6">
                        Votre compte utilisateur n'est associé à aucune agence ou fiche employé.
                        <br />
                        Veuillez contacter l'Administrateur pour vérifier que votre email employé correspond bien à votre email de connexion.
                    </p>
                    <Link to="/logout" className="text-blue-600 hover:underline">Se déconnecter</Link>
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

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);
    const maxRevenue = Math.max(...enhancedStats.revenueHistory.map(r => Math.max(r.income, r.expense)), 1000);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Direction Agence</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Agence: <span className="font-medium text-blue-600">{agency.name}</span>
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {/* ... Same KPI cards as before ... */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <TrendingUp className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">Ventes du Mois</dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">{formatCurrency(stats.monthlySales)}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-yellow-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">Validations en attente</dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">{stats.pendingValidations}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">Agents Actifs</dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">{stats.agentCount}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Building2 className="h-6 w-6 text-purple-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="truncate text-sm font-medium text-gray-500">Biens en Portefeuille</dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">{stats.propertyCount}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
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
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                        "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap"
                                    )}
                                >
                                    <item.icon className={cn(isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500", "-ml-0.5 mr-2 h-5 w-5")} />
                                    <span>{item.name}</span>
                                    {item.count ? (
                                        <span className={cn("ml-3 hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block", isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-900")}>
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
                            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-6">Performance Financière (6 mois)</h3>
                                <div className="h-64 flex items-end space-x-6 justify-between px-4">
                                    {enhancedStats.revenueHistory.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center flex-1 space-y-2 group">
                                            <div className="w-full flex space-x-1 items-end justify-center h-full">
                                                {/* Income Bar */}
                                                <div
                                                    className="w-4 sm:w-8 bg-blue-500 rounded-t-sm transition-all duration-500 hover:bg-blue-600 relative"
                                                    style={{ height: `${(data.income / maxRevenue) * 100}%` }}
                                                    title={`Revenus: ${formatCurrency(data.income)}`}
                                                ></div>
                                                {/* Expense Bar */}
                                                <div
                                                    className="w-4 sm:w-8 bg-red-400 rounded-t-sm transition-all duration-500 hover:bg-red-500 relative"
                                                    style={{ height: `${(data.expense / maxRevenue) * 100}%` }}
                                                    title={`Dépenses: ${formatCurrency(data.expense)}`}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">{data.month}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-center space-x-6">
                                    <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></span><span className="text-sm text-gray-600">Revenus</span></div>
                                    <div className="flex items-center"><span className="w-3 h-3 bg-red-400 rounded-sm mr-2"></span><span className="text-sm text-gray-600">Dépenses</span></div>
                                </div>
                            </div>

                            {/* Recent Activities */}
                            <div className="bg-white shadow rounded-lg border border-gray-200">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Activités Récentes</h3>
                                </div>
                                <ul className="divide-y divide-gray-200">
                                    {enhancedStats.activities.map((act) => (
                                        <li key={`${act.type}-${act.id}`} className="px-6 py-4 hover:bg-gray-50">
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-2 rounded-full flex-shrink-0 ${act.type === 'transaction' ? 'bg-green-100 text-green-600' :
                                                    act.type === 'property' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {act.type === 'transaction' ? <DollarSign className="w-5 h-5" /> :
                                                        act.type === 'property' ? <Building2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{act.title}</p>
                                                    <p className="text-xs text-gray-500">{new Date(act.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {enhancedStats.activities.length === 0 && (
                                        <li className="px-6 py-8 text-center text-gray-500">Aucune activité récente.</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Quick Actions & Top Agents */}
                        <div className="space-y-8">

                            {/* Control & Validation */}
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg shadow-lg p-6 text-white">
                                <h3 className="text-lg font-bold mb-4 flex items-center"><CheckCircle2 className="mr-2 h-5 w-5" /> Contrôle & Validation</h3>
                                <div className="space-y-3">
                                    <Link to="/agency/validations" className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded transition text-center flex justify-between items-center">
                                        <span>Factures & Dépenses</span>
                                        {stats.pendingValidations > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingValidations}</span>}
                                    </Link>
                                    <Link to="/agency/validations" className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded transition text-center text-sm">
                                        Voir tout le registre
                                    </Link>
                                </div>
                                <div className="mt-4 text-xs text-blue-200 border-t border-white/10 pt-2">
                                    En tant que Directeur, vous ne pouvez pas créer d'entrées, seulement les valider.
                                </div>
                            </div>

                            {/* Top Agents */}
                            <div className="bg-white shadow rounded-lg border border-gray-200">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Meilleurs Agents (Ventes)</h3>
                                </div>
                                <ul className="divide-y divide-gray-200">
                                    {enhancedStats.topAgents.map((agent, idx) => (
                                        <li key={idx} className="px-6 py-4 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 
                                                    ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-50 text-orange-700'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {agent.sales} ventes
                                            </span>
                                        </li>
                                    ))}
                                    {enhancedStats.topAgents.length === 0 && (
                                        <li className="px-6 py-8 text-center text-gray-500">Aucune donnée de vente.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg p-6 min-h-[400px]">
                        <Outlet />
                    </div>
                )}
            </main>
        </div>
    );
}
