import { Form, useSubmit } from "react-router";
import { Plus, Trash2, CheckCircle, Circle } from "lucide-react";
import type { Milestone } from "~/types/construction";

interface MilestoneManagerProps {
    projectId: string;
    milestones: Milestone[];
    onClose: () => void;
}

export function MilestoneManager({ projectId, milestones, onClose }: MilestoneManagerProps) {
    const submit = useSubmit();

    const handleToggle = (milestoneId: string, currentStatus: boolean) => {
        submit({
            intent: "toggle-milestone",
            milestoneId,
            completed: (!currentStatus).toString()
        }, { method: "post", preventScrollReset: true });
    };

    const handleDelete = (milestoneId: string) => {
        if (confirm("Supprimer cette étape ?")) {
            submit({
                intent: "delete-milestone",
                milestoneId
            }, { method: "post", preventScrollReset: true });
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Étapes du projet</h4>

                {milestones.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Aucune étape définie.</p>
                ) : (
                    <ul className="space-y-3">
                        {milestones.map((milestone) => (
                            <li key={milestone.id} className="flex items-center justify-between rounded-md bg-gray-50 p-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggle(milestone.id, milestone.completed)}
                                        className={`rounded-full p-1 transition-colors ${milestone.completed ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        title={milestone.completed ? "Marquer comme non fait" : "Marquer comme fait"}
                                    >
                                        {milestone.completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                    </button>
                                    <div>
                                        <p className={`text-sm font-medium ${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                            {milestone.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(milestone.date).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(milestone.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Ajouter une étape</h4>
                <Form method="post" className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <input type="hidden" name="intent" value="create-milestone" />
                    <input type="hidden" name="projectId" value={projectId} />

                    <div className="flex-1">
                        <label htmlFor="title" className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="Ex: Fondations"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-xs font-medium text-gray-700 mb-1">Date cible</label>
                        <input
                            type="date"
                            name="date"
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter
                    </button>
                </Form>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
}
