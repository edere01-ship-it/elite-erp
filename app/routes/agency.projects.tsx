import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { HardHat, Map, TrendingUp, Calendar, AlertCircle } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_VIEW);

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    if (!employee?.agencyId) throw new Response("Unauthorized", { status: 403 });
    const agencyId = employee.agencyId;

    // Fetch Projects where the Manager is in the same agency
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

    // Developments (Assumed similar logic or needing schema update - for now simplified)
    // If 'LandDevelopment' has NO relation to agency yet, we might show none or all? 
    // Plan: Show developments linked to properties in this agency? 
    // Or just empty for now until schema update.
    // Let's check for developments that contain properties of this agency.
    const developments = await prisma.landDevelopment.findMany({
        where: {
            properties: {
                some: {
                    agencyId: agencyId
                }
            }
        },
        include: { _count: { select: { properties: true } } }
    });

    return { projects, developments };
}

export default function AgencyProjects() {
    const { projects, developments } = useLoaderData<typeof loader>();

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="space-y-8">
            {/* Construction Projects */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <HardHat className="w-6 h-6 text-orange-600" />
                        Projets de Construction
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
                        <div className="col-span-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                            Aucun projet de construction en cours pour cette agence.
                        </div>
                    )}
                </div>
            </div>

            {/* Land Developments */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Map className="w-6 h-6 text-green-600" />
                        Lotissements / Promotions
                    </h2>
                </div>

                <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                        {developments.map(dev => (
                            <li key={dev.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-md font-bold text-gray-900">{dev.name}</h3>
                                        <p className="text-sm text-gray-500">{dev.location}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                            {dev.availableLots} / {dev.totalLots} lots disponibles
                                        </div>
                                        <div className="text-xs text-green-600 font-semibold mt-1">
                                            {dev.status}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {developments.length === 0 && (
                            <li className="px-6 py-8 text-center text-gray-500">
                                Aucun lotissement actif lié à cette agence.
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
