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
const db = getFirestore(app);
const auth = getAuth(app);

async function listAllUnits() {
    try {
        await signInAnonymously(auth);
        const querySnapshot = await getDocs(collection(db, "units"));
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | Name: ${data.name} | Programme length: ${data.programme ? data.programme.length : 'N/A'}`);
        });
    } catch (e) {
        console.error(e);
    }
}

listAllUnits();
