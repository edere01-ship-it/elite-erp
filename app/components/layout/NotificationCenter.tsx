import { Bell, Check, Info, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useFetcher } from "react-router";

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fetcher = useFetcher();

    useEffect(() => {
        if (fetcher.state === "idle" && !fetcher.data) {
            fetcher.load("/api/notifications");
        }
        // Poll every minute
        const interval = setInterval(() => {
            fetcher.load("/api/notifications");
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const notifications = (fetcher.data as any)?.notifications || [];
    const unreadCount = (fetcher.data as any)?.unreadCount || 0;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = (id: string) => {
        fetcher.submit({ intent: 'mark-read', id }, { method: "post", action: "/api/notifications" });
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                title="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                {unreadCount} non lues
                            </span>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {!fetcher.data && fetcher.state === "loading" ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notif: any) => (
                                <div
                                    key={notif.id}
                                    className={`px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 border-b border-gray-50 last:border-0 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => !notif.read && markAsRead(notif.id)}
                                >
                                    <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${notif.type === 'success' ? 'bg-green-500' :
                                            notif.type === 'warning' ? 'bg-yellow-500' :
                                                notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                        }`} />
                                    <div>
                                        <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                Aucune nouvelle notification
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
