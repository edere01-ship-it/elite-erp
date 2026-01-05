import type { Asset } from "~/types/it";
import { Laptop, Monitor, Printer, Server, Wifi, FileKey } from "lucide-react";
import { cn } from "~/lib/utils";

interface AssetListProps {
    assets: Asset[];
    onDelete?: (id: string) => void;
}

export function AssetList({ assets, onDelete }: AssetListProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'laptop': return <Laptop className="h-5 w-5 text-gray-500" />;
            case 'desktop': return <Monitor className="h-5 w-5 text-gray-500" />;
            case 'printer': return <Printer className="h-5 w-5 text-gray-500" />;
            case 'server': return <Server className="h-5 w-5 text-blue-500" />;
            case 'network': return <Wifi className="h-5 w-5 text-blue-500" />;
            default: return <FileKey className="h-5 w-5 text-yellow-500" />;
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Matériel
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            N° Série
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Affectation
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Achat
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Statut
                        </th>
                        {onDelete && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50 group">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {getIcon(asset.type)}
                                    <div>
                                        <div className="font-medium text-gray-900">{asset.name}</div>
                                        <div className="text-xs text-gray-500 capitalize">{asset.type}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-mono text-gray-600">
                                {asset.serialNumber}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">
                                {asset.assignedTo || <span className="text-gray-400 italic">Non assigné</span>}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {new Date(asset.purchaseDate).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span
                                    className={cn(
                                        "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                                        asset.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : asset.status === "repair"
                                                ? "bg-orange-100 text-orange-800"
                                                : "bg-gray-100 text-gray-800"
                                    )}
                                >
                                    {asset.status === "active" ? "Actif" : asset.status === "repair" ? "En réparation" : "Retiré"}
                                </span>
                            </td>
                            {onDelete && (
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                    <button
                                        onClick={() => onDelete(asset.id)}
                                        className="text-red-600 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
