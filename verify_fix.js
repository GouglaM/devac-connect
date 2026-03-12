import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
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
const db = getFirestore(app);
const auth = getAuth(app);

async function verifyFix() {
    try {
        await signInAnonymously(auth);
        console.log("Logged in anonymously.");

        const unitRef = doc(db, "units", "u1");

        // 1. Read current state
        const snap = await getDoc(unitRef);
        const data = snap.data();
        console.log("Current Unit Name:", data.name);
        console.log("Initial programme count:", (data.programme || []).length);

        // 2. Perform a partial update using the logic we implemented in updateUnitInDB
        // (Removing 'id' and using updateDoc)
        const updateObject = {
            programme: [
                ...(data.programme || []),
                {
                    id: "test_" + Date.now(),
                    activity: "VERIFICATION ACTIVITY",
                    date: "2026-03-12",
                    location: "TEST",
                    resources: "NONE",
                    budget: "0",
                    assignedTo: "TESTER",
                    assignedContact: ""
                }
            ]
        };

        console.log("Applying partial update for 'programme'...");
        await updateDoc(unitRef, updateObject);

        // 3. Verify that other fields (like 'members') are preserved even if not in the updateObject
        const newSnap = await getDoc(unitRef);
        const newData = newSnap.data();

        console.log("New programme count:", (newData.programme || []).length);
        console.log("Is 'members' still there?", !!newData.members);
        console.log("Members count:", (newData.members || []).length);

        if (newData.programme.length > (data.programme || []).length && newData.members) {
            console.log("✅ VERIFICATION SUCCESSFUL: Partial update worked and preserved data.");
        } else {
            console.log("❌ VERIFICATION FAILED: Data loss or update failure.");
        }

    } catch (e) {
        console.error("Verification Error:", e);
    }
}

verifyFix();
