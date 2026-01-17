
import { prisma } from "~/db.server";

async function main() {
    console.log("Checking pending validations in HR...");

    const pendingRuns = await prisma.payrollRun.findMany({
        where: { status: { in: ['draft', 'hr_validated', 'finance_validated', 'agency_rejected'] } }
    });

    const pendingEmployees = await prisma.employee.findMany({
        where: { status: 'pending' }
    });

    console.log(`Found ${pendingRuns.length} pending payroll runs.`);
    console.log(`Found ${pendingEmployees.length} pending employees.`);

    if (pendingRuns.length > 0) {
        console.log("Deleting pending payroll runs...");
        for (const run of pendingRuns) {
            await prisma.payrollRun.delete({ where: { id: run.id } });
            console.log(`Deleted PayrollRun: ${run.month}/${run.year}`);
        }
    }

    if (pendingEmployees.length > 0) {
        console.log("Deleting pending employees...");
        for (const emp of pendingEmployees) {
            // Need to delete related data if any? Assuming cascade or simple delete for now.
            // Prisma schema might restrict if linked.
            await prisma.employee.delete({ where: { id: emp.id } });
            console.log(`Deleted Employee: ${emp.firstName} ${emp.lastName}`);
        }
    }

    console.log("Cleanup complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
