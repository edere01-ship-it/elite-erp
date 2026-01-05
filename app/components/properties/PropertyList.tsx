import type { Property } from "~/types/property";
import { Edit, Trash2, Building } from "lucide-react";
import { cn } from "~/lib/utils";

interface PropertyListProps {
    properties: any[];
    viewMode?: 'grid' | 'list';
    onEdit?: (property: any) => void;
    onDelete?: (id: string) => void;
}

export function PropertyList({ properties, viewMode = 'list', onEdit, onDelete }: PropertyListProps) {
    if (viewMode === 'grid') {
        return (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                    <div key={property.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative h-48 bg-gray-200">
                            {property.images && property.images.length > 0 ? (
                                <img src={property.images[0]} alt={property.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">
                                    <Building className="h-12 w-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={cn(
                                    "inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5",
                                    property.status === "available" ? "bg-green-100 text-green-800" :
                                        property.status === "rented" ? "bg-blue-100 text-blue-800" :
                                            property.status === "sold" ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800"
                                )}>
                                    {property.status === "available" ? "Disponible" : property.status === "rented" ? "Loué" : property.status === "sold" ? "Vendu" : "Maintenance"}
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-medium text-gray-900">{property.title}</h3>
                            <p className="text-sm text-gray-500">{property.city}</p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-lg font-bold text-gray-900">
                                    {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(property.price)}
                                </span>
                                <div className="text-sm text-gray-500">{property.area} m²</div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                {onEdit && (
                                    <button onClick={() => onEdit(property)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button onClick={() => onDelete(property.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Bien
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Localisation
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Prix
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Status
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {properties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="font-medium text-gray-900">{property.title}</div>
                                <div className="text-xs text-gray-500">{property.area} m²</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-gray-900 capitalize">{property.type}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {property.city}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(property.price)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span
                                    className={cn(
                                        "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                                        property.status === "available"
                                            ? "bg-green-100 text-green-800"
                                            : property.status === "rented"
                                                ? "bg-blue-100 text-blue-800"
                                                : property.status === "sold"
                                                    ? "bg-gray-100 text-gray-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                    )}
                                >
                                    {property.status === "available" ? "Disponible" : property.status === "rented" ? "Loué" : property.status === "sold" ? "Vendu" : "Maintenance"}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    {onEdit && (
                                        <button onClick={() => onEdit(property)} className="text-blue-600 hover:text-blue-900">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button onClick={() => onDelete(property.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
