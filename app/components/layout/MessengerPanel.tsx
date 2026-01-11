
import { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { Mail, Send, X, Inbox, User, Clock, Loader2, CheckCircle2, Paperclip, Video, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { MeetingModal } from "../collaboration/MeetingModal";

interface Message {
    id: string;
    content: string;
    read: boolean;
    createdAt: string;
    sender: { username: string };
    receiver: { username: string };
    attachmentUrl?: string;
}

interface MessengerPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MessengerPanel({ isOpen, onClose }: MessengerPanelProps) {
    const fetcher = useFetcher();
    const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'conversations' | 'meetings'>('inbox');
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [draftMessage, setDraftMessage] = useState<{ to: string, cc: string[], content: string }>({ to: "", cc: [], content: "" });
    const [showCc, setShowCc] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        if (isOpen && fetcher.state === "idle" && !fetcher.data) {
            fetcher.load("/api/messages");
        }
    }, [isOpen]);

    // Real-time SSE Connection
    useEffect(() => {
        if (!isOpen) return;

        const eventSource = new EventSource("/api/sse");

        eventSource.onmessage = (event) => {
            // Keep connection alive
        };

        eventSource.addEventListener("message", (event) => {
            const newMessage = JSON.parse(event.data);
            // We could update local state directly, or just re-fetch to keep it simple and consistent
            // optimizing: strictly, we should append to 'messages.received' or 'messages.sent' locally.
            // For MVP speed:
            fetcher.load("/api/messages");

            // Notification sound could go here
        });

        return () => {
            eventSource.close();
        };
    }, [isOpen]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (selectedConversation && activeTab === 'conversations') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [fetcher.data, selectedConversation, activeTab]);


    // Handle form submission response
    useEffect(() => {
        if (fetcher.data?.success && fetcher.state === "idle") {
            if (activeTab === 'compose' && !fetcher.data.error) {
                setActiveTab('conversations');
                setDraftMessage({ to: "", cc: [], content: "" });
                setShowCc(false);
                fetcher.load("/api/messages");
            }
        }
    }, [fetcher.data, fetcher.state]);

    const messages = fetcher.data?.messages || { received: [], sent: [] };
    const isLoading = fetcher.state === "loading" && !fetcher.data;

    const getConversations = () => {
        const allMessages = [
            ...(messages.received || []).map((m: any) => ({ ...m, type: 'received', partner: m.sender })),
            ...(messages.sent || []).map((m: any) => ({ ...m, type: 'sent', partner: m.receiver }))
        ];

        const groups: { [key: string]: any[] } = {};
        allMessages.forEach(msg => {
            const partnerName = msg.partner.username;
            if (!groups[partnerName]) groups[partnerName] = [];
            groups[partnerName].push(msg);
        });

        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });

        return Object.entries(groups).map(([partnerName, msgs]) => ({
            partnerName,
            messages: msgs,
            lastMessage: msgs[msgs.length - 1]
        })).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    };

    const conversations = getConversations();

    const handleMarkAsRead = (messageId: string) => {
        fetcher.submit(
            { intent: "mark-read", messageId },
            { method: "post", action: "/api/messages" }
        );
    };

    const handleReply = (partnerName: string) => {
        setSelectedConversation(partnerName);
        setActiveTab('conversations');
    };

    const handleForward = (content: string, attachmentUrl?: string) => {
        let forwardContent = `\n\n--- Message Transféré ---\n${content}`;
        if (attachmentUrl) forwardContent += `\n[Pièce jointe originale]: ${attachmentUrl}`;
        setDraftMessage({ to: "", cc: [], content: forwardContent });
        setActiveTab('compose');
    };

    const toggleCcSelection = (username: string) => {
        setDraftMessage(prev => {
            const isSelected = prev.cc.includes(username);
            return {
                ...prev,
                cc: isSelected
                    ? prev.cc.filter(u => u !== username)
                    : [...prev.cc, username]
            };
        });
    };

    const startInstantMeeting = () => {
        const roomName = `Elite-Meet-${Math.random().toString(36).substring(7)}`;
        window.open(`https://meet.jit.si/${roomName}`, '_blank');
        // Ideally we would send an invite message here
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col">
            <MeetingModal isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} />

            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-400" />
                    <h2 className="font-bold text-lg">Messagerie Interne</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMeetingModalOpen(true)}
                        title="Planifier Réunion"
                        className="p-1 hover:bg-white/10 rounded-full text-blue-200"
                    >
                        <CalendarIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => { setActiveTab('inbox'); setSelectedConversation(null); }}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                        activeTab === 'inbox'
                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Réception
                </button>
                <button
                    onClick={() => { setActiveTab('conversations'); setSelectedConversation(null); }}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                        activeTab === 'conversations'
                            ? "border-purple-600 text-purple-600 bg-purple-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Échanges
                </button>
                <button
                    onClick={() => { setActiveTab('meetings'); setSelectedConversation(null); }}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                        activeTab === 'meetings'
                            ? "border-green-600 text-green-600 bg-green-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Réunions
                </button>
                <button
                    onClick={() => { setActiveTab('compose'); setSelectedConversation(null); }}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                        activeTab === 'compose'
                            ? "border-amber-500 text-amber-600 bg-amber-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Nouveau
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
                {activeTab === 'inbox' && (
                    <div className="p-4 space-y-4">
                        {isLoading && !fetcher.data && (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        )}

                        {!isLoading && messages.received?.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Aucun message reçu</p>
                            </div>
                        )}

                        {/* Messages map... (unchanged) */}
                        {messages.received?.map((msg: Message) => (
                            // ... (existing message rendering code) ...
                            <div
                                key={msg.id}
                                onClick={() => !msg.read && handleMarkAsRead(msg.id)}
                                className={cn(
                                    "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md group relative",
                                    msg.read
                                        ? "bg-white border-gray-200"
                                        : "bg-blue-50 border-blue-200 shadow-sm"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                                            {msg.sender.username.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{msg.sender.username}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(msg.createdAt))}
                                            </p>
                                        </div>
                                    </div>
                                    {!msg.read && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500 block animate-pulse"></span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap pl-10 mb-2">{msg.content}</p>
                                {msg.attachmentUrl && (
                                    <div className="pl-10 mb-2">
                                        <a
                                            href={msg.attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-xs font-medium text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Paperclip className="h-3 w-3" />
                                            Voir la pièce jointe
                                        </a>
                                    </div>
                                )}

                                <div className="pl-10 flex gap-2 pt-2 border-t border-gray-100/50 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleReply(msg.sender.username); }}
                                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-reply"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                                        Répondre
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleForward(msg.content, msg.attachmentUrl); }}
                                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-forward"><polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" /></svg>
                                        Transférer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'meetings' && (
                    <div className="p-4 space-y-4">
                        <div className="mb-4">
                            <button
                                onClick={() => setIsMeetingModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                            >
                                <CalendarIcon className="h-5 w-5" />
                                Planifier une réunion
                            </button>
                        </div>

                        {(fetcher.data?.meetings || []).length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Aucune réunion prévue</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(fetcher.data?.meetings || []).map((m: any) => (
                                    <div key={m.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{m.title}</h4>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(m.startTime))}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Org: {m.organizer?.username}
                                                </p>
                                            </div>
                                            {m.link && (
                                                <a
                                                    href={m.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                    title="Rejoindre"
                                                >
                                                    <Video className="h-5 w-5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'conversations' && (
                    <div className="h-full flex flex-col">
                        {!selectedConversation ? (
                            // Conversations List
                            <div className="p-4 space-y-2">
                                {/* Quick Action: Instant Video Call */}
                                <div className="mb-4">
                                    <button
                                        onClick={startInstantMeeting}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        <Video className="h-5 w-5" />
                                        Lancer une visio instantanée (Jitsi)
                                    </button>
                                </div>

                                {conversations.length === 0 && (
                                    <div className="text-center py-10 text-gray-400">
                                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <User className="h-6 w-6 opacity-50" />
                                        </div>
                                        <p>Aucun échange pour le moment</p>
                                    </div>
                                )}
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.partnerName}
                                        onClick={() => setSelectedConversation(conv.partnerName)}
                                        className="bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                                                {conv.partnerName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{conv.partnerName}</p>
                                                <p className="text-xs text-gray-500 truncate w-40">
                                                    {conv.lastMessage.type === 'sent' && "Vous: "}
                                                    {conv.lastMessage.content}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400">
                                                {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(conv.lastMessage.createdAt))}
                                            </p>
                                            {conv.messages.some((m: any) => m.type === 'received' && !m.read) && (
                                                <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Chat View
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-3 border-b bg-gray-50 flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedConversation(null)}
                                        className="p-1 hover:bg-gray-200 rounded-full text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <h3 className="font-bold text-gray-800">
                                        {selectedConversation}
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                                    {conversations.find(c => c.partnerName === selectedConversation)?.messages.map((msg: any) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "max-w-[85%] rounded-2xl p-3 text-sm mb-2 group relative",
                                                msg.type === 'sent'
                                                    ? "bg-slate-800 text-white ml-auto rounded-br-none"
                                                    : "bg-gray-200 text-gray-800 mr-auto rounded-bl-none"
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            {msg.attachmentUrl && (
                                                <div className="mt-2 pt-2 border-t border-white/10">
                                                    <a
                                                        href={msg.attachmentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            "flex items-center gap-2 text-xs hover:underline",
                                                            msg.type === 'sent' ? "text-gray-300" : "text-gray-600"
                                                        )}
                                                    >
                                                        <Paperclip className="h-3 w-3" />
                                                        Pièce jointe
                                                    </a>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mt-1">
                                                <p className={cn("text-[10px] opacity-70", msg.type === 'sent' ? "text-gray-300" : "text-gray-500")}>
                                                    {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.createdAt))}
                                                </p>

                                                {/* Actions in Chat Bubble */}
                                                <button
                                                    onClick={(e) => handleForward(msg.content, msg.attachmentUrl)}
                                                    className={cn(
                                                        "opacity-0 group-hover:opacity-100 transition-opacity ml-2",
                                                        msg.type === 'sent' ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-800"
                                                    )}
                                                    title="Transférer"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-forward"><polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Reply Area */}
                                <div className="p-3 border-t bg-white">
                                    <fetcher.Form method="post" action="/api/messages" encType="multipart/form-data" className="flex items-end gap-2">
                                        <input type="hidden" name="intent" value="send" />
                                        <input type="hidden" name="to" value={selectedConversation} />

                                        <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                                            <textarea
                                                name="content"
                                                required
                                                rows={1}
                                                placeholder="Votre message..."
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm resize-none max-h-20"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        (e.target as any).form.requestSubmit();
                                                    }
                                                }}
                                            />
                                        </div>

                                        <label className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                                            <input type="file" name="attachment" className="hidden" />
                                            <Paperclip className="h-5 w-5" />
                                        </label>

                                        <button
                                            type="submit"
                                            disabled={fetcher.state === "submitting"}
                                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </fetcher.Form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'compose' && (
                    <div className="p-6">
                        <fetcher.Form method="post" action="/api/messages" encType="multipart/form-data" className="space-y-4">
                            <input type="hidden" name="intent" value="send" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                                    <select
                                        name="to"
                                        required
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm appearance-none bg-white"
                                        value={draftMessage.to}
                                        onChange={(e) => setDraftMessage({ ...draftMessage, to: e.target.value })}
                                    >
                                        <option value="" disabled>Sélectionner un destinataire</option>
                                        {(fetcher.data?.recipients || []).map((user: any) => (
                                            <option key={user.id} value={user.username}>
                                                {user.username} ({user.role})
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => setShowCc(!showCc)}
                                        className="absolute right-3 top-2 text-sm text-blue-600 font-medium hover:text-blue-800"
                                    >
                                        Cc
                                    </button>
                                </div>
                            </div>

                            {/* CC Field */}
                            {showCc && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Copie à (Cc)</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {draftMessage.cc.map(cc => (
                                            <span key={cc} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                                {cc}
                                                <button type="button" onClick={() => toggleCcSelection(cc)}>
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md bg-white">
                                        {(fetcher.data?.recipients || []).filter((u: any) => u.username !== draftMessage.to).map((user: any) => (
                                            <div
                                                key={user.id}
                                                onClick={() => toggleCcSelection(user.username)}
                                                className={cn(
                                                    "px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between",
                                                    draftMessage.cc.includes(user.username) ? "bg-blue-50/50" : ""
                                                )}
                                            >
                                                <span>{user.username} <span className="text-xs text-gray-400">({user.role})</span></span>
                                                {draftMessage.cc.includes(user.username) && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                                            </div>
                                        ))}
                                    </div>
                                    <input type="hidden" name="cc" value={JSON.stringify(draftMessage.cc)} />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    name="content"
                                    required
                                    rows={5}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm resize-none"
                                    placeholder="Écrivez votre message ici..."
                                    defaultValue={draftMessage.content}
                                ></textarea>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pièce jointe</label>
                                <input
                                    type="file"
                                    name="attachment"
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={fetcher.state === "submitting"}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {fetcher.state === "submitting" ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-5 w-5 text-amber-400" />
                                        Envoyer le message
                                    </>
                                )}
                            </button>

                            {fetcher.data?.error && (
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                                    {fetcher.data.error}
                                </p>
                            )}
                        </fetcher.Form>
                    </div>
                )}
            </div>
        </div>
    );
}
