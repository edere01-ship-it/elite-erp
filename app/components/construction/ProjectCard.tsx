import type { ConstructionProject } from "~/types/construction";
import { Calendar, Wallet, CheckSquare, MoreHorizontal, Hammer } from "lucide-react";
import { cn } from "~/lib/utils";

interface ProjectCardProps {
    project: ConstructionProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
    const budgetUsage = (project.budget.spent / project.budget.estimated) * 100;
    const isOverBudget = budgetUsage > 100;

    return (
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
                            <Hammer className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold leading-6 text-gray-900">{project.name}</h3>
                            <p className="text-xs text-gray-500">{project.location}</p>
                        </div>
                    </div>
                    <span className={cn(
                        "rounded-full px-2 py-1 text-xs font-semibold shadow-sm",
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
                </div>
            </div>

            <div className="flex-1 p-5 space-y-6">
                {/* Progress Section */}
                <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500 font-medium">Avancement global</span>
                        <span className="text-gray-900 font-bold">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className={cn("h-full rounded-full transition-all duration-500 bg-blue-600")}
                            style={{ width: `${project.progress}%` }}
                        />
                    </div>
                </div>

                {/* Budget Section */}
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Wallet className="h-4 w-4 text-gray-500" />
                        <h4 className="text-sm font-semibold text-gray-900">Suivi Budgétaire</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-xs text-gray-500">Estimé</span>
                            <span className="block font-medium text-gray-900">
                                {new Intl.NumberFormat("fr-CI", { style: "currency", currency: project.budget.currency }).format(project.budget.estimated)}
                            </span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500">Dépensé</span>
                            <span className={cn(
                                "block font-medium",
                                isOverBudget ? "text-red-600" : "text-green-600"
                            )}>
                                {new Intl.NumberFormat("fr-CI", { style: "currency", currency: project.budget.currency }).format(project.budget.spent)}
                            </span>
                        </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                            className={cn("h-full rounded-full transition-all duration-500", isOverBudget ? "bg-red-500" : "bg-green-500")}
                            style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Dates & Milestones Summary */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Fin: {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>{project.milestones.filter(m => m.completed).length}/{project.milestones.length} Jalons</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                <button className="w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900">
                    Voir détails
                </button>
            </div>
        </div>
    );
}
