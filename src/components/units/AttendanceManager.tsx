import React, { useState, useMemo, useEffect } from 'react';
import {
    Users, Calendar, Check, Save, Search, ChevronLeft, ChevronRight,
    Lock, Unlock, ShieldCheck, PenTool, MousePointer2, Wand2, KeyRound,
    AlertCircle, CheckCircle2, LayoutGrid, Monitor, Save as SaveIcon,
    X, Sparkles, Mic, MicOff, Loader2, Send, CheckCircle, ListTodo, UserCheck,
    Settings2, ClipboardCheck, Info, ArrowRight, UserPlus2, Filter, TrendingUp,
    Trophy, BarChart3, PieChart, Download, Printer, FileSpreadsheet, User,
    Star, Award, Activity, RefreshCcw, LayoutDashboard, Target, Clock,
    Medal, UserPlus, Zap, FileText, FileType
} from 'lucide-react';
import { EvangelismUnit, Committee, AttendanceSession, Member } from '../../types';
import { ADMIN_PASSWORD } from '../../constants';
import { db, addMemberToGroup } from '../../services/firebaseService';
import MemberFormModal from '../members/MemberFormModal';

interface Props {
    units: EvangelismUnit[];
    committees: Committee[];
    history: AttendanceSession[];
    onSaveSession: (session: AttendanceSession) => void;
    onAddMemberToGroup: (groupId: string, member: Member) => void;
    isAdmin: boolean;
}

const MONTHS_FR = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];

const CATEGORIES = [
    { id: "JEÛNE ET PRIÈRE", label: "JEUNE ET PRIERE", color: "text-amber-500", bg: "bg-amber-500" },
    { id: "RÉUNION DE PRIÈRE", label: "REUNION DE PRIERE", color: "text-indigo-500", bg: "bg-indigo-500" },
    { id: "PRIÈRE ET EXHORTATION", label: "PRIERE ET EXHORTATION", color: "text-sky-500", bg: "bg-sky-500" },
    { id: "ÉTUDE BIBLIQUE", label: "ETUDE BIBLIQUE", color: "text-emerald-500", bg: "bg-emerald-500" },
    { id: "RÉUNION DES UNITÉS", label: "REUNION DE UNITES", color: "text-violet-500", bg: "bg-violet-500" },
    { id: "JRNE MONDIALE EVANG.", label: "JRNE MONDIALE EVANG", color: "text-rose-500", bg: "bg-rose-500" },
    { id: "VISITE AUX MEMBRES (ACTION SOCIALE)", label: "VISITES MEMBRES (A.S)", color: "text-pink-500", bg: "bg-pink-500" },
    { id: "FORMATION", label: "FORMATION", color: "text-orange-500", bg: "bg-orange-500" },
    { id: "RETRAITE ANNUELLE", label: "RETRAITE ANNUELLE DEVAC", color: "text-red-500", bg: "bg-red-500" },
    { id: "CAMPAGNE D'ÉVANGÉLISATION", label: "GRANDE CAMPAGNE EVANG.", color: "text-orange-600", bg: "bg-orange-600" }
];

const BIBLE_VERSES_ENCOURAGEMENT = [
    { text: "Soyez fermes, inébranlables, travaillant de mieux en mieux à l'oeuvre du Seigneur.", ref: "1 Cor. 15:58" },
    { text: "Ne nous lassons pas de faire le bien; car nous moissonnerons au temps convenable.", ref: "Galates 6:9" },
    { text: "Tout ce que vous faites, faites-le de bon coeur, comme pour le Seigneur.", ref: "Colossiens 3:23" },
    { text: "Heureux l'homme qui persévère, car il recevra la couronne de vie.", ref: "Jacques 1:12" },
    { text: "Que tout ce que vous faites se fasse avec amour.", ref: "1 Cor. 16:14" },
    { text: "Ta fidélité est grande, le Seigneur renouvelle ses bontés chaque matin.", ref: "Lam. 3:23" },
    { text: "Celui qui est fidèle dans les petites choses l'est aussi dans les grandes.", ref: "Luc 16:10" }
];

const getBiblicalEncouragement = (index: number) => {
    const verse = BIBLE_VERSES_ENCOURAGEMENT[index % BIBLE_VERSES_ENCOURAGEMENT.length];
    return `"${verse.text}" — ${verse.ref}`;
};

const AttendanceManager: React.FC<Props> = ({
    units,
    committees,
    history,
    onSaveSession,
    onAddMemberToGroup,
    isAdmin
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSection, setSelectedSection] = useState('ALL');
    const [focusedDate, setFocusedDate] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'REGISTRY' | 'STATS'>('REGISTRY');
    const [hoveredDate, setHoveredDate] = useState<number | null>(null);

    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);

    const [meetingTitles, setMeetingTitles] = useState<Record<string, string>>({});
    const [meetingTypes, setMeetingTypes] = useState<Record<string, string>>({});
    const [checkedDates, setCheckedDates] = useState<Record<string, boolean>>({});

    const [selectedStatCategory, setSelectedStatCategory] = useState(CATEGORIES[1].id);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

    const groups = useMemo(() => [...units, ...committees], [units, committees]);
    const currentGroupId = useMemo(() => {
        if (selectedSection === 'ALL') return 'ALL';
        const group = groups.find(g => g.name.replace('Unité ', '').replace('Comité ', '').toUpperCase() === selectedSection);
        return group ? group.id : 'ALL';
    }, [selectedSection, groups]);

    const allMembersList = useMemo(() => {
        let list: { member: Member; unitName: string; groupId: string }[] = [];
        groups.forEach(g => {
            g.members.forEach(m => {
                list.push({ member: m, unitName: g.name.replace('Unité ', '').replace('Comité ', '').replace('Unité', '').replace('Comité', '').trim().toUpperCase(), groupId: g.id });
            });
        });

        const filtered = list.filter(item => {
            const matchesSearch = item.member.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSection = selectedSection === 'ALL' || item.unitName === selectedSection;
            return matchesSearch && matchesSection;
        });

        return filtered.sort((a, b) => a.member.name.localeCompare(b.member.name));
    }, [units, committees, searchQuery, selectedSection]);

    const meetingDays = useMemo(() => {
        const dates = [];
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

        let lastSundayDate = -1;
        for (let i = lastDayOfMonth; i >= 1; i--) {
            if (new Date(year, month, i).getDay() === 0) {
                lastSundayDate = i;
                break;
            }
        }

        for (let i = 1; i <= lastDayOfMonth; i++) {
            const d = new Date(year, month, i);
            const dayOfWeek = d.getDay();
            const isMonday = dayOfWeek === 1;
            const isFriday = dayOfWeek === 5;
            const isLastSunday = (dayOfWeek === 0 && i === lastSundayDate);

            if (isMonday || isFriday || isLastSunday) {
                dates.push({
                    day: d.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase(),
                    date: i,
                    isSpecial: isLastSunday
                });
            }
        }
        return dates.sort((a, b) => a.date - b.date);
    }, [currentMonth]);

    const getDateStr = (day: number) => {
        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const currentActiveDate = focusedDate || hoveredDate;

    const currentSession = useMemo(() => {
        if (!currentActiveDate) return null;
        const dateStr = getDateStr(currentActiveDate);
        return history.find(s => s.date === dateStr && (s.groupId === currentGroupId || s.groupId === 'ALL'));
    }, [currentActiveDate, history, currentGroupId]);

    const isCurrentValidated = useMemo(() => {
        if (!focusedDate) return false;
        const dateStr = getDateStr(focusedDate);
        return history.some(s => s.date === dateStr && (s.groupId === currentGroupId || s.groupId === 'ALL'));
    }, [focusedDate, history, currentGroupId]);

    useEffect(() => {
        if (focusedDate) {
            const dateStr = getDateStr(focusedDate);
            const session = history.find(s => s.date === dateStr && (s.groupId === currentGroupId || s.groupId === 'ALL'));

            if (session) {
                setMeetingTitles(prev => ({ ...prev, [`${currentGroupId}-${focusedDate}`]: session.title?.split(' - ')[1] || session.title || '' }));
                const foundType = CATEGORIES.find(cat => session.title?.toUpperCase().includes(cat.id));
                if (foundType) setMeetingTypes(prev => ({ ...prev, [`${currentGroupId}-${focusedDate}`]: foundType.id }));

                const nextChecks: Record<string, boolean> = {};
                // IMPORTANT: Use unfiltered groups to populate checks, not allMembersList
                groups.forEach(g => {
                    g.members.forEach(m => {
                        nextChecks[`${m.id}-${focusedDate}`] = session.attendees.includes(m.id);
                    });
                });
                setCheckedDates(nextChecks);
            } else {
                const nextChecks: Record<string, boolean> = {};
                groups.forEach(g => {
                    g.members.forEach(m => {
                        nextChecks[`${m.id}-${focusedDate}`] = false;
                    });
                });
                setCheckedDates(nextChecks);
            }
            setIsUnlocked(false);
        }
    }, [focusedDate, currentGroupId, history, groups]);

    const handleToggleAttendance = (memberId: string) => {
        if (!focusedDate) return;
        if (isCurrentValidated && !isUnlocked) return;
        const key = `${memberId}-${focusedDate}`;
        setCheckedDates(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveSession = () => {
        if (!focusedDate) return;
        const dateStr = getDateStr(focusedDate);

        // CRITICAL FIX: Gather ALL checked attendees from the entire list, not just filtered ones
        const attendees: string[] = [];
        groups.forEach(g => {
            g.members.forEach(m => {
                if (checkedDates[`${m.id}-${focusedDate}`]) {
                    attendees.push(m.id);
                }
            });
        });

        const type = meetingTypes[`${currentGroupId}-${focusedDate}`] || "RÉUNION";
        const titleInput = meetingTitles[`${currentGroupId}-${focusedDate}`] || "";
        const finalTitle = titleInput ? `${type} - ${titleInput}` : type;

        onSaveSession({
            id: `${currentGroupId}-${dateStr}`,
            groupId: currentGroupId,
            date: dateStr,
            attendees,
            title: finalTitle
        });
        setIsUnlocked(false);
        setFocusedDate(null);
    };
    const handleUnlock = () => {
        if (unlockPassword === ADMIN_PASSWORD) {
            setIsUnlocked(true);
            setShowPasswordModal(false);
            setUnlockPassword('');
            setPasswordError(false);
        } else {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 2000);
        }
    };

    const topConsistencyData = useMemo(() => {
        const memberCounts: Record<string, number> = {};
        history.forEach(session => {
            session.attendees.forEach(memberId => {
                memberCounts[memberId] = (memberCounts[memberId] || 0) + 1;
            });
        });

        const unitTops: Record<string, { members: { id: string, name: string }[], count: number }> = {};
        groups.forEach(group => {
            let maxCount = 0;
            group.members.forEach(m => {
                const count = memberCounts[m.id] || 0;
                if (count > maxCount) maxCount = count;
            });
            const topMembers = group.members
                .filter(m => (memberCounts[m.id] || 0) === maxCount && maxCount > 0)
                .map(m => ({ id: m.id, name: m.name }));
            unitTops[group.id] = { members: topMembers, count: maxCount };
        });

        const maxOverall = Object.values(memberCounts).length > 0 ? Math.max(...Object.values(memberCounts)) : 0;
        const overallTops = allMembersList
            .filter(m => memberCounts[m.member.id] === maxOverall && maxOverall > 0)
            .map(m => ({ ...m, count: maxOverall }));

        return { unitTops, overallTops, maxScore: maxOverall };
    }, [history, groups, allMembersList]);

    const tableDataStats = useMemo(() => {
        const data: Record<number, any> = {};
        MONTHS_FR.forEach((_, idx) => {
            data[idx] = { totalParticipants: 0, totalSessions: 0, cats: {} };
            CATEGORIES.forEach(cat => {
                data[idx].cats[cat.id] = { count: 0, participants: 0 };
            });
        });

        // Get the set of member IDs for the current group if it's not 'ALL'
        const groupMemberIds = currentGroupId !== 'ALL'
            ? new Set(groups.find(g => g.id === currentGroupId)?.members.map(m => m.id))
            : null;

        history.forEach(session => {
            // Include session if it belongs to current group OR is global (ALL/Campaign)
            const isRelevantSession = session.groupId === currentGroupId ||
                session.groupId === 'ALL' ||
                session.groupId === 'campaign-tafire-2026';

            if (!isRelevantSession) return;

            const date = new Date(session.date);
            const month = date.getMonth();
            const titleUpper = session.title?.toUpperCase() || "";
            let foundCat = CATEGORIES.find(c => titleUpper.includes(c.id));

            // Force campaign category for sessions from the campaign group or with campaign-related titles
            if (!foundCat && (session.groupId === 'campaign-tafire-2026' || titleUpper.includes("TAFIRE") || titleUpper.includes("CAMPAGNE"))) {
                foundCat = CATEGORIES.find(c => c.id === "CAMPAGNE D'ÉVANGÉLISATION");
            }

            if (foundCat) {
                // Filter attendees to only those in the current unit if applicable
                const relevantAttendees = groupMemberIds
                    ? session.attendees.filter(id => groupMemberIds.has(id))
                    : session.attendees;

                const participantCount = relevantAttendees.length;

                // Only count the session if there's at least one participant from the unit (for non-ALL view)
                // OR if it's the 'ALL' view
                if (currentGroupId === 'ALL' || participantCount > 0) {
                    data[month].cats[foundCat.id].count += 1;
                    data[month].cats[foundCat.id].participants += participantCount;
                    data[month].totalParticipants += participantCount;
                    data[month].totalSessions += 1;
                }
            }
        });
        return data;
    }, [history, currentGroupId, groups]);

    const handleExportAnnualRegistry = (format: 'PDF' | 'XLS' | 'DOC') => {
        if (format === 'PDF') {
            window.print();
            setShowExportMenu(false);
            return;
        }

        const filename = `Bilan_Activites_DEVAC_${new Date().getFullYear()}`;
        let content = "";

        if (format === 'XLS') {
            content = "\ufeffMOIS;";
            CATEGORIES.forEach(cat => { content += `${cat.label} (Sess.);${cat.label} (Part.);`; });
            content += "MOY. PARTICIPANT/MOIS\n";

            MONTHS_FR.forEach((month, mIdx) => {
                content += `${month};`;
                const row = tableDataStats[mIdx];
                CATEGORIES.forEach(cat => {
                    content += `${row.cats[cat.id].count};${row.cats[cat.id].participants};`;
                });
                const avg = row.totalSessions > 0 ? Math.round(row.totalParticipants / row.totalSessions) : 0;
                content += `${avg}\n`;
            });

            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Bilan DEVAC</title>
        <style>
          @page WordSection1 { size:842pt 595pt; mso-page-orientation:landscape; margin:20pt; }
          div.WordSection1 { page:WordSection1; }
          table { border-collapse:collapse; width:100%; }
          th, td { border:1px solid black; padding:3px 4px; text-align:center; font-family:Arial,sans-serif; font-size:7px; word-break:break-word; }
          th { background:#1e5aa8; color:white; font-weight:bold; }
          td:first-child { text-align:left; font-weight:bold; font-size:7px; }
          h2 { text-align:center; font-family:Arial,sans-serif; font-size:13px; margin-bottom:8px; }
          .orange { background:#f26522; color:white; font-weight:bold; }
        </style></head>
        <body><div class='WordSection1'>
        <h2>BILAN DES ACTIVITES ANNUELLES - DEVAC</h2>
        <table>
          <thead>
            <tr><th>MOIS</th>${CATEGORIES.map(c => `<th colspan='2'>${c.label}</th>`).join('')}<th class='orange'>MOY. PARTICIPANT/MOIS</th></tr>
            <tr><th></th>${CATEGORIES.map(() => `<th>Sess.</th><th>Moy.Part.</th>`).join('')}<th class='orange'></th></tr>
          </thead>
          <tbody>
            ${MONTHS_FR.map((month, mIdx) => {
                const row = tableDataStats[mIdx];
                const avg = row.totalSessions > 0 ? (row.totalParticipants / row.totalSessions).toFixed(2) : '';
                return `<tr><td>${month}</td>${CATEGORIES.map(cat => `<td>${row.cats[cat.id].count || ''}</td><td>${row.cats[cat.id].count > 0 ? Math.round(row.cats[cat.id].participants / row.cats[cat.id].count) : ''}</td>`).join('')}<td class='orange'>${avg}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
        </div></body></html>`;

            const blob = new Blob([html], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.doc`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setShowExportMenu(false);
    };

    const SummaryTable = () => {
        const totalColumn = useMemo(() => {
            const totals: any = { grandTotalParticipants: 0, grandTotalSessions: 0, cats: {} };
            CATEGORIES.forEach(cat => { totals.cats[cat.id] = { count: 0, participants: 0 }; });
            MONTHS_FR.forEach((_, monthIdx) => {
                const monthData = tableDataStats[monthIdx];
                totals.grandTotalParticipants += monthData.totalParticipants;
                totals.grandTotalSessions += monthData.totalSessions;
                CATEGORIES.forEach(cat => {
                    totals.cats[cat.id].count += monthData.cats[cat.id].count;
                    totals.cats[cat.id].participants += monthData.cats[cat.id].participants;
                });
            });
            return totals;
        }, [tableDataStats]);

        return (
            <div className="bg-white rounded-[2rem] border-2 border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 mb-20">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#1e5aa8] text-white">
                                <th rowSpan={2} className="px-6 py-6 border border-white/20 text-[10px] font-black uppercase tracking-widest text-left">MOIS</th>
                                {CATEGORIES.map((cat, i) => (
                                    <th key={i} colSpan={2} className="px-3 py-4 border border-white/20 text-[8px] font-black uppercase tracking-tight text-center bg-white/5">{cat.label}</th>
                                ))}
                                <th rowSpan={2} className="px-6 py-6 border border-white/20 text-xs font-black uppercase tracking-widest text-center bg-[#f26522]">MOY. PARTICIPANT/MOIS</th>
                            </tr>
                            <tr className="bg-[#1e5aa8] text-white">
                                {CATEGORIES.map((_, i) => (
                                    <React.Fragment key={i}>
                                        <th className="px-1 py-3 border border-white/20 text-[8px] font-medium uppercase text-center text-indigo-100/70">Sess.</th>
                                        <th className="px-1 py-3 border border-white/20 text-[8px] font-black uppercase text-center">Moy. Part.</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MONTHS_FR.map((month, mIdx) => {
                                const row = tableDataStats[mIdx];
                                return (
                                    <tr key={mIdx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 uppercase">{month}</td>
                                        {CATEGORIES.map((cat, cIdx) => {
                                            const val = row.cats[cat.id];
                                            return (
                                                <React.Fragment key={cIdx}>
                                                    <td className={`px-1 py-4 border border-slate-200 text-[10px] text-center font-normal text-indigo-500 ${val.count > 0 ? 'bg-white' : 'bg-slate-50/30 text-slate-300'}`}>{val.count || ""}</td>
                                                    <td className={`px-1 py-4 border border-slate-200 text-[11px] text-center font-black text-slate-900 ${val.participants > 0 ? 'bg-white' : 'bg-slate-50/30 text-slate-300'}`}>
                                                        {val.count > 0 ? Math.round(val.participants / val.count) : ""}
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                        <td className="px-6 py-4 border border-slate-200 text-center font-black text-white bg-[#f26522]/90 shadow-inner text-base">
                                            {row.totalSessions > 0 ? (row.totalParticipants / row.totalSessions).toFixed(2) : ""}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-[#f26522] text-white">
                                <td className="px-6 py-5 border border-white/20 text-xs font-black uppercase tracking-[0.2em]">TOTAL</td>
                                {CATEGORIES.map((cat, i) => (
                                    <React.Fragment key={i}>
                                        <td className="px-1 py-5 border border-white/20 text-center text-xs font-medium text-white/70">{totalColumn.cats[cat.id].count}</td>
                                        <td className="px-1 py-5 border border-white/20 text-center text-sm font-black">
                                            {totalColumn.cats[cat.id].count > 0 ? Math.round(totalColumn.cats[cat.id].participants / totalColumn.cats[cat.id].count) : 0}
                                        </td>
                                    </React.Fragment>
                                ))}
                                <td className="px-6 py-5 border border-white/20 text-center text-xl font-black">
                                    {totalColumn.grandTotalSessions > 0 ? (totalColumn.grandTotalParticipants / totalColumn.grandTotalSessions).toFixed(2) : '0.00'}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#f8fafc] min-h-[92vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 relative">
            <div className="px-12 py-8 bg-white border-b border-slate-100 flex flex-col gap-6 shrink-0 z-50 print:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                            <button onClick={() => setActiveTab('REGISTRY')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'REGISTRY' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                                <ClipboardCheck size={18} /> Registre
                            </button>
                            <button onClick={() => setActiveTab('STATS')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'STATS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                                <BarChart3 size={18} /> Statistiques
                            </button>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                            {activeTab === 'REGISTRY' ? 'Pointage DEVAC' : 'Tableau de Performance'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input
                                id="search-input-no-autofill"
                                name={`search_${Math.random().toString(36).substring(7)}`}
                                autoComplete="one-time-code"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                placeholder="Chercher un membre..."
                            />
                        </div>
                        <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="h-12 px-6 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm cursor-pointer hover:border-indigo-300 transition-all">
                            <option value="ALL">TOUT LE REGISTRE</option>
                            {groups.map(g => <option key={g.id} value={g.name.replace('Unité ', '').replace('Comité ', '').toUpperCase()}>{g.name.toUpperCase()}</option>)}
                        </select>
                        <button
                            onClick={() => {
                                if (selectedSection === 'ALL') {
                                    alert("Veuillez sélectionner une unité spécifique pour ajouter un membre.");
                                    return;
                                }
                                setIsMemberModalOpen(true);
                            }}
                            className="h-12 px-6 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <UserPlus size={18} /> Ajouter Membre
                        </button>
                    </div>
                </div>

                {activeTab === 'REGISTRY' && (
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-16 pt-2 px-4 animate-in slide-in-from-top-4 duration-500 min-h-[220px]">
                        <div className="flex items-center bg-slate-100 px-4 py-4 rounded-3xl text-slate-500 font-bold text-[10px] uppercase tracking-widest gap-4 border border-slate-200 shadow-inner mr-2 shrink-0 h-[155px]">
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="hover:text-indigo-600 transition-colors"><ChevronLeft size={20} /></button>
                            <span className="text-slate-900 whitespace-nowrap min-w-[120px] text-center">{MONTHS_FR[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="hover:text-indigo-600 transition-colors"><ChevronRight size={20} /></button>
                        </div>
                        {meetingDays.map((d, i) => {
                            const dateStr = getDateStr(d.date);
                            const session = history.find(s => s.date === dateStr && (currentGroupId === 'ALL' || s.groupId === currentGroupId));
                            const isValidated = !!session;
                            const isSelected = focusedDate === d.date;

                            return (
                                <div key={i} className="relative">
                                    <button
                                        onClick={() => setFocusedDate(isSelected ? null : d.date)}
                                        onMouseEnter={() => setHoveredDate(d.date)}
                                        onMouseLeave={() => setHoveredDate(null)}
                                        className={`flex-shrink-0 relative w-[135px] h-[155px] rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-between p-5 group ${isSelected
                                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xl scale-110 z-20'
                                            : isValidated
                                                ? 'bg-[#0f172a] border-slate-800 text-white hover:border-indigo-400'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center leading-none">
                                            <span className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${isSelected ? 'text-indigo-200' : d.isSpecial ? 'text-pink-500' : 'text-slate-500'}`}>{d.day}</span>
                                            <span className={`text-4xl font-black ${isSelected || isValidated ? 'text-white' : 'text-slate-900'}`}>{d.date}</span>
                                        </div>

                                        {isValidated ? (
                                            <div className="w-full flex flex-col items-center gap-1">
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-slate-800 text-indigo-400 line-clamp-1 text-center`}>
                                                    {session.title?.split(' - ')[0] || "MISSION"}
                                                </div>
                                                <div className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                    {session.attendees.length} PRÉSENTS
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`text-[9px] font-black uppercase tracking-widest ${d.isSpecial ? 'text-pink-400 animate-pulse' : 'text-slate-300'}`}>
                                                {d.isSpecial ? 'DERNIER DIM.' : 'À POINTER'}
                                            </div>
                                        )}

                                        {isValidated && (
                                            <div className="absolute top-3 right-3">
                                                <CheckCircle2 size={16} className={isSelected ? 'text-indigo-200' : 'text-emerald-400'} />
                                            </div>
                                        )}
                                    </button>

                                    {isValidated && hoveredDate === d.date && !isSelected && (
                                        <div className="absolute top-[165px] left-1/2 -translate-x-1/2 w-[240px] bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 z-[100] animate-in zoom-in-95 pointer-events-none">
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">INFOS RÉUNION</div>
                                            <div className="text-[11px] font-black uppercase leading-tight text-indigo-100 mb-1">{session.title?.split(' - ')[0]}</div>
                                            <div className="overflow-hidden relative h-5">
                                                <div className={`text-[12px] font-medium italic text-slate-300 whitespace-nowrap ${(session.title?.split(' - ')[1] || "").length > 25 ? 'animate-marquee' : ''}`}>
                                                    "{session.title?.split(' - ')[1] || "Pas de thème"}"
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'REGISTRY' ? (
                    <div className="flex-1 flex flex-col h-full bg-white relative">
                        {!currentActiveDate ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-700">
                                <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-10 shadow-inner">
                                    <Calendar size={60} className="text-slate-200" />
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Suivi des Missions</h3>
                                <p className="text-slate-400 font-medium max-w-sm text-lg leading-relaxed">Survolez ou cliquez sur une date pour consulter ou saisir les détails de la mission.</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-8 duration-700 h-full overflow-hidden">
                                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                                    <div className="flex items-center gap-10">
                                        <div className={`w-24 h-24 rounded-[2.5rem] shadow-xl border-4 flex flex-col items-center justify-center transition-all ${currentSession ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${currentSession ? 'text-emerald-400' : 'text-indigo-500'}`}>{meetingDays.find(d => d.date === currentActiveDate)?.day}</span>
                                            <span className={`text-4xl font-black ${currentSession ? 'text-white' : 'text-slate-900'}`}>{currentActiveDate}</span>
                                        </div>
                                        <div className="space-y-4 flex-1 min-w-[450px]">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Type de Mission</label>
                                                    <select
                                                        value={focusedDate ? (meetingTypes[`${currentGroupId}-${focusedDate}`] || "") : (currentSession?.title?.split(' - ')[0] || "")}
                                                        onChange={e => focusedDate && setMeetingTypes(prev => ({ ...prev, [`${currentGroupId}-${focusedDate}`]: e.target.value }))}
                                                        disabled={!focusedDate || (isCurrentValidated && !isUnlocked)}
                                                        className="w-full bg-white border-2 rounded-2xl px-6 py-4 text-[11px] font-black uppercase outline-none shadow-sm transition-all border-slate-200 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                                                    >
                                                        <option value="">-- CHOISIR --</option>
                                                        {CATEGORIES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Thème / Détails</label>
                                                    <div className="relative group/title">
                                                        <input
                                                            value={focusedDate ? (meetingTitles[`${currentGroupId}-${focusedDate}`] || "") : (currentSession?.title?.split(' - ')[1] || "")}
                                                            onChange={e => focusedDate && setMeetingTitles(prev => ({ ...prev, [`${currentGroupId}-${focusedDate}`]: e.target.value }))}
                                                            disabled={!focusedDate || (isCurrentValidated && !isUnlocked)}
                                                            placeholder="Précisez l'activité..."
                                                            className="w-full bg-white border-2 rounded-2xl px-6 py-4 text-sm font-bold outline-none shadow-sm border-slate-200 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap"
                                                        />
                                                        {!focusedDate && currentSession && (currentSession.title?.split(' - ')[1]?.length || 0) > 30 && (
                                                            <div className="absolute top-full left-0 mt-2 bg-slate-900 text-white p-4 rounded-xl text-xs font-medium z-[100] opacity-0 group-hover/title:opacity-100 transition-opacity pointer-events-none w-max max-w-[400px]">
                                                                {currentSession.title?.split(' - ')[1]}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        {focusedDate ? (
                                            isCurrentValidated ? (
                                                isUnlocked ? (
                                                    <button onClick={handleSaveSession} className="flex items-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all active:scale-95"><SaveIcon size={20} /> Actualiser</button>
                                                ) : (
                                                    <button onClick={() => setShowPasswordModal(true)} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-sm hover:bg-slate-800 transition-all"><Unlock size={20} /> Déverrouiller</button>
                                                )
                                            ) : (
                                                <button onClick={handleSaveSession} disabled={!meetingTypes[`${currentGroupId}-${focusedDate}`]} className="flex items-center gap-3 px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-700 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300">
                                                    <ShieldCheck size={24} /> Valider le pointage
                                                </button>
                                            )
                                        ) : (
                                            <div className="bg-indigo-50 px-6 py-4 rounded-2xl text-indigo-600 text-xs font-black uppercase tracking-widest border border-indigo-100">
                                                {currentSession ? `${currentSession.attendees.length} PRÉSENTS` : "MODE CONSULTATION"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-50/30">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {allMembersList.map((item, idx) => {
                                            const isChecked = focusedDate
                                                ? !!checkedDates[`${item.member.id}-${focusedDate}`]
                                                : currentSession?.attendees.includes(item.member.id);

                                            const canEdit = focusedDate && (!isCurrentValidated || isUnlocked);

                                            return (
                                                <div key={idx} onClick={() => canEdit && handleToggleAttendance(item.member.id)} className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 ${isChecked ? 'bg-white border-indigo-500 shadow-xl ring-4 ring-indigo-500/5' : 'bg-white border-slate-50 hover:border-slate-200 shadow-sm'} ${!canEdit ? 'cursor-default' : 'cursor-pointer active:scale-95 group'}`}>
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg uppercase transition-all ${isChecked ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{item.member.name.charAt(0)}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-xs font-black uppercase truncate tracking-tight ${isChecked ? 'text-indigo-900' : 'text-slate-800'}`}>{item.member.name}</div>
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.unitName}</div>
                                                    </div>
                                                    {isChecked && <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><Check size={18} strokeWidth={4} /></div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-12 space-y-12 animate-in fade-in duration-500 bg-slate-50 custom-scrollbar h-full">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                                    <Award className="text-indigo-600" size={36} /> Bilan des activités annuelles
                                </h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] ml-1">Registre consolidé et distinctions d'assiduité</p>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
                                >
                                    <Download size={18} /> Exporter le Bilan
                                </button>
                                {showExportMenu && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-4 z-[200] animate-in zoom-in-95 overflow-hidden">
                                        <button onClick={() => handleExportAnnualRegistry('PDF')} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-black text-[10px] uppercase tracking-widest transition-colors"><Printer size={18} className="text-indigo-400" /> PDF / Imprimer</button>
                                        <button onClick={() => handleExportAnnualRegistry('XLS')} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-black text-[10px] uppercase tracking-widest transition-colors"><FileSpreadsheet size={18} className="text-emerald-400" /> Excel (XLS/CSV)</button>
                                        <button onClick={() => handleExportAnnualRegistry('DOC')} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-black text-[10px] uppercase tracking-widest transition-colors"><FileType size={18} className="text-blue-400" /> Word (DOC)</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* HALL OF FAME / TROPHÉES */}
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                            {/* MEMBRES LES PLUS ASSIDUS GÉNÉRAL */}
                            <div className="xl:col-span-1 bg-slate-900 rounded-[3rem] p-8 shadow-2xl border-4 border-indigo-500/20 relative overflow-hidden group min-h-[400px]">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all rotate-12 group-hover:rotate-0">
                                    <Trophy size={140} className="text-indigo-400" />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-indigo-500/20 inline-block w-max mb-6">Major(s) de promotion</div>
                                    <h4 className="text-white text-2xl font-black uppercase tracking-tighter leading-tight mb-8">
                                        {topConsistencyData.overallTops.length > 1 ? "Membres les plus assidus" : "Membre le plus assidu"}
                                    </h4>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
                                        {topConsistencyData.overallTops.length > 0 ? (
                                            topConsistencyData.overallTops.map((top, idx) => (
                                                <div key={idx} className="animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 150}ms` }}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-xl text-slate-900 shadow-xl shrink-0">{top.member.name.charAt(0)}</div>
                                                        <div className="min-w-0">
                                                            <div className="text-base font-black text-white uppercase truncate">{top.member.name}</div>
                                                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{top.unitName}</div>
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-[11px] text-slate-400 font-medium italic leading-relaxed border-l-2 border-indigo-500/30 pl-4 bg-white/5 py-3 rounded-r-xl">
                                                        {getBiblicalEncouragement(idx)}
                                                    </p>
                                                </div>
                                            ))
                                        ) : <p className="text-slate-500 italic">En attente de pointage...</p>}
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between shrink-0">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points Présence</span>
                                        <span className="text-2xl font-black text-indigo-400">{topConsistencyData.maxScore}</span>
                                    </div>
                                </div>
                            </div>

                            {/* TOPS PAR UNITÉ (Handling Ties) */}
                            <div className="xl:col-span-3 bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 overflow-hidden relative">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3"><Medal size={18} className="text-amber-500" /> Champions de Groupes</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groups.map(g => {
                                        const topData = topConsistencyData.unitTops[g.id];
                                        return (
                                            <div key={g.id} className="flex flex-col gap-4 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:border-indigo-200 transition-all hover:shadow-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{g.name.replace('Unité ', '').replace('Comité ', '')}</div>
                                                    <div className="text-xs font-black text-indigo-600 bg-white px-3 py-1 rounded-full shadow-inner">{topData.count} sess.</div>
                                                </div>

                                                <div className="space-y-4">
                                                    {topData.members.length > 0 ? (
                                                        topData.members.map((member, mIdx) => (
                                                            <div key={member.id} className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="relative">
                                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black text-sm shadow-md border border-slate-100 group-hover:scale-110 transition-transform">
                                                                            {member.name.charAt(0)}
                                                                        </div>
                                                                        <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white rounded-full p-0.5 shadow-lg"><Star size={8} fill="currentColor" /></div>
                                                                    </div>
                                                                    <div className="text-[11px] font-black text-slate-900 uppercase truncate flex-1">{member.name}</div>
                                                                </div>
                                                                <p className="text-[9px] text-slate-400 italic leading-tight pl-2 border-l border-slate-200">
                                                                    {getBiblicalEncouragement(mIdx + 5)}
                                                                </p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-[10px] text-slate-400 italic">Aucune activité enregistrée</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* TABLEAU RÉCAPITULATIF ANNUEL */}
                        <SummaryTable />

                        {/* ANALYSEUR PAR CATÉGORIE & INDIVIDUEL */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* SÉLECTEUR DE CATÉGORIE ET GRAPHE */}
                            <div className="lg:col-span-8 bg-[#1e293b] rounded-[3.5rem] p-10 shadow-2xl border border-white/5 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5"><TrendingUp size={28} /></div>
                                        <div>
                                            <h4 className="text-white font-black uppercase text-xl tracking-tighter">Flux de participation</h4>
                                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Analyse temporelle des engagements</p>
                                        </div>
                                    </div>
                                    <select
                                        value={selectedStatCategory}
                                        onChange={e => setSelectedStatCategory(e.target.value)}
                                        className="bg-slate-800 text-white border border-white/10 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/20"
                                    >
                                        {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                                    </select>
                                </div>
                                <BarChart history={history} type={selectedStatCategory} color={CATEGORIES.find(c => c.id === selectedStatCategory)?.bg || 'bg-indigo-500'} />
                            </div>

                            {/* ÉVOLUTION INDIVIDUELLE */}
                            <div className="lg:col-span-4 bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-100 flex flex-col gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Activity size={24} /></div>
                                    <div>
                                        <h4 className="text-slate-900 font-black uppercase text-lg tracking-tight">Suivi de Progression</h4>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Évolution d'assiduité par membre</p>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <select
                                        onChange={e => setSelectedMemberId(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 p-5 pl-14 rounded-3xl text-xs font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                    >
                                        <option value="">— SÉLECTIONNER UN MEMBRE —</option>
                                        {allMembersList.map(m => <option key={m.member.id} value={m.member.id}>{m.member.name} ({m.unitName})</option>)}
                                    </select>
                                </div>

                                {selectedMemberId ? (
                                    <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-4">
                                        <div className="flex items-center gap-5 p-5 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100">
                                            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                                                {allMembersList.find(m => m.member.id === selectedMemberId)?.member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 uppercase truncate max-w-[180px]">{allMembersList.find(m => m.member.id === selectedMemberId)?.member.name}</div>
                                                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{allMembersList.find(m => m.member.id === selectedMemberId)?.unitName}</div>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 flex flex-col justify-end min-h-[180px]">
                                            <MemberSparkline history={history} memberId={selectedMemberId} />
                                            <div className="mt-4 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Janv</span>
                                                <span>Progression annuelle</span>
                                                <span>Déc</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-900 rounded-3xl p-5 text-center shadow-lg border-b-4 border-emerald-500">
                                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Score Engagement</div>
                                                <div className="text-2xl font-black text-emerald-400">{Math.round((history.filter(s => s.attendees.includes(selectedMemberId)).length / Math.max(history.length, 1)) * 100)}%</div>
                                            </div>
                                            <div className="bg-slate-900 rounded-3xl p-5 text-center shadow-lg border-b-4 border-indigo-500">
                                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Consistance</div>
                                                <div className="text-2xl font-black text-indigo-400">{history.filter(s => s.attendees.includes(selectedMemberId)).length} sess.</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30 border-4 border-dashed border-slate-100 rounded-[3rem]">
                                        <MousePointer2 size={64} className="mb-6 animate-bounce" />
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em]">Choisissez un membre pour voir sa courbe d'évolution</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in">
                    <div className={`bg-white w-full max-md rounded-[4rem] p-16 shadow-2xl text-center space-y-12 border-4 transition-all duration-300 ${passwordError ? 'border-red-500 shake' : 'border-indigo-100'}`}>
                        <div className="w-24 h-24 bg-slate-950 text-indigo-400 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl"><Lock size={48} /></div>
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">ACCÈS SÉCURISÉ</h3>
                        <div className="relative">
                            <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                            <input
                                type="password"
                                id="admin-pass-no-autofill"
                                name={`pass_${Math.random().toString(36).substring(7)}`}
                                autoComplete="new-password"
                                value={unlockPassword}
                                onChange={e => setUnlockPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-2xl font-black tracking-[0.5em] outline-none focus:border-indigo-500 transition-all text-center"
                                placeholder="••••"
                            />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-widest">Annuler</button>
                            <button onClick={handleUnlock} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95">Valider</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .animate-marquee {
          display: inline-block;
          animation: marquee 8s linear infinite;
        }

        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .bg-[#f8fafc] { background: white !important; }
          .shadow-2xl { shadow: none !important; }
        }
      `}</style>

            <MemberFormModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                onSave={(newMember) => onAddMemberToGroup(currentGroupId, newMember)}
                title={`Nouveau Membre - ${selectedSection}`}
            />
        </div>
    );
};

const MemberSparkline = ({ history, memberId }: { history: AttendanceSession[], memberId: string }) => {
    const evolutionData = useMemo(() => {
        const monthlyCounts = new Array(12).fill(0);
        history.forEach(session => {
            if (session.attendees.includes(memberId)) {
                const month = new Date(session.date).getMonth();
                monthlyCounts[month]++;
            }
        });
        return monthlyCounts;
    }, [history, memberId]);

    const maxVal = Math.max(...evolutionData, 1);

    return (
        <div className="flex items-end justify-between h-32 gap-1 px-2">
            {evolutionData.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col justify-end group/dot h-full">
                    <div
                        className={`w-full rounded-full transition-all duration-700 ${val > 0 ? 'bg-indigo-500' : 'bg-slate-200'}`}
                        style={{ height: `${(val / maxVal) * 100}%`, minHeight: '4px' }}
                    ></div>
                </div>
            ))}
        </div>
    );
};

const BarChart = ({ history, type, color }: { history: AttendanceSession[], type: string, color: string }) => {
    const statsData = useMemo(() => {
        const monthlyStats: Record<number, { count: number, participants: number }> = {};
        MONTHS_FR.forEach((_, idx) => { monthlyStats[idx] = { count: 0, participants: 0 }; });

        history.forEach(session => {
            const date = new Date(session.date);
            const month = date.getMonth();
            if (session.title?.toUpperCase().includes(type)) {
                monthlyStats[month].count += 1;
                monthlyStats[month].participants += session.attendees.length;
            }
        });
        return monthlyStats;
    }, [history, type]);

    const totalParticipants = useMemo(() =>
        Object.values(statsData).reduce((acc, curr) => acc + (curr as any).participants, 0),
        [statsData]);

    const totalSessions = useMemo(() =>
        Object.values(statsData).reduce((acc, curr) => acc + (curr as any).count, 0),
        [statsData]);

    const maxPart = Math.max(...(Object.values(statsData) as { count: number, participants: number }[]).map(m => m.participants), 1);

    return (
        <div className="space-y-12">
            {/* Bandeau de statistiques cumulées de l'activité */}
            <div className="flex flex-wrap gap-8 border-b border-white/5 pb-8">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Impact Annuel</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">
                            {totalSessions > 0 ? (totalParticipants / totalSessions).toFixed(2) : '0.00'}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Moy. Part./Session</span>
                    </div>
                </div>
                <div className="w-px h-10 bg-white/10 self-end hidden md:block"></div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Volume d'Activité</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-400">{totalSessions}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sessions effectuées</span>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between h-64 gap-4">
                {MONTHS_FR.map((month, idx) => {
                    const data = statsData[idx];
                    const height = (data.participants / maxPart) * 100;
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group/bar">
                            <div className="relative w-full flex flex-col items-center justify-end h-full">
                                {data.participants > 0 && (
                                    <div className="absolute -top-16 flex flex-col items-center bg-white text-slate-900 px-3 py-2 rounded-2xl shadow-2xl z-20 animate-in zoom-in-95 pointer-events-none min-w-[70px]">
                                        <div className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">{data.count} SESS.</div>
                                        <div className="w-full h-px bg-slate-100 my-1"></div>
                                        <div className="text-[11px] font-black text-slate-900">{data.participants} <span className="text-[8px] opacity-40">PRÉS.</span></div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rotate-45"></div>
                                    </div>
                                )}
                                <div className={`w-full rounded-t-[1.8rem] transition-all duration-1000 ease-out shadow-lg ${color} ${data.participants > 0 ? 'opacity-100' : 'opacity-10'}`} style={{ height: `${Math.max(height, 4)}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 tracking-tighter uppercase">{month.substring(0, 3)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AttendanceManager;
