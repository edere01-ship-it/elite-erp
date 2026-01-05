export interface Asset {
    id: string;
    name: string;
    type: 'laptop' | 'desktop' | 'printer' | 'server' | 'license' | 'network';
    serialNumber: string;
    assignedTo?: string;
    status: 'active' | 'repair' | 'retired' | 'stock';
    purchaseDate: string;
    warrantyEnd?: string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    requester: string;
    assignedTo?: string;
    createdAt: string;
    category: 'hardware' | 'software' | 'network' | 'access';
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'manager' | 'agent' | 'user';
    permissions: string[]; // e.g. ['module:hr', 'module:finance']
    status: 'active' | 'inactive';
    lastLogin?: string;
    lastLogout?: string;
    lastActivity?: string;
}

export interface AuditLog {
    id: string;
    userId: string;
    username: string;
    action: 'login' | 'logout' | 'open_module' | 'view_file' | 'edit_file';
    details: string; // e.g., "Opened Finance Module", "Edited Contract.pdf"
    timestamp: string;
    module?: string;
}
