import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { destroySession, getSession } from "~/sessions.server";
import { prisma } from "~/db.server";

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { lastLogout: new Date() } as any
        });

        await prisma.auditLog.create({
            data: {
                action: "logout",
                details: "Déconnexion utilisateur",
                userId: userId,
                module: "auth"
            }
        });
    }

    return redirect("/login", {
        headers: {
            "Set-Cookie": await destroySession(session),
        },
    });
}

export async function loader({ request }: Route.LoaderArgs) {
    // If someone navigates to /logout directly, log them out
    const session = await getSession(request.headers.get("Cookie"));
    return redirect("/login", {
        headers: {
            "Set-Cookie": await destroySession(session),
        },
    });
}
