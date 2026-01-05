import type { Visit } from "~/types/visit";
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";

interface VisitListProps {
    visits: Visit[];
}

export function VisitList({ visits }: VisitListProps) {
    // Sort visits by date and time
    const sortedVisits = [...visits].sort((a, b) => {
        return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
    });

    return (
        <div className="space-y-4">
            {sortedVisits.map((visit) => (
                <div
                    key={visit.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300 transition-colors"
                >
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "flex-shrink-0 rounded-lg p-3 text-white",
                            visit.status === 'scheduled' ? "bg-blue-500" :
                                visit.status === 'completed' ? "bg-green-500" :
                                    visit.status === 'cancelled' ? "bg-red-500" :
                                        "bg-orange-500"
                        )}>
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">{visit.propertyTitle}</h4>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {visit.date} à {visit.time}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    {visit.clientName}
                                </span>
                                <span className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                    Agent: {visit.agentName}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            visit.status === 'scheduled' ? "bg-blue-100 text-blue-800" :
                                visit.status === 'completed' ? "bg-green-100 text-green-800" :
                                    visit.status === 'cancelled' ? "bg-red-100 text-red-800" :
                                        "bg-orange-100 text-orange-800"
                        )}>
                            {visit.status === 'scheduled' ? "Programmé" :
                                visit.status === 'completed' ? "Effectué" :
                                    visit.status === 'cancelled' ? "Annulé" : "Non présenté"}
                        </span>

                        {visit.status === 'scheduled' && (
                            <div className="flex gap-1">
                                <button className="rounded p-1 text-green-600 hover:bg-green-50" title="Marquer comme terminé">
                                    <CheckCircle className="h-5 w-5" />
                                </button>
                                <button className="rounded p-1 text-red-600 hover:bg-red-50" title="Annuler">
                                    <XCircle className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
