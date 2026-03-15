import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, User, MessageCircle, Mic, Square, Play, Pause, Trash2, Users, Search, ChevronRight, X, Smile, Shield } from 'lucide-react';
import { ChatMessage, EvangelismUnit, Committee, Member } from '../types';
import { subscribeToChat, sendMessageToDB, deleteMessageFromDB, subscribeToUnits, subscribeToCommittees } from '../services/dataService';

const CommunityChat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [nickname, setNickname] = useState(() => localStorage.getItem('chat_nickname') || '');
    const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('chat_user_id') || '');
    const [recipient, setRecipient] = useState<{ id: string, name: string } | null>(null);
    const [units, setUnits] = useState<EvangelismUnit[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initialize User
    useEffect(() => {
        if (!currentUserId) {
            const prompted = prompt("Entrez votre nom complet pour le chat :");
            if (prompted) {
                const newId = 'u_' + Date.now();
                setNickname(prompted);
                setCurrentUserId(newId);
                localStorage.setItem('chat_nickname', prompted);
                localStorage.setItem('chat_user_id', newId);
            }
        }
    }, [currentUserId]);

    // Subscriptions
    useEffect(() => {
        const unsubChat = subscribeToChat(setMessages, currentUserId);
        const unsubUnits = subscribeToUnits(setUnits);
        const unsubComms = subscribeToCommittees(setCommittees);
        return () => {
            unsubChat();
            unsubUnits();
            unsubComms();
        };
    }, [currentUserId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Process Contacts
    const contacts = useMemo(() => {
        const all: { id: string, name: string, type: string }[] = [];
        units.forEach(u => u.members.forEach(m => {
            if (m.id !== currentUserId) all.push({ id: m.id, name: m.name, type: u.name });
        }));
        committees.forEach(c => c.members.forEach(m => {
            if (m.id !== currentUserId && !all.find(a => a.id === m.id)) {
                all.push({ id: m.id, name: m.name, type: c.name });
            }
        }));
        return all.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [units, committees, currentUserId, searchTerm]);

    // Derived Messages for current view
    const visibleMessages = useMemo(() => {
        if (!recipient) {
            // Public view: only messages with recipientId === 'ALL' or !recipientId
            return messages.filter(m => !m.recipientId || m.recipientId === 'ALL');
        } else {
            // Private view: Only bilateral exchange between ME and HIM
            return messages.filter(m =>
                (m.sender === currentUserId && m.recipientId === recipient.id) ||
                (m.sender === recipient.id && m.recipientId === currentUserId)
            );
        }
    }, [messages, recipient, currentUserId]);

    const sendMessage = (type: 'text' | 'audio' = 'text', content?: string) => {
        if (type === 'text' && !input.trim()) return;

        const msg: ChatMessage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            sender: currentUserId,
            senderName: nickname,
            recipientId: recipient?.id || 'ALL',
            text: type === 'text' ? input : undefined,
            audioUrl: type === 'audio' ? content : undefined,
            type,
            timestamp: Date.now()
        };

        sendMessageToDB(msg);
        if (type === 'text') setInput('');
    };

    // Audio Recording Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result as string;
                    sendMessage('audio', base64Audio);
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Impossible d'accéder au micro.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("Supprimer ce message ?")) {
            deleteMessageFromDB(id);
        }
    };

    return (
        <div className="flex bg-white rounded-3xl shadow-2xl border border-slate-100 h-[85vh] max-w-5xl mx-auto overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Sidebar */}
            <div className={`${showSidebar ? 'w-80' : 'w-0'} border-r border-slate-50 transition-all duration-300 flex flex-col bg-slate-50/30 overflow-hidden`}>
                <div className="p-6">
                    <h3 className="font-black text-slate-800 text-xl mb-4">Contacts</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
                    <button
                        onClick={() => setRecipient(null)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${!recipient ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-white text-slate-600'}`}
                    >
                        <Users size={20} />
                        <div className="text-left">
                            <div className="font-bold text-sm">Tout le monde</div>
                            <div className={`text-[10px] ${!recipient ? 'text-indigo-100' : 'text-slate-400'}`}>Chat public</div>
                        </div>
                    </button>

                    <div className="py-4 px-2 uppercase text-[10px] font-black text-slate-400 tracking-widest">Collaborateurs</div>

                    {contacts.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setRecipient({ id: c.id, name: c.name })}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${recipient?.id === c.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-white text-slate-600'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${recipient?.id === c.id ? 'bg-indigo-500' : 'bg-slate-200 text-slate-500'}`}>
                                {c.name.charAt(0)}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <div className="font-bold text-sm truncate">{c.name}</div>
                                <div className={`text-[10px] truncate ${recipient?.id === c.id ? 'text-indigo-100' : 'text-slate-400'}`}>{c.type}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-slate-50 rounded-xl lg:hidden">
                            <Users size={20} className="text-slate-400" />
                        </button>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${recipient ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                            {recipient ? <User size={24} /> : <Users size={24} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-slate-800 text-lg leading-tight">
                                    {recipient ? recipient.name : 'Chat Communautaire'}
                                </h2>
                                <span className="text-[10px] text-slate-300 font-mono">v2.1</span>
                                {recipient && (
                                    <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                        Privé
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${recipient ? 'bg-indigo-400' : 'bg-green-400'}`}></span>
                                {recipient ? 'Discussion 1-à-1 sécurisée' : 'Public - Tous les membres'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {visibleMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                            <div className="p-8 bg-slate-50 rounded-full animate-pulse">
                                <MessageCircle size={64} className="opacity-10" />
                            </div>
                            <p className="italic text-sm font-medium">Commencez la conversation...</p>
                        </div>
                    ) : (
                        visibleMessages.map((m, idx) => {
                            const isMe = m.sender === currentUserId;
                            if (m.deleted) return null;

                            return (
                                <div key={m.id} className={`flex gap-3 group ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm flex-shrink-0 mt-1 ${isMe ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {m.senderName?.charAt(0) || 'U'}
                                    </div>
                                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-start' : 'items-end'}`}>
                                        <div className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all group-hover:shadow-md ${isMe
                                            ? 'bg-indigo-600 text-white rounded-tl-none'
                                            : 'bg-slate-100 text-slate-700 rounded-tr-none border border-slate-200'
                                            }`}>
                                            {m.type === 'audio' ? (
                                                <div className="flex items-center gap-3 min-w-[200px]">
                                                    <div className={`p-2 rounded-full ${isMe ? 'bg-indigo-500' : 'bg-white'}`}>
                                                        <Play size={16} className={isMe ? 'text-white' : 'text-indigo-600'} />
                                                    </div>
                                                    <audio controls className="h-8 max-w-[150px] brightness-110 contrast-125" src={m.audioUrl}></audio>
                                                </div>
                                            ) : (
                                                <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</div>
                                            )}

                                            {isMe && (
                                                <button
                                                    onClick={() => handleDelete(m.id)}
                                                    className={`absolute ${isMe ? '-right-10' : '-left-10'} top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all`}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{m.senderName}</span>
                                            <span className="text-[9px] text-slate-400 font-medium opacity-60">
                                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-slate-50">
                    {recipient && (
                        <div className="mb-3 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                                <Shield size={10} /> Message privé pour {recipient.name}
                            </span>
                            <button onClick={() => setRecipient(null)} className="text-indigo-400 hover:text-indigo-600">
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-100 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all">
                        <button className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Smile size={24} />
                        </button>

                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none px-2 py-3 text-sm focus:ring-0 outline-none text-slate-700"
                            placeholder={isRecording ? "Enregistrement en cours..." : "Écrivez votre message..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            disabled={isRecording}
                        />

                        {input.trim() ? (
                            <button
                                onClick={() => sendMessage('text')}
                                className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200"
                            >
                                <Send size={20} />
                            </button>
                        ) : (
                            <button
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                                className={`p-4 rounded-2xl transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                            >
                                {isRecording ? <Square size={20} /> : <Mic size={20} />}
                            </button>
                        )}
                    </div>
                    {isRecording && <p className="text-center text-[10px] text-rose-500 font-bold mt-2 animate-bounce">Relâchez pour envoyer</p>}
                </div>
            </div>
        </div>
    );
};

export default CommunityChat;
