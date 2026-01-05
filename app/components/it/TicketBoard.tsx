import type { Ticket } from "~/types/it";
import { AlertCircle, CheckCircle, Clock, PlayCircle, MoreHorizontal } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { Form } from "react-router";

interface TicketBoardProps {
    tickets: Ticket[];
    onUpdateStatus?: (id: string, status: string) => void;
}

export function TicketBoard({ tickets, onUpdateStatus }: TicketBoardProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'border-l-4 border-l-red-500';
            case 'high': return 'border-l-4 border-l-orange-500';
            case 'medium': return 'border-l-4 border-l-yellow-500';
            default: return 'border-l-4 border-l-blue-500';
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => (
                <div key={ticket.id} className={cn("bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative group", getPriorityColor(ticket.priority))}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                ticket.status === 'open' ? 'bg-red-100 text-red-700' :
                                    ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            )}>
                                {ticket.status.replace('_', ' ')}
                            </span>

                            {onUpdateStatus && (
                                <div className="relative group-hover:block hidden">
                                    <select
                                        className="text-xs border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1"
                                        defaultValue={ticket.status}
                                        onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                                    >
                                        <option value="open">Ouvrir</option>
                                        <option value="in_progress">En cours</option>
                                        <option value="resolved">Résolu</option>
                                        <option value="closed">Fermé</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{ticket.title}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-900">{ticket.requester}</span>
                        </div>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
