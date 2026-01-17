import type { Route } from "./+types/documents";
import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { DocumentBrowser } from "~/components/documents/DocumentBrowser";
import type { FileSystemItem, Folder, Document } from "~/types/documents";
import { getAllDocuments, createDocument, deleteDocument } from "~/services/documents.server";
import { getSession } from "~/sessions.server";
import { useLoaderData, useSubmit, Form, useNavigation, useActionData } from "react-router";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Documents & Archives - Elite Immobilier & Divers" },
        { name: "description", content: "Gestion électronique des documents" },
    ];
}

const CATEGORY_MAP: Record<string, string> = {
    contracts: "Contrats",
    invoices: "Factures",
    plans: "Plans",
    hr: "Ressources Humaines",
    hr_photos: "Photos Employés",
    hr_identity: "Identité",
    legal: "Juridique",
    marketing: "Marketing",
    other: "Divers"
};

const FOLDERS: Folder[] = [
    { id: "cat-contracts", name: "Contrats", type: "folder", itemCount: 0, updatedAt: new Date().toISOString(), path: "/Contrats" },
    { id: "cat-invoices", name: "Factures", type: "folder", itemCount: 0, updatedAt: new Date().toISOString(), path: "/Factures" },
    { id: "cat-plans", name: "Plans", type: "folder", itemCount: 0, updatedAt: new Date().toISOString(), path: "/Plans" },
    { id: "cat-hr", name: "Ressources Humaines", type: "folder", itemCount: 0, updatedAt: new Date().toISOString(), path: "/RH" },
    { id: "cat-hr-photos", name: "Photos Employés", type: "folder", itemCount: 0, updatedAt: new Date().toISOString(), path: "/Photos" }, // New
    { id: "cat-hr-identity", name: "Identité", type: "folder", itemCount: 0, updatedAt: new Date().toISOString(), path: "/Identite" }, // New
    { id: "cat-legal", name: "Juridique", type: "folder", itemCount: 0, updatedAt: new Date().toISOString(), path: "/Juridique" },
    { id: "cat-marketing", name: "Marketing", type: "folder", itemCount: 0, updatedAt: new Date().toISOString(), path: "/Marketing" },
    { id: "cat-other", name: "Divers", type: "folder", itemCount: 0, updatedAt: new Date().toISOString(), path: "/Divers" },
];

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    // Optionally redirect if not logged in
    // if (!session.has("userId")) return redirect("/login");

    const docs = await getAllDocuments();

    // Calculate item counts for folders
    const folderCounts: Record<string, number> = {};
    docs.forEach(d => {
        if (!folderCounts[d.category]) folderCounts[d.category] = 0;
        folderCounts[d.category]++;
    });

    const foldersWithCounts = FOLDERS.map(f => {
        // Find category key for this folder name (reverse map roughly)
        const catKey = Object.keys(CATEGORY_MAP).find(key => CATEGORY_MAP[key] === f.name);
        return {
            ...f,
            itemCount: catKey ? (folderCounts[catKey] || 0) : 0
        };
    });

    const mappedDocs: Document[] = docs.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type as any,
        size: d.size,
        updatedAt: d.updatedAt.toISOString(),
        category: d.category as any,
        path: d.path, // This is the download URL
        owner: d.owner?.username || "Inconnu"
    }));

    return { items: [...foldersWithCounts, ...mappedDocs] };
}

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId") || "system"; // Fallback if no auth

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "upload") {
        const file = formData.get("file") as File;
        const category = formData.get("category") as string;

        if (!file || file.size === 0) {
            return { error: "Fichier requis" };
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Format size directly here or in service?
        // Service expects string size, let's format it
        const sizeMb = file.size / (1024 * 1024);
        const sizeStr = sizeMb < 1 ? `${(file.size / 1024).toFixed(0)} KB` : `${sizeMb.toFixed(1)} MB`;

        await createDocument({
            name: file.name,
            type: "other", // Service calculates this
            size: sizeStr,
            category,
            ownerId: userId,
            fileBuffer: buffer
        });

        return { success: true };
    }

    if (intent === "delete") {
        const id = formData.get("id") as string;
        await deleteDocument(id);
        return { success: true };
    }

    return null;
}

export default function Documents() {
    const { items } = useLoaderData<typeof loader>();
    const [currentPath, setCurrentPath] = useState("/");
    const submit = useSubmit();

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
    };

    const handleUpload = (file: File, category: string) => {
        const formData = new FormData();
        formData.append("intent", "upload");
        formData.append("file", file);
        formData.append("category", category);
        submit(formData, { method: "post", encType: "multipart/form-data" });
    };

    const handleDelete = (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
            const formData = new FormData();
            formData.append("intent", "delete");
            formData.append("id", id);
            submit(formData, { method: "post" });
        }
    };

    // Filter items based on currentPath
    const displayedItems = items.filter(item => {
        if (currentPath === "/") {
            // At root, show folders
            // We could also show files that don't belong to any folder if we wanted
            return item.type === 'folder';
        }

        // Inside a folder
        if (item.type === 'folder') return false; // Hide folders (no nested folders implemented yet)

        // Find the folder object that matches the current path
        const currentFolder = items.find(i => i.type === 'folder' && i.path === currentPath);

        if (!currentFolder) return false;

        const folderName = currentFolder.name; // e.g. "Photos Employés"

        // Find the category key corresponding to this folder name
        const categoryEntry = Object.entries(CATEGORY_MAP).find(([key, name]) => name === folderName);

        if (categoryEntry) {
            const [catKey] = categoryEntry;
            return item.category === catKey;
        }

        return false;
    });

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Documents & Archives</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Base documentaire centralisée.
                    </p>
                </div>
            </div>

            <div className="flex-auto min-h-0">
                <DocumentBrowser
                    items={displayedItems}
                    currentPath={currentPath}
                    onNavigate={handleNavigate}
                    onUpload={handleUpload}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}
