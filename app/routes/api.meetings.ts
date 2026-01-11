
import type { Route } from "./+types/api.meetings";
import { getSession } from "~/sessions.server";
import { prisma } from "~/db.server";

export async function action({ request }: Route.ActionArgs) {
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

        // Generate Jitsi Link
        const roomName = `Elite-Meet-${Math.random().toString(36).substring(7)}`;
        const link = `https://meet.jit.si/${roomName}`;

        await prisma.meeting.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                link,
                organizerId: userId,
                // Add current user as participant by default?
                participants: { connect: { id: userId } }
            }
        });

        return Response.json({ success: true, link });
    }

    return Response.json({ error: "Action inconnue" }, { status: 400 });
}
