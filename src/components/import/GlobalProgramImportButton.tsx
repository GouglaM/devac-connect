import React, { useRef, useState } from 'react';
import { FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProgrammeItem, EvangelismUnit, Committee } from '../../types';
import { updateUnitInDB, updateCommitteeInDB } from '../../services/firebaseService';

interface GlobalProgramImportButtonProps {
    units: EvangelismUnit[];
    committees: Committee[];
    onImportComplete: () => void;
}

export const GlobalProgramImportButton: React.FC<GlobalProgramImportButtonProps> = ({
    units,
    committees,
    onImportComplete
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<{
        success?: number;
        error?: string;
    } | null>(null);

    const normalizeHeader = (header: string) => {
        const h = header.toLowerCase().trim();
        if (h.includes('date')) return 'date';
        if (h.includes('activit')) return 'activity';
        if (h.includes('lieu')) return 'location';
        if (h.includes('preparation') || h.includes('mobilisation')) return 'resources';
        if (h.includes('unite') || h.includes('unité') || h === 'unites' || h === 'unite') return 'unitName';
        if (h.includes('budget')) return 'budget';
        return h;
    };

    const normalizeString = (str: string) => {
        return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportStatus(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (json.length === 0) throw new Error("Le fichier est vide.");

            const headers = (json[0] || []).map(h => normalizeHeader(String(h || '')));
            const rows = json.slice(1);

            if (!units || !committees) {
                throw new Error("Les données des unités ne sont pas encore chargées.");
            }

            const unitMap: Record<string, string> = {};
            const registerInMap = (name: string, id: string) => {
                const norm = normalizeString(name);
                unitMap[norm] = id;
                const simplified = norm.replace(/^(unite|comite)\s+/i, '').trim();
                unitMap[simplified] = id;
            };

            units.forEach(u => registerInMap(u.name, u.id));
            committees.forEach(c => registerInMap(c.name, c.id));

            const activitiesByUnit: Record<string, ProgrammeItem[]> = {};
            let importCount = 0;
            let currentMonth = "";

            rows.forEach(row => {
                if (!row || row.length === 0) return;

                const activity: any = {};
                headers.forEach((header, index) => {
                    activity[header] = row[index];
                });

                // Détection de séparateur de mois
                const firstVal = String(row[0] || '').trim().toUpperCase();
                const months = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'];

                if (row.filter(v => v).length === 1 && months.some(m => firstVal.includes(m))) {
                    currentMonth = firstVal;
                    return;
                }

                if (!activity.activity || !activity.unitName) return;

                const unitSearchName = normalizeString(String(activity.unitName));
                const unitId = unitMap[unitSearchName];

                if (unitId) {
                    if (!activitiesByUnit[unitId]) activitiesByUnit[unitId] = [];

                    const budgetRaw = String(activity.budget || '0');
                    const budgetValue = budgetRaw.split(/[\n\r]+/)[0].replace(/\s/g, '').replace(/[^\d]/g, '') || '0';

                    activitiesByUnit[unitId].push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        date: activity.date ? `${activity.date} ${currentMonth}`.trim() : currentMonth,
                        activity: String(activity.activity || ''),
                        location: String(activity.location || ''),
                        budget: budgetValue,
                        resources: String(activity.resources || ''),
                        assignedTo: '',
                        assignedContact: ''
                    });
                    importCount++;
                }
            });

            if (importCount === 0) {
                throw new Error("Aucune activité n'a pu être associée à une unité. Vérifiez les noms des unités dans le fichier.");
            }

            for (const [unitId, newActivities] of Object.entries(activitiesByUnit)) {
                const isCommittee = committees.some(c => c.id === unitId);
                const targetGroup = isCommittee ? committees.find(c => c.id === unitId) : units.find(u => u.id === unitId);

                if (targetGroup) {
                    const updatedGroup = {
                        ...targetGroup,
                        programme: [...(targetGroup.programme || []), ...newActivities]
                    };
                    if (isCommittee) {
                        await updateCommitteeInDB(updatedGroup as any);
                    } else {
                        await updateUnitInDB(updatedGroup as any);
                    }
                }
            }

            setImportStatus({ success: importCount });
            if (onImportComplete) onImportComplete();

        } catch (error: any) {
            console.error("Global Import Error:", error);
            setImportStatus({ error: error.message || "Erreur lors de l'importation." });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative inline-block">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden" />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 font-bold"
            >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                <span>Importer Global</span>
            </button>

            {importStatus && (
                <div className={`mt-2 flex items-center gap-2 text-sm p-3 rounded-xl shadow-lg border absolute right-0 top-full z-[100] w-64 ${importStatus.success ? 'bg-white border-emerald-100 text-emerald-800' : 'bg-white border-red-100 text-red-800'
                    }`}>
                    {importStatus.success ? (
                        <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <div className="flex-1">
                                <p className="font-black">Succès !</p>
                                <p className="text-[10px] opacity-70">{importStatus.success} activités réparties.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <div className="flex-1 text-[10px]">
                                <p className="font-black uppercase tracking-widest text-red-600">Erreur d'import</p>
                                <p className="opacity-70 mt-1">{importStatus.error}</p>
                            </div>
                        </>
                    )}
                    <button onClick={() => setImportStatus(null)} className="text-xs hover:bg-slate-50 p-1 rounded font-bold">X</button>
                </div>
            )}
        </div>
    );
};
