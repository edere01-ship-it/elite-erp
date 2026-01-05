import type { Client } from "~/types/commercial";
import { User, Phone, Mail, Edit, MoreHorizontal } from "lucide-react";
import { cn } from "~/lib/utils";

interface ClientListProps {
    clients: Client[];
}

export function ClientList({ clients }: ClientListProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Clients & Prospects</h3>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Total: {clients.length}
                </span>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Intérêt / Recherche
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Contact
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
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                        <div className="text-xs text-gray-500">ID: #{client.id}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-gray-900 capitalize">{client.type}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-gray-900 truncate max-w-xs">{client.intrest}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex flex-col text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {client.contact}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> {client.email}
                                    </span>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span
                                    className={cn(
                                        "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                                        client.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : client.status === "prospect"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-gray-100 text-gray-800"
                                    )}
                                >
                                    {client.status === "active" ? "Actif" : client.status === "prospect" ? "Prospect" : "Clôturé"}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
