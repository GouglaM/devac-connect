import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    FileText, File, FileImage, FileSpreadsheet, FileArchive, Search,
    Plus, Download, Trash2, Eye, X, Upload, Filter, Calendar, HardDrive,
    Grid, List, MoreVertical, FileDown, CheckCircle2, Loader2, Info,
    AlertCircle, CheckCircle, Table, Type as TypeIcon, Globe, Sparkles,
    Send, BrainCircuit, ListChecks, MessageSquareText, HelpCircle, ArrowRight,
    Clipboard, Copy, Check
} from 'lucide-react';
import { UnitFile } from '../../types';
import { askBibleAssistant } from '../../services/geminiService';
import { generateId } from '../../constants';

interface Props {
    documents: UnitFile[];
    onUpload: (doc: UnitFile) => void;
    onDelete: (id: string) => void;
    isAdmin: boolean;
}

const CATEGORIES = [
    { id: 'ALL', label: 'Tous les fichiers', color: 'bg-slate-500', text: 'text-slate-400' },
    { id: 'LISTE', label: 'Listes de membres', color: 'bg-indigo-600', text: 'text-indigo-500' },
    { id: 'RAPPORT', label: 'Rapports d\'activité', color: 'bg-emerald-600', text: 'text-emerald-500' },
    { id: 'GUIDE', label: 'Guides Spirituels', color: 'bg-amber-600', text: 'text-amber-500' },
    { id: 'AUTRE', label: 'Autres documents', color: 'bg-slate-600', text: 'text-slate-400' }
];

const b64DecodeUnicode = (str: string) => {
    try {
        return decodeURIComponent(atob(str).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        return atob(str);
    }
};

/**
 * Simple Markdown-to-HTML parser for structured AI responses
 */
const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-4" />;

        // Titres
        if (trimmed.startsWith('### ')) return <h3 key={idx} className="text-white font-black uppercase tracking-tighter text-lg mt-6 mb-3 border-b border-white/10 pb-2">{trimmed.slice(4)}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={idx} className="text-indigo-400 font-black uppercase tracking-tighter text-xl mt-8 mb-4 border-b border-indigo-500/20 pb-2">{trimmed.slice(3)}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={idx} className="text-white font-black uppercase tracking-tighter text-2xl mt-10 mb-6">{trimmed.slice(2)}</h1>;

        // Listes
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
                <div key={idx} className="flex gap-3 ml-2 mb-2">
                    <span className="text-indigo-500 font-bold mt-1">•</span>
                    <span className="text-slate-300 font-medium leading-relaxed">{parseInline(trimmed.slice(2))}</span>
                </div>
            );
        }

        // Paragraphes normaux
        return <p key={idx} className="text-slate-400 font-medium leading-relaxed mb-4 text-sm">{parseInline(line)}</p>;
    });
};

const parseInline = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="text-indigo-300 font-black">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const DocumentLibrary: React.FC<Props> = ({ documents, onUpload, onDelete, isAdmin }) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [previewDoc, setPreviewDoc] = useState<UnitFile | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // AI State in Preview
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const aiScrollRef = useRef<HTMLDivElement>(null);

    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
            const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
            return matchesSearch && matchesCat;
        });
    }, [documents, search, selectedCategory]);

    useEffect(() => {
        if (aiScrollRef.current) {
            aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
        }
    }, [aiHistory, aiLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            setNotification({ type: 'error', message: 'Le fichier est trop volumineux (Max 3Mo).' });
            setTimeout(() => setNotification(null), 5000);
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const base64 = (reader.result as string).split(',')[1];
                const targetCategory = selectedCategory === 'ALL' ? 'AUTRE' : selectedCategory as any;
                const newDoc: UnitFile = {
                    id: generateId(),
                    name: file.name,
                    mimeType: file.type || (file.name.endsWith('.html') ? 'text/html' : file.name.endsWith('.csv') ? 'text/csv' : 'text/plain'),
                    data: base64,
                    size: file.size,
                    date: new Date().toISOString(),
                    category: targetCategory
                };
                onUpload(newDoc);
                setNotification({ type: 'success', message: `Fichier "${file.name}" enregistré avec succès.` });
                setTimeout(() => setNotification(null), 4000);
            } catch (err) {
                setNotification({ type: 'error', message: "Erreur lors de l'enregistrement." });
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAiAsk = async (query: string) => {
        if (!previewDoc || (!query.trim() && !aiInput.trim()) || aiLoading) return;

        const userPrompt = query || aiInput;
        setAiHistory(prev => [...prev, { role: 'user', text: userPrompt }]);
        setAiInput('');
        setAiLoading(true);

        try {
            let documentContext = `DOCUMENT EN COURS : "${previewDoc.name}" (${previewDoc.mimeType})\n\n`;

            if (!previewDoc.mimeType.includes('pdf')) {
                documentContext += "CONTENU TEXTUEL :\n" + b64DecodeUnicode(previewDoc.data);
            }

            const attachments = previewDoc.mimeType.includes('pdf')
                ? [{ mimeType: previewDoc.mimeType, data: previewDoc.data }]
                : [];

            const response = await askBibleAssistant(
                userPrompt,
                documentContext,
                aiHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
                attachments
            );

            setAiHistory(prev => [...prev, { role: 'ai', text: response }]);
        } catch (err) {
            setAiHistory(prev => [...prev, { role: 'ai', text: "### Erreur d'analyse\nJe n'ai pas pu accéder au contenu de ce document pour le moment." }]);
        } finally {
            setAiLoading(false);
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const getFileIcon = (mime: string) => {
        if (mime.includes('pdf')) return <FileText className="text-red-500" />;
        if (mime.includes('image')) return <FileImage className="text-blue-500" />;
        if (mime.includes('html')) return <Globe className="text-indigo-500" />;
        if (mime.includes('csv') || mime.includes('excel') || mime.includes('spreadsheet')) return <Table className="text-emerald-500" />;
        if (mime.includes('text')) return <TypeIcon className="text-slate-500" />;
        return <File className="text-slate-400" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleDownload = (doc: UnitFile) => {
        const link = document.createElement('a');
        link.href = `data:${doc.mimeType};base64,${doc.data}`;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const parseCSV = (data: string) => {
        const text = b64DecodeUnicode(data);
        const rows = text.split('\n').filter(r => r.trim());
        if (rows.length === 0) return [];
        const delimiter = rows[0].includes(';') ? ';' : ',';
        return rows.map(r => r.split(delimiter));
    };

    const renderPreviewContent = () => {
        if (!previewDoc) return null;
        const { mimeType, data, name } = previewDoc;

        if (mimeType.includes('image')) {
            return <img src={`data:${mimeType};base64,${data}`} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl animate-in fade-in zoom-in-95" alt={name} />;
        }

        if (mimeType.includes('pdf')) {
            return <iframe src={`data:${mimeType};base64,${data}`} className="w-full h-full rounded-2xl shadow-xl border-none bg-white" title={name} />;
        }

        if (mimeType.includes('html')) {
            const htmlContent = b64DecodeUnicode(data);
            return (
                <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                    <div className="bg-indigo-50 px-6 py-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-100">Rendu HTML Sécurisé</div>
                    <iframe srcDoc={htmlContent} className="w-full flex-1 border-none" title={name} />
                </div>
            );
        }

        if (mimeType.includes('csv')) {
            const tableData = parseCSV(data);
            return (
                <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-auto p-0 flex flex-col">
                    <div className="bg-emerald-50 px-6 py-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 sticky top-0 z-10">Analyse de données CSV</div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 sticky top-[37px] z-10 border-b border-slate-200">
                                {tableData[0]?.map((h, i) => (
                                    <th key={i} className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 border-r border-slate-100 last:border-0">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tableData.slice(1).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    {row.map((cell, i) => (
                                        <td key={i} className="px-6 py-4 text-xs font-medium text-slate-700 border-r border-slate-50 last:border-0">{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (mimeType.includes('text')) {
            const text = b64DecodeUnicode(data);
            return (
                <div className="w-full h-full bg-white rounded-2xl shadow-xl p-12 overflow-auto custom-scrollbar">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8 pb-4 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Texte Brut</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{text.length} Caractères</span>
                        </div>
                        <pre className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{text}</pre>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center gap-8 text-center bg-white p-20 rounded-[3rem] shadow-xl border border-slate-200 animate-in fade-in">
                <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300">{getFileIcon(mimeType)}</div>
                <div>
                    <h4 className="text-2xl font-black text-slate-800 uppercase mb-4">Format non supporté en direct</h4>
                    <p className="text-slate-500 text-sm font-medium mb-8 max-w-sm mx-auto">Le format ({mimeType}) nécessite un téléchargement pour être exploité pleinement.</p>
                    <button onClick={() => handleDownload(previewDoc)} className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
                        <Download size={20} /> Télécharger le document
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 relative">

            {notification && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
                    {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    <span className="font-bold text-sm">{notification.message}</span>
                    <button onClick={() => setNotification(null)}><X size={18} /></button>
                </div>
            )}

            <div className="bg-white p-10 border-b border-slate-100 flex flex-col gap-8 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-indigo-400 shadow-xl">
                            <HardDrive size={32} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Archives & Listes</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Centre de documentation partagé</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            <button onClick={() => setViewMode('GRID')} className={`p-3 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><Grid size={20} /></button>
                            <button onClick={() => setViewMode('LIST')} className={`p-3 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List size={20} /></button>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                {isUploading ? "Lecture..." : "Importer"}
                                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un document par nom..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] py-5 pl-16 pr-8 text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner" />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-6 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedCategory === cat.id ? `${cat.id === 'ALL' ? 'bg-indigo-600' : cat.color} text-white border-transparent shadow-lg` : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50">
                {filteredDocs.length > 0 ? (
                    viewMode === 'GRID' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredDocs.map(doc => {
                                const categoryInfo = CATEGORIES.find(c => c.id === doc.category) || CATEGORIES[4];
                                return (
                                    <div key={doc.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-2xl hover:-translate-y-2 transition-all group relative animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex justify-between items-start">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-indigo-50 transition-colors">
                                                {getFileIcon(doc.mimeType)}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => { setPreviewDoc(doc); setAiHistory([]); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors" title="Lire et Analyser"><Eye size={18} /></button>
                                                <button onClick={() => handleDownload(doc)} className="p-2 text-slate-300 hover:text-emerald-500 transition-colors" title="Télécharger"><Download size={18} /></button>
                                                {isAdmin && <button onClick={() => onDelete(doc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Supprimer"><Trash2 size={18} /></button>}
                                            </div>
                                        </div>
                                        <div className="min-h-[50px]">
                                            <h3 className="text-sm font-black text-slate-800 uppercase leading-snug line-clamp-2">{doc.name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatSize(doc.size)}</span>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${categoryInfo.text}`}>{categoryInfo.label}</span>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[9px] font-bold text-slate-400 italic">
                                            <div className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(doc.date).toLocaleDateString('fr-FR')}</div>
                                            {doc.mimeType.split('/')[1]?.toUpperCase() || "DOC"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/80 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <th className="px-8 py-6">Document</th>
                                        <th className="px-6 py-6 text-center">Taille</th>
                                        <th className="px-6 py-6 text-center">Type</th>
                                        <th className="px-6 py-6 text-center">Date d'import</th>
                                        <th className="px-6 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDocs.map(doc => {
                                        const categoryInfo = CATEGORIES.find(c => c.id === doc.category) || CATEGORIES[4];
                                        return (
                                            <tr key={doc.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                                            {getFileIcon(doc.mimeType)}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{doc.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center text-xs font-bold text-slate-400">{formatSize(doc.size)}</td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${categoryInfo.color} text-white`}>{categoryInfo.label}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center text-xs font-bold text-slate-400">{new Date(doc.date).toLocaleDateString('fr-FR')}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button onClick={() => { setPreviewDoc(doc); setAiHistory([]); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Eye size={18} /></button>
                                                        <button onClick={() => handleDownload(doc)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><Download size={18} /></button>
                                                        {isAdmin && <button onClick={() => onDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center opacity-20">
                        <HardDrive size={100} className="mb-8" />
                        <h3 className="text-3xl font-black uppercase tracking-widest">Bibliothèque vide</h3>
                        <p className="max-w-xs mx-auto mt-4 text-slate-500 font-bold uppercase tracking-widest text-[11px]">
                            {selectedCategory === 'ALL'
                                ? 'Utilisez le bouton "Importer" pour ajouter des documents au format HTML, PDF, CSV, Texte ou Images.'
                                : `Aucun document trouvé dans la catégorie "${CATEGORIES.find(c => c.id === selectedCategory)?.label}".`}
                        </p>
                    </div>
                )}
            </div>

            {/* DOCUMENT PREVIEW MODAL WITH AI ASSISTANT SIDEBAR */}
            {previewDoc && (
                <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
                    <div className={`bg-white w-full max-w-[1700px] h-[94vh] rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative border-4 border-white/10 transition-all duration-700`}>

                        {/* MAIN VIEWER AREA */}
                        <div className="flex-1 flex flex-col bg-slate-100 min-w-0">
                            <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">{getFileIcon(previewDoc.mimeType)}</div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight truncate max-w-[200px] md:max-w-md">{previewDoc.name}</h3>
                                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Analyseur Interne DEVAC • {formatSize(previewDoc.size)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-4 rounded-2xl transition-all flex items-center gap-3 ${isSidebarOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                                        <Sparkles size={20} /> <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Assistant Céleste</span>
                                    </button>
                                    <button onClick={() => handleDownload(previewDoc)} className="p-4 bg-white/5 hover:bg-emerald-500 text-white rounded-2xl transition-all" title="Télécharger"><Download size={20} /></button>
                                    <button onClick={() => setPreviewDoc(null)} className="p-4 bg-white/5 hover:bg-red-500 text-white rounded-2xl transition-all"><X size={20} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-4 md:p-10 flex items-center justify-center custom-scrollbar">
                                {renderPreviewContent()}
                            </div>
                        </div>

                        {/* AI SIDEBAR - EXPERT ANALYSIS MODE */}
                        <div className={`bg-[#0f172a] border-l border-white/5 flex flex-col transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-full md:w-[550px]' : 'w-0 opacity-0 pointer-events-none'}`}>
                            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl"><BrainCircuit size={28} /></div>
                                    <div>
                                        <h4 className="text-white font-black uppercase tracking-tighter text-base">Céleste Vision Expert</h4>
                                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Analyse structurée active</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-white p-2"><X size={24} /></button>
                            </div>

                            {/* CHAT HISTORY WITH MARKDOWN SUPPORT */}
                            <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {aiHistory.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in-95">
                                        <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-indigo-400/20 shadow-inner"><Sparkles size={48} /></div>
                                        <div>
                                            <h5 className="text-white font-black uppercase tracking-widest text-sm mb-4">Analyse de document</h5>
                                            <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-[280px]">Je suis prête à effectuer un débriefing complet. Choisissez une action rapide ou posez votre question.</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
                                            <button onClick={() => handleAiAsk("Réalise un débriefing complet et structuré de ce document avec les points essentiels.")} className="flex items-center gap-4 p-5 bg-slate-800/50 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-white/5 rounded-3xl transition-all text-left group">
                                                <ListChecks size={22} className="group-hover:scale-110 transition-transform" />
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest">Débriefing Professionnel</div>
                                                    <div className="text-[9px] opacity-60 mt-1">Résumé structuré par sections</div>
                                                </div>
                                            </button>
                                            <button onClick={() => handleAiAsk("Explique-moi les concepts clés et le but de ce document de manière pédagogique.")} className="flex items-center gap-4 p-5 bg-slate-800/50 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-white/5 rounded-3xl transition-all text-left group">
                                                <HelpCircle size={22} className="group-hover:scale-110 transition-transform" />
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest">Aide à la compréhension</div>
                                                    <div className="text-[9px] opacity-60 mt-1">Explications détaillées pas à pas</div>
                                                </div>
                                            </button>
                                            <button onClick={() => handleAiAsk("Extrait toutes les données importantes, les dates et les chiffres clés de ce document.")} className="flex items-center gap-4 p-5 bg-slate-800/50 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-white/5 rounded-3xl transition-all text-left group">
                                                <MessageSquareText size={22} className="group-hover:scale-110 transition-transform" />
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest">Analyse de données</div>
                                                    <div className="text-[9px] opacity-60 mt-1">Extraction des chiffres et dates</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    aiHistory.map((m, i) => (
                                        <div key={i} className={`flex flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4`}>
                                            <div className={`p-6 rounded-[2.2rem] text-[13px] leading-relaxed shadow-2xl relative group ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none max-w-[85%]' : 'bg-slate-800/60 text-slate-300 rounded-tl-none border border-white/5 w-full'}`}>
                                                {m.role === 'ai' ? (
                                                    <div className="prose prose-invert max-w-none">
                                                        {formatMarkdown(m.text)}
                                                        <button
                                                            onClick={() => copyToClipboard(m.text, i)}
                                                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                            title="Copier la réponse"
                                                        >
                                                            {copiedIndex === i ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                                        </button>
                                                    </div>
                                                ) : m.text}
                                            </div>
                                            <div className="flex items-center gap-2 px-4">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{m.role === 'user' ? 'UTILISATEUR' : 'ASSISTANTE CÉLESTE'}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {aiLoading && (
                                    <div className="flex flex-col gap-4 p-8 bg-slate-800/30 rounded-[2.5rem] border border-white/5 items-center justify-center animate-pulse">
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Céleste étudie le document...</span>
                                    </div>
                                )}
                            </div>

                            {/* INPUT AREA - ENHANCED */}
                            <div className="p-8 bg-slate-900 border-t border-white/5 shrink-0">
                                <div className="flex items-center gap-4 relative">
                                    <div className="relative flex-1 group">
                                        <input
                                            value={aiInput}
                                            onChange={e => setAiInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAiAsk("")}
                                            placeholder="Interrogez Céleste sur ce document..."
                                            className="w-full bg-slate-800/50 border border-white/5 text-white text-xs p-6 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-slate-800 transition-all shadow-inner placeholder:text-slate-600 font-medium"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <button
                                                onClick={() => handleAiAsk("")}
                                                disabled={!aiInput.trim() || aiLoading}
                                                className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl hover:bg-indigo-500 active:scale-95 disabled:opacity-20 transition-all"
                                            >
                                                <ArrowRight size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
};

export default DocumentLibrary;
