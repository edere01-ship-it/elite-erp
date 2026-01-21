import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { createLandDevelopment } from "~/services/projects.server";
import { Map, ArrowLeft, Save, Loader2, Building2, Ruler, DollarSign, FileText } from "lucide-react";
import type { Route } from "./+types/construction.new-land";

export async function loader({ request }: LoaderFunctionArgs) {
    // Requires CONSTRUCTION_MANAGE instead of AGENCY_MANAGE since it's a general project
    // Or we keep AGENCY_MANAGE if it's strictly agency business?
    // Let's use CONSTRUCTION_MANAGE for consistency in this module.
    await requirePermission(request, PERMISSIONS.CONSTRUCTION_MANAGE);
    return null;
}

export async function action({ request }: ActionFunctionArgs) {
    await requirePermission(request, PERMISSIONS.CONSTRUCTION_MANAGE);
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const totalArea = parseFloat(formData.get("totalArea") as string);
    const totalLots = parseInt(formData.get("totalLots") as string);

    // Legal
    const legalTitle = formData.get("legalTitle") as string;
    const titleNumber = formData.get("titleNumber") as string;
    const landOwner = formData.get("landOwner") as string;
    const boundaries = formData.get("boundaries") as string;
    const legalStatus = formData.get("legalStatus") as string;

    // Financials
    const acquisitionCost = parseFloat(formData.get("acquisitionCost") as string) || 0;
    const developmentBudget = parseFloat(formData.get("developmentBudget") as string) || 0;
    const lotUnitCost = parseFloat(formData.get("lotUnitCost") as string) || 0;
    const expectedMargin = parseFloat(formData.get("expectedMargin") as string) || 0;

    if (!name || !location || isNaN(totalArea) || isNaN(totalLots)) {
        return { error: "Veuillez remplir tous les champs obligatoires (Nom, Lieu, Superficie, Nbre Lots)." };
    }

    try {
        const newProject = await createLandDevelopment({
            name,
            location,
            totalArea,
            totalLots,
            legalTitle,
            titleNumber,
            landOwner,
            boundaries,
            legalStatus,
            acquisitionCost,
            developmentBudget,
            lotUnitCost,
            expectedMargin,
            status: "pending"
        });

        // Redirect to main list or specific project detail?
        // For now redirect to main list to confirm creation
        return redirect(`/construction`);
        // Or if we have a detail page: return redirect(`/construction/land/${newProject.id}`);
    } catch (error: any) {
        console.error("Creation Error:", error);
        return { error: "Erreur lors de la création du projet. Vérifiez les données." };
    }
}

export default function NewLandDevelopment() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/construction" className="p-2 hover:bg-white rounded-full transition-colors">
                    <ArrowLeft className="text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Map className="text-blue-600" />
                        Nouveau Site de Lotissement
                    </h1>
                    <p className="text-sm text-gray-500">Initialisation d'un nouveau projet foncier</p>
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
                            <Building2 className="w-5 h-5 text-gray-400" />
                            Informations Générales
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Site *</label>
                                <input type="text" name="name" required placeholder="Ex: Cité des Orchidées" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Localisation *</label>
                                <input type="text" name="location" required placeholder="Ex: Bingerville, Route d'Abatta" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Propriétaire Foncier (Initial)</label>
                                <input type="text" name="landOwner" placeholder="Si différent de l'entreprise" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                        </div>
                    </section>

                    {/* Technical & Legal */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b">
                            <Ruler className="w-5 h-5 text-gray-400" />
                            Données Techniques & Légales
                        </h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Superficie Totale (m²) *</label>
                                <input type="number" name="totalArea" required step="0.01" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre estimé de lots *</label>
                                <input type="number" name="totalLots" required className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Statut Juridique</label>
                                <select name="legalStatus" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    <option value="Libre">Libre de toute charge</option>
                                    <option value="En cours de vérification">En cours de vérification</option>
                                    <option value="En litige">En litige</option>
                                    <option value="Hypothéqué">Hypothéqué</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Titre</label>
                                <select name="legalTitle" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    <option value="ACD">ACD (Arrêté de Concession Définitive)</option>
                                    <option value="CPF">Certificat de Propriété Foncière</option>
                                    <option value="Attestation Villageoise">Attestation Villageoise</option>
                                    <option value="Lettre d'Attribution">Lettre d'Attribution</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro du Titre / Dossier</label>
                                <input type="text" name="titleNumber" placeholder="N° du TF ou du dossier technique" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bornage / Limites</label>
                                <textarea name="boundaries" rows={2} placeholder="Description sommaire des limites (Nord, Sud, Est, Ouest)..." className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
                            </div>
                        </div>
                    </section>

                    {/* Financials */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b">
                            <DollarSign className="w-5 h-5 text-gray-400" />
                            Prévisions Financières
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Coût d'acquisition (F CFA)</label>
                                <input type="number" name="acquisitionCost" defaultValue="0" min="0" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Aménagement (VRD)</label>
                                <input type="number" name="developmentBudget" defaultValue="0" min="0" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Coût de revient unitaire (par lot)</label>
                                <input type="number" name="lotUnitCost" defaultValue="0" min="0" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marge espérée (%)</label>
                                <input type="number" name="expectedMargin" defaultValue="30" min="0" max="100" className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
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
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50 transition-all"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Création...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Enregistrer le Projet
                            </>
                        )}
                    </button>
                </div>
            </Form>
        </div>
    );
}
