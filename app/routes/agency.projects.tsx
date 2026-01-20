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

    if (!employee?.agencyId) throw new Response("Unauthorized", { status: 403 });
    const agencyId = employee.agencyId;

    // Fetch Construction Projects
    const projects = await prisma.constructionProject.findMany({
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

    // Fetch Land Developments
    const developments = await getLandDevelopments();

    return { projects, developments };
}

export default function AgencyProjects() {
    const { projects, developments } = useLoaderData<typeof loader>();

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="space-y-12">

            {/* Land Developments Section (Primary Focus) */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Map className="w-7 h-7 text-blue-600" />
                            Projets de Lotissement
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Gestion des terrains, lotissements et préfinancements.</p>
                    </div>
                    <Link to="/agency/projects/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm">
                        + Nouveau Lotissement
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {developments.map((d) => {
                        const dev = d as any;
                        return (
                            <div key={dev.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                                {/* Card Header & Image Placeholder */}
                                <div className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 relative p-4 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className={cn("px-2 py-1 text-xs font-bold uppercase rounded text-white shadow-sm",
                                            dev.status === 'in_progress' ? 'bg-blue-600' : 'bg-gray-500'
                                        )}>
                                            {dev.status === 'in_progress' ? 'En Cours' : dev.status}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {dev.name}
                                    </h3>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 flex-1 flex flex-col gap-4">
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Map className="w-3 h-3" /> {dev.location}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                                        <div>
                                            <div className="text-xs text-gray-500">Superficie</div>
                                            <div className="font-semibold text-gray-900">{dev.totalArea} m²</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Lots Prévus</div>
                                            <div className="font-semibold text-gray-900">{dev.totalLots}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Legal</div>
                                            <div className="font-medium text-blue-800 truncate" title={dev.legalTitle || ""}>{dev.legalTitle || "Non défini"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Marge</div>
                                            <div className="font-medium text-green-700">{dev.expectedMargin}%</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div className="text-xs text-gray-500">
                                        {dev._count?.lots ?? 0} lots générés
                                    </div>
                                    <Link to={`/agency/projects/${dev.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                        Gérer <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                    {developments.length === 0 && (
                        <div className="col-span-full border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500 flex flex-col items-center">
                            <Map className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Aucun lotissement</h3>
                            <p className="mt-1">Commencez par créer un nouveau projet immobilier.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Construction Projects Section */}
            <div className="pt-8 border-t border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <HardHat className="w-6 h-6 text-orange-600" />
                        Chantiers & Construction
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map(project => (
                        <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-5">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide
                                        ${project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 flex items-center">
                                    <Map className="w-3 h-3 mr-1" /> {project.location}
                                </p>

                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Progression</span>
                                        <span className="font-medium text-gray-900">{project.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Budget</div>
                                        <div className="font-semibold text-gray-900">{formatCurrency(project.budget)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Dépensé</div>
                                        <div className="font-semibold text-red-600">{formatCurrency(project.spent)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-500 text-sm italic">
                            Aucun chantier de construction actif.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
