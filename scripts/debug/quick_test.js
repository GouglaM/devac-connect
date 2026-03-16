
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, limit } = require("firebase/firestore");
const fs = require("fs");
const path = require("path");

function getEnv() {
    const content = fs.readFileSync(path.join(__dirname, ".env"), "utf-8");
    const env = {};
    content.split("\n").forEach(line => {
        const parts = line.split("=");
        if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
    });
    return env;
}

const env = getEnv();
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    console.log("Testing Project:", firebaseConfig.projectId);
    try {
        const q = query(collection(db, "units"), limit(1));
        const snap = await getDocs(q);
        console.log("SUCCESS: Found", snap.docs.length, "units");
        process.exit(0);
    } catch (e) {
        console.error("FAILURE:", e.message);
        process.exit(1);
    }
}
run();
