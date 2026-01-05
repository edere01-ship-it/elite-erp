import type { Route } from "./+types/legal";
import { useState, useEffect } from "react";
import { Scale, Plus, FileText, AlertCircle } from "lucide-react";
import { Form } from "react-router"; // Add Form import here
import { ContractList } from "~/components/legal/ContractList";
import { LegalDashboard } from "~/components/legal/LegalDashboard";
import type { Contract, LegalCase } from "~/types/legal";
import { cn } from "~/lib/utils";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Service Juridique - Elite Immobilier & Divers" },
        { name: "description", content: "Gestion des contrats et dossiers juridiques" },
    ];
}

import { prisma } from "~/db.server";
import { useLoaderData, useNavigation, useSubmit, useActionData } from "react-router";
import { LegalCaseForm } from "~/components/legal/LegalCaseForm";
import { ContractForm } from "~/components/legal/ContractForm";
import { useRef } from "react";

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create-contract" || intent === "update-contract") {
        const title = formData.get("title") as string;
        const type = formData.get("type") as string;
        const status = formData.get("status") as string;
        const startDate = new Date(formData.get("startDate") as string);
        const endDateStr = formData.get("endDate") as string;
        const endDate = endDateStr ? new Date(endDateStr) : null;
        const clientId = formData.get("clientId") as string || null;
        const propertyId = formData.get("propertyId") as string || null;
        const reference = formData.get("reference") as string;

        const data: any = {
            title, type, status, startDate, endDate, reference,
            clientId, propertyId
        };

        if (intent === "create-contract") {
            // VALIDATION: Check for active contracts on this property
            if (propertyId && (status === 'active' || status === 'renewal_needed')) {
                const existingContract = await prisma.contract.findFirst({
                    where: {
                        propertyId,
                        status: { in: ['active', 'renewal_needed'] }
                    }
                });

                if (existingContract) {
                    return { error: "Ce bien a déjà un contrat actif ou à renouveler. Veuillez d'abord terminer ou expirer le contrat précédent." };
                }
            }
            await prisma.contract.create({ data });
        } else {
            const id = formData.get("id") as string;
            await prisma.contract.update({ where: { id }, data });
        }
        return { success: true };
    }

    if (intent === "delete-contract") {
        const id = formData.get("id") as string;
        await prisma.contract.delete({ where: { id } });
        return { success: true };
    }

    if (intent === "create-case" || intent === "update-case") {
        const title = formData.get("title") as string;
        const type = formData.get("type") as string;
        const status = formData.get("status") as string;
        const priority = formData.get("priority") as string;
        const description = formData.get("description") as string;
        const openedDate = new Date(formData.get("openedDate") as string);
        const clientId = formData.get("clientId") as string || null;
        const propertyId = formData.get("propertyId") as string || null;
        const assignedToId = formData.get("assignedToId") as string || null;

        const data = {
            title, type, status, priority, description, openedDate,
            clientId, propertyId, assignedToId
        };

        if (intent === "create-case") {
            await prisma.legalCase.create({ data });
        } else {
            const id = formData.get("id") as string;
            await prisma.legalCase.update({ where: { id }, data });
        }
        return { success: true };
    }

    if (intent === "delete-case") {
        const id = formData.get("id") as string;
        await prisma.legalCase.delete({ where: { id } });
        return { success: true };
    }

    return null;
}

export async function loader({ }: Route.LoaderArgs) {
    // Check for expirations logic
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Find active contracts expiring soon and update them
    await prisma.contract.updateMany({
        where: {
            status: 'active',
            endDate: {
                lte: thirtyDaysFromNow,
                gte: today // Optional: don't resurrect ancient expired ones as renewal needed if they were missed? Or do? Let's say anything in future but soon.
            }
        },
        data: { status: 'renewal_needed' }
    });

    // Also mark expired ones
    await prisma.contract.updateMany({
        where: {
            status: { in: ['active', 'renewal_needed'] },
            endDate: { lt: today }
        },
        data: { status: 'expired' }
    });

    const contractsRaw = await prisma.contract.findMany({
        include: { client: true, property: true },
        orderBy: { startDate: 'desc' }
    });

    const casesRaw = await prisma.legalCase.findMany({
        include: { client: true, property: true, assignedTo: true },
        orderBy: { openedDate: 'desc' }
    });

    const contracts = contractsRaw.map(c => ({
        ...c,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate?.toISOString() || null,
        client: c.client ? { firstName: c.client.firstName, lastName: c.client.lastName } : null,
        property: c.property ? { title: c.property.title } : null
    }));

    const cases = casesRaw.map(c => ({
        id: c.id,
        title: c.title,
        reference: c.reference,
        type: c.type,
        status: c.status,
        priority: c.priority,
        description: c.description,
        openedDate: c.openedDate.toISOString(),
        client: c.client ? { firstName: c.client.firstName, lastName: c.client.lastName } : null,
        property: c.property ? { title: c.property.title } : null,
        assignedTo: c.assignedTo ? { username: c.assignedTo.username } : null
    }));

    const clients = await prisma.client.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: 'asc' } });
    const properties = await prisma.property.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } });
    const staff = await prisma.user.findMany({ select: { id: true, username: true }, orderBy: { username: 'asc' } });

    return { contracts, cases, clients, properties, staff };
}

export default function Legal() {
    const { contracts, cases, clients, properties, staff } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'cases'>('dashboard');
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const isSubmitting = navigation.state === "submitting";

    useEffect(() => {
        if (navigation.state === "idle" && !isSubmitting) {
            // Check if we just submitted successfully - for now simple check if modal is open and we are idle
            if (isContractModalOpen) setIsContractModalOpen(false);
            if (isCaseModalOpen) setIsCaseModalOpen(false);
            setEditingItem(null);
        }
    }, [navigation.state, isSubmitting]);

    const handleEditContract = (contract: any) => {
        setEditingItem(contract);
        setIsContractModalOpen(true);
    };

    const handleEditCase = (legalCase: any) => {
        setEditingItem(legalCase);
        setIsCaseModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {actionData?.error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{actionData.error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Service Juridique</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestion des contrats, mandats et contentieux.
                    </p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <button
                        onClick={() => { setEditingItem(null); setIsContractModalOpen(true); }}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nouveau Contrat
                    </button>
                    <button
                        onClick={() => { setEditingItem(null); setIsCaseModalOpen(true); }}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nouveau Contentieux
                    </button>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={cn(
                            activeTab === 'dashboard'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <Scale className={cn(
                            activeTab === 'dashboard' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                            "-ml-0.5 mr-2 h-5 w-5"
                        )} />
                        Tableau de Bord
                    </button>
                    <button
                        onClick={() => setActiveTab('contracts')}
                        className={cn(
                            activeTab === 'contracts'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <FileText className={cn(
                            activeTab === 'contracts' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                            "-ml-0.5 mr-2 h-5 w-5"
                        )} />
                        Contrats & Mandats
                    </button>
                    <button
                        onClick={() => setActiveTab('cases')}
                        className={cn(
                            activeTab === 'cases'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                        )}
                    >
                        <AlertCircle className={cn(
                            activeTab === 'cases' ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                            "-ml-0.5 mr-2 h-5 w-5"
                        )} />
                        Contentieux
                    </button>
                </nav>
            </div>

            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <LegalDashboard contracts={contracts} cases={cases} />
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Contrats nécessitant attention</h3>
                        {contracts.filter((c: any) => c.status === 'renewal_needed' || c.status === 'expired').length > 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <ContractList contracts={contracts.filter((c: any) => c.status === 'renewal_needed' || c.status === 'expired')} />
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Aucun contrat ne nécessite d'attention immédiate.</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'contracts' && (
                <ContractList contracts={contracts} onEdit={handleEditContract} />
            )}

            {activeTab === 'cases' && (
                <div className="space-y-4">
                    {/* Reuse ContractList style or create CaseList - for now simple list */}
                    {cases.map((c: any) => (
                        <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50 cursor-pointer" onClick={() => handleEditCase(c)}>
                            <div className="flex justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">{c.title}</h4>
                                    <p className="text-sm text-gray-500">{c.description}</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                                            c.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800')}>
                                            {c.priority}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {c.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <div>{new Date(c.openedDate).toLocaleDateString()}</div>
                                    <div>{c.assignedTo?.username}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cases.length === 0 && <p className="text-gray-500 italic">Aucun dossier contentieux.</p>}
                </div>
            )}

            {/* Modals */}
            {(isContractModalOpen || isCaseModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        aria-hidden="true"
                        onClick={() => { setIsContractModalOpen(false); setIsCaseModalOpen(false); setEditingItem(null); }}
                    />
                    <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                                        {isContractModalOpen
                                            ? (editingItem ? "Modifier le Contrat" : "Nouveau Contrat")
                                            : (editingItem ? "Modifier le Dossier" : "Nouveau Dossier Contentieux")}
                                    </h3>
                                    <div className="mt-4">
                                        {isContractModalOpen && (
                                            <ContractForm
                                                defaultValues={editingItem}
                                                isSubmitting={isSubmitting}
                                                onCancel={() => { setIsContractModalOpen(false); setEditingItem(null); }}
                                                clients={clients}
                                                properties={properties}
                                            />
                                        )}
                                        {isCaseModalOpen && (
                                            <LegalCaseForm
                                                defaultValues={editingItem}
                                                isSubmitting={isSubmitting}
                                                onCancel={() => { setIsCaseModalOpen(false); setEditingItem(null); }}
                                                clients={clients}
                                                properties={properties}
                                                staff={staff}
                                            />
                                        )}
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
