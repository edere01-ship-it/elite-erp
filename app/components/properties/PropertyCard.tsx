import { MapPin, Bed, Maximize, Edit, Trash2 } from "lucide-react";
import { type Property } from "@prisma/client";

interface PropertyCardProps {
    property: Property;
    onEdit: (property: Property) => void;
    onDelete: (id: string) => void;
}

export function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps) {
    const imageUrl = property.images && property.images.length > 0 ? property.images[0] : "https://placehold.co/600x400?text=No+Image";

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800';
            case 'sold': return 'bg-red-100 text-red-800';
            case 'rented': return 'bg-blue-100 text-blue-800';
            case 'reserved': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available': return 'Disponible';
            case 'sold': return 'Vendu';
            case 'rented': return 'Loué';
            case 'reserved': return 'Réservé';
            default: return status;
        }
    };

    return (
        <div className="overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-md">
            <div className="relative h-48 w-full bg-gray-200">
                <img
                    src={imageUrl}
                    alt={property.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Error" }}
                />
                <span className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(property.status)}`}>
                    {getStatusLabel(property.status)}
                </span>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">{property.type}</p>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{property.price.toLocaleString('fr-FR')} FCFA</p>
                </div>

                <div className="mt-4 flex items-center text-sm text-gray-500">
                    <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{property.address}, {property.city}</span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <Maximize className="mr-1.5 h-4 w-4 text-gray-400" />
                            {property.area} m²
                        </div>
                        <div className="flex items-center">
                            <Bed className="mr-1.5 h-4 w-4 text-gray-400" />
                            {property.rooms} p.
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(property)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(property.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );
}
