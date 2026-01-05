import type { User } from "~/types/it";
import { User as UserIcon, Shield, Lock, CheckCircle, XCircle, Edit, Plus, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState, useEffect } from "react";
import { MODULES } from "~/utils/permissions";

interface UserManagementProps {
    users: User[];
    isModalOpen?: boolean;
    onCloseModal?: () => void;
    shouldOpenModal?: boolean;
    onCreateUser?: (userData: any) => void;
    onUpdateUser?: (id: string, userData: any) => void;
    onDeleteUser?: (id: string) => void;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

export function UserManagement({
    users, isModalOpen, onCloseModal, onCreateUser, onUpdateUser, onDeleteUser,
    canCreate = false, canEdit = false, canDelete = false
}: UserManagementProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [localModalOpen, setLocalModalOpen] = useState(false);

    useEffect(() => {
        if (isModalOpen !== undefined) {
            setLocalModalOpen(isModalOpen);
            if (isModalOpen) setEditingUser(null);
        }
    }, [isModalOpen]);

    const togglePermission = (perm: string) => {
        if (selectedPermissions.includes(perm)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
        } else {
            setSelectedPermissions([...selectedPermissions, perm]);
        }
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setSelectedPermissions(user.permissions);
        setLocalModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        if (onDeleteUser && confirm("Supprimer cet utilisateur ?")) {
            onDeleteUser(id);
        }
    };

    const handleClose = () => {
        setLocalModalOpen(false);
        setEditingUser(null);
        setSelectedPermissions([]);
        if (onCloseModal) onCloseModal();
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const userData = {
            username: formData.get("username"),
            email: formData.get("email"),
            role: formData.get("role"),
            permissions: selectedPermissions,
            status: "active"
        };

        if (editingUser && onUpdateUser) {
            onUpdateUser(editingUser.id, userData);
        } else if (onCreateUser) {
            const password = formData.get("password");
            onCreateUser({ ...userData, password });
        }
        handleClose();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Gestion des Utilisateurs</h3>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Utilisateur
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Rôle
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Permissions
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Dern. Connexion
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Statut
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 group">
                                <td className="whitespace-nowrap px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-500">
                                                <span className="font-medium leading-none text-white">{user.username.substring(0, 2).toUpperCase()}</span>
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 uppercase">
                                        <Shield className="h-3 w-3" />
                                        {user.role}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                        {user.permissions.map((perm, idx) => (
                                            <span key={idx} className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                                                {perm.replace('module:', '')}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Jamais'}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-5",
                                            user.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                        )}
                                    >
                                        {user.status === "active" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                        {user.status === "active" ? "Actif" : "Inactif"}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        {canEdit && (
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Modifier"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDeleteClick(user.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit User Modal */}
            {localModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">
                            {editingUser ? "Modifier l'utilisateur" : "Nouvel Utilisateur"}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Nom d'utilisateur</label>
                                    <input
                                        name="username"
                                        required
                                        className="w-full border rounded p-2"
                                        placeholder="jdupont"
                                        defaultValue={editingUser?.username}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full border rounded p-2"
                                        placeholder="jean.dupont@elite.ci"
                                        defaultValue={editingUser?.email}
                                    />
                                </div>
                                {!editingUser && (
                                    <div>
                                        <label className="block text-sm font-medium">Mot de passe provisoire</label>
                                        <input name="password" type="password" required className="w-full border rounded p-2" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium">Rôle</label>
                                    <select
                                        name="role"
                                        className="w-full border rounded p-2"
                                        defaultValue={editingUser?.role || "user"}
                                    >
                                        <option value="user">Utilisateur Standard</option>
                                        <option value="agent">Agent Immobilier</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Administrateur</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Permissions d'accès</label>
                                    <div className="space-y-4 max-h-60 overflow-y-auto border rounded p-2">
                                        {MODULES.map((module) => (
                                            <div key={module.id} className="border-b last:border-0 pb-2 mb-2">
                                                <h4 className="font-semibold text-sm text-gray-700 mb-2">{module.label}</h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {module.permissions.map((perm) => (
                                                        <label key={perm.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPermissions.includes(perm.id)}
                                                                onChange={() => togglePermission(perm.id)}
                                                                className="rounded text-blue-600"
                                                            />
                                                            <span className="text-gray-600">{perm.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={handleClose} className="px-4 py-2 border rounded">Annuler</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                                    {editingUser ? "Mettre à jour" : "Créer l'utilisateur"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
