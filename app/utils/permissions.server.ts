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

    // Priority 1: Direction / Admin
    if (user.role === 'admin' || has("admin.access")) {
        return "/";
    }
    if (has("direction.view")) {
        return "/direction";
    }
    // Priority 2: Agency Director
    if (has("agency.view") || has("agency.manage")) {
        return "/agency";
    }
    // Priority 3: Dept Heads
    if (has("hr.view")) {
        return "/hr";
    }
    if (has("finance.view")) {
        return "/finance";
    }
    if (has("it.manage")) {
        return "/it";
    }
    // Priority 4: Specialists
    if (has("commercial.view") || has("visits.view")) {
        return "/commercial";
    }
    if (has("properties.view")) {
        return "/properties";
    }

    // Default fallback (maybe a generic 'no access' or profile page)
    return "/logout";
}
