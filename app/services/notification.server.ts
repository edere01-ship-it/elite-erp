import { prisma } from "~/db.server";

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export async function sendNotification(
    userId: string | string[],
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string
) {
    const ids = Array.isArray(userId) ? userId : [userId];

    if (ids.length === 0) return;

    await prisma.notification.createMany({
        data: ids.map(id => ({
            userId: id,
            title,
            message,
            type,
            link
        }))
    });
}

export async function getUserNotifications(userId: string) {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
}

export async function markNotificationAsRead(notificationId: string) {
    return prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
    });
}

export async function broadcastNotification(
    role: string,
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string
) {
    const users = await prisma.user.findMany({
        where: { role } // Or specific permissions check if needed
    });

    if (users.length > 0) {
        await sendNotification(users.map(u => u.id), title, message, type, link);
    }
}

export async function broadcastNotificationByPermission(
    permission: string,
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string
) {
    const users = await prisma.user.findMany({
        where: { permissions: { has: permission } }
    });

    if (users.length > 0) {
        await sendNotification(users.map(u => u.id), title, message, type, link);
    }
}

export async function notifyAgencyManagers(
    agencyId: string,
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string
) {
    const managers = await prisma.user.findMany({
        where: {
            employee: { agencyId: agencyId },
            permissions: { has: 'agency.manage' } // PERMISSIONS.AGENCY_MANAGE
        }
    });

    if (managers.length > 0) {
        await sendNotification(managers.map(u => u.id), title, message, type, link);
    }
}

export async function notifyDirection(
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string
) {
    await broadcastNotificationByPermission('direction.validate', title, message, type, link);
}

export async function notifyFinance(
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string
) {
    await broadcastNotificationByPermission('finance.view', title, message, type, link);
}

export async function getUnreadNotificationCount(userId: string) {
    return prisma.notification.count({
        where: { userId, read: false }
    });
}
