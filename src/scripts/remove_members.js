// remove_members.js
// Utility script to delete specific members (or office members) from a unit in Firestore.
// Usage (Node.js):
//   node remove_members.js <UNIT_ID> <memberId1> [memberId2] ...
// Example:
//   node remove_members.js u6 el5   // removes ASSIE PIERRE from unit ELISHAMA

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDZzC2Ccj13GbtQM8wD61smUOnXI7Tgv8o",
    authDomain: "devac-208a5.firebaseapp.com",
    projectId: "devac-208a5",
    storageBucket: "devac-208a5.firebasestorage.app",
    messagingSenderId: "506243912104",
    appId: "1:506243912104:web:ee4f27c33576b4d6b8cd9d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: node remove_members.js <UNIT_ID> <memberId1> [memberId2] ...");
        process.exit(1);
    }
    const [unitId, ...memberIds] = args;
    try {
        await signInAnonymously(auth);
        const unitRef = doc(db, "units", unitId);
        const snap = await getDoc(unitRef);
        if (!snap.exists()) {
            console.error(`Unit with id '${unitId}' not found.`);
            process.exit(1);
        }
        const unitData = snap.data();
        // Remove from members array
        const originalMembers = unitData.members || [];
        const filteredMembers = originalMembers.filter(m => !memberIds.includes(m.id));
        // Also remove from office if present
        const originalOffice = unitData.office || [];
        const filteredOffice = originalOffice.filter(o => !memberIds.includes(o.id));
        // Update the document
        await setDoc(unitRef, {
            ...unitData,
            members: filteredMembers,
            office: filteredOffice
        });
        console.log(`Removed ${memberIds.length} member(s) from unit '${unitId}'.`);
        process.exit(0);
    } catch (e) {
        console.error("Error during removal:", e);
        process.exit(1);
    }
}

main();
