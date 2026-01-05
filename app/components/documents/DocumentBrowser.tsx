import type { FileSystemItem } from "~/types/documents";
import { Folder, FileText, Image, FileSpreadsheet, File, Download, MoreHorizontal, Search, Upload, Trash2, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState, useRef } from "react";

interface DocumentBrowserProps {
    items: FileSystemItem[];
    currentPath: string;
    onNavigate: (path: string) => void;
    onUpload?: (file: File, category: string) => void;
    onDelete?: (id: string) => void;
}

export function DocumentBrowser({ items, currentPath, onNavigate, onUpload, onDelete }: DocumentBrowserProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("other");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getIcon = (item: FileSystemItem) => {
        if (item.type === 'folder') return <Folder className="h-10 w-10 text-blue-500" />;
        if (item.type === 'pdf') return <FileText className="h-10 w-10 text-red-500" />;
        if (item.type === 'image') return <Image className="h-10 w-10 text-purple-500" />;
        if (item.type === 'spreadsheet') return <FileSpreadsheet className="h-10 w-10 text-green-500" />;
        return <File className="h-10 w-10 text-gray-500" />;
    };

    const handleItemClick = (item: FileSystemItem) => {
        if (item.type === 'folder') {
            onNavigate(item.path);
        } else {
            // Open file in new tab
            if (item.path.startsWith("http") || item.path.startsWith("/")) {
                window.open(item.path, "_blank");
            }
        }
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile && onUpload) {
            onUpload(selectedFile, selectedCategory);
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            setSelectedCategory("other");
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <button
                        onClick={() => onNavigate("/")}
                        className="hover:text-blue-600 hover:underline font-medium"
                    >
                        Documents
                    </button>
                    {currentPath !== "/" && (
                        <>
                            <span>/</span>
                            <span className="font-medium text-gray-900">{currentPath.replace("/", "")}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    {onUpload && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Upload className="h-4 w-4" />
                            Importer
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <FolderOpenIcon className="h-16 w-16 mb-4 opacity-20" />
                        <p>Dossier vide</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="group flex flex-col items-center p-4 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50 cursor-pointer transition-all relative"
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="mb-3 transition-transform group-hover:scale-110">
                                    {getIcon(item)}
                                </div>
                                <p className="text-sm font-medium text-gray-700 text-center truncate w-full group-hover:text-blue-700">
                                    {item.name}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {item.type === 'folder' ? `${item.itemCount} éléments` : item.size}
                                </p>

                                {/* Delete Action (Visible on Hover) */}
                                {onDelete && item.type !== 'folder' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(item.id);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Importer un document</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fichier</label>
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {selectedFile ? (
                                        <div className="flex items-center justify-center gap-2 text-blue-600">
                                            <FileText className="h-5 w-5" />
                                            <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500">
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm">Cliquez pour sélectionner un fichier</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                <select
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="contracts">Contrats</option>
                                    <option value="invoices">Factures</option>
                                    <option value="plans">Plans</option>
                                    <option value="hr">Ressources Humaines</option>
                                    <option value="legal">Juridique</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="other">Divers</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedFile}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Importer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function FolderOpenIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
        </svg>
    )
}
