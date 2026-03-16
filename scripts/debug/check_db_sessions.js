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
        console.log("Connecting to Firebase...");
        await signInAnonymously(auth);
        console.log("Authenticated.");
        const attendanceRef = collection(db, "attendance");
        const snap = await getDocs(attendanceRef);
        console.log(`Total sessions in DB: ${snap.size}`);
        snap.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | Title: ${data.title} | Group: ${data.groupId}`);
        });
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

main();
