import React, { useState, useMemo, useEffect } from 'react';
import {
    Users, Calendar, Check, ShieldCheck, Timer, MapPin, Heart,
    ChevronLeft, ChevronRight, Unlock, Lock, ClipboardCheck,
    TrendingUp, Award, Star, Info, Target, Zap, Search, Plus,
    UserPlus, List, Download, Image as ImageIcon, CheckCircle, XCircle, Trash2, ArrowUpDown, Eye, EyeOff, Gift, ListChecks, BookOpen, Wallet
} from 'lucide-react';
import {
    Announcement, EvangelismUnit, Committee, AttendanceSession, UnitMember,
    CampaignRegistration, CampaignComiteMember, CampaignGroup, CampaignContribution, CampaignDonation, CampaignExpense
} from '../types';
import { ADMIN_PASSWORD, TAFIRE_SITES, CAMPAIGN_ACTIVITIES, PREP_ACTIVITIES, MISSIONARY_CATEGORIES } from '../constants';
import { exportData } from '../services/exportUtils';

interface Props {
    units: EvangelismUnit[];
    committees: Committee[];
    history: AttendanceSession[];
    registrations: CampaignRegistration[];
    comiteMembers: CampaignComiteMember[];
    missionGroups: CampaignGroup[];
    contributions: CampaignContribution[];
    donations: CampaignDonation[];
    expenses: CampaignExpense[];
    onSaveSession: (s: AttendanceSession) => Promise<void>;
    onSaveRegistration: (r: CampaignRegistration) => Promise<void>;
    onDeleteRegistration: (id: string) => Promise<void>;
    onSaveComiteMember: (m: CampaignComiteMember) => Promise<void>;
    onSaveCampaignGroup: (group: CampaignGroup) => Promise<void>;
    onSaveCampaignContribution: (c: CampaignContribution) => Promise<void>;
    onSaveCampaignDonation: (d: CampaignDonation) => Promise<void>;
    onSaveCampaignExpense: (e: CampaignExpense) => Promise<void>;
    onDeleteCampaignContribution: (id: string) => Promise<void>;
    onDeleteCampaignDonation: (id: string) => Promise<void>;
    onDeleteCampaignExpense: (id: string) => Promise<void>;
    onDeleteSession: (id: string) => Promise<void>;
    isAdmin: boolean;
}

const CAMPAIGN_ID = "campaign-tafire-2026";
const START_DATE = new Date("2026-08-23T00:00:00");
const END_DATE = new Date("2026-08-30T23:59:59");
const TOTAL_SESSIONS = 25; // JEUDIS DE PRÉPARATION (5 MARS AU 23 AOÛT)

const CampaignDashboard: React.FC<Props> = ({ units, committees, history, registrations, comiteMembers, missionGroups, contributions, donations, expenses, onSaveSession, onSaveRegistration, onDeleteRegistration, onSaveComiteMember, onSaveCampaignGroup, onSaveCampaignContribution, onSaveCampaignDonation, onSaveCampaignExpense, onDeleteCampaignContribution, onDeleteCampaignDonation, onDeleteCampaignExpense, onDeleteSession, isAdmin }) => {
    const [activeTab, setActiveTab] = useState<'PREP' | 'REG' | 'COMITE' | 'GROUPS' | 'PROGRAM' | 'FINANCES'>('PREP');
    const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1)); // Mars 2026
    const [focusedDate, setFocusedDate] = useState<number | null>(null);
    const [checkedDates, setCheckedDates] = useState<Record<string, boolean>>({});
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // Locking system
    const [isLocked, setIsLocked] = useState(true);
    const [passwordInput, setPasswordInput] = useState('');
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [regForm, setRegForm] = useState<Partial<CampaignRegistration>>({
        isHolySpiritBaptized: false,
        isWaterBaptized: false,
        lastName: '',
        firstName: '',
        phone: '',
        location: '',
        photo: '',
        department: '',
        category: MISSIONARY_CATEGORIES[1], // Default to DEVAC
        registrationDate: new Date().toISOString().split('T')[0]
    });

    const [showRegForm, setShowRegForm] = useState(false);
    const [showCOForm, setShowCOForm] = useState(false);
    const [showDeleteAction, setShowDeleteAction] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [editingCO, setEditingCO] = useState<Partial<CampaignComiteMember> | null>(null);
    const [searchingGroupSite, setSearchingGroupSite] = useState<string | null>(null);
    const [searchingGroupMember, setSearchingGroupMember] = useState<string | null>(null);
    const [groupSearchTerm, setGroupSearchTerm] = useState('');

    const [showContribForm, setShowContribForm] = useState(false);
    const [contribForm, setContribForm] = useState<Partial<CampaignContribution>>({});
    const [showDonationForm, setShowDonationForm] = useState(false);
    const [donationForm, setDonationForm] = useState<Partial<CampaignDonation>>({});
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [expenseForm, setExpenseForm] = useState<Partial<CampaignExpense>>({});

    const [isTreasuryUnlocked, setIsTreasuryUnlocked] = useState(false);
    const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
    const [selectedMissionaryHistory, setSelectedMissionaryHistory] = useState<string | null>(null);

    const unifiedParticipants = useMemo(() => {
        const list: { id: string; name: string; group: string; photo?: string; isRegistrant: boolean; isRegistered: boolean }[] = [];
        const regularMemberKeys = new Set<string>();
        const registrationKeys = new Set<string>();

        // Store registration keys for lookup
        registrations.forEach(r => {
            registrationKeys.add(`${r.lastName} ${r.firstName}`.toUpperCase().trim());
            registrationKeys.add(r.phone.replace(/\s/g, ''));
        });

        // Add regular members
        [...units, ...committees].forEach(group => {
            group.members.forEach(m => {
                const nameKey = m.name?.toUpperCase().trim();
                const phoneKey = m.phone?.replace(/\s/g, '');

                const isRegistered = (!!nameKey && registrationKeys.has(nameKey)) ||
                    (!!phoneKey && registrationKeys.has(phoneKey));

                list.push({
                    id: m.id,
                    name: m.name,
                    group: group.name,
                    photo: m.photo,
                    isRegistrant: false,
                    isRegistered
                });

                if (nameKey) regularMemberKeys.add(nameKey);
                if (phoneKey) regularMemberKeys.add(phoneKey);
            });
        });

        // Add new registrants only if they don't already exist as regular members
        registrations.forEach(r => {
            const regName = `${r.lastName} ${r.firstName}`.toUpperCase().trim();
            const regPhone = r.phone.replace(/\s/g, '');

            if (!regularMemberKeys.has(regName) && !regularMemberKeys.has(regPhone)) {
                list.push({
                    id: r.id,
                    name: `${r.lastName} ${r.firstName}`,
                    group: 'NOUVEL INSCRIT',
                    photo: r.photo,
                    isRegistrant: true,
                    isRegistered: true
                });
            }
        });

        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [units, committees, registrations]);

    // Populate initial committee members if empty
    useEffect(() => {
        if (comiteMembers.length === 0 && isAdmin) {
            const initialCOMembers: Omit<CampaignComiteMember, 'id'>[] = [
                { role: "Président du Comité d'Organisation (PCO)", name: "Ancien TIAHOU Georges" },
                { role: "Vice-Président CO N°1 & Hébergement", name: "BÉCHIÉ Joël-Thierry" },
                { role: "Vice-Président CO N°2 & Finances", name: "Mme AMAN Corine" },
                { role: "Vice-Président CO N°3 & Transport", name: "LIDA Armand" },
                { role: "Chef de Camp", name: "BONGO Raymond" },
                { role: "Responsable Finances", name: "Mme AMAN Corine & Mlle KACOU Mauh Annie" },
                { role: "Secrétariat", name: "Hermine" },
                { role: "Responsable Technique", name: "ASSIE Pierre" },
                { role: "Responsable Prière", name: "KOUADIO Gervais" },
                { role: "Responsable Communication", name: "BAHON Hermann" },
                { role: "Responsable Restauration", name: "Mme TIAHOU Béatrice" },
                { role: "Responsable Action Sociale", name: "Mme BÉCHIÉ" },
                { role: "Représentant ECODIM", name: "À désigner" },
                { role: "Représentant DIP", name: "À désigner" },
                { role: "Représentant DAL", name: "À désigner" },
                { role: "Représentant Encadrement", name: "À désigner" }
            ];

            initialCOMembers.forEach((m, idx) => {
                onSaveComiteMember({ ...m, id: `co-${idx}` });
            });
        }
    }, [comiteMembers.length, isAdmin, onSaveComiteMember]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const diff = START_DATE.getTime() - now.getTime();
            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60)
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const thursdays = useMemo(() => {
        const dates = [];
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
            if (new Date(year, month, i).getDay() === 4) {
                dates.push(i);
            }
        }
        return dates;
    }, [currentMonth]);

    const getDateStr = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${month}-${d}`;
    };

    useEffect(() => {
        if (focusedDate) {
            const dateStr = getDateStr(focusedDate);
            const session = history.find(s => s.groupId === CAMPAIGN_ID && s.date === dateStr);
            const nextChecks: Record<string, boolean> = {};
            unifiedParticipants.forEach(p => {
                nextChecks[`${p.id}-${focusedDate}`] = session?.attendees.includes(p.id) || false;
            });
            setCheckedDates(nextChecks);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedDate, history, unifiedParticipants]);

    const handleSave = () => {
        if (!focusedDate) return;
        const attendees = unifiedParticipants
            .filter(p => checkedDates[`${p.id}-${focusedDate}`])
            .map(p => p.id);

        onSaveSession({
            id: `${CAMPAIGN_ID}-${getDateStr(focusedDate)}`,
            groupId: CAMPAIGN_ID,
            date: getDateStr(focusedDate),
            attendees,
            title: `CAMPAGNE D'ÉVANGÉLISATION - PRÉPARATION TAFIRE`
        });
        setFocusedDate(null);
    };

    const getFidelity = (memberId: string) => {
        const sessions = history.filter(s => s.groupId === CAMPAIGN_ID);
        const present = sessions.filter(s => s.attendees.includes(memberId)).length;
        return { present, total: TOTAL_SESSIONS, percentage: Math.round((present / TOTAL_SESSIONS) * 100) };
    };

    const handleDeleteSession = () => {
        if (!focusedDate) return;
        const dateStr = getDateStr(focusedDate);
        const session = history.find(s => s.groupId === CAMPAIGN_ID && s.date === dateStr);
        if (!session) return;

        const pass = prompt("Entrez le mot de passe administrateur pour supprimer cette séance :");
        if (pass === ADMIN_PASSWORD) {
            if (confirm(`Voulez-vous vraiment supprimer la séance du ${new Date(dateStr).toLocaleDateString('fr-FR')} ?`)) {
                onDeleteSession(session.id);
                setFocusedDate(null);
            }
        } else if (pass !== null) {
            alert("Mot de passe incorrect");
        }
    };

    const handleUnlock = () => {
        if (passwordInput === ADMIN_PASSWORD) {
            setIsLocked(false);
            setShowPasswordPrompt(false);
            setPasswordInput('');
        } else {
            alert("Mot de passe incorrect");
        }
    };

    const handleSaveReg = (e: React.FormEvent) => {
        e.preventDefault();
        if (!regForm.lastName || !regForm.firstName || !regForm.phone) {
            alert("Veuillez remplir les champs obligatoires (Nom, Prénom, Contact)");
            return;
        }

        const newReg: CampaignRegistration = {
            id: regForm.id || `reg-${Date.now()}`,
            lastName: regForm.lastName.toUpperCase(),
            firstName: regForm.firstName,
            phone: regForm.phone,
            location: regForm.location || '',
            photo: regForm.photo,
            isHolySpiritBaptized: regForm.isHolySpiritBaptized || false,
            isWaterBaptized: regForm.isWaterBaptized || false,
            department: regForm.department || '',
            category: regForm.category || MISSIONARY_CATEGORIES[1],
            registrationDate: regForm.registrationDate ? new Date(regForm.registrationDate).toISOString() : new Date().toISOString()
        };

        onSaveRegistration(newReg);
        setRegForm({
            isHolySpiritBaptized: false,
            isWaterBaptized: false,
            lastName: '',
            firstName: '',
            phone: '',
            location: '',
            photo: '',
            department: '',
            category: MISSIONARY_CATEGORIES[1],
            registrationDate: new Date().toISOString().split('T')[0]
        });
        setShowRegForm(false);
    };

    const handleSaveContribution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contribForm.missionaryId || !contribForm.amount || !contribForm.date) return;
        await onSaveCampaignContribution({
            id: contribForm.id || `pay-${Date.now()}`,
            missionaryId: contribForm.missionaryId,
            amount: contribForm.amount,
            date: contribForm.date,
            time: contribForm.time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            observation: contribForm.observation || ''
        });
        setShowContribForm(false);
        setContribForm({});
    };

    const handleSaveDonation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!donationForm.donorName || !donationForm.amount || !donationForm.date) return;
        await onSaveCampaignDonation({
            id: donationForm.id || `don-${Date.now()}`,
            donorName: donationForm.donorName,
            amount: donationForm.amount,
            date: donationForm.date,
            time: donationForm.time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            observation: donationForm.observation || ''
        });
        setShowDonationForm(false);
        setDonationForm({});
    };

    const handleDeleteContribution = async (id: string) => {
        if (!window.confirm("Supprimer ce versement ?")) return;
        await onDeleteCampaignContribution(id);
    };

    const handleDeleteDonation = async (id: string) => {
        if (!window.confirm("Supprimer ce don ?")) return;
        await onDeleteCampaignDonation(id);
    };

    const handleDeleteAllMissionaryContributions = async (missionaryId: string) => {
        const mContribs = contributions.filter(c => c.missionaryId === missionaryId);
        if (mContribs.length === 0) return;

        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer tous les versements (${mContribs.length}) de ce missionnaire ? Cette action est irréversible.`)) {
            return;
        }

        for (const c of mContribs) {
            await onDeleteCampaignContribution(c.id);
        }
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.label || !expenseForm.amount || !expenseForm.date) return;
        await onSaveCampaignExpense({
            id: expenseForm.id || `exp-${Date.now()}`,
            label: expenseForm.label,
            amount: Number(expenseForm.amount),
            date: expenseForm.date,
            time: expenseForm.time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            observation: expenseForm.observation || ''
        });
        setShowExpenseForm(false);
        setExpenseForm({});
    };

    const handleDeleteExpense = async (id: string) => {
        if (!window.confirm("Supprimer cette dépense ?")) return;
        await onDeleteCampaignExpense(id);
    };

    const handleUnlockFinances = (pass: string) => {
        if (pass === ADMIN_PASSWORD) {
            setIsTreasuryUnlocked(true);
            setShowUnlockPrompt(false);
        } else {
            alert("Mot de passe incorrect");
        }
    };

    const handleEditReg = (r: CampaignRegistration) => {
        setRegForm({
            ...r,
            registrationDate: r.registrationDate ? new Date(r.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setShowRegForm(true);
    };

    const handleDeleteReg = (id: string) => {
        const pass = prompt("Entrez le mot de passe administrateur pour supprimer cet inscrit :");
        if (pass === ADMIN_PASSWORD) {
            if (window.confirm("Voulez-vous vraiment supprimer cet inscrit ? Cette action est irréversible.")) {
                onDeleteRegistration(id);
            }
        } else if (pass !== null) {
            alert("Mot de passe incorrect");
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setRegForm(prev => ({ ...prev, photo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const filteredAndSortedRegistrations = useMemo(() => {
        let result = [...registrations];

        // Search filter
        if (searchTerm) {
            const lowed = searchTerm.toLowerCase();
            result = result.filter(r =>
                r.lastName.toLowerCase().includes(lowed) ||
                r.firstName.toLowerCase().includes(lowed) ||
                r.phone.includes(lowed) ||
                r.location.toLowerCase().includes(lowed) ||
                (r.department && r.department.toLowerCase().includes(lowed)) ||
                (r.category && r.category.toLowerCase().includes(lowed))
            );
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = `${a.lastName} ${a.firstName}`.toUpperCase();
                const nameB = `${b.lastName} ${b.firstName}`.toUpperCase();
                return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            } else {
                const dateA = new Date(a.registrationDate).getTime();
                const dateB = new Date(b.registrationDate).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
        });

        return result;
    }, [registrations, searchTerm, sortBy, sortOrder]);

    const getDayGap = (regDateStr: string) => {
        const regDate = new Date(regDateStr);
        // Set both to midnight for accurate day calculation
        const rDate = new Date(regDate.getFullYear(), regDate.getMonth(), regDate.getDate());
        const sDate = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), START_DATE.getDate());
        const diffTime = sDate.getTime() - rDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleExport = async (format: 'XLSX' | 'DOCX' | 'PPTX' | 'PDF') => {
        const headers = ['NOM', 'PRENOM', 'CONTACT', 'LOCALISATION', 'DEPT.', 'CATEGORIE', 'BAPTEME EAU', 'ST-ESPRIT', 'DATE INSCRIPTION'];
        const rows = filteredAndSortedRegistrations.map(r => [
            r.lastName.toUpperCase(),
            r.firstName,
            r.phone,
            r.location || 'Non précisée',
            getDepartmentDisplay(r),
            r.category || 'Non spécifiée',
            r.isWaterBaptized ? 'OUI' : 'NON',
            r.isHolySpiritBaptized ? 'OUI' : 'NON',
            new Date(r.registrationDate).toLocaleDateString('fr-FR')
        ]);

        const filename = `Inscriptions_TAFIRE_2026_${new Date().toISOString().split('T')[0]}`;
        const title = `LISTE DES INSCRITS - TAFIRE 2026`;
        const summary = { label: 'TOTAL INSCRITS', value: filteredAndSortedRegistrations.length.toString() };

        await exportData(format, headers, rows, filename, title, summary);
        setShowExportMenu(false);
    };

    const getDepartmentDisplay = (r: CampaignRegistration) => {
        // Try to find if this person is already in a regular unit
        const firstName = (r.firstName || '').toLowerCase().trim();
        const lastName = (r.lastName || '').toLowerCase().trim();
        const full1 = `${lastName} ${firstName}`;
        const full2 = `${firstName} ${lastName}`;

        for (const unit of units) {
            const member = unit.members.find(m => {
                const mName = (m.name || '').toLowerCase().trim();
                // Match by full name or phone if available
                const nameMatch = mName === full1 || mName === full2;
                const phoneMatch = r.phone && m.phone && r.phone.replace(/\s/g, '') === m.phone.replace(/\s/g, '');
                return nameMatch || phoneMatch;
            });
            if (member) {
                return `DEVAC / ${unit.name}`;
            }
        }
        return r.department || "AUCUN DEPT.";
    };

    const exportToCSV = () => {
        if (registrations.length === 0) return;
        const headers = ["ID", "Nom", "Prénom", "Contact", "Localisation", "Département", "Baptisé Eau", "Baptisé St-Esprit", "Date Inscription"];
        const rows = registrations.map(r => [
            r.id,
            r.lastName,
            r.firstName,
            r.phone,
            r.location,
            getDepartmentDisplay(r),
            r.isWaterBaptized ? "OUI" : "NON",
            r.isHolySpiritBaptized ? "OUI" : "NON",
            new Date(r.registrationDate).toLocaleDateString()
        ]);

        const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inscriptions_tafire_2026_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            {/* INJECT PRINT STYLES */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { background: white !important; }
                    .print-only { display: block !important; }
                    .no-print { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .shadow-xl, .shadow-lg, .shadow-2xl { box-shadow: none !important; }
                    .rounded-[3.5rem], .rounded-[2.5rem], .rounded-3xl { border-radius: 0.5rem !important; }
                    .bg-slate-50, .bg-slate-50\\/50 { background-color: #f8fafc !important; }
                }
                .print-only { display: none; }
            `}} />

            {/* PRINT HEADER */}
            <div className="print-only mb-10 border-b-4 border-slate-900 pb-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">LISTE DES INSCRITS - TAFIRE 2026</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">DÉPARTEMENT D'ÉVANGÉLISATION - AD COCODY</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-black uppercase tracking-widest text-indigo-600">TOTAL: {registrations.length} PERSONNES</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">GÉNÉRÉ LE {new Date().toLocaleDateString('fr-FR')}</div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl border border-white/10 no-print">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Target size={240} className="text-white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
                            <Zap size={14} className="fill-current" /> Grande Campagne 2026
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
                            MISSION <span className="text-indigo-400">TAFIRE</span>
                        </h1>
                        <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                            <div className="flex items-center gap-3 text-slate-300 font-bold uppercase text-sm tracking-widest">
                                <Calendar size={20} className="text-indigo-400" /> 23 - 30 AOÛT 2026
                            </div>
                            <div className="flex items-center gap-3 text-slate-300 font-bold uppercase text-sm tracking-widest">
                                <MapPin size={20} className="text-indigo-400" /> TAFIRE, CÔTE D'IVOIRE
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                        {[
                            { label: 'JOURS', val: timeLeft.days },
                            { label: 'HEURES', val: timeLeft.hours },
                            { label: 'MIN.', val: timeLeft.minutes },
                            { label: 'SEC.', val: timeLeft.seconds }
                        ].map(t => (
                            <div key={t.label} className="flex flex-col items-center">
                                <span className="text-2xl md:text-4xl font-black text-white tabular-nums">{t.val.toString().padStart(2, '0')}</span>
                                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-2">{t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center no-print">
                <div className="bg-slate-100 p-2 rounded-[2rem] flex gap-2 border border-slate-200 shadow-inner">
                    <button
                        onClick={() => setActiveTab('PREP')}
                        className={`px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'PREP' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Calendar size={16} /> Préparation
                    </button>
                    <button
                        onClick={() => setActiveTab('REG')}
                        className={`px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'REG' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users size={16} /> Inscriptions ({registrations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('COMITE')}
                        className={`px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'COMITE' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShieldCheck size={16} /> Organisation
                    </button>
                    <button
                        onClick={() => setActiveTab('GROUPS')}
                        className={`px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'GROUPS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <MapPin size={16} /> Groupes Mission (8)
                    </button>
                    <button
                        onClick={() => setActiveTab('PROGRAM')}
                        className={`px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'PROGRAM' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ListChecks size={16} /> Programme (8)
                    </button>
                    <button
                        onClick={() => setActiveTab('FINANCES')}
                        className={`px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'FINANCES' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Wallet size={16} /> Finances (Trésorerie)
                    </button>
                </div>
            </div>

            {activeTab === 'PREP' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-8 duration-700">
                    {/* Attendance Tracker */}
                    <div className="lg:col-span-8 bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-100 space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                    <ClipboardCheck size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Réunions du Jeudi</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pointage préparation (18:30 à l'église)</p>
                                        <div className="h-4 w-[1px] bg-slate-200"></div>
                                        <button
                                            onClick={() => isLocked ? setShowPasswordPrompt(true) : setIsLocked(true)}
                                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase transition-all ${isLocked ? 'bg-slate-100 text-slate-400 hover:text-slate-600' : 'bg-amber-100 text-amber-600'}`}
                                        >
                                            {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                                            {isLocked ? "Verrouillé" : "Édition active"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {showPasswordPrompt && (
                                <div className="absolute top-0 left-0 w-full h-full bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 rounded-[3rem] animate-in zoom-in-95 duration-300">
                                    <div className="text-center space-y-4 max-w-sm">
                                        <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <Lock size={32} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Déverrouiller l'édition</h3>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                            Saisissez le mot de passe administrateur pour modifier les présences passées.
                                        </p>
                                        <div className="relative pt-4">
                                            <input
                                                type="password"
                                                autoFocus
                                                value={passwordInput}
                                                onChange={(e) => setPasswordInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                                placeholder="MOT DE PASSE..."
                                                className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-center font-black uppercase tracking-widest text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            />
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    onClick={() => setShowPasswordPrompt(false)}
                                                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={handleUnlock}
                                                    className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all"
                                                >
                                                    Valider
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:text-indigo-600 transition-colors"><ChevronLeft size={20} /></button>
                                <span className="text-[10px] font-black uppercase text-slate-700 min-w-[100px] text-center">
                                    {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}
                                </span>
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:text-indigo-600 transition-colors"><ChevronRight size={20} /></button>
                            </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar">
                            {thursdays.map(day => {
                                const dateStr = getDateStr(day);
                                const session = history.find(s => s.groupId === CAMPAIGN_ID && s.date === dateStr);
                                const isSelected = focusedDate === day;
                                return (
                                    <button
                                        key={day}
                                        onClick={() => setFocusedDate(isSelected ? null : day)}
                                        className={`flex-shrink-0 w-24 h-32 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all group ${isSelected ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl scale-110 z-10' :
                                            session ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 hover:border-indigo-200'
                                            }`}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-200' : 'text-slate-400 group-hover:text-indigo-400'}`}>JEU.</span>
                                        <span className="text-3xl font-black">{day}</span>
                                        {session && !isSelected && <div className="text-[9px] font-black text-indigo-400 uppercase">{session.attendees.length} PRÉ.</div>}
                                    </button>
                                );
                            })}
                        </div>

                        {focusedDate ? (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-indigo-600 text-lg">{focusedDate}</div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-slate-700 tracking-widest">Saisie des présences</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sélectionnez les participants</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-4 items-center">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <button
                                                onClick={handleSave}
                                                disabled={isLocked && history.some(s => s.groupId === CAMPAIGN_ID && s.date === getDateStr(focusedDate))}
                                                className={`px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${isLocked && history.some(s => s.groupId === CAMPAIGN_ID && s.date === getDateStr(focusedDate))
                                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                    }`}
                                            >
                                                {isLocked && history.some(s => s.groupId === CAMPAIGN_ID && s.date === getDateStr(focusedDate)) ? "Verrouillé" : `Valider le Jeudi ${focusedDate}`}
                                            </button>
                                            <div className="flex items-center gap-2">
                                                {history.some(s => s.groupId === CAMPAIGN_ID && s.date === getDateStr(focusedDate)) && (
                                                    <>
                                                        <button
                                                            onClick={() => setShowDeleteAction(!showDeleteAction)}
                                                            className={`p-5 rounded-2xl transition-all active:scale-95 border ${showDeleteAction ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                                                            title={showDeleteAction ? "Masquer les options de suppression" : "Afficher les options de suppression"}
                                                        >
                                                            {showDeleteAction ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                        {showDeleteAction && (
                                                            <button
                                                                onClick={handleDeleteSession}
                                                                className="px-8 py-5 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-100 transition-all border border-rose-100 active:scale-95 flex items-center gap-2 animate-in slide-in-from-left-2 duration-300"
                                                            >
                                                                <XCircle size={16} /> Désactiver
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {unifiedParticipants.map((p) => {
                                        const isChecked = !!checkedDates[`${p.id}-${focusedDate}`];
                                        const { present, percentage } = getFidelity(p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    const alreadyExists = history.some(s => s.groupId === CAMPAIGN_ID && s.date === getDateStr(focusedDate));
                                                    if (alreadyExists && isLocked) {
                                                        setShowPasswordPrompt(true);
                                                        return;
                                                    }
                                                    setCheckedDates(prev => ({ ...prev, [`${p.id}-${focusedDate}`]: !isChecked }));
                                                }}
                                                className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${isChecked ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-100 hover:border-slate-200'
                                                    } ${isLocked && history.some(s => s.groupId === CAMPAIGN_ID && s.date === getDateStr(focusedDate)) ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase ${isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className={`text-[11px] font-black uppercase ${isChecked ? 'text-indigo-900' : 'text-slate-800'}`}>{p.name}</div>
                                                        <div className="flex flex-col">
                                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.group}</div>
                                                            {p.isRegistered && (
                                                                <div className="mt-1.5 self-start px-2 py-0.5 bg-orange-100 text-orange-700 rounded-lg text-[7px] font-black uppercase tracking-wider border border-orange-200">
                                                                    INSCRIT POUR TAFIRE
                                                                </div>
                                                            )}
                                                            <div className={`mt-1.5 text-[8px] font-black uppercase tracking-widest ${isChecked ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                                {present} Séance{present > 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {isChecked ? (
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-300">
                                                                <Check size={20} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-indigo-600">{percentage}%</span>
                                                        </div>
                                                    ) : (
                                                        <div className="relative w-10 h-10 flex items-center justify-center">
                                                            {(() => {
                                                                const ratio = percentage / 100;
                                                                const dash = 2 * Math.PI * 18 * ratio;
                                                                const empty = 2 * Math.PI * 18 * (1 - ratio);
                                                                return (
                                                                    <>
                                                                        <svg className="w-full h-full -rotate-90">
                                                                            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100" />
                                                                            <circle
                                                                                cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3"
                                                                                className={`transition-all duration-1000 ease-out ${percentage > 80 ? 'text-emerald-500' : percentage > 50 ? 'text-amber-500' : 'text-rose-500'}`}
                                                                                strokeDasharray={`${dash} ${empty}`}
                                                                            />
                                                                        </svg>
                                                                        <span className="absolute text-[8px] font-black text-slate-600">{percentage}%</span>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400">
                                <Calendar size={48} className="mb-4 opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest italic">Sélectionnez un jeudi pour pointer</p>
                            </div>
                        )}
                    </div>

                    {/* Info & Fidelity Column */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform"><Info size={180} className="text-white" /></div>
                            <div className="relative z-10 space-y-6">
                                <h3 className="text-white text-2xl font-black uppercase tracking-tighter">Préparation</h3>
                                <p className="text-slate-400 text-sm leading-relaxed italic">
                                    "Car si je prêche l'Évangile, ce n'est pas pour moi un sujet de gloire, car la nécessité m'en est imposée." — 1 Cor. 9:16
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/10 text-center space-y-2">
                                        <div className="text-2xl font-black text-white">{registrations.length}</div>
                                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Inscrits</div>
                                    </div>
                                    <div className="p-5 bg-indigo-600 rounded-3xl text-center space-y-2 shadow-xl shadow-indigo-900/40">
                                        <div className="text-2xl font-black text-white">
                                            {history.filter(s => s.groupId === CAMPAIGN_ID).length}
                                        </div>
                                        <div className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Sessions</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex gap-4 items-center">
                                        <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center"><TrendingUp size={18} /></div>
                                        <div className="text-[10px] font-black text-white uppercase tracking-widest">Prière & Formation chaque jeudi</div>
                                    </div>
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex gap-4 items-center">
                                        <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center"><MapPin size={18} /></div>
                                        <div className="text-[10px] font-black text-white uppercase tracking-widest">Lieu: Église de Cocody</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <Star size={24} className="text-amber-500 fill-current" />
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Fidélité Préparation</h3>
                            </div>
                            <div className="space-y-6 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {unifiedParticipants.map((p) => {
                                    const { percentage } = getFidelity(p.id);
                                    return (
                                        <div key={p.id} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[150px]">{p.name}</span>
                                                <span className="text-[10px] font-black text-indigo-600">{percentage}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${percentage > 80 ? 'bg-emerald-500' : percentage > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            {p.isRegistrant && (
                                                <div className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">Nouveau Participant</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'REG' ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-100 space-y-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                    <UserPlus size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Inscriptions TAFIRE</h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gérer les participants à la mission</p>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                                    <Users size={18} className="text-emerald-500" />
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-black text-emerald-700 leading-none">{registrations.length}</span>
                                        <span className="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest mt-0.5">Inscrits Total</span>
                                    </div>
                                </div>
                            </div>

                            {/* Effectifs par Catégorie */}
                            <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Effectifs par Catégorie</h3>
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {MISSIONARY_CATEGORIES.map(cat => {
                                        const count = registrations.filter(r => r.category === cat).length;
                                        return (
                                            <div key={cat} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2 hover:shadow-md transition-all group">
                                                <span className="text-xl font-black text-indigo-600 leading-none group-hover:scale-110 transition-transform">{count}</span>
                                                <span className="text-[7px] font-black text-slate-500 uppercase leading-tight tracking-tighter">{cat}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="bg-indigo-600 p-4 rounded-2xl border border-indigo-500 shadow-lg flex flex-col items-center text-center gap-2 hover:bg-indigo-700 transition-colors cursor-default">
                                        <span className="text-xl font-black text-white leading-none">{registrations.length}</span>
                                        <span className="text-[7px] font-black text-indigo-100 uppercase leading-tight tracking-tighter">TOTAL GÉNÉRAL</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative flex-1 min-w-[250px]">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un inscrit..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 no-print">
                                    <button
                                        onClick={() => {
                                            if (sortBy === 'name') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                            else { setSortBy('name'); setSortOrder('asc'); }
                                        }}
                                        className={`px-4 py-3 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'name' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <ArrowUpDown size={14} /> Nom {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (sortBy === 'date') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                            else { setSortBy('date'); setSortOrder('desc'); }
                                        }}
                                        className={`px-4 py-3 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'date' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Calendar size={14} /> Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </button>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                    >
                                        <Download size={16} /> EXPORT {showExportMenu ? '...' : ''}
                                    </button>
                                    {showExportMenu && (
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2 animate-in slide-in-from-top-2 duration-200">
                                            {[
                                                { id: 'XLSX', label: 'EXCEL (XLSX)', color: 'text-emerald-600', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8 M8 9h2' },
                                                { id: 'DOCX', label: 'WORD (DOCX)', color: 'text-blue-600', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8 M8 9h2' },
                                                { id: 'PPTX', label: 'POWERPOINT (PPTX)', color: 'text-orange-600', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8 M8 9h2' },
                                                { id: 'PDF', label: 'FORMAT PDF', color: 'text-rose-600', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8 M8 9h2' }
                                            ].map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleExport(item.id as any)}
                                                    className="w-full px-6 py-4 hover:bg-slate-50 flex items-center gap-4 transition-colors group"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 group-hover:bg-white transition-colors ${item.color}`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                            <path d={item.icon} />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setRegForm({
                                            isHolySpiritBaptized: false,
                                            isWaterBaptized: false,
                                            lastName: '',
                                            firstName: '',
                                            phone: '',
                                            location: '',
                                            photo: '',
                                            department: '',
                                            category: MISSIONARY_CATEGORIES[1],
                                            registrationDate: new Date().toISOString().split('T')[0]
                                        });
                                        setShowRegForm(true);
                                    }}
                                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 no-print"
                                >
                                    <UserPlus size={16} /> Nouvel Inscrit
                                </button>
                            </div>
                        </div>

                        {showRegForm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                                <form onSubmit={handleSaveReg} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                                    <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">{regForm.id ? "Modifier l'Inscription" : "Nouvelle Inscription"}</h3>
                                            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">
                                                {regForm.id ? "Mettre à jour les informations du participant" : "Remplissez les informations du participant"}
                                            </p>
                                        </div>
                                        <button type="button" onClick={() => setShowRegForm(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                                            <XCircle size={20} />
                                        </button>
                                    </div>

                                    <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] border-4 border-slate-50 overflow-hidden relative group cursor-pointer">
                                                {regForm.photo ? (
                                                    <img src={regForm.photo} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                        <ImageIcon size={32} className="mb-2 opacity-50" />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">PHOTO</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliquez pour ajouter une photo</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom *</label>
                                                <input
                                                    required
                                                    value={regForm.lastName}
                                                    onChange={e => setRegForm(prev => ({ ...prev, lastName: e.target.value }))}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                    placeholder="Ex: KOUASSI"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prénom *</label>
                                                <input
                                                    required
                                                    value={regForm.firstName}
                                                    onChange={e => setRegForm(prev => ({ ...prev, firstName: e.target.value }))}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                    placeholder="Ex: Ange"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie de Missionnaire *</label>
                                            <select
                                                required
                                                value={regForm.category}
                                                onChange={e => setRegForm(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                {MISSIONARY_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact *</label>
                                                <input
                                                    required
                                                    value={regForm.phone}
                                                    onChange={e => setRegForm(prev => ({ ...prev, phone: e.target.value }))}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                    placeholder="Ex: 07 00 00 00 00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localisation</label>
                                                <input
                                                    value={regForm.location}
                                                    onChange={e => setRegForm(prev => ({ ...prev, location: e.target.value }))}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                    placeholder="Ex: Abidjan, Angré"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Département</label>
                                                <input
                                                    value={regForm.department}
                                                    onChange={e => setRegForm(prev => ({ ...prev, department: e.target.value }))}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                    placeholder="Ex: Évangélisation"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date d'Inscription *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={regForm.registrationDate}
                                                    onChange={e => setRegForm(prev => ({ ...prev, registrationDate: e.target.value }))}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${regForm.isWaterBaptized ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-200 text-slate-400'}`}>
                                                        <ShieldCheck size={20} className={regForm.isWaterBaptized ? 'fill-current' : ''} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase text-slate-800">Baptême d'Eau</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Avez-vous été baptisé ?</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setRegForm(prev => ({ ...prev, isWaterBaptized: !prev.isWaterBaptized }))}
                                                    className={`w-14 h-7 rounded-full p-1 transition-colors relative ${regForm.isWaterBaptized ? 'bg-cyan-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${regForm.isWaterBaptized ? 'translate-x-7' : 'translate-x-0'}`} />
                                                </button>
                                            </div>

                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${regForm.isHolySpiritBaptized ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                                                        <Zap size={20} className={regForm.isHolySpiritBaptized ? 'fill-current' : ''} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase text-slate-800">Saint-Esprit</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Baptême du St-Esprit</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setRegForm(prev => ({ ...prev, isHolySpiritBaptized: !prev.isHolySpiritBaptized }))}
                                                    className={`w-14 h-7 rounded-full p-1 transition-colors relative ${regForm.isHolySpiritBaptized ? 'bg-amber-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${regForm.isHolySpiritBaptized ? 'translate-x-7' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowRegForm(false)}
                                            className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 shadow-inner"
                                        >
                                            {regForm.id ? "Mettre à jour" : "Inscrire maintenant"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participant</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact / Dept.</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localisation</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">BAPTÊME</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date d'Inscription</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right no-print">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAndSortedRegistrations.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                                        {r.photo ? (
                                                            <img src={r.photo} alt={r.lastName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white font-black text-sm">
                                                                {r.lastName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800 uppercase leading-none">{r.lastName}</div>
                                                        <div className="text-xs font-bold text-indigo-600 mt-1 capitalize">{r.firstName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-xs font-bold text-slate-600">{r.phone}</div>
                                                <div className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter mt-0.5">
                                                    {getDepartmentDisplay(r)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-[10px] font-bold text-slate-600 uppercase leading-snug">
                                                    {r.category || "Inconnue"}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <MapPin size={14} className="text-slate-300" />
                                                    {r.location || "Non précisée"}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center gap-4">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <ShieldCheck size={18} className={r.isWaterBaptized ? 'text-cyan-500' : 'text-slate-200'} />
                                                        <span className={`text-[7px] font-black uppercase ${r.isWaterBaptized ? 'text-cyan-600' : 'text-slate-300'}`}>Eau</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Zap size={18} className={r.isHolySpiritBaptized ? 'text-amber-500 fill-current' : 'text-slate-200'} />
                                                        <span className={`text-[7px] font-black uppercase ${r.isHolySpiritBaptized ? 'text-amber-600' : 'text-slate-300'}`}>SAINT-ESPRIT</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                        {new Date(r.registrationDate).toLocaleDateString('fr-FR')}
                                                    </div>
                                                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black border border-indigo-100/50 shadow-sm whitespace-nowrap">
                                                        J - {getDayGap(r.registrationDate)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 no-print">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleEditReg(r)}
                                                        className="p-2 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-lg transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Zap size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteReg(r.id)}
                                                        className="p-2 hover:bg-rose-50 text-rose-300 hover:text-rose-500 rounded-lg transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {registrations.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center opacity-20">
                                                    <Users size={64} className="mb-4" />
                                                    <p className="text-lg font-black uppercase tracking-widest italic">Aucun inscrit pour le moment</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'GROUPS' ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                            const groupId = `group-${num}`;
                            const group = missionGroups.find(g => g.id === groupId) || {
                                id: groupId,
                                name: `GROUPE MISSION ${num}`,
                                siteIds: [],
                                missionaryIds: [],
                                leaderId: ''
                            };

                            const assignedSites = TAFIRE_SITES.filter(s => (group.siteIds || []).includes(s.id));
                            const assignedMembers = unifiedParticipants.filter(p => (group.missionaryIds || []).includes(p.id));

                            return (
                                <div key={groupId} className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 flex flex-col gap-6 hover:shadow-2xl transition-all border-b-8 border-b-indigo-600">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                                            {num}
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm">{group.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{assignedSites.length} sites assignés</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SITES & QUARTIERS</label>
                                                <button
                                                    onClick={() => {
                                                        setSearchingGroupSite(searchingGroupSite === groupId ? null : groupId);
                                                        setGroupSearchTerm('');
                                                    }}
                                                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${searchingGroupSite === groupId ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>

                                            {searchingGroupSite === groupId && (
                                                <div className="p-4 bg-slate-100 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                    <input
                                                        autoFocus
                                                        value={groupSearchTerm}
                                                        onChange={e => setGroupSearchTerm(e.target.value)}
                                                        placeholder="Rechercher un site..."
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                                        {TAFIRE_SITES.filter(s => !(group.siteIds || []).includes(s.id) && (s.name || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase())).map(s => (
                                                            <button
                                                                key={s.id}
                                                                onClick={() => {
                                                                    onSaveCampaignGroup({ ...group, siteIds: [...(group.siteIds || []), s.id] });
                                                                    setSearchingGroupSite(null);
                                                                }}
                                                                className="w-full text-left p-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors group/item"
                                                            >
                                                                <div className="text-[10px] font-black uppercase">{s.name}</div>
                                                                <div className="text-[8px] font-bold opacity-60 uppercase">{s.type} - {s.id}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                {assignedSites.map(s => (
                                                    <div key={s.id} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2 group/tag">
                                                        <span className="text-[9px] font-bold text-slate-700 uppercase">{s.name}</span>
                                                        <button
                                                            onClick={() => onSaveCampaignGroup({ ...group, siteIds: (group.siteIds || []).filter(id => id !== s.id) })}
                                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <XCircle size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {assignedSites.length === 0 && <p className="text-[9px] text-slate-300 italic font-bold">Aucun site</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">MISSIONNAIRES ({assignedMembers.length})</label>
                                                <button
                                                    onClick={() => {
                                                        setSearchingGroupMember(searchingGroupMember === groupId ? null : groupId);
                                                        setGroupSearchTerm('');
                                                    }}
                                                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${searchingGroupMember === groupId ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>

                                            {searchingGroupMember === groupId && (
                                                <div className="p-4 bg-slate-100 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                    <input
                                                        autoFocus
                                                        value={groupSearchTerm}
                                                        onChange={e => setGroupSearchTerm(e.target.value)}
                                                        placeholder="Rechercher un membre..."
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                                        {unifiedParticipants.filter(p => !(group.missionaryIds || []).includes(p.id) && (p.name || '').toLowerCase().includes((groupSearchTerm || '').toLowerCase())).slice(0, 50).map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => {
                                                                    onSaveCampaignGroup({ ...group, missionaryIds: [...(group.missionaryIds || []), p.id] });
                                                                    setSearchingGroupMember(null);
                                                                }}
                                                                className="w-full text-left p-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors group/item"
                                                            >
                                                                <div className="text-[10px] font-black uppercase">{p.name}</div>
                                                                <div className="text-[8px] font-bold opacity-60 uppercase">{p.group}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-1.5">
                                                {assignedMembers.map(m => (
                                                    <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-xl group/member">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-[10px] font-black text-indigo-600">
                                                                {(m.name || '?').charAt(0)}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]">{m.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => onSaveCampaignGroup({ ...group, missionaryIds: (group.missionaryIds || []).filter(id => id !== m.id) })}
                                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <XCircle size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {assignedMembers.length === 0 && <p className="text-[9px] text-slate-300 italic font-bold">Aucun membre</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50">
                                        <button className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                                            <Download size={12} /> Feuille de Route
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <List size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Répertoire des Sites</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Quartiers et Villages de la mission TAFIRE 2026</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {TAFIRE_SITES.map(site => (
                                <div key={site.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center gap-2 hover:bg-white hover:shadow-lg transition-all">
                                    <div className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase ${site.type === 'QUARTIER' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                                        {site.type}
                                    </div>
                                    <span className="text-xs font-black text-slate-800 leading-tight uppercase">{site.name}</span>
                                    <span className="text-[8px] font-bold text-slate-400 tracking-tighter">{site.id}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : activeTab === 'PROGRAM' ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 pb-20">
                    <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-100 space-y-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                    <ListChecks size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Programme de la Campagne</h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Planification globale TAFIRE 2026</p>
                                </div>
                            </div>
                        </div>

                        {/* Prep Section */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-[2px] flex-1 bg-slate-100"></div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Phase 1 : Préparation & Formation</h3>
                                <div className="h-[2px] flex-1 bg-slate-100"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {PREP_ACTIVITIES.map((act) => {
                                    const IconComponent = act.icon === 'ImageIcon' ? ImageIcon :
                                        act.icon === 'Users' ? Users :
                                            act.icon === 'Zap' ? Zap :
                                                act.icon === 'Star' ? Star :
                                                    act.icon === 'Award' ? Award :
                                                        act.icon === 'Heart' ? Heart :
                                                            act.icon === 'Target' ? Target :
                                                                act.icon === 'Gift' ? Gift :
                                                                    act.icon === 'Timer' ? Timer :
                                                                        act.icon === 'BookOpen' ? BookOpen :
                                                                            act.icon === 'ShieldCheck' ? ShieldCheck : ListChecks;

                                    return (
                                        <div key={act.id} className="bg-indigo-50/30 rounded-[2.5rem] p-8 border border-indigo-100 hover:border-indigo-300 hover:bg-white transition-all hover:shadow-xl group">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform mb-6 border border-slate-100">
                                                <IconComponent size={28} />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase leading-snug tracking-tight">{act.name}</h3>
                                            <div className="mt-4 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">En cours de planification</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Execution Section */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-[2px] flex-1 bg-slate-100"></div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Phase 2 : Évangélisation (23-30 Août)</h3>
                                <div className="h-[2px] flex-1 bg-slate-100"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {CAMPAIGN_ACTIVITIES.map((act) => {
                                    const IconComponent = act.icon === 'ImageIcon' ? ImageIcon :
                                        act.icon === 'Users' ? Users :
                                            act.icon === 'Zap' ? Zap :
                                                act.icon === 'Star' ? Star :
                                                    act.icon === 'Award' ? Award :
                                                        act.icon === 'Heart' ? Heart :
                                                            act.icon === 'Target' ? Target :
                                                                act.icon === 'Gift' ? Gift : ListChecks;

                                    return (
                                        <div key={act.id} className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all hover:shadow-xl group">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform mb-6 border border-slate-100">
                                                <IconComponent size={28} />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase leading-snug tracking-tight">{act.name}</h3>
                                            <div className="mt-4 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Événement Terrain</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[3rem] p-12 text-center space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><Target size={150} className="text-white" /></div>
                            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                                <h3 className="text-white text-2xl font-black uppercase tracking-widest leading-tight">Objectif : Gagner Tafiré pour Christ</h3>
                                <p className="text-slate-400 text-xs italic leading-relaxed">
                                    "Allez, faites de toutes les nations des disciples, les baptisant au nom du Père, du Fils et du Saint-Esprit, et enseignez-leur à observer tout ce que je vous ai prescrit." — Matthieu 28:19
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'FINANCES' ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 pb-20">
                    <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-100 space-y-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                    <Wallet size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Trésorerie de la Campagne</h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestion des contributions missionnaires</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowContribForm(true)}
                                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                <Plus size={16} /> Nouveau Versement
                            </button>
                            <button
                                onClick={() => setShowDonationForm(true)}
                                className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                            >
                                <Gift size={16} /> Nouveau Don
                            </button>
                            <button
                                onClick={() => { setExpenseForm({ date: new Date().toISOString().split('T')[0] }); setShowExpenseForm(true); }}
                                className="flex items-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                            >
                                <Plus size={16} /> Nouvelle Dépense
                            </button>
                            <button
                                onClick={() => isTreasuryUnlocked ? setIsTreasuryUnlocked(false) : setShowUnlockPrompt(true)}
                                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 ${isTreasuryUnlocked ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
                            >
                                {isTreasuryUnlocked ? <Lock size={16} /> : <Unlock size={16} />}
                                {isTreasuryUnlocked ? "Verrouiller" : "Déverrouiller"}
                            </button>
                        </div>

                        {(() => {
                            const totalIncome = contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) + donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
                            const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                            const netBalance = totalIncome - totalExpenses;

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-slate-800">
                                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-indigo-400">
                                            <Wallet size={80} />
                                        </div>
                                        <div className="relative z-10 space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Solde Net de Campagne (Trésorerie)</p>
                                            <h3 className={`text-4xl font-black tracking-tighter ${netBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                                                {netBalance.toLocaleString('fr-FR')} <span className="text-lg font-bold text-slate-400">FCFA</span>
                                            </h3>
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest pt-2">
                                                <div className={`w-2 h-2 rounded-full animate-pulse ${netBalance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                                <span className={netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                    {netBalance >= 0 ? 'Trésorerie Positive' : 'Trésorerie Déficitaire'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col justify-center gap-2 hover:bg-white transition-all group">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Entrées</p>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-emerald-600 transition-colors">
                                            {totalIncome.toLocaleString('fr-FR')} <span className="text-[10px] font-bold text-slate-400">FCFA</span>
                                        </h3>
                                        <div className="flex gap-2">
                                            <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                                                {contributions.length} Contribs
                                            </p>
                                            <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
                                                {donations.length} Dons
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col justify-center gap-2 hover:bg-white transition-all group">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Sorties</p>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-rose-600 transition-colors">
                                            {totalExpenses.toLocaleString('fr-FR')} <span className="text-[10px] font-bold text-slate-400">FCFA</span>
                                        </h3>
                                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{expenses.length} dépenses effectuées</p>
                                    </div>
                                </div>
                            );
                        })()}


                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Historique des Paiements</h3>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-100"></div>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Missionnaire</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nombre de Versements</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dernier Versement</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Versé (FCFA)</th>
                                            {isTreasuryUnlocked && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Array.from(new Set(contributions.map(c => c.missionaryId))).map(mId => {
                                            const missionary = registrations.find(r => r.id === mId);
                                            const mContribs = contributions.filter(c => c.missionaryId === mId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                            const totalAmount = mContribs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                                            const lastDate = mContribs[0]?.date;

                                            return (
                                                <tr key={mId} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div
                                                            onClick={() => setSelectedMissionaryHistory(mId)}
                                                            className="flex items-center gap-4 cursor-pointer hover:opacity-70 transition-opacity"
                                                        >
                                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 border border-white shadow-sm">
                                                                {missionary?.lastName ? missionary.lastName.charAt(0) : '?'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-black text-slate-800 uppercase underline decoration-indigo-200 decoration-2 underline-offset-4">{missionary?.lastName || "Inconnu"}</div>
                                                                <div className="text-[10px] font-bold text-slate-400">{missionary?.firstName}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <button
                                                            onClick={() => setSelectedMissionaryHistory(mId)}
                                                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10"
                                                        >
                                                            {mContribs.length} {mContribs.length > 1 ? 'Versements' : 'Versement'}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-100/50 py-2 rounded-xl">
                                                            <Calendar size={12} className="text-slate-400" />
                                                            {lastDate ? new Date(lastDate).toLocaleDateString() : '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 font-black text-slate-900 text-sm">
                                                        {totalAmount.toLocaleString('fr-FR')} FCFA
                                                    </td>
                                                    {isTreasuryUnlocked && (
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => setSelectedMissionaryHistory(mId)}
                                                                    className="p-2 bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                                                    title="Voir les détails et modifier"
                                                                >
                                                                    <Zap size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAllMissionaryContributions(mId)}
                                                                    className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-colors"
                                                                    title="Supprimer la ligne de ce missionnaire"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        {contributions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center">
                                                    <div className="max-w-xs mx-auto space-y-4">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                                                            <Wallet size={32} />
                                                        </div>
                                                        <h4 className="text-sm font-black text-slate-900 uppercase">Aucun versement</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Commencez par enregistrer les contributions des missionnaires.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[3rem] p-12 text-center space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><Wallet size={150} className="text-white" /></div>
                            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                                <h3 className="text-white text-2xl font-black uppercase tracking-widest leading-tight">La Main de Dieu sur nos finances</h3>
                                <p className="text-slate-400 text-xs italic leading-relaxed">
                                    "Apportez à la maison du trésor toutes les dîmes, afin qu'il y ait de la nourriture dans ma maison ; mettez-moi de la sorte à l'épreuve, dit l'Éternel des armées." — Malachie 3:10
                                </p>
                            </div>
                        </div>

                        {/* SECTION DONS */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Dons des Donateurs (Externes)</h3>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {donations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(d => (
                                    <div key={d.id} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex items-center justify-between group hover:border-emerald-200 hover:bg-white transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                                <Gift size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-800 uppercase line-clamp-1">{d.donorName}</div>
                                                <div className="text-[10px] font-bold text-slate-400 italic mt-0.5">{d.observation || "Donation ponctuelle"}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-emerald-600">+{d.amount.toLocaleString('fr-FR')} FCFA</div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(d.date).toLocaleDateString()}</div>
                                            {isTreasuryUnlocked && (
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={() => { setDonationForm(d); setShowDonationForm(true); }}
                                                        className="text-emerald-600 hover:text-emerald-700 p-1"
                                                    >
                                                        <Zap size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDonation(d.id)}
                                                        className="text-red-500 hover:text-red-600 p-1"
                                                    >
                                                        <XCircle size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {donations.length === 0 && (
                                    <div className="lg:col-span-2 py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucun don enregistré pour le moment</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION DÉPENSES */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Dépenses de la Campagne</h3>
                            <div className="flex items-center gap-3">
                                {isTreasuryUnlocked && (
                                    <button
                                        onClick={() => { setExpenseForm({ date: new Date().toISOString().split('T')[0] }); setShowExpenseForm(true); }}
                                        className="px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={12} /> Ajouter
                                    </button>
                                )}
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                                <div key={exp.id} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex items-center justify-between group hover:border-rose-200 hover:bg-white transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                            <Wallet size={24} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-800 uppercase line-clamp-1">{exp.label}</div>
                                            <div className="text-[10px] font-bold text-slate-400 italic mt-0.5">{exp.observation || 'Dépense de campagne'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-rose-600">-{exp.amount.toLocaleString('fr-FR')} FCFA</div>
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(exp.date).toLocaleDateString()}</div>
                                        {isTreasuryUnlocked && (
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => { setExpenseForm(exp); setShowExpenseForm(true); }}
                                                    className="text-rose-600 hover:text-rose-700 p-1"
                                                >
                                                    <Zap size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExpense(exp.id)}
                                                    className="text-red-500 hover:text-red-600 p-1"
                                                >
                                                    <XCircle size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {expenses.length === 0 && (
                                <div className="lg:col-span-2 py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucune dépense enregistrée pour le moment</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {showContribForm && (
                        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                            <form onSubmit={handleSaveContribution} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                                <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowContribForm(false)}
                                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors shadow-inner"
                                            title="Retour"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">Enregistrer un Versement</h3>
                                            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">Contribution Missionnaire — Campagne 2026</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setShowContribForm(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="p-10 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Missionnaire *</label>
                                        <select
                                            required
                                            value={contribForm.missionaryId}
                                            onChange={e => setContribForm(prev => ({ ...prev, missionaryId: e.target.value }))}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="">Sélectionner un missionnaire</option>
                                            {registrations.sort((a, b) => a.lastName.localeCompare(b.lastName)).map(r => (
                                                <option key={r.id} value={r.id}>{r.lastName} {r.firstName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (FCFA) *</label>
                                            <input
                                                required
                                                type="number"
                                                value={contribForm.amount || ''}
                                                onChange={e => setContribForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                placeholder="Ex: 5000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date du Versement *</label>
                                            <input
                                                required
                                                type="date"
                                                value={contribForm.date || ''}
                                                onChange={e => setContribForm(prev => ({ ...prev, date: e.target.value }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Heure *</label>
                                            <input
                                                required
                                                type="time"
                                                value={contribForm.time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                onChange={e => setContribForm(prev => ({ ...prev, time: e.target.value }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observation / Note</label>
                                        <textarea
                                            value={contribForm.observation || ''}
                                            onChange={e => setContribForm(prev => ({ ...prev, observation: e.target.value }))}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                                            placeholder="Notes additionnelles..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                                    >
                                        Enregistrer le Paiement
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {showDonationForm && (
                        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                            <form onSubmit={handleSaveDonation} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                                <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowDonationForm(false)}
                                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors shadow-inner"
                                            title="Retour"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">{donationForm.id ? "Modifier le Don" : "Enregistrer un Don"}</h3>
                                            <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-1">Donateur Externe — Campagne 2026</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setShowDonationForm(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="p-10 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du Donateur *</label>
                                        <input
                                            required
                                            type="text"
                                            value={donationForm.donorName || ''}
                                            onChange={e => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            placeholder="Ex: Famille KOFFI ou Anonyme"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (FCFA) *</label>
                                            <input
                                                required
                                                type="number"
                                                value={donationForm.amount || ''}
                                                onChange={e => setDonationForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                placeholder="Ex: 10000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date du Don *</label>
                                            <input
                                                required
                                                type="date"
                                                value={donationForm.date || ''}
                                                onChange={e => setDonationForm(prev => ({ ...prev, date: e.target.value }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Heure *</label>
                                            <input
                                                required
                                                type="time"
                                                value={donationForm.time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                onChange={e => setDonationForm(prev => ({ ...prev, time: e.target.value }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observation / Occasion</label>
                                        <textarea
                                            value={donationForm.observation || ''}
                                            onChange={e => setDonationForm(prev => ({ ...prev, observation: e.target.value }))}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[100px]"
                                            placeholder="Ex: Don pour le concert d'évangélisation"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                                    >
                                        {donationForm.id ? "Mettre à jour" : "Enregistrer le Don"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {showExpenseForm && (
                        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                            <form onSubmit={handleSaveExpense} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                                <div className="bg-rose-600 p-8 text-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowExpenseForm(false)}
                                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors shadow-inner"
                                            title="Retour"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">{expenseForm.id ? "Modifier la Dépense" : "Enregistrer une Dépense"}</h3>
                                            <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest mt-1">Sortie de fonds — Campagne 2026</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setShowExpenseForm(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="p-10 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Libellé de la Dépense *</label>
                                        <input
                                            required
                                            type="text"
                                            value={expenseForm.label || ''}
                                            onChange={e => setExpenseForm(prev => ({ ...prev, label: e.target.value }))}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                            placeholder="Ex: Achat matériel de campagne, Carburant..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2" style={{ gridColumn: 'span 2' }}>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (FCFA) *</label>
                                            <input
                                                required
                                                type="number"
                                                value={expenseForm.amount || ''}
                                                onChange={e => setExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                                placeholder="Ex: 25000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date *</label>
                                            <input
                                                required
                                                type="date"
                                                value={expenseForm.date || ''}
                                                onChange={e => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Heure</label>
                                            <input
                                                type="time"
                                                value={expenseForm.time || ''}
                                                onChange={e => setExpenseForm(prev => ({ ...prev, time: e.target.value }))}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observation / Justification</label>
                                        <textarea
                                            value={expenseForm.observation || ''}
                                            onChange={e => setExpenseForm(prev => ({ ...prev, observation: e.target.value }))}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all min-h-[100px]"
                                            placeholder="Ex: Achat générateur pour le concert"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95"
                                    >
                                        {expenseForm.id ? "Mettre à jour" : "Enregistrer la Dépense"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {showUnlockPrompt && (
                        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                                <div className="p-8 space-y-6 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 mx-auto shadow-inner">
                                        <Unlock size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black uppercase tracking-tight">Accès Sécurisé</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Entrez le mot de passe administrateur pour modifier la trésorerie</p>
                                    </div>
                                    <input
                                        autoFocus
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-lg font-black tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        onKeyDown={e => e.key === 'Enter' && handleUnlockFinances(e.currentTarget.value)}
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setShowUnlockPrompt(false)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedMissionaryHistory && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
                                <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl font-black">
                                            {registrations.find(r => r.id === selectedMissionaryHistory)?.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">
                                                {registrations.find(r => r.id === selectedMissionaryHistory)?.lastName} {registrations.find(r => r.id === selectedMissionaryHistory)?.firstName}
                                            </h3>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Historique Individuel des Versements</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setContribForm({
                                                    missionaryId: selectedMissionaryHistory,
                                                    date: new Date().toISOString().split('T')[0],
                                                    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                                });
                                                setShowContribForm(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-white/5"
                                        >
                                            <Plus size={14} /> Ajouter
                                        </button>
                                        <button
                                            onClick={() => isTreasuryUnlocked ? setIsTreasuryUnlocked(false) : setShowUnlockPrompt(true)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isTreasuryUnlocked ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                            title={isTreasuryUnlocked ? "Verrouiller" : "Déverrouiller"}
                                        >
                                            {isTreasuryUnlocked ? <Lock size={16} /> : <Unlock size={16} />}
                                        </button>
                                        <button onClick={() => setSelectedMissionaryHistory(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                                            <XCircle size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 overflow-y-auto space-y-6">
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Versé</p>
                                            <h4 className="text-2xl font-black text-slate-900 mt-1">
                                                {contributions.filter(c => c.missionaryId === selectedMissionaryHistory).reduce((sum, c) => sum + (Number(c.amount) || 0), 0).toLocaleString('fr-FR')} FCFA
                                            </h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Versements</p>
                                            <h4 className="text-2xl font-black text-slate-900 mt-1">
                                                {contributions.filter(c => c.missionaryId === selectedMissionaryHistory).length}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {contributions
                                            .filter(c => c.missionaryId === selectedMissionaryHistory)
                                            .sort((a, b) => new Date(`${a.date} ${a.time || '00:00'}`).getTime() - new Date(`${b.date} ${b.time || '00:00'}`).getTime())
                                            .map((c, index, arr) => (
                                                <div key={c.id} className="bg-white rounded-2xl p-6 border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center relative group-inner shrink-0">
                                                            <Calendar size={20} />
                                                            {isTreasuryUnlocked && (
                                                                <div className="absolute -top-2 -right-2 transition-all flex gap-1 z-10">
                                                                    <button
                                                                        onClick={() => { setContribForm({ ...c, time: c.time || '' }); setShowContribForm(true); }}
                                                                        className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
                                                                        title="Modifier"
                                                                    >
                                                                        <Zap size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteContribution(c.id)}
                                                                        className="w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                                                        title="Supprimer"
                                                                    >
                                                                        <XCircle size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                                                                <span>{new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">{c.time || "—"}</span>
                                                            </div>
                                                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">
                                                                {index + 1 === 1 ? '1er Versement' : `${index + 1}ème Versement`}
                                                                {c.observation && <span className="text-slate-400 font-bold ml-2 italic">({c.observation})</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-black text-indigo-600">
                                                        +{Number(c.amount).toLocaleString('fr-FR')} FCFA
                                                    </div>
                                                </div>
                                            ))}
                                        {contributions.filter(c => c.missionaryId === selectedMissionaryHistory).length === 0 && (
                                            <div className="py-10 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">
                                                Aucun versement trouvé
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-100 space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Comité d'Organisation</h2>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Structure organisationnelle TAFIRE 2026</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (isLocked) {
                                        setShowPasswordPrompt(true);
                                    } else {
                                        setEditingCO({ role: '', name: '', phone: '' });
                                        setShowCOForm(true);
                                    }
                                }}
                                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                <UserPlus size={16} /> Ajouter un Poste
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {comiteMembers.sort((a, b) => {
                                // Keep the order from the screenshot roughly
                                const order = ["Président", "Vice-Président", "Chef de Camp", "Responsable", "Représentant"];
                                const getOrderIdx = (role: string) => order.findIndex(o => role.includes(o));
                                return getOrderIdx(a.role) - getOrderIdx(b.role);
                            }).map((m) => (
                                <div key={m.id} className="group relative bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all hover:shadow-xl">
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                if (isLocked) {
                                                    setShowPasswordPrompt(true);
                                                } else {
                                                    setEditingCO(m);
                                                    setShowCOForm(true);
                                                }
                                            }}
                                            className="w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <Zap size={16} />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="inline-flex px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-wider">
                                            {m.role}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase leading-snug">{m.name}</h4>
                                            {m.phone && (
                                                <p className="text-indigo-500 text-[10px] font-bold mt-1">{m.phone}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-900 rounded-[3rem] p-10 text-center space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><ShieldCheck size={120} className="text-white" /></div>
                            <h3 className="text-white text-xl font-black uppercase tracking-widest leading-tight">Ensemble pour le succès de la mission</h3>
                            <p className="text-slate-400 text-xs italic">"Servez-vous les uns les autres par amour." — Galates 5:13</p>
                        </div>
                    </div>

                    {showCOForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!editingCO?.role || !editingCO?.name) return;
                                    onSaveComiteMember({
                                        id: editingCO.id || `co-${Date.now()}`,
                                        role: editingCO.role,
                                        name: editingCO.name,
                                        phone: editingCO.phone || ''
                                    });
                                    setShowCOForm(false);
                                    setEditingCO(null);
                                }}
                                className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300"
                            >
                                <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">
                                            {editingCO?.id ? "Modifier le Poste" : "Nouveau Poste"}
                                        </h3>
                                        <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">Comité d'Organisation TAFIRE 2026</p>
                                    </div>
                                    <button type="button" onClick={() => setShowCOForm(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="p-10 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rôle / Responsabilité *</label>
                                        <input
                                            required
                                            value={editingCO?.role || ''}
                                            onChange={e => setEditingCO(prev => ({ ...prev, role: e.target.value }))}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Ex: Responsable Technique"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du Responsable *</label>
                                        <input
                                            required
                                            value={editingCO?.name || ''}
                                            onChange={e => setEditingCO(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Ex: Jean Martin"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact (Optionnel)</label>
                                        <input
                                            value={editingCO?.phone || ''}
                                            onChange={e => setEditingCO(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Ex: 07 00 00 00 00"
                                        />
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCOForm(false)}
                                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 shadow-inner"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CampaignDashboard;
