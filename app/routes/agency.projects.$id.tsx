import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { Link, useLoaderData, useSubmit, Form } from "react-router";
import { useState } from "react";
import { Map, LayoutGrid, Calendar, FileText, CheckCircle2, AlertCircle, Plus, Users, DollarSign } from "lucide-react";

import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { getLandDevelopmentById, getProjectStats, generateProjectLots, createProjectPhase } from "~/services/projects.server";
import { cn, translateStatus } from "~/lib/utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
    await requirePermission(request, PERMISSIONS.AGENCY_VIEW);
    const { id } = params;
    if (!id) throw new Response("ID du Projet Requis", { status: 400 });

    const project = await getLandDevelopmentById(id);
    if (!project) throw new Response("Projet Introuvable", { status: 404 });

    const stats = await getProjectStats(id);

    return { project, stats };
}

export async function action({ request, params }: ActionFunctionArgs) {
    // Handle intents: generate-lots, add-phase, update-lot
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

export default function ProjectDetail() {
    const { project, stats } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState("overview");

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="space-y-6">
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
                    <Link to="/agency/projects" className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 text-sm font-medium">
                        Retour
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
                        <div className="text-gray-500 text-xs uppercase font-bold tracking-wide">Préfinancement</div>
                        <div className="text-2xl font-bold text-blue-600 mt-1">{stats.preFinancedLots}</div>
                        <div className="text-xs text-gray-500 mt-1">Lots réservés</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold tracking-wide">Encaissé</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.collectedAmount / 1000000)}M</div>
                        <div className="text-xs text-gray-500 mt-1">Cash disponible</div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    {['overview', 'lots', 'phases', 'finance', 'documents'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                                "whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize"
                            )}
                        >
                            {tab === 'overview' ? 'Vue d\'ensemble' :
                                tab === 'lots' ? 'Lots & Disponibilité' :
                                    tab === 'phases' ? 'Planning & Phases' :
                                        tab === 'finance' ? 'Finance & Préfi.' : 'Documents'}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Informations Légales & Foncières</h3>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Titre Juridique</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{(project as any).legalTitle || "Non défini"}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Numéro de Titre</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{(project as any).titleNumber || "Non défini"}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Propriétaire Foncier</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{(project as any).landOwner || "Non défini"}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Statut Juridique</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        <span className={cn("px-2 py-1 rounded text-xs font-semibold",
                                            (project as any).legalStatus === 'Libre' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        )}>{(project as any).legalStatus || "Non vérifié"}</span>
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Limites & Bornage</dt>
                                    <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">{(project as any).boundaries || "Aucune information de bornage."}</dd>
                                </div>
                            </dl>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Plan de Masse</h3>
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                <span className="text-gray-400 text-sm">Aperçu du Plan (Image)</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'lots' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Grille des Lots</h3>
                            <Form method="post" className="flex gap-2 items-end">
                                <input type="hidden" name="intent" value="generate-lots" />
                                <div>
                                    <label className="block text-xs text-gray-500">Prefix</label>
                                    <input name="prefix" defaultValue="Lot" className="w-16 text-sm border-gray-300 rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Qté</label>
                                    <input name="count" type="number" defaultValue="10" className="w-16 text-sm border-gray-300 rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Prix</label>
                                    <input name="price" type="number" defaultValue={(project as any).lotUnitCost * 1.5} className="w-24 text-sm border-gray-300 rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Area</label>
                                    <input name="area" type="number" defaultValue="500" className="w-16 text-sm border-gray-300 rounded" />
                                </div>
                                <button type="submit" className="bg-gray-900 text-white px-3 py-2 rounded text-sm hover:bg-black">
                                    Générer
                                </button>
                            </Form>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                            {(project as any).lots.map((lot: any) => (
                                <div key={lot.id}
                                    className={cn(
                                        "aspect-square rounded border flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 shadow-sm text-center",
                                        lot.status === 'available' ? "bg-green-50 border-green-200 text-green-800 hover:bg-green-100" :
                                            lot.status === 'sold' ? "bg-red-50 border-red-200 text-red-800" :
                                                lot.status === 'reserved' ? "bg-orange-50 border-orange-200 text-orange-800" :
                                                    "bg-blue-50 border-blue-200 text-blue-800"
                                    )}
                                    title={`Lot: ${lot.lotNumber}\nPrix: ${formatCurrency(lot.price)}\nStatut: ${translateStatus(lot.status)}`}
                                >
                                    <span className="text-xs font-bold truncate w-full">{lot.lotNumber}</span>
                                    <span className="text-[10px] opacity-75">{lot.area}m²</span>
                                </div>
                            ))}
                            {(project as any).lots.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded border border-dashed">
                                    Aucun lot généré. Utilisez le formulaire ci-dessus pour initialiser les lots.
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4 text-xs mt-4">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-200 rounded-sm"></span> Disponible</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-200 rounded-sm"></span> Réservé</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded-sm"></span> Vendu</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded-sm"></span> Préfinancé</span>
                        </div>
                    </div>
                )}

                {activeTab === 'phases' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Planning du Projet</h3>
                            <button className="text-sm text-blue-600 font-medium hover:underline">+ Ajouter une phase</button>
                        </div>

                        <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
                            {(project as any).phases.length === 0 ? (
                                <div className="pl-6 text-gray-500 italic">Aucune phase définie (Acquisition, Bornage, VRD...).</div>
                            ) : (project as any).phases.map((phase: any) => (
                                <div key={phase.id} className="relative pl-6">
                                    <span className={cn(
                                        "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white",
                                        phase.status === 'completed' ? "border-green-500 bg-green-500" :
                                            phase.status === 'in_progress' ? "border-blue-500" : "border-gray-300"
                                    )}></span>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 w-full max-w-2xl">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-md font-bold text-gray-900">{phase.name}</h4>
                                            <span className={cn("text-xs px-2 py-0.5 rounded font-medium",
                                                phase.status === 'completed' ? "bg-green-100 text-green-800" :
                                                    phase.status === 'in_progress' ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-600"
                                            )}>{phase.status}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date(phase.startDate).toLocaleDateString('fr-FR')}
                                            {phase.endDate && ` - ${new Date(phase.endDate).toLocaleDateString('fr-FR')}`}
                                        </p>
                                        <div className="mt-2 text-sm text-gray-600">{phase.notes || "Pas de notes."}</div>
                                        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${phase.progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Suivi Financier & Préfinancement</h3>
                        {/* Summary Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client / Souscripteur</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot(s)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant Dû</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versé</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(project as any).subscriptions.map((sub: any) => (
                                        <tr key={sub.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{sub.client.firstName} {sub.client.lastName}</div>
                                                <div className="text-xs text-gray-500">{sub.client.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {sub.lot ? sub.lot.lotNumber : 'Non assigné'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatCurrency(sub.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                {formatCurrency(sub.depositAmount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={cn("px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                    sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                )}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(sub.contractDate).toLocaleDateString('fr-FR')}
                                            </td>
                                        </tr>
                                    ))}
                                    {(project as any).subscriptions.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                Aucun préfinancement ou souscription enregistré.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
