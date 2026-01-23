import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { useState, useEffect } from "react";
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

import { PremiumBackground } from "~/components/ui/PremiumBackground";

export default function ConstructionDashboard() {
    const { projects, developments, error } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState<'developments' | 'constructions'>('developments');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    if (!mounted) return null; // Prevent hydration mismatch

    return (
        <div className="min-h-screen relative overflow-hidden font-sans text-slate-800 pb-10">
            <PremiumBackground />

            <div className="space-y-6 animate-fade-in relative z-10 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-slate-500 font-bold tracking-widest uppercase text-xs">Module Principal</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
                                Projets <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Immobiliers</span>
                            </h1>
                            <p className="text-slate-600 max-w-xl text-lg font-medium leading-relaxed">
                                Pilotage centralisé des programmes de lotissement et des chantiers de construction.
                            </p>
                        </div>

                        {/* Global Quick Stats */}
                        <div className="flex gap-4">
                            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 min-w-[140px] shadow-lg group hover:-translate-y-1 transition-transform cursor-default">
                                <div className="text-xs text-blue-600 uppercase font-black mb-1 tracking-wider">Lotissements</div>
                                <div className="text-3xl font-black text-slate-800">{developments.length}</div>
                                <div className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Sites actifs
                                </div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 min-w-[140px] shadow-lg group hover:-translate-y-1 transition-transform cursor-default">
                                <div className="text-xs text-orange-600 uppercase font-black mb-1 tracking-wider">Chantiers</div>
                                <div className="text-3xl font-black text-slate-800">{projects.filter((p: any) => p.status === 'in_progress').length}</div>
                                <div className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> En cours
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50/90 backdrop-blur border border-red-200 text-red-700 p-4 rounded-2xl shadow-sm animate-pulse flex items-start gap-3" role="alert">
                        <AlertCircle className="w-5 h-5 mt-0.5" />
                        <div>
                            <strong className="font-bold">Erreur : </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    </div>
                )}

                {/* Main Content Tabs */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 min-h-[600px] flex flex-col overflow-hidden">
                    <div className="border-b border-white/30 p-2 bg-gradient-to-r from-slate-50/50 to-white/50">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setActiveTab('developments')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300",
                                    activeTab === 'developments'
                                        ? "bg-white text-blue-600 shadow-md ring-1 ring-black/5"
                                        : "text-slate-500 hover:bg-white/40 hover:text-slate-900"
                                )}
                            >
                                <Map className="w-4 h-4" />
                                <span>Lotissements & Terrains</span>
                                <span className={cn("ml-2 py-0.5 px-2 rounded-full text-xs font-extrabold transition-colors",
                                    activeTab === 'developments' ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600")}>
                                    {developments.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('constructions')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300",
                                    activeTab === 'constructions'
                                        ? "bg-white text-orange-600 shadow-md ring-1 ring-black/5"
                                        : "text-slate-500 hover:bg-white/40 hover:text-slate-900"
                                )}
                            >
                                <HardHat className="w-4 h-4" />
                                <span>Construction & Travaux</span>
                                <span className={cn("ml-2 py-0.5 px-2 rounded-full text-xs font-extrabold transition-colors",
                                    activeTab === 'constructions' ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-600")}>
                                    {projects.length}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 flex-1 relative">
                        {activeTab === 'developments' && (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-slate-800">Gestion des Lotissements</h2>
                                        <p className="text-slate-500 font-medium mt-1">Créez et gérez vos sites, lots et ventes.</p>
                                    </div>
                                    <Link
                                        to="/construction/new-land"
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1 font-bold"
                                    >
                                        <PlusCircle className="w-5 h-5" />
                                        <span>Nouveau Site</span>
                                    </Link>
                                </div>

                                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {developments.map((d) => {
                                        const dev = d as any;
                                        return (
                                            <div key={dev.id} className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 hover:border-blue-200 cursor-pointer relative">
                                                <div className="h-40 bg-gradient-to-br from-slate-50 to-blue-50/50 relative p-6 flex flex-col justify-between group-hover:from-blue-50 group-hover:to-indigo-50 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <span className={cn("px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg shadow-sm backdrop-blur-md tracking-wider border border-white/20",
                                                            dev.status === 'in_progress' ? 'bg-blue-600/90 text-white' : 'bg-slate-200 text-slate-700'
                                                        )}>
                                                            {dev.status === 'in_progress' ? 'En Commercialisation' : dev.status}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-2xl font-extrabold text-slate-800 group-hover:text-blue-700 transition-colors truncate drop-shadow-sm">
                                                        {dev.name}
                                                    </h3>
                                                </div>

                                                <div className="p-6 space-y-5">
                                                    <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <Map className="w-4 h-4 mr-3 text-blue-500" />
                                                        <span className="truncate font-bold">{dev.location}</span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-center group-hover:border-blue-100 transition-colors">
                                                            <div className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wide">Total</div>
                                                            <div className="font-extrabold text-xl text-slate-800">{dev.totalLots}</div>
                                                        </div>
                                                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-center group-hover:border-green-100 transition-colors">
                                                            <div className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wide">Disponibles</div>
                                                            <div className="font-extrabold text-xl text-emerald-600">{dev._count?.lots ?? 0}</div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2">
                                                        <Link
                                                            to={`/construction/land/${dev.id}`}
                                                            className="flex items-center justify-center w-full gap-2 bg-slate-50 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 text-slate-600 hover:text-white font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-lg hover:shadow-blue-500/20"
                                                        >
                                                            Gérer le Projet <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {developments.length === 0 && (
                                        <div className="col-span-full border-2 border-dashed border-slate-300 rounded-3xl p-16 text-center flex flex-col items-center justify-center bg-slate-50/50">
                                            <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                                                <Map className="w-12 h-12 text-slate-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900">Aucun projet</h3>
                                            <p className="text-slate-500 mt-2 mb-8 max-w-sm font-medium">Vous n'avez pas encore créé de site de lotissement. Commencez dès maintenant.</p>
                                            <Link to="/construction/new-land" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all">Créer un Site</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'constructions' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-slate-800">Chantiers & BTP</h2>
                                        <p className="text-slate-500 font-medium mt-1">Suivez vos chantiers de construction et rénovation.</p>
                                    </div>
                                    <Link
                                        to="/construction/new-project"
                                        className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-1 font-bold"
                                    >
                                        <PlusCircle className="w-5 h-5" />
                                        <span>Nouveau Chantier</span>
                                    </Link>
                                </div>

                                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {projects.map((project: any) => (
                                        <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/60 overflow-hidden hover:shadow-2xl hover:shadow-orange-900/10 transition-all duration-300 group cursor-pointer relative">
                                            <div className="p-8">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-sm">
                                                            <HardHat className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900 line-clamp-1" title={project.name}>{project.name}</h3>
                                                            <div className="flex items-center text-xs text-slate-500 mt-1 font-bold">
                                                                <Map className="w-3 h-3 mr-1" /> {project.location}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={cn("px-3 py-1 text-[10px] rounded-full font-extrabold uppercase tracking-wide border",
                                                        project.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                            project.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                                    )}>
                                                        {project.status.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <div className="flex justify-between text-xs font-bold mb-2 text-slate-600">
                                                            <span>Avancement Global</span>
                                                            <span className="text-blue-600">{project.progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                                                            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${project.progress}%` }}></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                                        <div>
                                                            <div className="text-[10px] text-slate-400 uppercase font-black mb-0.5 tracking-wider">Budget</div>
                                                            <div className="font-extrabold text-slate-800 text-lg">{formatCurrency(project.budget)}</div>
                                                        </div>
                                                        <Link to={`/construction/project/${project.id}`} className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-600 hover:text-white transition-colors shadow-sm">
                                                            Accéder
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {projects.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <div className="bg-white p-6 rounded-full shadow-sm mx-auto w-fit mb-6">
                                                <HardHat className="w-10 h-10 text-slate-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900">Aucun chantier actif</h3>
                                            <p className="text-slate-500 mt-2 mb-8 max-w-sm mx-auto font-medium">Vos projets de construction apparaîtront ici.</p>
                                            <Link to="/construction/new-project" className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg transition-all">Nouveau Chantier</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
// Add missing import for AlertCircle
import { AlertCircle } from "lucide-react";
