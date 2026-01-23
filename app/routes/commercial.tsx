import type { Route } from "./+types/commercial";
import { useLoaderData, type LoaderFunctionArgs, type ActionFunctionArgs, useNavigation, useSubmit, redirect } from "react-router";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Plus, Clock } from "lucide-react";
// import { prisma } from "~/db.server";
import { ClientList } from "~/components/clients/ClientList";
import { ClientForm } from "~/components/clients/ClientForm";
import { CommercialStats } from "~/components/commercial/CommercialStats";
import { cn } from "~/lib/utils";
import { PremiumBackground } from "~/components/ui/PremiumBackground";

import { getSession } from "~/sessions.server";
import { PERMISSIONS } from "~/utils/permissions";
// Server imports moved to dynamic imports inside loader/action

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Directeur Commercial - Elite Immobilier & Divers" },
        { name: "description", content: "Tableau de bord de la direction commerciale" },
    ];
}

export async function action({ request }: ActionFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create" || intent === "update") {
        const { requirePermission } = await import("~/utils/permissions.server");
        if (intent === "create") await requirePermission(userId!, PERMISSIONS.COMMERCIAL_CREATE);
        if (intent === "update") await requirePermission(userId!, PERMISSIONS.COMMERCIAL_EDIT);

        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const type = formData.get("type") as string;
        const status = formData.get("status") as string;
        const notes = formData.get("notes") as string;

        const data = {
            firstName,
            lastName,
            email,
            phone,
            type,
            status,
            notes
        };

        if (intent === "create") {
            const { prisma } = await import("~/db.server");
            await prisma.client.create({ data });
        } else {
            const id = formData.get("id") as string;
            const { prisma } = await import("~/db.server");
            await prisma.client.update({ where: { id }, data });
        }
        return { success: true };
    }

    if (intent === "delete") {
        // Assuming delete generally requires edit or specific delete permission. Using EDIT for now as explicit DELETE isn't in definitions yet for Commercial
        const { requirePermission } = await import("~/utils/permissions.server");
        await requirePermission(userId!, PERMISSIONS.COMMERCIAL_EDIT);
        const id = formData.get("id") as string;
        const { prisma } = await import("~/db.server");
        await prisma.client.delete({ where: { id } });
        return { success: true };
    }

    if (intent === "create-visit") {
        const { requirePermission } = await import("~/utils/permissions.server");
        const { createVisit } = await import("~/services/commercial.server");
        await requirePermission(userId!, PERMISSIONS.VISITS_CREATE);
        const clientId = formData.get("clientId") as string;
        const propertyId = formData.get("propertyId") as string;
        const date = new Date(formData.get("date") as string);
        const notes = formData.get("notes") as string;

        await createVisit({
            clientId,
            propertyId,
            agentId: userId!,
            date,
            status: "scheduled",
            notes
        });
        return { success: true };
    }

    return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw redirect("/login");
    }

    // Permission Check
    const { requirePermission, hasPermission } = await import("~/utils/permissions.server");
    const { logModuleAccess } = await import("~/services/it.server");
    await requirePermission(userId, PERMISSIONS.COMMERCIAL_VIEW);
    if (userId) await logModuleAccess(userId, "Commercial");

    const canCreate = userId ? await hasPermission(userId, PERMISSIONS.COMMERCIAL_CREATE) : false;
    const canEdit = userId ? await hasPermission(userId, PERMISSIONS.COMMERCIAL_EDIT) : false;

    // 1. Fetch Stats
    const { prisma } = await import("~/db.server");
    const totalProperties = await prisma.property.count();
    const availableProperties = await prisma.property.count({ where: { status: 'available' } });
    const totalClients = await prisma.client.count();

    // Get count of clients created this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const recentProspectsCount = await prisma.client.count({
        where: { createdAt: { gte: startOfMonth } }
    });

    // Import service functions for data fetching if needed, or use prisma directly as below
    // Note: getClients/getVisits were imported but not used in original loader code shown, assuming direct prisma usage here is fine or we should use them.
    // The original loader used prisma directly for queries.

    // 2. Fetch Recent Clients (Prospects)
    const recentClients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    // 3. Fetch All Clients (for the list tab)
    const allClients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return {
        stats: {
            totalProperties,
            availableProperties,
            totalClients,
            recentProspectsCount
        },
        recentClients,
        allClients,
        canCreate,
        canEdit
    };
}

export default function Commercial() {
    const { stats, recentClients, allClients, canCreate, canEdit } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'clients'>('dashboard');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any | null>(null);

    const isSubmitting = navigation.state === "submitting" &&
        (navigation.formData?.get("intent") === "create" || navigation.formData?.get("intent") === "update");

    // Close modal on successful submission
    useEffect(() => {
        if (navigation.state === "loading" && isSubmitting === false) {
            setIsCreateModalOpen(false);
            setEditingClient(null);
        }
    }, [navigation.state, isSubmitting]);

    const handleEdit = (client: any) => {
        if (!canEdit) return; // Prevention
        setEditingClient(client);
        setIsCreateModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!canEdit) return; // Prevention
        if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
            submit({ intent: "delete", id }, { method: "post" });
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden font-sans text-slate-800 pb-10">
            <PremiumBackground />

            <div className="space-y-6 relative z-10 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Direction Commerciale</h1>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                            Suivi des performances et gestion de la clientèle.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-4 sm:mt-0">
                        {activeTab === 'clients' && canCreate && (
                            <button
                                onClick={() => { setEditingClient(null); setIsCreateModalOpen(true); }}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-blue-600 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                Nouveau Client
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <nav className="bg-white/30 backdrop-blur-xl p-1.5 rounded-2xl inline-flex shadow-inner border border-white/40 space-x-1" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                activeTab === 'dashboard'
                                    ? "bg-white text-blue-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                    : "text-slate-500 hover:bg-white/40 hover:text-slate-900"
                            )}
                        >
                            <LayoutDashboard className={cn("w-4 h-4", activeTab === 'dashboard' ? "text-blue-600" : "text-slate-400")} />
                            Tableau de Bord
                        </button>
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                activeTab === 'clients'
                                    ? "bg-white text-blue-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                    : "text-slate-500 hover:bg-white/40 hover:text-slate-900"
                            )}
                        >
                            <Users className={cn("w-4 h-4", activeTab === 'clients' ? "text-blue-600" : "text-slate-400")} />
                            Clients & Prospects
                        </button>
                    </nav>
                </div>

                <div className="mt-6 animate-fade-in">
                    {activeTab === 'dashboard' ? (
                        <div className="space-y-8">
                            <CommercialStats stats={stats} />

                            <div className="rounded-3xl border border-white/50 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    Derniers ajouts (Clients)
                                </h3>
                                <ClientList
                                    clients={recentClients}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-white/50 bg-white/70 backdrop-blur-xl p-6 shadow-lg">
                            <ClientList
                                clients={allClients}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                        <div
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                            aria-hidden="true"
                            onClick={() => { setIsCreateModalOpen(false); setEditingClient(null); }}
                        />

                        <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl shadow-2xl ring-1 ring-white/50 transition-all max-h-[90vh] overflow-y-auto">
                            <div className="px-6 pb-6 pt-6 sm:p-8">
                                <div className="sm:flex sm:items-start">
                                    <div className="w-full text-center sm:text-left">
                                        <h3 className="text-xl font-bold leading-6 text-slate-900 mb-6 pb-4 border-b border-slate-200" id="modal-title">
                                            {editingClient ? "Modifier le client" : "Ajouter un nouveau client"}
                                        </h3>
                                        <div className="mt-4">
                                            <ClientForm
                                                defaultValues={editingClient}
                                                isSubmitting={isSubmitting}
                                                onCancel={() => { setIsCreateModalOpen(false); setEditingClient(null); }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
