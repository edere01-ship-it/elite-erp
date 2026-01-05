export interface Visit {
    id: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    propertyId: string;
    propertyTitle: string;
    clientId: string;
    clientName: string;
    agentId: string;
    agentName: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
}
