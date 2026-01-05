import { Edit, Trash2, Phone, Mail, User } from "lucide-react";
import { type Client } from "@prisma/client";

interface ClientListProps {
    clients: any[];
    onEdit: (client: Client) => void;
    onDelete: (id: string) => void;
}

export function ClientList({ clients, onEdit, onDelete }: ClientListProps) {
    const getStatusBadge = (status: string) => {
        const styles = {
            active: "bg-green-100 text-green-800",
            inactive: "bg-gray-100 text-gray-800",
            converted: "bg-blue-100 text-blue-800",
        }[status] || "bg-gray-100 text-gray-800";

        const labels = {
            active: "Actif",
            inactive: "Inactif",
            converted: "Converti",
        }[status] || status;

        return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
                {labels}
            </span>
        );
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            prospect: "Prospect",
            buyer: "Acheteur",
            seller: "Vendeur",
            tenant: "Locataire",
            landlord: "Bailleur",
        };
        return types[type] || type;
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Type
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
                    {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                            <User className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {client.firstName} {client.lastName}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-gray-900 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    {client.email}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    {client.phone}
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {getTypeLabel(client.type)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                {getStatusBadge(client.status)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <button
                                    onClick={() => onEdit(client)}
                                    className="mr-2 text-blue-600 hover:text-blue-900"
                                    title="Modifier"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(client.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {clients.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                Aucun client trouvé.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
