import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
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

async function mergeAndDelete() {
    try {
        console.log("Starting script...");
        await signInAnonymously(auth);
        console.log("Signed in anonymously.");

        const elieRef = doc(db, "units", "ELIE");
        const u1Ref = doc(db, "units", "u1");

        console.log("Fetching documents...");
        const [elieSnap, u1Snap] = await Promise.all([getDoc(elieRef), getDoc(u1Ref)]);

        if (!elieSnap.exists()) {
            console.log("Error: Unit 'ELIE' not found.");
            return;
        }

        const elieData = elieSnap.data();
        const u1Data = u1Snap.exists() ? u1Snap.data() : { name: "Unité Élie", members: [], mission: "Évangélisation et intercession" };

        console.log(`Merging ${elieData.members.length} members from 'ELIE' into 'u1'...`);

        // Copy members exactly as they are in the source
        const mergedMembers = [...elieData.members];

        console.log("Writing merged document to 'u1'...");
        await setDoc(u1Ref, {
            ...u1Data,
            members: mergedMembers,
            name: "Unité Élie"
        });

        console.log("Successfully updated 'u1'.");

        console.log("Deleting 'ELIE'...");
        await deleteDoc(elieRef);
        console.log("Deletion successful.");
        process.exit(0);
    } catch (err) {
        console.error("CRITICAL ERROR:", err);
        process.exit(1);
    }
}

mergeAndDelete();
