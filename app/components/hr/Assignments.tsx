
import { useState } from "react";
import { User, MapPin, Building, Briefcase } from "lucide-react";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    agency?: { name: string } | null;
    // potential future project relation
}

interface AssignmentsProps {
    employees: Employee[];
    agencies: { id: string; name: string }[];
    onAssign: (employeeId: string, agencyId: string) => void;
}

export function Assignments({ employees, agencies, onAssign }: AssignmentsProps) {
    const [selectedEmployee, setSelectedEmployee] = useState<string>("");
    const [selectedAgency, setSelectedAgency] = useState<string>("");

    const handleAssign = () => {
        if (selectedEmployee && selectedAgency) {
            onAssign(selectedEmployee, selectedAgency);
            setSelectedEmployee("");
            setSelectedAgency("");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Nouvelle Affectation</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="block text-sm font-medium text-gray-700">Employé</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                        >
                            <option value="">Sélectionner un employé</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} - {emp.position}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label className="block text-sm font-medium text-gray-700">Lieu d'affectation (Agence)</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={selectedAgency}
                            onChange={(e) => setSelectedAgency(e.target.value)}
                        >
                            <option value="">Sélectionner une agence</option>
                            {agencies.map((agency) => (
                                <option key={agency.id} value={agency.id}>
                                    {agency.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedEmployee || !selectedAgency}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Affecter
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900">Affectations Actuelles</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                        <li key={employee.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                                            <User className="h-full w-full text-gray-300" />
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-blue-600">
                                            {employee.firstName} {employee.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <Briefcase className="h-3 w-3" /> {employee.position}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {employee.agency ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <Building className="mr-1.5 h-3 w-3" />
                                            {employee.agency.name}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            <MapPin className="mr-1.5 h-3 w-3" />
                                            Non affecté
                                        </span>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
