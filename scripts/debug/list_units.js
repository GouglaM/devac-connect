import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDZzC2Ccj13GbtQM8wD61smUOnXI7Tgv8o",
    authDomain: "devac-208a5.firebaseapp.com",
    projectId: "devac-208a5",
    storageBucket: "devac-208a5.firebasestorage.app",
    messagingSenderId: "506243912104",
    appId: "1:506243912104:web:ee4f27c33576b4d6b8cd9d"
};

import { getAuth, signInAnonymously } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function listUnits() {
    await signInAnonymously(auth);
    const snapshot = await getDocs(collection(db, "units"));
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id} | Name: ${data.name} | Members: ${(data.members || []).length}`);
    });
}

listUnits().catch(console.error);
