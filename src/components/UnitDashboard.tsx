/// <reference types="vite/client" />
import React, { useState } from 'react';
import { EvangelismUnit, Committee, ReportItem, Member, ProgrammeItem } from '../types';
import { Users, Calendar, ClipboardList, Book, Save, UserPlus, Trash2, Edit2, ArrowLeft, TrendingUp, CheckCircle2, Phone, Mail, X, Plus, AlertCircle, MapPin, Camera, Upload, Briefcase, Filter, Search, FileDown, FileSpreadsheet, FileText, Printer, PieChart, Coins, MessageCircle, PhoneCall, Video, Wrench, Palette, Truck, BookOpen, HeartHandshake, User } from 'lucide-react';

// Le composant accepte soit une Unité soit un Comité
interface UnitDashboardProps {
  unit: EvangelismUnit | Committee;
  variant: 'unit' | 'committee'; // Nouveau prop pour le style
  isAdmin: boolean;
  onUpdateUnit: (updatedUnit: any) => void;
  onBack: () => void;
}

const UnitDashboard: React.FC<UnitDashboardProps> = ({ unit, variant, isAdmin, onUpdateUnit, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'program' | 'reports'>('overview');

  // Configuration des couleurs et libellés selon la variante
  const isUnit = variant === 'unit';
  const themeColor = isUnit ? 'indigo' : 'cyan';
  const secondaryColor = isUnit ? 'purple' : 'teal';
  const label = isUnit ? "Unité" : "Comité";

  // State for Report Form
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');

  // States for Report Filtering
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // State for Member Search
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // State for Member Communication Modal
  const [contactMember, setContactMember] = useState<Member | null>(null);

  // Editing States
  const [isEditingLeaders, setIsEditingLeaders] = useState(false);

  // Leader Edit State
  const [editLeader, setEditLeader] = useState(unit.leaderName || '');
  const [editLeaderPhone, setEditLeaderPhone] = useState(unit.leaderPhone || '');
  const [editLeaderEmail, setEditLeaderEmail] = useState(unit.leaderEmail || '');
  const [editLeaderPhoto, setEditLeaderPhoto] = useState(unit.leaderPhoto || '');

  // Deputy Edit State
  const [editDeputy, setEditDeputy] = useState(unit.assistantName || '');
  const [editDeputyPhone, setEditDeputyPhone] = useState(unit.assistantPhone || '');
  const [editDeputyEmail, setEditDeputyEmail] = useState(unit.assistantEmail || '');
  const [editDeputyPhoto, setEditDeputyPhoto] = useState(unit.assistantPhoto || '');

  // Members Edit State
  const [isEditingMembers, setIsEditingMembers] = useState(false);
  const [editedMembers, setEditedMembers] = useState<Member[]>(unit.members || []);

  // Program Edit State (Now Array)
  const [isEditingProgram, setIsEditingProgram] = useState(false);
  const [editedProgram, setEditedProgram] = useState<ProgrammeItem[]>(Array.isArray(unit.programme) ? unit.programme : []);

  const [isEditingAnnual, setIsEditingAnnual] = useState(false);
  const [editAnnual, setEditAnnual] = useState(unit.annualReport || '');

  const currentYear = new Date().getFullYear();
  const currentYearReportsCount = (unit.reports || []).filter(r => new Date(r.date).getFullYear() === currentYear).length;

  // --- HELPER FUNCTIONS ---

  const getCleanPhone = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
      cleanPhone = '225' + cleanPhone.substring(1);
    }
    return cleanPhone;
  };

  const openWhatsApp = (phone: string, name: string) => {
    if (!phone) return;
    const cleanPhone = getCleanPhone(phone);
    const message = encodeURIComponent(`Bonjour ${name}, (via DEVAC CONNECT)`);
    const url = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(url, '_blank');
  };

  const handleCommunication = (type: 'gsm' | 'wa_audio' | 'wa_video') => {
    if (!contactMember?.phone) return;
    const cleanPhone = getCleanPhone(contactMember.phone);

    if (type === 'gsm') {
      window.location.href = `tel:${cleanPhone}`;
    } else {
      const text = type === 'wa_audio'
        ? `👋 Bonjour ${contactMember.name.split(' ')[0]}, je souhaite lancer un appel vocal.`
        : `👋 Bonjour ${contactMember.name.split(' ')[0]}, es-tu disponible pour un appel vidéo ?`;

      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
    setContactMember(null);
  };

  const getTotalBudget = () => {
    const prog = Array.isArray(unit.programme) ? unit.programme : [];
    return prog.reduce((sum, item) => sum + (Number(item.budget) || 0), 0);
  };

  const getBudgetChartData = () => {
    const prog = Array.isArray(unit.programme) ? unit.programme : [];
    const total = getTotalBudget();

    if (total === 0) return [];

    // Group and sort items by budget descending
    return prog
      .filter(p => (Number(p.budget) || 0) > 0)
      .sort((a, b) => (Number(b.budget) || 0) - (Number(a.budget) || 0))
      .map(p => ({
        ...p,
        percentage: Math.round(((Number(p.budget) || 0) / total) * 100)
      }));
  };

  // --- EXPORT FUNCTIONS ---

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToWord = (filename: string, title: string, contentHtml: string) => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', 'Calibri', 'Arial', sans-serif; line-height: 1.6; color: #334155; }
          .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
          .app-name { color: #4F46E5; font-size: 24pt; font-weight: bold; margin: 0; }
          .doc-title { font-size: 18pt; color: #1E293B; margin-top: 10px; }
          .meta { font-size: 10pt; color: #64748B; margin-top: 5px; }
          h1, h2, h3 { color: #4338CA; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #E2E8F0; font-size: 10pt; }
          th { background-color: #F8FAFC; color: #475569; font-weight: bold; padding: 10px; border: 1px solid #E2E8F0; text-align: left; }
          td { padding: 10px; border: 1px solid #E2E8F0; vertical-align: top; }
          .budget-total { font-size: 14pt; font-weight: bold; color: #4338CA; background: #EEF2FF; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .badge { padding: 3px 8px; border-radius: 12px; font-size: 8pt; font-weight: bold; }
          .footer { margin-top: 50px; font-size: 8pt; color: #94A3B8; text-align: center; border-top: 1px solid #F1F5F9; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="app-name">DEVAC CONNECT</p>
          <p class="doc-title">${title} - ${label} ${unit.name}</p>
          <p class="meta">Généré le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
        
        ${contentHtml}
        
        <div class="footer">
          Document généré via DEVAC CONNECT - © ${new Date().getFullYear()} Community Management System
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    link.click();
  };

  // --- SPECIFIC EXPORTS PER TAB ---

  const handleExportMembers = (type: 'csv' | 'word') => {
    const headers = ['Nom', 'Profession', 'Téléphone', 'Localisation'];
    const data = filteredMembers.map(m => [m.name, m.profession || '', m.phone, m.location]);

    if (type === 'csv') {
      exportToCSV(`${label}_${unit.name}_Membres`, headers, data.map(row => row.map(cell => cell || '')));
    } else {
      const tableRows = data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
      const tableHtml = `
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      `;
      exportToWord(`${label}_${unit.name}_Membres`, `Liste des Membres`, tableHtml);
    }
  };

  const handleExportProgram = (type: 'csv' | 'word' | 'pdf') => {
    if (type === 'pdf') {
      window.print();
      return;
    }

    const headers = ['Date', 'Activité', 'Lieu', 'Budget (FCFA)', 'Chargé de l\'activité', 'Contact'];
    const progData = Array.isArray(unit.programme) ? unit.programme : [];

    // Données principales
    const data = progData.map(p => [
      p.date,
      p.activity,
      p.location,
      (Number(p.budget) || 0).toLocaleString('fr-FR'),
      p.assignedTo,
      p.assignedContact || ''
    ]);

    // Données pour l'analyse budgétaire
    const totalBudget = getTotalBudget();
    const budgetBreakdown = getBudgetChartData();

    if (type === 'csv') {
      // Pour le CSV, on ajoute des lignes de résumé à la fin
      const csvData = [...data];

      // Ajouter une ligne vide
      csvData.push(['', '', '', '', '', '']);
      csvData.push(['ANALYSE BUDGETAIRE', '', '', '', '', '']);
      csvData.push(['BUDGET TOTAL', '', '', totalBudget.toLocaleString('fr-FR'), '', '']);
      csvData.push(['', '', '', '', '', '']);

      // En-têtes du mini-tableau de répartition
      csvData.push(['REPARTITION PAR ACTIVITE', '', '', '', 'MONTANT', 'POURCENTAGE']);

      budgetBreakdown.forEach(item => {
        csvData.push([item.activity, '', '', '', (Number(item.budget) || 0).toLocaleString('fr-FR'), `${item.percentage}%`]);
      });

      exportToCSV(`${label}_${unit.name}_Programme`, headers, csvData);
    } else {
      // Pour Word, on construit deux tableaux HTML
      const tableRows = data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');

      let breakdownRows = '';
      budgetBreakdown.forEach(item => {
        breakdownRows += `<tr><td>${item.activity}</td><td>${(Number(item.budget) || 0).toLocaleString('fr-FR')}</td><td>${item.percentage}%</td></tr>`;
      });

      const fullHtml = `
        <h3>Détail du Programme</h3>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        
        <br/><hr/><br/>

        <h3>Analyse Budgétaire</h3>
        <p class="budget-total">Budget Total Estimé : ${totalBudget.toLocaleString('fr-FR')} FCFA</p>
        
        <h4>Répartition par Activité (Top Dépenses)</h4>
        <table>
            <thead>
                <tr>
                    <th style="width: 60%">Activité</th>
                    <th style="width: 20%">Budget</th>
                    <th style="width: 20%">Part (%)</th>
                </tr>
            </thead>
            <tbody>
                ${breakdownRows}
            </tbody>
        </table>
      `;
      exportToWord(`${label}_${unit.name}_Programme`, 'Programme d\'Activité & Budget', fullHtml);
    }
  };

  const handleExportReports = (type: 'csv' | 'word') => {
    const headers = ['Date', 'Titre', 'Contenu'];
    const data = filteredReports.map(r => [
      new Date(r.date).toLocaleDateString('fr-FR'),
      r.missionField,
      r.realizedActivities
    ]);

    if (type === 'csv') {
      exportToCSV(`${label}_${unit.name}_Bilans`, headers, data);
    } else {
      const tableRows = data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
      const tableHtml = `
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      `;
      exportToWord(`${label}_${unit.name}_Bilans`, 'Bilans d\'Activités', tableHtml);
    }
  };

  // --- UI HANDLERS ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isLeader: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("L'image est trop volumineuse. Veuillez choisir une image de moins de 1 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isLeader) setEditLeaderPhoto(result);
        else setEditDeputyPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMemberImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("L'image est trop volumineuse. Veuillez choisir une image de moins de 1 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateMemberField(index, 'photo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLeaders = () => {
    onUpdateUnit({
      ...unit,
      leaderName: editLeader,
      leaderPhone: editLeaderPhone,
      leaderEmail: editLeaderEmail,
      leaderPhoto: editLeaderPhoto,
      assistantName: editDeputy,
      assistantPhone: editDeputyPhone,
      assistantEmail: editDeputyEmail,
      assistantPhoto: editDeputyPhoto
    });
    setIsEditingLeaders(false);
  };

  const startEditingMembers = () => {
    setEditedMembers(unit.members.map(m => ({ ...m })));
    setIsEditingMembers(true);
    setMemberSearchQuery('');
  };

  const updateMemberField = (index: number, field: keyof Member, value: string) => {
    const newMembers = [...editedMembers];
    // @ts-ignore
    newMembers[index] = { ...newMembers[index], [field]: value };
    setEditedMembers(newMembers);
  };

  const addMemberRow = () => {
    setEditedMembers([...editedMembers, {
      id: Date.now().toString() + Math.random().toString().slice(2, 6), // ID Robuste
      name: '',
      phone: '',
      location: '',
      profession: '',
      photo: ''
    }]);
  };

  const removeMemberRow = (index: number) => {
    const newMembers = [...editedMembers];
    newMembers.splice(index, 1);
    setEditedMembers(newMembers);
  };

  const saveMembers = () => {
    console.log(`UnitDashboard: Saving ${editedMembers.length} members...`);
    const cleanMembers = editedMembers.filter(m => m.name.trim() !== '');
    onUpdateUnit({ ...unit, members: cleanMembers });
    setIsEditingMembers(false);
  };

  const startEditingProgram = () => {
    const currentProgram = Array.isArray(unit.programme) ? unit.programme : [];
    setEditedProgram(currentProgram.map(item => ({ ...item })));
    setIsEditingProgram(true);
  };

  const updateProgramField = (index: number, field: keyof ProgrammeItem, value: string | number) => {
    const newProgram = [...editedProgram];
    // @ts-ignore
    newProgram[index] = { ...newProgram[index], [field]: value };
    setEditedProgram(newProgram);
  };

  const addProgramRow = () => {
    setEditedProgram([...editedProgram, {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      date: '',
      activity: '',
      location: '',
      resources: '',
      budget: '0',
      assignedTo: '',
      assignedContact: ''
    }]);
  };

  const removeProgramRow = (index: number) => {
    const newProgram = [...editedProgram];
    newProgram.splice(index, 1);
    setEditedProgram(newProgram);
  };

  const handleSaveProgram = () => {
    const cleanProgram = editedProgram.filter(p => p.activity.trim() !== '');
    onUpdateUnit({ ...unit, programme: cleanProgram });
    setIsEditingProgram(false);
  };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportContent.trim()) return;

    const newReport: ReportItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      missionField: reportTitle,
      projectedActivities: '',
      realizedActivities: reportContent,
      expectedResults: '',
      obtainedAudience: '0',
      decisionsAdults: '0',
      decisionsChildren: '0'
    };

    onUpdateUnit({ ...unit, reports: [newReport, ...(unit.reports || [])] });
    setReportTitle('');
    setReportContent('');
    setIsReportFormOpen(false);
  };

  const handleDeleteReport = (id: string) => {
    const updatedReports = (unit.reports || []).filter(r => r.id !== id);
    onUpdateUnit({ ...unit, reports: updatedReports });
  };

  const handleSaveAnnual = () => {
    onUpdateUnit({ ...unit, annualReport: editAnnual });
    setIsEditingAnnual(false);
  };

  const getFilteredReports = () => {
    return (unit.reports || []).filter(report => {
      if (!filterStartDate && !filterEndDate) return true;
      const reportDate = new Date(report.date);

      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0, 0, 0, 0);
        if (reportDate < start) return false;
      }

      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (reportDate > end) return false;
      }

      return true;
    });
  };

  const filteredReports = getFilteredReports();

  const getFilteredMembers = () => {
    if (!memberSearchQuery) return unit.members;
    const query = memberSearchQuery.toLowerCase();
    return unit.members.filter(member =>
      member.name.toLowerCase().includes(query) ||
      (member.location || '').toLowerCase().includes(query) ||
      (member.profession && member.profession.toLowerCase().includes(query))
    );
  };

  const filteredMembers = getFilteredMembers();

  // Composant Bouton d'Exportation Réutilisable
  const ExportActions = ({ onCsv, onWord, onPdf }: { onCsv: () => void, onWord: () => void, onPdf?: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative no-print">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
        >
          <FileDown className="w-4 h-4" />
          <span className="hidden md:inline">Exporter</span>
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
            <button onClick={onCsv} className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-slate-50 text-sm text-slate-700">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel (CSV)
            </button>
            <button onClick={onWord} className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-slate-50 text-sm text-slate-700">
              <FileText className="w-4 h-4 text-blue-600" /> Word (.doc)
            </button>
            <button onClick={onPdf || handlePrint} className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-slate-50 text-sm text-slate-700 border-t border-slate-100">
              <Printer className="w-4 h-4 text-red-600" /> Format PDF
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[600px] relative" id="unit-dashboard-container">
      {/* Styles d'impression spécifiques */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #unit-dashboard-container, #unit-dashboard-container * {
            visibility: visible;
          }
          #unit-dashboard-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
          /* Ensure backgrounds print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* MODAL DE COMMUNICATION */}
      {contactMember && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setContactMember(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className={`bg-${themeColor}-600 p-6 text-center text-white relative`}>
              <button
                onClick={() => setContactMember(null)}
                className={`absolute top-4 right-4 text-${themeColor}-200 hover:text-white`}
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-20 h-20 rounded-full bg-white mx-auto mb-3 p-1">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-200">
                  {contactMember.photo ? (
                    <img src={contactMember.photo} alt={contactMember.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-full h-full p-4 text-slate-400" />
                  )}
                </div>
              </div>
              <h3 className="font-bold text-lg">{contactMember.name}</h3>
              <p className={`text-${themeColor}-200 text-sm`}>{contactMember.phone || "Aucun numéro"}</p>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-center text-sm text-slate-500 mb-4 font-medium">Choisissez un moyen de communication :</p>

              <button
                onClick={() => handleCommunication('gsm')}
                disabled={!contactMember.phone}
                className="w-full flex items-center justify-center gap-3 p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                <div className="bg-white p-1.5 rounded-full shadow-sm"><Phone className={`w-5 h-5 text-${themeColor}-600`} /></div>
                Appel Vocal (GSM)
              </button>

              <button
                onClick={() => handleCommunication('wa_audio')}
                disabled={!contactMember.phone}
                className="w-full flex items-center justify-center gap-3 p-3 bg-green-50 hover:bg-green-100 text-green-800 rounded-xl transition-colors font-medium disabled:opacity-50 border border-green-100"
              >
                <div className="bg-white p-1.5 rounded-full shadow-sm"><PhoneCall className="w-5 h-5 text-green-600" /></div>
                WhatsApp Audio
              </button>

              <button
                onClick={() => handleCommunication('wa_video')}
                disabled={!contactMember.phone}
                className="w-full flex items-center justify-center gap-3 p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-colors font-medium disabled:opacity-50 border border-slate-200"
              >
                <div className="bg-slate-100 p-1.5 rounded-full shadow-sm"><Video className="w-5 h-5 text-slate-600" /></div>
                WhatsApp Vidéo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`bg-gradient-to-r from-slate-800 to-${themeColor}-900 text-white p-6 no-print`}>
        <button onClick={onBack} className={`flex items-center text-${themeColor}-200 hover:text-white mb-4 transition-colors`}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </button>
        <div className="flex justify-between items-end">
          <div>
            <span className={`text-${themeColor}-300 uppercase tracking-widest text-xs font-bold`}>{label} DEVAC</span>
            <h2 className="text-4xl font-serif font-bold mt-1">{unit.name}</h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{unit.members.length}</div>
            <div className={`text-${themeColor}-300 text-xs uppercase`}>Membres Actifs</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Hidden on Print */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'overview' ? `border-${themeColor}-600 text-${themeColor}-700 bg-${themeColor}-50` : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <Users className="w-4 h-4 inline-block mr-2" /> Responsables
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'members' ? `border-${themeColor}-600 text-${themeColor}-700 bg-${themeColor}-50` : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <UserPlus className="w-4 h-4 inline-block mr-2" /> Liste des Membres
        </button>
        <button
          onClick={() => setActiveTab('program')}
          className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'program' ? `border-${themeColor}-600 text-${themeColor}-700 bg-${themeColor}-50` : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <Calendar className="w-4 h-4 inline-block mr-2" /> Programme
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'reports' ? `border-${themeColor}-600 text-${themeColor}-700 bg-${themeColor}-50` : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <ClipboardList className="w-4 h-4 inline-block mr-2" /> Bilans & Rapports
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 bg-slate-50 h-full">

        {/* Header imprimable uniquement */}
        <div className="hidden print:block mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">{label} {unit.name} - {activeTab === 'members' ? 'Liste des Membres' : activeTab === 'program' ? 'Programme d\'activité' : 'Rapports'}</h1>
          <p className="text-sm text-gray-500">Imprimé le {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        {/* TAB: OVERVIEW / LEADERS */}
        {activeTab === 'overview' && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Leaders Section */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Direction du {label}</h3>
                {/* STRICT ADMIN CHECK FOR LEADERS EDITING */}
                {isAdmin && !isEditingLeaders && (
                  <button onClick={() => setIsEditingLeaders(true)} className={`text-${themeColor}-600 hover:bg-${themeColor}-50 p-2 rounded-full no-print`}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isEditingLeaders ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 no-print">
                  {/* Edit Leader */}
                  <div className={`space-y-3 p-4 bg-${themeColor}-50 rounded-lg border border-${themeColor}-100`}>
                    <h4 className={`font-bold text-${themeColor}-900 border-b border-${themeColor}-200 pb-2 mb-2`}>Responsable</h4>

                    {/* Photo Upload Leader */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-full bg-${themeColor}-200 overflow-hidden flex items-center justify-center border-2 border-${themeColor}-300`}>
                        {editLeaderPhoto ? (
                          <img src={editLeaderPhoto} alt="Leader" className="w-full h-full object-cover" />
                        ) : (
                          <Users className={`w-8 h-8 text-${themeColor}-600`} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Upload className="w-3 h-3" />
                        <span>Charger une photo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nom Complet</label>
                      <input
                        type="text"
                        value={editLeader}
                        onChange={(e) => setEditLeader(e.target.value)}
                        className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={editLeaderPhone}
                        onChange={(e) => setEditLeaderPhone(e.target.value)}
                        placeholder="+225 07..."
                        className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={editLeaderEmail}
                        onChange={(e) => setEditLeaderEmail(e.target.value)}
                        placeholder="email@exemple.com"
                        className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                      />
                    </div>
                  </div>

                  {/* Edit Deputy */}
                  <div className={`space-y-3 p-4 bg-${secondaryColor}-50 rounded-lg border border-${secondaryColor}-100`}>
                    <h4 className={`font-bold text-${secondaryColor}-900 border-b border-${secondaryColor}-200 pb-2 mb-2`}>Adjoint</h4>

                    {/* Photo Upload Deputy */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-full bg-${secondaryColor}-200 overflow-hidden flex items-center justify-center border-2 border-${secondaryColor}-300`}>
                        {editDeputyPhoto ? (
                          <img src={editDeputyPhoto} alt="Deputy" className="w-full h-full object-cover" />
                        ) : (
                          <Users className={`w-8 h-8 text-${secondaryColor}-600`} />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Upload className="w-3 h-3" />
                        <span>Charger une photo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nom Complet</label>
                      <input
                        type="text"
                        value={editDeputy}
                        onChange={(e) => setEditDeputy(e.target.value)}
                        className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={editDeputyPhone}
                        onChange={(e) => setEditDeputyPhone(e.target.value)}
                        placeholder="+225 07..."
                        className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={editDeputyEmail}
                        onChange={(e) => setEditDeputyEmail(e.target.value)}
                        placeholder="email@exemple.com"
                        className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsEditingLeaders(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
                    <button onClick={handleSaveLeaders} className={`px-4 py-2 bg-${themeColor}-600 text-white rounded hover:bg-${themeColor}-700 flex items-center gap-2`}>
                      <Save className="w-4 h-4" /> Enregistrer les changements
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Display Leader */}
                  <div className={`p-6 bg-${themeColor}-50 rounded-xl border border-${themeColor}-100 text-center relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Users className={`w-24 h-24 text-${themeColor}-600`} />
                    </div>

                    <div className="relative z-10 mx-auto w-24 h-24 mb-4">
                      <div className={`w-24 h-24 rounded-full bg-${themeColor}-200 text-${themeColor}-700 flex items-center justify-center overflow-hidden border-4 border-white shadow-md`}>
                        {unit.leaderPhoto ? (
                          <img src={unit.leaderPhoto} alt={unit.leaderName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold">R</span>
                        )}
                      </div>
                    </div>

                    <h4 className={`text-sm uppercase tracking-wide text-${themeColor}-500 font-semibold mb-1 relative z-10`}>Responsable</h4>
                    <p className="text-lg font-bold text-slate-800 relative z-10 mb-2">{unit.leaderName}</p>

                    {(unit.leaderPhone || unit.leaderEmail) && (
                      <div className={`relative z-10 border-t border-${themeColor}-200 pt-2 mt-2 text-sm space-y-1`}>
                        {unit.leaderPhone && (
                          <div className="flex justify-center items-center gap-2 mb-1">
                            <a
                              href={`tel:${unit.leaderPhone.replace(/\s/g, '')}`}
                              className={`flex items-center justify-center gap-2 text-${themeColor}-800 hover:text-${themeColor}-600 hover:bg-${themeColor}-100 py-1 px-2 rounded-full transition-colors`}
                              title="Appeler"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{unit.leaderPhone}</span>
                            </a>
                            <button
                              onClick={() => openWhatsApp(unit.leaderPhone || '', unit.leaderName || '')}
                              className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-full transition-colors border border-green-200"
                              title="Contacter sur WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {unit.leaderEmail && (
                          <div className={`flex items-center justify-center gap-2 text-${themeColor}-800`}>
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{unit.leaderEmail}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Display Deputy */}
                  <div className={`p-6 bg-${secondaryColor}-50 rounded-xl border border-${secondaryColor}-100 text-center relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Users className={`w-24 h-24 text-${secondaryColor}-600`} />
                    </div>

                    <div className="relative z-10 mx-auto w-24 h-24 mb-4">
                      <div className={`w-24 h-24 rounded-full bg-${secondaryColor}-200 text-${secondaryColor}-700 flex items-center justify-center overflow-hidden border-4 border-white shadow-md`}>
                        {unit.assistantPhoto ? (
                          <img src={unit.assistantPhoto} alt={unit.assistantName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold">A</span>
                        )}
                      </div>
                    </div>

                    <h4 className={`text-sm uppercase tracking-wide text-${secondaryColor}-500 font-semibold mb-1 relative z-10`}>Adjoint</h4>
                    <p className="text-lg font-bold text-slate-800 relative z-10 mb-2">{unit.assistantName}</p>

                    {(unit.assistantPhone || unit.assistantEmail) && (
                      <div className={`relative z-10 border-t border-${secondaryColor}-200 pt-2 mt-2 text-sm space-y-1`}>
                        {unit.assistantPhone && (
                          <div className="flex justify-center items-center gap-2 mb-1">
                            <a
                              href={`tel:${unit.assistantPhone.replace(/\s/g, '')}`}
                              className={`flex items-center justify-center gap-2 text-${secondaryColor}-800 hover:text-${secondaryColor}-600 hover:bg-${secondaryColor}-100 py-1 px-2 rounded-full transition-colors`}
                              title="Appeler"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{unit.assistantPhone}</span>
                            </a>
                            <button
                              onClick={() => openWhatsApp(unit.assistantPhone || '', unit.assistantName || '')}
                              className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-full transition-colors border border-green-200"
                              title="Contacter sur WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {unit.assistantEmail && (
                          <div className={`flex items-center justify-center gap-2 text-${secondaryColor}-800`}>
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{unit.assistantEmail}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
              {/* Stat 1: Members */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md hover:border-blue-100">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Total Membres</p>
                  <p className="text-3xl font-bold text-slate-800">{unit.members.length}</p>
                </div>
              </div>

              {/* Stat 2: Total Activities */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md hover:border-emerald-100">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Activités (Total)</p>
                  <p className="text-3xl font-bold text-slate-800">{(unit.activityReports || []).length}</p>
                </div>
              </div>

              {/* Stat 3: Current Year Activities */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md hover:border-amber-100">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Activités {currentYear}</p>
                  <p className="text-3xl font-bold text-slate-800">{currentYearReportsCount}</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB: MEMBERS */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
              <div>
                <h3 className="text-lg font-bold text-slate-700">
                  Liste des Membres ({filteredMembers.length}{memberSearchQuery && filteredMembers.length !== unit.members.length ? ` / ${unit.members.length}` : ''})
                </h3>
                <p className="text-xs text-slate-400">Gérez l'effectif de votre {isUnit ? 'unité' : 'comité'}</p>
              </div>

              <div className="flex gap-2 items-center">
                <ExportActions
                  onCsv={() => handleExportMembers('csv')}
                  onWord={() => handleExportMembers('word')}
                />

                {/* STRICT ADMIN CHECK FOR MEMBERS EDITING */}
                {isAdmin && !isEditingMembers && (
                  <button
                    onClick={startEditingMembers}
                    className={`bg-${themeColor}-50 text-${themeColor}-600 hover:bg-${themeColor}-100 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm border border-${themeColor}-100`}
                  >
                    <Edit2 className="w-4 h-4" /> Modifier la liste
                  </button>
                )}
              </div>
            </div>

            {isAdmin && isEditingMembers ? (
              // MODE EDITION
              <div className={`bg-white rounded-xl shadow-sm border border-${themeColor}-200 p-6 space-y-4 no-print`}>
                <div className={`flex items-center gap-2 text-${themeColor}-700 bg-${themeColor}-50 p-3 rounded-lg mb-4`}>
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Vous êtes en mode édition. Mettez à jour les coordonnées, ajoutez des membres ou supprimez des lignes.</span>
                </div>

                <div className="space-y-6">
                  {editedMembers.map((member, idx) => (
                    <div key={idx} className="flex flex-col gap-3 animate-in fade-in bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-mono text-sm font-bold">Membre #{idx + 1}</span>
                        <button
                          onClick={() => removeMemberRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Supprimer cette ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Photo Upload */}
                        <div className="md:col-span-1 flex justify-center">
                          <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                              {member.photo ? (
                                <img src={member.photo} alt="Membre" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-full h-full p-2 text-slate-400" />
                              )}
                            </div>
                            <label className={`absolute bottom-0 right-0 bg-${themeColor}-600 text-white rounded-full p-1 cursor-pointer hover:bg-${themeColor}-700`}>
                              <Camera className="w-3 h-3" />
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMemberImageUpload(e, idx)} />
                            </label>
                          </div>
                        </div>

                        {/* Info Inputs */}
                        <div className="md:col-span-3">
                          <label className="block text-xs text-slate-500 mb-1">Nom Complet</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => updateMemberField(idx, 'name', e.target.value)}
                            className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none text-sm bg-white text-slate-900`}
                            placeholder="Nom et Prénoms"
                            autoFocus={member.name === ''}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs text-slate-500 mb-1">Profession</label>
                          <input
                            type="text"
                            value={member.profession || ''}
                            onChange={(e) => updateMemberField(idx, 'profession', e.target.value)}
                            className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none text-sm bg-white text-slate-900`}
                            placeholder="Ex: Enseignant"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs text-slate-500 mb-1">Téléphone</label>
                          <input
                            type="tel"
                            value={member.phone || ''}
                            onChange={(e) => updateMemberField(idx, 'phone', e.target.value)}
                            className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none text-sm bg-white text-slate-900`}
                            placeholder="Téléphone"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs text-slate-500 mb-1">Localisation</label>
                          <input
                            type="text"
                            value={member.location || ''}
                            onChange={(e) => updateMemberField(idx, 'location', e.target.value)}
                            className={`w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-${themeColor}-500 outline-none text-sm bg-white text-slate-900`}
                            placeholder="Lieu d'habitation"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addMemberRow}
                  className={`w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-${themeColor}-400 hover:text-${themeColor}-600 hover:bg-${themeColor}-50 transition-all flex items-center justify-center gap-2`}
                >
                  <Plus className="w-4 h-4" /> Ajouter un membre
                </button>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsEditingMembers(false)}
                    className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveMembers}
                    className={`px-6 py-2 bg-${themeColor}-600 text-white hover:bg-${themeColor}-700 rounded-lg flex items-center gap-2 font-medium shadow-sm`}
                  >
                    <Save className="w-4 h-4" /> Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              // MODE AFFICHAGE
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Barre de Recherche (Affichée uniquement en mode lecture et s'il y a des membres) */}
                {unit.members.length > 0 && (
                  <div className="p-4 bg-slate-50 border-b border-slate-100 no-print">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom ou localisation..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 outline-none`}
                      />
                      {memberSearchQuery && (
                        <button
                          onClick={() => setMemberSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {filteredMembers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider print:bg-white print:text-black">
                          <th className="p-4 font-semibold border-b border-slate-100">#</th>
                          <th className="p-4 font-semibold border-b border-slate-100">Membre</th>
                          <th className="p-4 font-semibold border-b border-slate-100">Contact</th>
                          <th className="p-4 font-semibold border-b border-slate-100">Localisation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMembers.map((member, idx) => (
                          <tr key={member.id || idx} className={`hover:bg-${themeColor}-50/30 transition-colors group print:hover:bg-transparent`}>
                            <td className="p-4 text-slate-400 font-mono text-sm w-12 print:text-black">{idx + 1}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-${themeColor}-100 flex items-center justify-center text-${themeColor}-700 font-bold overflow-hidden border border-${themeColor}-200 no-print`}>
                                  {member.photo ? (
                                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{member.name.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{member.name}</div>
                                  {member.profession && (
                                    <div className={`text-xs text-${themeColor}-600 flex items-center gap-1 print:text-black`}>
                                      <Briefcase className="w-3 h-3 no-print" />
                                      {member.profession}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              {member.phone ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Phone className={`w-3 h-3 text-${themeColor}-400 no-print`} />
                                    {member.phone}
                                  </div>
                                  <button
                                    onClick={() => setContactMember(member)}
                                    className={`ml-2 p-1.5 text-${themeColor}-600 bg-${themeColor}-50 hover:bg-${themeColor}-100 rounded-full transition-colors border border-${themeColor}-200 no-print shadow-sm flex items-center gap-1.5 px-2.5`}
                                    title="Lancer un échange vocal"
                                  >
                                    <PhoneCall className="w-3 h-3" />
                                    <span className="text-xs font-bold">Appeler</span>
                                  </button>
                                </div>
                              ) : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              {member.location ? (
                                <div className="flex items-center gap-2">
                                  <MapPin className={`w-3 h-3 text-${themeColor}-400 no-print`} />
                                  {member.location}
                                </div>
                              ) : <span className="text-slate-300">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400 no-print">
                    {unit.members.length === 0 ? (
                      <>
                        <UserPlus className="w-12 h-12 mb-2 text-slate-200" />
                        <p className="italic">Aucun membre enregistré pour le moment.</p>
                        {isAdmin && (
                          <button onClick={startEditingMembers} className={`mt-4 text-${themeColor}-600 text-sm hover:underline`}>
                            Commencer à ajouter des membres
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <Search className="w-12 h-12 mb-2 text-slate-200" />
                        <p className="italic">Aucun membre trouvé pour "{memberSearchQuery}".</p>
                        <button
                          onClick={() => setMemberSearchQuery('')}
                          className={`mt-2 text-${themeColor}-600 text-sm hover:underline`}
                        >
                          Effacer la recherche
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: PROGRAM */}
        {activeTab === 'program' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
            <div className="flex justify-between items-center mb-6 no-print">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className={`w-5 h-5 text-${themeColor}-500`} /> PROGRAMME D'ACTION (V2)
              </h3>

              <div className="flex gap-2 items-center">
                <ExportActions
                  onCsv={() => handleExportProgram('csv')}
                  onWord={() => handleExportProgram('word')}
                  onPdf={() => handleExportProgram('pdf')}
                />
                {isAdmin && !isEditingProgram && (
                  <button
                    onClick={startEditingProgram}
                    className={`text-${themeColor}-600 hover:bg-${themeColor}-50 px-3 py-1 rounded text-sm font-medium flex items-center gap-1 border border-${themeColor}-100`}
                  >
                    <Edit2 className="w-3 h-3" /> Modifier le programme
                  </button>
                )}
              </div>
            </div>

            {/* VISUALISATION DU BUDGET (GRAPHIQUE) - AJOUTÉ ICI */}
            {!isEditingProgram && getTotalBudget() > 0 && (
              <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
                {/* Carte Total Budget */}
                <div className={`bg-gradient-to-br from-${themeColor}-600 to-${themeColor}-800 rounded-xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Coins className="w-24 h-24" />
                  </div>
                  <div>
                    <p className={`text-${themeColor}-200 font-medium text-sm mb-1 uppercase tracking-wider`}>Budget Total Estimé</p>
                    <h2 className="text-3xl font-bold font-mono">{getTotalBudget().toLocaleString('fr-FR')} FCFA</h2>
                  </div>
                  <div className={`mt-6 pt-4 border-t border-${themeColor}-400/30 flex justify-between items-center text-xs text-${themeColor}-200`}>
                    <span>{((unit as any).programme || []).length} activités programmées</span>
                    <span className="flex items-center gap-1"><PieChart className="w-3 h-3" /> Analyse en cours</span>
                  </div>
                </div>

                {/* Graphique à Barres (Répartition) */}
                <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <h4 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
                    <PieChart className="w-4 h-4" /> Répartition du Budget par Activité
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {getBudgetChartData().map((item, idx) => (
                      <div key={idx} className="group cursor-pointer">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700 truncate max-w-[70%]">{item.activity}</span>
                          <span className="text-slate-500 font-mono">{item.budget.toLocaleString()} ({item.percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`bg-${themeColor}-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-${themeColor}-600`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        {/* DETAILS ON HOVER */}
                        <div className="h-0 overflow-hidden group-hover:h-auto transition-all duration-300 opacity-0 group-hover:opacity-100">
                          <div className="pt-2 text-[10px] text-slate-500 grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.date}</div>
                            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</div>
                            <div className="flex items-center gap-1"><User className="w-3 h-3" /> {item.assignedTo}</div>
                            {item.resources && <div className="col-span-2 flex items-center gap-1 italic"><Wrench className="w-3 h-3" /> {item.resources}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isEditingProgram ? (
              <div className="space-y-4 no-print">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <th className="p-3 w-32">Date</th>
                        <th className="p-3">Activité</th>
                        <th className="p-3">Lieu</th>
                        <th className="p-3 w-32">Budget (FCFA)</th>
                        <th className="p-3">Chargé de l'activité</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editedProgram.map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.date}
                              onChange={(e) => updateProgramField(idx, 'date', e.target.value)}
                              placeholder="JJ/MM"
                              className={`w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.activity}
                              onChange={(e) => updateProgramField(idx, 'activity', e.target.value)}
                              placeholder="Description"
                              className={`w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.location}
                              onChange={(e) => updateProgramField(idx, 'location', e.target.value)}
                              placeholder="Lieu"
                              className={`w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.budget || ''}
                              onChange={(e) => updateProgramField(idx, 'budget', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className={`w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.assignedTo || ''}
                              onChange={(e) => updateProgramField(idx, 'assignedTo', e.target.value)}
                              placeholder="Responsable..."
                              className={`w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.assignedContact || ''}
                              onChange={(e) => updateProgramField(idx, 'assignedContact', e.target.value)}
                              placeholder="Contact..."
                              className={`w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-${themeColor}-500 outline-none bg-white text-slate-900`}
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => removeProgramRow(idx)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={addProgramRow}
                  className={`w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-${themeColor}-400 hover:text-${themeColor}-600 hover:bg-${themeColor}-50 transition-all flex items-center justify-center gap-2`}
                >
                  <Plus className="w-4 h-4" /> Ajouter une ligne d'activité
                </button>

                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => setIsEditingProgram(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Annuler</button>
                  <button onClick={handleSaveProgram} className={`px-4 py-2 bg-${themeColor}-600 text-white rounded hover:bg-${themeColor}-700 flex items-center gap-2`}>
                    <Save className="w-4 h-4" /> Enregistrer le programme
                  </button>
                </div>
              </div>
            ) : (
              <>
                {(Array.isArray(unit.programme) && unit.programme.length > 0) ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse rounded-lg overflow-hidden border border-slate-200 print:border-collapse print:border-black">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wider print:bg-white print:text-black">
                          <th className="p-4 font-semibold border-b border-slate-200 print:border-black">Date</th>
                          <th className="p-4 font-semibold border-b border-slate-200 w-1/4 print:border-black">Activité</th>
                          <th className="p-4 font-semibold border-b border-slate-200 print:border-black">Lieu</th>
                          <th className="p-4 font-semibold border-b border-slate-200 text-right print:border-black">Budget (FCFA)</th>
                          <th className="p-4 font-semibold border-b border-slate-200 w-1/5 print:border-black">Chargé de l'activité</th>
                          <th className="p-4 font-semibold border-b border-slate-200 w-1/5 print:border-black">Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-black">
                        {((unit as any).programme || []).map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 print:hover:bg-transparent">
                            <td className={`p-4 text-sm font-medium text-${themeColor}-600 print:text-black print:border-b print:border-slate-300`}>{item.date}</td>
                            <td className="p-4 text-sm font-bold text-slate-800 print:text-black print:border-b print:border-slate-300">{item.activity}</td>
                            <td className="p-4 text-sm text-slate-600 print:text-black print:border-b print:border-slate-300">{item.location}</td>
                            <td className="p-4 text-sm font-mono text-right text-slate-700 print:text-black print:border-b print:border-slate-300">
                              {(Number(item.budget) || 0) > 0 ? (Number(item.budget) || 0).toLocaleString('fr-FR') : '-'}
                            </td>
                            <td className="p-4 text-sm text-slate-700 font-medium print:text-black print:border-b print:border-slate-300">
                              {item.assignedTo}
                            </td>
                            <td className="p-4 text-sm text-slate-700 print:text-black print:border-b print:border-slate-300">
                              {item.assignedContact}
                            </td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className={`bg-${themeColor}-50 border-t-2 border-${themeColor}-100 print:bg-transparent print:border-black`}>
                          <td colSpan={3} className={`p-4 text-right font-bold text-${themeColor}-900 uppercase text-xs tracking-widest print:text-black`}>Total Budget Prévisionnel</td>
                          <td className={`p-4 text-right font-bold text-${themeColor}-700 font-mono text-lg print:text-black`}>
                            {getTotalBudget().toLocaleString('fr-FR')} FCFA
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 no-print">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Aucun programme d'activité défini.</p>
                    {isAdmin && (
                      <button onClick={startEditingProgram} className={`mt-2 text-${themeColor}-600 font-medium hover:underline`}>
                        Définir le programme
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB: REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-8">

            {/* ANNUAL REPORT SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 no-print">
              <div className="flex justify-between items-center mb-4 border-b border-orange-100 pb-2">
                <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                  <Book className="w-5 h-5" /> Bilan Annuel
                </h3>
                {isAdmin && !isEditingAnnual && (
                  <button onClick={() => setIsEditingAnnual(true)} className="text-orange-600 hover:bg-orange-50 px-3 py-1 rounded text-sm font-medium">
                    Modifier
                  </button>
                )}
              </div>
              {isEditingAnnual ? (
                <div className="space-y-4">
                  <textarea
                    value={editAnnual}
                    onChange={(e) => setEditAnnual(e.target.value)}
                    className="w-full h-40 p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-slate-900"
                    placeholder="Rédigez le bilan annuel global ici..."
                  ></textarea>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditingAnnual(false)} className="px-3 py-1 text-slate-500 text-sm">Annuler</button>
                    <button onClick={handleSaveAnnual} className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">Enregistrer</button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 whitespace-pre-wrap italic">
                  {unit.annualReport || "Le bilan annuel n'a pas encore été rédigé."}
                </div>
              )}
            </div>

            {/* ACTIVITY REPORTS SECTION */}
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 no-print">
                <h3 className="text-lg font-bold text-slate-800">Bilans par Activité</h3>

                <div className="flex gap-2 items-center">
                  <ExportActions
                    onCsv={() => handleExportReports('csv')}
                    onWord={() => handleExportReports('word')}
                  />
                  {isAdmin && !isReportFormOpen && (
                    <button onClick={() => setIsReportFormOpen(true)} className={`bg-${themeColor}-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-${themeColor}-700 transition-colors shrink-0`}>
                      + Nouveau Bilan
                    </button>
                  )}
                </div>
              </div>

              {/* FILTERING CONTROLS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center no-print">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium w-full md:w-auto">
                  <Filter className="w-4 h-4" /> Filtrer :
                </div>

                <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Du</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className={`p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 outline-none bg-white`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Au</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className={`p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 outline-none bg-white`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 md:mt-0 ml-auto md:ml-0">
                  <button
                    onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Réinitialiser"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {(filterStartDate || filterEndDate) && (
                    <span className={`text-xs bg-${themeColor}-100 text-${themeColor}-700 px-2 py-1 rounded-full font-bold`}>
                      {filteredReports.length} Résultat(s)
                    </span>
                  )}
                </div>
              </div>

              {isReportFormOpen && (
                <div className={`bg-white p-4 rounded-xl border border-${themeColor}-200 mb-6 animate-in fade-in slide-in-from-top-4 no-print`}>
                  <h4 className={`font-semibold text-${themeColor}-900 mb-3`}>Ajouter un rapport d'activité</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="Titre de l'activité (ex: Sortie à Yopougon)"
                      className={`w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-${themeColor}-500 bg-white text-slate-900`}
                    />
                    <textarea
                      value={reportContent}
                      onChange={(e) => setReportContent(e.target.value)}
                      placeholder="Détails du bilan (âmes gagnées, difficultés, témoignages...)"
                      rows={3}
                      className={`w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-${themeColor}-500 bg-white text-slate-900`}
                    ></textarea>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsReportFormOpen(false)} className="px-3 py-1 text-slate-500 text-sm hover:bg-slate-100 rounded">Annuler</button>
                      <button onClick={handleAddReport} className={`px-3 py-1 bg-${themeColor}-600 text-white rounded text-sm hover:bg-${themeColor}-700`}>Publier</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {filteredReports.length > 0 ? (
                  (filteredReports || []).map((report, idx) => (
                    <div key={report.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative group print:border-black print:shadow-none">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-800 print:text-black">{report.title}</h4>
                          <span className="text-xs text-slate-400 print:text-black">
                            {new Date(report.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        {isAdmin && (
                          <button onClick={() => handleDeleteReport(report.id)} className="text-slate-300 hover:text-red-500 no-print">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap print:text-black">{report.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center no-print">
                    <Search className="w-10 h-10 mb-2 text-slate-300" />
                    <p>
                      {(unit.activityReports || []).length === 0
                        ? "Aucun rapport d'activité enregistré pour le moment."
                        : "Aucun rapport ne correspond à la période sélectionnée."}
                    </p>
                    {(filterStartDate || filterEndDate) && (
                      <button
                        onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                        className={`mt-2 text-${themeColor}-500 hover:underline text-xs`}
                      >
                        Effacer les filtres
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default UnitDashboard;