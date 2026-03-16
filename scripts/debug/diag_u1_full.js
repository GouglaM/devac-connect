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

async function diag() {
    try {
        await signInAnonymously(auth);
        const snap = await getDoc(doc(db, "units", "u1"));
        if (snap.exists()) {
            const data = snap.data();
            console.log("--- START DIAG u1 ---");
            console.log(JSON.stringify(data, null, 2));
            console.log("--- END DIAG u1 ---");
        } else {
            console.log("u1 NOT FOUND");
        }
    } catch (e) { console.error(e); }
}
diag();
