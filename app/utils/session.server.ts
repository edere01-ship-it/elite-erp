import { redirect } from "react-router";
import { getSession } from "~/sessions.server";
import { prisma } from "~/db.server";
import { PERMISSIONS } from "~/utils/permissions";

export async function requirePermission(request: Request, permission: string) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            role: true,
            permissions: true,
            employee: {
                select: {
                    photo: true
                }
            }
        }
    });

    if (!user) {
        throw redirect("/login");
    }

    if (user.role === 'admin' || user.permissions.includes(PERMISSIONS.ADMIN)) {
        return user;
    }

    if (!user.permissions.includes(permission)) {
        throw new Response("Forbidden", { status: 403 });
    }

    return user;
}
export async function requireUserId(request: Request) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    if (!userId) {
        throw redirect("/login");
    }
    return userId;
}
