export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    salary: number;
    status: string;
    startDate: Date | string;
    agencyId?: string | null;
    userId?: string | null;
    agency?: {
        name: string;
    } | null;
    photo?: string | null;
}

export interface PayrollRun {
    id: string;
    month: number;
    year: number;
    status: 'draft' | 'pending_agency' | 'pending_general' | 'hr_validated' | 'finance_validated' | 'direction_approved' | 'paid';
    totalAmount: number;
    createdAt: string;
    items: PayrollItem[];
}

export interface PayrollItem {
    id: string;
    employeeId: string;
    employeeName?: string; // Helper for UI
    baseSalary: number;
    bonus: number;
    its: number;
    cnps: number;
    salaryAdvance: number;
    latenessDeduction: number;
    deduction: number;
    netSalary: number;
}
