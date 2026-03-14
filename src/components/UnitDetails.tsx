import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft, Users, Edit3, Calendar, FileText, Save, X, Download, Trash2,
    Plus, Phone, MapPin, Search, Loader2, Heart, FileSpreadsheet,
    MessageCircle, User as UserIcon, Printer, ChevronDown, Landmark,
    HeartHandshake, Ghost, Paperclip, ClipboardCheck, Gift, Baby, HeartPulse,
    FileOutput, Settings2, ShieldCheck, Wand2, MousePointer2, ListTodo,
    Volume2, Briefcase, Info, AlertCircle, Smile, TrendingUp, DollarSign,
    Wallet, PieChart, Activity, Sparkles, HeartCrack, PartyPopper, Mail, UserCheck, Clock,
    FileJson, FileCode, FileType, ArrowLeft, UserPlus, Filter, UserRoundCheck, Stethoscope,
    TrendingDown, CheckCircle2, History, CreditCard, Receipt, Upload,
    LayoutGrid, List, Zap, Target
} from 'lucide-react';
import { EvangelismUnit, Member, ProgrammeItem, ReportItem, OfficeMember, NewSoul, Committee, TreasuryItem, UnitFile, SocialActionRecord, FollowUpLog, Announcement, AnnualReportData, ContributionRecord } from '../types';
import { db } from '../services/firebaseService';
import { doc, updateDoc } from 'firebase/firestore';
import MemberFormModal from './MemberFormModal';
import { MemberImportButton } from './MemberImportButton';
import { ProgramImportButton } from './ProgramImportButton';
import { generateId } from '../constants';
import { exportData } from '../services/exportUtils';

interface UnitDetailsProps {
    unit: EvangelismUnit | Committee;
    onBack: () => void;
    onUpdate: (unit: any) => void;
    isAdmin: boolean;
}

const MATURITY_STATUS: Record<string, { label: string, color: string }> = {
    'NOUVEAU': { label: 'Initial / Nouveau', color: 'bg-indigo-100 text-indigo-700' },
    'STABLE': { label: 'Stable / Assidu', color: 'bg-emerald-100 text-emerald-700' },
    'EN_CROISSANCE': { label: 'En Croissance', color: 'bg-blue-100 text-blue-700' },
    'MATURE': { label: 'Spirituellement Mature', color: 'bg-amber-100 text-amber-700' },
    'PERDU': { label: 'Perdu de vue', color: 'bg-red-100 text-red-700' },
};

const SOCIAL_EVENT_TYPES: Record<string, { label: string, icon: any, color: string, bg: string }> = {
    'DEATH': { label: 'Décès / Deuil', icon: Ghost, color: 'text-slate-600', bg: 'bg-slate-100' },
    'BIRTH': { label: 'Naissance', icon: Baby, color: 'text-blue-500', bg: 'bg-blue-50' },
    'WEDDING': { label: 'Mariage', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
    'SICKNESS': { label: 'Maladie / Hospitalisation', icon: Stethoscope, color: 'text-orange-500', bg: 'bg-orange-50' },
    'VISIT': { label: 'Visite de soutien', icon: HeartHandshake, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    'OTHER': { label: 'Autre événement', icon: Gift, color: 'text-amber-500', bg: 'bg-amber-50' },
};

const UnitDetails: React.FC<UnitDetailsProps> = ({ unit, onBack, onUpdate, isAdmin }) => {
    const isEvangelismUnit = 'mission' in unit;

    const [activeSubTab, setActiveSubTab] = useState<'RESP' | 'OFFICE' | 'MEMBERS' | 'SOULS' | 'PROG' | 'REPORTS' | 'TREASURY' | 'SOCIAL' | 'BILAN'>('RESP');
    const [socialFilter, setSocialFilter] = useState<'ALL' | 'DEATH' | 'BIRTH' | 'WEDDING' | 'VISIT' | 'SICKNESS'>('ALL');
    const [isEditing, setIsEditing] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [localMembers, setLocalMembers] = useState<Member[]>([]);
    const [localSouls, setLocalSouls] = useState<NewSoul[]>([]);
    const [localProgramme, setLocalProgramme] = useState<ProgrammeItem[]>([]);
    const [localReports, setLocalReports] = useState<ReportItem[]>([]);
    const [localTreasury, setLocalTreasury] = useState<TreasuryItem[]>([]);
    const [localSocialActions, setLocalSocialActions] = useState<SocialActionRecord[]>([]);
    const [localOffice, setLocalOffice] = useState<OfficeMember[]>([]);
    const [localActivityReports, setLocalActivityReports] = useState<any[]>([]);
    const [localContributions, setLocalContributions] = useState<ContributionRecord[]>([]);
    const [localInitialBalance, setLocalInitialBalance] = useState('0');
    const [localAnnualReportData, setLocalAnnualReportData] = useState<AnnualReportData | null>(null);
    const [reportType, setReportType] = useState<'MISSION' | 'GRID'>('MISSION');
    const [financeTab, setFinanceTab] = useState<'JOURNAL' | 'COTISATIONS'>('JOURNAL');

    const [activityReportView, setActivityReportView] = useState<'GRID' | 'CARDS'>('CARDS');
    const [localLeader, setLocalLeader] = useState({ name: '', phone: '', email: '', photo: '' });
    const [localAssistant, setLocalAssistant] = useState({ name: '', phone: '', email: '', photo: '' });

    useEffect(() => {
        if (isEditing) return; // Prevent overwriting unsaved manual edits
        setLocalMembers(unit.members || []);
        setLocalSouls(unit.newSouls || []);
        setLocalProgramme(unit.programme || []);
        setLocalReports(unit.reports || []);
        setLocalTreasury(unit.treasury || []);
        setLocalSocialActions(unit.socialActions || []);
        setLocalOffice(unit.office || []);
        setLocalActivityReports(unit.activityReports || []);
        setLocalContributions(unit.contributions || []);
        setLocalInitialBalance(unit.initialBalance || '0');
        let defaultAnnualReport = unit.annualReportData;
        const isElie = unit.name.toUpperCase().includes('ELIE');

        // Force defaults for ELIE if data is missing or if the introduction is empty
        if ((!defaultAnnualReport || !defaultAnnualReport.introduction) && isElie) {
            defaultAnnualReport = {
                introduction: '',
                missionField: 'SOGEFIA, PETIT ET GRAND OURS, CHÂTEAU, CIE',
                generalObjective: '1000 âmes et envoyer 50 personnes au Seigneur',
                period: "DU 07 MARS AU 10 OCTOBRE 2026",
                specificObjectivePopulation: '', specificObjectiveBudget: '',
                moralSpiritualBilan: '', internalAnalysisStrengths: '',
                internalAnalysisWeaknesses: '', recommendations: '', conclusion: '', perspectives: ''
            };
        }

        setLocalAnnualReportData(defaultAnnualReport || {
            introduction: '', generalObjective: '', missionField: '', period: '',
            specificObjectivePopulation: '', specificObjectiveBudget: '',
            moralSpiritualBilan: '', internalAnalysisStrengths: '',
            internalAnalysisWeaknesses: '', recommendations: '', conclusion: '', perspectives: ''
        });

        let initialLeaderName = unit.leaderName || '';
        if (!initialLeaderName && isElie) {
            initialLeaderName = 'Mme EDI & BONGO Raymond';
        }

        setLocalLeader({
            name: initialLeaderName,
            phone: unit.leaderPhone || '',
            email: unit.leaderEmail || '',
            photo: unit.leaderPhoto || ''
        });
        setLocalAssistant({
            name: unit.assistantName || '',
            phone: unit.assistantPhone || '',
            email: unit.assistantEmail || '',
            photo: unit.assistantPhoto || ''
        });
    }, [unit, isEditing]);

    const stats = useMemo(() => {
        const reportList = isEditing ? localReports : (unit.reports || []);
        const progList = isEditing ? localProgramme : (unit.programme || []);
        const treasuryList = isEditing ? localTreasury : (unit.treasury || []);
        const contributionList = isEditing ? localContributions : (unit.contributions || []);

        const incomeInJournal = treasuryList.reduce((acc, t) => acc + (parseInt(t.encaisse || '0') || 0), 0);
        const memberIncomes = contributionList.reduce((acc, c) => acc + (parseInt(c.amount || '0') || 0), 0);
        const totalExpenses = treasuryList.reduce((acc, t) => acc + (parseInt(t.expenses || '0') || 0), 0);
        const totalIncomes = incomeInJournal + memberIncomes;
        const initial = parseInt(localInitialBalance || '0') || 0;

        return {
            totalBudget: progList.reduce((acc, p) => acc + (parseInt(p.budget || '0') || 0), 0),
            totalExpectedAudience: reportList.reduce((acc, r) => acc + (parseInt(r.expectedAudience || '0') || 0), 0),
            totalObtainedAudience: reportList.reduce((acc, r) => acc + (parseInt(r.obtainedAudience || '0') || 0), 0),
            totalDecisions: reportList.reduce((acc, r) => acc + (parseInt(r.decisionsAdults || '0') + parseInt(r.decisionsChildren || '0')), 0),
            totalIncomes,
            totalExpenses,
            totalEncaisse: (initial + totalIncomes) - totalExpenses,
            stackedLocations: reportList.map(r => r.missionField).filter(Boolean).join(' • '),
        };
    }, [localReports, localProgramme, localTreasury, localContributions, isEditing, unit]);

    const saveAll = () => {
        onUpdate({
            ...unit,
            members: localMembers,
            newSouls: localSouls,
            treasury: localTreasury,
            socialActions: localSocialActions,
            programme: localProgramme,
            reports: localReports,
            activityReports: localActivityReports,
            office: localOffice,
            contributions: localContributions,
            initialBalance: localInitialBalance,
            annualReportData: localAnnualReportData as AnnualReportData,
            leaderName: localLeader.name,
            leaderPhone: localLeader.phone,
            leaderEmail: localLeader.email,
            leaderPhoto: localLeader.photo,
            assistantName: localAssistant.name,
            assistantPhone: localAssistant.phone,
            assistantEmail: localAssistant.email,
            assistantPhoto: localAssistant.photo
        });
        setIsEditing(false);
    };

    const handleSaveMember = (memberData: Member) => {
        const existingIndex = localMembers.findIndex(m => m.id === memberData.id);
        let updatedMembers;

        if (existingIndex > -1) {
            updatedMembers = localMembers.map(m => m.id === memberData.id ? memberData : m);
        } else {
            updatedMembers = [...localMembers, memberData];
        }

        setLocalMembers(updatedMembers);
        onUpdate({ ...unit, members: updatedMembers });
        setEditingMember(null);
    };

    const openMemberModal = (member: Member | null = null) => {
        setEditingMember(member);
        setIsMemberModalOpen(true);
    };

    const addItem = (type: string) => {
        const id = generateId();
        const today = new Date().toISOString().split('T')[0];
        if (type === 'PROG') setLocalProgramme([...localProgramme, { id, date: today, activity: '', location: '', resources: '', budget: '0', assignedTo: '', assignedContact: '' }]);
        if (type === 'REPORT') setLocalReports([...localReports, { id, date: today, missionField: '', projectedActivities: '', realizedActivities: '', expectedAudience: '0', expectedDecisions: '0', obtainedAudience: '0', activeMembers: '0', decisionsAdults: '0', decisionsChildren: '0', expectedResults: '0', indicators: '', financialCost: '0' }]);
        if (type === 'MEMBER') setLocalMembers([...localMembers, { id, name: 'Nouvel Ouvrier', profession: '', phone: '', location: '' }]);
        if (type === 'SOUL') setLocalSouls([...localSouls, { id, name: 'Nouvelle Âme', phone: '', location: '', decisionDate: today, supervisionStatus: 'NOUVEAU', followUpLogs: [] }]);
        if (type === 'TREASURY') setLocalTreasury([...localTreasury, { id, date: today, label: 'Opération', previsionnel: '0', realise: '0', sourceDevac: '0', sourceUnite: '0', expenses: '0', encaisse: '0' }]);
        if (type === 'SOCIAL') setLocalSocialActions([...localSocialActions, { id, date: today, beneficiaryName: 'Bénéficiaire', category: 'JOY', eventType: 'VISIT', eventDate: today, visitDate: '', assistanceType: '', status: 'AWAITING', isVisited: false }]);
        if (type === 'OFFICE') setLocalOffice([...localOffice, { id, position: 'Nouveau Poste', name: 'Nom du membre', phone: '', email: '' }]);
        if (type === 'ACTIVITY_GRID') setLocalActivityReports([...localActivityReports, { id, date: today, activity: '', expectedResults: '', indicators: '', obtainedResults: '', product: '', humanResources: '', financialResources: '', observations: '' }]);
        if (type === 'CONTRIBUTION') setLocalContributions([...localContributions, { id, memberId: '', memberName: '', date: today, amount: '0', month: new Date().toLocaleString('fr-FR', { month: 'long' }).toUpperCase(), year: new Date().getFullYear().toString(), status: 'PAYÉ', observation: '' }]);
    };

    const removeItem = (type: string, id: string) => {
        if (type === 'PROG') setLocalProgramme(localProgramme.filter(p => p.id !== id));
        if (type === 'REPORT') setLocalReports(localReports.filter(r => r.id !== id));
        if (type === 'MEMBER') setLocalMembers(localMembers.filter(m => m.id !== id));
        if (type === 'SOUL') setLocalSouls(localSouls.filter(s => s.id !== id));
        if (type === 'TREASURY') setLocalTreasury(localTreasury.filter(t => t.id !== id));
        if (type === 'SOCIAL') setLocalSocialActions(localSocialActions.filter(s => s.id !== id));
        if (type === 'OFFICE') setLocalOffice(localOffice.filter(o => o.id !== id));
        if (type === 'ACTIVITY_GRID') setLocalActivityReports(localActivityReports.filter(r => r.id !== id));
        if (type === 'CONTRIBUTION') setLocalContributions(localContributions.filter(c => c.id !== id));
    };

    const handleExport = async (format: 'PDF' | 'XLS' | 'XLSX' | 'DOCX' | 'PPTX', section: string) => {
        if (format === 'PDF') {
            window.print();
            setShowExportMenu(false);
            return;
        }
        const filename = `Export_${section}_${unit.name}_${new Date().toLocaleDateString('fr-FR')}`;
        let headers: string[] = [];
        let rows: string[][] = [];
        let title = `${section} - ${unit.name}`;
        let summary: { label: string, value: string } | undefined = undefined;

        if (section === 'PROGRAMME') {
            const totalBudget = stats.totalBudget;
            headers = ['Date', 'Activité', 'Lieu', 'Ressources', 'Budget', 'Part (%)', 'Chargé', 'Contact'];
            rows = localProgramme.map(p => {
                const budget = parseInt(p.budget || '0') || 0;
                const part = totalBudget > 0 ? Math.round((budget / totalBudget) * 100) : 0;
                return [
                    p.date,
                    p.activity,
                    p.location,
                    p.resources || '',
                    budget.toLocaleString(),
                    `${part}%`,
                    p.assignedTo,
                    p.assignedContact
                ];
            });
            // Add TOTAL row
            rows.push(['TOTAL', '', '', '', totalBudget.toLocaleString(), '100%', '', '']);
            summary = { label: 'Budget Global', value: totalBudget.toLocaleString() + ' FCFA' };
        } else if (section === 'FINANCE') {
            if (financeTab === 'JOURNAL') {
                headers = ['Date', 'Libellé', 'Source DEVAC', 'Source Unité', 'Montant Réel', 'Encaissé', 'Dépenses'];
                rows = localTreasury.map(t => [t.date, t.label, t.sourceDevac, t.sourceUnite, t.realise, t.encaisse, t.expenses]);
            } else {
                headers = ['Membre', 'Mois', 'Année', 'Date', 'Montant', 'Statut', 'Observations'];
                rows = localContributions.map(c => [c.memberName, c.month, c.year, c.date, c.amount, c.status, c.observation || '']);
                title = `COTISATIONS - ${unit.name}`;
            }
        } else if (section === 'BUREAU') {
            headers = ['Position', 'Nom', 'Contact', 'Email'];
            rows = localOffice.map((o: any) => [o.position, o.name, o.phone || '', o.email || '']);
        } else if (section === 'REPORTS') {
            headers = ['Date', 'Unité', 'Champ Mission', 'Activités Projetées', 'Activités Réalisées', 'Audience Prévue', 'Décisions Prévues', 'Audience Obtenue', 'Décisions Obtenues', 'Taux Décision (%)', 'Présents', 'Taux Part (%)', 'Observations / Écart'];
            const list = isEditing ? localReports : (unit.reports || []);
            rows = list.map((r, idx) => {
                const totalDecisions = (parseInt(r.decisionsAdults) || 0) + (parseInt(r.decisionsChildren) || 0);
                const obtAudience = parseInt(r.obtainedAudience || '0') || 0;
                const decisionRate = obtAudience > 0 ? (totalDecisions / obtAudience * 100).toFixed(1) : '0';
                const totalMembers = unit.members?.length || 0;
                const activeMembers = parseInt(r.activeMembers || '0') || 0;
                const memberPartRate = totalMembers > 0 ? (activeMembers / totalMembers * 100).toFixed(1) : '0';

                return [
                    r.date,
                    idx === 0 ? unit.name : '',
                    r.missionField,
                    r.projectedActivities,
                    r.realizedActivities,
                    r.expectedAudience || '0',
                    r.expectedDecisions || '0',
                    r.obtainedAudience || '0',
                    String(totalDecisions),
                    decisionRate + '%',
                    String(activeMembers),
                    memberPartRate + '%',
                    r.observations || ''
                ];
            });
            // Total Row for Export
            const adults = list.reduce((acc, r) => acc + (parseInt(r.decisionsAdults || '0') || 0), 0);
            const kids = list.reduce((acc, r) => acc + (parseInt(r.decisionsChildren || '0') || 0), 0);
            const obtAud = list.reduce((acc, r) => acc + (parseInt(r.obtainedAudience || '0') || 0), 0);
            const decs = adults + kids;
            const totalMembers = unit.members?.length || 0;
            const avgActive = list.length > 0 ? (list.reduce((acc, r) => acc + (parseInt(r.activeMembers || '0') || 0), 0) / list.length).toFixed(1) : '0';
            const avgPartRate = list.length > 0 && totalMembers > 0
                ? (list.reduce((acc, r) => acc + ((parseInt(r.activeMembers || '0') || 0) / totalMembers * 100), 0) / list.length).toFixed(1)
                : '0';

            rows.push([
                list.length > 0 ? list[list.length - 1].date : '',
                unit.name,
                list.map(r => r.missionField).filter(Boolean).join('\n'),
                list.map(r => r.projectedActivities).filter(Boolean).join('\n'),
                list.map(r => r.realizedActivities).filter(Boolean).join('\n'),
                list.reduce((acc, r) => acc + (parseInt(r.expectedAudience || '0') || 0), 0).toString(),
                list.reduce((acc, r) => acc + (parseInt(r.expectedDecisions || '0') || 0), 0).toString(),
                obtAud.toString(),
                decs.toString(),
                obtAud > 0 ? (decs / obtAud * 100).toFixed(1) + '%' : '0%',
                avgActive,
                avgPartRate + '%',
                ''
            ]);
        } else if (section === 'MEMBERS') {
            headers = ['Nom', 'Profession', 'Téléphone', 'Localisation'];
            rows = localMembers.map(m => [m.name, m.profession || '', m.phone || '', m.location || '']);
        } else if (section === 'SOULS') {
            headers = ['Nom', 'Téléphone', 'Localisation', 'Date Décision', 'Statut'];
            rows = localSouls.map(s => [s.name, s.phone || '', s.location || '', s.decisionDate, s.supervisionStatus || '']);
        } else if (section === 'SOCIAL') {
            headers = ['Date', 'Bénéficiaire', 'Événement', 'Assistance', 'Statut'];
            rows = localSocialActions.map(a => [a.date, a.beneficiaryName, a.eventType, a.assistanceType || '', a.status]);
        } else if (section === 'ACTIVITY_GRID') {
            headers = ['Date', 'Activité', 'Résultats Attendus', 'Indicateurs', 'Résultats Obtenus', 'Produit', 'Humaines', 'Financières', 'Observations'];
            rows = localActivityReports.map(r => [
                r.date,
                r.activity,
                r.expectedResults,
                r.indicators,
                r.obtainedResults,
                r.product,
                r.humanResources,
                (parseInt(r.financialResources || '0')).toLocaleString(),
                r.observations
            ]);
        }

        await exportData(format, headers, rows, filename, title, summary);
        setShowExportMenu(false);
    };

    const filteredMembers = useMemo(() => {
        const list = isEditing ? localMembers : (unit.members || []);
        return list.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()));
    }, [localMembers, unit.members, isEditing, memberSearch]);

    const addSoulFollowUp = (soulId: string) => {
        const note = prompt("Note de suivi spirituel :");
        if (!note) return;
        setLocalSouls(prev => prev.map(s => {
            if (s.id === soulId) {
                const newLog: FollowUpLog = { id: generateId(), date: new Date().toISOString().split('T')[0], status: s.supervisionStatus as any || 'NOUVEAU', observation: note };
                return { ...s, followUpLogs: [...(s.followUpLogs || []), newLog] };
            }
            return s;
        }));
    };

    const reportActivity = (p: ProgrammeItem) => {
        const id = generateId();
        const newReport: ReportItem = {
            id,
            date: p.date,
            missionField: p.location,
            projectedActivities: p.activity,
            realizedActivities: '',
            expectedAudience: '0',
            expectedDecisions: '0',
            obtainedAudience: '0',
            activeMembers: '0',
            decisionsAdults: '0',
            decisionsChildren: '0',
            expectedResults: '0',
            observations: '',
            indicators: '',
            financialCost: p.budget
        };
        setLocalReports([newReport, ...localReports]);
        setActiveSubTab('REPORTS');
        if (!isEditing) setIsEditing(true);
    };

    const reportToGrid = (p: ProgrammeItem) => {
        const id = generateId();
        const newReport = {
            id,
            date: p.date,
            activity: p.activity,
            expectedResults: '',
            indicators: '',
            obtainedResults: '',
            product: '',
            humanResources: '',
            financialResources: p.budget,
            observations: ''
        };
        setLocalActivityReports([newReport, ...localActivityReports]);
        setActiveSubTab('REPORTS');
        setReportType('GRID');
        if (!isEditing) setIsEditing(true);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'leader' | 'assistant' | 'office', id?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("L'image est trop volumineuse (max 2MB). Veuillez choisir une image plus petite.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            if (field === 'leader') {
                setLocalLeader(prev => ({ ...prev, photo: base64String }));
            } else if (field === 'assistant') {
                setLocalAssistant(prev => ({ ...prev, photo: base64String }));
            } else if (field === 'office' && id) {
                setLocalOffice(prev => prev.map(o => o.id === id ? { ...o, photo: base64String } : o));
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 animate-in fade-in duration-300 relative pb-20">

            {/* HEADER UNITÉ */}
            <div className="bg-[#0f172a] text-white p-10 relative overflow-hidden border-b border-slate-800 print:hidden">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="flex items-center gap-8">
                        <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group">
                            <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
                                DEVAC
                            </div>
                            <h2 className="text-5xl font-black uppercase tracking-tight leading-none">{unit.name}</h2>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        {isAdmin && (
                            <button
                                onClick={isEditing ? saveAll : () => setIsEditing(true)}
                                className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95 ${isEditing ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                            >
                                {isEditing ? <><Save size={20} /> ENREGISTRER</> : <><Edit3 size={20} /> ACTIVER L'ÉDITION</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* NAVIGATION TABS */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden overflow-x-auto no-scrollbar">
                <div className="container mx-auto px-4 flex gap-2">
                    {[
                        { id: 'RESP', label: 'Direction', icon: ShieldCheck },
                        { id: 'OFFICE', label: 'Bureau', icon: ListTodo },
                        { id: 'MEMBERS', label: 'Membres', icon: Users },
                        { id: 'SOULS', label: 'Âmes', icon: HeartPulse },
                        { id: 'SOCIAL', label: 'Action Sociale', icon: HeartHandshake },
                        { id: 'PROG', label: 'Programme', icon: Calendar },
                        { id: 'REPORTS', label: 'Rapports', icon: FileText },
                        { id: 'TREASURY', label: 'Finances', icon: Landmark },
                        { id: 'BILAN', label: 'Bilan Annuel', icon: FileText },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveSubTab(tab.id as any); }}
                            className={`flex items-center gap-3 px-8 py-6 text-[11px] font-black whitespace-nowrap transition-all border-b-4 uppercase tracking-[0.15em] ${activeSubTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="container mx-auto p-6 md:p-10 max-w-7xl">

                {/* SECTION DIRECTION */}
                {activeSubTab === 'RESP' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in">
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col gap-8 transition-all hover:shadow-2xl">
                            <div className="flex items-center gap-8">
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-indigo-400 font-black text-4xl shadow-lg ring-8 ring-indigo-50/50 uppercase overflow-hidden">
                                        {localLeader.photo ? (
                                            <img src={localLeader.photo} alt={localLeader.name} className="w-full h-full object-cover" />
                                        ) : (
                                            (localLeader.name || 'R').charAt(0)
                                        )}
                                    </div>
                                    {isEditing && (
                                        <label className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all">
                                            <Upload size={14} />
                                            <input type="file" className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, 'leader')} />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-1">Responsable Principal</div>
                                    {isEditing ? <input value={localLeader.name} onChange={e => setLocalLeader({ ...localLeader, name: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-xl outline-none" /> : <div className="text-3xl font-black uppercase text-slate-800 truncate">{localLeader.name || "Non défini"}</div>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone</div>
                                    {isEditing ? <input value={localLeader.phone} onChange={e => setLocalLeader({ ...localLeader, phone: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" /> : <div className="text-slate-600 font-bold bg-slate-50 p-3 rounded-xl flex items-center gap-3"><Phone size={18} /> {localLeader.phone || "—"}</div>}
                                </div>
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</div>
                                    {isEditing ? <input value={localLeader.email} onChange={e => setLocalLeader({ ...localLeader, email: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" /> : <div className="text-slate-600 font-bold bg-slate-50 p-3 rounded-xl flex items-center gap-3"><Mail size={18} /> {localLeader.email || "—"}</div>}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col gap-8 transition-all hover:shadow-2xl">
                            <div className="flex items-center gap-8">
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-emerald-400 font-black text-4xl shadow-lg ring-8 ring-emerald-50/50 uppercase overflow-hidden">
                                        {localAssistant.photo ? (
                                            <img src={localAssistant.photo} alt={localAssistant.name} className="w-full h-full object-cover" />
                                        ) : (
                                            (localAssistant.name || 'A').charAt(0)
                                        )}
                                    </div>
                                    {isEditing && (
                                        <label className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 text-white rounded-xl cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all">
                                            <Upload size={14} />
                                            <input type="file" className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, 'assistant')} />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-1">Adjoint / Assistant</div>
                                    {isEditing ? <input value={localAssistant.name} onChange={e => setLocalAssistant({ ...localAssistant, name: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-xl outline-none" /> : <div className="text-3xl font-black uppercase text-slate-800 truncate">{localAssistant.name || "Non défini"}</div>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone</div>
                                    {isEditing ? <input value={localAssistant.phone} onChange={e => setLocalAssistant({ ...localAssistant, phone: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" /> : <div className="text-slate-600 font-bold bg-slate-50 p-3 rounded-xl flex items-center gap-3"><Phone size={18} /> {localAssistant.phone || "—"}</div>}
                                </div>
                                <div className="space-y-4">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</div>
                                    {isEditing ? <input value={localAssistant.email} onChange={e => setLocalAssistant({ ...localAssistant, email: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" /> : <div className="text-slate-600 font-bold bg-slate-50 p-3 rounded-xl flex items-center gap-3"><Mail size={18} /> {localAssistant.email || "—"}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECTION MEMBRES - OPÉRATIONNELLE */}
                {activeSubTab === 'MEMBERS' && (
                    <div className="space-y-10 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner"><Users size={32} /></div>
                                <div>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Membres de l'Unité</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Gestion des effectifs et contacts</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Download size={18} className="text-indigo-600" /> EXPORTER
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <button onClick={() => handleExport('XLSX', 'MEMBERS')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors">
                                                <Landmark size={16} className="text-emerald-500" /> Excel (XLSX)
                                            </button>
                                            <button onClick={() => handleExport('DOCX', 'MEMBERS')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <FileType size={16} className="text-blue-500" /> Word (DOCX)
                                            </button>
                                            <button onClick={() => handleExport('PPTX', 'MEMBERS')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Sparkles size={16} className="text-orange-500" /> PowerPoint (PPTX)
                                            </button>
                                            <button onClick={() => handleExport('PDF', 'MEMBERS')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Printer size={16} className="text-red-500" /> Format PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Chercher un membre..." className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all w-64 shadow-sm" />
                                </div>
                                <MemberImportButton
                                    unitId={unit.id}
                                    currentMembers={localMembers}
                                    onImportComplete={() => {
                                        // The component will handle the refresh via its internal logic 
                                        // or we can force a sync here if needed.
                                        // Since we pass localMembers as prop, and the component updates DB,
                                        // we might need to refresh local state if listener doesn't catch it fast enough.
                                    }}
                                />
                                <button
                                    onClick={() => isEditing ? addItem('MEMBER') : setIsMemberModalOpen(true)}
                                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all text-sm"
                                >
                                    <UserPlus size={20} className="inline mr-2" /> AJOUTER UN MEMBRE
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredMembers.map(m => (
                                <div key={m.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-xl hover:scale-105 transition-all group relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl uppercase shadow-inner overflow-hidden">
                                            {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : m.name.charAt(0)}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openMemberModal(m)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                title="Modifier"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            {isEditing && (
                                                <button
                                                    onClick={() => removeItem('MEMBER', m.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <input value={m.name} onChange={e => setLocalMembers(prev => prev.map(i => i.id === m.id ? { ...i, name: e.target.value } : i))} className="w-full bg-slate-50 p-2 rounded text-xs font-black uppercase" placeholder="Nom..." />
                                                <input value={m.profession || ''} onChange={e => setLocalMembers(prev => prev.map(i => i.id === m.id ? { ...i, profession: e.target.value } : i))} className="w-full bg-slate-50 p-2 rounded text-[10px] font-bold" placeholder="Profession..." />
                                                <input value={m.phone || ''} onChange={e => setLocalMembers(prev => prev.map(i => i.id === m.id ? { ...i, phone: e.target.value } : i))} className="w-full bg-slate-50 p-2 rounded text-[10px] font-bold" placeholder="Tél..." />
                                            </div>
                                        ) : (
                                            <>
                                                <h4 className="text-sm font-black uppercase text-slate-800 truncate mb-1">{m.name}</h4>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.profession || "OUVRIER"}</div>
                                                {m.phone && <div className="text-[10px] font-medium text-indigo-500 mt-2 flex items-center gap-1"><Phone size={10} /> {m.phone}</div>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECTION ÂMES - OPÉRATIONNELLE */}
                {activeSubTab === 'SOULS' && (
                    <div className="space-y-10 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 shadow-inner"><HeartPulse size={32} /></div>
                                <div>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Suivi des Âmes</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Accompagnement et journal d'encadrement</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Download size={18} className="text-pink-600" /> EXPORTER
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <button onClick={() => handleExport('XLSX', 'SOULS')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-pink-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors">
                                                <Landmark size={16} className="text-emerald-500" /> Excel (XLSX)
                                            </button>
                                            <button onClick={() => handleExport('DOCX', 'SOULS')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-pink-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <FileType size={16} className="text-blue-500" /> Word (DOCX)
                                            </button>
                                            <button onClick={() => handleExport('PPTX', 'SOULS')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-pink-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Sparkles size={16} className="text-orange-500" /> PowerPoint (PPTX)
                                            </button>
                                            <button onClick={() => handleExport('PDF', 'SOULS')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-pink-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Printer size={16} className="text-red-500" /> Format PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <button onClick={() => addItem('SOUL')} className="px-8 py-4 bg-pink-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                                        <UserPlus size={20} className="inline mr-2" /> NOUVELLE ÂME
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(isEditing ? localSouls : (unit.newSouls || [])).map(s => (
                                <div key={s.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col gap-6 hover:shadow-pink-500/5 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center font-black text-2xl uppercase">{(s.name || 'U').charAt(0)}</div>
                                            <div>
                                                {isEditing ? <input value={s.name} onChange={e => setLocalSouls(prev => prev.map(i => i.id === s.id ? { ...i, name: e.target.value } : i))} className="w-full bg-slate-50 border-none rounded-lg text-sm font-black p-2 uppercase" /> : <h4 className="text-lg font-black uppercase text-slate-800">{s.name}</h4>}
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Conversion : {s.decisionDate}</div>
                                            </div>
                                        </div>
                                        {isEditing && <button onClick={() => removeItem('SOUL', s.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>}
                                    </div>

                                    <div className="space-y-4">
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border ${MATURITY_STATUS[s.supervisionStatus || 'NOUVEAU'].color}`}>
                                            {isEditing ? (
                                                <select value={s.supervisionStatus} onChange={e => setLocalSouls(prev => prev.map(i => i.id === s.id ? { ...i, supervisionStatus: e.target.value } : i))} className="bg-transparent border-none outline-none font-black w-full cursor-pointer">{Object.keys(MATURITY_STATUS).map(k => <option key={k} value={k}>{MATURITY_STATUS[k].label}</option>)}</select>
                                            ) : MATURITY_STATUS[s.supervisionStatus || 'NOUVEAU'].label}
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Journal de Bord</span>
                                                <button onClick={() => addSoulFollowUp(s.id)} className="text-pink-600 hover:text-pink-700 transition-colors"><Plus size={16} /></button>
                                            </div>
                                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                                                {(s.followUpLogs || []).map(log => (
                                                    <div key={log.id} className="text-[10px] leading-tight text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                                                        <span className="font-black text-indigo-600 mr-1">{log.date} :</span> {log.observation}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECTION ACTION SOCIALE - OPÉRATIONNELLE */}
                {activeSubTab === 'SOCIAL' && (
                    <div className="space-y-10 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner"><HeartHandshake size={32} /></div>
                                <div>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Registre Social</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Fraternité et soutien aux membres</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Download size={18} className="text-rose-600" /> EXPORTER
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <button onClick={() => handleExport('XLSX', 'SOCIAL')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors">
                                                <Landmark size={16} className="text-emerald-500" /> Excel (XLSX)
                                            </button>
                                            <button onClick={() => handleExport('DOCX', 'SOCIAL')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <FileType size={16} className="text-blue-500" /> Word (DOCX)
                                            </button>
                                            <button onClick={() => handleExport('PPTX', 'SOCIAL')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Sparkles size={16} className="text-orange-500" /> PowerPoint (PPTX)
                                            </button>
                                            <button onClick={() => handleExport('PDF', 'SOCIAL')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Printer size={16} className="text-red-500" /> Format PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <button onClick={() => addItem('SOCIAL')} className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                                        <Plus size={20} className="inline mr-2" /> NOUVELLE FICHE
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            {(isEditing ? localSocialActions : (unit.socialActions || [])).map(action => (
                                <div key={action.id} className={`bg-white rounded-[3rem] p-8 border shadow-sm flex flex-col gap-6 transition-all ${action.category === 'JOY' ? 'border-emerald-100' : 'border-rose-100'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${action.category === 'JOY' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{SOCIAL_EVENT_TYPES[action.eventType]?.icon && React.createElement(SOCIAL_EVENT_TYPES[action.eventType].icon, { size: 24 })}</div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Événement</div>
                                                {isEditing ? (
                                                    <select value={action.eventType} onChange={e => { const val = e.target.value as any; setLocalSocialActions(prev => prev.map(i => i.id === action.id ? { ...i, eventType: val } : i)); }} className="bg-transparent border-none font-black text-sm outline-none">{Object.keys(SOCIAL_EVENT_TYPES).map(k => <option key={k} value={k}>{SOCIAL_EVENT_TYPES[k].label}</option>)}</select>
                                                ) : <span className="font-black uppercase text-sm text-slate-800">{SOCIAL_EVENT_TYPES[action.eventType]?.label}</span>}
                                            </div>
                                        </div>
                                        {isEditing && <button onClick={() => removeItem('SOCIAL', action.id)} className="text-slate-200 hover:text-red-500"><Trash2 size={20} /></button>}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Bénéficiaire</label>
                                            {isEditing ? <input value={action.beneficiaryName} onChange={e => setLocalSocialActions(prev => prev.map(i => i.id === action.id ? { ...i, beneficiaryName: e.target.value } : i))} className="w-full bg-slate-50 p-2 rounded text-sm font-black uppercase" /> : <div className="text-lg font-black text-slate-800 uppercase">{action.beneficiaryName}</div>}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Détails de l'assistance</label>
                                            {isEditing ? <textarea value={action.assistanceType} onChange={e => setLocalSocialActions(prev => prev.map(i => i.id === action.id ? { ...i, assistanceType: e.target.value } : i))} className="w-full bg-slate-50 p-2 rounded text-xs font-medium" /> : <p className="text-xs text-slate-600 leading-relaxed italic">"{action.assistanceType || 'Pas de détails'}"</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECTION FINANCES - OPÉRATIONNELLE */}
                {activeSubTab === 'TREASURY' && (
                    <div className="space-y-10 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner"><Landmark size={32} /></div>
                                <div>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Gestion Financière</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Suivi des flux et cotisations membres</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white border-2 border-indigo-50 px-6 py-4 rounded-[1.5rem] flex flex-col items-center shadow-sm">
                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Solde Initial</span>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={localInitialBalance}
                                                onChange={e => setLocalInitialBalance(e.target.value)}
                                                className="w-24 bg-indigo-50 text-indigo-700 text-lg font-black text-center rounded-lg outline-none"
                                            />
                                        ) : (
                                            <span className="text-xl font-black tabular-nums text-indigo-600">{parseInt(localInitialBalance).toLocaleString()} <span className="text-[10px] opacity-40">FCFA</span></span>
                                        )}
                                    </div>
                                    <div className="bg-emerald-50 border-2 border-white px-6 py-4 rounded-[1.5rem] flex flex-col items-center shadow-sm">
                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Entrées</span>
                                        <span className="text-xl font-black tabular-nums text-emerald-700">{stats.totalIncomes.toLocaleString()} <span className="text-[10px] opacity-40">FCFA</span></span>
                                    </div>
                                    <div className="bg-rose-50 border-2 border-white px-6 py-4 rounded-[1.5rem] flex flex-col items-center shadow-sm">
                                        <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Dépenses</span>
                                        <span className="text-xl font-black tabular-nums text-rose-700">{stats.totalExpenses.toLocaleString()} <span className="text-[10px] opacity-40">FCFA</span></span>
                                    </div>
                                    <div className="bg-slate-950 text-white px-6 py-4 rounded-[1.5rem] border-b-4 border-emerald-500 flex flex-col items-center shadow-xl">
                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 opacity-60">Solde Disponible</span>
                                        <span className="text-xl font-black tabular-nums">{stats.totalEncaisse.toLocaleString()} <span className="text-[10px] opacity-30">FCFA</span></span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Download size={18} className="text-emerald-600" /> EXPORTER
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <button onClick={() => handleExport('XLSX', 'FINANCE')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors">
                                                <Landmark size={16} className="text-emerald-500" /> Excel (XLSX)
                                            </button>
                                            <button onClick={() => handleExport('DOCX', 'FINANCE')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <FileType size={16} className="text-blue-500" /> Word (DOCX)
                                            </button>
                                            <button onClick={() => handleExport('PPTX', 'FINANCE')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Sparkles size={16} className="text-orange-500" /> PowerPoint (PPTX)
                                            </button>
                                            <button onClick={() => handleExport('PDF', 'FINANCE')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Printer size={16} className="text-red-500" /> Format PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <button onClick={() => addItem(financeTab === 'JOURNAL' ? 'TREASURY' : 'CONTRIBUTION')} className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl"><Plus size={32} /></button>
                                )}
                            </div>
                        </div>

                        {/* SUB-TABS FINANCE */}
                        <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl w-fit">
                            <button
                                onClick={() => setFinanceTab('JOURNAL')}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${financeTab === 'JOURNAL' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Journal de Caisse
                            </button>
                            <button
                                onClick={() => setFinanceTab('COTISATIONS')}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${financeTab === 'COTISATIONS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Cotisations Membres
                            </button>
                        </div>

                        {financeTab === 'JOURNAL' ? (
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                                <table className="w-full text-left min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] text-center">
                                            <th className="px-8 py-6">Date</th>
                                            <th className="px-8 py-6">Libellé</th>
                                            <th className="px-8 py-6">Source DEVAC</th>
                                            <th className="px-8 py-6">Source Unité</th>
                                            <th className="px-8 py-6">Montant Réel</th>
                                            <th className="px-8 py-6">Encaissé</th>
                                            <th className="px-8 py-6">Dépenses</th>
                                            {isEditing && <th className="px-4 py-6"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-center">
                                        {(isEditing ? localTreasury : (unit.treasury || [])).map(t => (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-5 text-xs font-black text-slate-400">{isEditing ? <input value={t.date} type="date" onChange={e => setLocalTreasury(prev => prev.map(i => i.id === t.id ? { ...i, date: e.target.value } : i))} className="bg-slate-50 p-1 rounded text-[10px]" /> : t.date}</td>
                                                <td className="px-8 py-5 text-sm font-black text-slate-800 uppercase">{isEditing ? <input value={t.label} onChange={e => setLocalTreasury(prev => prev.map(i => i.id === t.id ? { ...i, label: e.target.value } : i))} className="w-full bg-slate-50 border-none rounded p-1 text-xs" /> : t.label}</td>
                                                <td className="px-8 py-5 text-xs font-bold text-indigo-500">{isEditing ? <input value={t.sourceDevac} type="number" onChange={e => setLocalTreasury(prev => prev.map(i => i.id === t.id ? { ...i, sourceDevac: e.target.value } : i))} className="w-20 bg-slate-50 p-1 rounded" /> : parseInt(t.sourceDevac || '0').toLocaleString()}</td>
                                                <td className="px-8 py-5 text-xs font-bold text-emerald-500">{isEditing ? <input value={t.sourceUnite} type="number" onChange={e => setLocalTreasury(prev => prev.map(i => i.id === t.id ? { ...i, sourceUnite: e.target.value } : i))} className="w-20 bg-slate-50 p-1 rounded" /> : parseInt(t.sourceUnite || '0').toLocaleString()}</td>
                                                <td className="px-8 py-5 text-xs font-black text-indigo-400">{isEditing ? <input value={t.realise} type="number" onChange={e => setLocalTreasury(prev => prev.map(i => i.id === t.id ? { ...i, realise: e.target.value } : i))} className="w-20 bg-slate-50 p-1 rounded" /> : parseInt(t.realise || '0').toLocaleString()}</td>
                                                <td className="px-8 py-5 text-sm font-black text-slate-900 whitespace-nowrap">{isEditing ? <input value={t.encaisse} type="number" onChange={e => setLocalTreasury(prev => prev.map(i => i.id === t.id ? { ...i, encaisse: e.target.value } : i))} className="w-24 bg-slate-900 text-emerald-400 p-2 rounded-xl text-center font-black" /> : <span className="text-emerald-600">+{parseInt(t.encaisse || '0').toLocaleString()}</span>}</td>
                                                <td className="px-8 py-5 text-sm font-black text-slate-900 whitespace-nowrap">{isEditing ? <input value={t.expenses || '0'} type="number" onChange={e => setLocalTreasury(prev => prev.map(i => i.id === t.id ? { ...i, expenses: e.target.value } : i))} className="w-24 bg-rose-50 border-2 border-rose-100 text-rose-600 p-2 rounded-xl text-center font-black" /> : <span className="text-rose-600">-{parseInt(t.expenses || '0').toLocaleString()}</span>}</td>
                                                {isEditing && <td className="px-4 py-5"><button onClick={() => removeItem('TREASURY', t.id)} className="text-slate-200 hover:text-red-500"><Trash2 size={18} /></button></td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                                <table className="w-full text-left min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-indigo-950 text-white text-[10px] font-black uppercase tracking-[0.2em] text-center">
                                            <th className="px-8 py-6">Membre</th>
                                            <th className="px-8 py-6">Mois</th>
                                            <th className="px-8 py-6">Année</th>
                                            <th className="px-8 py-6">Date de Paiement</th>
                                            <th className="px-8 py-6">Montant (FCFA)</th>
                                            <th className="px-8 py-6">Statut</th>
                                            <th className="px-8 py-6">Observations</th>
                                            {isEditing && <th className="px-4 py-6"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-center">
                                        {(isEditing ? localContributions : (unit.contributions || [])).map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <select
                                                            value={c.memberId}
                                                            onChange={e => {
                                                                const m = localMembers.find(m => m.id === e.target.value);
                                                                setLocalContributions(prev => prev.map(i => i.id === c.id ? { ...i, memberId: e.target.value, memberName: m?.name || '' } : i));
                                                            }}
                                                            className="w-full bg-slate-50 p-2 rounded-lg text-[10px] font-black uppercase outline-none ring-2 ring-transparent focus:ring-indigo-100"
                                                        >
                                                            <option value="">SÉLECTIONNER...</option>
                                                            {localMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                        </select>
                                                    ) : <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{c.memberName || 'Inconnu'}</div>}
                                                </td>
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <select
                                                            value={c.month}
                                                            onChange={e => setLocalContributions(prev => prev.map(i => i.id === c.id ? { ...i, month: e.target.value } : i))}
                                                            className="bg-slate-50 p-2 rounded-lg text-[10px] font-black uppercase outline-none"
                                                        >
                                                            {['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'].map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    ) : <span className="text-[10px] font-black text-slate-400">{c.month}</span>}
                                                </td>
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <input
                                                            value={c.year}
                                                            onChange={e => setLocalContributions(prev => prev.map(i => i.id === c.id ? { ...i, year: e.target.value } : i))}
                                                            className="w-16 bg-slate-50 p-2 rounded-lg text-[10px] font-black text-center"
                                                        />
                                                    ) : <span className="text-[10px] font-black text-slate-400">{c.year}</span>}
                                                </td>
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <input
                                                            type="date"
                                                            value={c.date}
                                                            onChange={e => setLocalContributions(prev => prev.map(i => i.id === c.id ? { ...i, date: e.target.value } : i))}
                                                            className="bg-slate-50 p-2 rounded-lg text-[10px] font-black outline-none"
                                                        />
                                                    ) : <span className="text-[10px] font-black text-indigo-600">{c.date}</span>}
                                                </td>
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={c.amount}
                                                                onChange={e => setLocalContributions(prev => prev.map(i => i.id === c.id ? { ...i, amount: e.target.value } : i))}
                                                                className="w-24 bg-slate-900 text-white p-2 rounded-xl text-center text-xs font-black tabular-nums"
                                                            />
                                                        </div>
                                                    ) : <span className="text-sm font-black text-slate-900 tabular-nums">{parseInt(c.amount || '0').toLocaleString()}</span>}
                                                </td>
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <select
                                                            value={c.status}
                                                            onChange={e => setLocalContributions(prev => prev.map(i => i.id === c.id ? { ...i, status: e.target.value as any } : i))}
                                                            className={`p-2 rounded-lg text-[10px] font-black uppercase outline-none ${c.status === 'PAYÉ' ? 'bg-emerald-50 text-emerald-600' : c.status === 'PARTIEL' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}
                                                        >
                                                            <option value="PAYÉ">PAYÉ</option>
                                                            <option value="PARTIEL">PARTIEL</option>
                                                            <option value="EN_ATTENTE">EN ATTENTE</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${c.status === 'PAYÉ' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : c.status === 'PARTIEL' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                            {c.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    {isEditing ? (
                                                        <input
                                                            value={c.observation || ''}
                                                            onChange={e => setLocalContributions(prev => prev.map(i => i.id === c.id ? { ...i, observation: e.target.value } : i))}
                                                            className="w-full bg-slate-50 p-2 rounded-lg text-[10px] italic"
                                                            placeholder="Note..."
                                                        />
                                                    ) : <span className="text-[10px] text-slate-400 italic">"{c.observation || '—'}"</span>}
                                                </td>
                                                {isEditing && (
                                                    <td className="px-4 py-5">
                                                        <button onClick={() => removeItem('CONTRIBUTION', c.id)} className="text-slate-200 hover:text-red-500 transition-colors">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {localContributions.length === 0 && !isEditing && (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center"><CreditCard size={32} /></div>
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Aucun encaissement membre enregistré</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* SECTION PROGRAMME */}
                {activeSubTab === 'PROG' && (
                    <div className="space-y-10 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner"><Calendar size={32} /></div>
                                <div>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Programme d'Action</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Planification des sorties missionnaires</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Download size={18} className="text-indigo-600" /> EXPORTER
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <button onClick={() => handleExport('XLSX', 'PROGRAMME')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors">
                                                <Landmark size={16} className="text-emerald-500" /> Excel (XLSX)
                                            </button>
                                            <button onClick={() => handleExport('DOCX', 'PROGRAMME')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <FileType size={16} className="text-blue-500" /> Word (DOCX)
                                            </button>
                                            <button onClick={() => handleExport('PPTX', 'PROGRAMME')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Sparkles size={16} className="text-orange-500" /> PowerPoint (PPTX)
                                            </button>
                                            <button onClick={() => handleExport('PDF', 'PROGRAMME')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Printer size={16} className="text-red-500" /> Format PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <ProgramImportButton
                                    unitId={unit.id}
                                    currentProgramme={localProgramme}
                                    onImportComplete={() => { }}
                                />

                                {/* BUDGET GLOBAL HEADER DISPLAY */}
                                <div className="hidden lg:flex flex-col items-end bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl shadow-indigo-200 border border-white/10 group hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center gap-2 opacity-50">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Budget Global</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-2xl font-black tracking-tighter tabular-nums">{stats.totalBudget.toLocaleString()}</span>
                                        <span className="text-[10px] font-bold opacity-60">FCFA</span>
                                    </div>
                                </div>

                                {isEditing && <button onClick={() => addItem('PROG')} className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-indigo-700 transition-all active:scale-95"><Plus size={32} /></button>}
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left min-w-[1000px]">
                                <thead>
                                    <tr className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] text-center">
                                        <th className="px-6 py-5">Date</th>
                                        <th className="px-6 py-5">Activité</th>
                                        <th className="px-6 py-5">Lieu</th>
                                        <th className="px-6 py-5">Ressources</th>
                                        <th className="px-6 py-5 text-right">Budget (FCFA)</th>
                                        <th className="px-6 py-5 text-center">Part (%)</th>
                                        <th className="px-6 py-5">Chargé de l'activité</th>
                                        <th className="px-6 py-5">Contact</th>
                                        <th className="px-4 py-5">Action</th>
                                        {isEditing && <th className="px-4 py-5"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-center">
                                    {(isEditing ? localProgramme : (unit.programme || [])).map(p => (
                                        <tr key={p.id} className="hover:bg-indigo-50/10 transition-colors group">
                                            <td className="px-6 py-4 text-xs font-black text-indigo-600">{isEditing ? <input value={p.date} onChange={e => setLocalProgramme(prev => prev.map(i => i.id === p.id ? { ...i, date: e.target.value } : i))} className="bg-slate-50 p-1 rounded font-black w-20 text-center" /> : p.date}</td>
                                            <td className="px-6 py-4 text-sm font-black uppercase">{isEditing ? <textarea value={p.activity} onChange={e => setLocalProgramme(prev => prev.map(i => i.id === p.id ? { ...i, activity: e.target.value } : i))} className="bg-slate-50 p-2 rounded w-full font-bold text-xs" rows={1} /> : p.activity}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500 italic">{isEditing ? <input value={p.location} onChange={e => setLocalProgramme(prev => prev.map(i => i.id === p.id ? { ...i, location: e.target.value } : i))} className="bg-slate-50 p-1 rounded w-full" /> : p.location}</td>
                                            <td className="px-6 py-4 text-xs text-slate-400">{isEditing ? <input value={p.resources || ''} onChange={e => setLocalProgramme(prev => prev.map(i => i.id === p.id ? { ...i, resources: e.target.value } : i))} className="bg-slate-50 p-1 rounded w-full" placeholder="Ressources..." /> : (p.resources || '—')}</td>
                                            <td className="px-6 py-4 text-xs font-black text-emerald-600 text-right">{isEditing ? <input value={p.budget} type="number" onChange={e => setLocalProgramme(prev => prev.map(i => i.id === p.id ? { ...i, budget: e.target.value } : i))} className="bg-slate-50 p-1 rounded w-24 text-right" /> : parseInt(p.budget || '0').toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] font-black text-slate-900 tabular-nums">
                                                        {stats.totalBudget > 0 ? Math.round((parseInt(p.budget || '0') / stats.totalBudget) * 100) : 0}%
                                                    </span>
                                                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 transition-all duration-1000"
                                                            style={{ width: `${stats.totalBudget > 0 ? (parseInt(p.budget || '0') / stats.totalBudget) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-700">{isEditing ? <input value={p.assignedTo || ''} onChange={e => setLocalProgramme(prev => prev.map(i => i.id === p.id ? { ...i, assignedTo: e.target.value } : i))} className="bg-slate-50 p-1 rounded w-full text-center" placeholder="Responsable..." /> : (p.assignedTo || '—')}</td>
                                            <td className="px-6 py-4 text-xs text-slate-400 font-mono tracking-tighter">{isEditing ? <input value={p.assignedContact || ''} onChange={e => setLocalProgramme(prev => prev.map(i => i.id === p.id ? { ...i, assignedContact: e.target.value } : i))} className="bg-slate-50 p-1 rounded w-full text-center" placeholder="Contact..." /> : (p.assignedContact || '—')}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => reportActivity(p)}
                                                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-[9px] font-black uppercase flex items-center gap-1"
                                                    >
                                                        <ClipboardCheck size={12} /> Mission
                                                    </button>
                                                    <button
                                                        onClick={() => reportToGrid(p)}
                                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-[9px] font-black uppercase flex items-center gap-1"
                                                    >
                                                        <Activity size={12} /> Grille
                                                    </button>
                                                </div>
                                            </td>
                                            {isEditing && <td className="px-4 py-4"><button onClick={() => removeItem('PROG', p.id)} className="text-slate-200 hover:text-red-500"><Trash2 size={18} /></button></td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeSubTab === 'OFFICE' && (
                    <div className="space-y-10 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner"><ListTodo size={32} /></div>
                                <div>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Bureau de l'Unité</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Équipe dirigeante et responsabilités ({new Date().getFullYear()})</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Download size={18} className="text-indigo-600" /> EXPORTER
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <button onClick={() => handleExport('XLSX', 'BUREAU')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors">
                                                <Landmark size={16} className="text-emerald-500" /> Excel (XLSX)
                                            </button>
                                            <button onClick={() => handleExport('DOCX', 'BUREAU')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <FileType size={16} className="text-blue-500" /> Word (DOCX)
                                            </button>
                                            <button onClick={() => handleExport('PPTX', 'BUREAU')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Sparkles size={16} className="text-orange-500" /> PowerPoint (PPTX)
                                            </button>
                                            <button onClick={() => handleExport('PDF', 'BUREAU')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Printer size={16} className="text-red-500" /> Format PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <button onClick={() => addItem('OFFICE')} className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-slate-800 transition-all active:scale-95 border-b-4 border-indigo-500">
                                        <Plus size={32} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(isEditing ? localOffice : (unit.office || [])).map((o: any) => (
                                <div key={o.id} className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col gap-6 hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="relative group">
                                                <div className="w-16 h-16 bg-slate-950 text-indigo-400 rounded-2xl flex items-center justify-center font-black text-2xl uppercase shadow-lg ring-4 ring-indigo-50 overflow-hidden shrink-0">
                                                    {o.photo ? <img src={o.photo} alt={o.name} className="w-full h-full object-cover" /> : (o.name || 'B').charAt(0)}
                                                </div>
                                                {isEditing && (
                                                    <label className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 text-white rounded-lg cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all">
                                                        <Upload size={12} />
                                                        <input type="file" className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, 'office', o.id)} />
                                                    </label>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <input
                                                        value={o.position}
                                                        onChange={e => setLocalOffice(prev => prev.map(i => i.id === o.id ? { ...i, position: e.target.value } : i))}
                                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-2 text-[10px] font-black uppercase outline-none focus:border-indigo-300 transition-all"
                                                        placeholder="Poste / Position..."
                                                    />
                                                ) : <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">{o.position}</div>}
                                                {isEditing ? (
                                                    <input
                                                        value={o.name}
                                                        onChange={e => setLocalOffice(prev => prev.map(i => i.id === o.id ? { ...i, name: e.target.value } : i))}
                                                        className="w-full mt-1 bg-white border-2 border-indigo-100 rounded-xl p-2 text-sm font-black uppercase outline-none focus:border-indigo-500 transition-all"
                                                        placeholder="Nom complet..."
                                                    />
                                                ) : <h4 className="text-lg font-black uppercase text-slate-800 truncate">{o.name}</h4>}
                                            </div>
                                        </div>
                                        {isEditing && <button onClick={() => removeItem('OFFICE', o.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 pt-6 border-t border-slate-50">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact Direct</label>
                                            {isEditing ? (
                                                <div className="relative">
                                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input
                                                        value={o.phone || ''}
                                                        onChange={e => setLocalOffice(prev => prev.map(i => i.id === o.id ? { ...i, phone: e.target.value } : i))}
                                                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-300 transition-all"
                                                        placeholder="N° de téléphone..."
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-slate-700 font-bold bg-slate-50 p-3 rounded-2xl flex items-center gap-3 text-sm">
                                                    <Phone size={16} className="text-indigo-500" /> {o.phone || "Non renseigné"}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Adresse Email</label>
                                            {isEditing ? (
                                                <div className="relative">
                                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input
                                                        value={o.email || ''}
                                                        onChange={e => setLocalOffice(prev => prev.map(i => i.id === o.id ? { ...i, email: e.target.value } : i))}
                                                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-300 transition-all"
                                                        placeholder="Email..."
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-slate-700 font-medium bg-slate-50 p-3 rounded-2xl flex items-center gap-3 text-xs italic">
                                                    <Mail size={16} className="text-indigo-500" /> {o.email || "Non renseignée"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECTION RAPPORTS */}
                {activeSubTab === 'REPORTS' && (
                    <div className="space-y-10 animate-in fade-in">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner"><FileText size={32} /></div>
                                <div>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Rapports d'Activités</h3>
                                    <div className="flex gap-4 mt-4">
                                        <button
                                            onClick={() => setReportType('MISSION')}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'MISSION' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                        >
                                            Rapports Mission
                                        </button>
                                        <button
                                            onClick={() => setReportType('GRID')}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'GRID' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                        >
                                            Grille d'Activité
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <Download size={18} className={reportType === 'MISSION' ? "text-emerald-600" : "text-indigo-600"} /> EXPORTER
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <button onClick={() => handleExport('XLSX', reportType === 'MISSION' ? 'REPORTS' : 'ACTIVITY_GRID')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors">
                                                <Landmark size={16} className="text-emerald-500" /> Excel (XLSX)
                                            </button>
                                            <button onClick={() => handleExport('DOCX', reportType === 'MISSION' ? 'REPORTS' : 'ACTIVITY_GRID')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <FileType size={16} className="text-blue-500" /> Word (DOCX)
                                            </button>
                                            <button onClick={() => handleExport('PDF', reportType === 'MISSION' ? 'REPORTS' : 'ACTIVITY_GRID')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                                <Printer size={16} className="text-red-500" /> Format PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {isEditing && <button onClick={() => addItem(reportType === 'MISSION' ? 'REPORT' : 'ACTIVITY_GRID')} className={`w-16 h-16 ${reportType === 'MISSION' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white rounded-2xl flex items-center justify-center shadow-xl transition-all`}><Plus size={32} /></button>}
                            </div>
                        </div>

                        {reportType === 'MISSION' ? (
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                                <table className="w-full text-left min-w-[1400px] border-collapse">
                                    <thead>
                                        <tr className="bg-[#8da9d4] text-white text-[10px] font-black uppercase tracking-[0.2em] text-center">
                                            <th rowSpan={2} className="px-4 py-5 border-r border-white/20">DATE</th>
                                            <th rowSpan={2} className="px-4 py-5 border-r border-white/20">UNITES</th>
                                            <th rowSpan={2} className="px-4 py-5 border-r border-white/20">CHAMPS DE MISSION</th>
                                            <th colSpan={2} className="px-4 py-3 border-r border-white/20 border-b border-white/20">ACTIVITES</th>
                                            <th colSpan={2} className="px-4 py-3 border-r border-white/20 border-b border-white/20">RESULTATS ATTENDUS</th>
                                            <th colSpan={2} className="px-4 py-3 border-r border-white/20 border-b border-white/20 uppercase">RÉSULTATS OBTENUS</th>
                                            <th rowSpan={2} className="px-4 py-5 border-r border-white/20 uppercase leading-tight">TX DÉCISION<br />(%)</th>
                                            <th rowSpan={2} className="px-4 py-5 border-r border-white/20 uppercase">PRÉSENTS</th>
                                            <th rowSpan={2} className="px-4 py-5 border-r border-white/20 uppercase leading-tight">TX PART. MEMBRES<br />(%)</th>
                                            <th rowSpan={2} className="px-4 py-5 uppercase leading-tight">OBSERVATIONS & ÉCART</th>
                                            {isEditing && <th rowSpan={2} className="px-4 py-5"></th>}
                                        </tr>
                                        <tr className="bg-[#8da9d4] text-white text-[9px] font-black uppercase tracking-widest text-center">
                                            <th className="px-4 py-3 border-r border-white/20">PROJETÉES</th>
                                            <th className="px-4 py-3 border-r border-white/20">REALISÉES</th>
                                            <th className="px-4 py-3 border-r border-white/20">AUDIENCE</th>
                                            <th className="px-4 py-3 border-r border-white/20">DECISIONS</th>
                                            <th className="px-4 py-3 border-r border-white/20">AUDIENCE</th>
                                            <th className="px-4 py-3 border-r border-white/20">DECISIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-center uppercase text-[10px] font-bold font-mono">
                                        {(isEditing ? localReports : (unit.reports || [])).map((r, idx) => {
                                            const expAudience = parseInt(r.expectedAudience || '0') || 0;
                                            const expDecisions = parseInt(r.expectedDecisions || '0') || 0;
                                            const obtAudience = parseInt(r.obtainedAudience || '0') || 0;
                                            const totalDecisions = (parseInt(r.decisionsAdults) || 0) + (parseInt(r.decisionsChildren) || 0);
                                            const activeMembers = parseInt(r.activeMembers || '0') || 0;
                                            const totalMembers = unit.members?.length || 1;

                                            const decisionRate = obtAudience > 0 ? (totalDecisions / obtAudience * 100).toFixed(1) : '0';
                                            const memberPartRate = (activeMembers / totalMembers * 100).toFixed(1);

                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-4 border-r border-slate-100 text-slate-500">
                                                        {isEditing ? <input value={r.date} type="date" onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, date: e.target.value } : i))} className="bg-slate-50 p-1 rounded text-[9px]" /> : r.date}
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-slate-100 font-black text-slate-800">{idx === 0 ? unit.name : ''}</td>
                                                    <td className="px-4 py-4 border-r border-slate-100 text-slate-600">
                                                        {isEditing ? <input value={r.missionField} onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, missionField: e.target.value } : i))} className="w-full bg-slate-50 p-2 rounded text-[10px]" /> : r.missionField}
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-slate-100 text-slate-500 whitespace-pre-wrap text-left text-[9px]">
                                                        {isEditing ? <textarea value={r.projectedActivities} onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, projectedActivities: e.target.value } : i))} className="w-full bg-slate-50 p-2 rounded text-[9px]" rows={3} /> : r.projectedActivities}
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-slate-100 text-slate-500 whitespace-pre-wrap text-left text-[9px]">
                                                        {isEditing ? <textarea value={r.realizedActivities} onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, realizedActivities: e.target.value } : i))} className="w-full bg-slate-50 p-2 rounded text-[9px]" rows={3} /> : r.realizedActivities}
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-slate-100 text-slate-800 tabular-nums font-black">
                                                        {isEditing ? <input value={r.expectedAudience} type="number" onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, expectedAudience: e.target.value } : i))} className="w-16 bg-slate-50 p-2 rounded text-center" /> : expAudience.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-slate-100 text-slate-800 tabular-nums font-black">
                                                        {isEditing ? <input value={r.expectedDecisions} type="number" onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, expectedDecisions: e.target.value } : i))} className="w-16 bg-slate-50 p-2 rounded text-center" /> : expDecisions.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-slate-100 text-slate-800 tabular-nums font-black">
                                                        {isEditing ? <input value={r.obtainedAudience} type="number" onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, obtainedAudience: e.target.value } : i))} className="w-16 bg-slate-50 p-2 rounded text-center" /> : obtAudience.toLocaleString()}
                                                    </td>
                                                    <td colSpan={1} className="px-4 py-4 border-r border-slate-100 text-slate-800 text-[9px]">
                                                        {isEditing ? (
                                                            <div className="flex gap-1 justify-center">
                                                                <input value={r.decisionsAdults} type="number" placeholder="Ads" onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, decisionsAdults: e.target.value } : i))} className="w-12 bg-slate-50 p-1 rounded text-center" />
                                                                <input value={r.decisionsChildren} type="number" placeholder="Ens" onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, decisionsChildren: e.target.value } : i))} className="w-12 bg-slate-50 p-1 rounded text-center" />
                                                            </div>
                                                        ) : (
                                                            <><span className="font-black">{totalDecisions.toLocaleString()}</span> <span className="lowercase font-normal text-slate-400 text-[8px]">({r.decisionsAdults} ads, {r.decisionsChildren} ens)</span></>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-slate-100 text-slate-800 tabular-nums font-black">
                                                        {decisionRate}%
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-slate-100 text-slate-800 tabular-nums font-black">
                                                        {isEditing ? <input value={r.activeMembers} type="number" onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, activeMembers: e.target.value } : i))} className="w-16 bg-slate-50 p-2 rounded text-center" /> : activeMembers}
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-slate-100 text-emerald-600 tabular-nums font-black">
                                                        {memberPartRate}%
                                                    </td>
                                                    <td className="px-4 py-4 text-left">
                                                        <div className="flex flex-col gap-2">
                                                            {isEditing ? (
                                                                <textarea
                                                                    value={r.observations || ''}
                                                                    onChange={e => setLocalReports(prev => prev.map(i => i.id === r.id ? { ...i, observations: e.target.value } : i))}
                                                                    className="w-full bg-slate-50 p-2 rounded text-[9px] font-medium normal-case"
                                                                    placeholder="Notes/Observations..."
                                                                    rows={2}
                                                                />
                                                            ) : (
                                                                <>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {(() => {
                                                                            const audGap = expAudience - obtAudience;
                                                                            const decGap = expDecisions - totalDecisions;
                                                                            return (
                                                                                <>
                                                                                    <span className={`px-2 py-1 rounded text-[8px] font-black ${audGap <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                                        ÉCART AUD.: {audGap > 0 ? '+' : ''}{audGap} ({expAudience > 0 ? (obtAudience / expAudience * 100).toFixed(1) : '0'}%)
                                                                                    </span>
                                                                                    <span className={`px-2 py-1 rounded text-[8px] font-black ${decGap <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                                        ÉCART DÉC.: {decGap > 0 ? '+' : ''}{decGap} ({expDecisions > 0 ? (totalDecisions / expDecisions * 100).toFixed(1) : '0'}%)
                                                                                    </span>
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    {r.observations && <p className="text-[9px] text-slate-500 normal-case italic leading-tight">{r.observations}</p>}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {isEditing && <td className="px-4 py-4"><button onClick={() => removeItem('REPORT', r.id)} className="text-slate-200 hover:text-red-500"><Trash2 size={18} /></button></td>}
                                                </tr>
                                            );
                                        })}

                                        {/* TOTAL ROW */}
                                        <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200 uppercase text-[9px] tracking-widest leading-tight">
                                            <td className="px-4 py-5 border-r border-slate-200">
                                                {(() => {
                                                    const list = isEditing ? localReports : (unit.reports || []);
                                                    return list.length > 0 ? list[list.length - 1].date : '';
                                                })()}
                                            </td>
                                            <td className="px-4 py-5 border-r border-slate-200">{unit.name}</td>
                                            <td className="px-4 py-5 border-r border-slate-200 text-left whitespace-pre-wrap">
                                                {(() => {
                                                    const list = isEditing ? localReports : (unit.reports || []);
                                                    return list.map(r => r.missionField).filter(Boolean).join('\n');
                                                })()}
                                            </td>
                                            <td className="px-4 py-5 border-r border-slate-200 text-left whitespace-pre-wrap text-slate-400 font-normal">
                                                {(() => {
                                                    const list = isEditing ? localReports : (unit.reports || []);
                                                    return list.map(r => r.projectedActivities).filter(Boolean).join('\n');
                                                })()}
                                            </td>
                                            <td className="px-4 py-5 border-r border-slate-200 text-left whitespace-pre-wrap text-slate-400 font-normal">
                                                {(() => {
                                                    const list = isEditing ? localReports : (unit.reports || []);
                                                    return list.map(r => r.realizedActivities).filter(Boolean).join('\n');
                                                })()}
                                            </td>
                                            <td className="px-4 py-5 border-r border-slate-200 tabular-nums">
                                                {(isEditing ? localReports : (unit.reports || [])).reduce((acc, r) => acc + (parseInt(r.expectedAudience || '0') || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-5 border-r border-slate-200 tabular-nums">
                                                {(isEditing ? localReports : (unit.reports || [])).reduce((acc, r) => acc + (parseInt(r.expectedDecisions || '0') || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-5 border-r border-slate-200 tabular-nums">
                                                {(isEditing ? localReports : (unit.reports || [])).reduce((acc, r) => acc + (parseInt(r.obtainedAudience || '0') || 0), 0).toLocaleString()}
                                            </td>
                                            <td colSpan={1} className="px-4 py-5 border-r border-slate-200">
                                                {(() => {
                                                    const list = isEditing ? localReports : (unit.reports || []);
                                                    const adults = list.reduce((acc, r) => acc + (parseInt(r.decisionsAdults || '0') || 0), 0);
                                                    const kids = list.reduce((acc, r) => acc + (parseInt(r.decisionsChildren || '0') || 0), 0);
                                                    return <><span className="font-black">{(adults + kids).toLocaleString()}</span> <span className="lowercase font-normal text-slate-400 text-[8px]">({adults} ads, {kids} ens)</span></>;
                                                })()}
                                            </td>
                                            <td className="px-4 py-5 border-r border-slate-200">
                                                {(() => {
                                                    const list = isEditing ? localReports : (unit.reports || []);
                                                    const obtAud = list.reduce((acc, r) => acc + (parseInt(r.obtainedAudience || '0') || 0), 0);
                                                    const decs = list.reduce((acc, r) => acc + (parseInt(r.decisionsAdults || '0') || 0) + (parseInt(r.decisionsChildren || '0') || 0), 0);
                                                    return obtAud > 0 ? (decs / obtAud * 100).toFixed(1) + '%' : '-';
                                                })()}
                                            </td>
                                            <td className="px-4 py-5 border-r border-slate-200">
                                                {(() => {
                                                    const list = isEditing ? localReports : (unit.reports || []);
                                                    const sum = list.reduce((acc, r) => acc + (parseInt(r.activeMembers || '0') || 0), 0);
                                                    return list.length > 0 ? (sum / list.length).toFixed(1) : '0';
                                                })()}
                                            </td>
                                            <td className="px-4 py-5 border-r border-slate-200 tabular-nums">
                                                {(() => {
                                                    const list = isEditing ? localReports : (unit.reports || []);
                                                    const totalMems = unit.members?.length || 0;
                                                    if (totalMems === 0 || list.length === 0) return '0%';
                                                    const sumRates = list.reduce((acc, r) => {
                                                        const active = parseInt(r.activeMembers || '0') || 0;
                                                        return acc + (active / totalMems * 100);
                                                    }, 0);
                                                    return (sumRates / list.length).toFixed(1) + '%';
                                                })()}
                                            </td>
                                            <td className="px-4 py-5">
                                                {(() => {
                                                    const list = isEditing ? localReports : (unit.reports || []);
                                                    const totalExpAud = list.reduce((acc, r) => acc + (parseInt(r.expectedAudience || '0') || 0), 0);
                                                    const totalObtAud = list.reduce((acc, r) => acc + (parseInt(r.obtainedAudience || '0') || 0), 0);
                                                    const totalExpDec = list.reduce((acc, r) => acc + (parseInt(r.expectedDecisions || '0') || 0), 0);
                                                    const totalObtDec = list.reduce((acc, r) => acc + (parseInt(r.decisionsAdults || '0') || 0) + (parseInt(r.decisionsChildren || '0') || 0), 0);
                                                    const audGap = totalExpAud - totalObtAud;
                                                    const decGap = totalExpDec - totalObtDec;
                                                    const audPct = totalExpAud > 0 ? (totalObtAud / totalExpAud * 100).toFixed(1) : '0';
                                                    const decPct = totalExpDec > 0 ? (totalObtDec / totalExpDec * 100).toFixed(1) : '0';
                                                    return (
                                                        <div className="flex gap-2 justify-center">
                                                            <span className={`px-2 py-1 rounded text-[8px] ${audGap <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>ÉCART AUD.: {audGap > 0 ? '+' : ''}{audGap} ({audPct}%)</span>
                                                            <span className={`px-2 py-1 rounded text-[8px] ${decGap <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>ÉCART DÉC.: {decGap > 0 ? '+' : ''}{decGap} ({decPct}%)</span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            {isEditing && <td></td>}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <h4 className="text-2xl font-black text-center md:text-left uppercase tracking-[0.2em] text-slate-800">Rapport d'Activité</h4>
                                    <div className="flex bg-slate-200/50 p-1 rounded-xl items-center">
                                        <button
                                            onClick={() => setActivityReportView('CARDS')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activityReportView === 'CARDS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <LayoutGrid size={14} /> Cartes
                                        </button>
                                        <button
                                            onClick={() => setActivityReportView('GRID')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activityReportView === 'GRID' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <List size={14} /> Grille
                                        </button>
                                    </div>
                                </div>

                                {activityReportView === 'CARDS' && !isEditing ? (
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/30">
                                        {(unit.activityReports || []).map((r: any) => (
                                            <div key={r.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
                                                <div className="p-6 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                                            <Calendar size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{r.date}</span>
                                                        </div>
                                                        <h5 className="text-sm font-black text-slate-800 line-clamp-2 leading-tight">{r.activity}</h5>
                                                    </div>
                                                </div>
                                                <div className="p-6 space-y-4 flex-1">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5 align-middle">
                                                            <Target size={10} /> Objectif Visé
                                                        </span>
                                                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{r.expectedResults}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
                                                            <Zap size={10} /> Indicateurs
                                                        </span>
                                                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{r.indicators}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                                                            <CheckCircle2 size={10} /> Résultats Obtenus
                                                        </span>
                                                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{r.obtainedResults}</p>
                                                    </div>
                                                </div>
                                                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 grid grid-cols-3 gap-2">
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">Produit</span>
                                                        <span className="text-xs font-black text-slate-700">{r.product || '0'}</span>
                                                    </div>
                                                    <div className="text-center border-x border-slate-200/50">
                                                        <span className="block text-[8px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">Humaines</span>
                                                        <span className="text-xs font-black text-slate-700">{r.humanResources || '0'}</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[8px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">Budget</span>
                                                        <span className="text-xs font-black text-indigo-600">{(parseInt(r.financialResources || '0')).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {r.observations && (
                                                    <div className="px-6 py-4 bg-amber-50/30 border-t border-amber-100/30 italic text-[10px] text-slate-500 font-medium">
                                                        <span className="font-black normal-case not-italic uppercase text-slate-400 text-[8px] mr-1">Obs :</span> "{r.observations}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {(unit.activityReports || []).length === 0 && (
                                            <div className="col-span-full py-20 text-center space-y-4">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                                    <FileText size={32} />
                                                </div>
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun rapport d'activité enregistré</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[1400px] border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest text-center">
                                                    <th rowSpan={2} className="px-5 py-6 border-b border-slate-100">DATES</th>
                                                    <th rowSpan={2} className="px-5 py-6 border-b border-slate-100">ACTIVITES</th>
                                                    <th rowSpan={2} className="px-5 py-6 border-b border-slate-100">OBJECTIFS VISÉS</th>
                                                    <th rowSpan={2} className="px-5 py-6 border-b border-slate-100">INDICATEURS</th>
                                                    <th rowSpan={2} className="px-5 py-6 border-b border-slate-100">RÉSULTATS REELS</th>
                                                    <th rowSpan={2} className="px-5 py-6 border-b border-slate-100">PRODUIT</th>
                                                    <th colSpan={2} className="px-5 py-4 border-b border-slate-100 bg-slate-100/30">RESSOURCES</th>
                                                    <th rowSpan={2} className="px-5 py-6 border-b border-slate-100">OBSERVATIONS</th>
                                                    {isEditing && <th rowSpan={2} className="px-5 py-6 border-b border-slate-100"></th>}
                                                </tr>
                                                <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest text-center">
                                                    <th className="px-5 py-3 border-b border-slate-100 border-l border-slate-100">HUMAINES</th>
                                                    <th className="px-5 py-3 border-b border-slate-100">FINANCIERES</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-center text-[11px] font-medium text-slate-700">
                                                {(isEditing ? localActivityReports : (unit.activityReports || [])).map((r: any) => (
                                                    <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                                                        <td className="px-4 py-5 font-black text-indigo-600 whitespace-nowrap">
                                                            {isEditing ? <input value={r.date} type="date" onChange={e => setLocalActivityReports(prev => prev.map(i => i.id === r.id ? { ...i, date: e.target.value } : i))} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-[10px]" /> : r.date}
                                                        </td>
                                                        <td className="px-4 py-5 font-black text-slate-800 text-left min-w-[200px]">
                                                            {isEditing ? <textarea value={r.activity} onChange={e => setLocalActivityReports(prev => prev.map(i => i.id === r.id ? { ...i, activity: e.target.value } : i))} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-[10px]" rows={2} /> : r.activity}
                                                        </td>
                                                        <td className="px-4 py-5 text-left leading-relaxed min-w-[200px] text-slate-500">
                                                            {isEditing ? <textarea value={r.expectedResults} onChange={e => setLocalActivityReports(prev => prev.map(i => i.id === r.id ? { ...i, expectedResults: e.target.value } : i))} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-[10px]" rows={2} /> : r.expectedResults}
                                                        </td>
                                                        <td className="px-4 py-5 text-left leading-relaxed min-w-[200px] text-slate-500">
                                                            {isEditing ? <textarea value={r.indicators} onChange={e => setLocalActivityReports(prev => prev.map(i => i.id === r.id ? { ...i, indicators: e.target.value } : i))} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-[10px]" rows={2} /> : r.indicators}
                                                        </td>
                                                        <td className="px-4 py-5 text-left leading-relaxed min-w-[200px] text-slate-500 border-r border-slate-50">
                                                            {isEditing ? <textarea value={r.obtainedResults} onChange={e => setLocalActivityReports(prev => prev.map(i => i.id === r.id ? { ...i, obtainedResults: e.target.value } : i))} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-[10px]" rows={2} /> : r.obtainedResults}
                                                        </td>
                                                        <td className="px-4 py-5 font-black text-slate-800">
                                                            {isEditing ? <input value={r.product} type="number" onChange={e => setLocalActivityReports(prev => prev.map(i => i.id === r.id ? { ...i, product: e.target.value } : i))} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-center" /> : r.product}
                                                        </td>
                                                        <td className="px-4 py-5 font-black text-slate-800 bg-slate-50/30">
                                                            {isEditing ? <input value={r.humanResources} type="number" onChange={e => setLocalActivityReports(prev => prev.map(i => i.id === r.id ? { ...i, humanResources: e.target.value } : i))} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-center" /> : r.humanResources}
                                                        </td>
                                                        <td className="px-4 py-5 font-black text-indigo-600 bg-slate-50/30">
                                                            {isEditing ? <input value={r.financialResources} type="number" onChange={e => setLocalActivityReports(prev => prev.map(i => i.id === r.id ? { ...i, financialResources: e.target.value } : i))} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-center" /> : (parseInt(r.financialResources || '0')).toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-5 text-left italic text-slate-400 min-w-[200px]">
                                                            {isEditing ? <textarea value={r.observations} onChange={e => setLocalActivityReports(prev => prev.map(i => i.id === r.id ? { ...i, observations: e.target.value } : i))} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-[10px]" rows={2} /> : r.observations}
                                                        </td>
                                                        {isEditing && <td className="px-4 py-5"><button onClick={() => removeItem('ACTIVITY_GRID', r.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></td>}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* SECTION BILAN ANNUEL */}
                {activeSubTab === 'BILAN' && localAnnualReportData && (
                    <div className="container mx-auto p-6 md:p-10 max-w-7xl space-y-8 animate-in fade-in">
                        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b-2 border-slate-50">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tight text-slate-800 flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                            <FileText size={28} />
                                        </div>
                                        Génération du Bilan Annuel
                                    </h3>
                                    <p className="text-slate-500 mt-2 font-medium max-w-2xl text-sm">Complétez les sections ci-dessous pour générer le rapport annuel complet. Les tableaux de trésorerie, d'âmes et d'activités seront automatiquement inclus dans l'export.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <button onClick={() => exportData('DOCX', [], [], `Bilan_Annuel_${new Date().getFullYear()}_${unit.name.substring(0, 10)}`, 'BILAN ANNUEL', undefined, { unitName: unit.name, year: new Date().getFullYear().toString(), bilanData: localAnnualReportData, stats, leaderName: localLeader.name })} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                                        <FileText size={18} /> Word
                                    </button>
                                    <button onClick={() => window.alert('Export PDF en cours de développement...')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/30 transition-all active:scale-95">
                                        <Download size={18} /> PDF
                                    </button>
                                    <button onClick={() => window.alert('Export PPTX en cours de développement...')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-orange-500/30 transition-all active:scale-95">
                                        <Download size={18} /> PPTX
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                                {/* Introduction & Objectifs */}
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-5 shadow-inner">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> 1. Introduction & Objectifs</h4>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Introduction</label>
                                            <textarea disabled={!isEditing} value={localAnnualReportData.introduction} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, introduction: e.target.value })} className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Rédigez l'introduction du bilan..."></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Champ Missionnaire</label>
                                            <input disabled={!isEditing} value={localAnnualReportData.missionField} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, missionField: e.target.value })} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Ex: Riviéra Palmeraie..." />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Période d'activités</label>
                                            <input disabled={!isEditing} value={localAnnualReportData.period || ''} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, period: e.target.value })} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Ex: DU 07 MARS AU 10 OCTOBRE..." />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Objectif Général</label>
                                            <textarea disabled={!isEditing} value={localAnnualReportData.generalObjective} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, generalObjective: e.target.value })} className="w-full h-20 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Évangéliser et implanter une église..."></textarea>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Population à atteindre</label>
                                                <input disabled={!isEditing} type="text" value={localAnnualReportData.specificObjectivePopulation} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, specificObjectivePopulation: e.target.value })} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Ex: 500 personnes" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Budget Prévu (FCFA)</label>
                                                <input disabled={!isEditing} type="text" value={localAnnualReportData.specificObjectiveBudget} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, specificObjectiveBudget: e.target.value })} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Ex: 1 500 000 FCFA" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-5 shadow-inner">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 2. Bilan Moral & Spirituel</h4>
                                        <textarea disabled={!isEditing} value={localAnnualReportData.moralSpiritualBilan} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, moralSpiritualBilan: e.target.value })} className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Analyse de la santé spirituelle de l'unité, engagement des membres..."></textarea>
                                    </div>
                                </div>

                                {/* Analyse Interne & Conclusion */}
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-5 shadow-inner">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> 3. Analyse Interne</h4>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Points Forts</label>
                                            <textarea disabled={!isEditing} value={localAnnualReportData.internalAnalysisStrengths} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, internalAnalysisStrengths: e.target.value })} className="w-full h-24 p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="- Forte mobilisation...\n- Respect du programme..."></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">Points Faibles</label>
                                            <textarea disabled={!isEditing} value={localAnnualReportData.internalAnalysisWeaknesses} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, internalAnalysisWeaknesses: e.target.value })} className="w-full h-24 p-4 bg-rose-50/30 border border-rose-100 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-rose-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="- Manque de suivi post-campagne...\n- Retards occasionnels..."></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Propositions / Recommandations</label>
                                            <textarea disabled={!isEditing} value={localAnnualReportData.recommendations} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, recommendations: e.target.value })} className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Que suggérez-vous pour améliorer..."></textarea>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-5 shadow-inner">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> 4. Perspectives & Conclusion</h4>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Perspectives</label>
                                            <textarea disabled={!isEditing} value={localAnnualReportData.perspectives} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, perspectives: e.target.value })} className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Quels sont les axes d'intervention pour l'année prochaine ?"></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Conclusion</label>
                                            <textarea disabled={!isEditing} value={localAnnualReportData.conclusion} onChange={e => setLocalAnnualReportData({ ...localAnnualReportData, conclusion: e.target.value })} className="w-full h-20 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium resize-none focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Mot de fin..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* END SECTION BILAN ANNUEL */}

                <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 20px; }
        
        @media print {
            @page { margin: 1cm; size: landscape; }
            .print\\:hidden { display: none !important; }
            body { background: white !important; }
            .bg-white { background: white !important; }
            .shadow-sm, .shadow-xl, .shadow-2xl { shadow: none !important; }
            .container { max-width: 100% !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { border: 1px solid #e2e8f0 !important; }
            .bg-indigo-600 { background-color: #1E5AA8 !important; -webkit-print-color-adjust: exact; }
            .text-white { color: white !important; -webkit-print-color-adjust: exact; }
            .bg-slate-900 { background-color: #0f172a !important; -webkit-print-color-adjust: exact; }
            .animate-in { animation: none !important; }
        }
      `}</style>
                {/* Member Form Modal */}
                <MemberFormModal
                    isOpen={isMemberModalOpen}
                    onClose={() => {
                        setIsMemberModalOpen(false);
                        setEditingMember(null);
                    }}
                    onSave={handleSaveMember}
                    initialData={editingMember}
                    title={`Nouveau Membre - ${unit.name}`}
                />
            </div>
        </div>
    );
};

export default UnitDetails;
