import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { Link, useLoaderData, useSubmit, Form } from "react-router";
import { useState } from "react";
import { Map, LayoutGrid, Calendar, FileText, CheckCircle2, AlertCircle, Plus, Users, DollarSign, ArrowLeft } from "lucide-react";

import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { getLandDevelopmentById, getProjectStats, generateProjectLots, createProjectPhase } from "~/services/projects.server";
import { cn } from "~/lib/utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Permission: CONSTRUCTION_VIEW or AGENCY_VIEW?
    // Since this is now in Construction module, CONSTRUCTION_VIEW is appropriate.
    await requirePermission(request, PERMISSIONS.CONSTRUCTION_VIEW);
    const { id } = params;
    if (!id) throw new Response("Project ID Required", { status: 400 });

    const project = await getLandDevelopmentById(id);
    if (!project) throw new Response("Project Not Found", { status: 404 });

    const stats = await getProjectStats(id);

    return { project, stats };
}

export async function action({ request, params }: ActionFunctionArgs) {
    await requirePermission(request, PERMISSIONS.CONSTRUCTION_MANAGE);
    const formData = await request.formData();
    const intent = formData.get("intent");
    const projectId = params.id;

    if (intent === "generate-lots") {
        const count = parseInt(formData.get("count") as string);
        const prefix = formData.get("prefix") as string;
        const price = parseFloat(formData.get("price") as string);
        const area = parseFloat(formData.get("area") as string);
        await generateProjectLots(projectId!, count, prefix, 1, price, area);
        return { success: true };
    }

    if (intent === "add-phase") {
        const name = formData.get("name") as string;
        const startDate = new Date(formData.get("startDate") as string);
        await createProjectPhase({
            name,
            startDate,
            status: "pending",
            developmentId: projectId!
        });
        return { success: true };
    }

    return null;
}

export default function LandDetail() {
    const { project, stats } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState("overview");

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex sm:items-center justify-between sm:flex-row flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Map className="text-blue-600" />
                        {project.name}
                    </h1>
                    <p className="text-gray-500 flex items-center gap-2 text-sm mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">{project.location}</span>
                        <span className="text-gray-300">|</span>
                        <span>{project.totalLots} Lots Prévus</span>
                        <span className="text-gray-300">|</span>
                        <span className={cn("uppercase text-xs font-bold px-2 py-0.5 rounded",
                            project.status === 'in_progress' ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        )}>{project.status.replace("_", " ")}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link to="/construction" className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Retour
                    </Link>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Rapport
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
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

            {/* Main Content Area - Just a placeholder for the Tabs content which was likely large in original file */}
            <div className="bg-white rounded-lg shadow min-h-[400px] p-8 border border-gray-200 flex items-center justify-center text-gray-400">
                <p>Contenu détaillé du lotissement (Carte, Lots, Transactions) à migrer...</p>
            </div>
        </div>
    );
}
