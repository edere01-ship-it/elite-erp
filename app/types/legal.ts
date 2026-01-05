export interface Contract {
    id: string;
    title: string;
    type: string;
    startDate: string;
    endDate?: string | null;
    status: string;
    reference?: string | null;
    documentUrl?: string | null;
    client?: { firstName: string; lastName: string } | null;
    property?: { title: string } | null;
}

export interface LegalCase {
    id: string;
    title: string;
    reference?: string | null;
    type: string;
    status: string;
    priority: string;
    openedDate: string;
    description: string;
    client?: { firstName: string; lastName: string } | null;
    property?: { title: string } | null;
    assignedTo?: { username: string } | null;
}
