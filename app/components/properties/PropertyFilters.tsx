import { Search, Filter } from "lucide-react";

export function PropertyFilters() {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Rechercher un bien..."
                />
            </div>
            <div className="flex gap-2">
                <select className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm">
                    <option>Tous les types</option>
                    <option>Appartement</option>
                    <option>Villa</option>
                    <option>Terrain</option>
                    <option>Bureau</option>
                </select>
                <select className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm">
                    <option>Tous statuts</option>
                    <option>Disponible</option>
                    <option>Loué</option>
                    <option>Vendu</option>
                </select>
                <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    Plus de filtres
                </button>
            </div>
        </div>
    );
}
