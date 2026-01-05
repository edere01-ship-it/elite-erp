import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { useLoaderData, useNavigation, useSubmit, Link, Form } from "react-router";
import { cn } from "~/lib/utils";
import { useState, useEffect } from "react";
import { Plus, Filter, Search, Building, Banknote, Calendar, LayoutGrid, List } from "lucide-react";
import { prisma } from "~/db.server";
import { PropertyForm } from "~/components/properties/PropertyForm";
import type { Route } from "./+types/properties";
// import { getProperties, createProperty, updateProperty, deleteProperty } from "../services/properties.server"; // REMOVED
import { getSession } from "~/sessions.server";
import { PERMISSIONS } from "~/utils/permissions";
import { requirePermission, hasPermission } from "~/utils/permissions.server";
import { logModuleAccess } from "~/services/it.server";
import { PropertyList } from "~/components/properties/PropertyList";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Propriétés - Elite Immobilier" },
        { name: "description", content: "Gestion du portefeuille immobilier" },
    ];
}

function CollectionModal({ property, isOpen, onClose, isSubmitting }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <Form method="post" className="p-6">
                    <input type="hidden" name="intent" value="collect-rent" />
                    <input type="hidden" name="propertyId" value={property.id} />
                    <input type="hidden" name="amount" value={property.price} />

                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                        Encaisser un loyer - {property.title}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="months" className="block text-sm font-medium text-gray-700">Nombre de mois</label>
                            <input
                                type="number"
                                name="months"
                                id="months"
                                required
                                min="1"
                                defaultValue="1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const total = document.getElementById('total-amount');
                                    if (total) total.innerText = new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(val * property.price);
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Montant Mensuel</label>
                            <div className="mt-1 text-sm text-gray-900 font-semibold">
                                {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(property.price)}
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-md">
                            <label className="block text-sm font-medium text-blue-900">Total à encaisser</label>
                            <div id="total-amount" className="mt-1 text-xl font-bold text-blue-700">
                                {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(property.price)}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description / Note</label>
                            <textarea
                                name="description"
                                id="description"
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                defaultValue={`Loyer - ${property.title}`}
                            />
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
                        >
                            {isSubmitting ? "Traitement..." : "Valider l'encaissement"}
                        </button>
                        <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    await requirePermission(userId!, PERMISSIONS.PROPERTIES_VIEW);
    if (userId) await logModuleAccess(userId, "Properties");

    const properties = await prisma.property.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            visits: true,
            contracts: {
                where: { status: "active" }
            }
        }
    });

    const enhancedProperties = await Promise.all(properties.map(async (p) => {
        let tenantName = "Aucun locataire";
        let tenantPhone = "";
        let unpaidMonths = 0;
        let unpaidAmount = 0;

        const activeContract = p.contracts[0];
        if (activeContract && activeContract.clientId) {
            const client = await prisma.client.findUnique({
                where: { id: activeContract.clientId },
                select: { firstName: true, lastName: true, phone: true }
            });
            if (client) {
                tenantName = `${client.firstName} ${client.lastName}`;
                tenantPhone = client.phone;

                const pendingInvoices = await prisma.invoice.findMany({
                    where: {
                        clientId: activeContract.clientId,
                        status: 'sent',
                        type: 'invoice'
                    }
                });

                pendingInvoices.forEach(inv => {
                    unpaidAmount += inv.total;
                });
                if (p.price > 0) {
                    unpaidMonths = Math.round(unpaidAmount / p.price);
                }
            }
        }

        return {
            ...p,
            createdAt: p.createdAt.toISOString(), // formatting for serializable
            updatedAt: p.updatedAt.toISOString(),
            tenantName,
            tenantPhone,
            unpaidMonths,
            unpaidAmount
        };
    }));

    const clients = await prisma.client.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: 'asc' } });

    const canCreate = userId ? await hasPermission(userId, PERMISSIONS.PROPERTIES_CREATE) : false;
    const canEdit = userId ? await hasPermission(userId, PERMISSIONS.PROPERTIES_EDIT) : false;

    return { properties: enhancedProperties, clients, canCreate, canEdit };
}

export async function action({ request }: ActionFunctionArgs) {
    // ...
    if (intent === "create") {
        await requirePermission(userId!, PERMISSIONS.PROPERTIES_CREATE);
        // ... params ...
        const title = formData.get("title") as string;
        const priceStr = formData.get("price") as string;
        const price = parseFloat(priceStr.replace(/\s/g, '').replace(/,/g, '.'));
        const type = formData.get("type") as string;
        const status = formData.get("status") as string;
        const address = formData.get("address") as string;
        const city = formData.get("city") as string;
        const area = parseFloat(formData.get("area") as string);
        const rooms = parseInt(formData.get("rooms") as string);
        const description = formData.get("description") as string;

        // Image upload logic
        const imgFile = formData.get("img") as File | null;
        let imageUrl: string | undefined;
        if (imgFile && imgFile.size > 0 && imgFile.name) {
            const buffer = Buffer.from(await imgFile.arrayBuffer());
            const filename = `${randomUUID()}-${imgFile.name}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads", "properties");
            const filepath = path.join(uploadDir, filename);
            try {
                await fs.mkdir(uploadDir, { recursive: true });
                await fs.writeFile(filepath, buffer);
                imageUrl = `/uploads/properties/${filename}`;
            } catch (error) {
                console.error("Failed to upload file:", error);
            }
        }

        const featuresStr = formData.get("features") as string;
        const features = featuresStr ? featuresStr.split(',').map(f => f.trim()).filter(f => f) : [];
        const clientId = formData.get("clientId") as string;

        // INLINED createProperty
        const property = await prisma.property.create({
            data: {
                title, price, type, status, address, city, area, rooms, description,
                images: imageUrl ? [imageUrl] : [],
                features,
                agentId: userId // linking to creator as agent if applicable, or optional
            }
        });

        // Handle Contract if clientId provided during creation (optional)
        if (clientId) {
            await prisma.contract.create({
                data: {
                    title: `Bail - ${title}`,
                    type: 'lease',
                    status: 'active',
                    startDate: new Date(),
                    propertyId: property.id,
                    clientId: clientId
                }
            });
        }
        return { success: true };
    }
    // ...


    if (intent === "update") {
        await requirePermission(userId!, PERMISSIONS.PROPERTIES_EDIT);
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;
        const priceStr = formData.get("price") as string;
        const price = parseFloat(priceStr.replace(/\s/g, '').replace(/,/g, '.'));
        const type = formData.get("type") as string;
        const status = formData.get("status") as string;
        const address = formData.get("address") as string;
        const city = formData.get("city") as string;
        const area = parseFloat(formData.get("area") as string);
        const rooms = parseInt(formData.get("rooms") as string);
        const description = formData.get("description") as string;

        // Image handling for update
        const imgFile = formData.get("img") as File | null;
        let imageUrl = formData.get("existingImage") as string | undefined;
        if (imgFile && imgFile.size > 0 && imgFile.name) {
            const buffer = Buffer.from(await imgFile.arrayBuffer());
            const filename = `${randomUUID()}-${imgFile.name}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads", "properties");
            const filepath = path.join(uploadDir, filename);
            try {
                await fs.mkdir(uploadDir, { recursive: true });
                await fs.writeFile(filepath, buffer);
                imageUrl = `/uploads/properties/${filename}`;
            } catch (error) {
                console.error("Failed to upload file:", error);
            }
        }

        const featuresStr = formData.get("features") as string;
        const features = featuresStr ? featuresStr.split(',').map(f => f.trim()).filter(f => f) : [];
        const clientId = formData.get("clientId") as string;

        const data = {
            title, price, type, status, address, city, area, rooms, description,
            images: imageUrl ? [imageUrl] : [],
            features
        };

        // Update basic property info
        await prisma.property.update({ where: { id }, data });

        // Handle Contracts on Update
        if (clientId) {
            const activeContract = await prisma.contract.findFirst({
                where: { propertyId: id, status: 'active', type: 'lease' }
            });

            if (activeContract?.clientId !== clientId) {
                if (activeContract) {
                    await prisma.contract.update({
                        where: { id: activeContract.id },
                        data: { status: 'terminated', endDate: new Date() }
                    });
                }
                await prisma.contract.create({
                    data: {
                        title: `Bail - ${title}`,
                        type: 'lease',
                        status: 'active',
                        startDate: new Date(),
                        propertyId: id,
                        clientId: clientId
                    }
                });
            }
        } else {
            const activeContract = await prisma.contract.findFirst({
                where: { propertyId: id, status: 'active', type: 'lease' }
            });
            if (activeContract) {
                await prisma.contract.update({
                    where: { id: activeContract.id },
                    data: { status: 'terminated', endDate: new Date() }
                });
            }
        }
        return { success: true };
    }

    if (intent === "delete") {
        await requirePermission(userId!, PERMISSIONS.PROPERTIES_EDIT);
        const id = formData.get("id") as string;
        await prisma.property.delete({ where: { id } });
        return { success: true };
    }

    if (intent === "collect-rent") {
        // Checking validate permission or properties edit? 
        // Rent collection is more finance related but initiated from properties.
        // Let's require PROPERTIES_EDIT for now or FINANCE_CREATE.
        // Using PROPERTIES_EDIT as it modifies property state (sort of).
        await requirePermission(userId!, PERMISSIONS.PROPERTIES_EDIT);

        const propertyId = formData.get("propertyId") as string;
        const months = parseInt(formData.get("months") as string);
        const amount = parseFloat(formData.get("amount") as string);
        const description = formData.get("description") as string;

        const activeContract = await prisma.contract.findFirst({
            where: { propertyId, status: 'active' },
            select: { clientId: true }
        });

        const count = await prisma.invoice.count();
        const number = `REC-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

        await prisma.invoice.create({
            data: {
                number,
                type: 'invoice',
                status: 'sent',
                issueDate: new Date(),
                dueDate: new Date(),
                subtotal: amount,
                taxAmount: 0,
                total: amount,
                clientId: activeContract?.clientId || undefined,
                items: {
                    create: {
                        description: description,
                        quantity: months,
                        unitPrice: amount / months,
                        total: amount
                    }
                }
            }
        });
        return { success: true };
    }

    return null;
}

export default function Properties() {
    const { properties, clients, canCreate, canEdit } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();

    const [activeTab, setActiveTab] = useState<'inventory' | 'collection'>('inventory');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<any | null>(null);
    const [collectionProperty, setCollectionProperty] = useState<any | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const isSubmitting = navigation.state === "submitting" &&
        (navigation.formData?.get("intent") === "create" ||
            navigation.formData?.get("intent") === "update" ||
            navigation.formData?.get("intent") === "collect-rent");

    useEffect(() => {
        if (navigation.state === "loading" && isSubmitting === false) {
            setIsCreateModalOpen(false);
            setEditingProperty(null);
            setIsCollectionModalOpen(false);
            setCollectionProperty(null);
        }
    }, [navigation.state, isSubmitting]);

    const handleEdit = (property: any) => {
        if (!canEdit) return;
        setEditingProperty(property);
        setIsCreateModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!canEdit) return;
        if (confirm("Êtes-vous sûr de vouloir supprimer ce bien ?")) {
            submit({ intent: "delete", id }, { method: "post" });
        }
    };

    const filteredProperties = properties.filter((property: any) => {
        const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
        const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.city.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion Immobilière</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Portefeuille de biens en vente et location.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'grid' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'list' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    <nav className="hidden sm:flex space-x-2 bg-gray-100 p-1 rounded-lg" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={cn(
                                activeTab === 'inventory'
                                    ? "bg-white text-gray-900 shadow"
                                    : "text-gray-500 hover:text-gray-700",
                                "rounded-md px-3 py-2 text-sm font-medium transition-all"
                            )}
                        >
                            Inventaire
                        </button>
                        <button
                            onClick={() => setActiveTab('collection')}
                            className={cn(
                                activeTab === 'collection'
                                    ? "bg-white text-blue-600 shadow"
                                    : "text-gray-500 hover:text-gray-700",
                                "rounded-md px-3 py-2 text-sm font-medium transition-all flex items-center gap-2"
                            )}
                        >
                            <Banknote className="h-4 w-4" />
                            Recouvrement
                        </button>
                    </nav>

                    {canCreate && (
                        <button
                            onClick={() => { setEditingProperty(null); setIsCreateModalOpen(true); }}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nouveau Bien
                        </button>
                    )}
                </div>
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
                        placeholder="Rechercher par titre ou ville..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 min-w-[200px]">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="available">Disponible</option>
                        <option value="sold">Vendu</option>
                        <option value="rented">Loué</option>
                        <option value="reserved">Réservé</option>
                    </select>
                </div>
            </div>

            <PropertyList
                properties={filteredProperties}
                viewMode={viewMode}
                onDelete={canEdit ? handleDelete : undefined}
                onEdit={canEdit ? handleEdit : undefined}
            />

            {/* Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        aria-hidden="true"
                        onClick={() => { setIsCreateModalOpen(false); setEditingProperty(null); }}
                    />

                    <div className="relative z-10 w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                                        {editingProperty ? "Modifier le bien" : "Ajouter un nouveau bien"}
                                    </h3>
                                    <div className="mt-4">
                                        <PropertyForm
                                            defaultValues={editingProperty}
                                            isSubmitting={isSubmitting}
                                            onCancel={() => { setIsCreateModalOpen(false); setEditingProperty(null); }}
                                            clients={clients}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CollectionModal
                property={collectionProperty}
                isOpen={isCollectionModalOpen}
                onClose={() => { setIsCollectionModalOpen(false); setCollectionProperty(null); }}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
