import { Sidebar } from "./Sidebar";
import { Search, User, ArrowLeft, LogOut, LifeBuoy } from "lucide-react";
import { useLocation, Link, Form, useFetcher } from "react-router";
import { useState, useEffect, type ReactNode } from "react";
import { ReportIssueModal } from "~/components/it/ReportIssueModal";
import { NotificationCenter } from "./NotificationCenter";

interface DashboardLayoutProps {
    children: ReactNode;
    user: {
        username: string;
        role: string;
        permissions: string[];
    };
}

import { MessengerPanel } from "./MessengerPanel";

// ... existing imports ...

// Header Actions Component
const HeaderActions = ({
    isDark = false,
    user,
    setIsMessengerOpen,
    setIsReportModalOpen,
    isDashboard
}: {
    isDark?: boolean;
    user: any;
    setIsMessengerOpen: (v: boolean) => void;
    setIsReportModalOpen: (v: boolean) => void;
    isDashboard: boolean;
}) => {
    const fetcher = useFetcher();

    // Poll every 30s
    useEffect(() => {
        if (fetcher.state === "idle" && !fetcher.data) {
            fetcher.load("/api/messages");
        }
        const interval = setInterval(() => {
            fetcher.load("/api/messages");
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const count = fetcher.data ? (fetcher.data as any).unreadCount : 0;

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => setIsMessengerOpen(true)}
                className={`rounded-full p-2 transition-colors relative group ${isDark
                    ? "hover:bg-white/10 text-gray-300 hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                title="Messagerie Interne"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>

                {count > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full border-2 border-white dark:border-gray-800">
                        {count}
                    </span>
                )}
            </button>

            <button
                onClick={() => setIsReportModalOpen(true)}
                className={`rounded-full p-2 transition-colors relative group ${isDark
                    ? "hover:bg-white/10 text-gray-300 hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    }`}
                title="Signaler un problème"
            >
                <LifeBuoy className="h-5 w-5" />
            </button>

            <NotificationCenter />

            <div className={`h-6 w-px mx-2 ${isDark ? "bg-gray-600" : "bg-gray-200"}`}></div>

            <div className={`flex items-center gap-2 pl-2 ${isDark ? "" : ""}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${isDark ? "bg-gray-600 text-gray-200 border border-gray-500" : "bg-blue-100 text-blue-600"
                    }`}>
                    {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden text-sm md:block">
                    <p className={`font-medium capitalize ${isDark ? "text-gray-100" : "text-gray-700"}`}>
                        {user.username}
                        {!isDark && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 border border-gray-200">{user.role}</span>}
                    </p>
                    {isDark && <p className="text-xs text-gray-400 capitalize">{user.role}</p>}
                </div>
            </div>
            {!isDashboard && (
                <Form action="/logout" method="post" className="ml-2">
                    <button
                        type="submit"
                        title="Déconnexion"
                        className={`rounded-full p-2 transition-colors relative group ${isDark
                            ? "hover:bg-white/10 text-white hover:text-red-200"
                            : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                            }`}
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </Form>
            )}
        </div>
    );
};

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
    const location = useLocation();
    const isDashboard = location.pathname === "/";
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isMessengerOpen, setIsMessengerOpen] = useState(false);


    if (isDashboard) {
        return (
            <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
                <ReportIssueModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
                <MessengerPanel isOpen={isMessengerOpen} onClose={() => setIsMessengerOpen(false)} />

                {/* Sidebar */}
                <aside className="hidden md:block">
                    <Sidebar user={user} />
                </aside>

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden relative">
                    {/* Header with Glassmorphism */}
                    <header className="flex h-16 items-center justify-between px-6 z-10 sticky top-0 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500 group-hover:text-amber-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    className="h-10 w-72 rounded-full border border-slate-200 bg-slate-50/50 pl-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all shadow-sm hover:bg-white"
                                />
                            </div>
                        </div>
                        <HeaderActions
                            user={user}
                            setIsMessengerOpen={setIsMessengerOpen}
                            setIsReportModalOpen={setIsReportModalOpen}
                            isDashboard={isDashboard}
                        />
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        <div className="animate-fade-in-up">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Immersive Layout for Modules
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans">
            <ReportIssueModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
            <MessengerPanel isOpen={isMessengerOpen} onClose={() => setIsMessengerOpen(false)} />

            {/* Immersive Header - Vibrant Gradient */}
            <header className="flex h-16 items-center justify-between px-6 text-white shadow-lg z-20 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500">
                <div className="flex items-center gap-6">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-white/20 rounded backdrop-blur-md">
                            <img src="/logo.png" alt="EID" className="h-8 w-auto" />
                        </div>
                        <span className="font-bold text-xl text-white tracking-wide text-shadow-sm">Elite Immobilier</span>
                    </div>

                    {/* Back to Dashboard Link */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/20 hover:scale-105 transition-all backdrop-blur-sm border border-white/10"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Tableau de bord
                    </Link>
                </div>

                <HeaderActions
                    isDark
                    user={user}
                    setIsMessengerOpen={setIsMessengerOpen}
                    setIsReportModalOpen={setIsReportModalOpen}
                    isDashboard={isDashboard}
                />
            </header>

            {/* Immersive Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-[url('/grid-pattern.svg')] bg-[size:20px_20px]">
                <div className="animate-fade-in-up h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
