import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { UserCircle, Phone, Mail, Award, Briefcase } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_VIEW);

    // Get agency of the current manager
    const manager = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    if (!manager?.agencyId) throw new Response("Agence non trouvée", { status: 404 });

    // Fetch agents (Employees with position 'COMMERCIAL' in this agency)
    // Also aggregating their performance? For v1 just list them.
    const agents = await prisma.employee.findMany({
        where: {
            agencyId: manager.agencyId,
            position: "COMMERCIAL",
            status: "active"
        },
        include: {
            user: true, // to get username or activity
            // We could calculate sales here, but let's keep it simple or do a separate agg if needed.
        },
        orderBy: { lastName: 'asc' }
    });

    // Let's get some basic stats per agent roughly
    const agentStats = await Promise.all(agents.map(async (agent) => {
        if (!agent.userId) return { id: agent.id, sales: 0, properties: 0 };

        const [sales, properties] = await Promise.all([
            prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    recordedBy: agent.userId,
                    type: "income",
                    status: "completed",
                    category: "sale"
                }
            }),
            prisma.property.count({
                where: {
                    // Assuming we track "listedBy" or similar?
                    // Currently schema doesn't have `agentId` on Property directly, but `Visit` has.
                    // Or maybe we track by who created the property record?
                    // Standard Real Estate ERPs allow assigning properties to agents.
                    // Schema: `Property` has no `agentId`.
                    // Let's assume for now we don't track properties per agent strictly in schema yet.
                    // We will return 0 or maybe look into AuditLog? 
                    // Let's skip property count for now to avoid inaccuracy.
                    // Or count `Visit`s assigned?
                }
            })
        ]);
        return {
            id: agent.id,
            sales: sales._sum.amount || 0,
            properties: 0 // Placeholder
        };
    }));

    const statsMap = new Map(agentStats.map(s => [s.id, s]));

    return { agents, statsMap: Object.fromEntries(statsMap) };
}

export default function AgencyAgents() {
    const { agents, statsMap } = useLoaderData<typeof loader>();

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-blue-600" />
                Agents de l'Agence
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => {
                    const stats = statsMap[agent.id];
                    return (
                        <div key={agent.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="bg-blue-100 rounded-full p-3">
                                        <UserCircle className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{agent.firstName} {agent.lastName}</h3>
                                        <p className="text-sm text-gray-500">{agent.position}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <span>{agent.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        <span>{agent.phone}</span>
                                    </div>
                                </div>

                                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Ventes</p>
                                        <p className="font-semibold text-green-600 flex items-center gap-1">
                                            <Award className="w-4 h-4" />
                                            {formatCurrency(stats.sales)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Activité</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-1">
                                            <Briefcase className="w-4 h-4" />
                                            Active
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {agents.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun agent</h3>
                        <p className="mt-1 text-sm text-gray-500">Il n'y a pas encore d'agents commerciaux dans cette agence.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
