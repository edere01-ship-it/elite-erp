import { Form } from "react-router";
import { Loader2 } from "lucide-react";

interface LegalCaseFormProps {
    defaultValues?: any;
    isSubmitting: boolean;
    onCancel: () => void;
    clients: any[];
    properties: any[];
    staff: any[];
}

export function LegalCaseForm({ defaultValues, isSubmitting, onCancel, clients, properties, staff }: LegalCaseFormProps) {
    return (
        <Form method="post" className="space-y-4">
            {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre du Dossier</label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        defaultValue={defaultValues?.title}
                        placeholder="Ex: Litige Loyer Impayé - M. Koffi"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type de Dossier</label>
                    <select
                        name="type"
                        id="type"
                        required
                        defaultValue={defaultValues?.type || "dispute"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="dispute">Litige (Dispute)</option>
                        <option value="compliance">Conformité (Compliance)</option>
                        <option value="eviction">Expulsion</option>
                        <option value="consultation">Consultation</option>
                        <option value="other">Autre</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                        name="status"
                        id="status"
                        required
                        defaultValue={defaultValues?.status || "open"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="open">Ouvert</option>
                        <option value="in_progress">En cours</option>
                        <option value="pending_court">En Justice</option>
                        <option value="resolved">Résolu</option>
                        <option value="closed">Clôturé</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priorité</label>
                    <select
                        name="priority"
                        id="priority"
                        required
                        defaultValue={defaultValues?.priority || "medium"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="low">Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute</option>
                        <option value="critical">Critique</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="openedDate" className="block text-sm font-medium text-gray-700">Date d'ouverture</label>
                    <input
                        type="date"
                        name="openedDate"
                        id="openedDate"
                        required
                        defaultValue={defaultValues?.openedDate ? new Date(defaultValues.openedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Client Concerné</label>
                    <select
                        name="clientId"
                        id="clientId"
                        defaultValue={defaultValues?.clientId || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">-- Aucun --</option>
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
                        <option value="">-- Aucun --</option>
                        {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                                {property.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700">Assigné à</label>
                    <select
                        name="assignedToId"
                        id="assignedToId"
                        defaultValue={defaultValues?.assignedToId || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">-- Non assigné --</option>
                        {staff.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description / Détails</label>
                    <textarea
                        name="description"
                        id="description"
                        rows={4}
                        required
                        defaultValue={defaultValues?.description}
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
                    value={defaultValues ? "update-case" : "create-case"}
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
