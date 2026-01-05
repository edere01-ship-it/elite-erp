import type { Agency } from "~/types/agency";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface AgencyListProps {
    agencies: Agency[];
    onEdit: (agency: Agency) => void;
    onDelete: (id: string) => void;
}

export function AgencyList({ agencies, onEdit, onDelete }: AgencyListProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Nom de l'agence
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Localisation
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Gérant
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Effectif
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
                    {agencies.map((agency) => (
                        <tr key={agency.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="font-medium text-gray-900">{agency.name}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                                <div>{agency.address}</div>
                                <div className="text-xs text-gray-400">{agency.city}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                                {agency.manager}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                                <div className="text-xs text-blue-500">{agency.email}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                                {agency.employees && agency.employees.length > 0 ? (
                                    <div>
                                        <div className="font-medium">{agency.employees.length} employés</div>
                                        <div className="text-xs text-gray-400 capitalize">
                                            {/* Show top 2 positions as preview */}
                                            {Array.from(new Set(agency.employees.map(e => e.position))).slice(0, 2).join(', ')}
                                            {new Set(agency.employees.map(e => e.position)).size > 2 && '...'}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">0 employé</span>
                                )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span
                                    className={cn(
                                        "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                                        agency.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    )}
                                >
                                    {agency.status === "active" ? "Actif" : "Inactif"}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(agency)}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(agency.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
