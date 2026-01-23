import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { Users, Calendar, MapPin, Phone } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.COMMERCIAL_VIEW); // Or AGENCY_VIEW? Let's use generic Commercial view but scoped to agency context.

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    if (!employee?.agencyId) throw new Response("Non autorisé", { status: 403 });
    const agencyId = employee.agencyId;

    // Fetch Clients linked to this Agency (via invoices, contracts, or assigned agent)
    // Schema check: Client doesn't have agencyId directly.
    // Logic: Clients who have visited a property of this agency OR have an invoice with this agency.
    // For simplicity / MVP: Fetch clients linked to VISITS on properties of this agency.

    const clients = await prisma.client.findMany({
        where: {
            OR: [
                {
                    visits: {
                        some: {
                            property: { agencyId: agencyId }
                        }
                    }
                },
                {
                    invoices: {
                        some: { agencyId: agencyId }
                    }
                }
            ]
        },
        take: 20,
        orderBy: { updatedAt: 'desc' }
    });

    const visits = await prisma.visit.findMany({
        where: {
            property: { agencyId: agencyId }
        },
        include: {
            client: true,
            property: true,
            agent: { include: { employee: true } }
        },
        orderBy: { date: 'desc' },
        take: 20
    });

    return { clients, visits };
}

export default function AgencyCommercial() {
    const { clients, visits } = useLoaderData<typeof loader>();
    // @ts-ignore
    const typedVisits = visits as any[];

    const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-8">
            {/* Visits Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-purple-600" />
                        Visites Récentes
                    </h2>
                    {/* Director only view */}
                </div>

                <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                        {typedVisits.map(visit => (
                            <li key={visit.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2">
                                            <Calendar className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">
                                                {formatDate(visit.date.toString())}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                <span className="font-medium text-gray-900">{visit.client.firstName} {visit.client.lastName}</span>
                                                <span className="mx-2 text-gray-400">•</span>
                                                <span>{visit.property.title}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                                                <Users className="w-3 h-3 mr-1" />
                                                Agent: {visit.agent.employee?.firstName} {visit.agent.employee?.lastName}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0 flex items-center">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide
                                            ${visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                            {visit.status === 'scheduled' ? 'Prévue' : visit.status === 'completed' ? 'Terminée' : 'Annulée'}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {visits.length === 0 && (
                            <li className="px-6 py-8 text-center text-gray-500">
                                Aucune visite enregistrée pour cette agence.
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Clients Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Clients Agence
                    </h2>
                    {/* Director only view */}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {clients.map(client => (
                        <div key={client.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                                {client.firstName[0]}{client.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {client.firstName} {client.lastName}
                                </p>
                                <p className="text-xs text-gray-500 truncate flex items-center">
                                    <Phone className="w-3 h-3 mr-1" /> {client.phone}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 capitalize">{client.type}</p>
                            </div>
                        </div>
                    ))}
                    {clients.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-500 border border-dashed rounded-lg">
                            Aucun client lié directement à cette agence.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
