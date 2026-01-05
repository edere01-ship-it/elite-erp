import { Form } from "react-router";
import { Loader2 } from "lucide-react";

interface ContractFormProps {
    defaultValues?: any;
    isSubmitting: boolean;
    onCancel: () => void;
    clients: any[];
    properties: any[];
}

export function ContractForm({ defaultValues, isSubmitting, onCancel, clients, properties }: ContractFormProps) {
    return (
        <Form method="post" className="space-y-4">
            {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre du Contrat</label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        defaultValue={defaultValues?.title}
                        placeholder="Ex: Bail Commercial - M. Koffi"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                        name="type"
                        id="type"
                        required
                        defaultValue={defaultValues?.type || "lease"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="lease">Bail (Lease)</option>
                        <option value="mandate">Mandat de Gestion</option>
                        <option value="sale">Vente</option>
                        <option value="service">Prestation de Service</option>
                        <option value="other">Autre</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                        name="status"
                        id="status"
                        required
                        defaultValue={defaultValues?.status || "draft"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="draft">Brouillon</option>
                        <option value="active">Actif</option>
                        <option value="expired">Expiré</option>
                        <option value="terminated">Résilié</option>
                        <option value="renewal_needed">À Renouveler</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Date de Début</label>
                    <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        required
                        defaultValue={defaultValues?.startDate ? new Date(defaultValues.startDate).toISOString().split('T')[0] : ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Date de Fin</label>
                    <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        defaultValue={defaultValues?.endDate ? new Date(defaultValues.endDate).toISOString().split('T')[0] : ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Client (Partie B)</label>
                    <select
                        name="clientId"
                        id="clientId"
                        defaultValue={defaultValues?.clientId || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">-- Sélectionner un client --</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.firstName} {client.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">Bien Concerné</label>
                    <select
                        name="propertyId"
                        id="propertyId"
                        defaultValue={defaultValues?.propertyId || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">-- Sélectionner un bien --</option>
                        {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                                {property.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Référence</label>
                    <input
                        type="text"
                        name="reference"
                        id="reference"
                        defaultValue={defaultValues?.reference}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    name="intent"
                    value={defaultValues ? "update-contract" : "create-contract"}
                    disabled={isSubmitting}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {defaultValues ? "Modifier" : "Créer"}
                </button>
            </div>
        </Form>
    );
}
