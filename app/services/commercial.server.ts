import { prisma } from "~/db.server";
import type { Client, Visit, Prisma } from "@prisma/client";

export async function getClients() {
    return prisma.client.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function getVisits() {
    return prisma.visit.findMany({
        include: {
            client: true,
            property: true,
            agent: true,
        },
        orderBy: { date: "desc" },
    });
}

export async function createClient(data: Prisma.ClientCreateInput) {
    return prisma.client.create({
        data,
    });
}

export async function createVisit(data: {
    clientId: string;
    propertyId: string;
    agentId: string;
    date: Date;
    status: string;
    notes?: string;
}) {
    return prisma.visit.create({
        data: {
            date: data.date,
            status: data.status,
            notes: data.notes,
            client: {
                connect: { id: data.clientId }
            },
            property: {
                connect: { id: data.propertyId }
            },
            agent: {
                connect: { id: data.agentId }
            }
        },
    });
}
