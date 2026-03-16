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
const db = getFirestore(app);
const auth = getAuth(app);

async function checkData() {
    try {
        await signInAnonymously(auth);
        console.log("Logged in.");

        const unitRef = doc(db, "units", "u1");
        const snap = await getDoc(unitRef);

        if (snap.exists()) {
            const data = snap.data();
            console.log("UNIT DATA FOUND:");
            console.log("ID:", snap.id);
            console.log("Name:", data.name);
            console.log("Programme field exists:", !!data.programme);
            if (data.programme) {
                console.log("Programme count:", data.programme.length);
                console.log("First item:", JSON.stringify(data.programme[0], null, 2));
            }
            console.log("Legacy 'program' field exists:", !!data.program);
        } else {
            console.log("UNIT NOT FOUND IN DB.");
        }

    } catch (e) {
        console.error("Check Error:", e);
    }
}

checkData();
