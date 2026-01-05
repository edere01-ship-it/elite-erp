import type { Route } from "./+types/commercial";
import { useLoaderData, type LoaderFunctionArgs, type ActionFunctionArgs, useNavigation, useSubmit, redirect } from "react-router";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Plus } from "lucide-react";
// import { prisma } from "~/db.server";
import { ClientList } from "~/components/clients/ClientList";
import { ClientForm } from "~/components/clients/ClientForm";
import { CommercialStats } from "~/components/commercial/CommercialStats";
import { cn } from "~/lib/utils";

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Direction Commerciale</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Suivi des performances et gestion de la clientèle.
                    </p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'clients' && canCreate && (
                        <button
                            onClick={() => { setEditingClient(null); setIsCreateModalOpen(true); }}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nouveau Client
                        </button>
                    )}
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={cn(
                            activeTab === 'dashboard'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <LayoutDashboard
                            className={cn(
                                activeTab === 'dashboard' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                                "-ml-0.5 mr-2 h-5 w-5"
                            )}
                        />
                        Tableau de Bord
                    </button>
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={cn(
                            activeTab === 'clients'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <Users
                            className={cn(
                                activeTab === 'clients' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                                "-ml-0.5 mr-2 h-5 w-5"
                            )}
                        />
                        Clients & Prospects
                    </button>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'dashboard' ? (
                    <div className="space-y-6">
                        <CommercialStats stats={stats} />

                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Derniers ajouts (Clients)</h3>
                            <ClientList
                                clients={recentClients}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </div>
                    </div>
                ) : (
                    <ClientList
                        clients={allClients}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        aria-hidden="true"
                        onClick={() => { setIsCreateModalOpen(false); setEditingClient(null); }}
                    />

                    <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
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
    );
}
