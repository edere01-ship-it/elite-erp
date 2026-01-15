import { Outlet, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/_protected";
import { getSession, destroySession } from "~/sessions.server";
import { prisma } from "~/db.server";
import DashboardLayout from "~/components/layout/DashboardLayout";

export async function loader({ request }: Route.LoaderArgs) {
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
            email: true,
            role: true,
            permissions: true,
            employee: { select: { photo: true, matricule: true } }
        }
    });

    if (!user) {
        throw redirect("/login", {
            headers: {
                "Set-Cookie": await destroySession(session),
            },
        });
    }

    return { user };
}

export default function ProtectedLayout() {
    const { user } = useLoaderData<typeof loader>();

    return (
        <DashboardLayout user={user}>
            <Outlet />
        </DashboardLayout>
    );
}
