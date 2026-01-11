import type { LoaderFunctionArgs } from "react-router";
import { getSession } from "~/sessions.server";
import { eventStream } from "~/utils/sse.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial ping to establish connection
            controller.enqueue(encoder.encode(": hello\n\n"));

            const handleMessage = (data: any) => {
                // Only send if the message is relevant to this user
                // data should contain { receiverId, senderId, ... }
                if (data.receiverId === userId || data.senderId === userId) {
                    controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(data)}\n\n`));
                }
            };

            const handleNotification = (data: any) => {
                // For future notifications
                if (data.userId === userId) {
                    controller.enqueue(encoder.encode(`event: notification\ndata: ${JSON.stringify(data)}\n\n`));
                }
            };

            eventStream.on("message", handleMessage);
            eventStream.on("notification", handleNotification);

            // Cleanup
            request.signal.addEventListener("abort", () => {
                eventStream.off("message", handleMessage);
                eventStream.off("notification", handleNotification);
                // check if controller is closed?
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
