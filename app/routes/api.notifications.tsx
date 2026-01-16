import { type LoaderFunctionArgs, type ActionFunctionArgs, json } from "react-router";
import { requireUserId } from "~/utils/session.server";
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead } from "~/services/notification.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    const [notifications, unreadCount] = await Promise.all([
        getUserNotifications(userId),
        getUnreadNotificationCount(userId)
    ]);

    return json({ notifications, unreadCount });
}

export async function action({ request }: ActionFunctionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "mark-read") {
        const id = formData.get("id") as string;
        if (id) {
            await markNotificationAsRead(id);
            return json({ success: true });
        }
    }

    return json({ error: "Invalid intent" });
}
