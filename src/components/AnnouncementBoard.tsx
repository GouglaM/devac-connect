import React, { useState } from 'react';
import { Announcement, SocialActionRecord, EvangelismUnit, Committee } from '../types';
import {
  Bell, AlertCircle, Clock, RefreshCw, Filter, X, CalendarDays, Share2,
  MessageCircle, Mail, Copy, Check, Smartphone, Image as ImageIcon,
  CalendarPlus, Plus, Send, Paperclip, Sparkles, Wand2, UserPlus, ArrowRight,
  HeartHandshake, Loader2, Download, FileSpreadsheet, FileText, Presentation
} from 'lucide-react';
import { extractSocialCase } from '../services/geminiService';
import { updateUnitInDB, getInitialUnits } from '../services/dataService';
import CreativeStudio from './CreativeStudio';
import { generateId } from '../constants';
import { exportData } from '../services/exportUtils';
import { GlobalProgramImportButton } from './GlobalProgramImportButton';


interface AnnouncementBoardProps {
  announcements: Announcement[];
  units: EvangelismUnit[];
  committees: Committee[];
  isAdmin: boolean;
  onDelete?: (id: string) => void;
  onAdd?: (announcement: Announcement) => void;
  onRefresh?: () => void;
}

const AnnouncementBoard: React.FC<AnnouncementBoardProps> = ({ announcements, units, committees, isAdmin, onDelete, onAdd, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [shareOpenId, setShareOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [showCreativeStudio, setShowCreativeStudio] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<'normal' | 'high'>('normal');
  const [newImage, setNewImage] = useState<string | null>(null);


  // États pour l'analyse IA
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [extractedCase, setExtractedCase] = useState<any | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleGlobalExport = async (format: 'XLSX' | 'DOCX' | 'PPTX' | 'PDF') => {
    const filename = `Programme_Global_${new Date().getFullYear()}_${new Date().toLocaleDateString('fr-FR')}`;
    const headers = ['Unité/Comité', 'Date', 'Activité', 'Lieu', 'Budget', 'Chargé'];

    const allPrograms: string[][] = [];
    let totalBudget = 0;

    units.forEach(u => {
      (u.programme || []).forEach(p => {
        const budget = parseInt(p.budget || '0') || 0;
        totalBudget += budget;
        allPrograms.push([
          u.name.toUpperCase(),
          p.date,
          p.activity,
          p.location,
          budget.toLocaleString(),
          p.assignedTo
        ]);
      });
    });

    committees.forEach(c => {
      (c.programme || []).forEach(p => {
        const budget = parseInt(p.budget || '0') || 0;
        totalBudget += budget;
        allPrograms.push([
          c.name.toUpperCase(),
          p.date,
          p.activity,
          p.location,
          budget.toLocaleString(),
          p.assignedTo
        ]);
      });
    });

    const summary = { label: 'Budget Global Départemental', value: totalBudget.toLocaleString() + ' FCFA' };

    await exportData(format, headers, allPrograms, filename, 'PROGRAMME GLOBAL DU DÉPARTEMENT', summary);
    setShowExportMenu(false);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 900 * 1024) {
        alert("L'image est trop volumineuse (max 900Ko).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setNewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleScanAnnouncement = async (announcement: Announcement) => {
    setIsAnalyzing(announcement.id);
    const result = await extractSocialCase(announcement.content);
    if (result && result.isSocialCase) {
      setExtractedCase({ ...result, announcementId: announcement.id });
      if (units.length > 0) setSelectedUnitId(units[0].id);
    } else {
      alert("Aucun cas social (décès, naissance, mariage...) n'a été détecté dans ce texte.");
    }
    setIsAnalyzing(null);
  };

  const handleConfirmSocialAction = () => {
    if (!extractedCase || !selectedUnitId) return;

    const targetUnit = units.find(u => u.id === selectedUnitId);
    if (targetUnit) {
      const newAction: SocialActionRecord = {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        beneficiaryName: extractedCase.beneficiaryName || 'NOM À PRÉCISER',
        beneficiaryFirstName: extractedCase.beneficiaryFirstName || '',
        category: (extractedCase.eventType === 'DEATH' || extractedCase.eventType === 'SICKNESS') ? 'DIFFICULTY' : 'JOY',
        eventType: extractedCase.eventType || 'OTHER',
        eventDate: extractedCase.eventDate || new Date().toISOString().split('T')[0],
        visitDate: extractedCase.visitDate || '',
        assistanceType: 'Cas détecté via le tableau d\'annonces.',
        status: 'AWAITING',
        isVisited: false,
        visitors: []
      };

      const updatedUnit = {
        ...targetUnit,
        socialActions: [...(targetUnit.socialActions || []), newAction]
      };
      updateUnitInDB(updatedUnit);
      setExtractedCase(null);
      alert(`Action sociale enregistrée avec succès dans l'unité : ${targetUnit.name}`);
    }
  };

  const handleSubmitAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !onAdd) return;

    const announcement: Announcement = {
      id: generateId(),
      title: newTitle,
      content: newContent,
      date: new Date().toISOString(),
      priority: newPriority,
      image: newImage || undefined,
    };

    onAdd(announcement);
    setNewTitle(''); setNewContent(''); setNewPriority('normal'); setNewImage(null); setIsAdding(false); setShowCreativeStudio(false);
  };

  const handlePublishGraphic = (imageData: string) => {
    if (!onAdd) return;
    const announcement: Announcement = {
      id: generateId(),
      title: "MESSAGE GRAPHIQUE",
      content: "Une nouvelle annonce visuelle a été publiée via le Creative Studio.",
      date: new Date().toISOString(),
      priority: 'normal',
      image: imageData,
    };
    onAdd(announcement);
    setIsAdding(false);
    setShowCreativeStudio(false);
  };


  const filteredAnnouncements = announcements.filter((announcement) => {
    if (!startDate && !endDate) return true;
    const annDate = new Date(announcement.date);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (annDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (annDate > end) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {/* MODAL IA EXTRACTION */}
      {extractedCase && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-indigo-600 p-8 text-white flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Sparkles size={24} /></div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Céleste Vision Expert</h3>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Cas social détecté</p>
              </div>
              <button onClick={() => setExtractedCase(null)} className="ml-auto p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bénéficiaire (Nom)</label>
                  <div className="text-lg font-black text-slate-800 border-b-2 border-indigo-50 pb-2 uppercase">{extractedCase.beneficiaryName}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prénom(s)</label>
                  <div className="text-lg font-bold text-slate-500 border-b-2 border-indigo-50 pb-2">{extractedCase.beneficiaryFirstName}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type d'Événement</label>
                  <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-tight w-max">{extractedCase.eventType}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date Détectée</label>
                  <div className="text-xs font-black text-slate-700">{extractedCase.eventDate || 'À préciser'}</div>
                </div>
              </div>
              <div className="space-y-3 pt-6 border-t border-slate-50">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unité concernée :</label>
                <select
                  value={selectedUnitId}
                  onChange={e => setSelectedUnitId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5"
                >
                  {units.map(u => <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>)}
                </select>
              </div>
              <button
                onClick={handleConfirmSocialAction}
                className="w-full bg-indigo-600 text-white py-5 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
              >
                <HeartHandshake size={20} /> Valider & Créer la Fiche
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 shrink-0">
          <Bell className="w-6 h-6 text-indigo-600" />
          Tableau d'Affichage
        </h2>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-start xl:justify-end">
          {isAdmin && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-lg transition-all shadow-sm ${isAdding ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isAdding ? 'Annuler' : 'Nouvelle Annonce'}
            </button>
          )}
          {onRefresh && (
            <button onClick={handleRefresh} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          )}

          {/* Bouton Export Global */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Exporter Global</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => handleGlobalExport('XLSX')} className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel (.xlsx)
                </button>
                <button onClick={() => handleGlobalExport('DOCX')} className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-600" /> Word (.docx)
                </button>
                <button onClick={() => handleGlobalExport('PPTX')} className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <Presentation className="w-4 h-4 text-orange-600" /> PowerPoint (.pptx)
                </button>
                <button onClick={() => window.print()} className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-red-600" /> PDF (Impression)
                </button>
              </div>
            )}
          </div>

          {isAdmin && (
            <GlobalProgramImportButton
              units={units}
              committees={committees}
              onImportComplete={onRefresh || (() => { })}
            />
          )}
        </div>
      </div>

      {isAdding && isAdmin && (
        <div className="bg-white p-8 rounded-[3rem] border-2 border-indigo-100 shadow-2xl mb-8 animate-in slide-in-from-top-4 overflow-hidden relative">
          <div className="flex gap-4 mb-8 p-1 bg-slate-50 rounded-2xl w-max">
            <button
              onClick={() => setShowCreativeStudio(false)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showCreativeStudio ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Mode Standard
            </button>
            <button
              onClick={() => setShowCreativeStudio(true)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showCreativeStudio ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Creative Studio IA
            </button>
          </div>

          {showCreativeStudio ? (
            <CreativeStudio onPublish={handlePublishGraphic} />
          ) : (
            <form onSubmit={handleSubmitAnnouncement} className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Titre de l'annonce</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Réunion de prière ce soir"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priorité</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPriority('normal')}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-tight transition-all ${newPriority === 'normal' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}
                    >
                      Normale
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPriority('high')}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-tight transition-all ${newPriority === 'high' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}
                    >
                      Urgente
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contenu</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Décrivez votre annonce ici..."
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[120px]"
                  required
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-2">
                <div className="w-full md:w-auto">
                  <label className="cursor-pointer flex items-center gap-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-indigo-100">
                    <ImageIcon size={16} />
                    {newImage ? 'Image sélectionnée' : 'Ajouter une image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {newImage && <p className="text-[10px] text-emerald-600 mt-1 font-bold italic">✓ Image prête (cliquez à nouveau pour changer)</p>}
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} /> Publier l'Annonce
                </button>
              </div>
            </form>
          )}
        </div>
      )}


      {/* Liste des annonces */}
      <div className="grid gap-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className={`relative p-6 sm:p-8 rounded-[2rem] border transition-all hover:shadow-xl overflow-hidden flex flex-col gap-6 w-full ${announcement.priority === 'high' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>

              {/* HEADER: Title and Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  {announcement.priority === 'high' && <span className="w-max px-3 py-1 bg-red-100 text-red-600 text-[10px] uppercase font-black rounded-full border border-red-200">Urgente</span>}
                  <h3 className={`text-lg sm:text-xl font-black uppercase tracking-tight leading-snug break-words ${announcement.priority === 'high' ? 'text-red-700' : 'text-slate-800'}`}>{announcement.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAdmin && (
                    <button
                      onClick={() => handleScanAnnouncement(announcement)}
                      disabled={isAnalyzing === announcement.id}
                      className={`p-2 rounded-xl transition-all flex items-center gap-2 ${isAnalyzing === announcement.id ? 'bg-indigo-50 text-indigo-400' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'}`}
                      title="Analyse IA (Cas Social)"
                    >
                      {isAnalyzing === announcement.id ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Scan IA</span>
                    </button>
                  )}
                  <button onClick={() => onDelete?.(announcement.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={20} /></button>
                </div>
              </div>

              {/* IMAGE: Full Width */}
              {announcement.image && (
                <div className="w-full h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden shadow-md">
                  <img src={announcement.image} alt={announcement.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* CONTENT */}
              <div className="flex flex-col flex-1 pb-2">
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-6 break-words">{announcement.content}</p>

                <div className="flex flex-wrap items-center justify-between text-[10px] sm:text-xs text-slate-400 border-t border-slate-100 pt-4 mt-auto">
                  <div className="flex items-center gap-2">
                    <Clock size={16} /> <span className="hidden sm:inline">Publié le {new Date(announcement.date).toLocaleDateString('fr-FR')} à {new Date(announcement.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="sm:hidden">{new Date(announcement.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <button onClick={() => setShareOpenId(announcement.id)} className="flex items-center gap-2 hover:text-indigo-600 transition-colors uppercase font-black tracking-widest leading-none"><Share2 size={16} /> Partager</button>
                  </div>
                </div>
              </div>

            </div>
          ))
        ) : <div className="text-center p-20 opacity-20"><CalendarDays size={60} className="mx-auto mb-4" /> Vide</div>}
      </div>
    </div>
  );
};

export default AnnouncementBoard;
