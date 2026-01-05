export interface Milestone {
    id: string;
    title: string;
    date: string;
    completed: boolean;
}

export interface ConstructionProject {
    id: string;
    name: string;
    location: string;
    type: 'construction' | 'renovation' | 'maintenance' | 'fitting_out';
    status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
    budget: {
        estimated: number;
        spent: number;
        currency: 'XOF' | 'EUR';
    };
    progress: number; // 0-100
    startDate: string;
    endDate: string;
    manager: string;
    milestones: Milestone[];
}
