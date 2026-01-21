// import type { Route } from "./+types/direction";
import { useLoaderData, redirect, Link, type LoaderFunctionArgs, type MetaFunction, type ActionFunctionArgs, useSubmit, Form, useNavigation } from "react-router";
import { prisma } from "~/db.server";
import { useState, useEffect } from "react";
import { LayoutDashboard, CheckCircle, TrendingUp, Building, Users, Wallet, Briefcase, Plus, AlertCircle, X } from "lucide-react";
import { getSession } from "~/sessions.server";
import { PERMISSIONS } from "~/utils/permissions";
import { cn } from "~/lib/utils";
import type { Agency } from "~/types/agency";
import { AgencyList } from "~/components/agencies/AgencyList";
import { AgencyForm } from "~/components/agencies/AgencyForm";
import { AgencyPerformanceDashboard } from "~/components/agencies/AgencyPerformanceDashboard";
import { notifyAgencyManagers, notifyFinance } from "~/services/notification.server";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { ClientOnly } from "~/components/ClientOnly";

export const meta: MetaFunction = () => {
    return [
        { title: "Tableau de bord Direction Générale - Elite Immobilier" },
        { name: "description", content: "Vue d'ensemble et validations pour la direction" },
    ];
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) return null;

    if (intent === "create_agency") {
        const name = formData.get("name") as string;
        const address = formData.get("address") as string;
        const city = formData.get("city") as string;
        const manager = formData.get("manager") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;
        const status = formData.get("status") as string;

        await prisma.agency.create({
            data: { name, address, city, manager, phone, email, status }
        });
        return { success: true };
    }

    if (intent === "update_agency") {
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const address = formData.get("address") as string;
        const city = formData.get("city") as string;
        const manager = formData.get("manager") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;
        const status = formData.get("status") as string;

        await prisma.agency.update({
            where: { id },
            data: { name, address, city, manager, phone, email, status }
        });
        return { success: true };
    }

    if (intent === "delete_agency") {
        const id = formData.get("id") as string;
        await prisma.agency.delete({ where: { id } });
        return { success: true };
    }

    if (intent === "validate_payroll") {
        const id = formData.get("id") as string;
        const payroll = await prisma.payrollRun.update({
            where: { id },
            data: { status: 'direction_approved' },
            include: { agency: true }
        });

        await notifyFinance(
            "Paie Approuvée par Direction",
            `La paie de ${payroll.month}/${payroll.year} pour l'agence ${payroll.agency?.name} a été approuvée par la Direction et est prête pour paiement.`,
            "success",
            "/finance"
        );

        if (payroll.agencyId) {
            await notifyAgencyManagers(
                payroll.agencyId,
                "Paie Approuvée",
                `Votre paie de ${payroll.month}/${payroll.year} a été validée par la Direction.`,
                "success",
                "/agency/validations"
            );
        }

        return { success: true };
    }

    if (intent === "reject_payroll") {
        const id = formData.get("id") as string;
        const reason = formData.get("reason") as string;
        const payroll = await prisma.payrollRun.update({
            where: { id },
            data: { status: 'pending_agency', rejectionReason: reason },
            include: { agency: true }
        });

        if (payroll.agencyId) {
            await notifyAgencyManagers(
                payroll.agencyId,
                "Paie Rejetée par Direction",
                `Votre paie de ${payroll.month}/${payroll.year} a été rejetée par la Direction. Motif: ${reason}`,
                "error",
                "/agency/validations"
            );
        }
        return { success: true };
    }

    if (intent === "validate_employee") {
        const id = formData.get("id") as string;
        const employee = await prisma.employee.update({
            where: { id },
            data: { status: 'active' },
            include: { agency: true }
        });

        if (employee.agencyId) {
            await notifyAgencyManagers(
                employee.agencyId,
                "Recrutement Validé",
                `Le recrutement de ${employee.firstName} ${employee.lastName} a été validé.`,
                "success",
                "/agency/employees"
            );
        }
        return { success: true };
    }

    if (intent === "reject_employee") {
        const id = formData.get("id") as string;
        const reason = formData.get("reason") as string;
        const employee = await prisma.employee.update({
            where: { id },
            data: { status: 'rejected', rejectionReason: reason },
            include: { agency: true }
        });

        if (employee.agencyId) {
            await notifyAgencyManagers(
                employee.agencyId,
                "Recrutement Rejeté",
                `Le recrutement de ${employee.firstName} ${employee.lastName} a été rejeté. Motif: ${reason}`,
                "error",
                "/agency/employees"
            );
        }
        return { success: true };
    }

    if (intent === "validate_assignment") {
        const employeeId = formData.get("id") as string;
        // Fetch to get pending value then update
        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (employee && employee.pendingAgencyId) {
            await prisma.employee.update({
                where: { id: employeeId },
                data: {
                    agencyId: employee.pendingAgencyId,
                    pendingAgencyId: null,
                    assignmentNotification: true
                }
            });
        }
        return { success: true };
    }

    return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw redirect("/login");
    }

    // Permission Check
    const { requirePermission } = await import("~/utils/permissions.server");
    await requirePermission(userId, PERMISSIONS.DIRECTION_VIEW);

    // Dynamic import for server services
    console.log("Direction loader: importing services...");
    const { getDirectionStats, getPendingValidations, getAgencyPerformance, getFinancialOverview, getValidationHistory, getFinanceStats, getFinancialDocuments } = await import("~/services/direction.server");

    console.log("Direction loader: fetching stats...");
    const stats = await getDirectionStats();

    // We can add empty checks if services fail or return null, but for now assuming they work as per previous file state

    const validations = await getPendingValidations();
    const validationHistory = await getValidationHistory();
    const financeStats = await getFinanceStats();
    const agencyPerformance = await getAgencyPerformance();
    const financialTransactions = await getFinancialOverview();
    const recentDocuments = await getFinancialDocuments();

    const agencies = await prisma.agency.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            employees: {
                select: {
                    position: true
                }
            }
        }
    });

    // Process financial data for chart (e.g., last 6 months) -> Simplified grouping
    const chartData = [
        { name: 'Jan', revenus: 4000000, depenses: 2400000 },
        { name: 'Fev', revenus: 3000000, depenses: 1398000 },
        { name: 'Mar', revenus: 2000000, depenses: 9800000 },
        { name: 'Avr', revenus: 2780000, depenses: 3908000 },
        { name: 'Mai', revenus: 1890000, depenses: 4800000 },
        { name: 'Juin', revenus: 2390000, depenses: 3800000 },
    ]; // Placeholder/Mock for visual if transaction data is scarce. Ideally fetch real data.

    return {
        stats,
        validations,
        validationHistory,
        financeStats,
        agencyPerformance,
        chartData,
        recentDocuments,
        agencies
    };
}

export default function DirectionDashboard() {
    const { stats, validations, validationHistory, financeStats, agencyPerformance, chartData, recentDocuments, agencies } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState("dashboard");

    // Rejection Modal State
    const [rejectionState, setRejectionState] = useState<{
        isOpen: boolean;
        itemId: string | null;
        intent: string;
    }>({ isOpen: false, itemId: null, intent: "" });

    const openRejectionModal = (itemId: string, intent: string) => {
        setRejectionState({ isOpen: true, itemId, intent });
    };

    const closeRejectionModal = () => {
        setRejectionState({ isOpen: false, itemId: null, intent: "" });
    };

    // Agency Management State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
    const submit = useSubmit();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    // Close modal on successful submission
    useEffect(() => {
        if (navigation.state === "loading") {
            setIsCreateModalOpen(false);
            setEditingAgency(null);
        }
    }, [navigation.state]);

    const handleEditAgency = (agency: Agency) => {
        setEditingAgency(agency);
    };

    const handleDeleteAgency = (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cette agence ?")) {
            submit({ intent: "delete_agency", id }, { method: "post" });
        }
    };


    const tabs = [
        { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
        { id: "validation", label: "Validation", icon: CheckCircle },
        { id: "finance", label: "Finances", icon: Wallet },
        { id: "hr", label: "Ressources Humaines", icon: Users },
        { id: "agencies", label: "Agences", icon: Building },
    ];

    return (
        <div className="space-y-6 relative">
            {/* Rejection Modal */}
            {rejectionState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={closeRejectionModal} />
                    <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        <Form method="post" onSubmit={closeRejectionModal}>
                            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                                            Motif du rejet
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 mb-4">
                                                Le document sera renvoyé à l'étape précédente (Agence/RH).
                                            </p>
                                            <input type="hidden" name="intent" value={rejectionState.intent} />
                                            <input type="hidden" name="id" value={rejectionState.itemId || ""} />
                                            <textarea
                                                name="reason"
                                                required
                                                rows={3}
                                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                                                placeholder="Indiquez la raison du rejet..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                    type="submit"
                                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                                >
                                    Rejeter
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                    onClick={closeRejectionModal}
                                >
                                    Annuler
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Direction Générale</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Vue d'ensemble stratégique et validations.
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                activeTab === tab.id
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors duration-200 ease-in-out"
                            )}
                        >
                            <tab.icon className={cn(
                                activeTab === tab.id ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                                "-ml-0.5 mr-2 h-5 w-5"
                            )} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content: Dashboard */}
            {activeTab === "dashboard" && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {/* ... Existing KPI Cards ... */}
                        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                            <dt className="truncate text-sm font-medium text-gray-500">Chiffre d'Affaires</dt>
                            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.turnover.toLocaleString()} CFA</dd>
                            <div className="flex items-center text-sm text-green-600 mt-2">
                                <TrendingUp className="mr-1 h-4 w-4" /> +8.8%
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                            <dt className="truncate text-sm font-medium text-gray-500">Biens Disponibles</dt>
                            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.propertiesCount}</dd>
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                                <Building className="mr-1 h-4 w-4" /> Locations / Ventes
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                            <dt className="truncate text-sm font-medium text-gray-500">Projets en cours</dt>
                            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.activeProjectsCount}</dd>
                            <div className="flex items-center text-sm text-blue-600 mt-2">
                                En construction
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                            <dt className="truncate text-sm font-medium text-gray-500">Masse Salariale (Mois)</dt>
                            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.salaryMass.toLocaleString()} CFA</dd>
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                                <Users className="mr-1 h-4 w-4" /> Employés
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Validation Preview (Small) */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Validations Récentes</h3>
                                <button onClick={() => setActiveTab("validation")} className="text-sm text-blue-600 hover:text-blue-500">Voir tout</button>
                            </div>
                            <div className="overflow-hidden">
                                <ul role="list" className="divide-y divide-gray-200">
                                    {validations.slice(0, 3).map((item: any) => (
                                        <li key={item.id} className="py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                                                    item.type === 'Dépense' ? "bg-red-100 text-red-600" :
                                                        item.type === 'Paie' ? "bg-blue-100 text-blue-600" :
                                                            "bg-gray-100 text-gray-600"
                                                )}>
                                                    {item.type === 'Dépense' && <Wallet className="h-5 w-5" />}
                                                    {item.type === 'Paie' && <Users className="h-5 w-5" />}
                                                    {item.type === 'Transaction' && <CheckCircle className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{item.type} - {item.emitter}</p>
                                                    <p className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">{item.amount.toLocaleString()} CFA</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Agency Performance */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance des Agences</h3>
                            <div className="h-80" style={{ height: "320px", width: "100%" }}>
                                <ClientOnly fallback={<div className="h-full w-full flex items-center justify-center text-sm text-gray-500">Chargement du graphique...</div>}>
                                    {() => (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={agencyPerformance}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="turnover" name="Chiffre d'Affaires" fill="#4f46e5" />
                                                <Bar dataKey="netResult" name="Résultat Net" fill="#10b981" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </ClientOnly>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content: Validation */}
            {activeTab === "validation" && (
                <div className="space-y-6">
                    {/* Documents en attente */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Documents en attente de validation</h3>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                    Quantités: {validations.length}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Émetteur</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {validations.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Aucun document en attente.</td></tr>
                                    ) : validations.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={cn(
                                                        "flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center mr-3",
                                                        item.type === 'Dépense' ? "bg-orange-100 text-orange-600" :
                                                            item.type === 'Paie' ? "bg-blue-100 text-blue-600" :
                                                                item.type === 'Recrutement' ? "bg-green-100 text-green-600" :
                                                                    "bg-gray-100 text-gray-600"
                                                    )}>
                                                        {item.type === 'Dépense' && <Wallet className="h-4 w-4" />}
                                                        {item.type === 'Paie' && <Users className="h-4 w-4" />}
                                                        {item.type === 'Recrutement' && <Users className="h-4 w-4" />}
                                                        {item.type === 'Affectation' && <Briefcase className="h-4 w-4" />}
                                                        {item.type === 'Transaction' && <CheckCircle className="h-4 w-4" />}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{item.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.emitter}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.amount.toLocaleString()} CFA</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                                    En attente
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {item.type === 'Paie' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Form method="post" className="inline">
                                                            <input type="hidden" name="intent" value="validate_payroll" />
                                                            <input type="hidden" name="id" value={item.id} />
                                                            <button
                                                                type="submit"
                                                                className="text-blue-600 hover:text-blue-900 font-semibold bg-blue-50 px-3 py-1 rounded-md"
                                                            >
                                                                Valider
                                                            </button>
                                                        </Form>
                                                        <button
                                                            onClick={() => openRejectionModal(item.id, "reject_payroll")}
                                                            className="text-red-600 hover:text-red-900 font-semibold bg-red-50 px-3 py-1 rounded-md"
                                                        >
                                                            Rejeter
                                                        </button>
                                                    </div>
                                                ) : item.type === 'Recrutement' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Form method="post">
                                                            <input type="hidden" name="intent" value="validate_employee" />
                                                            <input type="hidden" name="id" value={item.id} />
                                                            <button
                                                                type="submit"
                                                                className="text-green-600 hover:text-green-900 font-semibold bg-green-50 px-3 py-1 rounded-md"
                                                            >
                                                                Approuver
                                                            </button>
                                                        </Form>
                                                        <button
                                                            onClick={() => openRejectionModal(item.id, "reject_employee")}
                                                            className="text-red-600 hover:text-red-900 font-semibold bg-red-50 px-3 py-1 rounded-md"
                                                        >
                                                            Rejeter
                                                        </button>
                                                    </div>
                                                ) : item.type === 'Affectation' ? (
                                                    <Form method="post">
                                                        <input type="hidden" name="intent" value="validate_assignment" />
                                                        <input type="hidden" name="id" value={item.id} />
                                                        <button
                                                            type="submit"
                                                            className="text-blue-600 hover:text-blue-900 font-semibold bg-blue-50 px-3 py-1 rounded-md"
                                                        >
                                                            Approuver
                                                        </button>
                                                    </Form>
                                                ) : (
                                                    <button className="text-gray-400 font-semibold bg-gray-50 px-3 py-1 rounded-md cursor-not-allowed">
                                                        Valider
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Historique des validations */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Historique des validations</h3>
                            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                                5 derniers <div className="h-4 w-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px]">i</div>
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Émetteur</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {validationHistory.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Aucun historique récent.</td></tr>
                                    ) : validationHistory.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={cn(
                                                        "flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center mr-3 border border-gray-200",
                                                        "bg-white text-gray-600"
                                                    )}>
                                                        {item.type === 'Dépense' && <Wallet className="h-4 w-4" />}
                                                        {item.type === 'Paie' && <Users className="h-4 w-4" />}
                                                        {item.type === 'Transaction' && <CheckCircle className="h-4 w-4" />}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{item.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.emitter}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.amount.toLocaleString()} CFA</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                    item.status === 'Validé' ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-red-50 text-red-700 ring-red-600/20"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate">
                                                {item.reason || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content: Finances */}
            {activeTab === "finance" && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Vue d'ensemble financière</h2>

                    <div className="space-y-4">
                        {/* Solde Trésorerie */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-100/50">
                                    <Wallet className="h-8 w-8 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Solde Trésorerie</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{financeStats.treasuryBalance.toLocaleString()} CFA</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn("inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20")}>
                                    {financeStats.growth.treasury}%
                                </span>
                                <TrendingUp className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Dépenses cette année */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-orange-100/50">
                                    <TrendingUp className="h-8 w-8 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Dépenses cette année</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{financeStats.yearlyExpenses.toLocaleString()} CFA</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn("inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20")}>
                                    {financeStats.growth.expenses}%
                                </span>
                                <TrendingUp className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Dettes & Créances */}
                        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-green-100/50">
                                    <Building className="h-8 w-8 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Dettes & Créances</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{financeStats.debtsAndReceivables.toLocaleString()} CFA</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn("inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20")}>
                                    {financeStats.growth.debts}%
                                </span>
                                <TrendingUp className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Agency Performance Chart - Reused here as per design */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Performance des Agences</h3>
                            <button className="text-gray-500 border rounded-md px-3 py-1 text-xs">Masse salariale</button>
                        </div>
                        <div className="h-80 w-full" style={{ height: "320px", width: "100%", display: "block" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={agencyPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                    <Legend iconType="circle" />
                                    {/* Using same keys as data but styling to match design (Blue, Green, Light Blue) */}
                                    <Bar dataKey="turnover" name="Salaires" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="expenses" name="Dépenses" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="netResult" name="Résultat Net" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content: HR */}
            {activeTab === "hr" && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ressources Humaines</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="p-4 border rounded-lg bg-blue-50">
                            <p className="text-sm text-gray-500">Masse Salariale Globale</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.salaryMass.toLocaleString()} CFA</p>
                        </div>
                        {/* More HR Stats could go here */}
                    </div>
                    <p className="text-gray-500">Détails de la gestion du personnel à venir...</p>
                </div>
            )}

            {/* Tab Content: Agences */}
            {activeTab === "agencies" && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Gestion des Agences</h3>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter une agence
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* New Performance Dashboard */}
                        <AgencyPerformanceDashboard performance={agencyPerformance} />

                        <div className="border-t border-gray-200 pt-8">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-lg font-bold text-gray-900">Annuaire des Agences</h3>
                                {/* Moved the button here for better UX if needed, or keep it in header */}
                            </div>
                            <AgencyList
                                agencies={agencies}
                                onEdit={handleEditAgency}
                                onDelete={handleDeleteAgency}
                            />
                        </div>
                    </div>

                    {/* Modal */}
                    {(isCreateModalOpen || editingAgency) && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 bg-gray-500/75 transition-opacity"
                                aria-hidden="true"
                                onClick={() => { setIsCreateModalOpen(false); setEditingAgency(null); }}
                            />

                            {/* Modal Panel */}
                            <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                                                {editingAgency ? "Modifier l'agence" : "Ajouter une nouvelle agence"}
                                            </h3>
                                            <div className="mt-4">
                                                <AgencyForm
                                                    defaultValues={editingAgency || undefined}
                                                    isSubmitting={isSubmitting}
                                                    onCancel={() => { setIsCreateModalOpen(false); setEditingAgency(null); }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

export function ErrorBoundary({ error }: { error: unknown }) {
    console.error("Direction ErrorBoundary caught:", error);
    return (
        <div className="p-4 bg-red-50 text-red-900 border border-red-200 rounded-md m-4">
            <h1 className="text-xl font-bold mb-2">Erreur dans le tableau de bord Direction</h1>
            <pre className="text-sm overflow-auto">
                {error instanceof Error ? error.message : JSON.stringify(error)}
            </pre>
            <p className="mt-4 text-sm">Veuillez vérifier les logs du serveur.</p>
        </div>
    );
}
