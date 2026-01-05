import { useState } from "react";
import { useFetcher } from "react-router";
import { AlertCircle, X, CheckCircle, Loader2 } from "lucide-react";

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReportIssueModal({ isOpen, onClose }: ReportIssueModalProps) {
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";
    const isSuccess = fetcher.data?.success;

    // Reset on separate open if needed, but for now simple
    if (!isOpen) return null;

    if (isSuccess) {
        setTimeout(() => {
            onClose();
        }, 2000);
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
                {isSuccess ? (
                    <div className="p-8 flex flex-col items-center text-center animate-in zoom-in duration-300">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4 text-green-600">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Ticket Envoyé !</h3>
                        <p className="text-gray-500 mt-2">Le service IT a été notifié de votre problème.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <h3 className="font-bold text-gray-900">Signaler un problème</h3>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <fetcher.Form method="post" action="/api/tickets" className="p-4 space-y-4">
                            <input type="hidden" name="intent" value="create-ticket" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du problème</label>
                                <input
                                    name="title"
                                    required
                                    placeholder="Ex: Erreur lors de l'impression..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description détaillée</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={4}
                                    placeholder="Décrivez ce qui s'est passé..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                                    <select name="priority" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                        <option value="low">Basse (Gêne mineure)</option>
                                        <option value="medium" selected>Moyenne (Standard)</option>
                                        <option value="high">Haute (Bloquant)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                    <select name="category" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                        <option value="software">Logiciel / Bug</option>
                                        <option value="hardware">Matériel</option>
                                        <option value="network">Réseau / Wifi</option>
                                        <option value="other">Autre demande</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        "Envoyer le signalement"
                                    )}
                                </button>
                            </div>
                        </fetcher.Form>
                    </>
                )}
            </div>
        </div>
    );
}
