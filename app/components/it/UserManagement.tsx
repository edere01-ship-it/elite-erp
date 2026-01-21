import { Fragment, useState, useEffect } from "react";
import type { User } from "~/types/it";
import { User as UserIcon, Shield, Lock, CheckCircle, XCircle, Edit, Plus, Trash2, Search, Filter } from "lucide-react";
import { cn } from "~/lib/utils";
import { MODULES } from "~/utils/permissions";
import { Dialog, Transition } from "@headlessui/react";

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
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    useEffect(() => {
        if (isModalOpen !== undefined) {
            setIsOpen(isModalOpen);
            if (isModalOpen && !editingUser) {
                // Reset for creation if opened without editing user
                setSelectedPermissions([]);
            }
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
        setIsOpen(true);
    };

    const handleCreateClick = () => {
        setEditingUser(null);
        setSelectedPermissions([]);
        setIsOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        if (onDeleteUser && confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
            onDeleteUser(id);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
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

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Gestion des Accès
                    </h3>
                    <p className="text-sm text-gray-500">Gérez les utilisateurs et leurs permissions par module.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={handleCreateClick}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Nouvel Utilisateur
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Rechercher un utilisateur (nom, email)..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">Tous les rôles</option>
                        <option value="admin">Administrateur</option>
                        <option value="manager">Manager</option>
                        <option value="agent">Agent</option>
                        <option value="user">Utilisateur</option>
                    </select>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold text-lg">
                                        {user.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.username}</h4>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                                    user.role === 'admin' ? "bg-purple-100 text-purple-800" :
                                        user.role === 'manager' ? "bg-blue-100 text-blue-800" :
                                            user.role === 'agent' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                )}>
                                    <Shield className="h-3 w-3" />
                                    {user.role}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-4 h-24 overflow-y-auto content-start custom-scrollbar p-1 rounded bg-gray-50 border border-gray-100">
                                {user.permissions.length > 0 ? user.permissions.map((perm, idx) => (
                                    <span key={idx} className="inline-flex items-center rounded bg-white px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200 shadow-sm">
                                        {perm.split('.').slice(1).join(' ')}
                                    </span>
                                )) : <span className="text-xs text-gray-400 italic p-1">Aucune permission spécifique</span>}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                                <span className="flex items-center gap-1">
                                    {user.status === "active" ?
                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" /> :
                                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                                    }
                                    {user.status === "active" ? "Actif" : "Inactif"}
                                </span>
                                <span>
                                    Dernière connexion: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Jamais'}
                                </span>
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {canEdit && (
                                <button
                                    onClick={() => handleEditClick(user)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-full transition-colors"
                                    title="Modifier"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => handleDeleteClick(user.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-full transition-colors"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* New Floating Modal using Headless UI */}
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={handleClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-gray-100">
                                    <Dialog.Title
                                        as="div"
                                        className="flex justify-between items-center mb-6"
                                    >
                                        <h3 className="text-lg font-bold leading-6 text-gray-900">
                                            {editingUser ? "Modifier l'utilisateur" : "Nouvel Utilisateur"}
                                        </h3>
                                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100">
                                            <XCircle className="h-6 w-6" />
                                        </button>
                                    </Dialog.Title>

                                    <form onSubmit={handleSubmit} className="mt-2 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                                                    <div className="relative">
                                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            name="username"
                                                            required
                                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                            placeholder="jdupont"
                                                            defaultValue={editingUser?.username}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
                                                    <input
                                                        name="email"
                                                        type="email"
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        placeholder="jean.dupont@elite.ci"
                                                        defaultValue={editingUser?.email}
                                                    />
                                                </div>
                                                {!editingUser && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe provisoire</label>
                                                        <input name="password" type="password" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle Système</label>
                                                    <select
                                                        name="role"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                                                        defaultValue={editingUser?.role || "user"}
                                                    >
                                                        <option value="user">Utilisateur Standard</option>
                                                        <option value="agent">Agent Immobilier</option>
                                                        <option value="manager">Manager</option>
                                                        <option value="admin">Administrateur</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Permissions Right/Bottom Panel */}
                                            <div className="md:col-span-2 border-t pt-4">
                                                <label className="block text-sm font-medium text-gray-900 mb-3">Permissions d'accès aux modules</label>
                                                <div className="bg-gray-50 rounded-xl p-4 max-h-[400px] overflow-y-auto custom-scrollbar border border-gray-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {MODULES.map((module) => (
                                                            <div key={module.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                                                <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100 flex items-center justify-between">
                                                                    {module.label}
                                                                    <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 rounded">{module.permissions.length}</span>
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {module.permissions.map((perm) => (
                                                                        <label key={perm.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition-colors group">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedPermissions.includes(perm.id)}
                                                                                onChange={() => togglePermission(perm.id)}
                                                                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                                                            />
                                                                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">
                                                                                {perm.label}
                                                                            </span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                onClick={handleClose}
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                className="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                                            >
                                                {editingUser ? "Enregistrer les modifications" : "Créer l'utilisateur"}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
