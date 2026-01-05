import { Bell, Check, Info, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mock notifications for now - in real app, fetch from API
    const notifications = [
        { id: 1, type: 'info', message: 'Bienvenue sur Elite ERP', time: 'À l\'instant' },
        { id: 2, type: 'success', message: 'Mise à jour du système effectuée', time: 'Il y a 2h' },
    ];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3">
                                    <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${notif.type === 'success' ? 'bg-green-500' :
                                            notif.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm text-gray-700">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                Aucune nouvelle notification
                            </div>
                        )}
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                        <Link to="/it" className="text-xs font-medium text-blue-600 hover:text-blue-500 block text-center">
                            Voir tout l'historique
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
