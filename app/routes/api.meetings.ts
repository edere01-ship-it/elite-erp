import type { ActionFunctionArgs } from "react-router";
import { getSession } from "~/sessions.server";
import { prisma } from "~/db.server";
import { randomUUID } from "node:crypto";

export async function action({ request }: ActionFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        return Response.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create_meeting") {
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const startTime = formData.get("startTime") as string;
        const endTime = formData.get("endTime") as string;
        const participantsJson = formData.get("participants") as string;
        const participantIds = participantsJson ? JSON.parse(participantsJson) : [];

        // Generate Jitsi Link
        const roomName = `Elite-Meet-${Math.random().toString(36).substring(7)}`;
        const link = `https://meet.jit.si/${roomName}`;

        // Create Meeting
        const meeting = await prisma.meeting.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                link,
                organizerId: userId,
                participants: {
                    connect: [
                        { id: userId }, // Organizer
                        ...participantIds.map((id: string) => ({ id })) // Recipients
                    ]
                }
            }
        });

        // Send Notification Messages
        if (participantIds.length > 0) {
            const organizer = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });

            for (const pId of participantIds) {
                // Don't message self
                if (pId === userId) continue;

                await prisma.message.create({
                    data: {
                        senderId: userId,
                        receiverId: pId,
                        content: `📅 Invitation à la réunion: ${title}\nDebute: ${new Date(startTime).toLocaleString('fr-FR')}\nLien: ${link}`,
                        read: false
                    }
                });
            }
        }

        return Response.json({ success: true, link });
    }

    return Response.json({ error: "Action inconnue" }, { status: 400 });
}
