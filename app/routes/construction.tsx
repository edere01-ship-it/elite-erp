import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { getLandDevelopments } from "~/services/projects.server";
import { HardHat, Map, ArrowRight, TrendingUp, PlusCircle, Building2 } from "lucide-react";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/construction";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Projets Immobiliers - Elite ERP" },
        { name: "description", content: "Gestion des lotissements et des chantiers" },
    ];
}

export async function loader({ request }: LoaderFunctionArgs) {
    // Requires CONSTRUCTION_VIEW
    await requirePermission(request, PERMISSIONS.CONSTRUCTION_VIEW);

    let projects: any[] = [];
    let developments: any[] = [];
    let error: string | null = null;

    try {
        // Fetch All Construction Projects (No agency restriction for now, or filter by user role?)
        // Since this is a dedicated module, we likely show ALL projects the user has access to.
        // For now, fetch all.
        projects = await prisma.constructionProject.findMany({
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
        error = error ? `${error} | Lotissements: ${e.message}` : `Erreur lotissements: ${e.message}`;
    }

    return { projects, developments, error };
}

export default function ConstructionDashboard() {
    const { projects, developments, error } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState<'developments' | 'constructions'>('developments');

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                                <Building2 className="w-6 h-6 text-blue-300" />
                            </div>
                            <span className="text-blue-200 font-medium tracking-wide uppercase text-xs">Module Principal</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100">
                            Projets Immobiliers
                        </h1>
                        <p className="text-blue-100 max-w-xl text-lg opacity-90">
                            Pilotage centralisé des programmes de lotissement et des chantiers de construction.
                        </p>
                    </div>

                    {/* Global Quick Stats */}
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[140px]">
                            <div className="text-xs text-blue-200 uppercase font-bold mb-1">Lotissements</div>
                            <div className="text-3xl font-bold">{developments.length}</div>
                            <div className="text-xs text-blue-300 mt-1">Sites actifs</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[140px]">
                            <div className="text-xs text-orange-200 uppercase font-bold mb-1">Chantiers</div>
                            <div className="text-3xl font-bold text-orange-100">{projects.filter((p: any) => p.status === 'in_progress').length}</div>
                            <div className="text-xs text-orange-300 mt-1">En cours</div>
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
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col overflow-hidden">
                <div className="border-b border-gray-100 p-2 bg-gray-50/50">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('developments')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300",
                                activeTab === 'developments'
                                    ? "bg-white text-blue-700 shadow-md ring-1 ring-black/5"
                                    : "text-gray-500 hover:bg-white/60 hover:text-gray-900"
                            )}
                        >
                            <Map className="w-4 h-4" />
                            <span>Lotissements & Terrains</span>
                            <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-extrabold">
                                {developments.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('constructions')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300",
                                activeTab === 'constructions'
                                    ? "bg-white text-orange-700 shadow-md ring-1 ring-black/5"
                                    : "text-gray-500 hover:bg-white/60 hover:text-gray-900"
                            )}
                        >
                            <HardHat className="w-4 h-4" />
                            <span>Construction & Travaux</span>
                            <span className="ml-2 bg-orange-100 text-orange-700 py-0.5 px-2 rounded-full text-xs font-extrabold">
                                {projects.length}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-white flex-1">
                    {activeTab === 'developments' && (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Gestion des Lotissements</h2>
                                    <p className="text-gray-500">Créez et gérez vos sites, lots et ventes.</p>
                                </div>
                                <Link
                                    to="/construction/new-land"
                                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1 font-semibold"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Nouveau Site</span>
                                </Link>
                            </div>

                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {developments.map((d) => {
                                    const dev = d as any;
                                    return (
                                        <div key={dev.id} className="group bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 hover:border-blue-200 cursor-pointer">
                                            <div className="h-40 bg-gradient-to-br from-slate-50 to-blue-50 relative p-6 flex flex-col justify-between group-hover:from-blue-50 group-hover:to-indigo-50 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <span className={cn("px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg shadow-sm backdrop-blur-md tracking-wider",
                                                        dev.status === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                                    )}>
                                                        {dev.status === 'in_progress' ? 'En Commercialisation' : dev.status}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                                                    {dev.name}
                                                </h3>
                                            </div>

                                            <div className="p-6 space-y-5">
                                                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                                                    <Map className="w-4 h-4 mr-3 text-blue-500" />
                                                    <span className="truncate font-medium">{dev.location}</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                                                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total</div>
                                                        <div className="font-bold text-xl text-gray-900">{dev.totalLots}</div>
                                                    </div>
                                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-center">
                                                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Disponibles</div>
                                                        <div className="font-bold text-xl text-green-600">{dev._count?.lots ?? 0}</div>
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <Link
                                                        to={`/construction/land/${dev.id}`}
                                                        className="flex items-center justify-center w-full gap-2 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-bold py-3.5 rounded-xl transition-all"
                                                    >
                                                        Gérer le Projet <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {developments.length === 0 && (
                                    <div className="col-span-full border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center flex flex-col items-center justify-center bg-gray-50/50">
                                        <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                                            <Map className="w-12 h-12 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Aucun projet</h3>
                                        <p className="text-gray-500 mt-2 mb-8 max-w-sm">Vous n'avez pas encore créé de site de lotissement. Commencez dès maintenant.</p>
                                        <Link to="/construction/new-land" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all">Créer un Site</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'constructions' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Chantiers & BTP</h2>
                                    <p className="text-gray-500">Suivez vos chantiers de construction et rénovation.</p>
                                </div>
                                <Link
                                    to="/construction/new-project"
                                    className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-1 font-semibold"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Nouveau Chantier</span>
                                </Link>
                            </div>

                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project: any) => (
                                    <div key={project.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-2xl hover:shadow-orange-900/5 transition-all duration-300 group cursor-pointer">
                                        <div className="p-8">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                        <HardHat className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                                                        <div className="flex items-center text-xs text-gray-500 mt-1 font-medium">
                                                            <Map className="w-3 h-3 mr-1" /> {project.location}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={cn("px-3 py-1 text-[10px] rounded-full font-extrabold uppercase tracking-wide",
                                                    project.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                )}>
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <div className="space-y-6">
                                                <div>
                                                    <div className="flex justify-between text-xs font-bold mb-2 text-gray-700">
                                                        <span>Avancement Global</span>
                                                        <span className="text-blue-600">{project.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${project.progress}%` }}></div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Budget</div>
                                                        <div className="font-bold text-gray-900 text-lg">{formatCurrency(project.budget)}</div>
                                                    </div>
                                                    <Link to={`/construction/project/${project.id}`} className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-600 hover:text-white transition-colors">
                                                        Accéder
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {projects.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                                        <div className="bg-white p-6 rounded-full shadow-sm mx-auto w-fit mb-6">
                                            <HardHat className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Aucun chantier actif</h3>
                                        <p className="text-gray-500 mt-2 mb-8 max-w-sm mx-auto">Vos projets de construction apparaîtront ici.</p>
                                        <Link to="/construction/new-project" className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg transition-all">Nouveau Chantier</Link>
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
