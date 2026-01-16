import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { requireUserId } from "~/utils/auth.server";
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead } from "~/services/notification.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    const [notifications, unreadCount] = await Promise.all([
        getUserNotifications(userId),
        getUnreadNotificationCount(userId)
    ]);

    return { notifications, unreadCount };
}

export async function action({ request }: ActionFunctionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "mark-read") {
        const id = formData.get("id") as string;
        if (id) {
            await markNotificationAsRead(id);
            return { success: true };
        }
    }

    return { error: "Invalid intent" };
}
