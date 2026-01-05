import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { useLoaderData, useNavigation, useSubmit } from "react-router";
import { useState, useEffect } from "react";
import { Plus, Search, Filter, AlertCircle } from "lucide-react";
import { prisma } from "~/db.server";
import { ClientForm } from "~/components/clients/ClientForm";
import { ClientList } from "~/components/clients/ClientList";


export function meta({ }: any) {
    return [
        { title: "Clients - Elite Immobilier" },
        { name: "description", content: "Gestion de la relation client (CRM)" },
    ];
}

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

export async function action({ request }: ActionFunctionArgs) {

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create" || intent === "update") {
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const type = formData.get("type") as string;
        const status = formData.get("status") as string;
        const notes = formData.get("notes") as string;

        const idType = formData.get("idType") as string;
        const idNumber = formData.get("idNumber") as string;

        // File handling
        const uploadFile = async (file: File | null) => {
            if (file && file.size > 0 && file.name) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const filename = `${randomUUID()}-${file.name}`;
                const uploadDir = path.join(process.cwd(), "public", "uploads", "clients");
                const filepath = path.join(uploadDir, filename);
                try {
                    await fs.mkdir(uploadDir, { recursive: true });
                    await fs.writeFile(filepath, buffer);
                    return `/uploads/clients/${filename}`;
                } catch (error) {
                    console.error("Failed to upload file:", error);
                    return undefined;
                }
            }
            return undefined;
        };

        const photo = formData.get("photo") as File | null;
        const idCardRecto = formData.get("idCardRecto") as File | null;
        const idCardVerso = formData.get("idCardVerso") as File | null;

        const photoPath = await uploadFile(photo);
        const idCardRectoPath = await uploadFile(idCardRecto);
        const idCardVersoPath = await uploadFile(idCardVerso);

        // 3. DUPLICATE CHECK
        if (intent === "create") {
            const whereClause: any = {
                OR: [
                    // Check by Email (if provided)
                    ...(email ? [{ email: { equals: email, mode: 'insensitive' } }] : []),
                    // Check by Name + Phone
                    {
                        AND: [
                            { firstName: { equals: firstName, mode: 'insensitive' } },
                            { lastName: { equals: lastName, mode: 'insensitive' } },
                            { phone: { contains: phone } } // 'contains' is safer for phone formatting diffs
                        ]
                    }
                ]
            };

            // If checking "email OR (name AND phone)", empty email array might make OR just contain the AND block
            // Ensure OR is not empty if email is undefined.

            const duplicate = await prisma.client.findFirst({ where: whereClause });

            if (duplicate) {
                return { error: "Un client avec ces informations (Email ou Nom+Tel) existe déjà." };
            }
        }

        const data: any = {
            firstName,
            lastName,
            email: email || null,
            phone,
            idType,
            idNumber,
            type,
            status,
            notes,
            ...(photoPath ? { photo: photoPath } : {}),
            ...(idCardRectoPath ? { idCardRecto: idCardRectoPath } : {}),
            ...(idCardVersoPath ? { idCardVerso: idCardVersoPath } : {})
        };

        if (intent === "create") {
            await prisma.client.create({ data });
        } else {
            const id = formData.get("id") as string;
            await prisma.client.update({ where: { id }, data });
        }
        return { success: true };
    }

    if (intent === "delete") {
        const id = formData.get("id") as string;
        await prisma.client.delete({ where: { id } });
        return { success: true };
    }

    return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return { clients };
}

export default function Clients() {
    const { clients } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('all');

    const isSubmitting = navigation.state === "submitting" &&
        (navigation.formData?.get("intent") === "create" || navigation.formData?.get("intent") === "update");

    // Close modal on successful submission
    useEffect(() => {
        if (navigation.state === "loading" && isSubmitting === false) {
            setIsCreateModalOpen(false);
            setEditingClient(null);
        }
    }, [navigation.state]);

    const handleEdit = (client: any) => {
        setEditingClient(client);
        setIsCreateModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
            submit({ intent: "delete", id }, { method: "post" });
        }
    };

    const filteredClients = clients.filter(client => {
        const matchesType = filterType === 'all' || client.type === filterType;
        const matchesSearch =
            (client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())));
        return matchesType && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clients & Prospects</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestion de votre base de contacts ({clients.length} total)
                    </p>
                </div>
                <button
                    onClick={() => { setEditingClient(null); setIsCreateModalOpen(true); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter un client
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="Rechercher par nom ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 min-w-[200px]">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Tous les types</option>
                        <option value="prospect">Prospect</option>
                        <option value="buyer">Acheteur</option>
                        <option value="seller">Vendeur</option>
                        <option value="tenant">Locataire</option>
                        <option value="landlord">Bailleur</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <ClientList
                clients={filteredClients}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        aria-hidden="true"
                        onClick={() => { setIsCreateModalOpen(false); setEditingClient(null); }}
                    />

                    <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                                        {editingClient ? "Modifier le client" : "Ajouter un nouveau client"}
                                    </h3>
                                    <div className="mt-4">
                                        <ClientForm
                                            defaultValues={editingClient}
                                            isSubmitting={isSubmitting}
                                            onCancel={() => { setIsCreateModalOpen(false); setEditingClient(null); }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
