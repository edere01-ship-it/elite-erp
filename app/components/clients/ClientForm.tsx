import { Form } from "react-router";
import { Loader2 } from "lucide-react";

interface ClientFormProps {
    defaultValues?: any;
    isSubmitting: boolean;
    onCancel: () => void;
}

export function ClientForm({ defaultValues, isSubmitting, onCancel }: ClientFormProps) {
    return (
        <Form method="post" encType="multipart/form-data" className="space-y-4">
            {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Prénom</label>
                    <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        required
                        defaultValue={defaultValues?.firstName}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nom</label>
                    <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        required
                        defaultValue={defaultValues?.lastName}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        defaultValue={defaultValues?.email}
                        placeholder="Optionnel"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input
                        type="tel"
                        name="phone"
                        id="phone"
                        required
                        defaultValue={defaultValues?.phone}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="idType" className="block text-sm font-medium text-gray-700">Type de Pièce</label>
                    <select
                        name="idType"
                        id="idType"
                        defaultValue={defaultValues?.idType || "CNI"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="CNI">CNI</option>
                        <option value="PASSEPORT">PASSEPORT</option>
                        <option value="PERMIS DE CONDUIRE">PERMIS DE CONDUIRE</option>
                        <option value="CARTE CONSULAIRE">CARTE CONSULAIRE</option>
                        <option value="CARTE DE SEJOUR">CARTE DE SEJOUR</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700">Numéro de la Pièce</label>
                    <input
                        type="text"
                        name="idNumber"
                        id="idNumber"
                        defaultValue={defaultValues?.idNumber}
                        placeholder="Ex: C00123456"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-2 space-y-4 border-t border-gray-100 pt-4 mt-2">
                    <h4 className="font-medium text-gray-900 text-sm">Documents & Photos</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label htmlFor="photo" className="block text-sm font-medium text-gray-700">Photo de Profil</label>
                            <input
                                type="file"
                                name="photo"
                                id="photo"
                                accept="image/*"
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <div>
                            <label htmlFor="idCardRecto" className="block text-sm font-medium text-gray-700">Pièce d'Identité (Recto)</label>
                            <input
                                type="file"
                                name="idCardRecto"
                                id="idCardRecto"
                                accept="image/*,application/pdf"
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <div>
                            <label htmlFor="idCardVerso" className="block text-sm font-medium text-gray-700">Pièce d'Identité (Verso)</label>
                            <input
                                type="file"
                                name="idCardVerso"
                                id="idCardVerso"
                                accept="image/*,application/pdf"
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type de client</label>
                    <select
                        name="type"
                        id="type"
                        required
                        defaultValue={defaultValues?.type || "prospect"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="prospect">Prospect</option>
                        <option value="buyer">Acheteur</option>
                        <option value="seller">Vendeur</option>
                        <option value="tenant">Locataire</option>
                        <option value="landlord">Propriétaire Bailleur</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                        name="status"
                        id="status"
                        required
                        defaultValue={defaultValues?.status || "active"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="converted">Converti</option>
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        name="notes"
                        id="notes"
                        rows={3}
                        defaultValue={defaultValues?.notes}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Préférences, budget, besoins spécifiques..."
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
                    value={defaultValues ? "update" : "create"}
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
