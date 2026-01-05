import { Form } from "react-router";
import { Loader2 } from "lucide-react";

interface PropertyFormProps {
    defaultValues?: any;
    isSubmitting: boolean;
    onCancel: () => void;
    clients?: any[];
}

export function PropertyForm({ defaultValues, isSubmitting, onCancel, clients = [] }: PropertyFormProps) {
    return (
        <Form method="post" encType="multipart/form-data" className="space-y-4">
            {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre</label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        defaultValue={defaultValues?.title}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Ex: Villa bord de mer"
                    />
                </div>

                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Prix (FCFA)</label>
                    <input
                        type="text"
                        name="price"
                        id="price"
                        required
                        defaultValue={defaultValues?.price}
                        placeholder="Ex: 10 000 000"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type de bien</label>
                    <select
                        name="type"
                        id="type"
                        required
                        defaultValue={defaultValues?.type || "apartment"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="apartment">Appartement</option>
                        <option value="villa">Villa</option>
                        <option value="land">Terrain</option>
                        <option value="commercial">Local Commercial</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                        name="status"
                        id="status"
                        required
                        defaultValue={defaultValues?.status || "available"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="available">Disponible</option>
                        <option value="sold">Vendu</option>
                        <option value="rented">Loué</option>
                        <option value="reserved">Réservé</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Locataire Actuel</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <select
                            name="clientId"
                            id="clientId"
                            defaultValue={defaultValues?.contracts?.length > 0 ? defaultValues.contracts[0].clientId : ""}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="">-- Aucun locataire --</option>
                            {clients?.map((client: any) => (
                                <option key={client.id} value={client.id}>
                                    {client.firstName} {client.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse</label>
                    <input
                        type="text"
                        name="address"
                        id="address"
                        required
                        defaultValue={defaultValues?.address}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ville</label>
                    <input
                        type="text"
                        name="city"
                        id="city"
                        required
                        defaultValue={defaultValues?.city}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700">Surface (m²)</label>
                    <input
                        type="number"
                        name="area"
                        id="area"
                        step="0.01"
                        required
                        defaultValue={defaultValues?.area}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="rooms" className="block text-sm font-medium text-gray-700">Pièces</label>
                    <input
                        type="number"
                        name="rooms"
                        id="rooms"
                        required
                        defaultValue={defaultValues?.rooms}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        id="description"
                        rows={3}
                        defaultValue={defaultValues?.description}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="features" className="block text-sm font-medium text-gray-700">Caractéristiques (séparées par des virgules)</label>
                    <textarea
                        name="features"
                        id="features"
                        rows={2}
                        defaultValue={defaultValues?.features?.join(", ")}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Piscine, Garage, Vue mer, Jardin..."
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="img" className="block text-sm font-medium text-gray-700">Image du bien</label>
                    <input
                        type="file"
                        name="img"
                        id="img"
                        accept="image/*"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {defaultValues?.images?.[0] && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Image actuelle :</p>
                            <img src={defaultValues.images[0]} alt="Current" className="h-20 w-auto rounded border" />
                            <input type="hidden" name="existingImage" value={defaultValues.images[0]} />
                        </div>
                    )}
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
