import { Form } from "react-router";
import { Loader2 } from "lucide-react";
import type { User } from "@prisma/client";

interface ProjectFormProps {
    defaultValues?: any;
    managers: User[];
    isSubmitting: boolean;
    onCancel: () => void;
}

export function ProjectForm({ defaultValues, managers, isSubmitting, onCancel }: ProjectFormProps) {
    return (
        <Form method="post" className="space-y-4">
            {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}
            <input type="hidden" name="intent" value={defaultValues ? "update" : "create"} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom du projet</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        defaultValue={defaultValues?.name}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Emplacement</label>
                    <input
                        type="text"
                        name="location"
                        id="location"
                        required
                        defaultValue={defaultValues?.location}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type de projet</label>
                    <select
                        name="type"
                        id="type"
                        required
                        defaultValue={defaultValues?.type || "construction"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="construction">Construction</option>
                        <option value="renovation">Rénovation</option>
                        <option value="fitting_out">Aménagement</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                        name="status"
                        id="status"
                        required
                        defaultValue={defaultValues?.status || "planned"}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="planned">Planifié</option>
                        <option value="in_progress">En cours</option>
                        <option value="on_hold">En pause</option>
                        <option value="completed">Terminé</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Budget Estimé (FCFA)</label>
                    <input
                        type="text" // Using text to allow basic formatting, will parse in action
                        name="budget"
                        id="budget"
                        required
                        defaultValue={defaultValues?.budget?.estimated}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="progress" className="block text-sm font-medium text-gray-700">Progression (%)</label>
                    <input
                        type="number"
                        name="progress"
                        id="progress"
                        min="0"
                        max="100"
                        required
                        defaultValue={defaultValues?.progress || 0}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Date de début</label>
                    <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        required
                        defaultValue={defaultValues?.startDate ? new Date(defaultValues.startDate).toISOString().split('T')[0] : ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Date de fin (prévue)</label>
                    <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        defaultValue={defaultValues?.endDate ? new Date(defaultValues.endDate).toISOString().split('T')[0] : ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">Responsable du projet</label>
                    <select
                        name="managerId"
                        id="managerId"
                        required
                        defaultValue={defaultValues?.managerId || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">Sélectionner un responsable</option>
                        {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                                {manager.username} ({manager.email})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {defaultValues ? "Enregistrer" : "Créer le projet"}
                </button>
            </div>
        </Form>
    );
}
