export interface Property {
    id: string;
    title: string;
    type: 'apartment' | 'villa' | 'studio' | 'land' | 'store' | 'office';
    status: 'available' | 'rented' | 'sold' | 'maintenance' | 'reserved';
    price: number;
    currency: 'XOF' | 'EUR' | 'USD';
    location: string;
    size: number; // m2
    rooms?: number;
    bathrooms?: number;
    imageUrl?: string;
    agentId?: string;
    description?: string;
}
