import type { ConstructionProject } from "~/types/construction";
import { Edit, Trash2, ExternalLink } from "lucide-react";
import { cn } from "~/lib/utils";

interface ProjectListProps {
    projects: ConstructionProject[];
}

export function ProjectList({ projects }: ProjectListProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Projet
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Responsable
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Budget
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Progression
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Statut
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="font-medium text-gray-900">{project.name}</div>
                                <div className="text-xs text-gray-500">{project.location}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-gray-900 capitalize">{project.type === 'fitting_out' ? 'Aménagement' : project.type}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {project.manager}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">
                                        {new Intl.NumberFormat("fr-CI", { style: "currency", currency: project.budget.currency }).format(project.budget.estimated)}
                                    </span>
                                    <span className={cn(
                                        "text-xs",
                                        project.budget.spent > project.budget.estimated ? "text-red-600" : "text-green-600"
                                    )}>
                                        {((project.budget.spent / project.budget.estimated) * 100).toFixed(0)}% consommé
                                    </span>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                                        <div className="h-full bg-blue-600" style={{ width: `${project.progress}%` }} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{project.progress}%</span>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span
                                    className={cn(
                                        "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                                        project.status === "in_progress"
                                            ? "bg-blue-100 text-blue-800"
                                            : project.status === "completed"
                                                ? "bg-green-100 text-green-800"
                                                : project.status === "on_hold"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-gray-100 text-gray-800"
                                    )}
                                >
                                    {project.status === "in_progress" ? "En cours" : project.status === "completed" ? "Terminé" : project.status === "on_hold" ? "En pause" : "Planifié"}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <ExternalLink className="h-4 w-4" />
                                    </button>
                                    <button className="text-blue-600 hover:text-blue-900">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
