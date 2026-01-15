import { useState } from "react";
import { Printer, FileSpreadsheet, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatCurrency } from "~/lib/utils";

interface PayslipManagerProps {
    payrollRun: any;
    employees: any[];
    agencyName?: string;
}

export function PayslipManager({ payrollRun, employees, agencyName = "Elite Immobilier" }: PayslipManagerProps) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");

    const generatePDF = async (mode: "all" | "individual") => {
        if (!payrollRun || !payrollRun.items || payrollRun.items.length === 0) {
            alert("Aucune donnée de paie disponible pour cette période.");
            return;
        }

        const itemsToPrint = mode === "individual"
            ? payrollRun.items.filter((i: any) => i.employeeId === selectedEmployeeId)
            : payrollRun.items;

        if (itemsToPrint.length === 0) {
            alert("Aucun bulletin trouvé pour la sélection.");
            return;
        }

        const doc = new jsPDF();
        const printDate = new Date().toLocaleDateString("fr-FR");

        // Load Logo
        let logoData: string | null = null;
        try {
            const response = await fetch("/logo.png");
            const blob = await response.blob();
            logoData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Failed to load logo", e);
        }

        itemsToPrint.forEach((item: any, index: number) => {
            if (index > 0) doc.addPage();

            const emp = item.employee;

            // Header
            if (logoData) {
                doc.addImage(logoData, "PNG", 15, 10, 25, 25);
            }

            doc.setFontSize(18);
            doc.setTextColor(41, 128, 185); // Blue
            doc.text(agencyName.toUpperCase(), 105, 20, { align: "center" });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Gestion Immobilière & Services", 105, 26, { align: "center" });

            // Title
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text(`BULLETIN DE PAIE - ${payrollRun.month}/${payrollRun.year}`, 105, 40, { align: "center" });

            // Employee Info Box
            doc.setDrawColor(200);
            doc.setFillColor(250);
            doc.rect(14, 50, 182, 35, "FD");

            doc.setFontSize(10);
            doc.text("Employé:", 20, 60);
            doc.setFont("helvetica", "bold");
            doc.text(`${String(emp.firstName)} ${String(emp.lastName)}`, 50, 60);

            doc.setFont("helvetica", "normal");
            doc.text("Matricule:", 20, 68);
            doc.text(String(emp.matricule || "N/A"), 50, 68);

            doc.text("Poste:", 20, 76);
            doc.text(String(emp.post || emp.position), 50, 76);

            doc.text("Département:", 110, 60);
            doc.text(String(emp.department), 140, 60);

            doc.text("Date Embauche:", 110, 68);
            doc.text(new Date(emp.startDate).toLocaleDateString("fr-FR"), 140, 68);

            doc.text("Période:", 110, 76);
            doc.text(`${payrollRun.month}/${payrollRun.year}`, 140, 76);

            // Payroll Details Table
            const rows: any[] = [
                ["Salaire de Base", "", formatCurrency(item.baseSalary)],
                ["Primes & Bonus", "", formatCurrency(item.bonus)],
                ["Avance sur Salaire", "", `(${formatCurrency(item.salaryAdvance)})`],
                ["Retenues Retard/Absence", "", `(${formatCurrency(item.latenessDeduction)})`],
                ["ITS (Impôt)", "", `(${formatCurrency(item.its)})`],
                ["CNPS (Social)", "", `(${formatCurrency(item.cnps)})`],
                ["Autres Déductions", "", `(${formatCurrency(item.deduction)})`],
                [{ content: "NET A PAYER", styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }, "", { content: formatCurrency(item.netSalary), styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }]
            ];

            autoTable(doc, {
                startY: 95,
                head: [["Désignation", "Taux/Base", "Montant"]],
                body: rows,
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185] },
                columnStyles: {
                    2: { halign: "right" }
                }
            });

            // Footer & Signature
            const finalY = (doc as any).lastAutoTable.finalY + 20;

            doc.setFontSize(10);
            doc.text(`Fait à Abidjan, le ${printDate}`, 14, finalY);

            doc.text("L'Employé", 40, finalY + 10);
            doc.text("Signature RH / Direction", 140, finalY + 10);

            doc.setLineWidth(0.5);
            doc.line(130, finalY + 30, 190, finalY + 30); // Signature line
        });

        doc.save(`bulletins_paie_${payrollRun.month}_${payrollRun.year}.pdf`);
    };

    const generateExcel = () => {
        if (!payrollRun || !payrollRun.items || payrollRun.items.length === 0) {
            alert("Aucune donnée disponible.");
            return;
        }

        const data = payrollRun.items.map((item: any) => ({
            "Matricule": item.employee.matricule,
            "Nom": item.employee.lastName,
            "Prénoms": item.employee.firstName,
            "Poste": item.employee.position,
            "Salaire Base": item.baseSalary,
            "Primes": item.bonus,
            "Avances": item.salaryAdvance,
            "Déductions/Retards": item.latenessDeduction,
            "ITS": item.its,
            "CNPS": item.cnps,
            "Net à Payer": item.netSalary,
            "Date Paie": new Date(payrollRun.createdAt).toLocaleDateString("fr-FR")
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Salaires");
        XLSX.writeFile(wb, `export_paie_${payrollRun.month}_${payrollRun.year}.xlsx`);
    };

    if (!payrollRun) {
        return (
            <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-gray-500">Veuillez sélectionner une fiche de paie existante pour imprimer.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-600" />
                Centre d'Impression & Export
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PDF Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Impressions PDF</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mode d'impression</label>
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="all">Tous les employés</option>
                                {payrollRun.items.map((item: any) => (
                                    <option key={item.employeeId} value={item.employeeId}>
                                        {item.employee.firstName} {item.employee.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => generatePDF(selectedEmployeeId === "all" ? "all" : "individual")}
                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {selectedEmployeeId === "all" ? "Imprimer Tous les Bulletins" : "Imprimer Bulletin Individuel"}
                        </button>
                    </div>
                </div>

                {/* Excel Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Export Excel</h3>
                    <div className="bg-green-50 p-4 rounded-lg space-y-4">
                        <p className="text-sm text-green-800">
                            Exporte toutes les données salariales de cette période dans un fichier Excel (.xlsx) pour archivage ou analyse comptable.
                        </p>
                        <button
                            onClick={generateExcel}
                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Exporter vers Excel
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Aperçu rapide</h4>
                <div className="bg-gray-50 rounded text-xs text-gray-500 p-2 font-mono">
                    <p>Période: {payrollRun.month}/{payrollRun.year}</p>
                    <p>Total Employés: {payrollRun.items.length}</p>
                    <p>Masse Salariale: {formatCurrency(payrollRun.totalAmount)}</p>
                </div>
            </div>
        </div>
    );
}
