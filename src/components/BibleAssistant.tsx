import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, Trash2, X, Mic, MicOff, Paperclip, FileText, FileImage, Loader2, Headphones, Play, Volume2, Mic2 } from 'lucide-react';
import { askBibleAssistant, generatePodcastDialogue, readAloud } from '../services/geminiService';
import { Announcement, EvangelismUnit, Committee, AttendanceSession } from '../types';

interface Message {
    role: 'user' | 'ai';
    text: string;
    attachmentName?: string;
}

interface AttachedFile {
    name: string;
    mimeType: string;
    data: string; // base64
}

interface Props {
    announcements: Announcement[];
    units: EvangelismUnit[];
    committees: Committee[];
    attendanceHistory: AttendanceSession[];
    currentVerse: any;
    currentPrayer: any;
    onSetPodcastAudio: (audio: AudioBuffer) => void;
}

const STORAGE_KEY = 'devac_celeste_chat_history_v2';

const BibleAssistant: React.FC<Props> = ({ announcements, units, committees, attendanceHistory, currentVerse, currentPrayer, onSetPodcastAudio }) => {
    const initialMessages: Message[] = [
        { role: 'ai', text: "Que la paix soit avec vous. Je suis **Céleste**, votre assistante intelligente DEVAC. J'ai accès à tout le registre des présences, aux informations des unités et aux annonces. Comment puis-je vous aider aujourd'hui ?" }
    ];

    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : initialMessages;
    });

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [voiceActionId, setVoiceActionId] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const toggleVoiceInput = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => { if (recognitionRef.current === recognition) setIsListening(false); };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleReadAloud = async (text: string, index: number) => {
        setVoiceActionId(`read-${index}`);
        try {
            const audio = await readAloud(text);
            if (audio) onSetPodcastAudio(audio);
        } finally {
            setVoiceActionId(null);
        }
    };

    const handleGeneratePodcast = async (text: string, index: number) => {
        setVoiceActionId(`podcast-${index}`);
        try {
            const audio = await generatePodcastDialogue(text);
            if (audio) onSetPodcastAudio(audio);
        } finally {
            setVoiceActionId(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                setAttachedFiles(prev => [...prev, { name: file.name, mimeType: file.type || 'application/octet-stream', data: base64 }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    const clearHistory = () => { if (confirm("Effacer l'historique ?")) setMessages(initialMessages); };

    const formatText = (text: string) => {
        return text.split('\n').map((line, lineIdx) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return <div key={lineIdx} className="h-2" />;
            const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('- ');
            const cleanLine = isBullet ? trimmedLine.replace(/^[•-]\s*/, '') : trimmedLine;
            const formattedParts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-indigo-100 font-bold">{part.slice(2, -2)}</strong>;
                return part;
            });
            return (
                <div key={lineIdx} className={`mb-1 flex items-start gap-2 ${isBullet ? 'pl-4' : ''}`}>
                    {isBullet && <span className="text-indigo-400 mt-1 shrink-0">•</span>}
                    <span className="flex-1">{formattedParts}</span>
                </div>
            );
        });
    };

    const generateRichContext = () => {
        let context = `--- RÉSUMÉ DU REGISTRE DES PRÉSENCES ---\n`;
        attendanceHistory.forEach(s => {
            context += `- Date: ${s.date}, Titre: "${s.title}", Effectif: ${s.attendees.length} présents.\n`;
        });

        context += `\n--- COMPOSITION DES UNITÉS ET COMITÉS ---\n`;
        [...units, ...committees].forEach(u => {
            context += `- ${u.name}: ${u.members.length} membres. Responsable: ${u.leaderName || 'Non défini'}.\n`;
            context += `  Membres: ${u.members.map(m => m.name).join(', ')}\n`;
        });

        context += `\n--- DERNIÈRES ANNONCES ---\n`;
        announcements.slice(0, 3).forEach(a => {
            context += `- ${a.title}: ${a.content.substring(0, 100)}...\n`;
        });

        context += `\n--- APP STRUCTURE ---\nSections: Accueil (Anniversaires, Versets, Prières, Assistant), Unités & Comités (Fiches techniques, Rapports, Trésorerie), Présences (Pointage quotidien), Actu (Tableau d'affichage), Chat.`;

        return context;
    };

    const handleSend = async () => {
        if ((!input.trim() && attachedFiles.length === 0) || loading) return;
        const userMsg = input || "Analyse de fichiers";
        const currentFiles = [...attachedFiles];
        setInput(''); setAttachedFiles([]);
        setMessages(prev => [...prev, { role: 'user', text: userMsg, attachmentName: currentFiles.map(f => f.name).join(', ') }]);
        setLoading(true);

        const context = generateRichContext();
        const history = messages.map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: m.text }]
        }));

        const aiResponse = await askBibleAssistant(
            userMsg,
            context,
            history,
            currentFiles.map(f => ({ mimeType: f.mimeType, data: f.data }))
        );

        setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
        setLoading(false);
    };

    return (
        <div className="bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col h-[750px] lg:h-[calc(100vh-12rem)] min-h-[600px] overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-800/40 backdrop-blur-md flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-indigo-500/10"><Sparkles size={24} className="text-white" /></div>
                    <div>
                        <h3 className="text-base font-black text-white leading-none">Céleste Assistant Pro</h3>
                        <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em] mt-1.5 block">Gemini 3 Pro Powered</span>
                    </div>
                </div>
                <button onClick={clearHistory} className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-opacity-5">
                {messages.map((m, i) => (
                    <div key={i} className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                        <div className="flex flex-col gap-2 pt-2">
                            {m.role === 'ai' && (
                                <button onClick={() => handleReadAloud(m.text, i)} disabled={voiceActionId !== null} className={`p-3 rounded-2xl transition-all shadow-lg ${voiceActionId === `read-${i}` ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-800 text-indigo-400 hover:bg-slate-700 hover:text-white'}`} title="Lire">
                                    {voiceActionId === `read-${i}` ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={16} />}
                                </button>
                            )}
                        </div>
                        <div className={`relative max-w-[85%] p-6 rounded-[2.2rem] text-[13px] leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800/90 text-slate-300 rounded-tl-none border border-slate-700/50 backdrop-blur-sm'}`}>
                            {formatText(m.text)}
                            {m.attachmentName && <div className="mt-3 pt-3 border-t border-white/10 text-[10px] italic opacity-60 flex items-center gap-2"><Paperclip size={10} /> {m.attachmentName}</div>}
                            {m.role === 'ai' && i > 0 && (
                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2"><Mic2 size={12} className="text-indigo-500" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Contenu Interactif</span></div>
                                    <button onClick={() => handleGeneratePodcast(m.text, i)} disabled={voiceActionId !== null} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-md ${voiceActionId === `podcast-${i}` ? 'bg-indigo-600 text-white animate-pulse' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-white'}`}>
                                        {voiceActionId === `podcast-${i}` ? <Loader2 size={12} className="animate-spin" /> : <Headphones size={12} />}
                                        Podcast Duo (M & S)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-1.5 ml-14">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                )}
            </div>

            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
                <div className="px-6 py-3 bg-slate-900/95 border-t border-white/5 flex gap-3 overflow-x-auto no-scrollbar">
                    {attachedFiles.map((f, i) => (
                        <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-white/5 group relative">
                            <FileText size={14} className="text-indigo-400" />
                            <span className="text-[10px] text-white font-medium max-w-[100px] truncate">{f.name}</span>
                            <button onClick={() => removeFile(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-6 bg-slate-900/90 border-t border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 group">
                        <button onClick={() => fileInputRef.current?.click()} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-400 transition-colors"><Paperclip size={20} /></button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? "Écoute en cours..." : "Posez une question sur le registre ou DEVAC..."}
                            className={`w-full bg-slate-800/50 border border-slate-700/50 text-white text-[13px] pl-14 pr-14 py-5 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none shadow-inner ${isListening ? 'ring-2 ring-red-500/50 bg-red-500/5' : ''}`}
                        />
                        <button onClick={toggleVoiceInput} className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl transition-all shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-700 hover:text-indigo-400'}`}>{isListening ? <MicOff size={20} /> : <Mic size={20} />}</button>
                    </div>
                    <button onClick={handleSend} disabled={loading || (!input.trim() && attachedFiles.length === 0)} className="p-5 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-800"><Send size={24} /></button>
                </div>
            </div>
        </div>
    );
};

export default BibleAssistant;
