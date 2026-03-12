import React, { useRef, useState } from 'react';
import { FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { ProgrammeItem } from '../types';
import { updateUnitInDB } from '../services/firebaseService';

interface ProgramImportButtonProps {
    unitId: string;
    currentProgramme: ProgrammeItem[];
    onImportComplete: () => void;
}

export const ProgramImportButton: React.FC<ProgramImportButtonProps> = ({
    unitId,
    currentProgramme,
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
        if (h.includes('date') || h.includes('jour') || h.includes('quand')) return 'date';
        if (h.includes('activit') || h.includes('programme') || h.includes('sujet') || h.includes('quoi')) return 'activity';
        if (h.includes('ressource') || h.includes('moyen') || h.includes('matériel')) return 'resources';
        if (h.includes('lieu') || h.includes('mission') || h.includes('où') || h === 'ou') return 'location';
        if (h.includes('budget') || h.includes('montant') || h.includes('coût') || h.includes('cout') || h.includes('fcfa')) return 'budget';
        if (h.includes('responsable') || h.includes('chargé') || h.includes('charge') || h.includes('qui')) return 'assignedTo';
        if (h.includes('contact') || h.includes('tél') || h.includes('tel') || h.includes('téléphone') || h.includes('telephone')) return 'assignedContact';
        return h;
    };

    const parseWordFile = async (file: File): Promise<any[]> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const activities: any[] = [];

        for (const line of lines) {
            const parts = line.split(/[\t,|;]+/).map(p => p.trim());
            if (parts.length >= 2) {
                activities.push({
                    date: parts[0],
                    activity: parts[1] || '',
                    location: parts[2] || '',
                    budget: parts[3] || '0',
                    assignedTo: parts[4] || '',
                    assignedContact: parts[5] || ''
                });
            }
        }
        return activities;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportStatus(null);

        try {
            let importedData: any[] = [];

            if (file.name.endsWith('.docx')) {
                importedData = await parseWordFile(file);
            } else {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (json.length > 0) {
                    const headers = json[0].map(h => normalizeHeader(String(h)));
                    const rows = json.slice(1);

                    importedData = rows.map(row => {
                        const activity: any = {};
                        headers.forEach((header, index) => {
                            if (['date', 'activity', 'location', 'resources', 'budget', 'assignedTo', 'assignedContact'].includes(header)) {
                                activity[header] = row[index];
                            }
                        });
                        return activity;
                    });
                }
            }

            const validActivities: ProgrammeItem[] = importedData
                .filter(a => a && a.activity)
                .map(a => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    date: String(a.date || new Date().toISOString().split('T')[0]),
                    activity: String(a.activity || ''),
                    location: String(a.location || ''),
                    budget: String(a.budget || '0').replace(/\s/g, '').replace(/[^\d]/g, ''),
                    assignedTo: String(a.assignedTo || ''),
                    assignedContact: String(a.assignedContact || ''),
                    resources: String(a.resources || '')
                }));

            if (validActivities.length === 0) {
                throw new Error("Aucune activité valide n'a été détectée dans le fichier.");
            }

            const updatedProgrammeList = [...currentProgramme, ...validActivities];

            const { db } = await import('../services/firebaseService');
            const { doc, getDoc } = await import('firebase/firestore');
            const unitRef = doc(db, 'units', unitId);
            const unitSnap = await getDoc(unitRef);

            if (unitSnap.exists()) {
                const unitData = unitSnap.data();
                const finalData = {
                    ...unitData,
                    id: unitId,
                    programme: updatedProgrammeList
                };
                await updateUnitInDB(finalData as any);

                setImportStatus({ success: validActivities.length });
                onImportComplete();
            } else {
                throw new Error("Unité introuvable dans la base de données.");
            }

        } catch (error: any) {
            console.error("Import Error:", error);
            setImportStatus({ error: error.message || "Erreur lors de l'importation." });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative inline-block">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv,.docx"
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
                {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <FileUp className="w-4 h-4" />
                )}
                <span>Importer Programme</span>
            </button>

            {importStatus && (
                <div className={`mt-2 flex items-center gap-2 text-sm p-2 rounded ${importStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {importStatus.success ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{importStatus.success} activités importées !</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-4 h-4" />
                            <span>{importStatus.error}</span>
                        </>
                    )}
                    <button
                        onClick={() => setImportStatus(null)}
                        className="ml-2 hover:underline"
                    >
                        Fermer
                    </button>
                </div>
            )}
        </div>
    );
};
