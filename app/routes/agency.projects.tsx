import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { getLandDevelopments } from "~/services/projects.server";
import { HardHat, Map, ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_VIEW);

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

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600">
                        Projets Immobiliers
                    </h1>
                    <p className="text-gray-500 mt-1">Gérez vos lotissements et chantiers de construction.</p>
                </div>
                <Link
                    to="/agency/projects/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-md transition-all hover:-translate-y-0.5"
                >
                    <Map className="w-5 h-5" />
                    <span>Nouveau Lotissement</span>
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
                    <strong className="font-bold">Erreur : </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Global Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Map className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Lotissements Actifs</p>
                        <p className="text-2xl font-bold text-gray-900">{developments.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                        <HardHat className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Chantiers en cours</p>
                        <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status === 'in_progress').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Lots Disponibles</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {developments.reduce((acc, curr: any) => acc + (curr.availableLots || 0), 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Land Developments Section */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <span className="bg-blue-100 text-blue-800 p-1.5 rounded-lg"><Map className="w-5 h-5" /></span>
                    <h2 className="text-xl font-bold text-gray-800">Sites de Lotissement</h2>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {developments.map((d) => {
                        const dev = d as any;
                        return (
                            <div key={dev.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col">
                                {/* Card Header with localized gradient */}
                                <div className="h-28 bg-gradient-to-br from-slate-50 to-blue-50 relative p-5 flex flex-col justify-between group-hover:from-blue-50 group-hover:to-indigo-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className={cn("px-2.5 py-1 text-xs font-bold uppercase rounded-full tracking-wide shadow-sm backdrop-blur-sm",
                                            dev.status === 'in_progress' ? 'bg-blue-600/90 text-white' : 'bg-gray-500/90 text-white'
                                        )}>
                                            {dev.status === 'in_progress' ? 'En Cours' : dev.status}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                                        {dev.name}
                                    </h3>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1 flex flex-col gap-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Map className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="truncate">{dev.location}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <div className="text-[10px] uppercase font-bold text-gray-400">Superficie</div>
                                            <div className="font-semibold text-gray-900">{dev.totalArea} m²</div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <div className="text-[10px] uppercase font-bold text-gray-400">Lots</div>
                                            <div className="font-semibold text-gray-900">{dev._count?.lots ?? 0} <span className="text-gray-400 font-normal">/ {dev.totalLots}</span></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm pt-2">
                                        <div className="text-gray-500">Marge prévisionnelle</div>
                                        <div className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{dev.expectedMargin}%</div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 border-t border-gray-50 bg-gray-50/30 flex justify-end">
                                    <Link
                                        to={`/agency/projects/${dev.id}`}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                                    >
                                        Gérer le projet <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                    {developments.length === 0 && (
                        <div className="col-span-full border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center flex flex-col items-center bg-gray-50/50">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <Map className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Aucun lotissement</h3>
                            <p className="text-gray-500 mt-2 max-w-sm">Commencez par créer votre premier projet de lotissement pour gérer les terrains et les ventes.</p>
                            <Link to="/agency/projects/new" className="mt-6 text-blue-600 font-medium hover:underline">Créer un projet maintenant</Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Construction Projects Section */}
            <section className="pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                    <span className="bg-orange-100 text-orange-800 p-1.5 rounded-lg"><HardHat className="w-5 h-5" /></span>
                    <h2 className="text-xl font-bold text-gray-800">Chantiers & Construction</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map(project => (
                        <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center mt-1">
                                            <Map className="w-3 h-3 mr-1" /> {project.location}
                                        </p>
                                    </div>
                                    <span className={cn("px-2 py-1 text-xs rounded-full font-bold uppercase",
                                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                    )}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600 font-medium">Progression</span>
                                            <span className="font-bold text-blue-600">{project.progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Budget Total</div>
                                            <div className="font-semibold text-gray-900">{formatCurrency(project.budget)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Dépensé</div>
                                            <div className="font-semibold text-orange-600">{formatCurrency(project.spent)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <HardHat className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            Aucun chantier de construction actif pour le moment.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
