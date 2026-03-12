import React, { useState, useMemo } from 'react';
import {
    HeartPulse, Search, Plus, Phone, MapPin, UserPlus, Trash2,
    Calendar, TrendingUp, Filter, ChevronRight, MessageSquare,
    UserCheck, Clock, ShieldAlert, Heart, LayoutGrid, Download, Printer, Landmark
} from 'lucide-react';
import { NewSoul, EvangelismUnit, Committee, FollowUpLog } from '../types';
import { generateId } from '../constants';

interface SoulFollowUpProps {
    units: EvangelismUnit[];
    committees: Committee[];
    onUpdateGroup: (group: EvangelismUnit | Committee) => void;
    isAdmin: boolean;
}

const MATURITY_STATUS: Record<string, { label: string, color: string, bg: string }> = {
    'NOUVEAU': { label: 'Initial / Nouveau', color: 'text-indigo-700', bg: 'bg-indigo-50' },
    'STABLE': { label: 'Stable / Assidu', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    'EN_CROISSANCE': { label: 'En Croissance', color: 'text-blue-700', bg: 'bg-blue-50' },
    'MATURE': { label: 'Spirituellement Mature', color: 'text-amber-700', bg: 'bg-amber-50' },
    'PERDU': { label: 'Perdu de vue', color: 'text-red-700', bg: 'bg-red-50' },
};

const SoulFollowUp: React.FC<SoulFollowUpProps> = ({ units, committees, onUpdateGroup, isAdmin }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUnit, setFilterUnit] = useState<string>('ALL');
    const [isAddingSoul, setIsAddingSoul] = useState(false);
    const [selectedSoul, setSelectedSoul] = useState<(NewSoul & { groupId: string, isCommittee: boolean }) | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const handleExport = (format: 'PDF' | 'XLS') => {
        if (format === 'PDF') {
            window.print();
            setShowExportMenu(false);
            return;
        }

        let csvContent = "\ufeff";
        csvContent += "Nom;Telephone;Localisation;Unite;Affectation;Date Decision;Statut;Logs\n";

        allSouls.forEach(s => {
            const logs = (s.followUpLogs || []).map(l => `[${l.date} ${l.status}: ${l.observation}]`).join(' | ');
            csvContent += `${s.name};${s.phone || ''};${s.location || ''};${s.groupName};${s.isCommittee ? 'Comité' : 'Unité'};${s.decisionDate};${s.supervisionStatus};${logs}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Export_Global_Ames_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    // Form state for new soul
    const [newSoul, setNewSoul] = useState<Partial<NewSoul> & { targetGroupId: string }>({
        name: '',
        phone: '',
        location: '',
        decisionDate: new Date().toISOString().split('T')[0],
        supervisionStatus: 'NOUVEAU',
        targetGroupId: ''
    });

    const allSouls = useMemo(() => {
        const souls: (NewSoul & { groupName: string, groupId: string, isCommittee: boolean })[] = [];

        units.forEach(u => {
            (u.newSouls || []).forEach(s => {
                souls.push({ ...s, groupName: u.name, groupId: u.id, isCommittee: false });
            });
        });

        committees.forEach(c => {
            (c.newSouls || []).forEach(s => {
                souls.push({ ...s, groupName: c.name, groupId: c.id, isCommittee: true });
            });
        });

        return souls.sort((a, b) => new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime());
    }, [units, committees]);

    const filteredSouls = useMemo(() => {
        return allSouls.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.phone.includes(searchQuery);
            const matchesUnit = filterUnit === 'ALL' || s.groupId === filterUnit;
            return matchesSearch && matchesUnit;
        });
    }, [allSouls, searchQuery, filterUnit]);

    const handleAddSoul = () => {
        if (!newSoul.name || !newSoul.targetGroupId) {
            alert("Veuillez remplir au moins le nom et sélectionner une unité.");
            return;
        }

        const soulToAdd: NewSoul = {
            id: generateId(),
            name: newSoul.name!,
            phone: newSoul.phone || '',
            location: newSoul.location || '',
            decisionDate: newSoul.decisionDate || new Date().toISOString().split('T')[0],
            supervisionStatus: newSoul.supervisionStatus || 'NOUVEAU',
            followUpLogs: []
        };

        const unit = units.find(u => u.id === newSoul.targetGroupId);
        if (unit) {
            onUpdateGroup({ ...unit, newSouls: [...(unit.newSouls || []), soulToAdd] });
        } else {
            const committee = committees.find(c => c.id === newSoul.targetGroupId);
            if (committee) {
                onUpdateGroup({ ...committee, newSouls: [...(committee.newSouls || []), soulToAdd] });
            }
        }

        setIsAddingSoul(false);
        setNewSoul({ name: '', phone: '', location: '', decisionDate: new Date().toISOString().split('T')[0], supervisionStatus: 'NOUVEAU', targetGroupId: '' });
    };

    const handleAddLog = (soul: any) => {
        const note = prompt("Note de suivi spirituel :");
        if (!note) return;

        const newLog: FollowUpLog = {
            id: generateId(),
            date: new Date().toISOString().split('T')[0],
            status: soul.supervisionStatus as any,
            observation: note
        };

        if (soul.isCommittee) {
            const group = committees.find(c => c.id === soul.groupId);
            if (group) {
                const updatedSouls = (group.newSouls || []).map(s =>
                    s.id === soul.id ? { ...s, followUpLogs: [...(s.followUpLogs || []), newLog] } : s
                );
                onUpdateGroup({ ...group, newSouls: updatedSouls });
            }
        } else {
            const group = units.find(u => u.id === soul.groupId);
            if (group) {
                const updatedSouls = (group.newSouls || []).map(s =>
                    s.id === soul.id ? { ...s, followUpLogs: [...(s.followUpLogs || []), newLog] } : s
                );
                onUpdateGroup({ ...group, newSouls: updatedSouls });
            }
        }
    };

    const handleDeleteSoul = (soul: any) => {
        if (!window.confirm(`Supprimer le suivi de ${soul.name} ?`)) return;

        if (soul.isCommittee) {
            const group = committees.find(c => c.id === soul.groupId);
            if (group) {
                onUpdateGroup({ ...group, newSouls: (group.newSouls || []).filter(s => s.id !== soul.id) });
            }
        } else {
            const group = units.find(u => u.id === soul.groupId);
            if (group) {
                onUpdateGroup({ ...group, newSouls: (group.newSouls || []).filter(s => s.id !== soul.id) });
            }
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto px-4">

            {/* BIG HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12"><HeartPulse size={200} /></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-pink-500/30">
                        <HeartPulse size={32} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Suivi des Âmes</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
                            <TrendingUp size={12} className="text-emerald-500" /> Gestion centralisée de l'encadrement spirituel
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Download size={20} className="text-pink-600" /> EXPORTER TOUT
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button onClick={() => handleExport('XLS')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-pink-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors">
                                    <Landmark size={16} className="text-emerald-500" /> Excel (CSV)
                                </button>
                                <button onClick={() => handleExport('PDF')} className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-pink-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors border-t border-slate-50">
                                    <Printer size={16} className="text-red-500" /> Format PDF
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsAddingSoul(true)}
                        className="flex items-center gap-3 px-10 py-5 bg-[#d90368] hover:bg-[#b00254] text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-pink-500/40 transition-all active:scale-95 group"
                    >
                        <UserPlus size={20} className="group-hover:scale-125 transition-transform" /> NOUVELLE ÂME
                    </button>
                </div>
            </div>

            {/* FILTERS AND STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pink-500 transition-colors" size={20} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher une âme par nom ou téléphone..."
                            className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-sm font-bold shadow-sm focus:border-pink-500 focus:ring-8 focus:ring-pink-500/5 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="relative group">
                        <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pink-500 transition-colors" size={18} />
                        <select
                            value={filterUnit}
                            onChange={(e) => setFilterUnit(e.target.value)}
                            className="pl-14 pr-10 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-sm focus:border-pink-500 outline-none cursor-pointer appearance-none min-w-[200px]"
                        >
                            <option value="ALL">Toutes les Unités</option>
                            <optgroup label="Unités d'Évangélisation">
                                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </optgroup>
                            <optgroup label="Comités">
                                {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div className="bg-[#0f172a] p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Âmes</span>
                        <span className="text-3xl font-black text-white">{filteredSouls.length}</span>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-pink-500">
                        <Heart size={24} fill="currentColor" />
                    </div>
                </div>
            </div>

            {/* SOULS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredSouls.map(soul => (
                    <div key={soul.id} className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6 hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                        {/* Status Stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${MATURITY_STATUS[soul.supervisionStatus || 'NOUVEAU'].bg.replace('bg-', 'bg-')}`}></div>

                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-50 border-4 border-white shadow-inner rounded-3xl flex items-center justify-center text-pink-600 font-black text-2xl uppercase">
                                    {(soul.name || 'U').charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight leading-tight">{soul.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border ${MATURITY_STATUS[soul.supervisionStatus || 'NOUVEAU'].color} ${MATURITY_STATUS[soul.supervisionStatus || 'NOUVEAU'].bg}`}>
                                            {MATURITY_STATUS[soul.supervisionStatus || 'NOUVEAU'].label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDeleteSoul(soul)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl hover:bg-pink-50/50 transition-colors">
                                <Phone size={16} className="text-pink-500" />
                                <span>{soul.phone || "—"}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl hover:bg-pink-50/50 transition-colors">
                                <MapPin size={16} className="text-pink-500" />
                                <span className="truncate">{soul.location || "Lieu non défini"}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-2xl text-white">
                                <LayoutGrid size={16} className="text-indigo-400" />
                                <span className="text-[10px] uppercase tracking-widest">{soul.groupName}</span>
                            </div>
                        </div>

                        {/* FOLLOW UP LOGS */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock size={12} /> Journal Spirituel
                                </div>
                                <button
                                    onClick={() => handleAddLog(soul)}
                                    className="p-2 bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white rounded-lg transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-40 overflow-y-auto no-scrollbar">
                                {(soul.followUpLogs || []).length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-50 rounded-2xl text-[10px] font-bold text-slate-300 uppercase bg-slate-50/50">
                                        Aucun journal pour le moment
                                    </div>
                                ) : (
                                    soul.followUpLogs?.map(log => (
                                        <div key={log.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 group/log">
                                            <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                                                <span className="text-[9px] font-black text-indigo-500">{log.date}</span>
                                                <span className="text-[8px] font-black uppercase text-slate-400">{log.status}</span>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-slate-600 font-medium italic">"{log.observation}"</p>
                                        </div>
                                    )).reverse()
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400">
                                <Calendar size={14} /> DÉCISION : {soul.decisionDate}
                            </div>
                            <ChevronRight size={18} className="text-slate-200" />
                        </div>
                    </div>
                ))}
            </div>

            {/* EMPTY STATE */}
            {filteredSouls.length === 0 && (
                <div className="py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6">
                        <HeartPulse size={48} />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Aucune âme trouvée</h3>
                    <p className="text-slate-300 text-sm mt-2 max-w-xs px-6">Modifiez vos filtres ou commencez par ajouter un nouveau suivi pour votre mission.</p>
                </div>
            )}

            {/* MODAL NOUVELLE ÂME */}
            {isAddingSoul && (
                <div className="fixed inset-0 z-[100] bg-[#0f172a]/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#d90368] p-10 text-white relative">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black uppercase tracking-tighter">Nouveau Suivi Spirituel</h3>
                                <p className="text-pink-100/70 font-bold uppercase tracking-widest text-[10px] mt-2">Enregistrement d'une nouvelle décision pour la mission</p>
                            </div>
                            <button onClick={() => setIsAddingSoul(false)} className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nom Complet</label>
                                    <input
                                        autoFocus
                                        value={newSoul.name}
                                        onChange={e => setNewSoul({ ...newSoul, name: e.target.value })}
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-pink-500 outline-none transition-all placeholder:text-slate-200 uppercase"
                                        placeholder="EX: JEAN DUPOND"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Téléphone</label>
                                    <input
                                        value={newSoul.phone}
                                        onChange={e => setNewSoul({ ...newSoul, phone: e.target.value })}
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-pink-500 outline-none transition-all placeholder:text-slate-200"
                                        placeholder="01 02 03 04 05"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Localisation</label>
                                    <input
                                        value={newSoul.location}
                                        onChange={e => setNewSoul({ ...newSoul, location: e.target.value })}
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-pink-500 outline-none transition-all placeholder:text-slate-200"
                                        placeholder="EX: COCODY, RUE L123"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date de Décision</label>
                                    <input
                                        type="date"
                                        value={newSoul.decisionDate}
                                        onChange={e => setNewSoul({ ...newSoul, decisionDate: e.target.value })}
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-pink-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#d90368] uppercase tracking-[0.2em]">Affectation (Unité ou Comité)</label>
                                <select
                                    value={newSoul.targetGroupId}
                                    onChange={e => setNewSoul({ ...newSoul, targetGroupId: e.target.value })}
                                    className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest outline-none cursor-pointer hover:bg-slate-800 transition-all shadow-xl"
                                >
                                    <option value="">-- CHOISIR UNE UNITÉ --</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <button
                                onClick={handleAddSoul}
                                className="w-full py-6 bg-[#d90368] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-95 transition-all text-sm mt-4"
                            >
                                CONFIRMER L'ENREGISTREMENT
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SoulFollowUp;
