import type { AuditLog, User } from "~/types/it";
import { Activity, Clock, FileText, Globe, Key, Eye, Edit, User as UserIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface ActivityLogsProps {
    logs: AuditLog[];
    users?: User[]; // Optional to avoid breaking other usages if any
}

export function ActivityLogs({ logs, users = [] }: ActivityLogsProps) {
    const getActionIcon = (action: string) => {
        switch (action) {
            case 'login': return <Key className="h-4 w-4 text-green-500" />;
            case 'logout': return <Key className="h-4 w-4 text-gray-500" />;
            case 'open_module': return <Globe className="h-4 w-4 text-blue-500" />;
            case 'view_file': return <Eye className="h-4 w-4 text-purple-500" />;
            case 'edit_file': return <Edit className="h-4 w-4 text-orange-500" />;
            default: return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    // Filter online users (active in last 5 minutes and no logout after last activity)
    const onlineUsers = users.filter(u => {
        if (!u.lastActivity) return false;
        const lastActiveTime = new Date(u.lastActivity).getTime();
        const lastLogoutTime = u.lastLogout ? new Date(u.lastLogout).getTime() : 0;
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        return lastActiveTime > fiveMinutesAgo && lastActiveTime > lastLogoutTime;
    });

    return (
        <div className="space-y-6">
            {/* Online Users Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                    <UserIcon className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Utilisateurs en ligne ({onlineUsers.length})</h3>
                </div>
                {onlineUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                        {onlineUsers.map(user => (
                            <div key={user.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-100">
                                <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-xs">
                                    {user.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                    <div className="text-xs text-gray-500">
                                        Actif: {new Date(user.lastActivity!).toLocaleTimeString()}
                                    </div>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="En ligne"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">Aucun utilisateur actif.</p>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Journal d'Activités & Audit</h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Horodatage
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Utilisateur
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Action
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Détails
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{log.username}</div>
                                        <div className="text-xs text-gray-500">ID: {log.userId}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                                            {getActionIcon(log.action)}
                                            {log.action.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                        {log.module && (
                                            <span className="mr-2 inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                                                {log.module}
                                            </span>
                                        )}
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
