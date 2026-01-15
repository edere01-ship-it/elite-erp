import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { Link, useLoaderData, useNavigation, useSubmit, redirect, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { Users, FileText, Plus, UserPlus, Send, LayoutDashboard, Briefcase } from "lucide-react";
import { EmployeeList } from "~/components/hr/EmployeeList";
import { EmployeeForm } from "~/components/hr/EmployeeForm";
import { SalaryTransmissionSheet } from "~/components/hr/SalaryTransmissionSheet";
import { HRDashboard } from "~/components/hr/HRDashboard";
import { Assignments } from "~/components/hr/Assignments";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/hr";
import { getSession } from "~/sessions.server";
import { PERMISSIONS } from "~/utils/permissions";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Ressources Humaines - Elite Immobilier & Divers" },
        { name: "description", content: "Gestion des ressources humaines et salaires" },
    ];
}

// --- ACTION ---
export async function action({ request }: ActionFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        return { error: "Non autorisé" };
    }

    const formData = await request.formData();
    const intent = formData.get("intent");
    console.log("HR Action triggered with intent:", intent);
    console.log("Form Data:", Object.fromEntries(formData));
    const { prisma } = await import("~/db.server");
    const { requirePermission } = await import("~/utils/permissions.server");
    const { uploadFile } = await import("~/utils/upload.server");

    // Helper to parse currency input (e.g. "150 000" -> 150000)
    const parseCurrency = (val: string) => parseFloat(val.replace(/\s/g, '')) || 0;

    if (intent === "create_employee") {
        await requirePermission(userId, PERMISSIONS.HR_CREATE);

        try {
            const firstName = formData.get("firstName") as string;
            const lastName = formData.get("lastName") as string;
            const email = formData.get("email") as string;

            // Robust parsing
            const salaryRaw = formData.get("salary") as string;
            const salary = parseCurrency(salaryRaw);

            const startDateRaw = formData.get("startDate") as string;
            const startDate = startDateRaw ? new Date(startDateRaw) : new Date();

            // Handle Files
            const photoFile = formData.get("photo") as File | null;
            const identityDocFile = formData.get("identityDocument") as File | null;

            let photoPath = null;
            let identityDocPath = null;

            if (photoFile && photoFile.size > 0 && photoFile.name) {
                photoPath = await uploadFile(photoFile, "employees/photos");
            }

            if (identityDocFile && identityDocFile.size > 0 && identityDocFile.name) {
                identityDocPath = await uploadFile(identityDocFile, "employees/identities");
            }

            // Attempt to link to existing User
            const existingUser = await prisma.user.findUnique({ where: { email } });

            // Generate Matricule
            const count = await prisma.employee.count();
            const year = new Date().getFullYear().toString().slice(-2);
            const matricule = `MAT-${year}-${(count + 1).toString().padStart(4, '0')}`;


            await prisma.employee.create({
                data: {
                    matricule,
                    firstName,
                    lastName,
                    email,
                    phone: formData.get("phone") as string,
                    position: formData.get("position") as string,
                    department: formData.get("department") as string,
                    salary,
                    startDate,
                    status: 'pending_agency',
                    agencyId: formData.get("agencyId") as string || null,

                    // New Fields
                    identityType: formData.get("identityType") as string || null,
                    identityNumber: formData.get("identityNumber") as string || null,
                    cmuNumber: formData.get("cmuNumber") as string || null,
                    cnpsNumber: formData.get("cnpsNumber") as string || null,
                    photo: photoPath,
                    identityDocument: identityDocPath,
                    userId: existingUser ? existingUser.id : undefined
                }
            });
            return { success: true };
        } catch (error) {
            console.error("Error creating employee:", error);
            return { error: "Erreur lors de la création de l'employé. Vérifiez les champs." };
        }
    }

    if (intent === "update_employee") {
        await requirePermission(userId, PERMISSIONS.HR_EDIT);

        const id = formData.get("id") as string;

        // Fetch existing to handle file updates (if replaced)
        // For simplicity, we just look for new files. 
        // If needed we could delete old ones, but for now just overwrite reference.

        const photoFile = formData.get("photo") as File | null;
        const identityDocFile = formData.get("identityDocument") as File | null;

        const updateData: any = {
            firstName: formData.get("firstName") as string,
            lastName: formData.get("lastName") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            position: formData.get("position") as string,
            department: formData.get("department") as string,
            salary: parseCurrency(formData.get("salary") as string),
            status: formData.get("status") as string,
            agencyId: formData.get("agencyId") as string || null,

            identityType: formData.get("identityType") as string || null,
            identityNumber: formData.get("identityNumber") as string || null,
            cmuNumber: formData.get("cmuNumber") as string || null,
            cnpsNumber: formData.get("cnpsNumber") as string || null,
        };

        if (photoFile && photoFile.size > 0 && photoFile.name) {
            updateData.photo = await uploadFile(photoFile, "employees/photos");
        }

        if (identityDocFile && identityDocFile.size > 0 && identityDocFile.name) {
            updateData.identityDocument = await uploadFile(identityDocFile, "employees/identities");
        }

        // Attempt to link to existing User if email changed or not linked
        const existingUser = await prisma.user.findUnique({ where: { email: updateData.email } });
        if (existingUser) {
            updateData.userId = existingUser.id;
        }

        await prisma.employee.update({
            where: { id },
            data: updateData
        });
        return { success: true };
    }

    if (intent === "assign_employee") {
        await requirePermission(userId, PERMISSIONS.HR_EDIT);
        const employeeId = formData.get("employeeId") as string;
        const agencyId = formData.get("agencyId") as string;

        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                // @ts-ignore
                pendingAgencyId: agencyId === "none" ? null : agencyId,
                // Do not change agencyId yet
            }
        });
        return { success: true };
    }

    if (intent === "delete") {
        await requirePermission(userId, PERMISSIONS.HR_DELETE);
        const id = formData.get("id") as string;
        // Soft delete or status change usually better, but for now hard delete if requested
        // or set to terminated
        await prisma.employee.update({
            where: { id },
            data: { status: 'terminated' }
        });
        return { success: true };
    }

    if (intent === "generate_payroll") {
        await requirePermission(userId, PERMISSIONS.HR_CREATE);

        const monthParam = formData.get("month") as string; // YYYY-MM
        const [yearStr, monthStr] = monthParam.split("-");
        const month = parseInt(monthStr);
        const year = parseInt(yearStr);

        // Determine Agency Context
        // If global HR ("Admin"), allow selecting agency? For now default to "Global" or user's agency.
        // Let's assume simpler: If user is in an agency, generate for that agency.
        // If user is Admin, generate Global OR per agency.
        // For this step, let's grab the user's agency.
        const userEmployee = await prisma.employee.findUnique({
            where: { userId: userId! },
            select: { agencyId: true }
        });

        // Use provided agencyId from form (if Admin selects) or fallback to user's agency
        // (Note: UI doesn't have selector yet, so this will mostly rely on user's agency or be Global)
        const agencyId = (formData.get("agencyId") as string) || userEmployee?.agencyId || null;

        // Filter employees: If agencyId is present, only active employees of that agency. 
        // If no agencyId (Global HR), all active employees (or maybe those without agency? or all?)
        // Let's go with: If Agency specified, filter by it. Else all.
        const whereClause: any = { status: 'active' };
        if (agencyId) {
            whereClause.agencyId = agencyId;
        }

        const employees = await prisma.employee.findMany({ where: whereClause });

        if (employees.length === 0) {
            return { error: "Aucun employé actif trouvé pour cette période/agence." };
        }

        // Calculate total amount
        const totalAmount = employees.reduce((sum, e) => sum + e.salary, 0);

        await prisma.payrollRun.create({
            data: {
                month, year,
                status: 'draft',
                totalAmount,
                agencyId: agencyId, // Link run to agency
                items: {
                    create: employees.map(e => ({
                        employeeId: e.id,
                        baseSalary: e.salary,
                        bonus: 0,
                        deduction: 0,
                        netSalary: e.salary
                    }))
                }
            }
        });
        return { success: true };
    }

    if (intent === "update_payroll_item") {
        const itemId = formData.get("itemId") as string;
        const bonus = parseFloat(formData.get("bonus") as string) || 0;
        const its = parseFloat(formData.get("its") as string) || 0;
        const cnps = parseFloat(formData.get("cnps") as string) || 0;
        const salaryAdvance = parseFloat(formData.get("salaryAdvance") as string) || 0;
        const latenessDeduction = parseFloat(formData.get("latenessDeduction") as string) || 0;
        const deduction = parseFloat(formData.get("deduction") as string) || 0;

        const item = await prisma.payrollItem.findUnique({ where: { id: itemId } });
        if (!item) return null;

        // Formula: Net = Base + Bonus - Taxes - Deductions
        const netSalary = item.baseSalary + bonus - (its + cnps + salaryAdvance + latenessDeduction + deduction);

        // Update item with all fields
        await prisma.payrollItem.update({
            where: { id: itemId },
            data: {
                // @ts-ignore
                bonus,
                // @ts-ignore
                its,
                // @ts-ignore
                cnps,
                // @ts-ignore
                salaryAdvance,
                // @ts-ignore
                latenessDeduction,
                // @ts-ignore
                deduction,
                netSalary
            }
        });

        // Recalculate total for run
        const run = await prisma.payrollRun.findUnique({
            where: { id: item.payrollRunId },
            include: { items: true }
        });

        if (run) {
            const newTotal = run.items.reduce((sum: number, i: { netSalary: number }) => sum + i.netSalary, 0);
            await prisma.payrollRun.update({
                where: { id: run.id },
                data: { totalAmount: newTotal }
            });
        }

        return { success: true };
    }

    if (intent === "validate_payroll") {
        const runId = formData.get("runId") as string;

        const run = await prisma.payrollRun.findUnique({ where: { id: runId }, select: { agencyId: true } });

        // If Agency Run -> Pending Agency (for Agency Manager). Else -> hr_validated (for Finance/Direction)
        const nextStatus = run?.agencyId ? 'pending_agency' : 'hr_validated';

        await prisma.payrollRun.update({
            where: { id: runId },
            data: { status: nextStatus }
        });
        return { success: true };
    }

    if (intent === "revert_payroll_to_draft") {
        await requirePermission(userId, PERMISSIONS.HR_EDIT);
        const runId = formData.get("runId") as string;

        // Revert to draft to allow editing again
        await prisma.payrollRun.update({
            where: { id: runId },
            data: { status: 'draft' }
        });
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
    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month"); // YYYY-MM

    // Default to current month if not provided
    const date = monthParam ? new Date(monthParam + "-01") : new Date();
    // Validate date
    const isValidDate = !isNaN(date.getTime());
    const effectiveDate = isValidDate ? date : new Date();

    const month = effectiveDate.getMonth() + 1;
    const year = effectiveDate.getFullYear();
    const currentMonthStr = isValidDate && monthParam ? monthParam : effectiveDate.toISOString().slice(0, 7);

    const { prisma } = await import("~/db.server");

    // Fetch Base Data
    const employees = await prisma.employee.findMany({
        orderBy: { createdAt: 'desc' },
        include: { agency: true }
    });

    const agencies = await prisma.agency.findMany({
        orderBy: { name: 'asc' }
    });

    const payrollRun = await prisma.payrollRun.findFirst({
        where: { month, year },
        include: {
            items: {
                include: { employee: true }
            }
        }
    });

    // Formatting Payroll Run for UI
    const formattedPayrollRun = payrollRun ? {
        ...payrollRun,
        status: payrollRun.status as 'draft' | 'hr_validated' | 'finance_validated' | 'direction_approved' | 'paid',
        createdAt: payrollRun.createdAt.toISOString(),
        items: payrollRun.items.map(item => ({
            ...item,
            employeeName: `${item.employee.firstName} ${item.employee.lastName}`
        }))
    } : null;

    // Permissions & Logging
    const { hasPermission } = await import("~/utils/permissions.server");
    const { logModuleAccess } = await import("~/services/it.server");
    await logModuleAccess(userId, "HR");

    const canCreate = await hasPermission(userId, PERMISSIONS.HR_CREATE);
    const canEdit = await hasPermission(userId, PERMISSIONS.HR_EDIT);

    // Dashboard Stats
    const activeEmployees = employees.filter(e => e.status === 'active').length;
    // Theoretical monthly payroll based on active employees base salary
    const theoreticalPayroll = employees
        .filter(e => e.status === 'active')
        .reduce((sum, e) => sum + e.salary, 0);

    // Pending validations (Payroll runs that are Draft or HR Validated but not Paid)
    const pendingRuns = await prisma.payrollRun.count({
        where: { status: { in: ['draft', 'hr_validated', 'finance_validated'] } }
    });

    const pendingEmployees = await prisma.employee.count({
        where: { status: 'pending' }
    });

    const pendingValidations = pendingRuns + pendingEmployees;

    // Recent Activity (Mocked or simple query)
    // Recent Activity Aggregation
    const [recentNewEmployees, recentAssignments, recentPayrolls] = await Promise.all([
        prisma.employee.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { id: true, firstName: true, lastName: true, createdAt: true }
        }),
        prisma.employee.findMany({
            where: { NOT: { agencyId: null } },
            take: 10,
            orderBy: { updatedAt: 'desc' },
            include: { agency: true }
        }),
        prisma.payrollRun.findMany({
            take: 10,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, month: true, year: true, status: true, updatedAt: true }
        })
    ]);

    const recentActivity = [
        ...recentNewEmployees.map(e => ({
            id: e.id,
            description: `Nouvel employé: ${e.firstName} ${e.lastName}`,
            date: e.createdAt,
            type: 'creation'
        })),
        ...recentAssignments.map(e => ({
            id: `assign-${e.id}`, // Unique key
            description: `Affectation: ${e.firstName} ${e.lastName} -> ${e.agency?.name}`,
            date: e.updatedAt,
            type: 'assignment'
        })),
        ...recentPayrolls.map(p => ({
            id: p.id,
            description: `Paie ${p.month}/${p.year} - Statut: ${p.status}`,
            date: p.updatedAt,
            type: 'payroll'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20)
        .map(a => ({
            description: a.description,
            date: new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        }));

    return {
        employees,
        agencies,
        payrollRun: formattedPayrollRun,
        currentMonth: currentMonthStr,
        canCreate,
        canEdit,
        stats: {
            totalEmployees: employees.length,
            activeEmployees,
            totalPayroll: theoreticalPayroll,
            pendingValidations,
            avgSalary: activeEmployees > 0 ? theoreticalPayroll / activeEmployees : 0
        },
        recentActivity
    };
}

export default function HR() {
    const { employees, agencies, payrollRun, currentMonth, canCreate, canEdit, stats, recentActivity } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'add_employee' | 'assignments' | 'payroll' | 'transmission' | 'matricules'>('dashboard');
    const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

    const isSubmitting = navigation.state === "submitting" &&
        (navigation.formData?.get("intent") === "create" || navigation.formData?.get("intent") === "update" || navigation.formData?.get("intent") === "create_employee" || navigation.formData?.get("intent") === "update_employee");

    // When clicking "Modifier" in list, switch to "Ajouter Employé" tab with data
    const handleEdit = (employee: any) => {
        setEditingEmployee(employee);
        setActiveTab('add_employee');
    };

    const handleDelete = (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
            submit({ intent: "delete", id }, { method: "post" });
        }
    };

    const handleMonthChange = (newMonth: string) => {
        submit({ month: newMonth }, { method: "get" });
    };

    const handleAssign = (employeeId: string, agencyId: string) => {
        submit({ intent: "assign_employee", employeeId, agencyId }, { method: "post" });
    };

    // Reset editing state if we switch away from add_employee unless intended
    // Actually, good UX might be to keep it, but let's clear if "Saved"
    useEffect(() => {
        if (navigation.state === "loading" && !isSubmitting) {
            // If we just navigated/submitted, and it was successful (we can't easily check success here without actionData, but let's assume if we are switching tabs or reloading)
            // Simple: If we are on 'add_employee' and submission finished, go back to list?
            // User requested "Onglet pour créer", so maybe stay there and clear form?
        }
    }, [navigation.state]);

    const actionData = useActionData<typeof action>();

    // Reset editing state and switch tab on success
    useEffect(() => {
        if (actionData?.success) {
            setEditingEmployee(null);
            // Optional: Show success toast
            if (activeTab === 'add_employee') {
                setActiveTab('employees');
            }
        } else if (actionData?.error) {
            alert(actionData.error);
        }
    }, [actionData]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ressources Humaines</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestion du personnel, affectations et salaires.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={cn(
                            activeTab === 'dashboard'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap"
                        )}
                    >
                        <LayoutDashboard className={cn("mr-2 h-5 w-5", activeTab === 'dashboard' ? "text-blue-500" : "text-gray-400")} />
                        Tableau de bord
                    </button>
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={cn(
                            activeTab === 'employees'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap"
                        )}
                    >
                        <Users className={cn("mr-2 h-5 w-5", activeTab === 'employees' ? "text-blue-500" : "text-gray-400")} />
                        Personnel
                    </button>
                    {canCreate && (
                        <button
                            onClick={() => { setEditingEmployee(null); setActiveTab('add_employee'); }}
                            className={cn(
                                activeTab === 'add_employee'
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap"
                            )}
                        >
                            <UserPlus className={cn("mr-2 h-5 w-5", activeTab === 'add_employee' ? "text-blue-500" : "text-gray-400")} />
                            {editingEmployee ? "Modifier Employé" : "Ajouter Employé"}
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={cn(
                            activeTab === 'assignments'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap"
                        )}
                    >
                        <Briefcase className={cn("mr-2 h-5 w-5", activeTab === 'assignments' ? "text-blue-500" : "text-gray-400")} />
                        Affectations
                    </button>
                    <button
                        onClick={() => setActiveTab('matricules')}
                        className={cn(
                            activeTab === 'matricules'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap"
                        )}
                    >
                        <FileText className={cn("mr-2 h-5 w-5", activeTab === 'matricules' ? "text-blue-500" : "text-gray-400")} />
                        Matricules
                    </button>
                    <button
                        onClick={() => setActiveTab('payroll')}
                        className={cn(
                            activeTab === 'payroll'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap"
                        )}
                    >
                        <FileText className={cn("mr-2 h-5 w-5", activeTab === 'payroll' ? "text-blue-500" : "text-gray-400")} />
                        Fiches de Paie
                    </button>
                    <button
                        onClick={() => setActiveTab('transmission')}
                        className={cn(
                            activeTab === 'transmission'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap"
                        )}
                    >
                        <Send className={cn("mr-2 h-5 w-5", activeTab === 'transmission' ? "text-blue-500" : "text-gray-400")} />
                        Transmission
                    </button>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'dashboard' && (
                    <HRDashboard stats={stats} recentActivity={recentActivity} />
                )}

                {activeTab === 'employees' && (
                    <EmployeeList
                        employees={employees}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}

                {activeTab === 'add_employee' && (
                    <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6">
                            {editingEmployee ? "Modifier les informations" : "Créer un nouveau dossier employé"}
                        </h2>
                        <EmployeeForm
                            defaultValues={editingEmployee}
                            agencies={agencies}
                            isSubmitting={isSubmitting}
                            onCancel={() => { setEditingEmployee(null); setActiveTab('employees'); }}
                        />
                    </div>
                )}

                {activeTab === 'matricules' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Matricules Employés</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poste</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                            {emp.matricule || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center gap-3">
                                                {emp.photo ? (
                                                    <img src={emp.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-gray-500">
                                                            {emp.firstName[0]}{emp.lastName[0]}
                                                        </span>
                                                    </div>
                                                )}
                                                {emp.firstName} {emp.lastName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {emp.position}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <Assignments
                        // @ts-ignore
                        employees={employees}
                        agencies={agencies}
                        onAssign={handleAssign}
                    />
                )}

                {activeTab === 'payroll' && (
                    <div>
                        {/* Reusing SalaryTransmissionSheet for Payroll management/Creation */}
                        <SalaryTransmissionSheet
                            // @ts-ignore
                            payrollRun={payrollRun}
                            currentMonth={currentMonth}
                            onMonthChange={handleMonthChange}
                        />
                    </div>
                )}

                {activeTab === 'transmission' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Transmission des Salaires</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Vérifiez et validez les fiches de paie avant transmission au service financier et à la direction.
                        </p>

                        {payrollRun ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">Période: {currentMonth}</p>
                                        <p className="text-sm text-gray-500">Statut: {payrollRun.status}</p>
                                        <p className="text-sm text-gray-500">Total: {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(payrollRun.totalAmount)}</p>
                                    </div>
                                    {payrollRun.status === 'draft' && (
                                        <button
                                            // Trigger validation via action
                                            onClick={() => {
                                                if (confirm("Valider et transmettre ?")) {
                                                    submit({ intent: "validate_payroll", runId: payrollRun.id }, { method: "post" });
                                                }
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                        >
                                            <Send className="h-4 w-4" /> Validé & Transmettre
                                        </button>
                                    )}
                                    {payrollRun.status !== 'draft' && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            Déjà transmis / Validé
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">
                                    * La validation verrouille la fiche de paie et notifie le service financier.
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                                Aucune fiche de paie en cours pour ce mois. Veuillez d'abord générer la paie dans l'onglet "Fiches de Paie".
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
