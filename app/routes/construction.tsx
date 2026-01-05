import type { Route } from "./+types/construction";
import { useLoaderData, type LoaderFunctionArgs, type ActionFunctionArgs, useNavigation, useSubmit } from "react-router";
import { useState, useEffect } from "react";
import { Hammer, List, LayoutGrid, Plus } from "lucide-react";
import { prisma } from "~/db.server";
import { ProjectList } from "~/components/construction/ProjectList";
import { ProjectCard } from "~/components/construction/ProjectCard";
import { ConstructionDashboard } from "~/components/construction/ConstructionDashboard";
import { ProjectForm } from "~/components/construction/ProjectForm";
import { MilestoneManager } from "~/components/construction/MilestoneManager";
import type { ConstructionProject } from "~/types/construction";
import { cn } from "~/lib/utils";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Chantiers & Travaux - Elite Immobilier & Divers" },
        { name: "description", content: "Suivi des chantiers et travaux" },
    ];
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create-milestone") {
        const projectId = formData.get("projectId") as string;
        const title = formData.get("title") as string;
        const dateStr = formData.get("date") as string;

        await prisma.milestone.create({
            data: {
                projectId,
                title,
                date: new Date(dateStr)
            }
        });
        return { success: true };
    }

    if (intent === "toggle-milestone") {
        const milestoneId = formData.get("milestoneId") as string;
        const completed = formData.get("completed") === "true";

        await prisma.milestone.update({
            where: { id: milestoneId },
            data: { completed }
        });
        // Optional: Auto-update project progress based on milestones? 
        // For now user updates manually in project edit.
        return { success: true };
    }

    if (intent === "delete-milestone") {
        const milestoneId = formData.get("milestoneId") as string;
        await prisma.milestone.delete({ where: { id: milestoneId } });
        return { success: true };
    }

    if (intent === "create" || intent === "update") {
        const name = formData.get("name") as string;
        const location = formData.get("location") as string;
        const type = formData.get("type") as string;
        const status = formData.get("status") as string;

        // Parse numbers safely
        const budgetRaw = formData.get("budget") as string;
        const budget = parseFloat(budgetRaw.replace(/\s/g, '').replace(/,/g, '.')) || 0;

        const progress = parseInt(formData.get("progress") as string) || 0;

        const startDateStr = formData.get("startDate") as string;
        const endDateStr = formData.get("endDate") as string;
        const managerId = formData.get("managerId") as string;

        const data = {
            name,
            location,
            type,
            status,
            budget,
            progress,
            startDate: new Date(startDateStr),
            endDate: endDateStr ? new Date(endDateStr) : null,
            managerId
        };

        if (intent === "create") {
            await prisma.constructionProject.create({ data });
        } else {
            const id = formData.get("id") as string;
            await prisma.constructionProject.update({ where: { id }, data });
        }
        return { success: true };
    }

    if (intent === "delete") {
        const id = formData.get("id") as string;
        await prisma.constructionProject.delete({ where: { id } });
        return { success: true };
    }

    return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const rawProjects = await prisma.constructionProject.findMany({
        include: {
            manager: true,
            milestones: {
                orderBy: { date: 'asc' }
            }
        },
        orderBy: { startDate: 'desc' }
    });

    const projects: ConstructionProject[] = rawProjects.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location,
        type: p.type as any,
        status: p.status as any,
        budget: {
            estimated: p.budget,
            spent: p.spent,
            currency: "XOF"
        },
        progress: p.progress,
        startDate: p.startDate.toISOString().split('T')[0],
        endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : "",
        manager: p.manager.username, // UI expects name
        managerId: p.managerId, // Helpers for form
        milestones: p.milestones.map(m => ({
            id: m.id,
            title: m.title,
            date: m.date.toISOString().split('T')[0],
            completed: m.completed
        }))
    }));

    const managers = await prisma.user.findMany(); // In real app filter by role 'manager' or 'agent'

    return { projects, managers };
}

export default function Construction() {
    const { projects, managers } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any | null>(null);
    const [selectedProjectForMilestones, setSelectedProjectForMilestones] = useState<ConstructionProject | null>(null);

    const isSubmitting = navigation.state === "submitting" &&
        (navigation.formData?.get("intent") === "create" ||
            navigation.formData?.get("intent") === "update" ||
            navigation.formData?.get("intent") === "create-milestone");

    useEffect(() => {
        if (navigation.state === "loading" && isSubmitting === false) {
            setIsCreateModalOpen(false);
            // Don't close milestone modal automatically on toggle? 
            // Better to keep it open.
            if (navigation.formData?.get("intent") === "create" || navigation.formData?.get("intent") === "update") {
                setEditingProject(null);
            }
            // For milestone creation, we might want to keep the modal open to add more.
        }
    }, [navigation.state, isSubmitting]);

    const handleEdit = (project: ConstructionProject) => {
        // Prepare flat object for form if needed, but Form defaultValues handles nested access mostly?
        // Actually ProjectForm accesses defaultValues.budget.estimated.
        // We need to pass the full project object including the 'managerId' hidden field we added to loader type.
        // Wait, I added managerId to the type in loader but it's not in the strict Interface.
        // I should probably extend the interface or just cast it. 
        // For now, I'll pass the project as is, assuming Form can handle it.
        // I need to ensure managerId is available. I mapped it in loader above, but TS might complain if I don't update type.
        // Let's rely on simple casting or loose typing in component for now to speed up.
        setEditingProject(project);
        setIsCreateModalOpen(true);
    };

    const handleManageMilestones = (project: ConstructionProject, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening edit modal
        setSelectedProjectForMilestones(project);
        setIsMilestoneModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chantiers & Travaux</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Suivi des projets de construction, rénovation et aménagement.
                    </p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'grid' ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'list' ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => { setEditingProject(null); setIsCreateModalOpen(true); }}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nouveau Projet
                    </button>
                </div>
            </div>

            <ConstructionDashboard projects={projects} />

            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Projets en cours</h2>
                {viewMode === 'grid' ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map(project => (
                            <div key={project.id} onClick={() => handleEdit(project)} className="cursor-pointer relative group">
                                <ProjectCard project={project} />
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleManageMilestones(project, e)}
                                        className="bg-white text-gray-700 text-xs px-2 py-1 rounded border shadow-sm hover:bg-gray-50"
                                    >
                                        Gérer Étapes
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <ProjectList projects={projects} />
                )}
            </div>

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        aria-hidden="true"
                        onClick={() => { setIsCreateModalOpen(false); setEditingProject(null); }}
                    />

                    <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                                        {editingProject ? "Modifier le projet" : "Nouveau Projet / Chantier"}
                                    </h3>
                                    <div className="mt-4">
                                        <ProjectForm
                                            defaultValues={editingProject}
                                            managers={managers}
                                            isSubmitting={isSubmitting}
                                            onCancel={() => { setIsCreateModalOpen(false); setEditingProject(null); }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Milestone Manager Modal */}
            {isMilestoneModalOpen && selectedProjectForMilestones && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        aria-hidden="true"
                        onClick={() => { setIsMilestoneModalOpen(false); setSelectedProjectForMilestones(null); }}
                    />

                    <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="mt-3 w-full">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                                    Étapes du projet: {selectedProjectForMilestones.name}
                                </h3>

                                <MilestoneManager
                                    projectId={selectedProjectForMilestones.id}
                                    milestones={selectedProjectForMilestones.milestones}
                                    onClose={() => { setIsMilestoneModalOpen(false); setSelectedProjectForMilestones(null); }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
