import { Form } from "react-router";
import { Loader2 } from "lucide-react";

interface TransactionFormProps {
    isSubmitting: boolean;
    onCancel: () => void;
}

export function TransactionForm({ isSubmitting, onCancel }: TransactionFormProps) {
    return (
        <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="create-transaction" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                        type="text"
                        name="description"
                        id="description"
                        required
                        placeholder="Ex: Loyer Mars 2024"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Montant (FCFA)</label>
                    <input
                        type="text" // Text to allow basic formatting
                        name="amount"
                        id="amount"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        name="date"
                        id="date"
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                        name="type"
                        id="type"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="income">Revenu (Entrée)</option>
                        <option value="expense">Dépense (Sortie)</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Catégorie</label>
                    <select
                        name="category"
                        id="category"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="rent">Loyer</option>
                        <option value="sale">Vente</option>
                        <option value="commission">Commission</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="salary">Salaire</option>
                        <option value="tax">Impôt / Taxe</option>
                        <option value="office">Bureau / Fournitures</option>
                        <option value="other">Autre</option>
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Moyen de paiement</label>
                    <select
                        name="paymentMethod"
                        id="paymentMethod"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="cash">Espèces</option>
                        <option value="check">Chèque</option>
                        <option value="transfer">Virement Bancaire</option>
                        <option value="mobile_money">Mobile Money</option>
                    </select>
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
                    Enregistrer
                </button>
            </div>
        </Form>
    );
}
