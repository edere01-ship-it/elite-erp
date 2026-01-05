import type { Visit } from "~/types/visit";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "~/lib/utils";

interface VisitCalendarProps {
    visits: Visit[];
}

// Helper to get days in current week (simplified)
const getWeekDays = () => {
    const dates = [];
    const today = new Date();
    // Assuming today is start of view for simplicity in mock
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d);
    }
    return dates;
};

export function VisitCalendar({ visits }: VisitCalendarProps) {
    const weekDays = getWeekDays();
    const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9h to 17h

    return (
        <div className="flex h-full flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Agenda Semaine</h2>
                <div className="flex items-center rounded-md border border-gray-300 bg-white shadow-sm md:items-stretch">
                    <button className="flex items-center justify-center rounded-l-md border-r border-gray-300 bg-white py-2 pl-3 pr-4 text-gray-700 hover:text-gray-500 focus:relative md:w-9 md:px-2 md:hover:bg-gray-50">
                        <span className="sr-only">Semaine précédente</span>
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button className="hidden border-t-0 border-b-0 border-r border-gray-300 bg-white px-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:relative md:block">
                        Aujourd'hui
                    </button>
                    <button className="flex items-center justify-center rounded-r-md border-l border-gray-300 bg-white py-2 pl-4 pr-3 text-gray-700 hover:text-gray-500 focus:relative md:w-9 md:px-2 md:hover:bg-gray-50">
                        <span className="sr-only">Semaine suivante</span>
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-auto overflow-x-auto">
                <div className="min-w-[800px] flex flex-auto flex-col">
                    {/* Header */}
                    <div className="grid grid-cols-8 divide-x divide-gray-200 border-b border-gray-200 text-sm font-semibold text-gray-700 leading-6 bg-gray-50">
                        <div className="py-2 pl-4"></div> {/* Time Column */}
                        {weekDays.map((date, idx) => (
                            <div key={idx} className="flex justify-center py-2">
                                <span>
                                    {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex bg-gray-50">
                        <div className="w-full grid grid-cols-8 divide-x divide-gray-200">
                            <div className="bg-white">
                                {hours.map(hour => (
                                    <div key={hour} className="h-20 border-b border-gray-100 relative">
                                        <span className="absolute -top-3 left-2 text-xs text-gray-400">{hour}:00</span>
                                    </div>
                                ))}
                            </div>
                            {weekDays.map((date, dayIdx) => (
                                <div key={dayIdx} className="bg-white relative">
                                    {hours.map(hour => (
                                        <div key={hour} className="h-20 border-b border-gray-100" />
                                    ))}
                                    {/* Render overlapping events logic would go here */}
                                    {visits
                                        .filter(v => v.date === date.toISOString().split('T')[0])
                                        .map(visit => {
                                            const visitHour = parseInt(visit.time.split(':')[0]);
                                            const topOffset = (visitHour - 9) * 80; // 80px height per hour
                                            if (visitHour < 9 || visitHour > 17) return null;

                                            return (
                                                <div
                                                    key={visit.id}
                                                    className="absolute left-1 right-1 rounded-lg border border-blue-200 bg-blue-50 p-1 text-xs hover:bg-blue-100 cursor-pointer overflow-hidden z-10"
                                                    style={{ top: `${topOffset + 4}px`, height: '70px' }}
                                                >
                                                    <p className="font-semibold text-blue-700">{visit.time} - {visit.clientName}</p>
                                                    <p className="text-blue-500 truncate">{visit.propertyTitle}</p>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
