
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function dumpAllMessages() {
    console.log("Dumping ALL chat messages...");
    const snap = await getDocs(collection(db, "chat"));
    console.log(`Found ${snap.docs.length} messages total.`);
    snap.docs.forEach(d => {
        const data = d.data();
        console.log(`- ID: ${d.id}, From: ${data.sender} (${data.senderName}), To: ${data.recipientId}, Text: ${data.text}, Time: ${new Date(data.timestamp).toLocaleString()}`);
    });
}

dumpAllMessages();
