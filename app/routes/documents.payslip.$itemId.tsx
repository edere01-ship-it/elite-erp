import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { prisma } from "~/db.server";
import { Printer } from "lucide-react";


export async function loader({ params }: LoaderFunctionArgs) {
    const { itemId } = params;

    const item = await prisma.payrollItem.findUnique({
        where: { id: itemId },
        include: {
            employee: {
                include: { agency: true }
            },
            payrollRun: true
        }
    });

    if (!item) {
        throw new Response("Bulletin introuvable", { status: 404 });
    }

    return { item };
}

export default function Payslip() {
    const { item } = useLoaderData<typeof loader>();
    const { employee, payrollRun } = item;

    return (
        <div className="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
            <div className="mx-auto max-w-[210mm] bg-white p-12 shadow-md print:max-w-none print:shadow-none">

                {/* Header */}
                <div className="mb-8 flex justify-between items-start border-b pb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">ELITE IMMOBILIER</h1>
                        <p className="text-sm text-gray-500">Abidjan, Côte d'Ivoire</p>
                        <p className="text-sm text-gray-500">Tel: +225 00 00 00 00</p>
                        <p className="text-sm text-gray-500">Email: contact@elite-immobilier.ci</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold uppercase text-gray-800">Bulletin de Paie</h2>
                        <p className="not-italic text-gray-600 mt-2">
                            Période: <span className="font-semibold">{payrollRun.month.toString().padStart(2, '0')}/{payrollRun.year}</span>
                        </p>
                        <p className="text-sm text-gray-500">Date d'édition: {new Date().toLocaleDateString("fr-CI")}</p>
                    </div>
                </div>

                {/* Employee Info */}
                <div className="mb-8 grid grid-cols-2 gap-8">
                    <div className="rounded-lg border border-gray-200 p-4">
                        <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Employé</h3>
                        <p className="text-lg font-bold text-gray-900">{employee.firstName} {employee.lastName}</p>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                        <p className="text-sm text-gray-600">Département: {employee.department}</p>
                        {employee.agency && <p className="text-sm text-gray-600">Agence: {employee.agency.name}</p>}
                        <p className="text-sm text-gray-600 mt-2">Matricule: {employee.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                    {/* Add more legal info if needed */}
                </div>

                {/* Payroll Details */}
                <div className="mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-y border-gray-200">
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Désignation</th>
                                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">Base</th>
                                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">Taux</th>
                                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">Gains</th>
                                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-900">Retenues</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Salaire de Base */}
                            <tr>
                                <td className="py-3 px-4 text-sm text-gray-900">Salaire de Base</td>
                                <td className="py-3 px-4 text-right text-sm text-gray-600">-</td>
                                <td className="py-3 px-4 text-right text-sm text-gray-600">100%</td>
                                <td className="py-3 px-4 text-right text-sm text-gray-900">
                                    {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(item.baseSalary)}
                                </td>
                                <td className="py-3 px-4 text-right text-sm text-gray-900"></td>
                            </tr>

                            {/* Primes */}
                            {item.bonus > 0 && (
                                <tr>
                                    <td className="py-3 px-4 text-sm text-gray-900">Primes & Indemnités</td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-600">-</td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-600">-</td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                                        {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(item.bonus)}
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-900"></td>
                                </tr>
                            )}

                            {/* Déductions */}
                            {item.deduction > 0 && (
                                <tr>
                                    <td className="py-3 px-4 text-sm text-gray-900">Retenues diverses / Avances</td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-600">-</td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-600">-</td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-900"></td>
                                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                                        {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(item.deduction)}
                                    </td>
                                </tr>
                            )}

                            {/* Totals */}
                            <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                                <td className="py-4 px-4 text-right text-gray-900" colSpan={3}>NET À PAYER</td>
                                <td className="py-4 px-4 text-right text-lg text-blue-600" colSpan={2}>
                                    {new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(item.netSalary)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-xs text-gray-400 print:absolute print:bottom-8 print:left-0 print:w-full">
                    <p>Ce bulletin de paie est généré électroniquement et ne nécessite pas de signature manuelle.</p>
                    <p>ELITE IMMOBILIER - SARL au capital de ... - RC Abidjan ...</p>
                </div>
            </div>

            {/* Print Button - Hidden on Print */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                    <Printer className="h-5 w-5" />
                    Imprimer / Télécharger PDF
                </button>
            </div>
        </div>
    );
}
