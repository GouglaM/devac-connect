import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, User, MessageCircle, Mic, Square, Play, Pause, Trash2, Users, Search, ChevronRight, X, Smile, Shield, RefreshCcw, Phone, Video } from 'lucide-react';
import { ChatMessage, EvangelismUnit, Committee, Member } from '../types';
import { subscribeToChat, sendMessageToDB, deleteMessageFromDB, subscribeToUnits, subscribeToCommittees } from '../services/dataService';

const CommunityChat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [nickname, setNickname] = useState(() => localStorage.getItem('chat_nickname_v2') || '');
    const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('chat_user_id_v2') || '');
    const [recipient, setRecipient] = useState<{ id: string, name: string } | null>(null);
    const [units, setUnits] = useState<EvangelismUnit[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const [showIdentModal, setShowIdentModal] = useState(false);
    const [tempNick, setTempNick] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initialize User logic
    useEffect(() => {
        if (!currentUserId && units.length > 0) {
            setShowIdentModal(true);
        }
    }, [currentUserId, units]);

    const handleIdentify = (selectedName: string) => {
        const normalizedNick = selectedName.trim().toUpperCase();
        let foundId = '';

        // Detect if this is a known member
        units.forEach(u => u.members.forEach(m => {
            if (m.name.trim().toUpperCase() === normalizedNick) foundId = m.id;
        }));
        if (!foundId) {
            committees.forEach(c => c.members.forEach(m => {
                if (m.name.trim().toUpperCase() === normalizedNick) foundId = m.id;
            }));
        }

        const newId = foundId || 'u_' + Date.now();
        setNickname(selectedName);
        setCurrentUserId(newId);
        localStorage.setItem('chat_nickname_v2', selectedName);
        localStorage.setItem('chat_user_id_v2', newId);
        setShowIdentModal(false);
        console.log(`[Chat] Identified as: ${selectedName} (ID: ${newId})`);
    };

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

    // Process Contacts with last message preview
    const contacts = useMemo(() => {
        const all: { id: string, name: string, type: string, lastMessage?: string, lastTime?: number }[] = [];
        const processGroup = (members: Member[], groupName: string) => {
            members.forEach(m => {
                if (m.id !== currentUserId && !all.find(a => a.id === m.id)) {
                    // Find last bilateral message
                    const lastMsg = messages
                        .filter(msg => (msg.sender === currentUserId && msg.recipientId === m.id) || (msg.sender === m.id && msg.recipientId === currentUserId))
                        .sort((a, b) => b.timestamp - a.timestamp)[0];

                    all.push({
                        id: m.id,
                        name: m.name,
                        type: groupName,
                        lastMessage: lastMsg?.text || (lastMsg?.type === 'audio' ? '🎵 Message vocal' : ''),
                        lastTime: lastMsg?.timestamp
                    });
                }
            });
        };

        processGroup(units.flatMap(u => u.members), 'Unité');
        processGroup(committees.flatMap(c => c.members), 'Comité');

        return all
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => (b.lastTime || 0) - (a.lastTime || 0));
    }, [units, committees, currentUserId, searchTerm, messages]);

    // Derived Messages for current view
    const visibleMessages = useMemo(() => {
        console.log(`[Chat] Recalculating visibleMessages. CurrentUser: ${currentUserId}, Recipient: ${recipient?.id || 'Public'}, Total Messages: ${messages.length}`);
        if (!recipient) {
            // Public view: only messages with recipientId === 'ALL' or !recipientId
            return messages.filter(m => !m.recipientId || m.recipientId === 'ALL');
        } else {
            // Private view: Only bilateral exchange between ME and HIM
            const filtered = messages.filter(m =>
                (m.sender === currentUserId && m.recipientId === recipient.id) ||
                (m.sender === recipient.id && m.recipientId === currentUserId)
            );
            console.log(`[Chat] Filtered bilateral: ${filtered.length} messages.`);
            return filtered;
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

        console.log(`[Chat] Sending ${type} message to ${recipient?.id || 'ALL'}. Sender ID: ${currentUserId}`);
        sendMessageToDB(msg)
            .then(() => {
                console.log("[Chat] Message sent successfully!");
                if (type === 'text') setInput('');
            })
            .catch(err => {
                console.error("[Chat] Failed to send:", err);
                alert("Erreur lors de l'envoi : " + err.message);
            });
    };

    const forceRefresh = () => {
        setMessages([]);
        console.log("[Chat] Force refresh triggered. Messages cleared.");
    };

    const handleResetChat = () => {
        if (window.confirm("Voulez-vous réinitialiser votre identité de chat ? (Cela vous demandera votre nom à nouveau)")) {
            localStorage.removeItem('chat_nickname_v2');
            localStorage.removeItem('chat_user_id_v2');
            window.location.reload();
        }
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
                {/* Contacts Search & Filters */}
                <div className="p-4 bg-white/50 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-black text-slate-800 text-xl flex-1">Discussions</h3>
                        <div className="flex gap-1">
                            <button className="p-2 hover:bg-white rounded-lg text-slate-400" onClick={forceRefresh} title="Actualiser les messages"><RefreshCcw size={18} /></button>
                            <button className="p-2 hover:bg-white rounded-lg text-slate-400" onClick={handleResetChat} title="Changer de compte"><User size={18} /></button>
                        </div>
                    </div>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher ou démarrer une discussion"
                            className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-wider">Toutes</button>
                        <button className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-wider">Non lues</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white">
                    <button
                        onClick={() => setRecipient(null)}
                        className={`w-full flex items-center gap-4 p-4 transition-all border-b border-slate-50 ${!recipient ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                    >
                        <div className="relative flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${!recipient ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                <Users size={20} />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <div className="font-bold text-slate-800 truncate">Tout le monde</div>
                                {messages.filter(m => !m.recipientId || m.recipientId === 'ALL').sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp && (
                                    <div className="text-[10px] text-slate-400">
                                        {new Date(messages.filter(m => !m.recipientId || m.recipientId === 'ALL').sort((a, b) => b.timestamp - a.timestamp)[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="text-[11px] text-slate-400 truncate flex-1 leading-none">
                                    {messages.filter(m => !m.recipientId || m.recipientId === 'ALL').sort((a, b) => b.timestamp - a.timestamp)[0]?.text || 'Chat public'}
                                </div>
                            </div>
                        </div>
                    </button>

                    {contacts.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setRecipient({ id: c.id, name: c.name })}
                            className={`w-full flex items-center gap-4 p-4 transition-all border-b border-slate-50 ${recipient?.id === c.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                        >
                            <div className="relative flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${recipient?.id === c.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {c.name.charAt(0)}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <div className="font-bold text-slate-800 truncate">{c.name}</div>
                                    {c.lastTime && (
                                        <div className="text-[10px] text-slate-400">
                                            {new Date(c.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="text-[11px] text-slate-400 truncate flex-1 leading-none">{c.lastMessage || c.type}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#efeae2] overflow-hidden relative">
                {/* Header Style WhatsApp */}
                <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between bg-slate-50/95 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-slate-50 rounded-xl lg:hidden">
                            <ChevronRight size={20} className="text-slate-400" />
                        </button>
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                                {recipient ? recipient.name.charAt(0) : <Users size={20} />}
                            </div>
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="leading-tight">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-slate-800 text-[15px]">
                                    {recipient ? recipient.name : 'Groupe Public'}
                                </h2>
                                <span className="text-[10px] text-slate-300 font-mono">v3.0</span>
                                {recipient && (
                                    <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                        Privé
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                                {recipient ? 'en ligne aujourd\'hui' : 'Public - Tous les membres'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 text-slate-500 pr-2">
                        <button className="p-2 hover:bg-slate-100 rounded-full cursor-not-allowed opacity-40"><Phone size={20} /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-full cursor-not-allowed opacity-40"><Video size={20} /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-full cursor-not-allowed opacity-40"><Smile size={20} /></button>
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
                                <div key={m.id} className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`relative max-w-[80%] px-3 py-2 rounded-lg shadow-sm ${isMe
                                        ? 'bg-[#dcf8c6] rounded-br-none'
                                        : 'bg-white rounded-bl-none border border-slate-100'
                                        }`}>
                                        {!isMe && !recipient && (
                                            <div className="text-[10px] font-bold text-emerald-600 mb-1 leading-none uppercase">{m.senderName}</div>
                                        )}

                                        {m.type === 'audio' ? (
                                            <div className="flex items-center gap-2 min-w-[200px] py-1">
                                                <div className={`p-1.5 rounded-full ${isMe ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                                                    <Play size={14} className="text-emerald-600" />
                                                </div>
                                                <audio controls className="h-6 max-w-[140px] opacity-70" src={m.audioUrl}></audio>
                                            </div>
                                        ) : (
                                            <div className="text-[14px] whitespace-pre-wrap leading-tight text-slate-800">{m.text}</div>
                                        )}

                                        <div className="flex items-center justify-end gap-1 mt-1 leading-none">
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && (
                                                <div className="flex leading-none text-emerald-500">
                                                    <span className="text-[8px]">✓</span>
                                                    <span className="text-[8px] -ml-1">✓</span>
                                                </div>
                                            )}
                                        </div>

                                        {isMe && (
                                            <button
                                                onClick={() => handleDelete(m.id)}
                                                className={`absolute ${isMe ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input WhatsApp */}
                <div className="px-4 py-3 bg-slate-50 flex items-center gap-3 border-t border-slate-200">
                    <div className="flex gap-2 text-slate-500">
                        <button className="p-2 hover:bg-slate-200 rounded-full"><Smile size={24} /></button>
                        <div className="p-2 hover:bg-slate-200 rounded-full cursor-not-allowed opacity-40 leading-none text-2xl font-light">+</div>
                    </div>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Taper un message"
                            className="w-full bg-white border-none rounded-2xl px-4 py-2.5 text-[15px] outline-none shadow-sm focus:ring-1 focus:ring-emerald-500"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        {input.trim() ? (
                            <button
                                onClick={() => sendMessage()}
                                className="w-11 h-11 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all"
                            >
                                <Send size={20} className="ml-0.5" />
                            </button>
                        ) : (
                            <button
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                                className={`w-11 h-11 ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'} text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all`}
                            >
                                {isRecording ? <Square size={18} fill="white" /> : <Mic size={20} />}
                            </button>
                        )}
                    </div>
                </div>
                {isRecording && <p className="text-center text-[10px] text-rose-500 font-bold mt-2 animate-bounce">Relâchez pour envoyer</p>}
            </div>
            {/* Identification Modal Overlay */}
            {showIdentModal && (
                <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                <User size={32} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 text-center mb-2">Bienvenue sur le Chat</h2>
                        <p className="text-slate-500 text-center text-sm mb-8">Veuillez entrer votre nom pour commencer à discuter avec vos collaborateurs.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Votre Nom Complet</label>
                                <input
                                    type="text"
                                    value={tempNick}
                                    onChange={e => setTempNick(e.target.value)}
                                    placeholder="Ex: MARCELLIN GOUGLA"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all font-bold text-slate-700"
                                    onKeyPress={e => e.key === 'Enter' && tempNick.trim() && handleIdentify(tempNick)}
                                />
                            </div>

                            <button
                                onClick={() => tempNick.trim() && handleIdentify(tempNick)}
                                disabled={!tempNick.trim()}
                                className="w-full bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                COMMENCER
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest leading-loose">
                                Recommandé : Utilisez votre nom complet tel qu'il figure dans la liste des membres pour retrouver vos conversations privées.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityChat;
