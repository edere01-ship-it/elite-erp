import { type LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { PrismaClient } from "@prisma/client";
import { FileText, Download } from "lucide-react";
import { getSession } from "~/sessions.server";
import { prisma } from "~/db.server";
export function meta() {
    return [
        { title: "Mes Documents - Espace Employé" },
        { name: "description", content: "Consultez et téléchargez vos bulletins de salaire" },
    ];
}

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw new Response("Non autorisé", { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
        where: { userId },
    });

    if (!employee) {
        return { items: [] }; // Not an employee or not linked
    }

    // Fetch confirmed payslips
    const items = await prisma.payrollItem.findMany({
        where: {
            employeeId: employee.id,
            payrollRun: {
                status: { in: ['paid', 'direction_approved'] } // Show when approved by direction or paid
            }
        },
        include: {
            payrollRun: true
        },
        orderBy: {
            payrollRun: {
                year: 'desc'
            }
        }
    });

    // Client-side mapping is often safer for complex sorts if not massive data, but here prisma orderBy is fine for simple fields. 
    // Need to sort by month too.
    const sortedItems = items.sort((a, b) => {
        if (b.payrollRun.year !== a.payrollRun.year) return b.payrollRun.year - a.payrollRun.year;
        return b.payrollRun.month - a.payrollRun.month;
    });

    const formattedItems = sortedItems.map(item => ({
        id: item.id,
        period: `${item.payrollRun.month.toString().padStart(2, '0')}/${item.payrollRun.year}`,
        netSalary: item.netSalary,
        date: item.payrollRun.createdAt.toISOString(),
        status: item.payrollRun.status
    }));

    return { items: formattedItems, employeeName: `${employee.firstName} ${employee.lastName}` };
}

export default function EmployeeDocuments() {
    const { items, employeeName } = useLoaderData<typeof loader>();

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Mes Documents</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Bienvenue, {employeeName}. Retrouvez ici vos bulletins de salaire et documents administratifs.
                </p>
            </div>

            <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {items.length === 0 ? (
                        <li className="px-4 py-12 text-center sm:px-6">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document disponible</h3>
                            <p className="mt-1 text-sm text-gray-500">Vos bulletins de salaire apparaîtront ici une fois validés.</p>
                        </li>
                    ) : (
                        items.map((item) => (
                            <li key={item.id} className="block hover:bg-gray-50 transition">
                                <Link to={`/documents/payslip/${item.id}`} target="_blank" className="flex items-center px-4 py-4 sm:px-6">
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="truncate">
                                            <div className="flex text-sm">
                                                <p className="truncate font-medium text-blue-600">Bulletin de Paie - {item.period}</p>
                                                <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                                                    - {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(item.netSalary)}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <FileText className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                                    <p>
                                                        Généré le {new Date(item.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex-shrink-0 sm:ml-5 sm:mt-0">
                                            <div className="flex overflow-hidden -space-x-1">
                                                <button className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                                    <Download className="mr-2 h-4 w-4 text-gray-400" />
                                                    Télécharger
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0">
                                        {/* Chevron or icon */}
                                    </div>
                                </Link>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
