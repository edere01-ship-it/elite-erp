import { Form } from "react-router";
import { Loader2 } from "lucide-react";
import type { Agency } from "~/types/agency";

interface EmployeeFormProps {
    defaultValues?: any;
    agencies: Agency[];
    isSubmitting: boolean;
    onCancel: () => void;
}

export function EmployeeForm({ defaultValues, agencies, isSubmitting, onCancel }: EmployeeFormProps) {
    return (
        <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value={defaultValues?.id ? "update_employee" : "create_employee"} />
            {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        Prénom
                    </label>
                    <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        defaultValue={defaultValues?.firstName}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Nom
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        defaultValue={defaultValues?.lastName}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                    />
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
                    />
                </div>

                <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                        Poste
                    </label>
                    <input
                        type="text"
                        name="position"
                        id="position"
                        defaultValue={defaultValues?.position}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                        Département
                    </label>
                    <input
                        type="text"
                        name="department"
                        id="department"
                        defaultValue={defaultValues?.department}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                    Salaire de base (FCFA)
                </label>
                <input
                    type="text"
                    name="salary"
                    id="salary"
                    defaultValue={defaultValues?.salary}
                    required
                    placeholder="Ex: 150 000"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />

                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        Date d'embauche
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        defaultValue={defaultValues?.startDate ? new Date(defaultValues.startDate).toISOString().split('T')[0] : ''}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="agencyId" className="block text-sm font-medium text-gray-700">
                        Agence
                    </label>
                    <select
                        name="agencyId"
                        id="agencyId"
                        defaultValue={defaultValues?.agencyId || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">Aucune agence</option>
                        {agencies.map((agency: Agency) => (
                            <option key={agency.id} value={agency.id}>
                                {agency.name}
                            </option>
                        ))}
                    </select>
                </div>

                {defaultValues?.id && (
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
                            <option value="on_leave">En congé</option>
                            <option value="terminated">Terminé</option>
                        </select>
                    </div>
                )}
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
