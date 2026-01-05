import { type LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { Building2, MapPin, Tag, Home, Plus } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_VIEW);

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    if (!employee || !employee.agencyId) {
        throw new Response("Agence non trouvée", { status: 404 });
    }

    const properties = await prisma.property.findMany({
        where: {
            agencyId: employee.agencyId
        },
        orderBy: { createdAt: 'desc' }
    });

    return { properties, agencyId: employee.agencyId };
}

export default function AgencyProperties() {
    const { properties, agencyId } = useLoaderData<typeof loader>();

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-purple-600" />
                    Biens en Portefeuille
                </h2>
                {/* Director only view */}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                    <div key={property.id} className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        <div className="h-48 bg-gray-200 relative">
                            {property.images && property.images.length > 0 ? (
                                <img
                                    src={property.images[0]}
                                    alt={property.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Home className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2">
                                <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-semibold rounded text-gray-800 uppercase shadow-sm">
                                    {property.type}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                {property.title}
                            </h3>
                            <div className="flex items-center text-gray-500 text-sm mb-3">
                                <MapPin className="w-3 h-3 mr-1" />
                                {property.city} - {property.address}
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-lg font-bold text-blue-600">
                                    {formatCurrency(property.price)}
                                </span>
                                <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-800 capitalize">
                                    {property.status === 'available' ? 'Disponible' : property.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {properties.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun bien dans le portefeuille</h3>
                        <p className="mt-1 text-sm text-gray-500">Commencez par ajouter des biens à votre agence.</p>
                        <div className="mt-6">
                            <Link
                                to={`/properties/new?agencyId=${agencyId}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                Ajouter un bien
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
