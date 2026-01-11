import { X, Calendar, Video, Loader2 } from "lucide-react";
import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface MeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MeetingModal({ isOpen, onClose }: MeetingModalProps) {
    const fetcher = useFetcher();
    const [mounted, setMounted] = useState(false);

    // Ensure we only render on client to access document.body
    useEffect(() => {
        setMounted(true);
    }, []);

    // Simple controlled state if needed, or just rely on native form
    const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

            {/* Modal Positioning */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                <Video className="h-6 w-6 text-blue-600" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                    Planifier une Réunion
                                </h3>
                                <div className="mt-2 text-left">
                                    <fetcher.Form method="post" action="/api/meetings" className="space-y-4">
                                        <input type="hidden" name="intent" value="create_meeting" />

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Titre</label>
                                            <input type="text" name="title" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" placeholder="Réunion d'équipe..." />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Date début</label>
                                                <input type="datetime-local" name="startTime" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Date fin</label>
                                                <input type="datetime-local" name="endTime" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <textarea name="description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"></textarea>
                                        </div>

                                        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Un lien Jitsi Meet sera généré automatiquement.
                                        </div>

                                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                                            <button
                                                type="submit"
                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                                            >
                                                Planifier
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                                onClick={onClose}
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </fetcher.Form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
