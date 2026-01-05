import type { Transaction } from "~/types/finance";
import { ArrowUpCircle, ArrowDownCircle, Search, Filter, Download, FileSpreadsheet } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";

interface TransactionListProps {
    transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    // --- Filtering Logic ---
    const filteredTransactions = transactions.filter(t => {
        const matchesSearch =
            t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.issuerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === "all" || t.type === typeFilter;

        return matchesSearch && matchesType;
    });

    // --- Export Logic (CSV) ---
    const handleExport = () => {
        // Define CSV headers
        const headers = ["Date", "Description", "Catégorie", "Type", "Montant", "Statut", "Émis par", "Validé par"];

        const categoryMap: Record<string, string> = {
            rent: "Loyer",
            salary: "Salaire",
            sale: "Vente",
            maintenance: "Maintenance",
            marketing: "Marketing",
            fees: "Frais",
            tax: "Impôts",
            other: "Autre"
        };

        const statusMap: Record<string, string> = {
            completed: "Validé",
            pending: "En attente",
            cancelled: "Annulé",
            rejected: "Rejeté",
            processed: "Traité"
        };

        // Map data to CSV rows
        const rows = filteredTransactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
            categoryMap[t.category] || t.category,
            t.type === 'income' ? 'Revenu' : 'Dépense',
            t.amount.toString(),
            statusMap[t.status] || t.status,
            t.issuerName || '-',
            t.validatorName || '-'
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(";"), // Use semicolon for Excel compatibility in some regions, or comma
            ...rows.map(r => r.join(";"))
        ].join("\n");

        // Create Blob and download link
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM for Excel UTF-8
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:max-w-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2"
                        placeholder="Rechercher une transaction..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="all">Tous types</option>
                            <option value="income">Revenus</option>
                            <option value="expense">Dépenses</option>
                        </select>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
                        title="Exporter en Excel (CSV)"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Exporter Excel
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Description
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Catégorie
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Émis par
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Validé par
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Montant
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Statut
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center">
                                            {transaction.type === 'income' ? (
                                                <ArrowUpCircle className="mr-2 h-5 w-5 text-green-500" />
                                            ) : (
                                                <ArrowDownCircle className="mr-2 h-5 w-5 text-red-500" />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                                                <div className="text-xs text-gray-500">{transaction.paymentMethod}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800 capitalize">
                                            {transaction.category === 'rent' ? 'Loyer' :
                                                transaction.category === 'salary' ? 'Salaire' :
                                                    transaction.category === 'sale' ? 'Vente' :
                                                        transaction.category === 'maintenance' ? 'Maintenance' : 'Autre'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {transaction.issuerName || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {transaction.validatorName || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                        <span className={cn(
                                            transaction.type === 'income' ? "text-green-600" : "text-red-600"
                                        )}>
                                            {transaction.type === 'income' ? '+' : '-'} {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(transaction.amount)}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={cn(
                                                "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                                                transaction.status === "completed"
                                                    ? "bg-green-100 text-green-800"
                                                    : transaction.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-red-100 text-red-800"
                                            )}
                                        >
                                            {transaction.status === "completed" ? "Validé" : transaction.status === "pending" ? "En attente" : "Annulé"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <p>Aucune transaction trouvée.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
