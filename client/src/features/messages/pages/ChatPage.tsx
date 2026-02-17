import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { messagesApi, usersApi } from '../../../core/api';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchProfile } from '../../profile/store/profileSlice';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL, ACCESS_TOKEN_STORAGE_KEY } from '../../../core/constants';
import { storage } from '../../../core/utils/storage';
import type { ConversationDto, MessageDto } from '../../../core/types/dtos';
// Removed unused Button import

export const ChatPage = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAppSelector((state) => state.auth);
    const { user: profileUser } = useAppSelector((state) => state.profile);
    const dispatch = useAppDispatch();
    const params = useParams<{ userId?: string }>();
    const [search] = useSearchParams();
    const initialRecipient = params.userId || search.get('to') || undefined;
    const initialConversationId = search.get('conversationId') || undefined;

    const [conversations, setConversations] = useState<ConversationDto[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [query, setQuery] = useState('');
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<MessageDto[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [text, setText] = useState('');
    const [recipientInfo, setRecipientInfo] = useState<{ id?: string; username?: string; avatarUrl?: string | null }>({});
    const viewportRef = useRef<HTMLDivElement>(null);
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    const headerInfo = useMemo(() => {
        if (activeConversationId) {
            const conv = conversations.find(c => c.id === activeConversationId);
            if (conv) return { username: conv.otherUsername, avatarUrl: conv.otherAvatarUrl };
        }
        if (recipientInfo.id) {
            return { username: recipientInfo.username, avatarUrl: recipientInfo.avatarUrl };
        }
        return { username: 'Чати', avatarUrl: undefined };
    }, [activeConversationId, conversations, recipientInfo]);

    const filteredConversations = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter(c => c.otherUsername.toLowerCase().startsWith(q));
    }, [query, conversations]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingConversations(true);
                const list = await messagesApi.getConversations();
                setConversations(list);
                if (initialRecipient) {
                    const existing = list.find(c => c.otherUserId === initialRecipient);
                    if (existing) {
                        setActiveConversationId(existing.id);
                        await loadMessages(existing.id);
                        await messagesApi.markRead(existing.id);
                    } else {
                        setRecipientInfo({ id: initialRecipient });
                    }
                } else if (initialConversationId) {
                    const exists = list.find(c => c.id === initialConversationId);
                    if (exists) {
                        setActiveConversationId(exists.id);
                        await loadMessages(exists.id);
                    }
                }
            } finally {
                setLoadingConversations(false);
            }
        };
        load();
    }, [initialRecipient, initialConversationId]);

    // Підвантаження профілю співрозмовника
    useEffect(() => {
        if (recipientInfo.id && (!recipientInfo.username || recipientInfo.avatarUrl == null)) {
            (async () => {
                try {
                    const profile = await usersApi.getProfile(recipientInfo.id!);
                    setRecipientInfo({ id: profile.id, username: profile.username, avatarUrl: profile.avatarUrl ?? null });
                } catch (e) { console.warn(e); }
            })();
        }
    }, [recipientInfo.id]);

    useEffect(() => {
        if (authUser?.id && (!profileUser || profileUser.id !== authUser.id)) {
            dispatch(fetchProfile());
        }
    }, [authUser?.id, profileUser, dispatch]);

    // Розширений SignalR Hub
    useEffect(() => {
        const apiBase = API_BASE_URL.replace(/\/api$/, '');
        const token = storage.get<string>(ACCESS_TOKEN_STORAGE_KEY) || undefined;
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiBase}/hubs/chat?userId=${authUser?.id || ''}`, {
                accessTokenFactory: () => token ?? ''
            })
            .withAutomaticReconnect()
            .build();
        connectionRef.current = connection;

        connection.on('MessageReceived', (msg: MessageDto) => {
            const isMe = msg.senderId === authUser?.id;
            // Уникаємо дублю: свої повідомлення додаємо оптимістично, тому тут їх не додаємо
            if (!isMe && activeConversationId && msg.conversationId === activeConversationId) {
                setMessages(prev => (prev.some(p => p.id === msg.id) ? prev : [...prev, msg]));
            }
            // Оновлення списку чатів при отриманні повідомлення
            messagesApi.getConversations().then(setConversations);
        });

        connection.on('MessageDeleted', (payload: { messageId: string }) => {
            setMessages(prev => prev.filter(m => m.id !== payload.messageId));
        });

        connection.on('MessageEdited', (msg: MessageDto) => {
            setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
        });

        connection.start().catch(err => console.error(err));
        return () => { connection.stop().catch(() => {}); };
    }, [authUser?.id, activeConversationId]);

    useEffect(() => {
        if (viewportRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }, [messages]);

    const loadMessages = async (id: string) => {
        try {
            setLoadingMessages(true);
            const list = await messagesApi.getConversationMessages(id, 0, 50);
            setMessages(list.reverse());
        } finally { setLoadingMessages(false); }
    };

    const send = async () => {
        const payload = text.trim();
        if (!payload) return;
        try {
            let msg: MessageDto;
            if (activeConversationId) {
                msg = await messagesApi.sendInConversation(activeConversationId, payload);
            } else if (recipientInfo.id) {
                msg = await messagesApi.sendToUser(recipientInfo.id, payload);
                setActiveConversationId(msg.conversationId);
            } else return;
            // Оптимістичне додавання з перевіркою на дубль по id
            setMessages(prev => (prev.some(p => p.id === msg.id) ? prev : [...prev, msg]));
            setText('');
            messagesApi.getConversations().then(setConversations);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 h-[85vh] flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 rounded-xl border border-white/5 mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-red-700 p-[1px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                            {headerInfo.avatarUrl ? <img src={headerInfo.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-red-500">{headerInfo.username?.[0]?.toUpperCase()}</span>}
                        </div>
                    </div>
                    <h1 className="text-lg font-bold text-white">{headerInfo.username}</h1>
                </div>
            </header>

            <div className="grid grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
                {/* Sidebar */}
                <aside className="bg-zinc-900 rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                        <input className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:border-red-600/50 outline-none" placeholder="Пошук..." value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/5 relative">
                        <p className="px-3 py-2 text-[10px] uppercase font-black text-white/20 tracking-widest">Переписки</p>
                        {loadingConversations ? (
                            <div className="space-y-2 px-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-900/40 rounded-xl animate-pulse" />)}</div>
                        ) : (
                            <ul className="space-y-1">
                                {filteredConversations.map(c => (
                                    <li key={c.id} className="group relative">
                                        <button className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeConversationId === c.id ? 'bg-red-600/10 border border-red-600/30' : 'hover:bg-white/[0.03] border border-transparent'}`} onClick={() => { setActiveConversationId(c.id); loadMessages(c.id); }}>
                                            <div className={`w-11 h-11 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border-2 ${activeConversationId === c.id ? 'border-red-600' : 'border-white/5'}`}>
                                                {c.otherAvatarUrl ? <img src={c.otherAvatarUrl} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-white/20">{c.otherUsername[0]}</span>}
                                            </div>
                                            <div className="flex-1 text-left truncate">
                                                <p className="text-sm font-bold text-white/90 truncate">{c.otherUsername}</p>
                                                <p className="text-[11px] text-white/30 truncate">{c.lastMessageText || '...'}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {activeConversationId && (() => {
                            const conv = conversations.find(cv => cv.id === activeConversationId);
                            return conv ? (
                                <div className="absolute bottom-3 right-3">
                                    <button className="p-3 rounded-full bg-zinc-900 border border-white/10 text-white/50 hover:text-red-500 hover:border-red-500 shadow-xl transition-all" onClick={async () => {
                                        if (confirm(`Видалити чат з ${conv.otherUsername}?`)) {
                                            await messagesApi.deleteConversation(conv.id);
                                            setConversations(prev => prev.filter(cv => cv.id !== conv.id));
                                            setActiveConversationId(null);
                                            setMessages([]);
                                        }
                                    }}>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 001-1V5a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 001 1m-7 0h8"/></svg>
                                    </button>
                                </div>
                            ) : null;
                        })()}
                    </div>
                </aside>

                {/* Main Chat Area */}
                <section className="bg-zinc-900 rounded-2xl border border-white/5 flex flex-col overflow-hidden relative shadow-2xl">
                    <div ref={viewportRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/10 via-black to-black">
                        {loadingMessages ? (
                            <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-white/10 text-xs uppercase tracking-widest">Оберіть чат</div>
                        ) : (
                            messages.map((m, idx) => {
                                const isMe = m.senderId === authUser?.id;
                                const avatar = isMe ? (profileUser?.avatarUrl || authUser?.avatarUrl) : headerInfo.avatarUrl;
                                const isSelected = selected.has(m.id);
                                const currDate = new Date(m.createdAt);
                                const prevDate = idx > 0 ? new Date(messages[idx - 1].createdAt) : null;
                                const showDate = idx === 0 || currDate.toDateString() !== prevDate?.toDateString();
                                const showYear = !!prevDate && currDate.getFullYear() !== prevDate.getFullYear();
                                const dateLabel = currDate.toLocaleDateString('uk-UA', showYear ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' });
                                return (
                                    <div key={m.id} className="space-y-2">
                                        {showDate && (
                                            <div className="flex justify-center">
                                                <span className="px-3 py-1 text-[10px] uppercase tracking-widest text-white/40 bg-black/40 border border-white/10 rounded-full">
                                                    {dateLabel}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex gap-4 cursor-pointer transition-all ${isMe ? 'flex-row-reverse' : ''} ${isSelected ? 'scale-[0.98] opacity-80' : ''}`} onClick={() => {
                                            if (!isMe) return;
                                            setSelected(prev => {
                                                const next = new Set(prev);
                                                if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
                                                return next;
                                            });
                                        }}>
                                            <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/10 overflow-hidden shrink-0">
                                                {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20">{isMe ? 'Я' : ' '}</div>}
                                            </div>
                                            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg ${isMe ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-tr-none' : 'bg-black text-white/90 rounded-tl-none border border-white/5'}`}> 
                                                {m.text}
                                                <div className={`text-[13px] mt-1 ${isMe ? 'text-white/50 text-right' : 'text-white/20'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Action Bar for selected messages */}
                    {selected.size > 0 && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 rounded-full px-6 py-2 flex items-center gap-4 shadow-2xl animate-in fade-in zoom-in-95">
                            <span className="text-xs text-white/50">{selected.size} обрано</span>
                            {selected.size === 1 && (
                                <button className="text-xs font-bold text-sky-500 hover:text-sky-400" onClick={async () => {
                                    const id = Array.from(selected)[0];
                                    const m = messages.find(msg => msg.id === id);
                                    const input = window.prompt('Редагувати:', m?.text);
                                    if (input) {
                                        await messagesApi.editMessage(id, input);
                                        setSelected(new Set());
                                    }
                                }}>Редагувати</button>
                            )}
                            <button className="text-xs font-bold text-red-500 hover:text-red-400" onClick={async () => {
                                if (confirm('Видалити повідомлення?')) {
                                    for (const id of Array.from(selected)) await messagesApi.deleteMessage(id);
                                    setSelected(new Set());
                                }
                            }}>Видалити</button>
                            <button className="text-xs text-white/30" onClick={() => setSelected(new Set())}>Скасувати</button>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 bg-zinc-900 border-t border-white/5">
                        <div className="max-w-4xl mx-auto flex gap-3">
                            <input className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-5 py-3 text-sm text-white focus:border-red-600/50 outline-none" placeholder="Напишіть щось..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()} />
                            <button className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all disabled:opacity-50" disabled={!text.trim()} onClick={send}>
                                <svg className="w-5 h-5 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l14-7-7 14-2-5-5-2z"/></svg>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};