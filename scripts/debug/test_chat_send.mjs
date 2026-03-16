
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

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

async function testSend() {
    const msgId = "test_" + Date.now();
    const msg = {
        id: msgId,
        sender: "m1",
        senderName: "MARCELLIN (TEST AGENT)",
        recipientId: "m15",
        text: "HELLO YAPI ! MESSAGE DE TEST DEPUIS LE SERVEUR",
        type: "text",
        timestamp: Date.now()
    };

    console.log("Attempting to send test message from m1 to m15...");
    try {
        await setDoc(doc(db, "chat", msgId), msg);
        console.log("✅ TEST MESSAGE SENT SUCCESSFULLY!");
    } catch (e) {
        console.error("❌ FAILED TO SEND TEST MESSAGE:", e);
    }
}

testSend();
