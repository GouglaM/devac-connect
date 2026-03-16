
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const fs = require("fs");
const path = require("path");

function getEnv() {
    const content = fs.readFileSync(path.join(__dirname, ".env"), "utf-8");
    const lines = content.split("\n");
    const env = {};
    lines.forEach(line => {
        const match = line.match(/^VITE_([^=]+)=(.+)$/);
        if (match) {
            env[match[1]] = match[2].trim();
        }
    });
    return env;
}

const env = getEnv();

const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID
};

console.log("Checking Project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    try {
        const snap = await getDocs(collection(db, "units"));
        console.log(`Success! Found ${snap.docs.length} units.`);
        snap.docs.forEach(d => console.log("- ", d.data().name));
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

check();
