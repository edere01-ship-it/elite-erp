import { Form } from "react-router";
import { Loader2 } from "lucide-react";

interface AgencyFormProps {
    defaultValues?: {
        id?: string;
        name?: string;
        address?: string;
        city?: string;
        manager?: string;
        phone?: string;
        email?: string;
        status?: string;
    };
    isSubmitting: boolean;
    onCancel: () => void;
}

export function AgencyForm({ defaultValues, isSubmitting, onCancel }: AgencyFormProps) {
    return (
        <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value={defaultValues?.id ? "update_agency" : "create_agency"} />
            {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nom de l'agence
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        defaultValue={defaultValues?.name}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Ex: Agence Principale"
                    />
                </div>

                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        Ville
                    </label>
                    <input
                        type="text"
                        name="city"
                        id="city"
                        defaultValue={defaultValues?.city}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Ex: Abidjan"
                    />
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Adresse / Quartier
                    </label>
                    <input
                        type="text"
                        name="address"
                        id="address"
                        defaultValue={defaultValues?.address}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Ex: Cocody Riviera 2"
                    />
                </div>

                <div>
                    <label htmlFor="manager" className="block text-sm font-medium text-gray-700">
                        Responsable / Gérant
                    </label>
                    <input
                        type="text"
                        name="manager"
                        id="manager"
                        defaultValue={defaultValues?.manager}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Nom du responsable"
                    />
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Statut
                    </label>
                    <select
                        name="status"
                        id="status"
                        defaultValue={defaultValues?.status || "active"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Téléphone
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        id="phone"
                        defaultValue={defaultValues?.phone}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="+225 ..."
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        defaultValue={defaultValues?.email}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="contact@exemple.com"
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
                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                </button>
            </div>
        </Form>
    );
}
