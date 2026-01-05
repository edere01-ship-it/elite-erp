export interface WorkProgress {
    siteClearing: number; // Nettoyage du site
    roads: number; // Tracé des voiries
    electricity: number; // Réseau électrique
    water: number; // Adduction en eau
    subdivision: number; // Borne et lotissement
}

export interface TechnicalDossier {
    status: 'pending' | 'submitted' | 'processing' | 'approved' | 'issued';
    acdNumber?: string;
    technicalVisa?: boolean;
    submissionDate?: string;
}

export interface LandDevelopment {
    id: string;
    name: string;
    location: string;
    totalArea: number; // en m² ou ha
    numberOfLots: number;
    availableLots: number;
    progress: WorkProgress;
    technicalDossier: TechnicalDossier;
    status: 'planning' | 'in_progress' | 'completed' | 'paused';
}
