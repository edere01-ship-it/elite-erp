import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-CI", {
        style: "currency",
        currency: "XOF",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function translateStatus(status: string): string {
    const map: Record<string, string> = {
        'draft': 'Brouillon',
        'pending_agency': 'Attente Agence',
        'pending_general': 'Attente Direction Générale',
        'hr_validated': 'Validé RH',
        'finance_validated': 'Validé Finance',
        'direction_approved': 'Approuvé Direction',
        'paid': 'Payé',
        'active': 'Actif',
        'pending': 'En attente',
        'item_rejected': 'Rejeté',
        'rejected': 'Rejeté',
        'submitted': 'Soumis',
        'approved': 'Approuvé',
        'terminated': 'Terminé',
        'on_leave': 'En congé'
    };
    return map[status] || status;
}
