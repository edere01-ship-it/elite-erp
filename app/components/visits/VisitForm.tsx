import { Form } from "react-router";
import { Loader2 } from "lucide-react";
import type { Property } from "@prisma/client";
import type { Client } from "@prisma/client";
import type { User } from "@prisma/client";

interface VisitFormProps {
    defaultValues?: any;
    properties: Property[];
    clients: Client[];
    agents: User[];
    isSubmitting: boolean;
    onCancel: () => void;
}

export function VisitForm({ defaultValues, properties, clients, agents, isSubmitting, onCancel }: VisitFormProps) {
    return (
        <Form method="post" className="space-y-4">
            {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}
            <input type="hidden" name="intent" value={defaultValues ? "update" : "create"} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">Propriété concernée</label>
                    <select
                        name="propertyId"
                        id="propertyId"
                        required
                        defaultValue={defaultValues?.propertyId || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">Sélectionner une propriété</option>
                        {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                                {property.title} ({property.city})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Client / Prospect</label>
                    <select
                        name="clientId"
                        id="clientId"
                        required
                        defaultValue={defaultValues?.clientId || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">Sélectionner un client</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.firstName} {client.lastName} ({client.type})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        name="date"
                        id="date"
                        required
                        defaultValue={defaultValues?.date ? new Date(defaultValues.date).toISOString().split('T')[0] : ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700">Heure</label>
                    <input
                        type="time"
                        name="time"
                        id="time"
                        required
                        defaultValue={defaultValues?.time ? new Date(defaultValues.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "10:00"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="agentId" className="block text-sm font-medium text-gray-700">Agent en charge</label>
                    <select
                        name="agentId"
                        id="agentId"
                        required
                        defaultValue={defaultValues?.agentId || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">Sélectionner un agent</option>
                        {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                                {agent.username} ({agent.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut de la visite</label>
                    <select
                        name="status"
                        id="status"
                        required
                        defaultValue={defaultValues?.status || "scheduled"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="scheduled">Programmée</option>
                        <option value="completed">Effectuée</option>
                        <option value="cancelled">Annulée</option>
                        <option value="no_show">Client absent</option>
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes / Feedback</label>
                    <textarea
                        name="notes"
                        id="notes"
                        rows={3}
                        defaultValue={defaultValues?.notes}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Remarques après visite, intérêt du client..."
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
                    disabled={isSubmitting}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {defaultValues ? "Enregistrer" : "Planifier"}
                </button>
            </div>
        </Form>
    );
}
