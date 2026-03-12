import React, { useRef, useState } from 'react';
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { UnitMember } from '../types';
import { updateUnitInDB } from '../services/firebaseService';

interface MemberImportButtonProps {
    unitId: string;
    currentMembers: UnitMember[];
    onImportComplete: () => void;
}

export const MemberImportButton: React.FC<MemberImportButtonProps> = ({
    unitId,
    currentMembers,
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
        if (h.includes('nom') || h.includes('name') || h.includes('surname')) return 'name';
        if (h.includes('prénom') || h.includes('first')) return 'firstName';
        if (h.includes('tel') || h.includes('contact') || h.includes('phone') || h.includes('téléphone')) return 'phone';
        if (h.includes('quartier') || h.includes('lieu') || h.includes('location') || h.includes('habitation')) return 'location';
        if (h.includes('profession') || h.includes('job') || h.includes('métier') || h.includes('travail')) return 'profession';
        return h;
    };

    const parseWordFile = async (file: File): Promise<any[]> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        // Simple parsing for Word: treat lines as potential members
        // If it's a table, mammoth extracts it as text with tabs/spaces
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const members: any[] = [];

        for (const line of lines) {
            const parts = line.split(/[\t,|;]+/).map(p => p.trim());
            if (parts.length >= 2) {
                members.push({
                    name: parts[0],
                    phone: parts[1] || '',
                    location: parts[2] || '',
                    profession: parts[3] || ''
                });
            }
        }
        return members;
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
                // Excel or CSV
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (json.length > 0) {
                    const headers = json[0].map(h => normalizeHeader(String(h)));
                    const rows = json.slice(1);

                    importedData = rows.map(row => {
                        const member: any = {};
                        headers.forEach((header, index) => {
                            if (header === 'name' || header === 'firstName' || header === 'phone' || header === 'location' || header === 'profession') {
                                member[header] = row[index];
                            }
                        });
                        return member;
                    });
                }
            }

            // Filter and format members
            const validMembers: UnitMember[] = importedData
                .filter(m => m && (m.name || m.firstName))
                .map(m => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: `${m.firstName || ''} ${m.name || ''}`.trim(),
                    phone: String(m.phone || ''),
                    location: m.location || '',
                    profession: m.profession || ''
                }));

            if (validMembers.length === 0) {
                throw new Error("Aucun membre valide n'a été détecté dans le fichier.");
            }

            // Merge with current members (avoid duplicates based on phone if present)
            const existingPhones = new Set(currentMembers.map(m => m.phone).filter(p => p && p.length > 0));
            const newMembers = validMembers.filter(m => !m.phone || !existingPhones.has(m.phone));

            // Update unit in Firebase
            // Note: We need to get the full unit object first or use a service that handles partial update
            // For simplicity here, we rely on the component being passed the current member list
            // In a real production app, we'd use a server-side or batch transaction
            const updatedMembersList = [...currentMembers, ...newMembers];

            // We need a way to get the full unit object to update it. 
            // This is a limitation of the current prop-based approach.
            // Let's assume we can fetch it or that onImportComplete will handle the refresh.

            // For now, let's trigger a custom event or use a broader service.
            // Actually, firebaseService already has updateUnitInDB.

            // Let's get the unit document first
            const { db } = await import('../services/firebaseService');
            const { doc, getDoc } = await import('firebase/firestore');
            const unitRef = doc(db, 'units', unitId);
            const unitSnap = await getDoc(unitRef);

            if (unitSnap.exists()) {
                const unitData = unitSnap.data();
                await updateUnitInDB({
                    ...unitData,
                    id: unitId,
                    members: updatedMembersList
                } as any);

                setImportStatus({ success: newMembers.length });
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
                <span>Importer (Excel/CSV/Word)</span>
            </button>

            {importStatus && (
                <div className={`mt-2 flex items-center gap-2 text-sm p-2 rounded ${importStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {importStatus.success ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{importStatus.success} membres importés !</span>
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
