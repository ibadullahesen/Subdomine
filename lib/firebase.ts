import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyA-S0YXpHTqpDQtaOBFdS19DKyX02Lip9A",
  authDomain: "ustasan-mmc.firebaseapp.com",
  projectId: "ustasan-mmc",
  storageBucket: "ustasan-mmc.firebasestorage.app",
  messagingSenderId: "577498196584",
  appId: "1:577498196584:web:d629620b15a12919b2a9dd",
  measurementId: "G-8781MX8YPY",
}

const app = getApps()[0] ?? initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
