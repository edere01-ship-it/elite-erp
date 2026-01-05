import type { Route } from "./+types/it";
import { useState } from "react";
import { Shield, Monitor, Ticket as TicketIcon, Activity, Plus } from "lucide-react";
import { AssetList } from "~/components/it/AssetList";
import { TicketBoard } from "~/components/it/TicketBoard";
import { UserManagement } from "~/components/it/UserManagement";
import { ActivityLogs } from "~/components/it/ActivityLogs";
import { cn } from "~/lib/utils";
// import {
//     getAssets, getTickets, getAuditLogs, getUsersIT,
//     createAsset, createTicket, updateTicket, deleteAsset,
//     createUser, deleteUser, updateUser
// } from "~/services/it.server";
import { PERMISSIONS } from "~/utils/permissions";
// import { requirePermission, hasPermission } from "~/utils/permissions.server";
// import { prisma } from "~/db.server";
import { useLoaderData, useSubmit, Form, useNavigation, redirect } from "react-router";
import { getSession } from "~/sessions.server";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Gestion Informatique - Elite Immobilier & Divers" },
        { name: "description", content: "Parc informatique, support et sécurité" },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    try {
        const session = await getSession(request.headers.get("Cookie"));
        const userId = session.get("userId");

        if (!userId) {
            throw redirect("/login");
        }

        if (userId) {
            // Dynamic import to avoid server-side code in client bundle issues if any
            const { logModuleAccess } = await import("~/services/it.server");
            await logModuleAccess(userId, "IT Management");
        }

        const { getAssets, getTickets, getAuditLogs, getUsersIT } = await import("~/services/it.server");
        const { hasPermission } = await import("~/utils/permissions.server");

        const assets = await getAssets();
        const tickets = await getTickets();
        const auditLogs = await getAuditLogs();
        const users = await getUsersIT();

        const canCreate = userId ? await hasPermission(userId, PERMISSIONS.IT_CREATE) : false;
        const canEdit = userId ? await hasPermission(userId, PERMISSIONS.IT_EDIT) : false;
        const canDelete = userId ? await hasPermission(userId, PERMISSIONS.IT_DELETE) : false;

        return {
            assets: assets.map(a => ({
                ...a,
                purchaseDate: a.purchaseDate.toISOString(),
                assignedTo: a.assignedTo?.username || undefined,
                type: a.type as any,
                status: a.status as any
            })),
            tickets: tickets.map(t => ({
                ...t,
                createdAt: t.createdAt.toISOString(),
                requester: t.requester.username,
                priority: t.priority as any,
                status: t.status as any,
                category: t.category as any
            })),
            users: users.map((u: any) => ({
                ...u,
                lastLogin: u.lastLogin?.toISOString() || undefined,
                lastLogout: u.lastLogout?.toISOString() || undefined,
                lastActivity: u.lastActivity?.toISOString() || undefined,
                role: u.role as any,
                status: u.status as any
            })),
            auditLogs: auditLogs.map(l => ({
                ...l,
                timestamp: l.timestamp.toISOString(),
                username: l.user.username,
                action: l.action as any,
                module: l.module || undefined
            })),
            canCreate,
            canEdit,
            canDelete
        };
    } catch (error: any) {
        console.error("IT Loader Error:", error);
        throw new Response(`Erreur de chargement du module IT: ${error.message || error}`, { status: 500 });
    }
}

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) return { error: "Non autorisé" };

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create-asset") {
        const { requirePermission } = await import("~/utils/permissions.server");
        const { createAsset } = await import("~/services/it.server");
        await requirePermission(userId, PERMISSIONS.IT_CREATE);
        await createAsset({
            name: formData.get("name") as string,
            type: formData.get("type") as string,
            serialNumber: formData.get("serialNumber") as string,
            status: formData.get("status") as string,
            purchaseDate: new Date(formData.get("purchaseDate") as string),
            assignedToId: null // simplistic for now
        });
        return { success: true };
    }

    if (intent === "delete-asset") {
        const { requirePermission } = await import("~/utils/permissions.server");
        const { deleteAsset } = await import("~/services/it.server");
        await requirePermission(userId, PERMISSIONS.IT_DELETE); // Assuming IT_DELETE exists
        await deleteAsset(formData.get("id") as string);
        return { success: true };
    }

    if (intent === "create-ticket") {
        const { requirePermission } = await import("~/utils/permissions.server");
        const { createTicket } = await import("~/services/it.server");
        await requirePermission(userId, PERMISSIONS.IT_CREATE);
        await createTicket({
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            priority: formData.get("priority") as string,
            category: formData.get("category") as string,
            status: "open",
            requesterId: userId
        });
        return { success: true };
    }

    if (intent === "update-ticket-status") {
        const { updateTicket } = await import("~/services/it.server");
        const id = formData.get("id") as string;
        const status = formData.get("status") as string;
        await updateTicket(id, { status });
        return { success: true };
    }

    if (intent === "create-user") {
        const { createUser } = await import("~/services/it.server");
        const username = formData.get("username") as string;
        const email = formData.get("email") as string;
        const passwordRaw = formData.get("password") as string;
        const role = formData.get("role") as string;
        const permissionsJson = formData.get("permissions") as string;
        const permissions = JSON.parse(permissionsJson || "[]");

        await createUser({
            username,
            email,
            passwordRaw,
            role,
            permissions
        });
        return { success: true };
    }

    if (intent === "update-user") {
        const { updateUser } = await import("~/services/it.server");
        const id = formData.get("id") as string;
        const username = formData.get("username") as string;
        const email = formData.get("email") as string;
        const role = formData.get("role") as string;
        const permissionsJson = formData.get("permissions") as string;
        const permissions = JSON.parse(permissionsJson || "[]");
        const status = formData.get("status") as string;

        await updateUser(id, {
            username,
            email,
            role,
            permissions,
            status
        });
        return { success: true };
    }

    if (intent === "delete-user") {
        const { deleteUser } = await import("~/services/it.server");
        const id = formData.get("id") as string;
        await deleteUser(id);
        return { success: true };
    }

    return null;
}

export default function ITManagement() {
    const { assets, tickets, users, auditLogs, canCreate, canEdit, canDelete } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState<'monitor' | 'support' | 'security' | 'audit'>('monitor');
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const submit = useSubmit();
    const navigation = useNavigation();

    const isSubmitting = navigation.state === "submitting";

    const handleDeleteAsset = (id: string) => {
        if (confirm("Supprimer ce matériel ?")) {
            submit({ intent: "delete-asset", id }, { method: "post" });
        }
    };

    const handleTicketStatusUpdate = (id: string, status: string) => {
        const formData = new FormData();
        formData.append("intent", "update-ticket-status");
        formData.append("id", id);
        formData.append("status", status);
        submit(formData, { method: "post" });
    };

    const handleCreateUser = (userData: any) => {
        const formData = new FormData();
        formData.append("intent", "create-user");
        formData.append("username", userData.username);
        formData.append("email", userData.email);
        formData.append("password", userData.password);
        formData.append("role", userData.role);
        formData.append("permissions", JSON.stringify(userData.permissions));
        submit(formData, { method: "post" });
        setIsUserModalOpen(false);
    };

    const handleUpdateUser = (id: string, userData: any) => {
        const formData = new FormData();
        formData.append("intent", "update-user");
        formData.append("id", id);
        formData.append("username", userData.username);
        formData.append("email", userData.email);
        formData.append("role", userData.role);
        formData.append("permissions", JSON.stringify(userData.permissions));
        formData.append("status", userData.status);
        submit(formData, { method: "post" });
    };

    const handleDeleteUser = (id: string) => {
        const formData = new FormData();
        formData.append("intent", "delete-user");
        formData.append("id", id);
        submit(formData, { method: "post" });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion Informatique</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Parc, Support technique et Sécurité des accès.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    {activeTab === 'monitor' && (
                        <button
                            onClick={() => setIsAssetModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                        >
                            <Plus className="h-4 w-4" />
                            Nouveau Matériel
                        </button>
                    )}
                    {activeTab === 'support' && (
                        <button
                            onClick={() => setIsTicketModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                        >
                            <Plus className="h-4 w-4" />
                            Nouveau Ticket
                        </button>
                    )}
                    {activeTab === 'security' && canCreate && (
                        <button
                            onClick={() => setIsUserModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                        >
                            <Plus className="h-4 w-4" />
                            Nouvel Utilisateur
                        </button>
                    )}
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('monitor')}
                        className={cn(
                            activeTab === 'monitor'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <Monitor className={cn(
                            activeTab === 'monitor' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                            "-ml-0.5 mr-2 h-5 w-5"
                        )} />
                        Parc Informatique
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={cn(
                            activeTab === 'support'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <TicketIcon className={cn(
                            activeTab === 'support' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                            "-ml-0.5 mr-2 h-5 w-5"
                        )} />
                        Support & Tickets
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={cn(
                            activeTab === 'security'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <Shield className={cn(
                            activeTab === 'security' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                            "-ml-0.5 mr-2 h-5 w-5"
                        )} />
                        Utilisateurs & Accès
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={cn(
                            activeTab === 'audit'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <Activity className={cn(
                            activeTab === 'audit' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                            "-ml-0.5 mr-2 h-5 w-5"
                        )} />
                        Journal d'Activités
                    </button>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'monitor' && <AssetList assets={assets} onDelete={handleDeleteAsset} />}
                {activeTab === 'support' && <TicketBoard tickets={tickets} onUpdateStatus={handleTicketStatusUpdate} />}
                {activeTab === 'security' && (
                    <UserManagement
                        users={users}
                        isModalOpen={isUserModalOpen}
                        onCloseModal={() => setIsUserModalOpen(false)}
                        shouldOpenModal={isUserModalOpen}
                        onCreateUser={handleCreateUser}
                        onUpdateUser={handleUpdateUser}
                        onDeleteUser={handleDeleteUser}
                        canCreate={canCreate}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                )}
                {activeTab === 'audit' && <ActivityLogs logs={auditLogs} users={users} />}
            </div>

            {/* Asset Modal */}
            {isAssetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Ajouter un matériel</h3>
                        <Form method="post" onSubmit={() => setIsAssetModalOpen(false)}>
                            <input type="hidden" name="intent" value="create-asset" />
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Nom</label>
                                    <input name="name" required className="w-full border rounded p-2" placeholder="Ex: Dell XPS 15" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium">Type</label>
                                        <select name="type" className="w-full border rounded p-2">
                                            <option value="laptop">Portable</option>
                                            <option value="desktop">Bureau</option>
                                            <option value="printer">Imprimante</option>
                                            <option value="server">Serveur</option>
                                            <option value="network">Réseau</option>
                                            <option value="other">Autre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Statut</label>
                                        <select name="status" className="w-full border rounded p-2">
                                            <option value="active">Actif</option>
                                            <option value="repair">En réparation</option>
                                            <option value="retired">Retiré</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Numéro de Série</label>
                                    <input name="serialNumber" required className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Date d'achat</label>
                                    <input name="purchaseDate" type="date" required className="w-full border rounded p-2" />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAssetModalOpen(false)} className="px-4 py-2 border rounded">Annuler</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Ajouter</button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}

            {/* Ticket Modal */}
            {isTicketModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Nouveau Ticket</h3>
                        <Form method="post" onSubmit={() => setIsTicketModalOpen(false)}>
                            <input type="hidden" name="intent" value="create-ticket" />
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Titre</label>
                                    <input name="title" required className="w-full border rounded p-2" placeholder="Ex: Panne Wifi" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Description</label>
                                    <textarea name="description" rows={3} required className="w-full border rounded p-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium">Priorité</label>
                                        <select name="priority" className="w-full border rounded p-2">
                                            <option value="low">Basse</option>
                                            <option value="medium">Moyenne</option>
                                            <option value="high">Haute</option>
                                            <option value="critical">Critique</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Catégorie</label>
                                        <select name="category" className="w-full border rounded p-2">
                                            <option value="hardware">Matériel</option>
                                            <option value="software">Logiciel</option>
                                            <option value="network">Réseau</option>
                                            <option value="access">Accès</option>
                                            <option value="other">Autre</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsTicketModalOpen(false)} className="px-4 py-2 border rounded">Annuler</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Créer le ticket</button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}
        </div>
    );
}
