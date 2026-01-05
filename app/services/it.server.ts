import { prisma } from "~/db.server";
import bcrypt from "bcryptjs";

// --- ASSETS ---

export async function getAssets() {
    return prisma.asset.findMany({
        orderBy: { purchaseDate: 'desc' },
        include: {
            assignedTo: {
                select: { username: true, email: true }
            }
        }
    });
}

export async function createAsset(data: {
    name: string;
    type: string;
    serialNumber: string;
    status: string;
    purchaseDate: Date;
    assignedToId?: string | null;
}) {
    return prisma.asset.create({ data });
}

export async function updateAsset(id: string, data: Partial<{
    name: string;
    type: string;
    serialNumber: string;
    status: string;
    purchaseDate: Date;
    assignedToId?: string | null;
}>) {
    return prisma.asset.update({ where: { id }, data });
}

export async function deleteAsset(id: string) {
    return prisma.asset.delete({ where: { id } });
}

// --- TICKETS ---

export async function getTickets() {
    return prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            requester: {
                select: { username: true, email: true }
            }
        }
    });
}

export async function createTicket(data: {
    title: string;
    description: string;
    priority: string;
    category: string;
    status: string;
    requesterId: string;
}) {
    return prisma.ticket.create({ data });
}

export async function updateTicket(id: string, data: Partial<{
    status: string;
    priority: string;
    // Add other fields as needed
}>) {
    return prisma.ticket.update({ where: { id }, data });
}

// --- USERS (IT VIEW) ---

export async function getUsersIT() {
    return prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            permissions: true,
            status: true,
            lastLogin: true,
            lastLogout: true,
            lastActivity: true
        } as any,
        orderBy: { username: 'asc' }
    });
}

export async function createUser(data: {
    username: string;
    email: string;
    passwordRaw: string;
    role: string;
    permissions: string[];
}) {
    const passwordHash = await bcrypt.hash(data.passwordRaw, 10);
    return prisma.user.create({
        data: {
            username: data.username,
            email: data.email,
            password: passwordHash,
            role: data.role,
            permissions: data.permissions,
            status: "active"
        }
    });
}

export async function updateUserPermissions(id: string, permissions: string[]) {
    return prisma.user.update({
        where: { id },
        data: { permissions }
    });
}

export async function updateUserRole(id: string, role: string) {
    return prisma.user.update({
        where: { id },
        data: { role }
    });
}

export async function updateUser(id: string, data: Partial<{
    username: string;
    email: string;
    role: string;
    permissions: string[];
    status: string;
}>) {
    return prisma.user.update({
        where: { id },
        data
    });
}

export async function deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
}

export async function updateUserActivity(userId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { lastActivity: new Date() } as any
    });
}

// --- AUDIT LOGS ---

export async function getAuditLogs() {
    return prisma.auditLog.findMany({
        take: 50,
        orderBy: { timestamp: 'desc' },
        include: {
            user: {
                select: { username: true }
            }
        }
    });
}

export async function createAuditLog(data: {
    action: string;
    details: string;
    module: string;
    userId: string;
}) {
    return prisma.auditLog.create({ data });
}

export async function logModuleAccess(userId: string, moduleName: string) {
    await updateUserActivity(userId);
    // Optional: Log every access or just significant ones? 
    // Logging every page load might be too much, but for now we log "Open".
    // To avoid spam, we could check if the last log was the same.
    const lastLog = await prisma.auditLog.findFirst({
        where: { userId, module: moduleName, action: 'open_module' },
        orderBy: { timestamp: 'desc' }
    });

    // Only log if last access was > 5 mins ago
    if (!lastLog || (new Date().getTime() - lastLog.timestamp.getTime() > 5 * 60 * 1000)) {
        await createAuditLog({
            action: 'open_module',
            details: `Accessed ${moduleName}`,
            module: moduleName,
            userId
        });
    }
}
