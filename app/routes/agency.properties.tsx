import { type LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { Building2, MapPin, Home, Plus, Key, Tag } from "lucide-react";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_VIEW);

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    if (!employee || !employee.agencyId) {
        throw new Response("Agence non trouvée", { status: 404 });
    }

    // Fetch ONLY Built Properties (those NOT part of a development OR explicitly flagged)
    try {
        const properties = await prisma.property.findMany({
            where: {
                agencyId: employee.agencyId
            },
            orderBy: { createdAt: 'desc' },
            include: {
                occupant: true
            } as any
        });

        return { properties, agencyId: employee.agencyId, error: null };
    } catch (e: any) {
        console.error("Loader Error in Properties:", e);
        return {
            properties: [],
            agencyId: employee.agencyId,
            error: e.message || "Erreur de chargement des biens"
        };
    }
}

export default function AgencyProperties() {
    const { properties, agencyId, error } = useLoaderData<typeof loader>();

    const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Erreur : </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-purple-600" />
                        Biens Construits & Mandats
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Gestion du portefeuille de biens (Vente, Location, Gestion).</p>
                </div>

                <Link
                    to={`/properties/new?agencyId=${agencyId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Ajouter un bien
                </Link>
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
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                    <Home className="w-12 h-12 opacity-20" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded text-gray-800 uppercase shadow-sm">
                                    {property.type}
                                </span>
                                {property.features?.includes('Mandat Exclusif') && (
                                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded shadow-sm uppercase">
                                        Exclusif
                                    </span>
                                )}
                            </div>
                            <div className="absolute bottom-2 left-2">
                                <span className={cn("px-2 py-1 text-xs font-semibold rounded shadow-sm capitalize",
                                    property.status === 'available' ? 'bg-green-100 text-green-800' :
                                        property.status === 'rented' ? 'bg-blue-100 text-blue-800' :
                                            property.status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                )}>
                                    {property.status === 'available' ? 'Disponible' :
                                        property.status === 'rented' ? 'Loué / Occupé' : property.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                                    {property.title}
                                </h3>
                            </div>

                            <div className="text-sm text-gray-500 flex items-center mb-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate">{property.city} - {property.address}</span>
                            </div>

                            {(property as any).reference && (
                                <div className="text-xs text-gray-400 font-mono mb-3">Ref: {(property as any).reference}</div>
                            )}

                            <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
                                <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-xs text-gray-500">Surface</div>
                                    <div className="font-semibold text-gray-900">{property.area} m²</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-xs text-gray-500">Pièces</div>
                                    <div className="font-semibold text-gray-900">{property.rooms}</div>
                                </div>
                            </div>

                            {/* Rental Info if Rented */}
                            {property.status === 'rented' && (property as any).occupant && (
                                <div className="mb-4 bg-blue-50 border border-blue-100 p-2 rounded flex items-center gap-2">
                                    <Key className="w-4 h-4 text-blue-500" />
                                    <div>
                                        <div className="text-xs text-blue-900 font-bold">Occupant</div>
                                        <div className="text-xs text-blue-700">{(property as any).occupant.firstName} {(property as any).occupant.lastName}</div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div>
                                    <span className="text-lg font-bold text-purple-700 block">
                                        {formatCurrency(property.price)}
                                        {property.status === 'rented' || property.status === 'available' ? <span className="text-xs font-normal text-gray-500"> / vente</span> : ''}
                                    </span>
                                    {(property as any).rentalValue && (
                                        <span className="text-xs text-gray-600 font-medium">
                                            Loyer: {formatCurrency((property as any).rentalValue)}
                                        </span>
                                    )}
                                </div>
                                <Link to={`/properties/${property.id}`} className="text-sm font-medium text-purple-600 hover:text-purple-800">
                                    Détails &rarr;
                                </Link>
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
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
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
