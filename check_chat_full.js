
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, orderBy } = require("firebase/firestore");

const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
    console.log("--- FIREBASE CHAT DUMP ---");
    console.log("Project ID:", config.projectId);
    try {
        const q = query(collection(db, "chat"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        console.log(`TOTAL MESSAGES IN 'chat': ${snap.docs.length}`);
        snap.docs.forEach(d => {
            const m = d.data();
            const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : 'No timestamp';
            console.log(`[${time}] From: ${m.sender} (${m.senderName}) | To: ${m.recipientId} | Text: ${m.text || '[Audio/Sticker]'}`);
        });
    } catch (e) {
        console.error("FAILED TO FETCH:", e);
    }
}

check();
