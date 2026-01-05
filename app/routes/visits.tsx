import type { Route } from "./+types/visits";
import { useLoaderData, type LoaderFunctionArgs, type ActionFunctionArgs, useNavigation, useSubmit } from "react-router";
import { useState, useEffect } from "react";
import { Calendar, List, Plus } from "lucide-react";
import { prisma } from "~/db.server";
import { VisitList } from "~/components/visits/VisitList";
import { VisitCalendar } from "~/components/visits/VisitCalendar";
import { VisitForm } from "~/components/visits/VisitForm";
import type { Visit } from "~/types/visit"; // We might need to map Prisma Visit to UI Visit
import { cn } from "~/lib/utils";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Visites & Rendez-vous - Elite Immobilier & Divers" },
        { name: "description", content: "Agenda des visites et rendez-vous" },
    ];
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create" || intent === "update") {
        const propertyId = formData.get("propertyId") as string;
        const clientId = formData.get("clientId") as string;
        const agentId = formData.get("agentId") as string;
        const dateStr = formData.get("date") as string;
        const timeStr = formData.get("time") as string;
        const status = formData.get("status") as string;
        const notes = formData.get("notes") as string;

        // Combine date and time to a full DateTime object if needed by Prisma (it expects just DateTime usually)
        // Actually schema has `date DateTime` which usually includes time if not @db.Date.
        // Let's create a JS Date from date + time strings.
        const fullDate = new Date(`${dateStr}T${timeStr}:00`);

        const data = {
            propertyId,
            clientId,
            agentId,
            date: fullDate, // Prisma will store this as Timestamp
            status,
            notes
        };

        if (intent === "create") {
            await prisma.visit.create({ data });
        } else {
            const id = formData.get("id") as string;
            await prisma.visit.update({ where: { id }, data });
        }
        return { success: true };
    }

    if (intent === "delete") {
        const id = formData.get("id") as string;
        await prisma.visit.delete({ where: { id } });
        return { success: true };
    }

    return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
    // Fetch visits with relations
    const rawVisits = await prisma.visit.findMany({
        include: {
            property: true,
            client: true,
            agent: true
        },
        orderBy: { date: 'asc' }
    });

    // Helper to format 2 digits
    const pad = (n: number) => n < 10 ? '0' + n : n;

    // Transform to UI Model
    const visits = rawVisits.map(v => {
        const d = new Date(v.date);
        return {
            id: v.id,
            date: d.toISOString().split('T')[0],
            time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
            propertyId: v.propertyId,
            propertyTitle: v.property.title,
            clientId: v.clientId,
            clientName: `${v.client.firstName} ${v.client.lastName}`,
            agentId: v.agentId,
            agentName: v.agent.username,
            status: v.status,
            notes: v.notes || undefined
        } as Visit;
    });

    const properties = await prisma.property.findMany({ where: { status: 'available' } });
    const clients = await prisma.client.findMany({ orderBy: { lastName: 'asc' } });
    const agents = await prisma.user.findMany(); // In real app filter by role

    return { visits, properties, clients, agents };
}

export default function Visits() {
    const { visits, properties, clients, agents } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();

    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingVisit, setEditingVisit] = useState<any | null>(null);

    const isSubmitting = navigation.state === "submitting" &&
        (navigation.formData?.get("intent") === "create" || navigation.formData?.get("intent") === "update");

    // Close modal on successful submission
    useEffect(() => {
        if (navigation.state === "loading" && isSubmitting === false) {
            setIsCreateModalOpen(false);
            setEditingVisit(null);
        }
    }, [navigation.state, isSubmitting]);

    const handleEdit = (visit: any) => {
        // We need to re-construct the date/time for the form if strictly needed,
        // but our form handles the split fields based on the UI object structure we made in loader.
        setEditingVisit(visit);
        setIsCreateModalOpen(true);
    };

    // Note: VisitList component might need to be updated to emit onEdit events if we want edit from list
    // Currently VisitList doesn't accept onEdit/onDelete props in the previous file view.
    // I will assume for now we might be missing those prop types in VisitList, I should update VisitList too if I want actions there.

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visites & Rendez-vous</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gérez votre agenda et suivez les visites programmées.
                    </p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'calendar' ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Calendar className="h-4 w-4" />
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
                        onClick={() => { setEditingVisit(null); setIsCreateModalOpen(true); }}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <Plus className="h-4 w-4" />
                        Planifier une visite
                    </button>
                </div>
            </div>

            <div className="flex-auto min-h-0 overflow-hidden">
                {viewMode === 'calendar' ? (
                    <VisitCalendar visits={visits} />
                ) : (
                    <div className="h-full overflow-y-auto pr-2">
                        <VisitList visits={visits} />
                    </div>
                )}
            </div>

            {/* Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-gray-500/75 transition-opacity"
                        aria-hidden="true"
                        onClick={() => { setIsCreateModalOpen(false); setEditingVisit(null); }}
                    />

                    <div className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                                        {editingVisit ? "Modifier la visite" : "Planifier une nouvelle visite"}
                                    </h3>
                                    <div className="mt-4">
                                        <VisitForm
                                            defaultValues={editingVisit}
                                            properties={properties}
                                            clients={clients}
                                            agents={agents}
                                            isSubmitting={isSubmitting}
                                            onCancel={() => { setIsCreateModalOpen(false); setEditingVisit(null); }}
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
