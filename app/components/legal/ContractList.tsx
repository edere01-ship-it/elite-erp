import type { Contract } from "~/types/legal";
import { FileText, Download, MoreHorizontal, AlertCircle, CheckCircle, Clock, Edit, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Form } from "react-router";

interface ContractListProps {
    contracts: Contract[];
    onEdit?: (contract: Contract) => void;
}

export function ContractList({ contracts, onEdit }: ContractListProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Contrat
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Parties
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Dates
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
                    {contracts.map((contract) => (
                        <tr key={contract.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{contract.title}</div>
                                        <div className="text-xs text-gray-500">Ref: {contract.reference}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800 capitalize">
                                    {contract.type === 'lease' ? 'Bail' :
                                        contract.type === 'sale' ? 'Vente' :
                                            contract.type === 'mandate' ? 'Mandat' : contract.type}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">
                                        {contract.client ? `${contract.client.firstName} ${contract.client.lastName}` : "Client Inconnu"}
                                    </span>
                                    <span className="text-xs">
                                        {contract.property ? contract.property.title : "Aucun bien lié"}
                                    </span>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                <div className="flex flex-col text-xs">
                                    <span>Début: {new Date(contract.startDate).toLocaleDateString()}</span>
                                    {contract.endDate && (
                                        <span>Fin: {new Date(contract.endDate).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-5",
                                        contract.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : contract.status === "expired"
                                                ? "bg-red-100 text-red-800"
                                                : contract.status === "renewal_needed"
                                                    ? "bg-orange-100 text-orange-800"
                                                    : "bg-gray-100 text-gray-800"
                                    )}
                                >
                                    {contract.status === "active" ? <CheckCircle className="h-3 w-3" /> :
                                        contract.status === "renewal_needed" ? <AlertCircle className="h-3 w-3" /> :
                                            contract.status === "expired" ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                    {contract.status === "active" ? "Actif" :
                                        contract.status === "renewal_needed" ? "À Renouveler" :
                                            contract.status === "draft" ? "Brouillon" :
                                                contract.status === "expired" ? "Expiré" : "Terminé"}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => onEdit && onEdit(contract)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Modifier"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <Form method="post" onSubmit={(e) => {
                                        if (!confirm("Êtes-vous sûr de vouloir supprimer ce contrat ?")) {
                                            e.preventDefault();
                                        }
                                    }}>
                                        <input type="hidden" name="intent" value="delete-contract" />
                                        <input type="hidden" name="id" value={contract.id} />
                                        <button type="submit" className="text-red-600 hover:text-red-900" title="Supprimer">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </Form>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
