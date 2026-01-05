import type { ActionFunctionArgs } from "react-router";
import { createTicket } from "~/services/it.server";
import { getSession } from "~/sessions.server";

export async function action({ request }: ActionFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        return { error: "Unauthorized" };
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create-ticket") {
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const priority = formData.get("priority") as string;
        const category = formData.get("category") as string || "other";

        if (!title || !description) {
            return { error: "Missing required fields" };
        }

        try {
            await createTicket({
                title,
                description,
                priority,
                category,
                status: "open",
                requesterId: userId
            });
            return { success: true };
        } catch (error) {
            console.error("Ticket creation error:", error);
            return { error: "Failed to create ticket" };
        }
    }

    return { error: "Invalid intent" };
}
