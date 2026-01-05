import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { useLoaderData, Link, Form, useNavigation } from "react-router";
import { requirePermission } from "~/utils/session.server";
import { PERMISSIONS } from "~/utils/permissions";
import { prisma } from "~/db.server";
import { Users, Plus, Mail, Phone, Briefcase, UserPlus } from "lucide-react";
import { useState } from "react";
// We can potentially reuse components or build a simple scoped form here.
// For now, let's list them and allow simple creation via a distinct form or modal if needed.
// Given the requirements, let's implement a listing first.

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requirePermission(request, PERMISSIONS.AGENCY_MANAGE);

    const manager = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { agencyId: true }
    });

    if (!manager?.agencyId) throw new Response("Unauthorized", { status: 403 });

    const employees = await prisma.employee.findMany({
        where: {
            agencyId: manager.agencyId
        },
        orderBy: { lastName: 'asc' },
        include: { user: true }
    });

    return { employees, agencyId: manager.agencyId };
}

export async function action({ request }: ActionFunctionArgs) {
    // Implement creation/edit logic here later or redirect to a shared form with query param
    return null;
}

export default function AgencyEmployees() {
    const { employees, agencyId } = useLoaderData<typeof loader>();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Personnel de l'Agence
                </h2>
                {/* 
                     Ideally we would link to a create page. 
                     For MVP, we can link to the global HR create page BUT pass a param 
                     or we create a specific route for agency employee creation.
                     Let's verify strict scoping first.
                  */}
                <button
                    disabled
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                    title="Fonctionnalité d'ajout à venir"
                >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Ajouter un employé
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                        <li key={employee.id}>
                            <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {employee.firstName[0]}{employee.lastName[0]}
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {employee.firstName} {employee.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" />
                                            {employee.position}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end text-sm text-gray-500 space-y-1">
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {employee.email}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {employee.phone}
                                    </div>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {employee.status}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                    {employees.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            Aucun employé trouvé dans cette agence.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
