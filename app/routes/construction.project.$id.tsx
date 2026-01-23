import { type LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { HardHat, ArrowLeft, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { cn } from "~/lib/utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
    await requirePermission(request, PERMISSIONS.CONSTRUCTION_VIEW);
    const { id } = params;
    if (!id) throw new Response("ID du Projet Requis", { status: 400 });

    const project = await prisma.constructionProject.findUnique({
        where: { id },
        include: { manager: true }
    });

    if (!project) throw new Response("Projet de construction introuvable", { status: 404 });

    return { project };
}

export default function ConstructionDetail() {
    const { project } = useLoaderData<typeof loader>();
    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex sm:items-center justify-between sm:flex-row flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <HardHat className="text-orange-600" />
                        {project.name}
                    </h1>
                    <p className="text-gray-500 flex items-center gap-2 text-sm mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">{project.location}</span>
                        <span className="text-gray-300">|</span>
                        <span>Manager: {project.manager?.username}</span>
                        <span className="text-gray-300">|</span>
                        <span className={cn("uppercase text-xs font-bold px-2 py-0.5 rounded",
                            project.status === 'in_progress' ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        )}>{project.status.replace("_", " ")}</span>
                    </p>
                </div>
                <Link to="/construction" className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-xs uppercase font-bold tracking-wide mb-2">Budget Global</h3>
                    <div className="text-3xl font-bold text-gray-900">{formatCurrency(project.budget)}</div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Dépensé</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(project.spent)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-xs uppercase font-bold tracking-wide mb-2">Planning</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <div>
                                <div className="text-xs text-gray-500">Début</div>
                                <div className="font-medium">{new Date(project.startDate).toLocaleDateString()}</div>
                            </div>
                        </div>
                        {project.endDate && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-xs text-gray-500">Fin Estimée</div>
                                    <div className="font-medium">{new Date(project.endDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-blue-100 flex items-center justify-center mb-2 relative">
                        <span className="text-2xl font-bold text-blue-600">{project.progress}%</span>
                        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-transparent" />
                            <circle cx="50%" cy="50%" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-blue-500" strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - project.progress / 100)}`} />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Avancement Global</span>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow min-h-[200px] p-8 border border-gray-200 flex items-center justify-center text-gray-400">
                <p>Liste des tâches et jalons (Milestones) à implémenter...</p>
            </div>
        </div>
    );
}
