import type { Route } from "./+types/api.messages";
import { getSession } from "~/sessions.server";
import { sendMessage, getMessages, markAsRead, getUnreadCount, getRecipients } from "~/services/messenger.server";
import { emitEvent } from "~/utils/sse.server";
import { prisma } from "~/db.server";

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        return Response.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    try {
        if (intent === "send") {
            const receiverUsername = formData.get("to") as string;
            const content = formData.get("content") as string;
            const attachment = formData.get("attachment") as File | null;
            const ccRaw = formData.get("cc") as string;
            let ccList: string[] = [];

            try {
                if (ccRaw) ccList = JSON.parse(ccRaw);
            } catch (e) {
                console.error("Failed to parse CC list", e);
            }

            if (!receiverUsername || !content) {
                return Response.json({ error: "Destinataire et message requis." }, { status: 400 });
            }

            let attachmentUrl: string | undefined = undefined;
            if (attachment && attachment.size > 0 && attachment.name) {
                const { uploadFile } = await import("~/utils/upload.server");
                attachmentUrl = await uploadFile(attachment);
            }

            // Send to main recipient
            const sentMsg = await sendMessage(userId, receiverUsername, content, attachmentUrl);

            // Emit Real-time Event
            // We need to fetch the full sender object or at least enough for the UI
            // The sendMessage service might need to return the full object.
            // For now, let's assume we can construct enough data or fetch it.
            // Actually, best is to let the client re-fetch or push the payload.
            // Let's simply trigger a "reload" hint or push the data we have.

            // Pushing data is better for performance (no extra fetch).
            // We need sender username for the UI check.
            emitEvent("message", {
                ...sentMsg,
                type: 'new',
                receiverUsername // Helper to filter on client side if needed, though SSE filters by ID
            });

            // Send to CCs (Copie cachée pour simplifier le MVP, ou explicite si on concatène)
            // Note: Idealement on ajouterait un flag "isCC" en base, mais ici on duplique simplement le message.
            if (ccList.length > 0) {
                const ccContent = `[Copie via ${receiverUsername}]\n${content}`;
                await Promise.all(ccList.map(ccUsername =>
                    sendMessage(userId, ccUsername, ccContent, attachmentUrl)
                ));
            }
        }

        if (intent === "mark-read") {
            const messageId = formData.get("messageId") as string;
            await markAsRead(messageId, userId);
        }

        // Return updated data for all actions to keep UI in sync
        const unreadCount = await getUnreadCount(userId);
        const { received, sent } = await getMessages(userId);
        const recipients = await getRecipients(userId);

        return Response.json({
            success: true,
            unreadCount,
            messages: { received, sent },
            recipients
        });

    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: "Action inconnue" }, { status: 400 });
}

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        return Response.json({ error: "Non autorisé" }, { status: 401 });
    }

    const unreadCount = await getUnreadCount(userId);
    const { received, sent } = await getMessages(userId);
    const recipients = await getRecipients(userId);

    const meetings = await prisma.meeting.findMany({
        where: {
            OR: [
                { organizerId: userId },
                { participants: { some: { id: userId } } }
            ],
            startTime: { gte: new Date() } // Only upcoming
        },
        orderBy: { startTime: 'asc' },
        include: { organizer: { select: { username: true } } }
    });

    return Response.json({
        unreadCount,
        messages: { received, sent },
        recipients,
        meetings
    });
}
