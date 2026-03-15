/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getDocs,
  limit
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { Announcement, EvangelismUnit, Committee, AttendanceSession, UnitMember, ChatMessage, UnitFile, CampaignRegistration, CampaignComiteMember, CampaignGroup, CampaignContribution, CampaignDonation, CampaignExpense } from "../types";
import { INITIAL_UNITS, INITIAL_COMMITTEES } from "../constants";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Internal error state for diagnostics
let lastFirestoreError: any = null;
export const getFirestoreError = () => lastFirestoreError;

// Nuke cache for debugging
// clearIndexedDbPersistence(db).then(() => console.log("Cache cleared")).catch(() => {});

// Tracking connection and auth status
export const subscribeToConnectionStatus = (cb: (isConnected: boolean) => void) => {
  // Immediately check current auth state
  const currentUser = auth.currentUser;
  if (currentUser) {
    cb(true);
  }

  // Listen for auth state changes
  return auth.onAuthStateChanged((user) => {
    cb(!!user);
  });
};

export const testFirestoreConnection = async () => {
  try {
    console.log("[Firestore] Testing direct connection...");
    const snap = await getDocs(query(collection(db, "units"), orderBy("name"), limit(1)));
    return { success: true, count: snap.docs.length };
  } catch (e: any) {
    console.error("[Firestore] Direct connection test failed:", e);
    lastFirestoreError = e;
    return { success: false, error: e.message || e.code || JSON.stringify(e) };
  }
};

// Sign in anonymously with retry logic
const attemptAnonymousAuth = async (retries = 5, delay = 2000) => {
  console.log(`Firebase: Attempting anonymous authentication (${retries} retries left)...`);

  try {
    await signInAnonymously(auth);
    console.log("✅ Firebase Anonymous Auth Success");
  } catch (error: any) {
    console.error("❌ Firebase Auth Error:", error);
    console.error("Error details:", error.code, error.message);

    if (retries > 0) {
      console.log(`Retrying in ${delay}ms...`);
      setTimeout(() => attemptAnonymousAuth(retries - 1, delay), delay);
    } else {
      console.error("🔴 CRITICAL: Anonymous Auth failed after all retries. Please check:");
      console.error("1. Firebase Console > Authentication > Sign-in method > Anonymous is ENABLED");
      console.error("2. Network connectivity");
      console.error("3. Firebase project configuration");
    }
  }
};

attemptAnonymousAuth();

export const subscribeToAnnouncements = (cb: (d: Announcement[]) => void) =>
  onSnapshot(collection(db, "announcements"), s => {
    console.log(`[Firestore] Announcements: ${s.docs.length} found.`);
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as Announcement)));
  }, (error) => {
    console.error("[Firestore] Error in announcements sub:", error);
    lastFirestoreError = error;
  });

export const subscribeToUnits = (cb: (d: EvangelismUnit[]) => void) =>
  onSnapshot(collection(db, "units"), { includeMetadataChanges: true }, s => {
    if (s.empty) {
      console.warn("[Firestore] No Units found in database.");
    } else {
      console.log(`[Firestore] Units: ${s.docs.length} found. Source: ${s.metadata.fromCache ? 'Cache' : 'Server'}`);
    }
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as EvangelismUnit)));
  }, (error) => {
    console.error("[Firestore] Error in units sub:", error);
    lastFirestoreError = error;
  });

export const subscribeToCommittees = (cb: (d: Committee[]) => void) =>
  onSnapshot(collection(db, "committees"), { includeMetadataChanges: true }, s => {
    if (s.empty) {
      console.warn("[Firestore] No Committees found in database.");
    } else {
      console.log(`[Firestore] Committees: ${s.docs.length} found. Source: ${s.metadata.fromCache ? 'Cache' : 'Server'}`);
    }
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as Committee)));
  }, (error) => {
    console.error("[Firestore] Error in committees sub:", error);
    lastFirestoreError = error;
  });

export const subscribeToAttendance = (cb: (d: AttendanceSession[]) => void) =>
  onSnapshot(collection(db, "attendance"), { includeMetadataChanges: true }, s => {
    console.log(`[Firestore] Attendance: ${s.docs.length} sessions found. Source: ${s.metadata.fromCache ? 'Cache' : 'Server'}`);
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as AttendanceSession)));
  }, (error) => {
    console.error("[Firestore] Error in attendance sub:", error);
    lastFirestoreError = error;
  });

export const subscribeToDocuments = (cb: (d: UnitFile[]) => void) =>
  onSnapshot(collection(db, "documents"), { includeMetadataChanges: true }, s => {
    console.log(`[Firestore] Documents: ${s.docs.length} found. Source: ${s.metadata.fromCache ? 'Cache' : 'Server'}`);
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as UnitFile)));
  });

export const saveDocumentToDB = async (file: UnitFile) => {
  try {
    await setDoc(doc(db, "documents", file.id), file);
    console.log("Document saved to DB:", file.id);
  } catch (e) {
    console.error("Error saving document:", e);
    throw e;
  }
};

export const deleteDocumentFromDB = async (id: string) => {
  try {
    await deleteDoc(doc(db, "documents", id));
    console.log("Document deleted from DB:", id);
  } catch (e) {
    console.error("Error deleting document:", e);
    throw e;
  }
};

// Initial state helpers (return empty since subscription will fill)
export const getInitialAnnouncements = () => [] as Announcement[];
export const getInitialUnits = () => [] as EvangelismUnit[];
export const getInitialCommittees = () => [] as Committee[];
export const getInitialAttendance = () => [] as AttendanceSession[];
export const getInitialDocuments = () => [] as UnitFile[];

export const checkAndSeedIfEmpty = async () => {
  try {
    const unitsSnap = await getDocs(collection(db, "units"));
    const commsSnap = await getDocs(collection(db, "committees"));

    let seeded = false;

    // ONLY seed if unit is completely missing from DB - never overwrite existing user data
    for (const u of INITIAL_UNITS) {
      const isMissing = !unitsSnap.docs.some(d => d.id === u.id);
      if (isMissing) {
        console.log(`Firebase: Unit ${u.name} is missing. Creating from defaults...`);
        await setDoc(doc(db, "units", u.id), u);
        seeded = true;
      }
    }

    // Check and repair Committees (only if missing)
    for (const c of INITIAL_COMMITTEES) {
      if (!commsSnap.docs.some(d => d.id === c.id)) {
        await setDoc(doc(db, "committees", c.id), c);
        seeded = true;
      }
    }

    if (seeded) {
      console.log("Firebase: Initial seeding completed for missing units.");
    }
  } catch (e) {
    console.error("Firebase Deep-Seeding Error:", e);
  }
};

export const forceRepairAllUnits = async () => {
  try {
    console.log("Firebase: ⚠️ STARTING SAFE UNIT RESTORATION (missing units only)...");

    // Get current state from DB
    const unitsSnap = await getDocs(collection(db, "units"));
    const existingIds = new Set(unitsSnap.docs.map(d => d.id));

    const writePromises = INITIAL_UNITS.map(async (u) => {
      // ONLY restore if the unit document is completely absent from Firestore
      // This preserves ALL user modifications (member additions, deletions, edits)
      if (!existingIds.has(u.id)) {
        console.log(`Firebase: Unit ${u.name} (${u.id}) is absent. Creating from defaults...`);
        await setDoc(doc(db, "units", u.id), u);
        return u.name;
      } else {
        console.log(`Firebase: SKIPPING ${u.name} — already exists in DB. User data preserved.`);
        return null;
      }
    });

    const results = await Promise.all(writePromises);
    const restoredCount = results.filter(r => r !== null).length;

    if (restoredCount > 0) {
      console.log(`Firebase: ✅ ${restoredCount} missing units were restored.`);
    } else {
      console.log(`Firebase: ✅ All units present. No restoration needed.`);
    }
  } catch (e) {
    console.error("Firebase Force Repair Error:", e);
    throw e;
  }
};

export const initializeData = async () => {
  console.log("Firebase: Initializing smart synchronization...");
  try {
    // Wait a bit for auth to initialize if needed
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("Firebase: Waiting for anonymous auth before seeding...");
      await signInAnonymously(auth);
    }

    await checkAndSeedIfEmpty();
    await forceRepairAllUnits();
    console.log("✅ Firebase: All mission units are operational.");
  } catch (e) {
    console.error("Firebase Initialization Failure:", e);
  }
};

export const addAnnouncementToDB = async (a: Announcement) => {
  try {
    await setDoc(doc(db, "announcements", a.id), a);
    console.log("Announcement saved to DB:", a.id);
  } catch (e) {
    console.error("Error adding announcement:", e);
    throw e;
  }
};

export const deleteAnnouncementFromDB = async (id: string) => {
  try {
    await deleteDoc(doc(db, "announcements", id));
    console.log("Announcement deleted from DB:", id);
  } catch (e) {
    console.error("Error deleting announcement:", e);
    throw e;
  }
};

export const updateUnitInDB = async (u: EvangelismUnit) => {
  try {
    console.log(`Updating Unit in DB: ${u.id}...`);
    const { id, ...data } = u; // Don't try to update the ID field
    await updateDoc(doc(db, "units", u.id), data as any);
    console.log(`Unit ${u.id} successfully saved to DB.`);
  } catch (e) {
    console.error(`Error updating unit ${u.id}:`, e);
    throw e;
  }
};

export const updateCommitteeInDB = async (c: Committee) => {
  try {
    console.log(`Updating Committee in DB: ${c.id}...`);
    const { id, ...data } = c; // Don't try to update the ID field
    await updateDoc(doc(db, "committees", c.id), data as any);
    console.log(`Committee ${c.id} successfully saved to DB.`);
  } catch (e) {
    console.error(`Error updating committee ${c.id}:`, e);
    throw e;
  }
};

export const saveAttendanceToDB = async (s: AttendanceSession) => {
  try {
    await setDoc(doc(db, "attendance", s.id), s);
    console.log("Attendance saved to DB:", s.id);
  } catch (e) {
    console.error("Error saving attendance:", e);
    throw e;
  }
};

export const deleteAttendanceFromDB = async (id: string) => {
  try {
    await deleteDoc(doc(db, "attendance", id));
    console.log("Attendance session deleted from DB:", id);
  } catch (e) {
    console.error("Error deleting attendance session:", e);
    throw e;
  }
};

export const addMemberToGroup = async (member: UnitMember, groupId: string, type: 'UNIT' | 'COMMITTEE') => {
  try {
    const colName = type === 'UNIT' ? "units" : "committees";
    const groupRef = doc(db, colName, groupId);

    // Use updateDoc with arrayUnion for an ATOMIC update.
    // This prevents overwriting the entire members array with a potentially stale local state.
    await updateDoc(groupRef, {
      members: arrayUnion(member)
    });

    console.log(`Member ${member.name} added atomically to ${groupId}`);
  } catch (e) {
    console.error("Error adding member to group:", e);
    throw e;
  }
};

export const seedDatabase = async () => {
  try {
    const unitsSnap = await getDocs(collection(db, "units"));
    const commsSnap = await getDocs(collection(db, "committees"));

    if (!unitsSnap.empty || !commsSnap.empty) {
      const confirmed = confirm("⚠️ ATTENTION : La base de données contient déjà des informations. L'initialisation risque de créer des doublons ou d'altérer vos données. Continuer quand même ?");
      if (!confirmed) return;
    } else {
      if (!confirm("Voulez-vous initialiser les Unités et Comités par défaut ?")) return;
    }

    console.log("Seeding database...");
    for (const u of INITIAL_UNITS) await setDoc(doc(db, "units", u.id), u);
    for (const c of INITIAL_COMMITTEES) await setDoc(doc(db, "committees", c.id), c);

    // Explicit repair for last units
    await forceRepairAllUnits();

    alert("✅ Données initialisées avec succès !");
  } catch (e) {
    console.error("Firebase Seeding Error:", e);
    alert("❌ Erreur lors de l'initialisation des données : " + (e as any).message);
  }
};

export const importMembersFromCSV = async (file: File) => {
  const text = await file.text();
  const rows = text.split('\n').slice(1);

  const groupsCache: Record<string, EvangelismUnit | Committee> = {};

  const unitsSnapshot = await getDocs(collection(db, "units"));
  const committeesSnapshot = await getDocs(collection(db, "committees"));

  unitsSnapshot.forEach(d => groupsCache[d.data().name.toUpperCase()] = { ...d.data(), id: d.id } as EvangelismUnit);
  committeesSnapshot.forEach(d => groupsCache[d.data().name.toUpperCase()] = { ...d.data(), id: d.id } as Committee);

  let importedCount = 0;

  for (const row of rows) {
    const cols = row.split(';').map(s => s.replace(/^"|"$/g, '').trim());
    if (cols.length < 2) continue;

    const [name, groupName, type, phone, location, profession] = cols;
    if (!name || !groupName) continue;

    const targetKey = groupName.toUpperCase();
    let targetGroup = groupsCache[targetKey];

    let normalizedGroupName = targetKey.replace('UNITÉ ', '').replace('COMITÉ ', '').trim();

    if (!targetGroup) {
      targetGroup = groupsCache[normalizedGroupName];
    }

    if (targetGroup) {
      const newMember = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        phone: phone || '',
        location: location || '',
        profession: profession || ''
      };
      targetGroup.members.push(newMember);
      groupsCache[normalizedGroupName] = targetGroup;
      importedCount++;
    }
  }

  for (const key in groupsCache) {
    const g = groupsCache[key];
    const isUnit = INITIAL_UNITS.some(u => u.id === g.id);

    if (isUnit) {
      await updateUnitInDB(g as EvangelismUnit);
    } else {
      await updateCommitteeInDB(g as Committee);
    }
  }

  return importedCount;
};

export const subscribeToChat = (cb: (m: ChatMessage[]) => void, currentUserId?: string) => {
  console.log(`[Firestore] Subscribing to Chat. CurrentUserId: ${currentUserId || 'None'}`);
  return onSnapshot(query(collection(db, "chat"), orderBy("timestamp", "asc")), s => {
    console.log(`[Firestore] Chat Snapshot: ${s.docs.length} total messages in collection.`);
    const allMessages = s.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage));
    // Filter: Public messages OR (Private and I am the sender) OR (Private and I am the recipient)
    const filtered = allMessages.filter(m =>
      !m.recipientId ||
      m.recipientId === 'ALL' ||
      m.sender === currentUserId ||
      m.recipientId === currentUserId
    );
    console.log(`[Firestore] Chat Filtered: ${filtered.length} messages visible for ${currentUserId || 'Public'}`);
    cb(filtered);
  }, (error) => {
    console.error("[Firestore] Error in chat sub:", error);
    lastFirestoreError = error;
  });
};

export const deleteMessageFromDB = async (id: string) => {
  try {
    // We do a "soft delete" by updating the 'deleted' flag, or a hard delete.
    // Let's go with hard delete for now to keep it simple, or update 'deleted' to true.
    await updateDoc(doc(db, "chat", id), { deleted: true });
  } catch (e) {
    console.error("Error deleting message:", e);
    throw e;
  }
};

export const sendMessageToDB = async (msg: ChatMessage) => {
  try {
    await setDoc(doc(db, "chat", msg.id), msg);
  } catch (e) {
    console.error("Error sending message:", e);
    throw e;
  }
};

export const subscribeToRegistrations = (cb: (d: CampaignRegistration[]) => void) =>
  onSnapshot(collection(db, "campaign_registrations"), s => {
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as CampaignRegistration)));
  });

export const saveRegistrationToDB = async (r: CampaignRegistration) => {
  try {
    await setDoc(doc(db, "campaign_registrations", r.id), r);
    console.log("Registration saved to DB:", r.id);
  } catch (e) {
    console.error("Error saving registration:", e);
    throw e;
  }
};

export const deleteRegistrationFromDB = async (id: string) => {
  try {
    await deleteDoc(doc(db, "campaign_registrations", id));
    console.log("Registration deleted from DB:", id);
  } catch (e) {
    console.error("Error deleting registration:", e);
    throw e;
  }
};

export const subscribeToCampaignComite = (cb: (d: CampaignComiteMember[]) => void) =>
  onSnapshot(collection(db, "campaign_comite"), s => {
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as CampaignComiteMember)));
  });

export const saveCampaignComiteMemberToDB = async (m: CampaignComiteMember) => {
  try {
    await setDoc(doc(db, "campaign_comite", m.id), m);
    console.log("Comite Member saved to DB:", m.id);
  } catch (e) {
    console.error("Error saving comite member:", e);
    throw e;
  }
};

export const subscribeToCampaignGroups = (cb: (d: CampaignGroup[]) => void) =>
  onSnapshot(collection(db, "campaign_groups"), s => {
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as CampaignGroup)));
  });

export const saveCampaignGroupToDB = async (group: CampaignGroup) => {
  try {
    await setDoc(doc(db, "campaign_groups", group.id), group);
  } catch (e) {
    console.error("Error saving campaign group:", e);
    throw e;
  }
};

export const subscribeToCampaignDonations = (cb: (d: CampaignDonation[]) => void) =>
  onSnapshot(collection(db, "campaign_donations"), s => {
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as CampaignDonation)));
  });

export const saveCampaignDonationToDB = async (d: CampaignDonation) => {
  try {
    await setDoc(doc(db, "campaign_donations", d.id), d);
    console.log("Donation saved to DB:", d.id);
  } catch (e) {
    console.error("Error saving donation:", e);
    throw e;
  }
};

export const deleteCampaignContribution = async (id: string) => {
  try {
    await deleteDoc(doc(db, "campaign_contributions", id));
  } catch (e) {
    console.error("Error deleting contribution:", e);
    throw e;
  }
};

export const deleteCampaignDonation = async (id: string) => {
  try {
    await deleteDoc(doc(db, "campaign_donations", id));
  } catch (e) {
    console.error("Error deleting donation:", e);
    throw e;
  }
};

export const subscribeToCampaignContributions = (cb: (d: CampaignContribution[]) => void) =>
  onSnapshot(collection(db, "campaign_contributions"), s => {
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as CampaignContribution)));
  });

export const saveCampaignContributionToDB = async (c: CampaignContribution) => {
  try {
    await setDoc(doc(db, "campaign_contributions", c.id), c);
    console.log("Contribution saved to DB:", c.id);
  } catch (e) {
    console.error("Error saving contribution:", e);
    throw e;
  }
};

export const subscribeToCampaignExpenses = (cb: (d: CampaignExpense[]) => void) =>
  onSnapshot(collection(db, "campaign_expenses"), s => {
    cb(s.docs.map(d => ({ ...d.data(), id: d.id } as CampaignExpense)));
  });

export const saveCampaignExpenseToDB = async (e: CampaignExpense) => {
  try {
    await setDoc(doc(db, "campaign_expenses", e.id), e);
    console.log("Expense saved to DB:", e.id);
  } catch (err) {
    console.error("Error saving expense:", err);
    throw err;
  }
};

export const deleteCampaignExpense = async (id: string) => {
  try {
    await deleteDoc(doc(db, "campaign_expenses", id));
  } catch (e) {
    console.error("Error deleting expense:", e);
    throw e;
  }
};