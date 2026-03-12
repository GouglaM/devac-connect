import React, { useState, useRef, useEffect } from 'react';
import { ADMIN_PASSWORD, generateId } from '../constants';
import { Announcement } from '../types';
import { Lock, Unlock, Plus, X, Megaphone, Mic, MicOff, StopCircle, Loader2, Image, Upload, Trash2, Settings, ChevronDown, ChevronUp, PenTool, LayoutTemplate, Paperclip, Palette, Eye, EyeOff, CheckCircle2, Database, RefreshCw, FileUp } from 'lucide-react';
import CreativeStudio from './CreativeStudio';
import { seedDatabase, importMembersFromCSV } from '../services/dataService';

interface AdminPanelProps {
    onAddAnnouncement: (announcement: Announcement) => void;
    isAdmin: boolean;
    setIsAdmin: (status: boolean) => void;
    onUpdateLogo: (logo: string | null) => void;
    currentLogo: string | null;
}

interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onAddAnnouncement, isAdmin, setIsAdmin, onUpdateLogo, currentLogo }) => {
    const [password, setPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<'announcements' | 'studio' | 'maintenance'>('announcements');
    const [isImporting, setIsImporting] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isIdentityVisible, setIsIdentityVisible] = useState(false);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [priority, setPriority] = useState<'normal' | 'high'>('normal');
    const [error, setError] = useState('');

    const [listeningField, setListeningField] = useState<'title' | 'content' | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const toggleVoiceInput = (field: 'title' | 'content') => {
        if (listeningField === field) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setListeningField(null);
            return;
        }
        if (recognitionRef.current) recognitionRef.current.stop();

        if (typeof window !== 'undefined') {
            const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
            const SpeechRecognitionApi = SpeechRecognition || webkitSpeechRecognition;
            if (!SpeechRecognitionApi) return;

            const recognition = new SpeechRecognitionApi();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'fr-FR';
            recognition.onstart = () => setListeningField(field);
            recognition.onend = () => { if (recognitionRef.current === recognition) setListeningField(null); };
            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                }
                if (finalTranscript) {
                    const updateFn = field === 'title' ? setTitle : setContent;
                    updateFn(prev => (prev && !prev.endsWith(' ') ? prev + ' ' : prev) + finalTranscript);
                }
            };
            recognitionRef.current = recognition;
            recognition.start();
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAdmin(true);
            setError('');
            setPassword('');
            setShowLoginPassword(false);
        }
        else setError('Mot de passe incorrect');
    };

    const handleLogout = () => {
        setIsAdmin(false); setIsFormOpen(false); setListeningField(null);
        setIsIdentityVisible(false); setActiveTab('announcements'); setAttachedImage(null);
        setShowLoginPassword(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        const newAnnouncement: Announcement = {
            id: generateId(), title, content, date: new Date().toISOString(),
            priority, image: attachedImage || undefined, category: priority === 'high' ? 'URGENT' : 'GENERAL'
        };
        onAddAnnouncement(newAnnouncement);
        setTitle(''); setContent(''); setAttachedImage(null); setPriority('normal');
        setIsFormOpen(false); setListeningField(null);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { alert("Image trop lourde (max 1Mo)."); return; }
            const reader = new FileReader();
            reader.onloadend = () => onUpdateLogo(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleAnnouncementImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 900 * 1024) { alert("L'image est trop volumineuse."); return; }
            const reader = new FileReader();
            reader.onloadend = () => setAttachedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsImporting(true);
            try {
                const count = await importMembersFromCSV(file);
                alert(`✅ Importation réussie : ${count} membres ajoutés !`);
            } catch (e) {
                alert("❌ Erreur lors de l'importation.");
            } finally {
                setIsImporting(false);
            }
        }
    };

    const handlePublishFromStudio = (image: string) => {
        setAttachedImage(image); setActiveTab('announcements'); setIsFormOpen(true);
        if (!title) setTitle("Nouvelle création graphique");
    };

    if (!isAdmin) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-slate-400" />
                    Espace Administrateur
                </h3>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative group">
                        <input
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Mot de passe unique"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title={showLoginPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                        >
                            {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium shadow-sm active:scale-[0.98]">
                        Se connecter
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-indigo-100 p-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-indigo-900 flex items-center gap-3 uppercase tracking-tighter">
                    <Settings className="w-5 h-5 text-indigo-500" />
                    Console Admin
                </h3>
                <button onClick={handleLogout} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Déconnexion</button>
            </div>

            <div className="flex gap-2 mb-8 bg-slate-50 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all
            ${activeTab === 'announcements' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Annonces
                </button>
                <button
                    onClick={() => setActiveTab('studio')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all
            ${activeTab === 'studio' ? 'bg-white text-fuchsia-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Studio
                </button>
                <button
                    onClick={() => setActiveTab('maintenance')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all
            ${activeTab === 'maintenance' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Maintenance
                </button>
            </div>

            {activeTab === 'studio' ? (
                <CreativeStudio onPublish={handlePublishFromStudio} />
            ) : activeTab === 'maintenance' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="text-amber-600" size={20} />
                            <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Base de Données</h4>
                        </div>
                        <p className="text-[11px] text-amber-800/70 mb-6 leading-relaxed">
                            Si les sections de l'application sont vides (Unités, Comités, etc.), vous pouvez restaurer les données par défaut.
                            <strong> Attention :</strong> cela peut écraser vos modifications manuelles.
                        </p>
                        <button
                            onClick={() => seedDatabase()}
                            className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/10 active:scale-95"
                        >
                            <RefreshCw size={14} /> Restaurer les données par défaut
                        </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileUp className="text-slate-600" size={20} />
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Importation de Membres</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">
                            Ajoutez massivement des membres à vos unités à partir d'un fichier CSV (Format: Nom;Unité;Type;Téléphone;Quartier;Profession).
                        </p>
                        <label className={`w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer
                            ${isImporting ? 'bg-slate-100 cursor-wait animate-pulse' : 'hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-indigo-600'}`}>
                            {isImporting ? <Loader2 className="animate-spin" size={14} /> : <FileUp size={14} />}
                            {isImporting ? "Importation en cours..." : "Choisir un fichier CSV"}
                            <input type="file" className="hidden" accept=".csv" onChange={handleImportCSV} disabled={isImporting} />
                        </label>
                    </div>
                </div>
            ) : (
                <>
                    {!isFormOpen ? (
                        <div className="space-y-6">
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="w-full py-10 border-2 border-dashed border-indigo-100 rounded-[1.5rem] flex flex-col items-center justify-center text-indigo-400 hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
                            >
                                <Plus className="w-10 h-10 mb-3 group-hover:scale-110 group-hover:rotate-90 transition-transform duration-300" />
                                <span className="font-black text-[10px] uppercase tracking-[0.2em]">Publier une annonce</span>
                            </button>

                            <div className="pt-6 border-t border-slate-50">
                                <button
                                    onClick={() => setIsIdentityVisible(!isIdentityVisible)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Palette size={16} className="text-indigo-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuration de l'identité</span>
                                    </div>
                                    {isIdentityVisible ? <EyeOff size={16} className="text-slate-300" /> : <Eye size={16} className="text-indigo-400" />}
                                </button>

                                {isIdentityVisible && (
                                    <div className="mt-4 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="relative group">
                                                <div className="h-28 w-28 rounded-full bg-[#3c3725] border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                                                    <img
                                                        src={currentLogo || "https://images.unsplash.com/photo-1635326445353-888915467417?q=80&w=200&auto=format&fit=crop"}
                                                        alt="Logo Preview"
                                                        className="w-full h-full object-cover scale-110"
                                                    />
                                                    {!currentLogo && (
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                            <CheckCircle2 size={24} className="text-amber-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <label className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 text-white rounded-full cursor-pointer shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95">
                                                    <Upload className="w-4 h-4" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                                </label>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    {currentLogo ? "Logo Personnalisé Actif" : "Logo Officiel DV Actif"}
                                                </p>
                                                <p className="text-[9px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                                                    Vous utilisez actuellement {currentLogo ? "votre propre logo" : "le logo officiel de la mission"}.
                                                </p>
                                            </div>

                                            {currentLogo && (
                                                <button
                                                    onClick={() => onUpdateLogo(null)}
                                                    className="flex items-center gap-2 px-5 py-2 bg-white text-indigo-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
                                                >
                                                    <Trash2 size={12} /> Réinitialiser au logo officiel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Rédaction d'annonce</h4>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-300 hover:text-slate-600"><X size={20} /></button>
                            </div>

                            {attachedImage && (
                                <div className="relative group rounded-2xl overflow-hidden border-2 border-indigo-100 h-32">
                                    <img src={attachedImage} alt="Attachement" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => setAttachedImage(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg hover:bg-red-600 transition-colors"><X size={14} /></button>
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full pl-4 pr-12 py-4 bg-slate-50 border rounded-2xl text-sm font-black uppercase tracking-tight focus:outline-none transition-all
                            ${listeningField === 'title' ? 'border-red-400 ring-4 ring-red-50 bg-red-50' : 'border-slate-100 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white'}`}
                                    placeholder="Titre de l'annonce..."
                                />
                                <button type="button" onClick={() => toggleVoiceInput('title')} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl ${listeningField === 'title' ? 'bg-red-500 text-white animate-pulse' : 'text-slate-300 hover:text-indigo-500'}`}><Mic size={18} /></button>
                            </div>

                            <div className="relative">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={4}
                                    className={`w-full pl-4 pr-12 py-4 bg-slate-50 border rounded-2xl text-sm font-medium focus:outline-none resize-none transition-all
                            ${listeningField === 'content' ? 'border-red-400 ring-4 ring-red-50 bg-red-50' : 'border-slate-100 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white'}`}
                                    placeholder="Détails importants..."
                                />
                                <button type="button" onClick={() => toggleVoiceInput('content')} className={`absolute right-3 top-4 p-2 rounded-xl ${listeningField === 'content' ? 'bg-red-500 text-white animate-pulse' : 'text-slate-300 hover:text-indigo-500'}`}><Mic size={18} /></button>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="radio" name="priority" checked={priority === 'normal'} onChange={() => setPriority('normal')} className="hidden" />
                                        <span className={`w-3 h-3 rounded-full border-2 transition-all ${priority === 'normal' ? 'bg-indigo-500 border-indigo-600 scale-125 shadow-lg shadow-indigo-200' : 'border-slate-300 bg-white'}`}></span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${priority === 'normal' ? 'text-indigo-900' : 'text-slate-400'}`}>Normale</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="radio" name="priority" checked={priority === 'high'} onChange={() => setPriority('high')} className="hidden" />
                                        <span className={`w-3 h-3 rounded-full border-2 transition-all ${priority === 'high' ? 'bg-red-500 border-red-600 scale-125 shadow-lg shadow-red-200' : 'border-slate-300 bg-white'}`}></span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${priority === 'high' ? 'text-red-700' : 'text-slate-400'}`}>Urgente</span>
                                    </label>
                                </div>

                                {!attachedImage && (
                                    <label className="cursor-pointer p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                        <Paperclip size={20} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAnnouncementImageUpload} />
                                    </label>
                                )}
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Megaphone size={16} /> Publier maintenant
                            </button>
                        </form>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminPanel;