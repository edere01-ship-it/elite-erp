import type { Invoice } from "~/types/finance_advanced";
import { FileText, Printer, Send, Search, Download, Filter, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { useFetcher } from "react-router";

interface InvoiceManagerProps {
    invoices: Invoice[];
}

export function InvoiceManager({ invoices }: InvoiceManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const fetcher = useFetcher();

    const handlePrint = (invoiceId: string) => {
        // In a real app, this would open a generated PDF route: window.open(`/invoices/${invoiceId}/print`, '_blank');
        // For now, we simulate a print by using window.print() but ideally we'd isolate the invoice.
        // Let's just alert for the "Export/Download" distinctness or just assume browser print.
        window.print();
    };

    const handleDownload = (invoiceId: string) => {
        // Typically hits a .pdf endpoint
        alert("Le téléchargement PDF sera implémenté via une route API dédiée.");
    };

    const handleSend = (invoiceId: string) => {
        if (confirm("Confirmer l'envoi de cette facture au client par email ?")) {
            fetcher.submit(
                { intent: "send-invoice", id: invoiceId },
                { method: "post" }
            );
        }
    };

    // --- Filtering Logic ---
    const filteredInvoices = invoices.filter(invoice => {
        const matchSearch =
            invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchStatus = statusFilter === "all" || invoice.status === statusFilter;

        return matchSearch && matchStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Facturation & Devis</h3>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="relative w-full sm:w-96">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2"
                        placeholder="Rechercher par numéro ou client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="draft">Brouillon</option>
                        <option value="sent">Envoyée</option>
                        <option value="paid">Payée</option>
                        <option value="overdue">En retard</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Numéro
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Client
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Date & Échéance
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Montant TTC
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
                        {filteredInvoices.length > 0 ? (
                            filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <div className="font-medium text-gray-900">{invoice.number}</div>
                                                <div className="text-xs text-gray-500 capitalize">{invoice.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                        {invoice.clientName}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        <div className="flex flex-col text-xs">
                                            <span>Émis: {new Date(invoice.issueDate).toLocaleDateString()}</span>
                                            <span>Échéance: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">
                                        {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(invoice.total)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={cn(
                                                "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                                                invoice.status === "paid"
                                                    ? "bg-green-100 text-green-800"
                                                    : invoice.status === "sent"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : invoice.status === "overdue"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-gray-100 text-gray-800"
                                            )}
                                        >
                                            {invoice.status === "paid" ? "Payée" : invoice.status === "sent" ? "Envoyée" : invoice.status === "overdue" ? "En retard" : "Brouillon"}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handlePrint(invoice.id)} className="text-gray-400 hover:text-gray-600" title="Imprimer">
                                                <Printer className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDownload(invoice.id)} className="text-gray-400 hover:text-gray-600" title="Télécharger PDF">
                                                <Download className="h-4 w-4" />
                                            </button>
                                            {invoice.status !== 'paid' && (
                                                <button
                                                    onClick={() => handleSend(invoice.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title={invoice.status === 'sent' ? "Renvoyer" : "Envoyer"}
                                                    disabled={fetcher.state === 'submitting'}
                                                >
                                                    <Send className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                                        <p>Aucune facture trouvée pour ces critères.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
