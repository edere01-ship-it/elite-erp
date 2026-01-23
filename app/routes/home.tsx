import type { Route } from "./+types/home";
import { getSession } from "~/sessions.server";
import { redirect, useLoaderData, Form, Link } from "react-router";
import { getDashboardStats } from "~/services/dashboard.server";
import {
  Building2,
  Home as HomeIcon,
  Users,
  HardHat,
  Wallet,
  MonitorCog,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  CheckCircle2,
  Clock
} from "lucide-react";
import { ClientOnly } from "~/components/ClientOnly";
import { StatCard } from "~/components/dashboard/StatCard";
import { SalesChart } from "~/components/dashboard/SalesChart";

// Action for dismissing notification
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) return null;

  if (intent === "dismiss_notification") {
    const { prisma } = await import("~/db.server");
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (employee) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { assignmentNotification: false }
      });
    }
    return { success: true };
  }
  return null;
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    throw redirect("/login");
  }

  const { prisma } = await import("~/db.server");

  // Verify user existence and permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, permissions: true }
  });

  if (!user) {
    throw redirect("/logout");
  }

  // Check if user is allowed to view the main dashboard (Global Stats)
  const hasGlobalDashboardAccess = user.role === 'admin' || user.permissions.includes("dashboard.view") || user.permissions.includes("admin.access");

  // Check if they have access to AT LEAST ONE module (Launcher Mode)
  // We effectively check if they are not just "user" with no permissions.
  const hasAnyModuleAccess = user.permissions.length > 0 || user.role !== 'user';

  if (!hasGlobalDashboardAccess && !hasAnyModuleAccess) {
    const { getRedirectPath } = await import("~/utils/permissions.server");
    const redirectPath = getRedirectPath(user);
    if (redirectPath !== "/") {
      throw redirect(redirectPath);
    }
  }

  // Check for notification status
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: { agency: true }
  });

  let stats = null;
  if (hasGlobalDashboardAccess) {
    try {
      stats = await getDashboardStats();
    } catch (e) {
      console.error("Failed to load dashboard stats:", e);
      // If stats fail, we can fall back to the launcher view (stats=null)
      // or just show empty stats. But launcher view is safer as it hides broken charts.
    }
  }

  return { stats, employee, hasGlobalDashboardAccess };
}

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Tableau de Bord - Elite Immobilier & Divers" },
    { name: "description", content: "ERP Dashboard" },
  ];
}

export default function Home() {
  const { stats, hasGlobalDashboardAccess } = useLoaderData<typeof loader>();
  const userInitials = "E"; // Could fetch from user name if available

  // PREMIUM DESIGN: Wrapper with animated background
  const PremiumBackground = () => (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-full bg-slate-50" />
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px] opacity-50 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[100px] opacity-50" />
    </div>
  );

  if (!hasGlobalDashboardAccess || !stats) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
        <PremiumBackground />

        <div className="text-center space-y-6 max-w-2xl relative z-10 animate-fade-in-up">
          <div className="mx-auto w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center shadow-xl rotate-3 hover:rotate-6 transition-transform duration-500 ring-4 ring-white/50">
            <span className="text-white font-bold text-4xl drop-shadow-md">E</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">
              Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Elite ERP</span>
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Votre plateforme centralisée de gestion immobilière.
            </p>
          </div>

          <div className="p-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl shadow-inner max-w-sm mx-auto">
            <div className="px-4 py-2 bg-white/80 rounded-lg text-sm text-blue-800 backdrop-blur-sm">
              👋 Sélectionnez un module ci-dessous pour commencer
            </div>
          </div>
        </div>

        {/* Launcher Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mt-12 px-4 relative z-10 perspective-1000">
          {/* Collaboration Card */}
          <Link
            to="?messenger=open"
            className="group relative flex flex-col items-center p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/50 hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-lg ring-1 ring-blue-200 group-hover:scale-110 transition-transform duration-300">
              💬
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">Collaboration</h3>
            <p className="text-slate-500 text-center text-sm font-medium">
              Messagerie, appels et réunions.
            </p>

            <div className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-lg shadow-blue-500/30">
              Accéder
            </div>
          </Link>
        </div>

        <div className="mt-12 text-slate-400 text-xs font-medium">
          © {new Date().getFullYear()} Elite Immobilier ERP • v2.5 Premium
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen pb-10 relative">
      <PremiumBackground />

      <div className="space-y-8 animate-fade-in relative z-10">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-6 rounded-3xl border border-white/50 shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Vue d'ensemble</h1>
            <p className="text-slate-500 font-medium">Bienvenue sur votre tableau de bord de direction.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full border border-white/60 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Mis à jour : {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Notification Banner */}
        {/* @ts-ignore */}
        {stats && (useLoaderData() as any).employee?.assignmentNotification && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border border-emerald-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-400/20 transition-all"></div>
            <div className="flex relative z-10">
              <div className="flex-shrink-0 bg-white p-2 rounded-xl shadow-sm">
                <Briefcase className="h-6 w-6 text-emerald-500" aria-hidden="true" />
              </div>
              <div className="ml-4">
                <h3 className="text-md font-bold text-emerald-900">Nouvelle affectation confirmée</h3>
                <div className="mt-1 text-sm text-emerald-700 max-w-xl">
                  <p>
                    Votre affectation à l'agence <strong className="text-emerald-900 bg-emerald-100 px-1 rounded">{(useLoaderData() as any).employee.agency?.name}</strong> a été validée par la direction.
                  </p>
                </div>
                <div className="mt-4">
                  <Form method="post">
                    <input type="hidden" name="intent" value="dismiss_notification" />
                    <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 hover:shadow-emerald-500/50 transition-all transform hover:-translate-y-0.5">
                      Marquer comme vu
                    </button>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Stats - Glass Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Biens Immobiliers"
            value={stats.properties.total.toString()}
            subtitle={`${stats.properties.available} disponibles`}
            icon={HomeIcon}
            className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
            iconClassName="bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
          />
          <StatCard
            title="Chantiers en cours"
            value={stats.projects.toString()}
            subtitle="Projets actifs"
            icon={HardHat}
            className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
            iconClassName="bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
          />
          <StatCard
            title="Personnel"
            value={stats.users.toString()}
            subtitle={`${stats.agencies} agences actives`}
            icon={Users}
            className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
            iconClassName="bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
          />
          <StatCard
            title="Tickets IT"
            value={stats.tickets.toString()}
            subtitle="Ouverts"
            icon={MonitorCog}
            className="bg-white/70 backdrop-blur-xl border-white/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl"
            iconClassName="bg-gradient-to-br from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/30"
          />
        </div>

        {/* Financial Overview - Premium Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl p-6 shadow-lg group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Revenus Totaux</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{formatCurrency(stats.finance.income)}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-3 text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
                <ArrowUpRight className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[70%] rounded-full opacity-80" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl p-6 shadow-lg group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Dépenses Totales</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{formatCurrency(stats.finance.expense)}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 p-3 text-red-600 shadow-inner group-hover:scale-110 transition-transform">
                <ArrowDownRight className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-[40%] rounded-full opacity-80" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl p-6 shadow-lg group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Clients & Prospects</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats.clients}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-3 text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[85%] rounded-full opacity-80" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="rounded-3xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <TrendingUp className="w-32 h-32 text-slate-900" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-6 relative z-10">Performance des Ventes</h3>
          <div className="relative z-10">
            <ClientOnly fallback={<div className="h-[400px] w-full flex items-center justify-center text-slate-400 font-medium animate-pulse">Chargement des données...</div>}>
              {() => <SalesChart />}
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper icon for decoration
import { TrendingUp } from "lucide-react";
