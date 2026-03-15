import * as XLSX from 'xlsx';
import { Document, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, AlignmentType, Packer, VerticalAlign, PageOrientation, TableBorders } from 'docx';
import PptxGenJS from 'pptxgenjs';

// ========================
// HELPERS
// ========================
const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const stripHtml = (html: string) => {
    if (!html) return '';
    let result = html
        .replace(/<li>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<div>/gi, '')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '');

    // Decode basic HTML entities
    const entities: Record<string, string> = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&rsquo;': "'",
        '&lsquo;': "'",
        '&ndash;': '-',
        '&mdash;': '--'
    };

    Object.keys(entities).forEach(key => {
        result = result.replace(new RegExp(key, 'g'), entities[key]);
    });

    return result.trim();
};

// ========================
// XLSX EXPORT
// ========================
export const exportToXLSX = (data: Record<string, string>[], headers: string[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(
        data.map(row => {
            const cleanRow: Record<string, string> = {};
            headers.forEach(h => { cleanRow[h] = stripHtml(row[h] || ''); });
            return cleanRow;
        }),
        { header: headers }
    );

    // Style header row (column widths)
    const colWidths = headers.map(h => ({ wch: Math.max(h.length, 15) }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Données');
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportActivityGridToXLSX = (rows: string[][], filename: string) => {
    const data = [
        ['DATES', 'ACTIVITES', 'RESULTATS ATTENDUS', 'INDICATEURS', 'RESULTATS OBTENUS', 'PRODUIT', 'RESSOURCES', '', 'OBSERVATIONS'],
        ['', '', '(Objectif visé)', "(Fait observable qui prouve que l'activité est faite)", '(Ce qui a été réellement fait)', "(Nombre de personnes gagnées ou ayant entendu l'évangile)", "(Nombre de participants à l'activité)", '(Coût réel)', ''],
        ...rows.map(row => row.map(cell => stripHtml(cell)))
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Merge cells
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // DATES
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // ACTIVITES
        { s: { r: 0, c: 2 }, e: { r: 0, c: 2 } }, // Sub label row 2 handles the labels
        { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } }, // RESSOURCES
        { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } }, // OBSERVATIONS
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grille d\'Activité');
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportMissionReportsToXLSX = (rows: string[][], filename: string) => {
    const data = [
        ['DATE', 'UNITES', 'CHAMPS DE MISSION', 'ACTIVITES', '', 'RESULTATS ATTENDUS', '', 'RESULTATS OBTENUS', '', 'TX DECISION (%)', 'PRESENTS', 'TX PART. (%)', 'OBSERVATIONS & ECART'],
        ['', '', '', 'PROJETÉES', 'REALISÉES', 'AUDIENCE', 'DECISIONS', 'AUDIENCE', 'DECISIONS', '', '', '', ''],
        ...rows.map(row => row.map(cell => stripHtml(cell)))
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Merge cells
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // DATE
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // UNITES
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // CHAMPS DE MISSION
        { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } }, // ACTIVITES
        { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } }, // RESULTATS ATTENDUS
        { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } }, // RESULTATS OBTENUS
        { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } }, // TX DECISION
        { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // PRESENTS
        { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } }, // TX PART
        { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } }, // OBSERVATIONS
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapports Mission');
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

// ========================
// DOCX EXPORT
// ========================
export const exportToDOCX = async (
    title: string,
    headers: string[],
    rows: string[][],
    filename: string,
    summary?: { label: string, value: string }
) => {
    const tableRows = [
        new TableRow({
            children: headers.map(h => new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })],
                    alignment: AlignmentType.CENTER,
                })],
                shading: { fill: '1E5AA8' },
                width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
            })),
        }),
        ...rows.map((row, idx) => new TableRow({
            children: row.map((cell, i) => new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: stripHtml(cell || ''), size: 16 })],
                    alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                })],
                shading: { fill: idx % 2 === 0 ? 'F1F5F9' : 'FFFFFF' },
                width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
            })),
        })),
    ];

    const children: any[] = [
        new Paragraph({
            text: 'DEVAC CONNECT',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }), // spacing
    ];

    if (summary) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `${summary.label} : `, bold: true, size: 24 }),
                    new TextRun({ text: summary.value, bold: true, color: '1E5AA8', size: 24 }),
                ],
                alignment: AlignmentType.RIGHT,
            }),
            new Paragraph({ text: '' })
        );
    }

    children.push(
        new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        })
    );

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: headers.length > 7 ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
                    }
                }
            },
            children
        }],
    });

    const buffer = await Packer.toBlob(doc);
    downloadBlob(buffer, `${filename}.docx`);
};

export const exportActivityGridToDOCX = async (
    title: string,
    rows: string[][],
    filename: string,
    leaderName?: string,
    assistantName?: string
) => {
    const headerRedText = (main: string, sub: string) => [
        new TextRun({ text: main, bold: true, color: '000000', size: 18 }),
        new TextRun({ text: '\n' }),
        new TextRun({ text: sub, bold: true, color: 'FF0000', size: 14, italics: true })
    ];

    const tableRows = [
        // Row 1: Main Headers
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'DATES', bold: true, color: '000000', size: 18 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ACTIVITES', bold: true, color: '000000', size: 18 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
                new TableCell({ children: [new Paragraph({ children: headerRedText('RESULTATS ATTENDUS', '(Objectif visé)'), alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
                new TableCell({ children: [new Paragraph({ children: headerRedText('INDICATEURS', "(Fait observable qui prouve que l'activité est faite)"), alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
                new TableCell({ children: [new Paragraph({ children: headerRedText('RESULTATS OBTENUS', '(Ce qui a été réellement fait)'), alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
                new TableCell({ children: [new Paragraph({ children: headerRedText('PRODUIT', '(Nombre de personnes gagnées ou ayant entendu l\'évangile)'), alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'RESSOURCES', bold: true, color: '000000', size: 18 })], alignment: AlignmentType.CENTER })], columnSpan: 2 }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'OBSERVATIONS', bold: true, color: '000000', size: 18 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
            ]
        }),
        // Row 2: Sub Headers
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: headerRedText('HUMAINES', '(Nombre de participants à l\'activité)'), alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ children: headerRedText('FINANCIERES', '(Coût réel)'), alignment: AlignmentType.CENTER })] }),
            ]
        }),
        // Data Rows
        ...rows.map((row, idx) => new TableRow({
            children: row.map((cell, i) => {
                const cleanText = stripHtml(cell || '');
                const lines = cleanText.split('\n').filter(l => l.trim() !== '');
                return new TableCell({
                    children: lines.map(line => new Paragraph({
                        children: [new TextRun({ text: line, size: 16 })],
                        alignment: i < 2 ? AlignmentType.LEFT : AlignmentType.CENTER,
                        spacing: { before: 80, after: 80 }
                    })),
                    shading: { fill: idx % 2 === 0 ? 'F9FAFB' : 'FFFFFF' },
                    verticalAlign: VerticalAlign.CENTER
                });
            }),
        })),
    ];

    const doc = new Document({
        sections: [{
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'GRILLE DE RAPPORT D’ACTIVITE',
                            bold: true,
                            color: '1E4DA1',
                            size: 40
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'UNITÉ : ', bold: true, size: 20 }),
                        new TextRun({ text: title.toUpperCase(), bold: true, color: '1E4DA1', size: 20 }),
                        new TextRun({ text: '    |    ', size: 20 }),
                        new TextRun({ text: 'ACTIVITÉ N° : ', bold: true, size: 20 }),
                        new TextRun({ text: (rows.length).toString(), bold: true, color: '1E4DA1', size: 20 }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE }
                }),
                new Paragraph({ text: '', spacing: { before: 400 } }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Fait à Abidjan, le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                            italics: true,
                            size: 20
                        })
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 300 }
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: TableBorders.NONE,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: "Le Responsable Principal", bold: true, size: 18 })],
                                            alignment: AlignmentType.CENTER,
                                            spacing: { after: 800 }
                                        }),
                                        new Paragraph({
                                            children: [new TextRun({ text: leaderName?.toUpperCase() || "NOM DU RESPONSABLE", bold: true, color: '1E4DA1', size: 18 })],
                                            alignment: AlignmentType.CENTER
                                        })
                                    ]
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: "L'Adjoint", bold: true, size: 18 })],
                                            alignment: AlignmentType.CENTER,
                                            spacing: { after: 800 }
                                        }),
                                        new Paragraph({
                                            children: [new TextRun({ text: assistantName?.toUpperCase() || "NOM DE L'ADJOINT", bold: true, color: '1E4DA1', size: 18 })],
                                            alignment: AlignmentType.CENTER
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        }],
    });

    const buffer = await Packer.toBlob(doc);
    downloadBlob(buffer, `${filename}.docx`);
};

export const exportMissionReportsToDOCX = async (
    title: string,
    rows: string[][],
    filename: string
) => {
    const headerRow1 = new TableRow({
        children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'DATE', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'UNITES', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CHAMPS DE MISSION', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ACTIVITES', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, columnSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'RESULTATS ATTENDUS', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, columnSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'RESULTATS OBTENUS', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, columnSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TX DECISION (%)', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'PRESENTS', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TX PART. (%)', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'OBSERVATIONS', bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' }, verticalAlign: VerticalAlign.CENTER, rowSpan: 2 }),
        ]
    });

    const headerRow2 = new TableRow({
        children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'PROJETÉES', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'REALISÉES', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'AUDIENCE', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'DECISIONS', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'AUDIENCE', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'DECISIONS', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.CENTER })], shading: { fill: '1E5AA8' } }),
        ]
    });

    const dataRows = rows.map((row, idx) => new TableRow({
        children: row.map((cell, i) => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: stripHtml(cell || ''), size: 16 })],
                alignment: i < 3 ? AlignmentType.LEFT : AlignmentType.CENTER,
            })],
            shading: { fill: idx % 2 === 0 ? 'F1F5F9' : 'FFFFFF' },
        })),
    }));

    const doc = new Document({
        sections: [{
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
            children: [
                new Paragraph({ text: 'DEVAC CONNECT', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: '' }),
                new Table({
                    rows: [headerRow1, headerRow2, ...dataRows],
                    width: { size: 100, type: WidthType.PERCENTAGE }
                })
            ]
        }],
    });

    const buffer = await Packer.toBlob(doc);
    downloadBlob(buffer, `${filename}.docx`);
};

// ========================
// PPTX EXPORT
// ========================
export const exportToPPTX = (
    title: string,
    subtitle: string,
    headers: string[],
    rows: string[][],
    filename: string,
    summary?: { label: string, value: string }
) => {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'DEVAC CONNECT';
    pptx.subject = title;

    // Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: '1E293B' };
    titleSlide.addText('DEVAC CONNECT', {
        x: 0.5, y: 1.5, w: '90%', h: 1.5,
        fontSize: 48, bold: true, color: 'FFFFFF',
        align: 'center',
    });
    titleSlide.addText(title, {
        x: 0.5, y: 3.5, w: '90%', h: 1,
        fontSize: 28, color: '818CF8',
        align: 'center',
    });
    titleSlide.addText(subtitle, {
        x: 0.5, y: 4.8, w: '90%', h: 0.6,
        fontSize: 16, color: '94A3B8',
        align: 'center',
    });

    if (summary) {
        titleSlide.addText(`${summary.label}: ${summary.value}`, {
            x: 0.5, y: 6, w: '90%', h: 1,
            fontSize: 24, bold: true, color: 'FFFFFF',
            fill: { color: '1E5AA8' },
            align: 'center',
        });
    }

    // Data Slides (max 15 rows per slide)
    const ROWS_PER_SLIDE = 15;
    const chunks = [];
    for (let i = 0; i < rows.length; i += ROWS_PER_SLIDE) {
        chunks.push(rows.slice(i, i + ROWS_PER_SLIDE));
    }

    if (chunks.length === 0) chunks.push([]);

    chunks.forEach((chunk, pageIdx) => {
        const slide = pptx.addSlide();
        slide.background = { color: 'F8FAFC' };
        slide.addText(title, {
            x: 0.3, y: 0.1, w: '60%', h: 0.6,
            fontSize: 18, bold: true, color: '1E293B',
        });

        if (summary) {
            slide.addText(`${summary.label}: ${summary.value}`, {
                x: 6.5, y: 0.1, w: 3, h: 0.5,
                fontSize: 12, bold: true, color: 'FFFFFF',
                fill: { color: '1E293B' },
                align: 'center', valign: 'middle',
            });
        }

        slide.addText(`Page ${pageIdx + 1} / ${Math.max(chunks.length, 1)}`, {
            x: 9.6, y: 0.1, w: 3, h: 0.4,
            fontSize: 10, color: '94A3B8',
        });

        const colW = 12.8 / Math.max(headers.length, 1);
        const startY = 0.8;
        const rowH = (6.4 - startY) / (ROWS_PER_SLIDE + 1);

        // Header
        headers.forEach((h, i) => {
            slide.addText(h, {
                x: 0.3 + i * colW, y: startY, w: colW, h: rowH * 0.9,
                fontSize: 8, bold: true, color: 'FFFFFF',
                fill: { color: '1E5AA8' },
                align: 'center', valign: 'middle',
            });
        });

        const cleanRows = rows.map(row => row.map(cell => stripHtml(cell)));

        // Data rows
        chunk.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                const isTotal = row[0] === 'TOTAL';
                slide.addText(stripHtml(cell || ''), {
                    x: 0.3 + cIdx * colW, y: startY + (rIdx + 1) * rowH, w: colW, h: rowH * 0.9,
                    fontSize: isTotal ? 9 : 7.5,
                    color: isTotal ? 'FFFFFF' : '1E293B',
                    bold: isTotal,
                    fill: { color: isTotal ? '1E293B' : (rIdx % 2 === 0 ? 'F1F5F9' : 'FFFFFF') },
                    align: 'center', valign: 'middle',
                });
            });
        });
    });

    pptx.writeFile({ fileName: `${filename}.pptx` });
};

export const exportBilanToDOCX = async (
    unitName: string,
    year: string,
    bilanData: any, // AnnualReportData from types
    stats: any,     // Calculated stats from UnitDetails
    leaderName?: string
) => {
    // Helper for section titles
    const createSectionTitle = (text: string) => new Paragraph({
        children: [new TextRun({ text, bold: true, size: 24, font: "Arial" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
    });

    // Helper for standard text
    const createParagraph = (text: string) => new Paragraph({
        children: [new TextRun({ text: text || "N/A", size: 22, font: "Arial" })],
        spacing: { after: 200 },
        alignment: AlignmentType.JUSTIFIED
    });

    const cleanUnitName = unitName.toUpperCase().replace(/^UNIT[EÉ][\s:]*/i, '').trim();
    const displayUnitName = `UNITE : ${cleanUnitName}`;
    const isElie = cleanUnitName.includes('ELIE');

    const bData = { ...(bilanData || {}) };
    if (isElie) {
        if (!bData.missionField) bData.missionField = 'SOGEFIA, PETIT ET GRAND OURS, CHÂTEAU, CIE';
        if (!bData.generalObjective) bData.generalObjective = '1000 âmes et envoyer 50 personnes au Seigneur';
        if (!bData.period) bData.period = 'DU 07 MARS AU 10 OCTOBRE 2026';
    }
    const finalLeaderName = isElie && !leaderName ? 'Mme EDI & BONGO Raymond' : leaderName;

    const doc = new Document({
        sections: [
            // COVER PAGE
            {
                properties: {
                    page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
                },
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "DEPARTEMENT D'EVANGELISATION DES ASSEMBLEES DE DIEU COCODY", bold: true, size: 20, font: "Arial", color: "1E5AA8" })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 800 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `DEVAC : UNITE D'EVANGELISATION`, bold: true, size: 36, font: "Arial", color: "FFFFFF", highlight: "blue" })], // Simulation of the blue banner
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 2000, after: 3000 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `BILAN ANNUEL ${year}`, bold: true, size: 48, font: "Arial" })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: displayUnitName, bold: true, size: 36, font: "Arial", color: "1E5AA8" })],
                        alignment: AlignmentType.CENTER,
                    })
                ]
            },
            // REPORT CONTENT
            {
                properties: {
                    page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
                },
                children: [
                    createSectionTitle("1. Introduction"),
                    createParagraph(bData.introduction),

                    createSectionTitle("2. Objectifs"),
                    new Paragraph({ children: [new TextRun({ text: "Objectif général :", bold: true, underline: {}, font: "Arial", size: 22 })], spacing: { after: 100 } }),
                    createParagraph(bData.generalObjective),

                    new Paragraph({ children: [new TextRun({ text: "Champ missionnaire à évangéliser :", bold: true, underline: {}, font: "Arial", size: 22 })], spacing: { after: 100 } }),
                    createParagraph(bData.missionField),

                    new Paragraph({ children: [new TextRun({ text: "Période d'activités :", bold: true, underline: {}, font: "Arial", size: 22 })], spacing: { after: 100 } }),
                    createParagraph(bData.period),

                    new Paragraph({ children: [new TextRun({ text: "Objectifs spécifiques :", bold: true, underline: {}, font: "Arial", size: 22 })], spacing: { after: 100 } }),
                    createParagraph(`Population à atteindre : ${bData.specificObjectivePopulation}`),
                    createParagraph(`Budget prévu : ${bData.specificObjectiveBudget} FCFA`),

                    createSectionTitle("3. Bilan Moral et Spirituel"),
                    createParagraph(bData.moralSpiritualBilan),

                    createSectionTitle("4. Bilan des Activités"),
                    createParagraph(`Nombre total d'activités projetées/réalisées : ${stats.totalActivities || '0'}`),
                    createParagraph(`Audience totale touchée : ${stats.totalObtainedAudience || '0'} personnes`),
                    createParagraph(`Nombre total de décisions (âmes gagnées) : ${stats.totalDecisions || '0'}`),
                    // In a full version, we'd insert the activity grid table here

                    createSectionTitle("5. Bilan Financier"),
                    createParagraph(`Budget prévu : ${stats.totalBudget || '0'} FCFA`),
                    createParagraph(`Total des Entrées : ${stats.totalIncomes || '0'} FCFA`),
                    createParagraph(`Total des Dépenses : ${stats.totalExpenses || '0'} FCFA`),
                    createParagraph(`Solde Disponible : ${stats.totalEncaisse || '0'} FCFA`),

                    createSectionTitle("6. Analyse Interne"),
                    new Paragraph({ children: [new TextRun({ text: "Points Forts :", bold: true, font: "Arial", size: 22 })], spacing: { after: 100 } }),
                    createParagraph(bData.internalAnalysisStrengths),
                    new Paragraph({ children: [new TextRun({ text: "Points Faibles :", bold: true, font: "Arial", size: 22 })], spacing: { after: 100 } }),
                    createParagraph(bData.internalAnalysisWeaknesses),
                    new Paragraph({ children: [new TextRun({ text: "Propositions / Recommandations :", bold: true, font: "Arial", size: 22 })], spacing: { after: 100 } }),
                    createParagraph(bData.recommendations),

                    createSectionTitle("7. Perspectives"),
                    createParagraph(bData.perspectives),

                    createSectionTitle("8. Conclusion"),
                    createParagraph(bData.conclusion),

                    new Paragraph({
                        children: [new TextRun({ text: "Fait à Abidjan, le " + new Date().toLocaleDateString('fr-FR'), font: "Arial", size: 22 })],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 800, after: 200 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: finalLeaderName ? `Responsable : ${finalLeaderName}` : "La Responsable / L'Équipe", bold: true, font: "Arial", size: 22 })],
                        alignment: AlignmentType.RIGHT,
                    })
                ]
            }
        ]
    });

    const buffer = await Packer.toBlob(doc);
    downloadBlob(buffer, `Bilan_Annuel_${year}_${unitName.replace(/\s+/g, '_')}.docx`);
};

// ========================
// UNIFIED EXPORT HELPERS
// ========================
export const exportData = async (
    format: 'XLSX' | 'DOCX' | 'PPTX' | 'PDF' | 'XLS',
    headers: string[],
    rows: string[][],
    filename: string,
    title: string = 'Rapport DEVAC',
    summary?: { label: string, value: string },
    bilanContext?: { unitName: string, year: string, bilanData: any, stats: any, leaderName?: string },
    gridContext?: { leaderName: string, assistantName: string }
) => {
    const dataObjects = rows.map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
    });

    if (format === 'XLSX' || format === 'XLS') {
        if (title.includes('ACTIVITY_GRID')) exportActivityGridToXLSX(rows, filename);
        else if (title.includes('REPORTS')) exportMissionReportsToXLSX(rows, filename);
        else exportToXLSX(dataObjects, headers, filename);
    } else if (format === 'DOCX') {
        if (bilanContext) {
            await exportBilanToDOCX(bilanContext.unitName, bilanContext.year, bilanContext.bilanData, bilanContext.stats, bilanContext.leaderName);
            return;
        }
        if (title.includes('ACTIVITY_GRID')) await exportActivityGridToDOCX(title, rows, filename, gridContext?.leaderName, gridContext?.assistantName);
        else if (title.includes('REPORTS')) await exportMissionReportsToDOCX(title, rows, filename);
        else await exportToDOCX(title, headers, rows, filename, summary);
    } else if (format === 'PPTX') {
        exportToPPTX(title, `Généré le ${new Date().toLocaleDateString('fr-FR')}`, headers, rows, filename, summary);
    } else if (format === 'PDF') {
        window.print();
    }
};

