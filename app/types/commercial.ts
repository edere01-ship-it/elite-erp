export interface Client {
    id: string;
    name: string;
    type: 'buyer' | 'seller' | 'tenant' | 'landlord';
    contact: string;
    email: string;
    status: 'prospect' | 'active' | 'closed';
    intrest: string; // What they are interested in (e.g., "Apartment in Cocody")
    assignedAgent?: string;
}

export interface CommercialStat {
    label: string;
    value: string | number;
    change?: string; // e.g. "+12%"
    trend?: 'up' | 'down' | 'neutral';
}
