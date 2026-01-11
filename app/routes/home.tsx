import type { Route } from "./+types/home";
import { getSession } from "~/sessions.server";
import { redirect, useLoaderData, Form } from "react-router";
import { getDashboardStats } from "~/services/dashboard.server";
import { Building2, Home as HomeIcon, Users, HardHat, Wallet, MonitorCog, PiggyBank, ArrowUpRight, ArrowDownRight, Briefcase } from "lucide-react";
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

  if (!hasGlobalDashboardAccess || !stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 py-12">
        <div className="text-center space-y-4 max-w-2xl px-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenue sur Elite ERP</h1>
          <p className="text-lg text-gray-600">
            Sélectionnez un module dans le menu latéral pour commencer.
          </p>
          <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
            <p className="font-semibold">💡 Astuce</p>
            <p>Vous avez accès à plusieurs modules. Utilisez la barre latérale gauche pour naviguer entre eux.</p>
          </div>
        </div>

        {/* Optional: We could render a grid of available modules here too, but sidebar does this well. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl px-6">
          {/* Logic to replicate Sidebar items as cards could go here, but for now Sidebar is sufficient and visible. */}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Notification Banner */}
      {/* @ts-ignore */}
      {stats && (useLoaderData() as any).employee?.assignmentNotification && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Briefcase className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Nouvelle affectation confirmée</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Votre affectation à l'agence <strong>{(useLoaderData() as any).employee.agency?.name}</strong> a été validée par la direction.
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Form method="post">
                    <input type="hidden" name="intent" value="dismiss_notification" />
                    <button
                      type="submit"
                      className="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                    >
                      Marquer comme vu
                    </button>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Biens Immobiliers"
          value={stats.properties.total.toString()}
          subtitle={`${stats.properties.available} disponibles`}
          icon={HomeIcon}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Chantiers en cours"
          value={stats.projects.toString()}
          subtitle="Projets actifs"
          icon={HardHat}
          iconClassName="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Personnel"
          value={stats.users.toString()}
          subtitle={`${stats.agencies} agences actives`}
          icon={Users}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatCard
          title="Tickets IT"
          value={stats.tickets.toString()}
          subtitle="Ouverts"
          icon={MonitorCog}
          iconClassName="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenus Totaux</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(stats.finance.income)}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3 text-green-600">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Dépenses Totales</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(stats.finance.expense)}</p>
            </div>
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <ArrowDownRight className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Clients</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{stats.clients}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6">
        <SalesChart />
      </div>
    </div>
  );
}
