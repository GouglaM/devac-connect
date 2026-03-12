import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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
    try {
        await signInAnonymously(auth);
        // ID for Unité Élie is likely 'elie' based on constants.ts (I should check)
        const unitRef = doc(db, "units", "u1");
        const snap = await getDoc(unitRef);
        if (snap.exists()) {
            const data = snap.data();
            console.log("Unit Data:", JSON.stringify({
                name: data.name,
                programmeCount: data.programme?.length || 0,
                programme: data.programme || []
            }, null, 2));
        } else {
            console.log("Unit 'elie' not found.");
        }
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

main();
