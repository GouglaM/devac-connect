import React, { useState, useRef, useEffect } from 'react';
import { generateId } from '../constants';
import { Announcement } from '../types';
import { Lock, Unlock, Plus, X, Megaphone, Mic, MicOff, StopCircle, Loader2, Image, Upload, Trash2, Settings, ChevronDown, ChevronUp, PenTool, LayoutTemplate, Paperclip, Palette, Eye, EyeOff, CheckCircle2, Database, RefreshCw, FileUp, LogOut, AlertTriangle } from 'lucide-react';
import CreativeStudio from '../components/ai/CreativeStudio';
import { seedDatabase, importMembersFromCSV } from '../services/dataService';
import { authService } from '../services/authService';
import { ProtectedButton, AdminGate, ReadOnlyWrapper } from '../components/ui/ProtectedComponents';
import { rbacValidator, getPermissionErrorMessage } from '../services/rbacValidator';

interface AdminPanelProps {
    onAddAnnouncement: (announcement: Announcement) => void;
    onUpdateLogo: (logo: string | null) => void;
    currentLogo: string | null;
    onLogout: () => void;
}

interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onAddAnnouncement, onUpdateLogo, currentLogo, onLogout }) => {
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

    const handleLogout = () => {
        onLogout();
        setIsFormOpen(false); setListeningField(null);
        setIsIdentityVisible(false); setActiveTab('announcements'); setAttachedImage(null);
        setShowLoginPassword(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            // Valider la permission RBAC
            rbacValidator.validateCreateAnnouncement({
                id: generateId(),
                title: title,
                content: content,
                date: new Date().toISOString(),
                priority,
                category: priority === 'high' ? 'URGENT' : 'GENERAL'
            });
            
            if (!title.trim() || !content.trim()) {
                setError('Les champs titre et contenu sont obligatoires');
                return;
            }
            
            const newAnnouncement: Announcement = {
                id: generateId(), title, content, date: new Date().toISOString(),
                priority, image: attachedImage || undefined, category: priority === 'high' ? 'URGENT' : 'GENERAL'
            };
            onAddAnnouncement(newAnnouncement);
            setTitle(''); setContent(''); setAttachedImage(null); setPriority('normal');
            setIsFormOpen(false); setListeningField(null);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création de l\'annonce');
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { alert("Image trop lourde (max 1Mo)."); return; }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result && typeof reader.result === 'string') {
                    onUpdateLogo(reader.result);
                } else {
                    alert("Erreur lors de la lecture de l'image.");
                }
            };
            reader.onerror = () => alert("Erreur lors de la lecture de l'image.");
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

    return (
        <div className="min-h-screen bg-slate-900 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Settings className="w-6 h-6 text-indigo-400" />
                            Console Administrateur DEVAC
                        </h1>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                        </button>
                    </div>

                    <div className="flex gap-2 mb-8 bg-slate-700 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('announcements')}
                            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all
                    ${activeTab === 'announcements' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-slate-600'}`}
                        >
                            Annonces
                        </button>
                        <button
                            onClick={() => setActiveTab('studio')}
                            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all
                    ${activeTab === 'studio' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-slate-600'}`}
                        >
                            Studio Créatif
                        </button>
                        <button
                            onClick={() => setActiveTab('maintenance')}
                            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all
                    ${activeTab === 'maintenance' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-slate-600'}`}
                        >
                            Maintenance
                        </button>
                    </div>

            {activeTab === 'studio' ? (
                <CreativeStudio onPublish={handlePublishFromStudio} />
            ) : activeTab === 'maintenance' ? (
                <div className="space-y-6">
                    <div className="bg-slate-700 border border-slate-600 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="text-amber-400" size={20} />
                            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">Base de Données</h4>
                        </div>
                        <p className="text-slate-300 mb-6 leading-relaxed text-sm">
                            Si les sections de l'application sont vides (Unités, Comités, etc.), vous pouvez restaurer les données par défaut.
                            <strong className="text-amber-300"> Attention :</strong> cela peut écraser vos modifications manuelles.
                        </p>
                        <button
                            onClick={() => seedDatabase()}
                            className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium text-sm transition-all shadow-lg active:scale-95"
                        >
                            <RefreshCw size={16} /> Restaurer les données par défaut
                        </button>
                    </div>

                    <div className="bg-slate-700 border border-slate-600 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileUp className="text-slate-400" size={20} />
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Importation de Membres</h4>
                        </div>
                        <p className="text-slate-400 mb-6 leading-relaxed text-sm">
                            Ajoutez massivement des membres à vos unités à partir d'un fichier CSV (Format: Nom;Unité;Type;Téléphone;Quartier;Profession).
                        </p>
                        <label className={`w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-500 py-3 rounded-lg font-medium text-sm transition-all cursor-pointer
                            ${isImporting ? 'bg-slate-600 cursor-wait animate-pulse text-slate-300' : 'hover:bg-indigo-900/20 hover:border-indigo-400 text-slate-400 hover:text-indigo-300'}`}>
                            {isImporting ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
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
                                className="w-full py-12 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-700 hover:border-indigo-400 hover:text-indigo-300 transition-all group"
                            >
                                <Plus className="w-12 h-12 mb-4 group-hover:scale-110 group-hover:rotate-90 transition-transform duration-300" />
                                <span className="font-bold text-sm uppercase tracking-wide">Publier une annonce</span>
                            </button>

                            <div className="pt-6 border-t border-slate-600">
                                <button
                                    onClick={() => setIsIdentityVisible(!isIdentityVisible)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Palette size={18} className="text-indigo-400" />
                                        <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">Configuration de l'identité</span>
                                    </div>
                                    {isIdentityVisible ? <EyeOff size={18} className="text-slate-400" /> : <Eye size={18} className="text-indigo-400" />}
                                </button>

                                {isIdentityVisible && (
                                    <div className="mt-4 bg-slate-700 p-6 rounded-xl border border-slate-600">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="relative group">
                                                <div className="h-32 w-32 rounded-full bg-slate-600 border-4 border-slate-500 shadow-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
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
                                                <label className="absolute bottom-0 right-0 p-3 bg-indigo-600 text-white rounded-full cursor-pointer shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95">
                                                    <Upload className="w-5 h-5" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                                </label>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                                                    {currentLogo ? "Logo Personnalisé Actif" : "Logo Officiel DV Actif"}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                                                    Vous utilisez actuellement {currentLogo ? "votre propre logo" : "le logo officiel de la mission"}.
                                                </p>
                                            </div>

                                            {currentLogo && (
                                                <button
                                                    onClick={() => onUpdateLogo(null)}
                                                    className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-slate-300 rounded-xl text-sm font-medium border border-slate-500 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 size={16} /> Réinitialiser au logo officiel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-bold text-slate-300 uppercase tracking-wide">Rédaction d'annonce</h4>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-700 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {attachedImage && (
                                <div className="relative group rounded-xl overflow-hidden border-2 border-slate-600 h-40">
                                    <img src={attachedImage} alt="Attachement" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => setAttachedImage(null)} className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full pl-4 pr-12 py-4 bg-slate-700 border rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all text-sm
                            ${listeningField === 'title' ? 'border-red-400 ring-4 ring-red-900/20 bg-red-900/10' : 'border-slate-600 focus:ring-4 focus:ring-indigo-500/20 focus:bg-slate-600'}`}
                                    placeholder="Titre de l'annonce..."
                                />
                                <button type="button" onClick={() => toggleVoiceInput('title')} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg ${listeningField === 'title' ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-600'}`}>
                                    <Mic size={20} />
                                </button>
                            </div>

                            <div className="relative">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={5}
                                    className={`w-full pl-4 pr-12 py-4 bg-slate-700 border rounded-xl text-white placeholder-slate-400 focus:outline-none resize-none transition-all text-sm
                            ${listeningField === 'content' ? 'border-red-400 ring-4 ring-red-900/20 bg-red-900/10' : 'border-slate-600 focus:ring-4 focus:ring-indigo-500/20 focus:bg-slate-600'}`}
                                    placeholder="Détails importants..."
                                />
                                <button type="button" onClick={() => toggleVoiceInput('content')} className={`absolute right-3 top-4 p-2 rounded-lg ${listeningField === 'content' ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-600'}`}>
                                    <Mic size={20} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="priority" checked={priority === 'normal'} onChange={() => setPriority('normal')} className="hidden" />
                                        <span className={`w-4 h-4 rounded-full border-2 transition-all ${priority === 'normal' ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/20' : 'border-slate-500 bg-slate-700'}`}></span>
                                        <span className={`text-sm font-medium ${priority === 'normal' ? 'text-indigo-300' : 'text-slate-400'}`}>Normale</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="priority" checked={priority === 'high'} onChange={() => setPriority('high')} className="hidden" />
                                        <span className={`w-4 h-4 rounded-full border-2 transition-all ${priority === 'high' ? 'bg-red-500 border-red-400 scale-110 shadow-lg shadow-red-500/20' : 'border-slate-500 bg-slate-700'}`}></span>
                                        <span className={`text-sm font-medium ${priority === 'high' ? 'text-red-300' : 'text-slate-400'}`}>Urgente</span>
                                    </label>
                                </div>

                                {!attachedImage && (
                                    <label className="cursor-pointer p-3 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 rounded-lg transition-all">
                                        <Paperclip size={24} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAnnouncementImageUpload} />
                                    </label>
                                )}
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold uppercase tracking-wide text-sm shadow-xl shadow-indigo-900/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                <Megaphone size={20} /> Publier maintenant
                            </button>
                        </form>
                    )}
                </>
            )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;