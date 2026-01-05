import type { Employee } from "~/types/employee";
import { User, Edit, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "~/lib/utils";

interface EmployeeListProps {
    employees: Employee[];
    onEdit: (employee: Employee) => void;
    onDelete: (id: string) => void;
}

export function EmployeeList({ employees, onEdit, onDelete }: EmployeeListProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Effectif Personnel</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Employé
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Poste & Département
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Salaire de base
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Statut
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Date d'embauche
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User className="h-6 w-6 text-gray-500" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                                        <div className="text-xs text-gray-500">{employee.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-gray-900">{employee.position}</div>
                                <div className="text-sm text-gray-500">{employee.department}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {formatCurrency(employee.salary)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span
                                    className={cn(
                                        "inline-flex rounded-full px-2 text-xs font-semibold leading-5",
                                        employee.status === "active" ? "bg-green-100 text-green-800" :
                                            (employee.status === "pending" || employee.status === "pending_agency") ? "bg-red-100 text-red-800" :
                                                employee.status === "pending_general" ? "bg-orange-100 text-orange-800" :
                                                    employee.status === "on_leave" ? "bg-blue-100 text-blue-800" :
                                                        "bg-gray-100 text-gray-800"
                                    )}
                                >
                                    {employee.status === "active" ? "Actif" :
                                        employee.status === "pending" ? "En attente" :
                                            employee.status === "pending_agency" ? "Attente Agence" :
                                                employee.status === "pending_general" ? "Attente DG" :
                                                    employee.status === "on_leave" ? "En congé" :
                                                        "Terminé"}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {new Date(employee.startDate).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <button
                                    onClick={() => onEdit(employee)}
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(employee.id)}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
