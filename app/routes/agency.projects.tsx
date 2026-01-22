import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, Link } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, MapPin, HardHat, Eye } from "lucide-react";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    // Requires Agency Manage or Validation permission
    const user = await requirePermission(request, PERMISSIONS.AGENCY_MANAGE);

    // Get user's agency
    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    // Fallback for admin if not in agency
    let agencyId = employee?.agencyId;
    if (!agencyId && (user.role === 'admin' || user.permissions.includes('admin.access'))) {
        const firstAgency = await prisma.agency.findFirst();
        agencyId = firstAgency?.id;
    }

    if (!agencyId) return { pendingConstructions: [], pendingDevelopments: [], error: "Aucune agence associée." };

    // Fetch Pending Projects
    // Note: LandDevelopments are usually global or linked to properties, but for now we fetch all pending if assumed agency scope
    // Schema for LandDevelopment doesn't have agencyId directly? Check schema.
    // Schema: LandDevelopment has NO agencyId. It's global? Or we assume visibility?
    // ConstructionProject has manager -> employee -> agencyId.

    const pendingConstructions = await prisma.constructionProject.findMany({
        where: {
            status: "pending",
            manager: {
                employee: { agencyId }
            }
        },
        include: { manager: true },
        orderBy: { createdAt: 'desc' }
    });

    const pendingDevelopments = await prisma.landDevelopment.findMany({
        where: { status: "pending" }, // Assuming global visibility for Direction to validate
        orderBy: { createdAt: 'desc' }
    });

    return { pendingConstructions, pendingDevelopments, error: null };
}

export async function action({ request }: ActionFunctionArgs) {
    await requirePermission(request, PERMISSIONS.AGENCY_MANAGE);
    const formData = await request.formData();
    const intent = formData.get("intent");
    const type = formData.get("type"); // 'construction' or 'development'
    const id = formData.get("id") as string;
    const notes = formData.get("notes") as string;

    if (!id || !type) return { error: "Paramètres manquants" };

    try {
        if (intent === "validate") {
            const newStatus = type === 'construction' ? 'planned' : 'planning'; // Transition to standard initial status

            if (type === 'construction') {
                await prisma.constructionProject.update({
                    where: { id },
                    data: { status: newStatus, rejectionReason: null }
                });
            } else {
                await prisma.landDevelopment.update({
                    where: { id },
                    data: { status: newStatus, rejectionReason: null }
                });
            }
            return { success: true };
        }

        if (intent === "reject") {
            if (!notes) return { error: "Motif de rejet requis." };

            if (type === 'construction') {
                await prisma.constructionProject.update({
                    where: { id },
                    data: { status: "rejected", rejectionReason: notes }
                });
            } else {
                await prisma.landDevelopment.update({
                    where: { id },
                    data: { status: "rejected", rejectionReason: notes }
                });
            }
            return { success: true };
        }
    } catch (e: any) {
        console.error("Validation Error:", e);
        return { error: e.message };
    }

    return null;
}

export default function AgencyProjectValidation() {
    const { pendingConstructions, pendingDevelopments, error } = useLoaderData<typeof loader>();
    const [selectedItem, setSelectedItem] = useState<{ id: string, type: 'construction' | 'development', name: string } | null>(null);
    const [rejectMode, setRejectMode] = useState(false);

    // Fetcher for actions without navigation
    const fetcher = useFetcher();

    // Close modal on success
    if (fetcher.state === 'idle' && fetcher.data && (fetcher.data as any).success && selectedItem) {
        // Reset state after successful action
        // Since we can't update state during render, we rely on useEffect or user interaction.
        // Actually, simpler to just listen to state change or manually close.
        // Let's just create a wrapper function.
    }

    const handleAction = (intent: string) => {
        if (!selectedItem) return;

        const form = new FormData();
        form.set("intent", intent);
        form.set("type", selectedItem.type);
        form.set("id", selectedItem.id);

        if (intent === "reject") {
            setRejectMode(true);
            return; // Modal handles submission
        }

        fetcher.submit(form, { method: "post" });
        setSelectedItem(null);
    };

    return (
        <div className="space-y-6 animate-fade-in fade-in-0 duration-500">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100 flex items-start gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Validation des Projets</h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Les projets créés dans le module "Projets Immobiliers" apparaissent ici pour validation.
                        Une fois validés, ils seront actifs. En cas de rejet, un motif est requis.
                    </p>
                </div>
            </div>

            {/* Constructions Pending */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-orange-600" />
                        Chantiers en attente
                    </h3>
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">
                        {pendingConstructions.length}
                    </span>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du Projet</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pendingConstructions.map((p: any) => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.manager?.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{p.budget.toLocaleString()} FCFA</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button
                                        onClick={() => {
                                            const form = new FormData();
                                            form.set("intent", "validate");
                                            form.set("type", "construction");
                                            form.set("id", p.id);
                                            fetcher.submit(form, { method: "post" });
                                        }}
                                        className="text-green-600 hover:text-green-800 font-medium"
                                    >
                                        Valider
                                    </button>
                                    <button
                                        onClick={() => { setSelectedItem({ id: p.id, type: 'construction', name: p.name }); setRejectMode(true); }}
                                        className="text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Rejeter
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {pendingConstructions.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">Aucun chantier en attente.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Developments Pending */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Lotissements en attente
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                        {pendingDevelopments.length}
                    </span>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du Site</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Superficie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pendingDevelopments.map((d: any) => (
                            <tr key={d.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{d.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{d.totalArea} m²</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button
                                        onClick={() => {
                                            const form = new FormData();
                                            form.set("intent", "validate");
                                            form.set("type", "development");
                                            form.set("id", d.id);
                                            fetcher.submit(form, { method: "post" });
                                        }}
                                        className="text-green-600 hover:text-green-800 font-medium"
                                    >
                                        Valider
                                    </button>
                                    <button
                                        onClick={() => { setSelectedItem({ id: d.id, type: 'development', name: d.name }); setRejectMode(true); }}
                                        className="text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Rejeter
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {pendingDevelopments.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">Aucun lotissement en attente.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Rejection Modal */}
            {rejectMode && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setRejectMode(false)} />
                    <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-4">
                                <XCircle className="w-5 h-5" />
                                Rejeter {selectedItem.name}
                            </h3>
                            <fetcher.Form method="post" onSubmit={() => setRejectMode(false)}>
                                <input type="hidden" name="intent" value="reject" />
                                <input type="hidden" name="type" value={selectedItem.type} />
                                <input type="hidden" name="id" value={selectedItem.id} />

                                <label className="block text-sm font-medium text-gray-700 mb-2">Motif du rejet *</label>
                                <textarea
                                    name="notes"
                                    required
                                    rows={3}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                                    placeholder="Expliquez pourquoi ce projet est rejeté..."
                                ></textarea>

                                <div className="mt-5 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRejectMode(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                                    >
                                        Confirmer le Rejet
                                    </button>
                                </div>
                            </fetcher.Form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
