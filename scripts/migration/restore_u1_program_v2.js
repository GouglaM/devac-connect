import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
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

const programmeElie = [
    {
        id: "prog_1",
        date: "2026-03-14",
        activity: "AGAPE & FORMATION",
        location: "COUPLE DEDI",
        resources: "RAFRAICHISSEMENT",
        budget: "100000",
        assignedTo: "Mme TOURE Marie-Laure / Marcellin GOUGLA / Mme KRA Ange Joëlle / Mme DAGO Léa",
        assignedContact: ""
    },
    {
        id: "prog_2",
        date: "2026-04-04",
        activity: "CORPS A CORPS",
        location: "PETITE OURS",
        resources: "RAFRAICHISSEMENT",
        budget: "10000",
        assignedTo: "GOUGLA Marcellin & OULOU Marie-Michelle",
        assignedContact: ""
    },
    {
        id: "prog_3",
        date: "2026-04-25",
        activity: "CORPS A CORPS",
        location: "GRANDE OURS",
        resources: "RAFRAICHISSEMENT",
        budget: "10000",
        assignedTo: "KOUAME JEAN YVES & GNAGO Fédine",
        assignedContact: ""
    },
    {
        id: "prog_4",
        date: "2026-05-16",
        activity: "EVANGELISATION PAR LE SPORT/MARACANA",
        location: "SOGEFIA",
        resources: "RAFRAICHISSEMENT + SONORISATION",
        budget: "200000",
        assignedTo: "TAH Bi Tchan Michaël & Mme KRA Ange Joëlle & ASSOUMAN Michel",
        assignedContact: ""
    },
    {
        id: "prog_5",
        date: "2026-06-13",
        activity: "SUIVI DES AMES",
        location: "CHATEAU",
        resources: "RAFRAICHISSEMENT SANDWICH",
        budget: "30000",
        assignedTo: "EDI Faustin & Mme TOURE Marie-Laure",
        assignedContact: ""
    },
    {
        id: "prog_6",
        date: "2026-07-11",
        activity: "CORPS-A-CORPS",
        location: "CIE",
        resources: "RAFRAICHISSEMENT",
        budget: "10000",
        assignedTo: "SANOUSSI MOUSSA & GOUGLA Marcellin",
        assignedContact: ""
    },
    {
        id: "prog_7",
        date: "2026-09-19",
        activity: "SUIVI DES AMES",
        location: "CHATEAU",
        resources: "RAFRAICHISSEMENT",
        budget: "30000",
        assignedTo: "EDI Faustin & Mme TOURE Marie-Laure",
        assignedContact: ""
    },
    {
        id: "prog_8",
        date: "2026-10-10",
        activity: "EVANGELISATION PAR LE SPORT",
        location: "GRANDE & OURS",
        resources: "RAFRAICHISSEMENT",
        budget: "200000",
        assignedTo: "TAH Bi Tchan Michaël & Mme DAGO Léa & ASSOUMAN Michel",
        assignedContact: ""
    },
    {
        id: "prog_9",
        date: "TOUTE L'ANNEE",
        activity: "CAS SOCIAUX ET ACTIONS SOCIALES INTERNES",
        location: "INTERNES",
        resources: "",
        budget: "70000",
        assignedTo: "Mme TCHIMOU Béatrice, Mme KRA Ange Joëlle",
        assignedContact: ""
    }
];

async function restore() {
    try {
        await signInAnonymously(auth);
        console.log("Authenticated.");
        const unitRef = doc(db, "units", "u1");
        await updateDoc(unitRef, { programme: programmeElie });
        console.log("✅ Programme for Unité Élie (u1) restored successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Restoration Error:", e);
        process.exit(1);
    }
}

restore();
