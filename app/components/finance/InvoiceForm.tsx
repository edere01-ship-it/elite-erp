import { Form } from "react-router";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Client } from "@prisma/client";

interface InvoiceFormProps {
    clients: Client[];
    isSubmitting: boolean;
    onCancel: () => void;
}

export function InvoiceForm({ clients, isSubmitting, onCancel }: InvoiceFormProps) {
    const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);

    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    };

    return (
        <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="create-invoice" />
            <input type="hidden" name="items" value={JSON.stringify(items)} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Client</label>
                    <select
                        name="clientId"
                        id="clientId"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">Sélectionner un client</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.firstName} {client.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type de document</label>
                    <select
                        name="type"
                        id="type"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="invoice">Facture</option>
                        <option value="quote">Devis</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">Date d'émission</label>
                    <input
                        type="date"
                        name="issueDate"
                        id="issueDate"
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Date d'échéance</label>
                    <input
                        type="date"
                        name="dueDate"
                        id="dueDate"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Articles / Services</h4>
                    <button
                        type="button"
                        onClick={addItem}
                        className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-1" /> Ajouter
                    </button>
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                    required
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>
                            <div className="w-20">
                                <input
                                    type="number"
                                    placeholder="Qté"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                    required
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>
                            <div className="w-32">
                                <input
                                    type="number"
                                    placeholder="Prix Unit."
                                    min="0"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    required
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="mt-1 text-gray-400 hover:text-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex justify-end text-sm font-bold text-gray-900">
                    Total: {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(calculateTotal())}
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
                    Créer la Facture
                </button>
            </div>
        </Form>
    );
}
