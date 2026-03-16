import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

// Replace with your Firebase config if needed, or I'll assume you have a way to run this in your environment
const firebaseConfig = {
    // Your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removePierre() {
    const unitRef = doc(db, 'units', 'u2');
    const unitDoc = await getDoc(unitRef);

    if (unitDoc.exists()) {
        const data = unitDoc.data();
        const members = data.members || [];
        const newMembers = members.filter(m => m.name !== 'ASSIE PIERRE');
        const newOffice = (data.office || []).filter(o => o.name !== 'ASSIE PIERRE');

        await updateDoc(unitRef, { members: newMembers, office: newOffice, assistantName: '' });
        console.log("Successfully removed ASSIE PIERRE from Unité Pierre.");
    }
}

removePierre();
