import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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
        const unitsSnap = await getDocs(collection(db, "units"));

        const allMemberIds = new Set();
        const duplicates = [];

        unitsSnap.forEach(doc => {
            const unit = doc.data();
            console.log(`\nUnit: ${unit.name} (${doc.id})`);
            console.log(`Members count: ${unit.members?.length || 0}`);

            (unit.members || []).forEach(m => {
                if (!m.id) {
                    console.log(`  [WARNING] Member without ID: ${m.name}`);
                } else if (allMemberIds.has(m.id)) {
                    duplicates.push({ id: m.id, name: m.name, unit: unit.name });
                } else {
                    allMemberIds.add(m.id);
                }
            });
        });

        if (duplicates.length > 0) {
            console.log("\n[CRITICAL] Duplicated Member IDs found:");
            duplicates.forEach(d => console.log(`  ID: ${d.id} | Name: ${d.name} | Unit: ${d.unit}`));
        } else {
            console.log("\n[OK] No duplicated member IDs found.");
        }

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

main();
