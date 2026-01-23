import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { Link, useLoaderData, useFetcher, useNavigate } from "react-router";
import { useState, useEffect } from "react";
// Refresh build
import {
    Map, LayoutGrid, Calendar, FileText, CheckCircle2, AlertCircle, Plus, Users,
    DollarSign, ArrowLeft, Trash2, Edit, Save, Upload, X, Search, Filter
} from "lucide-react";

import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import {
    getLandDevelopmentById, getProjectStats, generateProjectLots,
    deleteLandDevelopment, updateLandDevelopment,
    updateLot, createDevelopmentLot, deleteDevelopmentLot, getClients,
    bulkUpdateLots
} from "~/services/projects.server";
import { createDocument } from "~/services/documents.server";
import { cn, translateStatus } from "~/lib/utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
    await requirePermission(request, PERMISSIONS.CONSTRUCTION_VIEW);
    const { id } = params;
    if (!id) throw new Response("ID du Projet Requis", { status: 400 });

    const project = await getLandDevelopmentById(id);
    if (!project) throw new Response("Projet Introuvable", { status: 404 });

    const stats = await getProjectStats(id);
    const clients = await getClients();

    // Sort lots numerically
    if (project && project.lots) {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        project.lots.sort((a: any, b: any) => collator.compare(a.lotNumber, b.lotNumber));
    }

    return { project, stats, clients };
}

export async function action({ request, params }: ActionFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.CONSTRUCTION_MANAGE);
    const formData = await request.formData();
    const intent = formData.get("intent");
    const projectId = params.id!;

    if (intent === "delete-project") {
        try {
            await deleteLandDevelopment(projectId);
            return redirect("/construction");
        } catch (error: any) {
            return { error: error.message };
        }
    }

    if (intent === "update-project") {
        const name = formData.get("name") as string;
        await updateLandDevelopment(projectId, { name });
        return { success: true };
    }

    if (intent === "upload-plan") {
        const file = formData.get("planFile") as File;
        if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const sizeMb = file.size / (1024 * 1024);
            const sizeStr = sizeMb < 1 ? `${(file.size / 1024).toFixed(0)} KB` : `${sizeMb.toFixed(1)} MB`;

            const doc = await createDocument({
                name: `PLAN - ${file.name}`,
                type: "plan",
                size: sizeStr,
                category: "plans",
                ownerId: user.id,
                fileBuffer: buffer
            });

            await updateLandDevelopment(projectId, { planDocumentId: doc.id } as any);
            return { success: true };
        }
        return { error: "Fichier invalide" };
    }

    if (intent === "add-lot") {
        // Single Lot Creation
        await createDevelopmentLot({
            lotNumber: formData.get("lotNumber"),
            blockNumber: formData.get("blockNumber"),
            area: parseFloat(formData.get("area") as string),
            price: parseFloat(formData.get("price") as string),
            type: formData.get("type"),
            ownerType: formData.get("ownerType"),
            status: "available",
            developmentId: projectId
        });
        return { success: true };
    }

    if (intent === "generate-lots") {
        // Bulk Creation
        const count = parseInt(formData.get("count") as string);
        const prefix = formData.get("prefix") as string;
        const startNumber = parseInt(formData.get("startNumber") as string || "1");
        const price = parseFloat(formData.get("price") as string);
        const area = parseFloat(formData.get("area") as string);
        const blockNumber = formData.get("blockNumber") as string;
        const ownerType = formData.get("ownerType") as string;

        await generateProjectLots(projectId, count, prefix, startNumber, price, area, blockNumber, ownerType);
        return { success: true };
    }

    if (intent === "update-lot") {
        const lotId = formData.get("lotId") as string;
        const updateData: any = {};

        if (formData.has("status")) updateData.status = formData.get("status");
        if (formData.has("clientId")) updateData.clientId = formData.get("clientId") || null; // Handle unassignment
        if (formData.has("ownerType")) updateData.ownerType = formData.get("ownerType");
        if (formData.has("blockNumber")) updateData.blockNumber = formData.get("blockNumber");
        if (formData.has("price")) updateData.price = parseFloat(formData.get("price") as string);

        await updateLot(lotId, updateData);
        return { success: true };
    }

    if (intent === "delete-lot") {
        const lotId = formData.get("lotId") as string;
        try {
            await deleteDevelopmentLot(lotId);
            return { success: true };
        } catch (e: any) {
            return { error: e.message };
        }
    }

    if (intent === "bulk-update-lots") {
        const lotIds = JSON.parse(formData.get("lotIds") as string);
        const updateData: any = {};

        if (formData.has("status") && formData.get("status") !== "") updateData.status = formData.get("status");
        if (formData.has("ownerType") && formData.get("ownerType") !== "") updateData.ownerType = formData.get("ownerType");
        if (formData.has("price") && formData.get("price") !== "") updateData.price = parseFloat(formData.get("price") as string);

        await bulkUpdateLots(lotIds, updateData);
        return { success: true };
    }

    return null;
}

export default function LandDetail() {
    const { project, stats, clients } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState<"dashboard" | "lots">("lots");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [editMode, setEditMode] = useState(false);

    // Filters
    const [filterBlock, setFilterBlock] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // Modal States
    const [isAddLotOpen, setIsAddLotOpen] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [selectedLot, setSelectedLot] = useState<any>(null); // For editing/assigning

    // Bulk Actions State
    const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

    const fetcher = useFetcher();
    const navigate = useNavigate();

    // Auto-close modals on success
    useEffect(() => {
        if (fetcher.state === "idle" && (fetcher.data as any)?.success) {
            setEditMode(false);
            setIsAddLotOpen(false);
            setIsGenerateOpen(false);
            setSelectedLot(null);
            setIsBulkEditOpen(false);
            setSelectedLotIds([]); // Clear selection after bulk update
        }
    }, [fetcher.state, fetcher.data]);

    // Unique Blocks
    const blocks = Array.from(new Set(project.lots.map((l: any) => l.blockNumber).filter(Boolean)));

    // Filtered Lots
    const filteredLots = project.lots.filter((l: any) => {
        if (filterBlock !== "all" && l.blockNumber !== filterBlock) return false;
        if (filterStatus !== "all" && l.status !== filterStatus) return false;
        return true;
    });

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800 border-green-200';
            case 'reserved': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'sold': return 'bg-red-100 text-red-800 border-red-200';
            case 'pre_financed': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCardColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-white border-green-200 hover:border-green-400';
            case 'reserved': return 'bg-orange-50 border-orange-200';
            case 'sold': return 'bg-red-50 border-red-200 opacity-90';
            case 'pre_financed': return 'bg-purple-50 border-purple-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Map className="text-blue-600 w-8 h-8" />
                            {project.name}
                        </h1>
                        <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase border",
                            project.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-green-50 text-green-700 border-green-200'
                        )}>
                            {project.status === 'pending' ? 'Validation Requise' : project.status}
                        </span>
                    </div>

                    <p className="text-gray-500 mt-1 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1"><Map className="w-4 h-4" /> {project.location}</span>
                        <span className="flex items-center gap-1"><LayoutGrid className="w-4 h-4" /> {project.totalLots} Lots</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {project.lots.filter((l: any) => l.ownerType === 'FAMILY').length} Lots Famille</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setEditMode(!editMode)} className="px-3 py-2 border rounded-md hover:bg-gray-50 text-gray-600 flex items-center gap-2 text-sm font-medium">
                        <Edit className="w-4 h-4" /> Modifier
                    </button>
                    <button
                        onClick={() => {
                            if (confirm("Êtes-vous sûr de vouloir SUPPRIMER ce projet ? Cette action est irréversible.")) {
                                fetcher.submit({ intent: "delete-project" }, { method: "post" });
                            }
                        }}
                        className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 flex items-center gap-2 text-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" /> Supprimer
                    </button>
                </div>
            </div>

            {/* Edit Project Form */}
            {editMode && (
                <fetcher.Form method="post" className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm space-y-4">
                    <input type="hidden" name="intent" value="update-project" />
                    <h3 className="font-bold text-gray-900">Modifier le projet</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nom du Projet</label>
                            <input name="name" defaultValue={project.name} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">Annuler</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Enregistrer</button>
                    </div>
                </fetcher.Form>
            )}

            {/* Error Message */}
            {fetcher.data && (fetcher.data as any).error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {(fetcher.data as any).error}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("lots")}
                        className={cn(
                            "pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
                            activeTab === "lots"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Gestion des Lots
                    </button>
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={cn(
                            "pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
                            activeTab === "dashboard"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Tableau de Bord & Plan
                    </button>
                </nav>
            </div>

            {/* Content: Dashboard */}
            {activeTab === "dashboard" && (
                <div className="space-y-6">
                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <div className="text-gray-500 text-xs uppercase font-bold tracking-wide">Ventes (Lots)</div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">{stats.salesProgress.toFixed(1)}%</div>
                                <div className="text-xs text-gray-500 mt-1">{stats.soldLots} vendus / {stats.totalLots}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <div className="text-gray-500 text-xs uppercase font-bold tracking-wide">CA Réalisé</div>
                                <div className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.realizedRevenue / 1000000)}M</div>
                                <div className="text-xs text-gray-500 mt-1">Sur {formatCurrency(stats.potentialRevenue / 1000000)}M potentiel</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <div className="text-gray-500 text-xs uppercase font-bold tracking-wide">Encaissements</div>
                                <div className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.collectedAmount / 1000000)}M</div>
                                <div className="text-xs text-gray-500 mt-1">Cash flow actuel</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <div className="text-gray-500 text-xs uppercase font-bold tracking-wide">Reste à Recouvrer</div>
                                <div className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency((stats.realizedRevenue - stats.collectedAmount) / 1000000)}M</div>
                                <div className="text-xs text-gray-500 mt-1">Créances clients</div>
                            </div>
                        </div>
                    )}

                    {/* Plan View */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Map className="w-5 h-5 text-gray-500" /> Plan du Lotissement
                        </h3>
                        {(project as any).planDocument ? (
                            <div className="space-y-4">
                                <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                                    <img src={(project as any).planDocument.path} alt="Plan" className="max-w-full h-auto mx-auto" />
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FileText className="w-4 h-4" />
                                        <span className="font-medium">{(project as any).planDocument.name}</span>
                                        <span className="text-gray-400">({(project as any).planDocument.size})</span>
                                    </div>
                                    <a
                                        href={(project as any).planDocument.path}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                                    >
                                        Télécharger / Ouvrir
                                    </a>
                                </div>
                            </div>
                        ) : project.planUrl ? (
                            <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                                <img src={project.planUrl} alt="Plan Legacy" className="max-w-full h-auto mx-auto" />
                                <p className="text-xs text-center text-gray-500 p-2">Image legacy (URL externe)</p>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 p-8">
                                <Upload className="w-12 h-12 mb-2" />
                                <p className="mb-4 text-center">Aucun plan associé. Uploadez un fichier image pour le plan.</p>
                                <fetcher.Form method="post" encType="multipart/form-data" className="flex flex-col items-center gap-2">
                                    <input type="hidden" name="intent" value="upload-plan" />
                                    <input
                                        type="file"
                                        name="planFile"
                                        accept="image/*,application/pdf"
                                        required
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100
                                        "
                                    />
                                    <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                                        Uploader le Plan
                                    </button>
                                </fetcher.Form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content: Lots Management */}
            {activeTab === "lots" && (
                <div className="space-y-4">
                    {/* Bulk Selection Bar */}
                    {selectedLotIds.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex justify-between items-center animate-fade-in shadow-sm">
                            <span className="text-blue-800 font-medium text-sm">{selectedLotIds.length} lot(s) sélectionné(s)</span>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedLotIds([])} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">Annuler</button>
                                <button onClick={() => setIsBulkEditOpen(true)} className="px-3 py-1.5 bg-blue-600 text-white border border-blue-600 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
                                    <Edit className="w-3 h-3" /> Modifier en masse
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select value={filterBlock} onChange={e => setFilterBlock(e.target.value)} className="text-sm border-gray-300 rounded-md">
                                    <option value="all">Tous les Ilots</option>
                                    {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border-gray-300 rounded-md">
                                <option value="all">Tous les Statuts</option>
                                <option value="available">Disponible</option>
                                <option value="reserved">Réservé</option>
                                <option value="sold">Vendu</option>
                            </select>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <div className="flex bg-white rounded-md border shadow-sm">
                                <button onClick={() => setViewMode("grid")} className={cn("p-2", viewMode === "grid" ? "bg-gray-100 text-blue-600" : "text-gray-500")}><LayoutGrid className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode("list")} className={cn("p-2", viewMode === "list" ? "bg-gray-100 text-blue-600" : "text-gray-500")}><FileText className="w-4 h-4" /></button>
                            </div>
                            <button onClick={() => setIsAddLotOpen(true)} className="px-3 py-2 bg-white border rounded-md hover:bg-gray-50 text-gray-700 text-sm font-medium flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Lot
                            </button>
                            <button onClick={() => setIsGenerateOpen(true)} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4" /> Générer
                            </button>
                        </div>
                    </div>

                    {/* Lots View */}
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {filteredLots.map((lot: any) => (
                                <div
                                    key={lot.id}
                                    className={cn(
                                        "p-3 rounded-lg border transition-all hover:shadow-md relative group select-none",
                                        getCardColor(lot.status),
                                        selectedLotIds.includes(lot.id) ? "ring-2 ring-blue-500 shadow-md transform scale-[1.02]" : ""
                                    )}
                                // Click to select/deselect if holding shift/ctrl or if in selection mode? 
                                // Let's implement simple check logic: Click on card opens details, check box for selection.
                                >
                                    <div className="absolute top-2 right-2 z-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedLotIds.includes(lot.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                if (e.target.checked) {
                                                    setSelectedLotIds([...selectedLotIds, lot.id]);
                                                } else {
                                                    setSelectedLotIds(selectedLotIds.filter(id => id !== lot.id));
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>

                                    <div className="cursor-pointer" onClick={() => setSelectedLot(lot)}>
                                        <div className="flex justify-between items-start mb-2 pr-6"> {/* pr-6 to avoid overlap with checkbox */}
                                            <span className="font-bold text-gray-900">{lot.lotNumber}</span>
                                            {lot.blockNumber && <span className="text-xs font-mono text-gray-500">{lot.blockNumber}</span>}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500">{lot.area} m²</span>
                                            <div className={cn("w-2 h-2 rounded-full", lot.ownerType === "FAMILY" ? "bg-purple-500" : "bg-blue-500")} title={lot.ownerType === "FAMILY" ? "Propriété Famille" : "Propriété Elite"} />
                                        </div>
                                        {lot.status !== 'available' && (
                                            <div className="mt-2 pt-2 border-t border-gray-100/50">
                                                <p className="text-[10px] uppercase font-bold text-gray-600 truncate">
                                                    {lot.client ? `${lot.client.firstName} ${lot.client.lastName}` : translateStatus(lot.status)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white shadow overflow-hidden border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ilot</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surface</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propriétaire</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredLots.map((lot: any) => (
                                        <tr key={lot.id} onClick={() => setSelectedLot(lot)} className="hover:bg-gray-50 cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lot.blockNumber || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lot.lotNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.area} m²</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={cn("px-2 py-0.5 rounded text-xs font-bold", lot.ownerType === 'FAMILY' ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800")}>{lot.ownerType}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lot.client ? `${lot.client.firstName} ${lot.client.lastName}` : "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold border", getStatusColor(lot.status))}>{translateStatus(lot.status)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{formatCurrency(lot.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Generate Lots */}
            {isGenerateOpen && (
                <DivWrapper title="Générer des Lots (En masse)" onClose={() => setIsGenerateOpen(false)}>
                    <fetcher.Form method="post" onSubmit={() => setIsGenerateOpen(false)} className="space-y-4">
                        <input type="hidden" name="intent" value="generate-lots" />
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium">Nombre de lots</label><input required name="count" type="number" className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Numéro de départ</label><input required name="startNumber" type="number" defaultValue="1" className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Ilot (Optionnel)</label><input name="blockNumber" placeholder="Ex: Ilot 4" className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Préfixe</label><input name="prefix" defaultValue="Lot" className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Surface (m²)</label><InputRequired name="area" type="number" className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Prix Unitaire</label><InputRequired name="price" type="number" className="w-full rounded border-gray-300" /></div>
                            <div className="col-span-2"><label className="text-sm font-medium">Propriétaire</label>
                                <select name="ownerType" className="w-full rounded border-gray-300">
                                    <option value="ELITE">Elite Immobilier</option>
                                    <option value="FAMILY">Famille (Partenaire)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsGenerateOpen(false)} className="px-4 py-2 text-sm text-gray-600">Annuler</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">Générer</button>
                        </div>
                    </fetcher.Form>
                </DivWrapper>
            )}

            {/* Modal: Add Single Lot */}
            {isAddLotOpen && (
                <DivWrapper title="Ajouter un Lot" onClose={() => setIsAddLotOpen(false)}>
                    <fetcher.Form method="post" onSubmit={() => setIsAddLotOpen(false)} className="space-y-4">
                        <input type="hidden" name="intent" value="add-lot" />
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium">Numéro du Lot</label><input required name="lotNumber" placeholder="Ex: Lot 15" className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Ilot (Optionnel)</label><input name="blockNumber" placeholder="Ex: Ilot A" className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Surface (m²)</label><InputRequired name="area" type="number" className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Prix</label><InputRequired name="price" type="number" className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Type</label>
                                <select name="type" className="w-full rounded border-gray-300">
                                    <option value="habitation">Habitation</option>
                                    <option value="commercial">Commercial</option>
                                </select>
                            </div>
                            <div><label className="text-sm font-medium">Propriétaire</label>
                                <select name="ownerType" className="w-full rounded border-gray-300">
                                    <option value="ELITE">Elite Immobilier</option>
                                    <option value="FAMILY">Famille</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">Ajouter</button>
                        </div>
                    </fetcher.Form>
                </DivWrapper>
            )}

            {/* Modal: Edit Lot (Assign Buyer / Update) */}
            {selectedLot && (
                <DivWrapper title={`Gérer ${selectedLot.lotNumber}`} onClose={() => setSelectedLot(null)}>
                    <fetcher.Form method="post" onSubmit={() => setSelectedLot(null)} className="space-y-4">
                        <input type="hidden" name="intent" value="update-lot" />
                        <input type="hidden" name="lotId" value={selectedLot.id} />

                        <div className="p-3 bg-gray-50 rounded mb-4 text-sm">
                            <p><strong>Statut Actuel:</strong> {selectedLot.status}</p>
                            <p><strong>Propriétaire:</strong> {selectedLot.ownerType}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium">Attribuer un Acquéreur (Client)</label>
                                <select name="clientId" defaultValue={selectedLot.clientId || ""} className="w-full rounded border-gray-300">
                                    <option value="">-- Aucun --</option>
                                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                                </select>
                            </div>
                            <div><label className="text-sm font-medium">Statut</label>
                                <select name="status" defaultValue={selectedLot.status} className="w-full rounded border-gray-300">
                                    <option value="available">Disponible</option>
                                    <option value="reserved">Réservé</option>
                                    <option value="sold">Vendu</option>
                                    <option value="pre_financed">Pré-financé</option>
                                </select>
                            </div>
                            <div><label className="text-sm font-medium">Ilot</label><input name="blockNumber" defaultValue={selectedLot.blockNumber || ""} className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Prix</label><input name="price" type="number" defaultValue={selectedLot.price} className="w-full rounded border-gray-300" /></div>
                            <div><label className="text-sm font-medium">Propriétaire du Lot</label>
                                <select name="ownerType" defaultValue={selectedLot.ownerType} className="w-full rounded border-gray-300">
                                    <option value="ELITE">Elite Immobilier</option>
                                    <option value="FAMILY">Famille</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t mt-4">
                            <button type="submit" name="intent" value="delete-lot" onClick={e => { if (!confirm("Supprimer ce lot ?")) e.preventDefault(); }} className="text-red-600 text-sm flex items-center gap-1 hover:underline">
                                <Trash2 className="w-3 h-3" /> Supprimer ce lot
                            </button>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSelectedLot(null)} className="px-4 py-2 text-sm text-gray-600">Fermer</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">Enregistrer</button>
                            </div>
                        </div>
                    </fetcher.Form>
                </DivWrapper>
            )}

            {/* Bulk Edit Logic */}
            <BulkEditModal isOpen={isBulkEditOpen} onClose={() => setIsBulkEditOpen(false)} lotIds={selectedLotIds} fetcher={fetcher} />
        </div>
    );
}



// Bulk Edit Modal
function BulkEditModal({ isOpen, onClose, lotIds, fetcher }: { isOpen: boolean, onClose: () => void, lotIds: string[], fetcher: any }) {
    if (!isOpen) return null;
    return (
        <DivWrapper title={`Modifier ${lotIds.length} lots`} onClose={onClose}>
            <fetcher.Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="bulk-update-lots" />
                <input type="hidden" name="lotIds" value={JSON.stringify(lotIds)} />

                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                    Seuls les champs remplis seront modifiés pour les lots sélectionnés.
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Statut</label>
                        <select name="status" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option value="">-- Ne pas changer --</option>
                            <option value="available">Disponible</option>
                            <option value="reserved">Réservé</option>
                            <option value="sold">Vendu</option>
                            <option value="pre_financed">Pré-financé</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Propriétaire</label>
                        <select name="ownerType" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option value="">-- Ne pas changer --</option>
                            <option value="ELITE">Elite Immobilier</option>
                            <option value="FAMILY">Famille</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Prix</label>
                        <input type="number" name="price" placeholder="Laisser vide pour garder le prix actuel" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium">Annuler</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Appliquer les modifications</button>
                </div>
            </fetcher.Form>
        </DivWrapper>
    );
}

function InputRequired(props: any) { return <input {...props} required className={cn("w-full rounded border-gray-300", props.className)} />; }

function DivWrapper({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}
