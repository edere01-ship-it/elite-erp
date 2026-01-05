import type { Contract, LegalCase } from "~/types/legal";
import { Scale, FileSignature, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "~/lib/utils";

interface LegalStatsProps {
    contracts: Contract[];
    cases: LegalCase[];
}

function StatCard({ label, value, icon: Icon, color, details }: { label: string, value: number, icon: any, color: string, details?: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={cn("rounded-lg p-3", color)}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
            {details && <p className="mt-4 text-sm text-gray-600">{details}</p>}
        </div>
    );
}

export function LegalDashboard({ contracts, cases }: LegalStatsProps) {
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const renewalNeeded = contracts.filter(c => c.status === 'renewal_needed').length;
    const openCases = cases.filter(c => c.status === 'open' || c.status === 'in_progress').length;
    const highPriorityCases = cases.filter(c => c.priority === 'high' && c.status !== 'closed').length;

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                label="Contrats Actifs"
                value={activeContracts}
                icon={FileSignature}
                color="bg-blue-500"
                details={`${renewalNeeded} à renouveler bientôt`}
            />
            <StatCard
                label="Dossiers Juridiques"
                value={openCases}
                icon={Scale}
                color="bg-purple-500"
                details="En cours de traitement"
            />
            <StatCard
                label="Alertes Prioritaires"
                value={highPriorityCases}
                icon={AlertTriangle}
                color="bg-red-500"
                details="Nécessite attention immédiate"
            />
            <StatCard
                label="Conformité"
                value={98}
                icon={ShieldCheck}
                color="bg-green-500"
                details="% de conformité globale"
            />
        </div>
    );
}
