import type { LandDevelopment } from "~/types/development";
import { MapPin, FileCheck, Tractor, Zap, Droplets, Map as MapIcon, Edit } from "lucide-react";
import { cn } from "~/lib/utils";

interface DevelopmentListProps {
    developments: LandDevelopment[];
}

function ProgressBar({ value, label, icon: Icon, colorClass }: { value: number; label: string; icon: any; colorClass: string }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                </div>
                <span className="font-medium text-gray-900">{value}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

export function DevelopmentList({ developments }: DevelopmentListProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {developments.map((dev) => (
                <div key={dev.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{dev.name}</h3>
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                    <MapPin className="mr-1 h-3.5 w-3.5 text-gray-400" />
                                    {dev.location}
                                </div>
                            </div>
                            <span className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                dev.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                                    dev.status === 'completed' ? "bg-green-100 text-green-800" :
                                        "bg-gray-100 text-gray-800"
                            )}>
                                {dev.status === 'in_progress' ? 'En cours' : dev.status === 'completed' ? 'Terminé' : 'Planification'}
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wide">Superficie</span>
                                <span className="font-semibold text-gray-900">{dev.totalArea} m²</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase tracking-wide">Lots (Dispo/Total)</span>
                                <span className="font-semibold text-gray-900">{dev.availableLots} / {dev.numberOfLots}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="mb-3 text-sm font-medium text-gray-900">Avancement des Travaux</h4>
                            <div className="space-y-4">
                                <ProgressBar
                                    value={dev.progress.siteClearing}
                                    label="Nettoyage"
                                    icon={Tractor}
                                    colorClass="bg-orange-500"
                                />
                                <ProgressBar
                                    value={dev.progress.roads}
                                    label="Voiries"
                                    icon={MapIcon} // Using Map as primitive for roads layout
                                    colorClass="bg-gray-600"
                                />
                                <ProgressBar
                                    value={dev.progress.electricity}
                                    label="Électricité"
                                    icon={Zap}
                                    colorClass="bg-yellow-500"
                                />
                                <ProgressBar
                                    value={dev.progress.water}
                                    label="Eau"
                                    icon={Droplets}
                                    colorClass="bg-blue-500"
                                />
                                <ProgressBar
                                    value={dev.progress.subdivision}
                                    label="Bornage"
                                    icon={MapPin}
                                    colorClass="bg-purple-500"
                                />
                            </div>
                        </div>

                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-start gap-3">
                                <FileCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-medium text-blue-900">Dossier Technique</h4>
                                    <div className="mt-1 space-y-1 text-sm text-blue-700">
                                        <p>Statut: <span className="font-semibold capitalize">{dev.technicalDossier.status}</span></p>
                                        {dev.technicalDossier.acdNumber && <p>N° ACD: {dev.technicalDossier.acdNumber}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <Edit className="h-4 w-4" />
                            Gérer le projet
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
