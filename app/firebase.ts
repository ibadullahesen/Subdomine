"use client"

import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Firebase konfiqurasiyası
const firebaseConfig = {
  apiKey: "AIzaSyA-S0YXpHTqpDQtaOBFdS19DKyX02Lip9A",
  authDomain: "ustasan-mmc.firebaseapp.com",
  projectId: "ustasan-mmc",
  storageBucket: "ustasan-mmc.firebasestorage.app",
  messagingSenderId: "577498196584",
  appId: "1:577498196584:web:d629620b15a12919b2a9dd",
  measurementId: "G-8781MX8YPY",
}

// Firebase app-ı initialize et
let app
let auth
let db

if (typeof window !== "undefined") {
  try {
    // Client-side-da Firebase-i initialize et
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)

    console.log("Firebase initialized successfully")
  } catch (error) {
    console.error("Firebase initialization error:", error)
    app = null
    auth = null
    db = null
  }
} else {
  // Server-side-da null
  app = null
  auth = null
  db = null
}

export { auth, db }
