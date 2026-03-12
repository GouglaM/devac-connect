import { Announcement, EvangelismUnit, Committee, AttendanceSession, ChatMessage, UnitFile } from '../types';
import { INITIAL_UNITS, INITIAL_COMMITTEES } from '../constants';

const STORAGE_KEYS = {
    ANNOUNCEMENTS: 'mc_announcements',
    UNITS: 'mc_units',
    COMMITTEES: 'mc_committees',
    ATTENDANCE: 'mc_attendance',
    CHAT: 'mc_chat',
    DOCUMENTS: 'mc_global_documents',
    INITIALIZED: 'mc_is_initialized'
};

const INITIAL_ATTENDANCE: AttendanceSession[] = [
    {
        id: "ALL-2026-01-12",
        groupId: "ALL",
        date: "2026-01-12",
        title: "RÉUNION DE PRIÈRE - Intercession & Revue des activités intérimaires",
        attendees: ["m1", "p1", "pa1", "on2", "p2", "p3", "on1", "pa5", "pa3", "p4", "p5", "pa2", "p6", "e1", "pa4", "e2", "m3", "e3", "e4", "el1", "on3", "el2"]
    },
    {
        id: "ALL-2026-01-19",
        groupId: "ALL",
        date: "2026-01-19",
        title: "ÉTUDE BIBLIQUE - Étude du personnage de Ève",
        attendees: ["m1", "p1", "pa1", "p11", "p2", "p3", "m6", "m2", "pa3", "p5", "pa2", "p6", "e1", "pa4", "e2", "p8", "e3", "el3", "e5", "p10", "p7", "on3", "el2", "p9", "p17"]
    },
    {
        id: "ALL-2026-01-25",
        groupId: "ALL",
        date: "2026-01-25",
        title: "JEÛNE ET PRIÈRE - Jeûne et Prière",
        attendees: ["m1", "p12", "p1", "p2", "p3", "p4", "p13", "pa2", "pa6", "p8", "e1", "e6", "p9", "p7", "on3", "el2"]
    },
    {
        id: "ALL-2026-01-26",
        groupId: "ALL",
        date: "2026-01-26",
        title: "ÉTUDE BIBLIQUE - Étude du personnage : La Sunamite",
        attendees: ["m1", "p12", "p1", "e2", "pa1", "m6", "p3", "p4", "p14", "e4", "p8", "p9", "p2", "e5", "p6", "p11", "pa9", "e7", "p15"]
    },
    {
        id: "ALL-2026-01-30",
        groupId: "ALL",
        date: "2026-01-30",
        title: "VISITE AUX MEMBRES (ACTION SOCIALE) - Visite de prière chez Mme SIDIO IRèNE",
        attendees: ["m1", "p12", "p1", "pa7", "pa1", "m2", "p3", "p4", "p14", "p16", "m3", "m4", "p8", "p9", "p6", "p11", "pa2", "pa8", "pa3", "m5", "p5"]
    },
    {
        id: "ALL-2026-02-02",
        groupId: "ALL",
        date: "2026-02-02",
        title: "ÉTUDE BIBLIQUE - Étude du personnage : MARIE, mère de JESUS",
        attendees: [
            "m1", "p3", "p11", "p4", "p12", "p1", "pa3", "pa5", "p9", "pa1",
            "p17", "p16", "p2", "m2", "p5", "p13", "el2", "el1", "on3", "ds1", "oe1"
        ]
    }
];

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error(`Error reading storage key ${key}:`, e);
        return defaultValue;
    }
};

const setToStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        window.dispatchEvent(new Event('storage_update'));
    } catch (e) {
        console.error(`Error writing storage key ${key}:`, e);
    }
};

export const initializeData = () => {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
        setToStorage(STORAGE_KEYS.UNITS, INITIAL_UNITS);
        setToStorage(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
        setToStorage(STORAGE_KEYS.DOCUMENTS, []);
        setToStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
        setToStorage(STORAGE_KEYS.ANNOUNCEMENTS, [
            { id: '1', title: 'Bienvenue sur DEVAC', content: 'La plateforme officielle du Département de l\'Évangélisation est désormais opérationnelle. Travaillons ensemble à la mission confiée par le Seigneur.', category: 'GENERAL', date: new Date().toISOString(), priority: 'normal' }
        ]);
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
};

export const seedDatabase = () => {
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    initializeData();
};

export const getInitialAnnouncements = () => getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
export const getInitialUnits = () => getFromStorage<EvangelismUnit[]>(STORAGE_KEYS.UNITS, INITIAL_UNITS);
export const getInitialCommittees = () => getFromStorage<Committee[]>(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
export const getInitialAttendance = () => getFromStorage<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
export const getInitialDocuments = () => getFromStorage<UnitFile[]>(STORAGE_KEYS.DOCUMENTS, []);

export const subscribeToDocuments = (callback: (data: UnitFile[]) => void) => {
    const handler = () => callback(getFromStorage(STORAGE_KEYS.DOCUMENTS, []));
    window.addEventListener('storage_update', handler);
    return () => window.removeEventListener('storage_update', handler);
};

export const subscribeToAnnouncements = (callback: (data: Announcement[]) => void) => {
    const handler = () => callback(getFromStorage(STORAGE_KEYS.ANNOUNCEMENTS, []));
    window.addEventListener('storage_update', handler);
    return () => window.removeEventListener('storage_update', handler);
};

export const subscribeToUnits = (callback: (data: EvangelismUnit[]) => void) => {
    const handler = () => callback(getFromStorage(STORAGE_KEYS.UNITS, INITIAL_UNITS));
    window.addEventListener('storage_update', handler);
    return () => window.removeEventListener('storage_update', handler);
};

export const subscribeToCommittees = (callback: (data: Committee[]) => void) => {
    const handler = () => callback(getFromStorage(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES));
    window.addEventListener('storage_update', handler);
    return () => window.removeEventListener('storage_update', handler);
};

export const subscribeToAttendance = (callback: (data: AttendanceSession[]) => void) => {
    const handler = () => callback(getFromStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE));
    window.addEventListener('storage_update', handler);
    return () => window.removeEventListener('storage_update', handler);
};

export const addAnnouncementToDB = (announcement: Announcement) => {
    const list = getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    setToStorage(STORAGE_KEYS.ANNOUNCEMENTS, [announcement, ...list]);
};

export const deleteAnnouncementFromDB = (id: string) => {
    const list = getFromStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, []);
    setToStorage(STORAGE_KEYS.ANNOUNCEMENTS, list.filter(a => a.id !== id));
};

export const saveDocumentToDB = (doc: UnitFile) => {
    const list = getFromStorage<UnitFile[]>(STORAGE_KEYS.DOCUMENTS, []);
    setToStorage(STORAGE_KEYS.DOCUMENTS, [doc, ...list]);
};

export const deleteDocumentFromDB = (id: string) => {
    const list = getFromStorage<UnitFile[]>(STORAGE_KEYS.DOCUMENTS, []);
    setToStorage(STORAGE_KEYS.DOCUMENTS, list.filter(d => d.id !== id));
};

export const saveAttendanceToDB = (session: AttendanceSession) => {
    const list = getFromStorage<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const filteredList = list.filter(s => !(s.groupId === session.groupId && s.date === session.date));
    setToStorage(STORAGE_KEYS.ATTENDANCE, [session, ...filteredList]);
};

export const updateUnitInDB = (unit: EvangelismUnit) => {
    const list = getFromStorage<EvangelismUnit[]>(STORAGE_KEYS.UNITS, INITIAL_UNITS);
    const updatedList = list.map(u => u.id === unit.id ? unit : u);
    setToStorage(STORAGE_KEYS.UNITS, updatedList);
};

export const updateCommitteeInDB = (committee: Committee) => {
    const list = getFromStorage<Committee[]>(STORAGE_KEYS.COMMITTEES, INITIAL_COMMITTEES);
    const updatedList = list.map(c => c.id === committee.id ? committee : c);
    setToStorage(STORAGE_KEYS.COMMITTEES, updatedList);
};
