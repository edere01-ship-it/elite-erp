import { redirect } from "react-router";
import { prisma } from "~/db.server";
import { PERMISSIONS } from "./permissions";

export async function requirePermission(userId: string, permission: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { permissions: true, role: true }
    });

    if (!user) {
        throw redirect("/login");
    }

    if (user.role === 'admin' || user.permissions.includes(PERMISSIONS.ADMIN)) {
        return true; // Admin has all access
    }

    if (!user.permissions.includes(permission)) {
        throw new Response("Accès refusé: Vous n'avez pas la permission nécessaire.", { status: 403 });
    }

    return true;
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { permissions: true, role: true }
    });

    if (!user) return false;
    if (user.role === 'admin' || user.permissions.includes(PERMISSIONS.ADMIN)) return true;
    return user.permissions.includes(permission);
}

export function getRedirectPath(user: { role: string; permissions: string[] }) {
    const p = user.permissions;
    const has = (perm: string) => p.includes(perm);

    // Simplified Logic: If user has ANY permission, send to Dashboard (Launcher or Stats)
    // This allows multi-module users to choose where to go.
    if (p.length > 0 || user.role !== 'user') {
        return "/";
    }

    // Default fallback (maybe a generic 'no access' or profile page)
    return "/logout";
}
