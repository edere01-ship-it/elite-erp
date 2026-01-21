import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { getLandDevelopments } from "~/services/projects.server";
import { HardHat, Map, ArrowRight, TrendingUp, PlusCircle } from "lucide-react";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    // Correct permission for this module is CONSTRUCTION_VIEW
    const user = await requirePermission(request, PERMISSIONS.CONSTRUCTION_VIEW);

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    if (!employee?.agencyId) {
        // Parent layout (agency.tsx) handles the UI for missing agency
        // We return empty data here to prevent loader crashes/console errors
        return { projects: [], developments: [], error: null };
    }
    const agencyId = employee.agencyId;

    let projects: any[] = [];
    let developments: any[] = [];
    let error: string | null = null;

    try {
        // Fetch Construction Projects
        projects = await prisma.constructionProject.findMany({
            where: {
                manager: {
                    employee: {
                        agencyId: agencyId
                    }
                }
            },
            include: { manager: { include: { employee: true } } },
            orderBy: { startDate: 'desc' }
        });
    } catch (e: any) {
        console.error("Projects Fetch Error:", e);
        error = "Erreur chargement chantiers: " + (e.message || "Unknown");
    }

    try {
        // Fetch Land Developments
        developments = await getLandDevelopments();
    } catch (e: any) {
        console.error("Developments Fetch Error:", e);
        // Append error if one already exists
        error = error ? `${error} | Lotissements: ${e.message}` : `Erreur lotissements: ${e.message}`;
    }

    return { projects, developments, error };
}

export default function AgencyProjects() {
    const { projects, developments, error } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState<'developments' | 'constructions'>('developments');

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Projets Immobiliers</h1>
                        <p className="text-blue-100 max-w-xl text-lg">
                            Plateforme de gestion centralisée pour vos lotissements et chantiers de construction.
                        </p>
                    </div>

                    {/* Global Quick Stats */}
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                            <div className="text-xs text-blue-200 uppercase font-bold">Lotissements</div>
                            <div className="text-2xl font-bold">{developments.length}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                            <div className="text-xs text-blue-200 uppercase font-bold">Chantiers</div>
                            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'in_progress').length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm animate-pulse" role="alert">
                    <strong className="font-bold">Erreur : </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Main Content Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
                <div className="border-b border-gray-100 p-2">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('developments')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
                                activeTab === 'developments'
                                    ? "bg-blue-50 text-blue-700 shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Map className="w-5 h-5" />
                            <span>Lotissements & Terrains</span>
                            <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-bold">
                                {developments.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('constructions')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
                                activeTab === 'constructions'
                                    ? "bg-orange-50 text-orange-700 shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <HardHat className="w-5 h-5" />
                            <span>Construction & Travaux</span>
                            <span className="ml-2 bg-orange-100 text-orange-700 py-0.5 px-2 rounded-full text-xs font-bold">
                                {projects.length}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 flex-1">
                    {activeTab === 'developments' && (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Gestion des Lotissements</h2>
                                    <p className="text-gray-500 text-sm">Créez et gérez vos sites, lots et ventes.</p>
                                </div>
                                <Link
                                    to="/agency/projects/new"
                                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Nouveau Site</span>
                                </Link>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {developments.map((d) => {
                                    const dev = d as any;
                                    return (
                                        <div key={dev.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-blue-200">
                                            <div className="h-32 bg-gradient-to-br from-slate-100 to-blue-50 relative p-6 flex flex-col justify-between group-hover:from-blue-50 group-hover:to-indigo-50 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <span className={cn("px-2.5 py-1 text-xs font-bold uppercase rounded-lg shadow-sm backdrop-blur-md",
                                                        dev.status === 'in_progress' ? 'bg-blue-500/10 text-blue-700 border border-blue-200' : 'bg-gray-500/10 text-gray-700 border border-gray-200'
                                                    )}>
                                                        {dev.status === 'in_progress' ? 'En Commercialisation' : dev.status}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                                                    {dev.name}
                                                </h3>
                                            </div>

                                            <div className="p-6 space-y-4">
                                                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                                    <Map className="w-4 h-4 mr-2 text-blue-500" />
                                                    <span className="truncate">{dev.location}</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                                        <div className="text-[10px] uppercase font-bold text-gray-400">Total</div>
                                                        <div className="font-bold text-gray-900">{dev.totalLots} Lots</div>
                                                    </div>
                                                    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                                        <div className="text-[10px] uppercase font-bold text-gray-400">Disponibles</div>
                                                        <div className="font-bold text-green-600">{dev._count?.lots ?? 0} Lots</div>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-gray-100">
                                                    <Link
                                                        to={`/agency/projects/${dev.id}`}
                                                        className="flex items-center justify-center w-full gap-2 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600 font-medium py-2.5 rounded-xl transition-all hover:bg-blue-50"
                                                    >
                                                        Gérer le Projet <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {developments.length === 0 && (
                                    <div className="col-span-full border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center flex flex-col items-center justify-center bg-gray-50">
                                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                                            <Map className="w-12 h-12 text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Aucun projet</h3>
                                        <p className="text-gray-500 mt-2 mb-6">Commencez par créer votre premier site de lotissement.</p>
                                        <Link to="/agency/projects/new" className="text-blue-600 font-semibold hover:underline">Créer un projet</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'constructions' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Chantiers & BTP</h2>
                                    <p className="text-gray-500 text-sm">Suivez vos chantiers de construction et rénovation.</p>
                                </div>
                                <Link
                                    to="/agency/projects/new-construction"
                                    className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-1"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Nouveau Chantier</span>
                                </Link>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map(project => (
                                    <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                        <HardHat className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                                                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                            <Map className="w-3 h-3 mr-1" /> {project.location}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={cn("px-2 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider",
                                                    project.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                )}>
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <div className="space-y-5">
                                                <div>
                                                    <div className="flex justify-between text-xs font-semibold mb-2 text-gray-700">
                                                        <span>Avancement Global</span>
                                                        <span className="text-blue-600">{project.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${project.progress}%` }}></div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase font-bold">Budget</div>
                                                        <div className="font-bold text-gray-900 text-sm">{formatCurrency(project.budget)}</div>
                                                    </div>
                                                    <button className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                                                        Détails
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {projects.length === 0 && (
                                    <div className="col-span-full py-16 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <HardHat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium text-gray-900">Aucun chantier actif</h3>
                                        <p className="text-gray-500 mt-1">Vos projets de construction apparaîtront ici.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
