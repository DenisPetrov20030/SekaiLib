import { useEffect, useMemo, useRef, useState } from 'react';
import { messagesApi } from '../../../core/api';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fetchProfile } from '../../profile/store/profileSlice';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL, ACCESS_TOKEN_STORAGE_KEY } from '../../../core/constants';
import { storage } from '../../../core/utils/storage';
import type { ConversationDto, MessageDto } from '../../../core/types/dtos';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientUsername: string;
  recipientAvatarUrl?: string | null;
}

export const ChatModal = ({ isOpen, onClose, recipientId, recipientUsername, recipientAvatarUrl }: ChatModalProps) => {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const { user: profileUser } = useAppSelector((state) => state.profile);
  const dispatch = useAppDispatch();
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [query, setQuery] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const currentHeader = useMemo(() => {
    if (activeConversationId) {
      const conv = conversations.find(c => c.id === activeConversationId);
      if (conv) return { username: conv.otherUsername, avatarUrl: conv.otherAvatarUrl };
    }
    return { username: recipientUsername, avatarUrl: recipientAvatarUrl ?? undefined };
  }, [activeConversationId, conversations, recipientUsername, recipientAvatarUrl]);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c => c.otherUsername.toLowerCase().startsWith(q));
  }, [query, conversations]);

  // Load conversations and messages logic remains the same...
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        setLoadingConversations(true);
        const list = await messagesApi.getConversations();
        setConversations(list);
        const existing = list.find(c => c.otherUserId === recipientId);
        if (existing) {
          setActiveConversationId(existing.id);
          await loadMessages(existing.id);
          await messagesApi.markRead(existing.id);
          setConversations((prev) => prev.map((cv) => cv.id === existing.id ? { ...cv, unreadCount: 0 } : cv));
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      } finally {
        setLoadingConversations(false);
      }
    };
    load();
  }, [isOpen, recipientId]);

  useEffect(() => {
    if (isOpen && !profileUser?.avatarUrl) {
      dispatch(fetchProfile());
    }
  }, [isOpen, profileUser?.avatarUrl, dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    const apiBase = API_BASE_URL.replace(/\/api$/, '');
    const token = storage.get<string>(ACCESS_TOKEN_STORAGE_KEY) || undefined;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiBase}/hubs/chat?userId=${authUser?.id || ''}`, {
        accessTokenFactory: () => token ?? ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();
    connectionRef.current = connection;

    connection.on('MessageReceived', (msg: MessageDto) => {
      const isMe = msg.senderId === authUser?.id;
      if (!isMe && activeConversationId && msg.conversationId === activeConversationId) {
        setMessages((prev) => prev.some((p) => p.id === msg.id) ? prev : [...prev, msg]);
      }
    });

    connection.start().catch((err) => console.error('SignalR error', err));
    return () => {
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [isOpen, authUser?.id, activeConversationId]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const list = await messagesApi.getConversationMessages(conversationId, 0, 50);
      setMessages(list.reverse());
    } finally {
      setLoadingMessages(false);
    }
  };

  const send = async () => {
    const payload = text.trim();
    if (!payload) return;
    try {
      let msg: MessageDto;
      if (activeConversationId) {
        msg = await messagesApi.sendInConversation(activeConversationId, payload);
      } else {
        msg = await messagesApi.sendToUser(recipientId, payload);
        setActiveConversationId(msg.conversationId);
      }
      setMessages(prev => (prev.some(p => p.id === msg.id) ? prev : [...prev, msg]));
      setText('');
    } catch (e) {
      console.error('Send error', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-6xl mx-4 bg-zinc-950 rounded-2xl border border-white/10 shadow-[0_0_50px_-12px_rgba(220,38,38,0.3)] overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header Section */}
        <header className="flex items-center justify-between px-6 py-4 bg-zinc-900/50 border-b border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-red-700 p-[1px]">
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                  {currentHeader.avatarUrl ? (
                    <img src={currentHeader.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-red-500">{currentHeader.username?.[0].toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full shadow-sm"></div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">{currentHeader.username}</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-tighter font-bold">У мережі</p>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar Section */}
          <aside className="w-[320px] bg-zinc-950 border-r border-white/5 flex flex-col">
            <div className="p-4">
              <div className="relative">
                <input
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder:text-white/20 focus:border-red-600/50 focus:ring-1 focus:ring-red-600/50 outline-none transition-all"
                  placeholder="Шукати діалог..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-white/5">
              <div className="px-3 py-2 text-[10px] uppercase font-black text-white/20 tracking-widest">Діалоги</div>
              {loadingConversations ? (
                <div className="space-y-2 px-2">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-zinc-900/40 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredConversations.map((c) => (
                    <li key={c.id}>
                      <button
                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${activeConversationId === c.id ? 'bg-red-600/10 border border-red-600/30' : 'hover:bg-white/[0.03] border border-transparent'}`}
                        onClick={async () => {
                          setActiveConversationId(c.id);
                          await loadMessages(c.id);
                        }}
                      >
                        <div className={`w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border-2 transition-all ${activeConversationId === c.id ? 'border-red-600' : 'border-white/5 group-hover:border-white/20'}`}>
                          {c.otherAvatarUrl ? <img src={c.otherAvatarUrl} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-white/20">{c.otherUsername[0]}</span>}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <p className="text-sm font-bold text-white/90 truncate">{c.otherUsername}</p>
                            <span className="text-[10px] text-white/20">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </div>
                          <p className="text-xs text-white/40 truncate font-medium">{c.lastMessageText || 'Почніть розмову'}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Main Chat Section */}
          <section className="flex-1 flex flex-col bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black">
            <div ref={viewportRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/5">
              {loadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.4)]" />
                  <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.2em]">Завантаження історії</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="px-6 py-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-white/30 text-xs text-center backdrop-blur-sm">
                    Напишіть перше повідомлення користувачу <span className="text-red-500 font-bold">{recipientUsername}</span>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === authUser?.id;
                  const avatar = isMe ? (profileUser?.avatarUrl || authUser?.avatarUrl) : currentHeader.avatarUrl;
                  return (
                    <div key={m.id} className={`flex gap-4 group animate-in fade-in slide-in-from-bottom-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-9 h-9 rounded-full bg-zinc-900 shrink-0 overflow-hidden border transition-all ${isMe ? 'border-red-500/50' : 'border-white/10'}`}>
                        {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/20">{isMe ? 'Я' : recipientUsername[0]}</div>}
                      </div>
                      <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${isMe ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-tr-none' : 'bg-zinc-900/80 text-white/90 rounded-tl-none border border-white/5'}`}>
                          {m.text}
                        </div>
                        <span className="text-[9px] font-black text-white/10 group-hover:text-white/30 transition-all uppercase tracking-widest">{new Date(m.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <div className="p-6 bg-black border-t border-white/5">
              <div className="max-w-4xl mx-auto flex gap-3 items-center">
                <div className="relative flex-1 group">
                  <input
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-red-600/50 focus:ring-1 focus:ring-red-600/50 outline-none transition-all placeholder:text-white/10"
                    placeholder="Ваше повідомлення..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                  />
                </div>
                <button
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                  disabled={!text.trim()}
                  onClick={send}
                >
                  <svg className="w-6 h-6 rotate-45 -translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l14-7-7 14-2-5-5-2z"/></svg>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};