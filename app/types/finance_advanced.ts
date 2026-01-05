export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: string;
    number: string;
    clientName: string;
    items: InvoiceItem[];
    subtotal: number;
    taxAmount: number;
    total: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    dueDate: string;
    issueDate: string;
    type: 'invoice' | 'quote';
}

export interface ExpenseReport {
    id: string;
    submitterName: string;
    amount: number;
    category: 'travel' | 'food' | 'supplies' | 'other';
    status: 'pending' | 'approved' | 'rejected';
    date: string;
    description: string;
    receiptUrl?: string; // Mock URL
}

export interface FinancialReportData {
    period: string;
    revenue: number;
    cogs: number; // Cost of Goods Sold
    grossProfit: number;
    operatingExpenses: number;
    netIncome: number;
    cashFlow: number;
}
