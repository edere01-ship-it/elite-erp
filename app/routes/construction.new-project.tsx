import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { createConstructionProject } from "~/services/projects.server";
import { HardHat, ArrowLeft, Save, Loader2, MapPin, Calendar, Wallet } from "lucide-react";
import type { Route } from "./+types/construction.new-project";

export async function loader({ request }: LoaderFunctionArgs) {
    await requirePermission(request, PERMISSIONS.CONSTRUCTION_MANAGE);
    return null;
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.CONSTRUCTION_MANAGE);
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const type = formData.get("type") as string;
    const budget = parseFloat(formData.get("budget") as string);
    const startDateString = formData.get("startDate") as string;
    const endDateString = formData.get("endDate") as string;

    if (!name || !location || !type || isNaN(budget) || !startDateString) {
        return { error: "Veuillez remplir tous les champs obligatoires (Nom, Lieu, Type, Budget, Date Début)." };
    }

    try {
        const newProject = await createConstructionProject({
            name,
            location,
            type,
            budget,
            startDate: new Date(startDateString),
            endDate: endDateString ? new Date(endDateString) : null,
            status: "pending",
            progress: 0,
            spent: 0,
            manager: { connect: { id: user.id } }
        });

        return redirect(`/construction`);
    } catch (error: any) {
        console.error("Creation Error:", error);
        return { error: "Erreur lors de la création du chantier. Vérifiez les données." };
    }
}

export default function NewConstructionProject() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/construction" className="p-2 hover:bg-white rounded-full transition-colors">
                    <ArrowLeft className="text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <HardHat className="text-orange-600" />
                        Nouveau Chantier de Construction
                    </h1>
                    <p className="text-sm text-gray-500">Initialisation d'un nouveau projet de construction ou rénovation</p>
                </div>
            </div>

            {/* Error Message */}
            {actionData?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Erreur : </strong>
                    <span className="block sm:inline">{actionData.error}</span>
                </div>
            )}

            <Form method="post" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 grid gap-8">

                    {/* General Info */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            Informations Générales
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Chantier *</label>
                                <input type="text" name="name" required placeholder="Ex: Rénovation Villa Cocody" className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Localisation *</label>
                                <input type="text" name="location" required placeholder="Ex: Cocody, Rue des Jardins" className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Travaux *</label>
                                <select name="type" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500">
                                    <option value="">Sélectionnez un type</option>
                                    <option value="Construction Neuve">Construction Neuve</option>
                                    <option value="Rénovation">Rénovation</option>
                                    <option value="Voirie & Réseaux (VRD)">Voirie & Réseaux (VRD)</option>
                                    <option value="Aménagement Intérieur">Aménagement Intérieur</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Planning & Budget */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            Planification & Budget
                        </h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de Démarrage *</label>
                                <input type="date" name="startDate" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de Fin (Estimée)</label>
                                <input type="date" name="endDate" className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Wallet className="w-3 h-3 text-gray-500" /> Budget Prévisionnel (FCFA) *
                                </label>
                                <input type="number" name="budget" required min="0" step="1000" placeholder="0" className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
                    <Link to="/construction" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-300 rounded-md transition-all">
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 font-medium shadow-sm disabled:opacity-50 transition-all"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Création...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Créer le Chantier
                            </>
                        )}
                    </button>
                </div>
            </Form>
        </div>
    );
}
