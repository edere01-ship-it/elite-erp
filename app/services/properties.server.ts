import { prisma } from "~/db.server";
import type { Property, Prisma } from "@prisma/client";

export async function getProperties() {
    return prisma.property.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            visits: true,
            contracts: {
                where: { status: "active" }
            }
        }
    });
}

export async function createProperty(data: Prisma.PropertyCreateInput) {
    return prisma.property.create({
        data,
    });
}

export async function updateProperty(id: string, data: Prisma.PropertyUpdateInput) {
    return prisma.property.update({
        where: { id },
        data,
    });
}

export async function deleteProperty(id: string) {
    return prisma.property.delete({
        where: { id },
    });
}
