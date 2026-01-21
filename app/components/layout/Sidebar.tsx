import {
    LayoutDashboard,
    Building2,
    Users,
    Briefcase,
    Home,
    Calendar,
    HardHat,
    Calculator,
    Scale,
    FileText,
    MonitorCog,
    LogOut,
    TrendingUp
} from "lucide-react";
import { NavLink, Form } from "react-router";
import { cn } from "~/lib/utils";

// Define module permissions mapping
// ... (same as before)
const navigation = [
    { name: "Tableau de bord", href: "/", icon: LayoutDashboard, permission: "*" },
    { name: "Direction Générale", href: "/direction", icon: TrendingUp, permission: "direction.view" },
    { name: "Direction Agence", href: "/agency", icon: Building2, permission: "agency.view" },
    { name: "Ressources humaines", href: "/hr", icon: Users, permission: "hr.view" },
    { name: "Direction commerciale", href: "/commercial", icon: Briefcase, permission: "commercial.view" },
    { name: "Gestion des biens", href: "/agency/properties", icon: Home, permission: "agency.view" }, // Updated to new route
    { name: "Projets Immobiliers", href: "/construction", icon: HardHat, permission: "construction.view" }, // New Link
    { name: "Visites & Rendez-vous", href: "/visits", icon: Calendar, permission: "visits.view" },
    { name: "Comptabilité & Finances", href: "/finance", icon: Calculator, permission: "finance.view" },
    { name: "Juridique", href: "/legal", icon: Scale, permission: "legal.view" },
    { name: "Documents & Archives", href: "/documents", icon: FileText, permission: "documents.view" },
    { name: "Gestion informatique", href: "/it", icon: MonitorCog, permission: "it.manage" }, // IT usually restricted to manage
];

interface SidebarProps {
    user: {
        role: string;
        permissions: string[];
    };
}

export function Sidebar({ user }: SidebarProps) {

    const hasAccess = (requiredPermission: string) => {
        if (user.role === "admin" || user.permissions.includes("admin.access")) return true;
        if (requiredPermission === "*") return true;
        // Check if user has the specific permission
        return user.permissions.includes(requiredPermission);
    };

    return (
        <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200 shadow-sm relative z-20">
            {/* Logo Area with Gradient/Glass Effect */}
            <div className="flex h-16 items-center px-6 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-emerald-500">
                <div className="flex items-center gap-2 font-bold text-xl text-white">
                    <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Home className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-lg tracking-tight font-sans">Elite ERP</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const accessible = hasAccess(item.permission);

                        if (!accessible) return null;

                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    cn(
                                        "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out",
                                        isActive
                                            ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100 translate-x-1"
                                            : "text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:translate-x-1"
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            className={cn(
                                                "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                                isActive ? "text-emerald-500" : "text-slate-400 group-hover:text-orange-500"
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                        {isActive && (
                                            <span className="ml-auto block h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                {/* User Mini Profile */}
                <div className="mb-4 flex items-center gap-3 px-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {user.role.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-700 truncate">{user.role}</p>
                        <p className="text-xs text-slate-500 truncate">En ligne</p>
                    </div>
                </div>

                <Form action="/logout" method="post">
                    <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group">
                        <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        Déconnexion
                    </button>
                </Form>
            </div>
        </div>
    );
}
