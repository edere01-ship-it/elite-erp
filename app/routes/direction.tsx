// import type { Route } from "./+types/direction";
import { useLoaderData, redirect, Link, type LoaderFunctionArgs, type MetaFunction, type ActionFunctionArgs, useSubmit, Form, useNavigation } from "react-router";
import { prisma } from "~/db.server";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, CheckCircle, TrendingUp, Building, Users, Wallet, Briefcase, Plus, AlertCircle, X, HardHat, Map } from "lucide-react";
import { getSession } from "~/sessions.server";
import { PERMISSIONS } from "~/utils/permissions";
import { cn } from "~/lib/utils";
import type { Agency } from "~/types/agency";
import { AgencyList } from "~/components/agencies/AgencyList";
import { AgencyForm } from "~/components/agencies/AgencyForm";
import { AgencyPerformanceDashboard } from "~/components/agencies/AgencyPerformanceDashboard";
import { notifyAgencyManagers, notifyFinance } from "~/services/notification.server";
import { PremiumBackground } from "~/components/ui/PremiumBackground";
import { DirectionStats } from "~/components/direction/DirectionStats";

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

    const constructions = await prisma.constructionProject.findMany({
        orderBy: { startDate: 'desc' },
        include: { manager: true }
    });

    const developments = await prisma.landDevelopment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { lots: true, properties: true }
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
        agencies,
        constructions,
        developments
    };
}

export default function DirectionDashboard() {
    const { stats, validations, validationHistory, financeStats, agencyPerformance, chartData, recentDocuments, agencies, constructions, developments } = useLoaderData<typeof loader>();
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
        { id: "projects", label: "Projets", icon: HardHat },
    ];

    return (
        <div className="min-h-screen relative overflow-hidden font-sans text-slate-800 pb-10">
            <PremiumBackground />

            {/* Rejection Modal */}
            {rejectionState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeRejectionModal} />
                    <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl shadow-2xl ring-1 ring-white/50 transition-all">
                        <Form method="post" onSubmit={closeRejectionModal}>
                            <div className="px-6 pb-6 pt-6 sm:p-8">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-lg font-bold leading-6 text-slate-900" id="modal-title">
                                            Motif du rejet
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-slate-500 mb-4">
                                                Le document sera renvoyé à l'étape précédente (Agence/RH).
                                            </p>
                                            <input type="hidden" name="intent" value={rejectionState.intent} />
                                            <input type="hidden" name="id" value={rejectionState.itemId || ""} />
                                            <textarea
                                                name="reason"
                                                required
                                                rows={3}
                                                className="block w-full rounded-xl border-slate-300 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-red-600 sm:text-sm"
                                                placeholder="Indiquez la raison du rejet..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50/50 px-6 py-4 flex flex-row-reverse gap-3">
                                <button
                                    type="submit"
                                    className="inline-flex w-full justify-center rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-500 sm:w-auto"
                                >
                                    Rejeter
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto"
                                    onClick={closeRejectionModal}
                                >
                                    Annuler
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}

            <div className="space-y-6 relative z-10 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-lg">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Direction Générale</h1>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                            Vue d'ensemble stratégique et validations.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <nav className="bg-white/30 backdrop-blur-xl p-1.5 rounded-2xl inline-flex shadow-inner border border-white/40 space-x-1" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                    activeTab === tab.id
                                        ? "bg-white text-blue-700 shadow-md ring-1 ring-black/5 scale-[1.02]"
                                        : "text-slate-500 hover:bg-white/40 hover:text-slate-900"
                                )}
                            >
                                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-blue-600" : "text-slate-400")} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content: Dashboard */}
                {activeTab === "dashboard" && (
                    <div className="space-y-6 animate-fade-in">
                        <DirectionStats stats={stats} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Validations Preview */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-800">Validations Récentes</h3>
                                    <button onClick={() => setActiveTab("validation")} className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">Voir tout</button>
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <ul role="list" className="divide-y divide-white/40">
                                        {validations.slice(0, 3).map((item: any) => (
                                            <li key={item.id} className="py-4 flex items-center justify-between group hover:bg-white/40 rounded-xl transition-all px-2 -mx-2">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-white/60",
                                                        item.type === 'Dépense' ? "bg-red-100 text-red-600" :
                                                            item.type === 'Paie' ? "bg-blue-100 text-blue-600" :
                                                                "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {item.type === 'Dépense' && <Wallet className="h-5 w-5" />}
                                                        {item.type === 'Paie' && <Users className="h-5 w-5" />}
                                                        {item.type === 'Transaction' && <CheckCircle className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{item.type} - {item.emitter}</p>
                                                        <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-slate-900">{item.amount.toLocaleString()} CFA</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Agency Performance */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6">
                                <h3 className="text-xl font-bold text-slate-800 mb-6">Performance des Agences</h3>
                                <div className="h-80" style={{ height: "320px", width: "100%" }}>
                                    <ClientOnly fallback={<div className="h-full w-full flex items-center justify-center text-slate-500">Chargement...</div>}>
                                        {() => (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={agencyPerformance}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.95)' }}
                                                    />
                                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                    <Bar dataKey="turnover" name="Chiffre d'Affaires" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                                    <Bar dataKey="netResult" name="Résultat Net" fill="#10b981" radius={[6, 6, 0, 0]} />
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
                    <div className="space-y-6 animate-fade-in">
                        {/* Documents en attente */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
                            <div className="px-6 py-5 border-b border-white/30 bg-white/40 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800">Documents en attente de validation</h3>
                                <div className="flex gap-2">
                                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-500/20">
                                        Quantité: {validations.length}
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Émetteur</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Montant</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/40 divide-y divide-slate-100">
                                        {validations.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-500">Aucun document en attente.</td></tr>
                                        ) : validations.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-white/60 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={cn(
                                                            "flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center mr-3 shadow-sm",
                                                            item.type === 'Dépense' ? "bg-orange-100 text-orange-600" :
                                                                item.type === 'Paie' ? "bg-blue-100 text-blue-600" :
                                                                    item.type === 'Recrutement' ? "bg-green-100 text-green-600" :
                                                                        "bg-slate-100 text-slate-600"
                                                        )}>
                                                            {item.type === 'Dépense' && <Wallet className="h-5 w-5" />}
                                                            {item.type === 'Paie' && <Users className="h-5 w-5" />}
                                                            {item.type === 'Recrutement' && <Users className="h-5 w-5" />}
                                                            {item.type === 'Affectation' && <Briefcase className="h-5 w-5" />}
                                                            {item.type === 'Transaction' && <CheckCircle className="h-5 w-5" />}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800">{item.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{item.emitter}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{item.amount.toLocaleString()} CFA</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
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
                                                                    className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs transition-colors"
                                                                >
                                                                    Valider
                                                                </button>
                                                            </Form>
                                                            <button
                                                                onClick={() => openRejectionModal(item.id, "reject_payroll")}
                                                                className="text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs transition-colors"
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
                                                                    className="text-green-600 hover:text-green-800 font-bold bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs transition-colors"
                                                                >
                                                                    Approuver
                                                                </button>
                                                            </Form>
                                                            <button
                                                                onClick={() => openRejectionModal(item.id, "reject_employee")}
                                                                className="text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs transition-colors"
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
                                                                className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs transition-colors"
                                                            >
                                                                Approuver
                                                            </button>
                                                        </Form>
                                                    ) : (
                                                        <button className="text-slate-400 font-bold bg-slate-50 px-3 py-1.5 rounded-lg text-xs cursor-not-allowed">
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
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
                            <div className="px-6 py-5 border-b border-white/30 bg-white/40 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800">Historique des validations</h3>
                                <button className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 bg-white/50 px-2 py-1 rounded-lg">
                                    5 derniers
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Émetteur</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Montant</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Motif</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/40 divide-y divide-slate-100">
                                        {validationHistory.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-slate-500">Aucun historique récent.</td></tr>
                                        ) : validationHistory.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-white/60 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={cn(
                                                            "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mr-3 shadow-sm border border-white/50",
                                                            "bg-white text-slate-600"
                                                        )}>
                                                            {item.type === 'Dépense' && <Wallet className="h-4 w-4" />}
                                                            {item.type === 'Paie' && <Users className="h-4 w-4" />}
                                                            {item.type === 'Transaction' && <CheckCircle className="h-4 w-4" />}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800">{item.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{item.emitter}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{item.amount.toLocaleString()} CFA</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset",
                                                        item.status === 'Validé' ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-red-50 text-red-700 ring-red-600/20"
                                                    )}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">
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
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-slate-800">Vue d'ensemble financière</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Solde Trésorerie */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6 flex flex-col justify-between transition-all hover:-translate-y-1 duration-300">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-slate-500">Solde Trésorerie</p>
                                        <h3 className="text-3xl font-bold text-slate-900 mt-2">{financeStats.treasuryBalance.toLocaleString()} CFA</h3>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 shadow-sm">
                                        <Wallet className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
                                    <TrendingUp className="mr-1 h-4 w-4" />
                                    {financeStats.growth.treasury}%
                                </div>
                            </div>

                            {/* Dépenses cette année */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6 flex flex-col justify-between transition-all hover:-translate-y-1 duration-300">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-slate-500">Dépenses cette année</p>
                                        <h3 className="text-3xl font-bold text-slate-900 mt-2">{financeStats.yearlyExpenses.toLocaleString()} CFA</h3>
                                    </div>
                                    <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600 shadow-sm">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
                                    <TrendingUp className="mr-1 h-4 w-4" />
                                    {financeStats.growth.expenses}%
                                </div>
                            </div>

                            {/* Dettes & Créances */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6 flex flex-col justify-between transition-all hover:-translate-y-1 duration-300">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-slate-500">Dettes & Créances</p>
                                        <h3 className="text-3xl font-bold text-slate-900 mt-2">{financeStats.debtsAndReceivables.toLocaleString()} CFA</h3>
                                    </div>
                                    <div className="p-3 bg-green-500/10 rounded-2xl text-green-600 shadow-sm">
                                        <Building className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
                                    <TrendingUp className="mr-1 h-4 w-4" />
                                    {financeStats.growth.debts}%
                                </div>
                            </div>
                        </div>

                        {/* Agency Performance Chart */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Performance des Agences</h3>
                                <button className="text-slate-500 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold hover:bg-slate-50">Masse salariale</button>
                            </div>
                            <div className="h-80 w-full" style={{ height: "320px", width: "100%", display: "block" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={agencyPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.95)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="turnover" name="Salaires" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} />
                                        <Bar dataKey="expenses" name="Dépenses" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={20} />
                                        <Bar dataKey="netResult" name="Résultat Net" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content: HR */}
                {activeTab === "hr" && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Ressources Humaines</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="p-6 border border-white/50 rounded-2xl bg-white/40 shadow-sm flex flex-col items-center text-center">
                                <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-3">
                                    <Users className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">Masse Salariale Globale</p>
                                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.salaryMass.toLocaleString()} CFA</p>
                            </div>
                            {/* More HR Stats could go here */}
                        </div>
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-center">
                            <p className="text-blue-600 font-medium">✨ Détails de la gestion du personnel enrichis à venir...</p>
                        </div>
                    </div>
                )}

                {/* Tab Content: Agences */}
                {activeTab === "agencies" && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden animate-fade-in">
                        <div className="px-6 py-5 border-b border-white/30 bg-white/40 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">Gestion des Agences</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:scale-105 hover:from-blue-500 hover:to-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Plus className="h-4 w-4" />
                                Ajouter une agence
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Performance Dashboard */}
                            <AgencyPerformanceDashboard performance={agencyPerformance} />

                            <div className="border-t border-white/30 pt-8">
                                <div className="flex items-center justify-between mb-6 px-1">
                                    <h3 className="text-xl font-bold text-slate-800">Annuaire des Agences</h3>
                                </div>
                                <AgencyList
                                    agencies={agencies}
                                    onEdit={handleEditAgency}
                                    onDelete={handleDeleteAgency}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content: Projects */}
                {activeTab === "projects" && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Lotissements */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
                            <div className="px-6 py-5 border-b border-white/30 bg-white/40 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Map className="w-5 h-5 text-blue-600" />
                                    Lotissements & Terrains
                                </h3>
                                <span className="bg-blue-500/10 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                                    {developments.length} Projets
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nom du Site</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Localisation</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lots (Total/Vendus)</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/40 divide-y divide-slate-100">
                                        {developments.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-500">Aucun projet de lotissement.</td></tr>
                                        ) : developments.map((dev: any) => (
                                            <tr key={dev.id} className="hover:bg-white/60 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{dev.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{dev.location}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {dev.totalLots} / <span className="text-green-600 font-bold">{dev._count?.lots ?? 0}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={cn("px-2.5 py-0.5 text-xs rounded-full font-bold uppercase ring-1 ring-inset",
                                                        dev.status === 'in_progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-slate-100 text-slate-700 ring-slate-600/20'
                                                    )}>
                                                        {dev.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <Link to={`/agency/projects/${dev.id}`} className="text-blue-600 hover:text-blue-800 font-bold hover:underline">Détails</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Constructions */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
                            <div className="px-6 py-5 border-b border-white/30 bg-white/40 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <HardHat className="w-5 h-5 text-orange-600" />
                                    Chantiers & Construction
                                </h3>
                                <span className="bg-orange-500/10 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
                                    {constructions.length} Chantiers
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Chantier</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Responsable</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Budget</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Progression</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/40 divide-y divide-slate-100">
                                        {constructions.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-500">Aucun chantier en cours.</td></tr>
                                        ) : constructions.map((proj: any) => (
                                            <tr key={proj.id} className="hover:bg-white/60 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-slate-900">{proj.name}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{proj.type}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {proj.manager?.firstName} {proj.manager?.lastName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                    {proj.budget.toLocaleString()} CFA
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-32">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${proj.progress}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">{proj.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={cn("px-2.5 py-0.5 text-xs rounded-full font-bold uppercase ring-1 ring-inset",
                                                        proj.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                            proj.status === 'in_progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-slate-100 text-slate-700 ring-slate-600/20'
                                                    )}>
                                                        {proj.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal */}
                <AnimatePresence>
                    {(isCreateModalOpen || editingAgency) && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                                onClick={() => { setIsCreateModalOpen(false); setEditingAgency(null); }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-3xl bg-white/90 backdrop-blur-2xl shadow-2xl ring-1 ring-white/50 transition-all"
                            >
                                <div className="px-6 pb-6 pt-6 sm:p-8">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <h3 className="text-xl font-bold leading-6 text-slate-900" id="modal-title">
                                                {editingAgency ? "Modifier l'agence" : "Ajouter une nouvelle agence"}
                                            </h3>
                                            <div className="mt-6">
                                                <AgencyForm
                                                    defaultValues={editingAgency || undefined}
                                                    isSubmitting={isSubmitting}
                                                    onCancel={() => { setIsCreateModalOpen(false); setEditingAgency(null); }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
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
