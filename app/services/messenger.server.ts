import { prisma } from "~/db.server";

export type MessageWithSender = {
    id: string;
    content: string;
    read: boolean;
    createdAt: Date;
    sender: {
        id: string;
        username: string;
    };
    receiver: {
        id: string;
        username: string;
    };
    attachmentUrl?: string | null;
};

export async function sendMessage(senderId: string, receiverUsername: string, content: string, attachmentUrl?: string) {
    const receiver = await prisma.user.findUnique({
        where: { username: receiverUsername }
    });

    if (!receiver) {
        throw new Error("Utilisateur introuvable");
    }

    return prisma.message.create({
        data: {
            senderId,
            receiverId: receiver.id,
            content,
            attachmentUrl
        }
    });
}

export async function getMessages(userId: string) {
    // Fetch received messages
    const received = await prisma.message.findMany({
        where: { receiverId: userId },
        include: {
            sender: { select: { id: true, username: true } },
            receiver: { select: { id: true, username: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Fetch sent messages
    const sent = await prisma.message.findMany({
        where: { senderId: userId },
        include: {
            sender: { select: { id: true, username: true } },
            receiver: { select: { id: true, username: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { received, sent };
}

export async function markAsRead(messageId: string, userId: string) {
    // Verify ownership/recipient before marking
    const message = await prisma.message.findUnique({
        where: { id: messageId }
    });

    if (!message || message.receiverId !== userId) {
        throw new Error("Message introuvable ou non autorisé");
    }

    return prisma.message.update({
        where: { id: messageId },
        data: { read: true }
    });
}

export async function getUnreadCount(userId: string) {
    return prisma.message.count({
        where: {
            receiverId: userId,
            read: false
        }
    });
}

export async function getRecipients(currentUserId: string) {
    return prisma.user.findMany({
        where: {
            NOT: {
                id: currentUserId
            }
        },
        select: {
            id: true,
            username: true,
            role: true
        },
        orderBy: {
            username: 'asc'
        }
    });
}
