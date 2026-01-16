import { redirect } from "react-router";
import { getSession } from "~/sessions.server";

export async function requireUserId(request: Request): Promise<string> {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw redirect("/login");
    }

    return userId;
}
