import React, { useState, useEffect } from 'react';
import { Send, User, MessageCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { subscribeToChat, sendMessageToDB } from '../services/dataService';

const CommunityChat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [nickname, setNickname] = useState(() => localStorage.getItem('chat_nickname') || '');

    useEffect(() => {
        const unsub = subscribeToChat(setMessages);
        return () => unsub();
    }, []);

    const sendMessage = () => {
        if (!input.trim()) return;

        let currentName = nickname;
        if (!currentName) {
            const prompted = prompt("Entrez un pseudonyme pour discuter :");
            if (!prompted) return;
            currentName = prompted;
            setNickname(currentName);
            localStorage.setItem('chat_nickname', currentName);
        }

        const msg: ChatMessage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            sender: currentName,
            text: input,
            timestamp: Date.now()
        };
        sendMessageToDB(msg);
        setInput('');
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[70vh] max-w-2xl mx-auto overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <MessageCircle size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800">Chat Communautaire</h2>
                    <p className="text-xs text-slate-500">Partagez vos témoignages et encouragements</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <MessageCircle size={48} className="opacity-20" />
                        <p className="italic text-sm">Soyez le premier à envoyer un message !</p>
                    </div>
                ) : (
                    messages.map(m => (
                        <div key={m.id} className={`flex gap-3 ${m.sender === 'Moi' ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                                <User size={16} />
                            </div>
                            <div className={`p-3 rounded-2xl text-sm ${m.sender === 'Moi' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'
                                }`}>
                                <div className="text-[10px] font-bold opacity-70 mb-1">{m.sender}</div>
                                {m.text}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="Écrivez un message d'encouragement..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommunityChat;
