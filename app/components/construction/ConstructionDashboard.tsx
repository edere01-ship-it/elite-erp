import type { ConstructionProject } from "~/types/construction";
import { HardHat, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { cn } from "~/lib/utils";

interface StatProps {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: string;
}

function ConstructionStat({ label, value, icon: Icon, color, trend }: StatProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                    {trend && <p className="mt-1 text-xs text-green-600">{trend}</p>}
                </div>
                <div className={cn("rounded-lg p-3", color)}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );
}

interface ConstructionDashboardProps {
    projects: ConstructionProject[];
}

export function ConstructionDashboard({ projects }: ConstructionDashboardProps) {
    const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'planning').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const delayedProjects = projects.filter(p => p.status === 'on_hold').length; // Simplification
    const totalBudget = projects.reduce((acc, p) => acc + p.budget.estimated, 0);

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ConstructionStat
                label="Chantiers Actifs"
                value={activeProjects}
                icon={HardHat}
                color="bg-blue-500"
                trend="+2 ce mois"
            />
            <ConstructionStat
                label="Budget Global Engagé"
                value={new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", notation: "compact" }).format(totalBudget)}
                icon={TrendingUp}
                color="bg-purple-500"
            />
            <ConstructionStat
                label="Projets Terminés"
                value={completedProjects}
                icon={CheckCircle}
                color="bg-green-500"
            />
            <ConstructionStat
                label="Retards / En Pause"
                value={delayedProjects}
                icon={AlertTriangle}
                color="bg-orange-500"
                trend="Attention requise"
            />
        </div>
    );
}
