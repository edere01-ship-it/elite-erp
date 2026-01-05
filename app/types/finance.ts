export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: 'rent' | 'sale' | 'salary' | 'maintenance' | 'tax' | 'office' | 'other';
    status: 'completed' | 'pending' | 'cancelled';
    reference?: string;
    paymentMethod: 'cash' | 'check' | 'transfer' | 'mobile_money';
    issuerName?: string;
    validatorName?: string;
}

export interface FinancialSummary {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    pendingIncome: number;
    cashBalance: number;
}
